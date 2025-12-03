"""
Unit tests for Kubernetes Ingress manifest validation.

Tests validate:
- Ingress manifest structure
- TLS configuration
- Annotation validation
- Host configuration
- Backend service references
"""

import pytest
import yaml
from pathlib import Path


class TestIngressManifests:
    """Test ingress manifest structure and configuration."""

    @pytest.fixture
    def ingress_files(self):
        """Load all ingress YAML files."""
        ingress_dir = Path(__file__).parent.parent.parent / 'ingress'
        files = {}
        for file_path in ingress_dir.glob('*-ingress.yaml'):
            with open(file_path, 'r') as f:
                files[file_path.name] = yaml.safe_load(f)
        return files

    def test_ingress_resources_exist(self, ingress_files):
        """Test that all required ingress resources exist."""
        required_ingresses = [
            'patient-api-ingress.yaml',
            'pharmacist-api-ingress.yaml',
            'doctor-api-ingress.yaml',
            'nurse-api-ingress.yaml',
            'delivery-api-ingress.yaml',
            'gateway-ingress.yaml',
            'admin-ingress.yaml'
        ]
        for ingress in required_ingresses:
            assert ingress in ingress_files, f"Missing ingress: {ingress}"

    def test_ingress_metadata_structure(self, ingress_files):
        """Test ingress metadata is properly configured."""
        for name, manifest in ingress_files.items():
            assert 'apiVersion' in manifest, f"{name}: missing apiVersion"
            assert manifest['apiVersion'] == 'networking.k8s.io/v1'
            assert 'kind' in manifest, f"{name}: missing kind"
            assert manifest['kind'] == 'Ingress'
            assert 'metadata' in manifest, f"{name}: missing metadata"
            assert 'name' in manifest['metadata'], f"{name}: missing name in metadata"
            assert 'namespace' in manifest['metadata'], f"{name}: missing namespace"
            assert manifest['metadata']['namespace'] == 'metapharm'

    def test_ingress_has_tls_configuration(self, ingress_files):
        """Test all ingress resources have TLS configuration."""
        for name, manifest in ingress_files.items():
            assert 'spec' in manifest, f"{name}: missing spec"
            assert 'tls' in manifest['spec'], f"{name}: missing TLS configuration"
            assert len(manifest['spec']['tls']) > 0, f"{name}: TLS array is empty"

            tls_config = manifest['spec']['tls'][0]
            assert 'hosts' in tls_config, f"{name}: TLS missing hosts"
            assert 'secretName' in tls_config, f"{name}: TLS missing secretName"
            assert len(tls_config['hosts']) > 0, f"{name}: TLS hosts array is empty"

    def test_tls_secret_names_valid(self, ingress_files):
        """Test TLS secret names follow naming convention."""
        for name, manifest in ingress_files.items():
            tls_config = manifest['spec']['tls'][0]
            secret_name = tls_config['secretName']
            # Secret name should end with -tls
            assert secret_name.endswith('-tls'), f"{name}: invalid secret name {secret_name}"

    def test_ingress_has_cert_manager_annotation(self, ingress_files):
        """Test cert-manager integration annotation exists."""
        for name, manifest in ingress_files.items():
            annotations = manifest['metadata'].get('annotations', {})
            assert 'cert-manager.io/cluster-issuer' in annotations, \
                f"{name}: missing cert-manager cluster-issuer annotation"
            assert annotations['cert-manager.io/cluster-issuer'] == 'letsencrypt-prod'

    def test_ingress_has_tls_enforcement(self, ingress_files):
        """Test TLS enforcement annotations are present."""
        for name, manifest in ingress_files.items():
            annotations = manifest['metadata'].get('annotations', {})
            assert 'nginx.ingress.kubernetes.io/force-ssl-redirect' in annotations, \
                f"{name}: missing force-ssl-redirect annotation"
            assert annotations['nginx.ingress.kubernetes.io/force-ssl-redirect'] == 'true'

    def test_ingress_has_ssl_protocols(self, ingress_files):
        """Test minimum TLS 1.2+ enforcement."""
        for name, manifest in ingress_files.items():
            annotations = manifest['metadata'].get('annotations', {})
            assert 'nginx.ingress.kubernetes.io/ssl-protocols' in annotations, \
                f"{name}: missing ssl-protocols annotation"
            ssl_protocols = annotations['nginx.ingress.kubernetes.io/ssl-protocols']
            # Should explicitly require TLS 1.2 or higher
            assert 'TLSv1.2' in ssl_protocols or 'TLSv1.3' in ssl_protocols

    def test_ingress_has_rules(self, ingress_files):
        """Test ingress rules are configured."""
        for name, manifest in ingress_files.items():
            assert 'rules' in manifest['spec'], f"{name}: missing rules"
            assert len(manifest['spec']['rules']) > 0, f"{name}: rules array is empty"

    def test_ingress_rules_have_valid_hosts(self, ingress_files):
        """Test ingress rules have valid host configuration."""
        valid_domains = [
            'api.metapharm.ch',
            'pharmacist-api.metapharm.ch',
            'doctor-api.metapharm.ch',
            'nurse-api.metapharm.ch',
            'delivery-api.metapharm.ch',
            'gateway.metapharm.ch',
            'admin.metapharm.ch'
        ]

        for name, manifest in ingress_files.items():
            rules = manifest['spec']['rules']
            assert len(rules) > 0, f"{name}: no rules defined"
            for rule in rules:
                assert 'host' in rule, f"{name}: rule missing host"
                assert rule['host'] in valid_domains, \
                    f"{name}: host {rule['host']} not in valid domains"

    def test_ingress_backends_reference_valid_services(self, ingress_files):
        """Test all backend services exist."""
        for name, manifest in ingress_files.items():
            rules = manifest['spec']['rules']
            for rule in rules:
                if 'http' in rule and 'paths' in rule['http']:
                    for path in rule['http']['paths']:
                        if 'backend' in path and 'service' in path['backend']:
                            service = path['backend']['service']
                            assert 'name' in service, f"{name}: backend service missing name"
                            assert 'port' in service, f"{name}: backend service missing port"
                            # All ingresses should route to api-gateway-svc
                            assert service['name'] == 'api-gateway-svc'

    def test_ingress_class_is_nginx(self, ingress_files):
        """Test ingress class is set to nginx."""
        for name, manifest in ingress_files.items():
            assert 'ingressClassName' in manifest['spec'], \
                f"{name}: missing ingressClassName"
            assert manifest['spec']['ingressClassName'] == 'nginx'

    def test_cors_configuration_when_enabled(self, ingress_files):
        """Test CORS configuration when enabled."""
        for name, manifest in ingress_files.items():
            annotations = manifest['metadata'].get('annotations', {})
            if annotations.get('nginx.ingress.kubernetes.io/enable-cors') == 'true':
                assert 'nginx.ingress.kubernetes.io/cors-allow-origin' in annotations
                assert 'nginx.ingress.kubernetes.io/cors-allow-methods' in annotations
                assert 'nginx.ingress.kubernetes.io/cors-allow-credentials' in annotations

    def test_rate_limiting_configuration(self, ingress_files):
        """Test rate limiting is configured."""
        for name, manifest in ingress_files.items():
            annotations = manifest['metadata'].get('annotations', {})
            # Rate limiting should be present for all public APIs
            if 'admin' not in name:
                assert 'nginx.ingress.kubernetes.io/rate-limit' in annotations, \
                    f"{name}: missing rate-limit configuration"
                assert 'nginx.ingress.kubernetes.io/rate-limit-window' in annotations

    def test_websocket_support(self, ingress_files):
        """Test websocket services are configured."""
        for name, manifest in ingress_files.items():
            annotations = manifest['metadata'].get('annotations', {})
            if 'websocket-services' in annotations:
                # Websocket service should be api-gateway-svc
                assert 'api-gateway-svc' in annotations['nginx.ingress.kubernetes.io/websocket-services']

    def test_proxy_timeout_configuration(self, ingress_files):
        """Test proxy timeout is configured for long-running connections."""
        for name, manifest in ingress_files.items():
            annotations = manifest['metadata'].get('annotations', {})
            assert 'nginx.ingress.kubernetes.io/proxy-read-timeout' in annotations
            assert 'nginx.ingress.kubernetes.io/proxy-send-timeout' in annotations

    def test_proxy_body_size_configuration(self, ingress_files):
        """Test proxy body size limits are set."""
        for name, manifest in ingress_files.items():
            annotations = manifest['metadata'].get('annotations', {})
            assert 'nginx.ingress.kubernetes.io/proxy-body-size' in annotations

    def test_admin_ingress_has_ip_whitelist(self, ingress_files):
        """Test admin ingress has IP whitelist restriction."""
        if 'admin-ingress.yaml' in ingress_files:
            manifest = ingress_files['admin-ingress.yaml']
            annotations = manifest['metadata'].get('annotations', {})
            assert 'nginx.ingress.kubernetes.io/whitelist-source-range' in annotations

    def test_admin_ingress_cors_disabled(self, ingress_files):
        """Test admin ingress has CORS disabled."""
        if 'admin-ingress.yaml' in ingress_files:
            manifest = ingress_files['admin-ingress.yaml']
            annotations = manifest['metadata'].get('annotations', {})
            assert annotations.get('nginx.ingress.kubernetes.io/enable-cors') == 'false'

    def test_patient_and_delivery_apis_have_different_limits(self, ingress_files):
        """Test delivery API has higher rate limits than patient API."""
        patient_manifest = ingress_files.get('patient-api-ingress.yaml')
        delivery_manifest = ingress_files.get('delivery-api-ingress.yaml')

        if patient_manifest and delivery_manifest:
            patient_rate = int(patient_manifest['metadata']['annotations'].get(
                'nginx.ingress.kubernetes.io/rate-limit', 0))
            delivery_rate = int(delivery_manifest['metadata']['annotations'].get(
                'nginx.ingress.kubernetes.io/rate-limit', 0))

            # Delivery should have higher rate limit due to GPS tracking
            assert delivery_rate > patient_rate


