"""
Test suite for YAML syntax and schema validation
"""
import pytest
import yaml
import os
from pathlib import Path


class TestYAMLSyntax:
    """Test YAML file syntax validity"""

    def get_all_yaml_files(self):
        """Find all YAML files in the chart"""
        chart_dir = Path(__file__).parent.parent
        yaml_files = []

        # Values files
        yaml_files.extend(chart_dir.glob("values*.yaml"))

        # Chart.yaml
        yaml_files.append(chart_dir / "Chart.yaml")

        # Template files
        templates_dir = chart_dir / "templates"
        if templates_dir.exists():
            yaml_files.extend(templates_dir.rglob("*.yaml"))

        return yaml_files

    def test_all_yaml_files_valid_syntax(self):
        """Verify all YAML files have valid syntax"""
        yaml_files = self.get_all_yaml_files()
        assert len(yaml_files) > 0, "Should find YAML files in chart"

        for yaml_file in yaml_files:
            with open(yaml_file, 'r') as f:
                try:
                    content = f.read()
                    # Skip Helm template files (they contain {{ }} which breaks YAML parsing)
                    if '{{' in content:
                        continue

                    yaml.safe_load(content)
                except yaml.YAMLError as e:
                    pytest.fail(f"YAML syntax error in {yaml_file}: {e}")

    def test_values_yaml_structure(self):
        """Test values.yaml has required top-level keys"""
        chart_dir = Path(__file__).parent.parent
        values_path = chart_dir / "values.yaml"

        with open(values_path, 'r') as f:
            values = yaml.safe_load(f)

        required_keys = [
            'global',
            'namespace',
            'prometheus',
            'alertmanager',
            'serviceMonitors',
            'prometheusRules'
        ]

        for key in required_keys:
            assert key in values, f"values.yaml missing required key: {key}"

    def test_chart_yaml_structure(self):
        """Test Chart.yaml has required fields"""
        chart_dir = Path(__file__).parent.parent
        chart_path = chart_dir / "Chart.yaml"

        with open(chart_path, 'r') as f:
            chart = yaml.safe_load(f)

        required_fields = [
            'apiVersion',
            'name',
            'description',
            'type',
            'version',
            'appVersion',
            'kubeVersion'
        ]

        for field in required_fields:
            assert field in chart, f"Chart.yaml missing required field: {field}"


class TestPrometheusConfiguration:
    """Test Prometheus-specific configurations"""

    @pytest.fixture
    def values(self):
        """Load values.yaml"""
        chart_dir = Path(__file__).parent.parent
        values_path = chart_dir / "values.yaml"
        with open(values_path, 'r') as f:
            return yaml.safe_load(f)

    def test_prometheus_image_tag(self, values):
        """Verify Prometheus image tag is specified"""
        assert 'image' in values['prometheus']
        assert 'tag' in values['prometheus']['image']
        tag = values['prometheus']['image']['tag']
        assert tag.startswith('v'), f"Prometheus tag should start with 'v', got '{tag}'"

    def test_prometheus_resources_defined(self, values):
        """Verify resource limits are defined"""
        resources = values['prometheus']['resources']
        assert 'requests' in resources
        assert 'limits' in resources
        assert 'cpu' in resources['requests']
        assert 'memory' in resources['requests']

    def test_alertmanager_resources_defined(self, values):
        """Verify AlertManager resource limits"""
        resources = values['alertmanager']['resources']
        assert 'requests' in resources
        assert 'limits' in resources


class TestServiceMonitorConfiguration:
    """Test ServiceMonitor configurations"""

    @pytest.fixture
    def values(self):
        """Load values.yaml"""
        chart_dir = Path(__file__).parent.parent
        values_path = chart_dir / "values.yaml"
        with open(values_path, 'r') as f:
            return yaml.safe_load(f)

    def test_service_monitor_ports_configured(self, values):
        """Verify all services have port configurations"""
        services = values['serviceMonitors']['services']
        for service in services:
            assert 'port' in service, f"Service {service['name']} missing port"
            assert 'path' in service, f"Service {service['name']} missing metrics path"
            assert service['path'] == '/metrics', f"Service {service['name']} should use /metrics endpoint"

    def test_service_namespaces(self, values):
        """Verify all services are in correct namespace"""
        services = values['serviceMonitors']['services']
        for service in services:
            assert 'namespace' in service, f"Service {service['name']} missing namespace"
            assert service['namespace'] == 'metapharm'


class TestAlertConfiguration:
    """Test alert configuration validity"""

    @pytest.fixture
    def values(self):
        """Load values.yaml"""
        chart_dir = Path(__file__).parent.parent
        values_path = chart_dir / "values.yaml"
        with open(values_path, 'r') as f:
            return yaml.safe_load(f)

    def test_alert_grouping_configured(self, values):
        """Verify alert grouping is configured"""
        grouping = values['alertmanager']['grouping']
        assert 'groupBy' in grouping
        assert 'groupWait' in grouping
        assert 'groupInterval' in grouping
        assert 'repeatInterval' in grouping

    def test_notification_channels_configured(self, values):
        """Verify notification channels are configured"""
        notifications = values['alertmanager']['notifications']
        assert 'slack' in notifications
        assert 'email' in notifications
        assert 'pagerduty' in notifications


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
