#!/usr/bin/env python3
"""
Unit tests for Kubernetes manifest generation and validation.
"""

import os
import yaml
import pytest
from pathlib import Path

# Path to kubernetes directory
KUBERNETES_DIR = Path(__file__).parent.parent.parent
DEPLOYMENTS_DIR = KUBERNETES_DIR / "deployments"
SERVICES_DIR = KUBERNETES_DIR / "services"
CONFIGMAPS_DIR = KUBERNETES_DIR / "configmaps"
NAMESPACES_DIR = KUBERNETES_DIR / "namespaces"

# Expected services (30 application + 5 infrastructure)
EXPECTED_APP_SERVICES = [
    "adherence-service", "analytics-service", "api-gateway", "appointment-service",
    "auth-service", "calendar-service", "controlled-substance-service",
    "delivery-service", "digital-twin-service", "doctor-service",
    "drug-interaction-service", "ecommerce-service", "esante-service",
    "insurance-service", "inventory-service", "marketing-service",
    "medical-records-service", "messaging-service", "notification-service",
    "nurse-service", "order-service", "payment-service", "pharmacy-service",
    "prescription-service", "recycling-service", "refill-service",
    "teleconsultation-service", "user-service", "vip-service", "voice-service"
]

EXPECTED_INFRA_SERVICES = [
    "postgres-primary", "postgres-replica", "redis", "rabbitmq", "elasticsearch"
]

ALL_SERVICES = EXPECTED_APP_SERVICES + EXPECTED_INFRA_SERVICES


class TestNamespace:
    """Tests for namespace manifests."""

    def test_namespace_exists(self):
        """Test that namespace manifest exists."""
        namespace_file = NAMESPACES_DIR / "metapharm.yaml"
        assert namespace_file.exists(), "Namespace manifest should exist"

    def test_namespace_valid_yaml(self):
        """Test that namespace manifest is valid YAML."""
        namespace_file = NAMESPACES_DIR / "metapharm.yaml"
        with open(namespace_file, 'r') as f:
            data = yaml.safe_load(f)
        assert data is not None, "Namespace manifest should be valid YAML"

    def test_namespace_structure(self):
        """Test namespace manifest structure."""
        namespace_file = NAMESPACES_DIR / "metapharm.yaml"
        with open(namespace_file, 'r') as f:
            ns = yaml.safe_load(f)

        assert ns["apiVersion"] == "v1"
        assert ns["kind"] == "Namespace"
        assert ns["metadata"]["name"] == "metapharm"
        assert "labels" in ns["metadata"]


class TestConfigMaps:
    """Tests for ConfigMap manifests."""

    def test_common_config_exists(self):
        """Test that common-config exists."""
        config_file = CONFIGMAPS_DIR / "common-config.yaml"
        assert config_file.exists(), "common-config.yaml should exist"

    def test_common_config_structure(self):
        """Test common-config structure."""
        config_file = CONFIGMAPS_DIR / "common-config.yaml"
        with open(config_file, 'r') as f:
            cm = yaml.safe_load(f)

        assert cm["apiVersion"] == "v1"
        assert cm["kind"] == "ConfigMap"
        assert cm["metadata"]["name"] == "common-config"
        assert cm["metadata"]["namespace"] == "metapharm"
        assert "data" in cm

    def test_common_config_contains_required_keys(self):
        """Test that common-config contains required environment variables."""
        config_file = CONFIGMAPS_DIR / "common-config.yaml"
        with open(config_file, 'r') as f:
            cm = yaml.safe_load(f)

        required_keys = [
            "NODE_ENV", "LOG_LEVEL", "DB_HOST", "DB_PORT",
            "REDIS_HOST", "RABBITMQ_HOST", "JWT_EXPIRY"
        ]

        for key in required_keys:
            assert key in cm["data"], f"ConfigMap should contain {key}"


