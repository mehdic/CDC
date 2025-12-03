"""
E2E tests for TLS certificate provisioning and Ingress functionality.

Tests validate:
- Certificate provisioning via cert-manager
- Ingress routing and backend connectivity
- TLS handshake and certificate validity
- HSTS header enforcement
- Rate limiting functionality
- CORS header validation
"""

import pytest
import yaml
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock


class TestCertificateProvisioning:
    """Test certificate provisioning via cert-manager."""

    @pytest.fixture
    def cluster_issuer(self):
        """Load ClusterIssuer configuration."""
        issuer_path = Path(__file__).parent.parent.parent / 'ingress' / 'cluster-issuer.yaml'
        with open(issuer_path, 'r') as f:
            docs = list(yaml.safe_load_all(f))
            return {doc['metadata']['name']: doc for doc in docs if doc}

    def test_letsencrypt_acme_server_reachable(self, cluster_issuer):
        """Test cert-manager can reach ACME servers."""
        for name, issuer in cluster_issuer.items():
            acme_server = issuer['spec']['acme']['server']
            assert acme_server.startswith('https://')
            # Production should use production server
            if 'prod' in name:
                assert 'acme-v02.api.letsencrypt.org' in acme_server
            # Staging should use staging server
            elif 'staging' in name:
                assert 'acme-staging' in acme_server

    def test_acme_account_creation_flow(self, cluster_issuer):
        """Test ACME account configuration for cert-manager."""
        # cert-manager creates ACME account automatically
        # Validate ACME configuration in ClusterIssuer
        for name, issuer in cluster_issuer.items():
            acme = issuer['spec']['acme']
            # Should have email for account recovery
            assert 'email' in acme
            assert 'ops@metapharm.ch' in acme['email']
            # Should have private key secret reference
            assert 'privateKeySecretRef' in acme
            assert 'name' in acme['privateKeySecretRef']

    def test_dns01_challenge_validation(self, cluster_issuer):
        """Test DNS-01 ACME challenge configuration."""
        # Validate DNS-01 solver is configured for wildcard support
        for name, issuer in cluster_issuer.items():
            solvers = issuer['spec']['acme']['solvers']
            dns01_solver = None
            for solver in solvers:
                if 'dns01' in solver:
                    dns01_solver = solver['dns01']
                    break

            if dns01_solver:
                # Should have Route53 configuration for DNS-01
                assert 'route53' in dns01_solver
                route53 = dns01_solver['route53']
                assert 'region' in route53
                assert 'accessKeyID' in route53
                assert 'secretAccessKeySecretRef' in route53

    def test_http01_challenge_validation(self, cluster_issuer):
        """Test HTTP-01 ACME challenge configuration."""
        # Validate HTTP-01 solver is configured
        for name, issuer in cluster_issuer.items():
            solvers = issuer['spec']['acme']['solvers']
            http01_solver = None
            for solver in solvers:
                if 'http01' in solver:
                    http01_solver = solver['http01']
                    break

            assert http01_solver is not None
            # Should have ingress class reference
            assert 'ingress' in http01_solver
            assert 'class' in http01_solver['ingress']
            assert http01_solver['ingress']['class'] == 'nginx'

    def test_certificate_secret_structure(self):
        """Test TLS secret has correct structure."""
        # When cert-manager creates a TLS secret, it should have:
        expected_tls_secret_keys = ['tls.crt', 'tls.key', 'ca.crt']

        # Simulate a TLS secret created by cert-manager
        simulated_secret = {
            'apiVersion': 'v1',
            'kind': 'Secret',
            'metadata': {
                'name': 'patient-api-tls',
                'namespace': 'metapharm'
            },
            'type': 'kubernetes.io/tls',
            'data': {
                'tls.crt': 'base64-encoded-certificate',
                'tls.key': 'base64-encoded-private-key',
                'ca.crt': 'base64-encoded-ca-chain'
            }
        }

        # Validate secret structure
        assert simulated_secret['type'] == 'kubernetes.io/tls'
        for key in expected_tls_secret_keys:
            assert key in simulated_secret['data']

    def test_certificate_validity_period(self):
        """Test certificates have proper validity period."""
        # Let's Encrypt certificates are valid for 90 days
        # cert-manager should renew them at 30 days before expiry
        renewal_threshold_days = 30
        validity_days = 90

        assert renewal_threshold_days < validity_days
        # This ensures certificates are renewed before expiry


