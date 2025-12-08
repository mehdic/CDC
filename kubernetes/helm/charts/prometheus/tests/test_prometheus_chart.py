"""
Unit tests for Prometheus Helm Chart
Tests chart template rendering and structure validation
"""

import pytest
import yaml
from pathlib import Path
import subprocess
import json


class TestPrometheusChart:
    """Test Prometheus Helm chart validation"""

    @pytest.fixture
    def chart_path(self):
        """Get path to Prometheus chart"""
        return Path(__file__).parent.parent

    def test_chart_metadata(self, chart_path):
        """Test Chart.yaml metadata"""
        chart_file = chart_path / "Chart.yaml"
        assert chart_file.exists(), "Chart.yaml must exist"

        with open(chart_file) as f:
            chart = yaml.safe_load(f)

        # Validate required fields
        assert chart["apiVersion"] == "v2", "Must be Helm v3 chart"
        assert chart["name"] == "prometheus", "Chart name must be 'prometheus'"
        assert "description" in chart, "Chart must have description"
        assert chart["version"] == "1.0.0", "Chart version should be set"
        assert chart["appVersion"], "App version must be defined"

    def test_values_structure(self, chart_path):
        """Test values.yaml structure"""
        values_file = chart_path / "values.yaml"
        assert values_file.exists(), "values.yaml must exist"

        with open(values_file) as f:
            values = yaml.safe_load(f)

        # Validate required top-level keys
        required_keys = [
            "global", "namespace", "prometheus", "alertmanager",
            "serviceMonitors", "alertRules"
        ]
        for key in required_keys:
            assert key in values, f"values.yaml must contain '{key}' key"

        # Validate global configuration
        assert "environment" in values["global"]
        assert "namespace" in values["global"]

        # Validate Prometheus configuration
        assert values["prometheus"]["enabled"] is True
        assert values["prometheus"]["replicaCount"] > 0
        assert "persistence" in values["prometheus"]

        # Validate AlertManager configuration
        assert values["alertmanager"]["enabled"] is True
        assert "config" in values["alertmanager"]

        # Validate ServiceMonitors
        assert values["serviceMonitors"]["enabled"] is True
        assert "highTier" in values["serviceMonitors"]
        assert "mediumTier" in values["serviceMonitors"]
        assert "lowTier" in values["serviceMonitors"]

        # Validate Alert Rules
        assert values["alertRules"]["enabled"] is True

    def test_templates_exist(self, chart_path):
        """Test that all required templates exist"""
        templates_dir = chart_path / "templates"
        assert templates_dir.exists(), "templates directory must exist"

        required_templates = [
            "namespace.yaml",
            "serviceaccount.yaml",
            "_helpers.tpl",
            "prometheus-deployment.yaml",
            "prometheus-service.yaml",
            "prometheus-configmap.yaml",
            "prometheus-rules-configmap.yaml",
            "prometheus-pvc.yaml",
            "alertmanager-deployment.yaml",
            "alertmanager-service.yaml",
            "alertmanager-configmap.yaml",
            "alertmanager-pvc.yaml",
            "alertmanager-secrets.yaml",
            "rbac.yaml",
            "prometheus-hpa.yaml",
            "prometheus-pdb.yaml",
            "prometheus-ingress.yaml",
            "alertmanager-ingress.yaml"
        ]

        for template in required_templates:
            template_file = templates_dir / template
            assert template_file.exists(), f"Template {template} must exist"

    def test_environment_values_files(self, chart_path):
        """Test environment-specific values files"""
        required_envs = {
            "values-dev.yaml": "development",
            "values-staging.yaml": "staging",
            "values-prod.yaml": "production"
        }

        for filename, expected_env in required_envs.items():
            values_file = chart_path / filename
            assert values_file.exists(), f"{filename} must exist"

            with open(values_file) as f:
                values = yaml.safe_load(f)

            assert values["global"]["environment"] == expected_env, \
                f"{filename} must set environment to {expected_env}"

    def test_chart_dependencies(self, chart_path):
        """Test that chart doesn't have breaking dependencies"""
        # Chart should work with vanilla Prometheus, no external CRDs required
        # (ServiceMonitor is optional)
        chart_file = chart_path / "Chart.yaml"
        with open(chart_file) as f:
            chart = yaml.safe_load(f)

        # Should be compatible with Kubernetes 1.24+
        assert chart["kubeVersion"] == ">=1.24.0"

    def test_prometheus_config_template(self, chart_path):
        """Test Prometheus config template structure"""
        config_template = chart_path / "templates" / "prometheus-configmap.yaml"
        with open(config_template) as f:
            content = f.read()

        # Verify template contains key configuration sections
        assert "global:" in content, "Must have global configuration"
        assert "scrape_configs:" in content, "Must have scrape configurations"
        assert "alerting:" in content, "Must have alerting configuration"
        assert "rule_files:" in content, "Must have rule files"

    def test_alertmanager_config_template(self, chart_path):
        """Test AlertManager config template structure"""
        config_template = chart_path / "templates" / "alertmanager-configmap.yaml"
        with open(config_template) as f:
            content = f.read()

        # Verify template contains required AlertManager configuration
        assert "route:" in content, "Must have route configuration"
        assert "receivers:" in content, "Must have receivers configuration"
        assert "inhibit_rules:" in content, "Must have inhibit rules"

    def test_service_monitor_coverage(self, chart_path):
        """Test that all services from metapharm chart are covered"""
        with open(chart_path / "values.yaml") as f:
            values = yaml.safe_load(f)

        service_monitors = values["serviceMonitors"]
        all_services = (
            service_monitors["highTier"]["services"] +
            service_monitors["mediumTier"]["services"] +
            service_monitors["lowTier"]["services"]
        )

        # Should have reasonable coverage
        assert len(all_services) >= 19, "Should monitor all backend services"

        # High-tier services should be more frequently scraped
        high_tier = service_monitors["highTier"]
        assert high_tier["scrapeInterval"] == "15s", \
            "High-tier services should have 15s scrape interval"

        medium_tier = service_monitors["mediumTier"]
        assert medium_tier["scrapeInterval"] == "30s", \
            "Medium-tier services should have 30s scrape interval"

    def test_alert_rules_defined(self, chart_path):
        """Test that alert rules are properly defined"""
        with open(chart_path / "values.yaml") as f:
            values = yaml.safe_load(f)

        alerts = values["alertRules"]
        assert alerts["enabled"] is True

        # SLO alerts
        assert alerts["sloAlerts"]["enabled"] is True
        assert alerts["sloAlerts"]["highLatency"]["enabled"] is True
        assert alerts["sloAlerts"]["errorRate"]["enabled"] is True
        assert alerts["sloAlerts"]["podRestart"]["enabled"] is True

        # Resource alerts
        assert alerts["resourceAlerts"]["enabled"] is True
        assert alerts["resourceAlerts"]["cpu"]["enabled"] is True
        assert alerts["resourceAlerts"]["memory"]["enabled"] is True
        assert alerts["resourceAlerts"]["disk"]["enabled"] is True

        # Infrastructure alerts
        assert alerts["infrastructureAlerts"]["enabled"] is True
        assert alerts["infrastructureAlerts"]["nodeDown"]["enabled"] is True

    def test_helm_lint(self, chart_path):
        """Test Helm chart linting"""
        try:
            result = subprocess.run(
                ["helm", "lint", str(chart_path)],
                capture_output=True,
                text=True,
                timeout=30
            )
            # Helm lint should pass or at least not fail with errors
            assert result.returncode == 0, f"Helm lint failed: {result.stderr}"
        except FileNotFoundError:
            pytest.skip("Helm CLI not installed")

    def test_helm_template_rendering(self, chart_path):
        """Test that Helm templates can be rendered"""
        try:
            result = subprocess.run(
                ["helm", "template", "prometheus", str(chart_path)],
                capture_output=True,
                text=True,
                timeout=30
            )
            assert result.returncode == 0, \
                f"Helm template rendering failed: {result.stderr}"

            # Should produce valid YAML
            output = result.stdout
            assert len(output) > 100, "Template output should be substantial"
            # Count resources
            assert output.count("kind:") >= 5, \
                "Should render multiple Kubernetes resources"
        except FileNotFoundError:
            pytest.skip("Helm CLI not installed")