class TestDeployments:
    """Tests for deployment manifests."""

    def test_all_deployments_exist(self):
        """Test that deployment files exist for all services."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            assert deployment_file.exists(), f"Deployment for {service} should exist"

    def test_all_service_accounts_exist(self):
        """Test that service account files exist for all services."""
        for service in ALL_SERVICES:
            sa_file = DEPLOYMENTS_DIR / f"{service}-sa.yaml"
            assert sa_file.exists(), f"ServiceAccount for {service} should exist"

    def test_deployment_valid_yaml(self):
        """Test that all deployment manifests are valid YAML."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                data = yaml.safe_load(f)
            assert data is not None, f"Deployment for {service} should be valid YAML"

    def test_deployment_structure(self):
        """Test deployment manifest structure."""
        # Test with auth-service as example
        deployment_file = DEPLOYMENTS_DIR / "auth-service.yaml"
        with open(deployment_file, 'r') as f:
            deploy = yaml.safe_load(f)

        # Basic structure
        assert deploy["apiVersion"] == "apps/v1"
        assert deploy["kind"] == "Deployment"
        assert deploy["metadata"]["namespace"] == "metapharm"

        # Spec
        assert "replicas" in deploy["spec"]
        assert "selector" in deploy["spec"]
        assert "template" in deploy["spec"]

        # Template
        assert "metadata" in deploy["spec"]["template"]
        assert "spec" in deploy["spec"]["template"]

        # Container
        containers = deploy["spec"]["template"]["spec"]["containers"]
        assert len(containers) >= 1
        assert "name" in containers[0]
        assert "image" in containers[0]
        assert "ports" in containers[0]

    def test_deployment_has_resource_limits(self):
        """Test that all deployments have resource limits."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            container = deploy["spec"]["template"]["spec"]["containers"][0]
            assert "resources" in container, f"{service} should have resources"
            assert "requests" in container["resources"], f"{service} should have resource requests"
            assert "limits" in container["resources"], f"{service} should have resource limits"

            # Check CPU and memory
            assert "cpu" in container["resources"]["requests"]
            assert "memory" in container["resources"]["requests"]
            assert "cpu" in container["resources"]["limits"]
            assert "memory" in container["resources"]["limits"]

    def test_deployment_has_health_checks(self):
        """Test that application deployments have health checks."""
        # Test application services only (infrastructure may not have HTTP health checks)
        for service in EXPECTED_APP_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            container = deploy["spec"]["template"]["spec"]["containers"][0]
            assert "livenessProbe" in container, f"{service} should have livenessProbe"
            assert "readinessProbe" in container, f"{service} should have readinessProbe"

            # Check probe structure
            liveness = container["livenessProbe"]
            readiness = container["readinessProbe"]

            assert "httpGet" in liveness, f"{service} liveness should use httpGet"
            assert liveness["httpGet"]["path"] == "/health"
            assert liveness["httpGet"]["port"] == "http"

            assert "httpGet" in readiness, f"{service} readiness should use httpGet"
            assert readiness["httpGet"]["path"] == "/health"
            assert readiness["httpGet"]["port"] == "http"

    def test_deployment_has_security_context(self):
        """Test that all deployments have security contexts."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            # Pod-level security context
            pod_spec = deploy["spec"]["template"]["spec"]
            assert "securityContext" in pod_spec, f"{service} should have pod securityContext"
            assert pod_spec["securityContext"]["runAsNonRoot"] == True
            assert pod_spec["securityContext"]["runAsUser"] == 1000

            # Container-level security context
            container = pod_spec["containers"][0]
            assert "securityContext" in container, f"{service} container should have securityContext"
            assert container["securityContext"]["allowPrivilegeEscalation"] == False
            assert container["securityContext"]["runAsNonRoot"] == True
            assert "capabilities" in container["securityContext"]
            assert "drop" in container["securityContext"]["capabilities"]
            assert "ALL" in container["securityContext"]["capabilities"]["drop"]

    def test_deployment_uses_service_account(self):
        """Test that all deployments use service accounts."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            pod_spec = deploy["spec"]["template"]["spec"]
            assert "serviceAccountName" in pod_spec, f"{service} should specify serviceAccountName"
            assert pod_spec["serviceAccountName"] == f"{service}-sa"

    def test_deployment_has_rolling_update_strategy(self):
        """Test that deployments use rolling update strategy."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            strategy = deploy["spec"]["strategy"]
            assert strategy["type"] == "RollingUpdate"
            assert "rollingUpdate" in strategy
            assert strategy["rollingUpdate"]["maxSurge"] == 1
            assert strategy["rollingUpdate"]["maxUnavailable"] == 0

    def test_deployment_has_labels(self):
        """Test that deployments have proper labels."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            metadata = deploy["metadata"]
            assert "labels" in metadata
            assert metadata["labels"]["app"] == service
            assert "tier" in metadata["labels"]
            assert metadata["labels"]["tier"] in ["high", "medium", "low"]
            assert metadata["labels"]["version"] == "v1"

    def test_high_availability_services_have_anti_affinity(self):
        """Test that HA services (replicas > 1) have anti-affinity rules."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            replicas = deploy["spec"]["replicas"]
            pod_spec = deploy["spec"]["template"]["spec"]

            if replicas > 1:
                assert "affinity" in pod_spec, f"{service} with {replicas} replicas should have affinity rules"
                assert "podAntiAffinity" in pod_spec["affinity"]


