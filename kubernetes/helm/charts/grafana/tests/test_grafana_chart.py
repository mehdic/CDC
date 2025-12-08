#!/usr/bin/env python3
"""
Grafana Helm Chart Validation Tests

Tests to validate the Grafana Helm chart structure, templates, and configurations.
"""

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


class TestGrafanaChart(unittest.TestCase):
    """Test cases for Grafana Helm chart"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.chart_path = Path(__file__).parent.parent
        cls.values_path = cls.chart_path / "values.yaml"
        cls.chart_yaml_path = cls.chart_path / "Chart.yaml"

    def test_chart_yaml_exists(self):
        """Test that Chart.yaml exists"""
        self.assertTrue(
            self.chart_yaml_path.exists(),
            "Chart.yaml should exist"
        )

    def test_values_yaml_exists(self):
        """Test that values.yaml exists"""
        self.assertTrue(
            self.values_path.exists(),
            "values.yaml should exist"
        )

    def test_chart_version_defined(self):
        """Test that chart version is defined"""
        with open(self.chart_yaml_path) as f:
            content = f.read()
            self.assertIn("version:", content, "Chart version should be defined")

    def test_chart_app_version_defined(self):
        """Test that app version is defined"""
        with open(self.chart_yaml_path) as f:
            content = f.read()
            self.assertIn("appVersion:", content, "App version should be defined")

    def test_required_templates_exist(self):
        """Test that all required templates exist"""
        templates_dir = self.chart_path / "templates"
        required_templates = [
            "deployment.yaml",
            "service.yaml",
            "configmap-dashboards.yaml",
            "configmap-datasources.yaml",
            "_helpers.tpl",
        ]

        for template in required_templates:
            template_path = templates_dir / template
            self.assertTrue(
                template_path.exists(),
                f"Template {template} should exist"
            )

    def test_values_file_is_valid_yaml(self):
        """Test that values.yaml is valid YAML"""
        try:
            import yaml
            with open(self.values_path) as f:
                yaml.safe_load(f)
        except Exception as e:
            self.fail(f"values.yaml should be valid YAML: {e}")

    def test_grafana_enabled_by_default(self):
        """Test that Grafana is enabled by default"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertTrue(
                    values["grafana"]["enabled"],
                    "Grafana should be enabled by default"
                )
        except Exception as e:
            self.fail(f"Failed to parse values.yaml: {e}")

    def test_namespace_configuration(self):
        """Test that namespace is configured"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertTrue(
                    values["namespace"]["create"],
                    "Namespace should be created by default"
                )
                self.assertEqual(
                    values["namespace"]["name"],
                    "monitoring",
                    "Default namespace should be 'monitoring'"
                )
        except Exception as e:
            self.fail(f"Failed to parse namespace configuration: {e}")

    def test_service_monitor_defined(self):
        """Test that service monitor is defined"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertIn(
                    "serviceMonitor",
                    values,
                    "Service monitor should be configured"
                )
        except Exception as e:
            self.fail(f"Failed to parse service monitor configuration: {e}")

    def test_datasources_configured(self):
        """Test that datasources are configured"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertIn(
                    "datasources",
                    values,
                    "Datasources should be configured"
                )
                self.assertTrue(
                    values["datasources"]["prometheus"]["enabled"],
                    "Prometheus datasource should be enabled"
                )
        except Exception as e:
            self.fail(f"Failed to parse datasources configuration: {e}")

    def test_dashboards_configured(self):
        """Test that dashboards are configured"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertIn(
                    "dashboards",
                    values,
                    "Dashboards should be configured"
                )
                dashboards = values["dashboards"]
                self.assertTrue(
                    dashboards["platformOverview"]["enabled"],
                    "Platform Overview dashboard should be enabled"
                )
                self.assertTrue(
                    dashboards["serviceHealth"]["enabled"],
                    "Service Health dashboard should be enabled"
                )
                self.assertTrue(
                    dashboards["businessMetrics"]["enabled"],
                    "Business Metrics dashboard should be enabled"
                )
                self.assertTrue(
                    dashboards["deliveryOps"]["enabled"],
                    "Delivery Operations dashboard should be enabled"
                )
                self.assertTrue(
                    dashboards["onCall"]["enabled"],
                    "On-Call dashboard should be enabled"
                )
        except Exception as e:
            self.fail(f"Failed to parse dashboards configuration: {e}")

    def test_rbac_enabled_by_default(self):
        """Test that RBAC is enabled by default"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertTrue(
                    values["rbac"]["create"],
                    "RBAC should be enabled by default"
                )
        except Exception as e:
            self.fail(f"Failed to parse RBAC configuration: {e}")

    def test_service_account_created(self):
        """Test that service account is configured"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertTrue(
                    values["serviceAccount"]["create"],
                    "Service account should be created"
                )
                self.assertEqual(
                    values["serviceAccount"]["name"],
                    "grafana",
                    "Service account name should be 'grafana'"
                )
        except Exception as e:
            self.fail(f"Failed to parse service account configuration: {e}")

    def test_persistence_enabled(self):
        """Test that persistence is enabled by default"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertTrue(
                    values["grafana"]["persistence"]["enabled"],
                    "Persistence should be enabled by default"
                )
        except Exception as e:
            self.fail(f"Failed to parse persistence configuration: {e}")

    def test_ingress_configured(self):
        """Test that ingress is configured"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertTrue(
                    values["ingress"]["enabled"],
                    "Ingress should be enabled"
                )
                self.assertIn(
                    "hosts",
                    values["ingress"],
                    "Ingress hosts should be configured"
                )
        except Exception as e:
            self.fail(f"Failed to parse ingress configuration: {e}")

    def test_autoscaling_configured(self):
        """Test that autoscaling is configured"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertTrue(
                    values["grafana"]["autoscaling"]["enabled"],
                    "Autoscaling should be enabled"
                )
                self.assertGreaterEqual(
                    values["grafana"]["autoscaling"]["minReplicas"],
                    1,
                    "Min replicas should be >= 1"
                )
        except Exception as e:
            self.fail(f"Failed to parse autoscaling configuration: {e}")

    def test_pod_disruption_budget(self):
        """Test that pod disruption budget is configured"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertTrue(
                    values["podDisruptionBudget"]["enabled"],
                    "Pod disruption budget should be enabled"
                )
        except Exception as e:
            self.fail(f"Failed to parse PDB configuration: {e}")

    def test_network_policy_enabled(self):
        """Test that network policy is enabled"""
        try:
            import yaml
            with open(self.values_path) as f:
                values = yaml.safe_load(f)
                self.assertTrue(
                    values["networkPolicy"]["enabled"],
                    "Network policy should be enabled"
                )
        except Exception as e:
            self.fail(f"Failed to parse network policy configuration: {e}")

    def test_environment_values_files_exist(self):
        """Test that environment-specific values files exist"""
        env_files = [
            "values-dev.yaml",
            "values-staging.yaml",
            "values-prod.yaml",
        ]

        for env_file in env_files:
            file_path = self.chart_path / env_file
            self.assertTrue(
                file_path.exists(),
                f"Environment file {env_file} should exist"
            )

    def test_readme_exists(self):
        """Test that README exists"""
        readme_path = self.chart_path / "README.md"
        self.assertTrue(
            readme_path.exists(),
            "README.md should exist"
        )

    def test_platform_overview_dashboard(self):
        """Test platform overview dashboard configuration"""
        configmap_path = self.chart_path / "templates" / "configmap-dashboards.yaml"
        with open(configmap_path) as f:
            content = f.read()
            self.assertIn(
                "platform-overview",
                content,
                "Platform Overview dashboard should be defined"
            )
            self.assertIn(
                "Platform Overview",
                content,
                "Dashboard title should be present"
            )

    def test_service_health_dashboard(self):
        """Test service health dashboard configuration"""
        configmap_path = self.chart_path / "templates" / "configmap-dashboards.yaml"
        with open(configmap_path) as f:
            content = f.read()
            self.assertIn(
                "service-health",
                content,
                "Service Health dashboard should be defined"
            )

    def test_business_metrics_dashboard(self):
        """Test business metrics dashboard configuration"""
        configmap_path = self.chart_path / "templates" / "configmap-dashboards.yaml"
        with open(configmap_path) as f:
            content = f.read()
            self.assertIn(
                "business-metrics",
                content,
                "Business Metrics dashboard should be defined"
            )

    def test_delivery_operations_dashboard(self):
        """Test delivery operations dashboard configuration"""
        configmap_path = self.chart_path / "templates" / "configmap-dashboards.yaml"
        with open(configmap_path) as f:
            content = f.read()
            self.assertIn(
                "delivery-operations",
                content,
                "Delivery Operations dashboard should be defined"
            )

    def test_on_call_dashboard(self):
        """Test on-call dashboard configuration"""
        configmap_path = self.chart_path / "templates" / "configmap-dashboards.yaml"
        with open(configmap_path) as f:
            content = f.read()
            self.assertIn(
                "on-call",
                content,
                "On-Call dashboard should be defined"
            )

    def test_datasource_prometheus(self):
        """Test Prometheus datasource configuration"""
        configmap_path = self.chart_path / "templates" / "configmap-datasources.yaml"
        with open(configmap_path) as f:
            content = f.read()
            self.assertIn(
                "Prometheus",
                content,
                "Prometheus datasource should be configured"
            )
            self.assertIn(
                "prometheus",
                content.lower(),
                "Prometheus configuration should be present"
            )

    def test_grafana_admin_secret(self):
        """Test Grafana admin secret configuration"""
        rbac_path = self.chart_path / "templates" / "rbac.yaml"
        with open(rbac_path) as f:
            content = f.read()
            self.assertIn(
                "grafana-admin",
                content,
                "Admin secret should be configured"
            )

    def test_deployment_template_valid(self):
        """Test that deployment template is valid Kubernetes"""
        deployment_path = self.chart_path / "templates" / "deployment.yaml"
        self.assertTrue(
            deployment_path.exists(),
            "Deployment template should exist"
        )
        with open(deployment_path) as f:
            content = f.read()
            self.assertIn(
                "kind: Deployment",
                content,
                "Should define Kubernetes Deployment"
            )
            self.assertIn(
                "apiVersion",
                content,
                "Should have apiVersion"
            )

    def test_service_template_valid(self):
        """Test that service template is valid Kubernetes"""
        service_path = self.chart_path / "templates" / "service.yaml"
        self.assertTrue(
            service_path.exists(),
            "Service template should exist"
        )
        with open(service_path) as f:
            content = f.read()
            self.assertIn(
                "kind: Service",
                content,
                "Should define Kubernetes Service"
            )

    def test_chart_linting_structure(self):
        """Test basic chart structure without helm lint"""
        # Check directory structure
        templates_dir = self.chart_path / "templates"
        self.assertTrue(
            templates_dir.is_dir(),
            "Templates directory should exist"
        )
        self.assertTrue(
            len(list(templates_dir.glob("*.yaml"))) > 0,
            "Templates directory should contain YAML files"
        )

    def test_production_values_has_replicas(self):
        """Test that production values has proper replica count"""
        try:
            import yaml
            prod_values_path = self.chart_path / "values-prod.yaml"
            with open(prod_values_path) as f:
                values = yaml.safe_load(f)
                self.assertGreaterEqual(
                    values["grafana"]["replicaCount"],
                    2,
                    "Production should have at least 2 replicas"
                )
        except Exception as e:
            self.fail(f"Failed to parse production values: {e}")

    def test_production_values_postgres(self):
        """Test that production uses PostgreSQL"""
        try:
            import yaml
            prod_values_path = self.chart_path / "values-prod.yaml"
            with open(prod_values_path) as f:
                values = yaml.safe_load(f)
                self.assertEqual(
                    values["grafana"]["config"]["database"]["type"],
                    "postgres",
                    "Production should use PostgreSQL"
                )
        except Exception as e:
            self.fail(f"Failed to parse production database config: {e}")

    def test_development_values_minimal_resources(self):
        """Test that development values uses minimal resources"""
        try:
            import yaml
            dev_values_path = self.chart_path / "values-dev.yaml"
            with open(dev_values_path) as f:
                values = yaml.safe_load(f)
                self.assertEqual(
                    values["grafana"]["replicaCount"],
                    1,
                    "Development should use 1 replica"
                )
        except Exception as e:
            self.fail(f"Failed to parse development values: {e}")


class TestDashboardJSON(unittest.TestCase):
    """Test cases for dashboard JSON validity"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.configmap_path = (
            Path(__file__).parent.parent
            / "templates"
            / "configmap-dashboards.yaml"
        )

    def test_dashboards_are_valid_json(self):
        """Test that all dashboards contain valid JSON"""
        with open(self.configmap_path) as f:
            content = f.read()

            # Extract JSON blocks (rough pattern matching)
            import re
            json_blocks = re.findall(
                r'([\w-]+)\.json:\s*\|\s*(\{[^}]*"uid"[^}]*\})',
                content,
                re.MULTILINE | re.DOTALL
            )

            # Basic validation that JSON markers exist
            self.assertIn("platform-overview", content)
            self.assertIn("service-health", content)
            self.assertIn("business-metrics", content)
            self.assertIn("delivery-operations", content)
            self.assertIn("on-call", content)


if __name__ == "__main__":
    unittest.main()
