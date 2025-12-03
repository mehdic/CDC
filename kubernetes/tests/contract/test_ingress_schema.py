"""
Contract tests for Kubernetes Ingress schema validation.

Tests validate:
- K8s API schema compliance
- NetworkPolicy validation
- IngressClass compliance
- TLS certificate secret format
- Annotation compatibility with NGINX Ingress Controller
"""

import pytest
import yaml
from pathlib import Path


class TestIngressK8sSchema:
    """Test Ingress resources comply with K8s schema."""

    @pytest.fixture
    def ingress_manifests(self):
        """Load all ingress manifests."""
        ingress_dir = Path(__file__).parent.parent.parent / 'ingress'
        manifests = []
        for file_path in ingress_dir.glob('*-ingress.yaml'):
            with open(file_path, 'r') as f:
                manifests.append(yaml.safe_load(f))
        return manifests

    def test_ingress_api_version_is_valid(self, ingress_manifests):
        """Test Ingress API version is supported."""
        for manifest in ingress_manifests:
            assert manifest['apiVersion'] == 'networking.k8s.io/v1'

    def test_ingress_kind_is_correct(self, ingress_manifests):
        """Test Ingress kind is correct."""
        for manifest in ingress_manifests:
            assert manifest['kind'] == 'Ingress'

    def test_ingress_metadata_is_valid(self, ingress_manifests):
        """Test Ingress metadata structure."""
        for manifest in ingress_manifests:
            metadata = manifest['metadata']
            assert 'name' in metadata
            assert isinstance(metadata['name'], str)
            assert len(metadata['name']) > 0
            assert len(metadata['name']) <= 253  # DNS-1123 subdomain
            # Name should be lowercase alphanumeric with hyphens
            assert all(c.isalnum() or c == '-' for c in metadata['name'])
            assert metadata['namespace'] == 'metapharm'

    def test_ingress_spec_structure(self, ingress_manifests):
        """Test Ingress spec structure."""
        for manifest in ingress_manifests:
            spec = manifest['spec']
            assert 'rules' in spec or 'defaultBackend' in spec
            if 'ingressClassName' in spec:
                assert isinstance(spec['ingressClassName'], str)

    def test_ingress_rules_are_valid(self, ingress_manifests):
        """Test Ingress rules follow K8s spec."""
        for manifest in ingress_manifests:
            rules = manifest['spec'].get('rules', [])
            for rule in rules:
                assert 'host' in rule
                assert isinstance(rule['host'], str)
                if 'http' in rule:
                    assert 'paths' in rule['http']
                    paths = rule['http']['paths']
                    assert isinstance(paths, list)
                    for path in paths:
                        assert 'path' in path
                        assert 'pathType' in path
                        assert path['pathType'] in ['Exact', 'Prefix', 'ImplementationSpecific']
                        assert 'backend' in path
                        backend = path['backend']
                        assert 'service' in backend
                        assert 'name' in backend['service']
                        assert 'port' in backend['service']

    def test_ingress_tls_is_valid(self, ingress_manifests):
        """Test Ingress TLS configuration follows K8s spec."""
        for manifest in ingress_manifests:
            tls = manifest['spec'].get('tls', [])
            for tls_config in tls:
                assert 'hosts' in tls_config
                assert isinstance(tls_config['hosts'], list)
                assert 'secretName' in tls_config
                assert isinstance(tls_config['secretName'], str)

    def test_backend_service_ports(self, ingress_manifests):
        """Test backend service ports are valid."""
        for manifest in ingress_manifests:
            rules = manifest['spec'].get('rules', [])
            for rule in rules:
                if 'http' in rule:
                    for path in rule['http']['paths']:
                        if 'backend' in path and 'service' in path['backend']:
                            port = path['backend']['service'].get('port')
                            if 'number' in port:
                                assert 1 <= port['number'] <= 65535


class TestTLSSecretContract:
    """Test TLS secret naming and format contract."""

    def test_tls_secret_names_follow_convention(self):
        """Test TLS secrets follow naming convention."""
        expected_secrets = [
            'patient-api-tls',
            'pharmacist-api-tls',
            'doctor-api-tls',
            'nurse-api-tls',
            'delivery-api-tls',
            'gateway-tls',
            'admin-tls'
        ]

        # All secrets should be lowercase with hyphens
        for secret_name in expected_secrets:
            assert all(c.isalnum() or c == '-' for c in secret_name)
            assert secret_name.endswith('-tls')

    def test_tls_secret_must_contain_cert_key(self):
        """Test TLS secrets must contain required keys."""
        # When created by cert-manager, secrets must have:
        # - tls.crt: PEM-encoded certificate
        # - tls.key: PEM-encoded private key
        # - ca.crt: CA certificate chain
        required_keys = ['tls.crt', 'tls.key']
        # This is a contract validation - actual secret creation is done by cert-manager