class TestServices:
    """Tests for service manifests."""

    def test_all_services_exist(self):
        """Test that service files exist for all services."""
        for service in ALL_SERVICES:
            service_file = SERVICES_DIR / f"{service}-svc.yaml"
            assert service_file.exists(), f"Service for {service} should exist"

    def test_service_valid_yaml(self):
        """Test that all service manifests are valid YAML."""
        for service in ALL_SERVICES:
            service_file = SERVICES_DIR / f"{service}-svc.yaml"
            with open(service_file, 'r') as f:
                data = yaml.safe_load(f)
            assert data is not None, f"Service for {service} should be valid YAML"

    def test_service_structure(self):
        """Test service manifest structure."""
        # Test with auth-service as example
        service_file = SERVICES_DIR / "auth-service-svc.yaml"
        with open(service_file, 'r') as f:
            svc = yaml.safe_load(f)

        # Basic structure
        assert svc["apiVersion"] == "v1"
        assert svc["kind"] == "Service"
        assert svc["metadata"]["namespace"] == "metapharm"
        assert svc["metadata"]["name"] == "auth-service-svc"

        # Spec
        assert "selector" in svc["spec"]
        assert "ports" in svc["spec"]
        assert len(svc["spec"]["ports"]) >= 1

        # Port configuration
        port = svc["spec"]["ports"][0]
        assert "name" in port
        assert "protocol" in port
        assert "port" in port
        assert "targetPort" in port

    def test_service_has_correct_type(self):
        """Test that services have correct type (ClusterIP or LoadBalancer)."""
        # API Gateway should be LoadBalancer
        api_gateway_file = SERVICES_DIR / "api-gateway-svc.yaml"
        with open(api_gateway_file, 'r') as f:
            svc = yaml.safe_load(f)
        assert svc["spec"]["type"] == "LoadBalancer", "API Gateway should be LoadBalancer"

        # Other services should be ClusterIP
        for service in [s for s in ALL_SERVICES if s != "api-gateway"]:
            service_file = SERVICES_DIR / f"{service}-svc.yaml"
            with open(service_file, 'r') as f:
                svc = yaml.safe_load(f)
            assert svc["spec"]["type"] == "ClusterIP", f"{service} should be ClusterIP"

    def test_service_has_session_affinity(self):
        """Test that services have session affinity configured."""
        for service in ALL_SERVICES:
            service_file = SERVICES_DIR / f"{service}-svc.yaml"
            with open(service_file, 'r') as f:
                svc = yaml.safe_load(f)

            assert "sessionAffinity" in svc["spec"]
            assert svc["spec"]["sessionAffinity"] == "ClientIP"
            assert "sessionAffinityConfig" in svc["spec"]

    def test_service_selector_matches_deployment(self):
        """Test that service selectors match deployment labels."""
        for service in ALL_SERVICES:
            service_file = SERVICES_DIR / f"{service}-svc.yaml"
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"

            with open(service_file, 'r') as f:
                svc = yaml.safe_load(f)
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            svc_selector = svc["spec"]["selector"]
            deploy_labels = deploy["spec"]["template"]["metadata"]["labels"]

            assert svc_selector["app"] == deploy_labels["app"], \
                f"Service selector should match deployment labels for {service}"


class TestServiceAccounts:
    """Tests for service account manifests."""

    def test_service_account_structure(self):
        """Test service account manifest structure."""
        # Test with auth-service as example
        sa_file = DEPLOYMENTS_DIR / "auth-service-sa.yaml"
        with open(sa_file, 'r') as f:
            sa = yaml.safe_load(f)

        assert sa["apiVersion"] == "v1"
        assert sa["kind"] == "ServiceAccount"
        assert sa["metadata"]["namespace"] == "metapharm"
        assert sa["metadata"]["name"] == "auth-service-sa"
        assert "labels" in sa["metadata"]


class TestManifestGeneration:
    """Tests for manifest generation script."""

    def test_generator_script_exists(self):
        """Test that generator script exists."""
        generator = KUBERNETES_DIR / "generate_manifests.py"
        assert generator.exists(), "Generator script should exist"

    def test_generator_script_is_executable(self):
        """Test that generator script is executable or has shebang."""
        generator = KUBERNETES_DIR / "generate_manifests.py"
        with open(generator, 'r') as f:
            first_line = f.readline()
        assert first_line.startswith("#!/usr/bin/env python3"), \
            "Generator should have Python shebang"

    def test_all_35_services_generated(self):
        """Test that exactly 35 services have manifests."""
        deployments = [f.stem for f in DEPLOYMENTS_DIR.glob("*.yaml") if not f.stem.endswith("-sa")]
        assert len(deployments) == 35, f"Should have 35 deployments, found {len(deployments)}"

        services = [f.stem for f in SERVICES_DIR.glob("*.yaml")]
        assert len(services) == 35, f"Should have 35 services, found {len(services)}"


class TestDocumentation:
    """Tests for documentation."""

    def test_readme_exists(self):
        """Test that README exists."""
        readme = KUBERNETES_DIR / "README.md"
        assert readme.exists(), "README.md should exist"

    def test_secrets_readme_exists(self):
        """Test that secrets README exists."""
        secrets_readme = KUBERNETES_DIR / "secrets" / "README.md"
        assert secrets_readme.exists(), "secrets/README.md should exist"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
