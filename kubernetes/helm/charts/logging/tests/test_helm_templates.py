#!/usr/bin/env python3
"""
Helm template validation tests for logging chart.
Tests Loki and Promtail Kubernetes manifests generation.
"""

import subprocess
import yaml
import pytest
import re
from typing import Dict, List


def helm_template(values_file: str = None) -> Dict:
    """
    Run helm template and return parsed YAML documents.

    Args:
        values_file: Optional values file override

    Returns:
        Dict of Kubernetes resources keyed by (kind, name)
    """
    cmd = [
        "helm", "template", "test-logging",
        ".",
        "--namespace", "logging"
    ]

    if values_file:
        cmd.extend(["-f", values_file])

    result = subprocess.run(
        cmd,
        cwd="kubernetes/helm/charts/logging",
        capture_output=True,
        text=True,
        check=True
    )

    # Parse all YAML documents
    resources = {}
    for doc in yaml.safe_load_all(result.stdout):
        if doc:
            key = (doc['kind'], doc['metadata']['name'])
            resources[key] = doc

    return resources


class TestLokiResources:
    """Test Loki resource generation"""

    def test_loki_statefulset_exists(self):
        """Loki StatefulSet should be created"""
        resources = helm_template()
        assert ('StatefulSet', 'test-logging-loki') in resources

    def test_loki_statefulset_replicas(self):
        """Loki StatefulSet should have correct replica count"""
        resources = helm_template()
        sts = resources[('StatefulSet', 'test-logging-loki')]
        assert sts['spec']['replicas'] == 3  # Default from values.yaml

    def test_loki_service_exists(self):
        """Loki Service should be created"""
        resources = helm_template()
        assert ('Service', 'test-logging-loki') in resources

    def test_loki_headless_service_exists(self):
        """Loki headless Service should be created"""
        resources = helm_template()
        assert ('Service', 'test-logging-loki-headless') in resources

    def test_loki_config_exists(self):
        """Loki ConfigMap should be created"""
        resources = helm_template()
        assert ('ConfigMap', 'test-logging-loki') in resources

    def test_loki_config_has_retention(self):
        """Loki config should have retention settings"""
        resources = helm_template()
        config = resources[('ConfigMap', 'test-logging-loki')]
        loki_yaml = yaml.safe_load(config['data']['loki.yaml'])

        assert 'table_manager' in loki_yaml
        assert loki_yaml['table_manager']['retention_deletes_enabled'] is True
        assert loki_yaml['table_manager']['retention_period'] == '720h'

    def test_loki_resources_configured(self):
        """Loki container should have resource limits"""
        resources = helm_template()
        sts = resources[('StatefulSet', 'test-logging-loki')]
        container = sts['spec']['template']['spec']['containers'][0]

        assert 'resources' in container
        assert 'limits' in container['resources']
        assert 'requests' in container['resources']
        assert container['resources']['limits']['memory'] == '4Gi'
        assert container['resources']['requests']['cpu'] == '500m'


class TestPromtailResources:
    """Test Promtail resource generation"""

    def test_promtail_daemonset_exists(self):
        """Promtail DaemonSet should be created"""
        resources = helm_template()
        assert ('DaemonSet', 'test-logging-promtail') in resources

    def test_promtail_config_exists(self):
        """Promtail ConfigMap should be created"""
        resources = helm_template()
        assert ('ConfigMap', 'test-logging-promtail') in resources

    def test_promtail_pii_sanitization(self):
        """Promtail config should have PII sanitization rules"""
        resources = helm_template()
        config = resources[('ConfigMap', 'test-logging-promtail')]
        promtail_yaml = yaml.safe_load(config['data']['promtail.yaml'])

        # Check pipeline stages for PII sanitization
        scrape_config = promtail_yaml['scrape_configs'][0]
        pipeline_stages = scrape_config['pipeline_stages']

        # Look for replace stages (PII sanitization)
        replace_stages = [s for s in pipeline_stages if 'replace' in s]
        assert len(replace_stages) >= 5  # email, phone, AHV, IBAN, credit card

        # Verify email sanitization
        email_stage = next(
            (s for s in replace_stages if '[EMAIL]' in s['replace']['replace']),
            None
        )
        assert email_stage is not None

    def test_promtail_volume_mounts(self):
        """Promtail should have correct volume mounts for log access"""
        resources = helm_template()
        ds = resources[('DaemonSet', 'test-logging-promtail')]
        container = ds['spec']['template']['spec']['containers'][0]

        volume_mount_names = {vm['name'] for vm in container['volumeMounts']}
        assert 'varlog' in volume_mount_names
        assert 'varlibdockercontainers' in volume_mount_names
        assert 'config' in volume_mount_names

    def test_promtail_resources_configured(self):
        """Promtail container should have resource limits"""
        resources = helm_template()
        ds = resources[('DaemonSet', 'test-logging-promtail')]
        container = ds['spec']['template']['spec']['containers'][0]

        assert 'resources' in container
        assert container['resources']['limits']['cpu'] == '500m'
        assert container['resources']['requests']['memory'] == '128Mi'


