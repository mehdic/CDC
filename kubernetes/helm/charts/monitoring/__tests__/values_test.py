"""
Test suite for Prometheus monitoring Helm chart values validation
"""
import pytest
import yaml
import os
from pathlib import Path


class TestValuesValidation:
    """Test values.yaml configuration"""

    @pytest.fixture
    def values_file(self):
        """Load values.yaml file"""
        chart_dir = Path(__file__).parent.parent
        values_path = chart_dir / "values.yaml"
        with open(values_path, 'r') as f:
            return yaml.safe_load(f)

    def test_values_file_exists(self):
        """Ensure values.yaml exists"""
        chart_dir = Path(__file__).parent.parent
        values_path = chart_dir / "values.yaml"
        assert values_path.exists(), "values.yaml file should exist"

    def test_prometheus_enabled(self, values_file):
        """Verify Prometheus is enabled"""
        assert values_file['prometheus']['enabled'] is True

    def test_prometheus_retention_configured(self, values_file):
        """Verify 15-day retention is configured"""
        retention = values_file['prometheus']['storage']['retention']
        assert retention == '15d', f"Expected retention '15d', got '{retention}'"

    def test_prometheus_storage_size(self, values_file):
        """Verify storage size is sufficient"""
        storage_size = values_file['prometheus']['storage']['size']
        assert storage_size == '50Gi', f"Expected storage '50Gi', got '{storage_size}'"

    def test_alertmanager_enabled(self, values_file):
        """Verify AlertManager is enabled"""
        assert values_file['alertmanager']['enabled'] is True

    def test_alertmanager_replicas(self, values_file):
        """Verify AlertManager high availability"""
        replicas = values_file['alertmanager']['replicas']
        assert replicas >= 2, f"AlertManager should have at least 2 replicas, got {replicas}"

    def test_service_monitors_enabled(self, values_file):
        """Verify ServiceMonitors are enabled"""
        assert values_file['serviceMonitors']['enabled'] is True

    def test_all_31_services_configured(self, values_file):
        """Verify all 31 MetaPharm microservices are configured"""
        services = values_file['serviceMonitors']['services']
        assert len(services) == 31, f"Expected 31 services, got {len(services)}"

    def test_service_tiers_defined(self, values_file):
        """Verify all services have tier labels"""
        services = values_file['serviceMonitors']['services']
        for service in services:
            assert 'tier' in service, f"Service {service['name']} missing tier label"
            assert service['tier'] in ['high', 'medium', 'low']

    def test_prometheus_rules_enabled(self, values_file):
        """Verify PrometheusRules are enabled"""
        assert values_file['prometheusRules']['enabled'] is True

    def test_slack_notifications_configured(self, values_file):
        """Verify Slack notification configuration"""
        slack = values_file['alertmanager']['notifications']['slack']
        assert slack['enabled'] is True
        assert slack['channel'] == '#metapharm-alerts'

    def test_critical_services_high_tier(self, values_file):
        """Verify critical healthcare services are marked as high tier"""
        services = {s['name']: s for s in values_file['serviceMonitors']['services']}

        critical_services = [
            'api-gateway',
            'auth-service',
            'prescription-service',
            'medical-records-service',
            'messaging-service',
            'payment-service',
            'teleconsultation-service',
            'digital-twin-service',
            'drug-interaction-service'
        ]

        for service_name in critical_services:
            assert service_name in services, f"Critical service {service_name} not configured"
            assert services[service_name]['tier'] == 'high', \
                f"Critical service {service_name} should be high tier"

    def test_scrape_interval_configured(self, values_file):
        """Verify scrape interval is appropriate"""
        interval = values_file['prometheus']['scrapeInterval']
        assert interval == '15s', f"Expected scrape interval '15s', got '{interval}'"


class TestChartYaml:
    """Test Chart.yaml configuration"""

    @pytest.fixture
    def chart_file(self):
        """Load Chart.yaml file"""
        chart_dir = Path(__file__).parent.parent
        chart_path = chart_dir / "Chart.yaml"
        with open(chart_path, 'r') as f:
            return yaml.safe_load(f)

    def test_chart_file_exists(self):
        """Ensure Chart.yaml exists"""
        chart_dir = Path(__file__).parent.parent
        chart_path = chart_dir / "Chart.yaml"
        assert chart_path.exists(), "Chart.yaml file should exist"

    def test_chart_version(self, chart_file):
        """Verify chart version is set"""
        assert 'version' in chart_file
        assert chart_file['version'] == '1.0.0'

    def test_app_version(self, chart_file):
        """Verify app version matches Prometheus"""
        assert 'appVersion' in chart_file
        assert chart_file['appVersion'].startswith('v2.')

    def test_chart_name(self, chart_file):
        """Verify chart name"""
        assert chart_file['name'] == 'metapharm-monitoring'

    def test_kubernetes_version_requirement(self, chart_file):
        """Verify minimum Kubernetes version"""
        assert 'kubeVersion' in chart_file
        assert '>=1.24.0' in chart_file['kubeVersion']


class TestAlertRules:
    """Test alert rule configurations"""

    @pytest.fixture
    def values_file(self):
        """Load values.yaml file"""
        chart_dir = Path(__file__).parent.parent
        values_path = chart_dir / "values.yaml"
        with open(values_path, 'r') as f:
            return yaml.safe_load(f)

    def test_critical_alerts_defined(self, values_file):
        """Verify critical alert rules are defined"""
        rules = values_file['prometheusRules']['rules']

        expected_alert_groups = [
            'service-availability',
            'performance',
            'healthcare-critical',
            'security',
            'database',
            'infrastructure',
            'business-metrics'
        ]

        defined_groups = [rule['name'] for rule in rules]
        for group in expected_alert_groups:
            assert group in defined_groups, f"Alert group {group} not defined"

    def test_patient_safety_alerts(self, values_file):
        """Verify patient safety alerts are configured"""
        rules = values_file['prometheusRules']['rules']
        healthcare_rules = next(r for r in rules if r['name'] == 'healthcare-critical')

        alert_names = [rule['alert'] for rule in healthcare_rules['rules']]

        assert 'PrescriptionProcessingFailure' in alert_names
        assert 'DrugInteractionCheckFailure' in alert_names
        assert 'MedicalRecordsUnavailable' in alert_names


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
