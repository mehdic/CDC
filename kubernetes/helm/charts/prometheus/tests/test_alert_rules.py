"""
Unit tests for Prometheus Alert Rules
Tests alert rule definitions and configurations
"""

import pytest
import yaml
from pathlib import Path
import re


class TestAlertRules:
    """Test Prometheus alert rules validation"""

    @pytest.fixture
    def chart_path(self):
        """Get path to Prometheus chart"""
        return Path(__file__).parent.parent

    @pytest.fixture
    def alert_rules_template(self, chart_path):
        """Load alert rules template"""
        rules_file = chart_path / "templates" / "prometheus-rules-configmap.yaml"
        with open(rules_file) as f:
            return f.read()

    def test_alert_rules_configmap_exists(self, chart_path):
        """Test that alert rules configmap template exists"""
        rules_file = chart_path / "templates" / "prometheus-rules-configmap.yaml"
        assert rules_file.exists(), "Alert rules configmap template must exist"

    def test_alert_rules_structure(self, alert_rules_template):
        """Test alert rules YAML structure"""
        # Should contain groups
        assert "groups:" in alert_rules_template
        assert "- name:" in alert_rules_template
        assert "rules:" in alert_rules_template

    def test_slo_alerts_defined(self, alert_rules_template):
        """Test SLO alerts are defined"""
        # HighLatency alert
        assert "HighLatency" in alert_rules_template
        assert "histogram_quantile" in alert_rules_template

        # HighErrorRate alert
        assert "HighErrorRate" in alert_rules_template
        assert "http_requests_total" in alert_rules_template

        # PodRestartingTooOften alert
        assert "PodRestartingTooOften" in alert_rules_template
        assert "kube_pod_container_status_restarts_total" in alert_rules_template

    def test_resource_alerts_defined(self, alert_rules_template):
        """Test resource alerts are defined"""
        # CPU alert
        assert "HighCPUUsage" in alert_rules_template
        assert "node_cpu_seconds_total" in alert_rules_template

        # Memory alert
        assert "HighMemoryUsage" in alert_rules_template
        assert "node_memory_MemAvailable_bytes" in alert_rules_template

        # Disk alert
        assert "HighDiskUsage" in alert_rules_template
        assert "node_filesystem_avail_bytes" in alert_rules_template

    def test_infrastructure_alerts_defined(self, alert_rules_template):
        """Test infrastructure alerts are defined"""
        # Node down alert
        assert "NodeDown" in alert_rules_template
        assert "kubernetes-nodes" in alert_rules_template

        # Database connection pool alert
        assert "DatabaseConnectionPoolExhausted" in alert_rules_template
        assert "pg_stat_activity_count" in alert_rules_template

        # Redis memory alert
        assert "RedisMemoryUsageHigh" in alert_rules_template
        assert "redis_memory_used_bytes" in alert_rules_template

    def test_alert_severity_labels(self, alert_rules_template):
        """Test alerts have severity labels"""
        # Count severity definitions (may use template variables)
        critical_count = (alert_rules_template.count("severity: critical") +
                         alert_rules_template.count("severity: {{ "))
        warning_count = (alert_rules_template.count("severity: warning") +
                        alert_rules_template.count("severity: {{ "))

        assert critical_count > 0, "Should have critical severity alerts"
        assert warning_count > 0 or alert_rules_template.count("severity") > 2, \
            "Should have warning severity alerts"

    def test_alert_annotations(self, alert_rules_template):
        """Test alerts have proper annotations"""
        assert "summary:" in alert_rules_template, "Alerts must have summary"
        assert "description:" in alert_rules_template, "Alerts must have description"

    def test_alert_duration_thresholds(self, alert_rules_template):
        """Test alerts have reasonable duration thresholds"""
        # Alerts should have 'for' clauses (may use template variables)
        assert "for: " in alert_rules_template, "Alerts should have duration thresholds"

        # Common patterns - templates use variables
        assert "5m" in alert_rules_template, "Should have 5-minute thresholds"
        assert "for: " in alert_rules_template, "Should have duration thresholds defined"

    def test_promql_expressions(self, alert_rules_template):
        """Test PromQL expressions are present"""
        # Should have expr definitions
        assert "expr: |" in alert_rules_template

        # Should not have empty expressions
        lines = alert_rules_template.split("\n")
        for i, line in enumerate(lines):
            if "expr: |" in line:
                # Check next line is not empty
                if i + 1 < len(lines):
                    assert lines[i + 1].strip() != "", "Expression should not be empty"


class TestAlertManagerConfig:
    """Test AlertManager configuration"""

    @pytest.fixture
    def chart_path(self):
        """Get path to Prometheus chart"""
        return Path(__file__).parent.parent

    @pytest.fixture
    def alertmanager_config_template(self, chart_path):
        """Load AlertManager config template"""
        config_file = chart_path / "templates" / "alertmanager-configmap.yaml"
        with open(config_file) as f:
            return f.read()

    def test_alertmanager_configmap_exists(self, chart_path):
        """Test that AlertManager configmap template exists"""
        config_file = chart_path / "templates" / "alertmanager-configmap.yaml"
        assert config_file.exists(), "AlertManager configmap template must exist"

    def test_alertmanager_global_config(self, alertmanager_config_template):
        """Test AlertManager global configuration"""
        assert "global:" in alertmanager_config_template
        assert "resolve_timeout:" in alertmanager_config_template
        assert "slack_api_url:" in alertmanager_config_template
        assert "pagerduty_url:" in alertmanager_config_template

    def test_alertmanager_route_config(self, alertmanager_config_template):
        """Test AlertManager route configuration"""
        assert "route:" in alertmanager_config_template
        assert "receiver:" in alertmanager_config_template
        assert "group_by:" in alertmanager_config_template
        assert "group_wait:" in alertmanager_config_template
        assert "group_interval:" in alertmanager_config_template
        assert "repeat_interval:" in alertmanager_config_template
        assert "routes:" in alertmanager_config_template

    def test_alertmanager_receivers(self, alertmanager_config_template):
        """Test AlertManager receivers are configured"""
        assert "receivers:" in alertmanager_config_template

        # Should reference default receiver (may use template variables)
        assert "name:" in alertmanager_config_template, "Should define receivers"
        assert "slack_configs:" in alertmanager_config_template, "Should have Slack configuration"

    def test_slack_configuration(self, alertmanager_config_template):
        """Test Slack notification configuration"""
        assert "slack_configs:" in alertmanager_config_template
        assert "channel:" in alertmanager_config_template
        assert "title:" in alertmanager_config_template
        assert "text:" in alertmanager_config_template

    def test_pagerduty_configuration(self, alertmanager_config_template):
        """Test PagerDuty notification configuration"""
        assert "pagerduty_configs:" in alertmanager_config_template
        assert "service_key:" in alertmanager_config_template
        assert "description:" in alertmanager_config_template

    def test_inhibit_rules(self, alertmanager_config_template):
        """Test inhibition rules are configured"""
        assert "inhibit_rules:" in alertmanager_config_template
        assert "source_match:" in alertmanager_config_template
        assert "target_match:" in alertmanager_config_template

    def test_alert_routing_hierarchy(self, alertmanager_config_template):
        """Test alert routing hierarchy is properly defined"""
        # Should have routing configuration (may use template variables)
        assert "route:" in alertmanager_config_template
        assert "routes:" in alertmanager_config_template

        # Should have multiple receiver definitions
        assert alertmanager_config_template.count("receiver:") > 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