class TestPrometheusValues:
    """Test different values configurations"""

    def test_dev_values_override(self):
        """Test development values override defaults"""
        values_path = Path(__file__).parent.parent / "values-dev.yaml"
        with open(values_path) as f:
            dev_values = yaml.safe_load(f)

        assert dev_values["global"]["environment"] == "development"
        assert dev_values["prometheus"]["replicaCount"] == 1
        assert dev_values["prometheus"]["autoscaling"]["enabled"] is False

    def test_staging_values_override(self):
        """Test staging values override defaults"""
        values_path = Path(__file__).parent.parent / "values-staging.yaml"
        with open(values_path) as f:
            staging_values = yaml.safe_load(f)

        assert staging_values["global"]["environment"] == "staging"
        assert staging_values["prometheus"]["replicaCount"] == 2
        assert staging_values["prometheus"]["autoscaling"]["enabled"] is True

    def test_prod_values_override(self):
        """Test production values override defaults"""
        values_path = Path(__file__).parent.parent / "values-prod.yaml"
        with open(values_path) as f:
            prod_values = yaml.safe_load(f)

        assert prod_values["global"]["environment"] == "production"
        assert prod_values["prometheus"]["replicaCount"] == 3
        assert prod_values["prometheus"]["persistence"]["size"] == "100Gi"
        assert prod_values["prometheus"]["autoscaling"]["maxReplicas"] == 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