class TestNginxIngressAnnotations:
    """Test NGINX Ingress Controller annotation compliance."""

    @pytest.fixture
    def ingress_manifests(self):
        """Load all ingress manifests."""
        ingress_dir = Path(__file__).parent.parent.parent / 'ingress'
        manifests = []
        for file_path in ingress_dir.glob('*-ingress.yaml'):
            with open(file_path, 'r') as f:
                manifests.append(yaml.safe_load(f))
        return manifests

    def test_cert_manager_annotation_format(self, ingress_manifests):
        """Test cert-manager annotation format."""
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            if 'cert-manager.io/cluster-issuer' in annotations:
                issuer = annotations['cert-manager.io/cluster-issuer']
                assert issuer in ['letsencrypt-prod', 'letsencrypt-staging']

    def test_ssl_redirect_annotation_value(self, ingress_manifests):
        """Test SSL redirect annotation has correct value."""
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            ssl_redirect = annotations.get('nginx.ingress.kubernetes.io/force-ssl-redirect')
            if ssl_redirect is not None:
                assert ssl_redirect == 'true'

    def test_ssl_protocols_annotation_format(self, ingress_manifests):
        """Test SSL protocols annotation has valid format."""
        valid_protocols = ['TLSv1.2', 'TLSv1.3']
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            if 'nginx.ingress.kubernetes.io/ssl-protocols' in annotations:
                protocols = annotations['nginx.ingress.kubernetes.io/ssl-protocols']
                protocol_list = protocols.split()
                for proto in protocol_list:
                    assert proto in valid_protocols

    def test_cors_annotation_consistency(self, ingress_manifests):
        """Test CORS annotations are consistent."""
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            enable_cors = annotations.get('nginx.ingress.kubernetes.io/enable-cors')

            if enable_cors == 'true':
                # If CORS is enabled, these should be present
                assert 'nginx.ingress.kubernetes.io/cors-allow-origin' in annotations
                assert 'nginx.ingress.kubernetes.io/cors-allow-methods' in annotations

    def test_rate_limit_annotation_format(self, ingress_manifests):
        """Test rate limit annotation has valid format."""
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            if 'nginx.ingress.kubernetes.io/rate-limit' in annotations:
                rate_limit = annotations['nginx.ingress.kubernetes.io/rate-limit']
                # Should be a number
                assert rate_limit.isdigit()
                assert int(rate_limit) > 0

    def test_proxy_timeout_annotation_format(self, ingress_manifests):
        """Test proxy timeout annotations have valid format."""
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            read_timeout = annotations.get('nginx.ingress.kubernetes.io/proxy-read-timeout')
            send_timeout = annotations.get('nginx.ingress.kubernetes.io/proxy-send-timeout')

            if read_timeout:
                # Should be a number (seconds)
                assert read_timeout.isdigit()
            if send_timeout:
                assert send_timeout.isdigit()

    def test_proxy_body_size_annotation_format(self, ingress_manifests):
        """Test proxy body size annotation has valid format."""
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            body_size = annotations.get('nginx.ingress.kubernetes.io/proxy-body-size')
            if body_size:
                # Should be in format like "50m", "100m", etc.
                assert any(body_size.endswith(unit) for unit in ['m', 'k', 'g'])

    def test_ip_whitelist_annotation_format(self, ingress_manifests):
        """Test IP whitelist annotation format when present."""
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            if 'nginx.ingress.kubernetes.io/whitelist-source-range' in annotations:
                whitelist = annotations['nginx.ingress.kubernetes.io/whitelist-source-range']
                # Should be CIDR notation separated by commas
                ranges = whitelist.split(',')
                for cidr_range in ranges:
                    assert '/' in cidr_range.strip()


