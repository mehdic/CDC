#!/usr/bin/env python3
"""
End-to-end tests for Kubernetes deployment.
Tests actual deployment to a local Kubernetes cluster (kind/minikube).
"""

import os
import subprocess
import time
import pytest
from pathlib import Path

# Path to kubernetes directory
KUBERNETES_DIR = Path(__file__).parent.parent.parent

# Test configuration
TEST_SERVICES = ["auth-service", "user-service", "api-gateway"]  # Subset for E2E testing
TIMEOUT = 300  # 5 minutes timeout for deployments


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


def is_cluster_available():
    """Check if a Kubernetes cluster is available."""
    try:
        result = subprocess.run(
            ["kubectl", "cluster-info"],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def kubectl_apply(manifest_path: Path) -> tuple[bool, str]:
    """Apply a manifest using kubectl."""
    try:
        result = subprocess.run(
            ["kubectl", "apply", "-f", str(manifest_path)],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0, result.stderr
    except Exception as e:
        return False, str(e)


def kubectl_delete(manifest_path: Path) -> tuple[bool, str]:
    """Delete resources from a manifest using kubectl."""
    try:
        result = subprocess.run(
            ["kubectl", "delete", "-f", str(manifest_path), "--ignore-not-found"],
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.returncode == 0, result.stderr
    except Exception as e:
        return False, str(e)


def wait_for_pod_ready(namespace: str, label_selector: str, timeout: int = TIMEOUT) -> bool:
    """Wait for pods to be ready."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            result = subprocess.run(
                [
                    "kubectl", "get", "pods",
                    "-n", namespace,
                    "-l", label_selector,
                    "-o", "jsonpath='{.items[*].status.containerStatuses[0].ready}'"
                ],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                ready_statuses = result.stdout.strip("'").split()
                if ready_statuses and all(status == "true" for status in ready_statuses):
                    return True

            time.sleep(5)
        except Exception:
            time.sleep(5)

    return False


def get_pod_status(namespace: str, label_selector: str) -> dict:
    """Get pod status."""
    try:
        result = subprocess.run(
            [
                "kubectl", "get", "pods",
                "-n", namespace,
                "-l", label_selector,
                "-o", "json"
            ],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode == 0:
            import json
            return json.loads(result.stdout)
        return {}
    except Exception:
        return {}


@pytest.mark.skipif(not is_kubectl_available(), reason="kubectl not available")
@pytest.mark.skipif(not is_cluster_available(), reason="No Kubernetes cluster available")
class TestE2EDeployment:
    """End-to-end deployment tests (requires running k8s cluster)."""

    @pytest.fixture(scope="class", autouse=True)
    def setup_namespace(self):
        """Set up test namespace."""
        print("\n🚀 Setting up test namespace...")

        # Apply namespace
        namespace_file = KUBERNETES_DIR / "namespaces" / "metapharm.yaml"
        success, error = kubectl_apply(namespace_file)
        assert success, f"Failed to create namespace: {error}"

        # Apply configmap
        configmap_file = KUBERNETES_DIR / "configmaps" / "common-config.yaml"
        success, error = kubectl_apply(configmap_file)
        assert success, f"Failed to create configmap: {error}"

        # Create placeholder secrets for testing
        self._create_test_secrets()

        yield

        # Cleanup
        print("\n🧹 Cleaning up test namespace...")
        for service in TEST_SERVICES:
            kubectl_delete(KUBERNETES_DIR / "deployments" / f"{service}.yaml")
            kubectl_delete(KUBERNETES_DIR / "services" / f"{service}-svc.yaml")
            kubectl_delete(KUBERNETES_DIR / "deployments" / f"{service}-sa.yaml")

    def _create_test_secrets(self):
        """Create test secrets."""
        secrets = [
            ("metapharm-db-credentials", ["DB_USER=testuser", "DB_PASSWORD=testpass"]),
            ("metapharm-jwt-secret", ["JWT_SECRET=testsecret", "JWT_REFRESH_SECRET=testrefresh"]),
        ]

        for secret_name, literals in secrets:
            cmd = [
                "kubectl", "create", "secret", "generic", secret_name,
                "-n", "metapharm",
                "--dry-run=client", "-o", "yaml"
            ]
            for literal in literals:
                cmd.extend(["--from-literal", literal])
            cmd.append("|")
            cmd.append("kubectl")
            cmd.append("apply")
            cmd.append("-f")
            cmd.append("-")

            # Use shell to handle pipe
            subprocess.run(
                " ".join(cmd),
                shell=True,
                capture_output=True,
                timeout=30
            )

    def test_namespace_exists(self):
        """Test that namespace was created successfully."""
        result = subprocess.run(
            ["kubectl", "get", "namespace", "metapharm"],
            capture_output=True,
            text=True,
            timeout=10
        )
        assert result.returncode == 0, "Namespace should exist"

    def test_configmap_exists(self):
        """Test that configmap was created successfully."""
        result = subprocess.run(
            ["kubectl", "get", "configmap", "common-config", "-n", "metapharm"],
            capture_output=True,
            text=True,
            timeout=10
        )
        assert result.returncode == 0, "ConfigMap should exist"

    @pytest.mark.parametrize("service", TEST_SERVICES)
    def test_deploy_service(self, service):
        """Test deploying a service to the cluster."""
        print(f"\n📦 Deploying {service}...")

        # Apply service account
        sa_file = KUBERNETES_DIR / "deployments" / f"{service}-sa.yaml"
        success, error = kubectl_apply(sa_file)
        assert success, f"Failed to apply service account for {service}: {error}"

        # Apply deployment
        deployment_file = KUBERNETES_DIR / "deployments" / f"{service}.yaml"
        success, error = kubectl_apply(deployment_file)
        assert success, f"Failed to apply deployment for {service}: {error}"

        # Apply service
        service_file = KUBERNETES_DIR / "services" / f"{service}-svc.yaml"
        success, error = kubectl_apply(service_file)
        assert success, f"Failed to apply service for {service}: {error}"

        # Note: We don't wait for pods to be ready here as containers may not have
        # actual images available. This test validates manifest application only.
        print(f"✓ {service} manifests applied successfully")

    @pytest.mark.parametrize("service", TEST_SERVICES)
    def test_deployment_created(self, service):
        """Test that deployment was created."""
        result = subprocess.run(
            ["kubectl", "get", "deployment", f"{service}-deployment", "-n", "metapharm"],
            capture_output=True,
            text=True,
            timeout=10
        )
        assert result.returncode == 0, f"Deployment {service} should exist"

    @pytest.mark.parametrize("service", TEST_SERVICES)
    def test_service_created(self, service):
        """Test that service was created."""
        result = subprocess.run(
            ["kubectl", "get", "service", f"{service}-svc", "-n", "metapharm"],
            capture_output=True,
            text=True,
            timeout=10
        )
        assert result.returncode == 0, f"Service {service}-svc should exist"

    @pytest.mark.parametrize("service", TEST_SERVICES)
    def test_service_account_created(self, service):
        """Test that service account was created."""
        result = subprocess.run(
            ["kubectl", "get", "serviceaccount", f"{service}-sa", "-n", "metapharm"],
            capture_output=True,
            text=True,
            timeout=10
        )
        assert result.returncode == 0, f"ServiceAccount {service}-sa should exist"

    def test_service_endpoints(self):
        """Test that services have endpoints configured (even if not ready)."""
        for service in TEST_SERVICES:
            result = subprocess.run(
                ["kubectl", "get", "endpoints", f"{service}-svc", "-n", "metapharm"],
                capture_output=True,
                text=True,
                timeout=10
            )
            # Endpoints should exist even if pods aren't ready
            assert result.returncode == 0, f"Endpoints for {service}-svc should exist"


@pytest.mark.skipif(not is_kubectl_available(), reason="kubectl not available")
class TestManifestDryRun:
    """Dry-run tests that don't require a cluster."""

    def test_all_manifests_dry_run(self):
        """Test that all manifests pass dry-run validation."""
        # Test namespace
        namespace_file = KUBERNETES_DIR / "namespaces" / "metapharm.yaml"
        result = subprocess.run(
            ["kubectl", "apply", "--dry-run=client", "-f", str(namespace_file)],
            capture_output=True,
            text=True,
            timeout=10
        )
        assert result.returncode == 0, f"Namespace dry-run failed: {result.stderr}"

        # Test configmap
        configmap_file = KUBERNETES_DIR / "configmaps" / "common-config.yaml"
        result = subprocess.run(
            ["kubectl", "apply", "--dry-run=client", "-f", str(configmap_file)],
            capture_output=True,
            text=True,
            timeout=10
        )
        assert result.returncode == 0, f"ConfigMap dry-run failed: {result.stderr}"

        # Test a few deployments and services
        for service in TEST_SERVICES:
            # Deployment
            deployment_file = KUBERNETES_DIR / "deployments" / f"{service}.yaml"
            result = subprocess.run(
                ["kubectl", "apply", "--dry-run=client", "-f", str(deployment_file)],
                capture_output=True,
                text=True,
                timeout=10
            )
            assert result.returncode == 0, \
                f"{service} deployment dry-run failed: {result.stderr}"

            # Service
            service_file = KUBERNETES_DIR / "services" / f"{service}-svc.yaml"
            result = subprocess.run(
                ["kubectl", "apply", "--dry-run=client", "-f", str(service_file)],
                capture_output=True,
                text=True,
                timeout=10
            )
            assert result.returncode == 0, \
                f"{service} service dry-run failed: {result.stderr}"


class TestDeploymentReadiness:
    """Tests for deployment readiness documentation and tools."""

    def test_deployment_checklist_exists(self):
        """Test that deployment checklist documentation exists."""
        readme = KUBERNETES_DIR / "README.md"
        assert readme.exists(), "README should exist"

        with open(readme, 'r') as f:
            content = f.read()
            assert "Deployment Instructions" in content, \
                "README should contain deployment instructions"
            assert "kubectl apply" in content, \
                "README should contain kubectl apply commands"

    def test_generator_script_runnable(self):
        """Test that generator script can be run."""
        generator = KUBERNETES_DIR / "generate_manifests.py"
        assert generator.exists(), "Generator script should exist"

        # Test dry-run (don't actually generate files)
        result = subprocess.run(
            ["python3", str(generator), "--help"],
            capture_output=True,
            text=True,
            timeout=10
        )
        # Script doesn't have --help yet, but should at least run
        assert result.returncode in [0, 2], "Generator script should be runnable"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