class TestAlerts:
    """Test log-based alerts"""

    def test_alerts_configmap_exists(self):
        """Alerts ConfigMap should be created"""
        resources = helm_template()
        assert ('ConfigMap', 'test-logging-alerts') in resources

    def test_alerts_have_healthcare_rules(self):
        """Alerts should include healthcare-specific rules"""
        resources = helm_template()
        config = resources[('ConfigMap', 'test-logging-alerts')]
        alerts_yaml = yaml.safe_load(config['data']['alerts.yaml'])

        # Check for healthcare compliance group
        group_names = {g['name'] for g in alerts_yaml['groups']}
        assert 'healthcare-compliance' in group_names

        # Find healthcare group
        healthcare_group = next(
            g for g in alerts_yaml['groups']
            if g['name'] == 'healthcare-compliance'
        )

        # Check for specific healthcare alerts
        alert_names = {r['alert'] for r in healthcare_group['rules']}
        assert 'UnauthorizedAccessAttempt' in alert_names
        assert 'PrescriptionValidationFailures' in alert_names
        assert 'PatientDataAccessLog' in alert_names

    def test_alerts_have_pii_detection(self):
        """Alerts should detect PII leakage"""
        resources = helm_template()
        config = resources[('ConfigMap', 'test-logging-alerts')]
        alerts_yaml = yaml.safe_load(config['data']['alerts.yaml'])

        # Find logging-alerts group
        logging_group = next(
            g for g in alerts_yaml['groups']
            if g['name'] == 'logging-alerts'
        )

        # Check for PII detection alert
        alert_names = {r['alert'] for r in logging_group['rules']}
        assert 'pii-detected' in alert_names


class TestRBAC:
    """Test RBAC resources"""

    def test_service_account_exists(self):
        """ServiceAccount should be created"""
        resources = helm_template()
        assert ('ServiceAccount', 'test-logging') in resources

    def test_cluster_role_exists(self):
        """ClusterRole should be created"""
        resources = helm_template()
        assert ('ClusterRole', 'test-logging') in resources

    def test_cluster_role_binding_exists(self):
        """ClusterRoleBinding should be created"""
        resources = helm_template()
        assert ('ClusterRoleBinding', 'test-logging') in resources

    def test_cluster_role_permissions(self):
        """ClusterRole should have correct permissions for log collection"""
        resources = helm_template()
        role = resources[('ClusterRole', 'test-logging')]

        # Check for pod access
        pod_rule = next(
            r for r in role['rules']
            if 'pods' in r['resources']
        )
        assert 'get' in pod_rule['verbs']
        assert 'watch' in pod_rule['verbs']
        assert 'list' in pod_rule['verbs']


class TestEnvironmentOverrides:
    """Test environment-specific value overrides"""

    def test_dev_environment(self):
        """Dev environment should have reduced resources"""
        resources = helm_template('values-dev.yaml')
        sts = resources[('StatefulSet', 'test-logging-loki')]

        # Dev should have 1 replica
        assert sts['spec']['replicas'] == 1

        # Dev should have smaller storage
        pvc = sts['spec']['volumeClaimTemplates'][0]
        assert pvc['spec']['resources']['requests']['storage'] == '10Gi'

    def test_prod_environment(self):
        """Prod environment should have full resources"""
        resources = helm_template('values-prod.yaml')
        sts = resources[('StatefulSet', 'test-logging-loki')]

        # Prod should have 3 replicas
        assert sts['spec']['replicas'] == 3

        # Prod should have larger storage
        pvc = sts['spec']['volumeClaimTemplates'][0]
        assert pvc['spec']['resources']['requests']['storage'] == '100Gi'


class TestPIISanitization:
    """Test PII sanitization patterns"""

    def test_email_pattern(self):
        """Email pattern should match valid emails"""
        pattern = r'([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'

        test_emails = [
            'test@metapharm.ch',
            'patient.name@hospital.com',
            'doctor_123@clinic.org'
        ]

        for email in test_emails:
            assert re.search(pattern, email), f"Pattern should match {email}"

    def test_ahv_pattern(self):
        """Swiss AHV pattern should match valid numbers"""
        pattern = r'(\d{3}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{2})'

        test_ahv = [
            '756.1234.5678.90',
            '756-1234-5678-90',
            '756 1234 5678 90',
            '75612345678 90'
        ]

        for ahv in test_ahv:
            assert re.search(pattern, ahv), f"Pattern should match {ahv}"

    def test_phone_pattern(self):
        """Phone pattern should match various formats"""
        pattern = r'(\+?\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9})'

        test_phones = [
            '+41 79 123 45 67',
            '+41791234567',
            '079 123 45 67',
            '+1 (555) 123-4567'
        ]

        for phone in test_phones:
            assert re.search(pattern, phone), f"Pattern should match {phone}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