class TestClusterIssuer:
    """Test cert-manager ClusterIssuer configuration."""

    @pytest.fixture
    def cluster_issuer(self):
        """Load ClusterIssuer manifest."""
        issuer_path = Path(__file__).parent.parent.parent / 'ingress' / 'cluster-issuer.yaml'
        with open(issuer_path, 'r') as f:
            # Parse multiple documents
            docs = list(yaml.safe_load_all(f))
            return {doc['metadata']['name']: doc for doc in docs if doc}

    def test_cluster_issuer_exists(self, cluster_issuer):
        """Test required ClusterIssuers exist."""
        assert 'letsencrypt-prod' in cluster_issuer
        assert 'letsencrypt-staging' in cluster_issuer

    def test_cluster_issuer_acme_configuration(self, cluster_issuer):
        """Test ACME configuration is present."""
        for name, issuer in cluster_issuer.items():
            assert 'spec' in issuer
            assert 'acme' in issuer['spec']
            acme = issuer['spec']['acme']
            assert 'email' in acme
            assert 'privateKeySecretRef' in acme
            assert 'solvers' in acme

    def test_cluster_issuer_has_http01_solver(self, cluster_issuer):
        """Test HTTP-01 ACME solver is configured."""
        for name, issuer in cluster_issuer.items():
            solvers = issuer['spec']['acme']['solvers']
            http01_found = any('http01' in solver for solver in solvers)
            assert http01_found, f"{name}: missing HTTP-01 solver"

    def test_cluster_issuer_has_dns01_solver(self, cluster_issuer):
        """Test DNS-01 ACME solver is configured for wildcard support."""
        for name, issuer in cluster_issuer.items():
            solvers = issuer['spec']['acme']['solvers']
            dns01_found = any('dns01' in solver for solver in solvers)
            assert dns01_found, f"{name}: missing DNS-01 solver for wildcard certs"

    def test_letsencrypt_prod_server_url(self, cluster_issuer):
        """Test production Let's Encrypt server is configured."""
        prod_issuer = cluster_issuer['letsencrypt-prod']
        assert prod_issuer['spec']['acme']['server'] == 'https://acme-v02.api.letsencrypt.org/directory'

    def test_letsencrypt_staging_server_url(self, cluster_issuer):
        """Test staging Let's Encrypt server is configured."""
        staging_issuer = cluster_issuer['letsencrypt-staging']
        assert staging_issuer['spec']['acme']['server'] == 'https://acme-staging-v02.api.letsencrypt.org/directory'