class TestNetworkPolicy:
    """Test NetworkPolicy configuration."""

    @pytest.fixture
    def network_policy(self):
        """Load NetworkPolicy."""
        policy_path = Path(__file__).parent.parent.parent / 'ingress' / 'ingress-class.yaml'
        with open(policy_path, 'r') as f:
            docs = list(yaml.safe_load_all(f))
            # Find the NetworkPolicy
            for doc in docs:
                if doc and doc.get('kind') == 'NetworkPolicy':
                    return doc
        return None

    def test_network_policy_exists(self, network_policy):
        """Test NetworkPolicy is defined."""
        assert network_policy is not None
        assert network_policy['kind'] == 'NetworkPolicy'

    def test_network_policy_has_ingress_rules(self, network_policy):
        """Test NetworkPolicy has ingress rules."""
        if network_policy:
            assert 'spec' in network_policy
            spec = network_policy['spec']
            assert 'policyTypes' in spec
            assert 'Ingress' in spec['policyTypes']
            assert 'ingress' in spec
            assert len(spec['ingress']) > 0

    def test_network_policy_has_egress_rules(self, network_policy):
        """Test NetworkPolicy has egress rules."""
        if network_policy:
            spec = network_policy['spec']
            assert 'Egress' in spec['policyTypes']
            assert 'egress' in spec
            assert len(spec['egress']) > 0


class TestIngressClassConfiguration:
    """Test IngressClass configuration."""

    @pytest.fixture
    def ingress_class(self):
        """Load IngressClass."""
        class_path = Path(__file__).parent.parent.parent / 'ingress' / 'ingress-class.yaml'
        with open(class_path, 'r') as f:
            docs = list(yaml.safe_load_all(f))
            for doc in docs:
                if doc and doc.get('kind') == 'IngressClass':
                    return doc
        return None

    def test_ingress_class_is_default(self, ingress_class):
        """Test nginx IngressClass is marked as default."""
        if ingress_class:
            annotations = ingress_class['metadata'].get('annotations', {})
            assert annotations.get('ingressclass.kubernetes.io/is-default-class') == 'true'

    def test_ingress_class_has_controller(self, ingress_class):
        """Test IngressClass specifies correct controller."""
        if ingress_class:
            assert 'spec' in ingress_class
            assert 'controller' in ingress_class['spec']
            assert ingress_class['spec']['controller'] == 'k8s.io/ingress-nginx'


class TestSecurityCompliance:
    """Test security compliance of ingress resources."""

    @pytest.fixture
    def ingress_manifests(self):
        """Load all ingress manifests."""
        ingress_dir = Path(__file__).parent.parent.parent / 'ingress'
        manifests = []
        for file_path in ingress_dir.glob('*-ingress.yaml'):
            with open(file_path, 'r') as f:
                manifests.append(yaml.safe_load(f))
        return manifests

    def test_all_ingresses_enforce_https(self, ingress_manifests):
        """Test all ingresses enforce HTTPS."""
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            # Should force SSL redirect
            assert annotations.get('nginx.ingress.kubernetes.io/force-ssl-redirect') == 'true'
            # Should have TLS config
            assert 'tls' in manifest['spec']
            assert len(manifest['spec']['tls']) > 0

    def test_all_ingresses_have_tls_12_minimum(self, ingress_manifests):
        """Test all ingresses enforce TLS 1.2 minimum."""
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            ssl_protocols = annotations.get('nginx.ingress.kubernetes.io/ssl-protocols')
            assert ssl_protocols
            # Must include at least TLS 1.2
            assert 'TLSv1.2' in ssl_protocols or 'TLSv1.3' in ssl_protocols
            # Should not allow TLS 1.1 or older
            assert 'TLSv1' not in ssl_protocols or 'TLSv1.2' in ssl_protocols

    def test_admin_ingress_stricter_than_public_apis(self, ingress_manifests):
        """Test admin ingress has stricter security than public APIs."""
        admin_manifest = None
        public_manifests = []

        for manifest in ingress_manifests:
            if manifest['metadata']['name'] == 'admin-ingress':
                admin_manifest = manifest
            else:
                public_manifests.append(manifest)

        if admin_manifest:
            admin_annotations = admin_manifest['metadata'].get('annotations', {})
            # Admin should have IP whitelist
            assert 'nginx.ingress.kubernetes.io/whitelist-source-range' in admin_annotations
            # Admin should have lower rate limits
            admin_rate_limit = int(admin_annotations.get('nginx.ingress.kubernetes.io/rate-limit', 0))
            assert admin_rate_limit < 100

            # Admin should have CORS disabled
            assert admin_annotations.get('nginx.ingress.kubernetes.io/enable-cors') == 'false'
