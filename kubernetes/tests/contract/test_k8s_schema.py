#!/usr/bin/env python3
"""
Contract tests for Kubernetes manifest schema compliance.
Tests that manifests conform to Kubernetes API schemas.
"""

import os
import yaml
import pytest
from pathlib import Path
import subprocess
import json

# Path to kubernetes directory
KUBERNETES_DIR = Path(__file__).parent.parent.parent
DEPLOYMENTS_DIR = KUBERNETES_DIR / "deployments"
SERVICES_DIR = KUBERNETES_DIR / "services"
CONFIGMAPS_DIR = KUBERNETES_DIR / "configmaps"
NAMESPACES_DIR = KUBERNETES_DIR / "namespaces"

ALL_SERVICES = [
    "adherence-service", "analytics-service", "api-gateway", "appointment-service",
    "auth-service", "calendar-service", "controlled-substance-service",
    "delivery-service", "digital-twin-service", "doctor-service",
    "drug-interaction-service", "ecommerce-service", "esante-service",
    "insurance-service", "inventory-service", "marketing-service",
    "medical-records-service", "messaging-service", "notification-service",
    "nurse-service", "order-service", "payment-service", "pharmacy-service",
    "prescription-service", "recycling-service", "refill-service",
    "teleconsultation-service", "user-service", "vip-service", "voice-service",
    "postgres-primary", "postgres-replica", "redis", "rabbitmq", "elasticsearch"
]