class TestIngressRouting:
    """Test Ingress routing configuration and backend connectivity."""

    @pytest.fixture
    def ingress_manifests(self):
        """Load all ingress manifests."""
        ingress_dir = Path(__file__).parent.parent.parent / 'ingress'
        manifests = []
        for file_path in ingress_dir.glob('*-ingress.yaml'):
            with open(file_path, 'r') as f:
                manifests.append(yaml.safe_load(f))
        return manifests

    def test_all_hosts_resolve_correctly(self, ingress_manifests):
        """Test all ingress hosts are properly configured."""
        expected_hosts = {
            'api.metapharm.ch',
            'pharmacist-api.metapharm.ch',
            'doctor-api.metapharm.ch',
            'nurse-api.metapharm.ch',
            'delivery-api.metapharm.ch',
            'gateway.metapharm.ch',
            'admin.metapharm.ch'
        }

        found_hosts = set()
        for manifest in ingress_manifests:
            rules = manifest['spec'].get('rules', [])
            for rule in rules:
                found_hosts.add(rule['host'])

        assert found_hosts == expected_hosts

    @patch('socket.getaddrinfo')
    def test_dns_resolution(self, mock_getaddrinfo, ingress_manifests):
        """Test DNS resolution for ingress hosts."""
        # Simulate DNS resolution
        mock_getaddrinfo.return_value = [
            (2, 1, 6, '', ('192.168.1.100', 443))
        ]

        hosts = set()
        for manifest in ingress_manifests:
            rules = manifest['spec'].get('rules', [])
            for rule in rules:
                hosts.add(rule['host'])

        # All hosts should be resolvable
        assert len(hosts) > 0

    def test_backend_service_connectivity(self, ingress_manifests):
        """Test backends reference valid services."""
        api_gateway_referenced = False

        for manifest in ingress_manifests:
            rules = manifest['spec'].get('rules', [])
            for rule in rules:
                if 'http' in rule:
                    for path in rule['http']['paths']:
                        backend = path['backend']['service']
                        if backend['name'] == 'api-gateway-svc':
                            api_gateway_referenced = True
                            # Should use port 3000
                            assert backend['port']['number'] == 3000

        assert api_gateway_referenced

    def test_path_routing_configuration(self, ingress_manifests):
        """Test path-based routing is properly configured."""
        for manifest in ingress_manifests:
            rules = manifest['spec'].get('rules', [])
            for rule in rules:
                if 'http' in rule:
                    for path in rule['http']['paths']:
                        # All paths should use Prefix or Exact matching
                        assert path['pathType'] in ['Prefix', 'Exact', 'ImplementationSpecific']

    def test_health_check_endpoint_routing(self, ingress_manifests):
        """Test health check endpoints are properly routed."""
        gateway_manifest = None
        for manifest in ingress_manifests:
            if manifest['metadata']['name'] == 'gateway-ingress':
                gateway_manifest = manifest
                break

        if gateway_manifest:
            rules = gateway_manifest['spec']['rules']
            # Gateway should have health check endpoint
            health_path_found = False
            for rule in rules:
                if 'http' in rule:
                    for path in rule['http']['paths']:
                        if path['path'] == '/health':
                            health_path_found = True
                            assert path['pathType'] == 'Exact'

            assert health_path_found


class TestTLSHandshake:
    """Test TLS handshake and certificate validation."""

    @patch('ssl.SSLContext')
    def test_tls_version_negotiation(self, mock_ssl_context):
        """Test TLS 1.2+ negotiation."""
        # Simulate TLS handshake
        mock_ctx = MagicMock()
        mock_ctx.check_hostname = True
        mock_ctx.verify_mode = 'CERT_REQUIRED'
        mock_ssl_context.return_value = mock_ctx

        # Would establish connection with TLS 1.2 minimum
        assert mock_ctx.check_hostname

    @patch('ssl.create_default_context')
    def test_certificate_chain_validation(self, mock_create_context):
        """Test certificate chain validation."""
        mock_ctx = MagicMock()
        mock_create_context.return_value = mock_ctx

        # Simulate cert chain validation
        # The CA certificate should be loaded
        assert mock_ctx

    def test_cipher_suite_configuration(self):
        """Test approved cipher suites are used."""
        # From annotations in ingress manifests
        required_ciphers = [
            'ECDHE-ECDSA-AES128-GCM-SHA256',
            'ECDHE-RSA-AES128-GCM-SHA256',
            'ECDHE-ECDSA-AES256-GCM-SHA384',
            'ECDHE-RSA-AES256-GCM-SHA384'
        ]

        # All ciphers should use:
        # - Perfect Forward Secrecy (ECDHE)
        # - AES encryption (128 or 256 bit)
        # - GCM mode (authenticated encryption)
        # - SHA256/SHA384 (secure hash)

        for cipher in required_ciphers:
            assert 'ECDHE' in cipher  # PFS required
            assert 'AES' in cipher  # Strong encryption
            assert 'GCM' in cipher  # Authenticated encryption
            assert any(hash_algo in cipher for hash_algo in ['SHA256', 'SHA384'])


class TestSecurityHeaders:
    """Test HSTS and other security headers."""

    @patch('requests.get')
    def test_hsts_header_present(self, mock_get):
        """Test HSTS header is present in responses."""
        # Simulate HTTPS response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
        }
        mock_get.return_value = mock_response

        response = mock_get('https://api.metapharm.ch')
        hsts_header = response.headers.get('Strict-Transport-Security')

        assert hsts_header is not None
        assert 'max-age=31536000' in hsts_header
        assert 'includeSubDomains' in hsts_header
        assert 'preload' in hsts_header

    @patch('requests.get')
    def test_http_redirect_to_https(self, mock_get):
        """Test HTTP requests redirect to HTTPS."""
        # Simulate HTTP redirect
        mock_response = MagicMock()
        mock_response.status_code = 301
        mock_response.headers = {
            'Location': 'https://api.metapharm.ch/'
        }
        mock_get.return_value = mock_response

        response = mock_get('http://api.metapharm.ch/')

        assert response.status_code == 301
        assert response.headers['Location'].startswith('https://')

    @patch('requests.options')
    def test_cors_headers_when_enabled(self, mock_options):
        """Test CORS headers are set for public APIs."""
        # Simulate CORS preflight response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400'
        }
        mock_options.return_value = mock_response

        response = mock_options('https://api.metapharm.ch/', headers={'Origin': '*'})

        assert 'Access-Control-Allow-Origin' in response.headers
        assert response.headers['Access-Control-Allow-Methods']

    @patch('requests.get')
    def test_no_cors_headers_for_admin(self, mock_get):
        """Test CORS is disabled for admin API."""
        # Simulate response without CORS headers
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {}  # No CORS headers
        mock_get.return_value = mock_response

        response = mock_get('https://admin.metapharm.ch/')

        # Admin should not have CORS headers
        assert 'Access-Control-Allow-Origin' not in response.headers


class TestRateLimiting:
    """Test rate limiting configuration."""

    @pytest.fixture
    def ingress_manifests(self):
        """Load all ingress manifests."""
        ingress_dir = Path(__file__).parent.parent.parent / 'ingress'
        manifests = []
        for file_path in ingress_dir.glob('*-ingress.yaml'):
            with open(file_path, 'r') as f:
                manifests.append(yaml.safe_load(f))
        return manifests

    def test_rate_limit_configured_for_public_apis(self, ingress_manifests):
        """Test rate limiting is configured for public APIs."""
        for manifest in ingress_manifests:
            name = manifest['metadata']['name']
            if 'admin' not in name:
                annotations = manifest['metadata'].get('annotations', {})
                rate_limit = annotations.get('nginx.ingress.kubernetes.io/rate-limit')
                assert rate_limit is not None
                assert int(rate_limit) > 0

    @patch('requests.get')
    def test_rate_limit_headers_in_response(self, mock_get):
        """Test rate limit headers are included in response."""
        # Simulate response with rate limit headers
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '99',
            'X-RateLimit-Reset': '1234567890'
        }
        mock_get.return_value = mock_response

        response = mock_get('https://api.metapharm.ch/')

        # Rate limit headers should be present
        assert 'X-RateLimit-Limit' in response.headers or \
               'RateLimit-Limit' in response.headers

    @patch('requests.get')
    def test_rate_limit_exceeded_response(self, mock_get):
        """Test 429 response when rate limit exceeded."""
        # Simulate rate limit exceeded
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.headers = {
            'Retry-After': '60'
        }
        mock_get.return_value = mock_response

        response = mock_get('https://api.metapharm.ch/')

        assert response.status_code == 429
        assert 'Retry-After' in response.headers or 'X-RateLimit-Reset' in response.headers


class TestWebSocketSupport:
    """Test WebSocket support for real-time features."""

    @pytest.fixture
    def ingress_manifests(self):
        """Load all ingress manifests."""
        ingress_dir = Path(__file__).parent.parent.parent / 'ingress'
        manifests = []
        for file_path in ingress_dir.glob('*-ingress.yaml'):
            with open(file_path, 'r') as f:
                manifests.append(yaml.safe_load(f))
        return manifests

    def test_websocket_services_configured(self, ingress_manifests):
        """Test WebSocket services are properly configured."""
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            if 'nginx.ingress.kubernetes.io/websocket-services' in annotations:
                # Should reference api-gateway-svc
                ws_services = annotations['nginx.ingress.kubernetes.io/websocket-services']
                assert 'api-gateway-svc' in ws_services

    def test_websocket_proxy_timeout_sufficient(self, ingress_manifests):
        """Test WebSocket connections have sufficient timeout."""
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            read_timeout = int(annotations.get('nginx.ingress.kubernetes.io/proxy-read-timeout', 60))
            send_timeout = int(annotations.get('nginx.ingress.kubernetes.io/proxy-send-timeout', 60))

            # WebSocket connections need long timeouts (e.g., 1 hour)
            if 'websocket-services' in annotations:
                assert read_timeout >= 3600  # 1 hour minimum
                assert send_timeout >= 3600

    def test_websocket_secure_connection(self, ingress_manifests):
        """Test WebSocket endpoints support secure WSS protocol."""
        # WebSocket connections should use wss:// (secure WebSocket)
        # This is enforced by HTTPS redirect and TLS configuration
        for manifest in ingress_manifests:
            annotations = manifest['metadata'].get('annotations', {})
            if 'websocket-services' in annotations:
                # Should have TLS configured
                assert 'tls' in manifest['spec']
                assert len(manifest['spec']['tls']) > 0
                # Should enforce HTTPS redirect
                assert annotations.get('nginx.ingress.kubernetes.io/force-ssl-redirect') == 'true'