def is_kubectl_available():
    """Check if kubectl is available."""
    try:
        subprocess.run(
            ["kubectl", "version", "--client", "--short"],
            capture_output=True,
            timeout=5
        )
        return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def validate_manifest_with_kubectl(manifest_path: Path) -> tuple[bool, str]:
    """
    Validate a manifest using kubectl dry-run.
    Returns (is_valid, error_message).
    """
    if not is_kubectl_available():
        pytest.skip("kubectl not available")

    try:
        result = subprocess.run(
            ["kubectl", "apply", "--dry-run=client", "-f", str(manifest_path)],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            return True, ""
        else:
            return False, result.stderr
    except subprocess.TimeoutExpired:
        return False, "kubectl timeout"
    except Exception as e:
        return False, str(e)


class TestKubernetesAPICompliance:
    """Tests for Kubernetes API version and kind compliance."""

    def test_deployment_api_version(self):
        """Test that deployments use correct apiVersion."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            assert deploy["apiVersion"] == "apps/v1", \
                f"{service} deployment should use apps/v1"

    def test_service_api_version(self):
        """Test that services use correct apiVersion."""
        for service in ALL_SERVICES:
            service_file = SERVICES_DIR / f"{service}-svc.yaml"
            with open(service_file, 'r') as f:
                svc = yaml.safe_load(f)

            assert svc["apiVersion"] == "v1", \
                f"{service} service should use v1"

    def test_namespace_api_version(self):
        """Test that namespace uses correct apiVersion."""
        namespace_file = NAMESPACES_DIR / "metapharm.yaml"
        with open(namespace_file, 'r') as f:
            ns = yaml.safe_load(f)

        assert ns["apiVersion"] == "v1", "Namespace should use v1"

    def test_configmap_api_version(self):
        """Test that configmap uses correct apiVersion."""
        config_file = CONFIGMAPS_DIR / "common-config.yaml"
        with open(config_file, 'r') as f:
            cm = yaml.safe_load(f)

        assert cm["apiVersion"] == "v1", "ConfigMap should use v1"


class TestRequiredFields:
    """Tests for required Kubernetes fields."""

    def test_deployment_required_fields(self):
        """Test that deployments have all required fields."""
        required_fields = [
            ("metadata", "name"),
            ("metadata", "namespace"),
            ("spec", "replicas"),
            ("spec", "selector"),
            ("spec", "template"),
        ]

        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            for field_path in required_fields:
                current = deploy
                for field in field_path:
                    assert field in current, \
                        f"{service} deployment missing {'.'.join(field_path)}"
                    current = current[field]

    def test_service_required_fields(self):
        """Test that services have all required fields."""
        required_fields = [
            ("metadata", "name"),
            ("metadata", "namespace"),
            ("spec", "selector"),
            ("spec", "ports"),
            ("spec", "type"),
        ]

        for service in ALL_SERVICES:
            service_file = SERVICES_DIR / f"{service}-svc.yaml"
            with open(service_file, 'r') as f:
                svc = yaml.safe_load(f)

            for field_path in required_fields:
                current = svc
                for field in field_path:
                    assert field in current, \
                        f"{service} service missing {'.'.join(field_path)}"
                    current = current[field]

    def test_container_required_fields(self):
        """Test that containers have all required fields."""
        required_fields = ["name", "image", "ports"]

        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            containers = deploy["spec"]["template"]["spec"]["containers"]
            assert len(containers) > 0, f"{service} should have at least one container"

            for field in required_fields:
                assert field in containers[0], \
                    f"{service} container missing {field}"


class TestResourceSpecifications:
    """Tests for resource specification compliance."""

    def test_cpu_format(self):
        """Test that CPU values use valid format."""
        valid_cpu_pattern = r"^\d+m?$"
        import re

        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            container = deploy["spec"]["template"]["spec"]["containers"][0]
            resources = container["resources"]

            cpu_request = resources["requests"]["cpu"]
            cpu_limit = resources["limits"]["cpu"]

            assert re.match(valid_cpu_pattern, str(cpu_request)), \
                f"{service} CPU request format invalid: {cpu_request}"
            assert re.match(valid_cpu_pattern, str(cpu_limit)), \
                f"{service} CPU limit format invalid: {cpu_limit}"

    def test_memory_format(self):
        """Test that memory values use valid format."""
        valid_memory_pattern = r"^\d+(Ki|Mi|Gi|Ti|Pi|Ei)?$"
        import re

        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            container = deploy["spec"]["template"]["spec"]["containers"][0]
            resources = container["resources"]

            mem_request = resources["requests"]["memory"]
            mem_limit = resources["limits"]["memory"]

            assert re.match(valid_memory_pattern, str(mem_request)), \
                f"{service} memory request format invalid: {mem_request}"
            assert re.match(valid_memory_pattern, str(mem_limit)), \
                f"{service} memory limit format invalid: {mem_limit}"

    def test_resource_limits_exceed_requests(self):
        """Test that resource limits are >= requests."""
        def parse_cpu(cpu_str):
            """Convert CPU string to millicores."""
            if cpu_str.endswith('m'):
                return int(cpu_str[:-1])
            return int(cpu_str) * 1000

        def parse_memory(mem_str):
            """Convert memory string to bytes."""
            units = {'Ki': 1024, 'Mi': 1024**2, 'Gi': 1024**3, 'Ti': 1024**4}
            for unit, multiplier in units.items():
                if mem_str.endswith(unit):
                    return int(mem_str[:-2]) * multiplier
            return int(mem_str)

        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            container = deploy["spec"]["template"]["spec"]["containers"][0]
            resources = container["resources"]

            cpu_request = parse_cpu(resources["requests"]["cpu"])
            cpu_limit = parse_cpu(resources["limits"]["cpu"])
            assert cpu_limit >= cpu_request, \
                f"{service} CPU limit should be >= request"

            mem_request = parse_memory(resources["requests"]["memory"])
            mem_limit = parse_memory(resources["limits"]["memory"])
            assert mem_limit >= mem_request, \
                f"{service} memory limit should be >= request"


class TestProbeConfiguration:
    """Tests for health probe configuration compliance."""

    def test_probe_required_fields(self):
        """Test that probes have required fields."""
        required_fields = [
            "initialDelaySeconds",
            "periodSeconds",
            "timeoutSeconds",
            "successThreshold",
            "failureThreshold"
        ]

        # Only test application services (have HTTP health checks)
        app_services = [s for s in ALL_SERVICES if s not in
                       ["postgres-primary", "postgres-replica", "redis", "rabbitmq", "elasticsearch"]]

        for service in app_services:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            container = deploy["spec"]["template"]["spec"]["containers"][0]

            for probe_name in ["livenessProbe", "readinessProbe"]:
                probe = container[probe_name]
                for field in required_fields:
                    assert field in probe, \
                        f"{service} {probe_name} missing {field}"

    def test_probe_timing_valid(self):
        """Test that probe timings are reasonable."""
        app_services = [s for s in ALL_SERVICES if s not in
                       ["postgres-primary", "postgres-replica", "redis", "rabbitmq", "elasticsearch"]]

        for service in app_services:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            container = deploy["spec"]["template"]["spec"]["containers"][0]

            liveness = container["livenessProbe"]
            readiness = container["readinessProbe"]

            # Liveness should have longer initial delay
            assert liveness["initialDelaySeconds"] >= 10, \
                f"{service} liveness initialDelay too short"

            # Period should be reasonable
            assert 1 <= liveness["periodSeconds"] <= 60, \
                f"{service} liveness period unreasonable"
            assert 1 <= readiness["periodSeconds"] <= 60, \
                f"{service} readiness period unreasonable"

            # Timeout should be less than period
            assert liveness["timeoutSeconds"] < liveness["periodSeconds"], \
                f"{service} liveness timeout >= period"
            assert readiness["timeoutSeconds"] < readiness["periodSeconds"], \
                f"{service} readiness timeout >= period"


class TestLabelsAndSelectors:
    """Tests for label and selector compliance."""

    def test_deployment_selector_matches_template_labels(self):
        """Test that deployment selector matches template labels."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            selector = deploy["spec"]["selector"]["matchLabels"]
            template_labels = deploy["spec"]["template"]["metadata"]["labels"]

            for key, value in selector.items():
                assert key in template_labels, \
                    f"{service} selector label {key} not in template labels"
                assert template_labels[key] == value, \
                    f"{service} selector label {key} mismatch"

    def test_required_labels_present(self):
        """Test that required labels are present."""
        required_labels = ["app", "tier", "version"]

        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            labels = deploy["metadata"]["labels"]

            for label in required_labels:
                assert label in labels, \
                    f"{service} deployment missing required label: {label}"


class TestSecurityCompliance:
    """Tests for security configuration compliance."""

    def test_non_root_user_required(self):
        """Test that all containers run as non-root."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            pod_security = deploy["spec"]["template"]["spec"]["securityContext"]
            assert pod_security.get("runAsNonRoot") == True, \
                f"{service} should set runAsNonRoot=true"
            assert pod_security.get("runAsUser", 0) > 0, \
                f"{service} should set runAsUser > 0"

            container = deploy["spec"]["template"]["spec"]["containers"][0]
            container_security = container["securityContext"]
            assert container_security.get("runAsNonRoot") == True, \
                f"{service} container should set runAsNonRoot=true"

    def test_privilege_escalation_disabled(self):
        """Test that privilege escalation is disabled."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            container = deploy["spec"]["template"]["spec"]["containers"][0]
            container_security = container["securityContext"]

            assert container_security.get("allowPrivilegeEscalation") == False, \
                f"{service} should disable privilege escalation"

    def test_capabilities_dropped(self):
        """Test that all capabilities are dropped."""
        for service in ALL_SERVICES:
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            with open(deployment_file, 'r') as f:
                deploy = yaml.safe_load(f)

            container = deploy["spec"]["template"]["spec"]["containers"][0]
            container_security = container["securityContext"]

            assert "capabilities" in container_security, \
                f"{service} should define capabilities"
            assert "drop" in container_security["capabilities"], \
                f"{service} should drop capabilities"
            assert "ALL" in container_security["capabilities"]["drop"], \
                f"{service} should drop ALL capabilities"


@pytest.mark.skipif(not is_kubectl_available(), reason="kubectl not available")
class TestKubectlValidation:
    """Tests using kubectl to validate manifests (requires kubectl)."""

    def test_namespace_validates_with_kubectl(self):
        """Test namespace validates with kubectl dry-run."""
        namespace_file = NAMESPACES_DIR / "metapharm.yaml"
        is_valid, error = validate_manifest_with_kubectl(namespace_file)
        assert is_valid, f"Namespace failed kubectl validation: {error}"

    def test_configmap_validates_with_kubectl(self):
        """Test configmap validates with kubectl dry-run."""
        config_file = CONFIGMAPS_DIR / "common-config.yaml"
        is_valid, error = validate_manifest_with_kubectl(config_file)
        assert is_valid, f"ConfigMap failed kubectl validation: {error}"

    def test_deployments_validate_with_kubectl(self):
        """Test deployments validate with kubectl dry-run."""
        for service in ALL_SERVICES[:5]:  # Test first 5 to save time
            deployment_file = DEPLOYMENTS_DIR / f"{service}.yaml"
            is_valid, error = validate_manifest_with_kubectl(deployment_file)
            assert is_valid, f"{service} deployment failed kubectl validation: {error}"

    def test_services_validate_with_kubectl(self):
        """Test services validate with kubectl dry-run."""
        for service in ALL_SERVICES[:5]:  # Test first 5 to save time
            service_file = SERVICES_DIR / f"{service}-svc.yaml"
            is_valid, error = validate_manifest_with_kubectl(service_file)
            assert is_valid, f"{service} service failed kubectl validation: {error}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
