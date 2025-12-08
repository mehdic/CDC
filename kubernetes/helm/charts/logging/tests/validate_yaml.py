#!/usr/bin/env python3
"""
Validate YAML syntax and basic structure of Helm chart templates.
Does not require Helm to be installed.
"""

import yaml
import os
import sys
import re
from pathlib import Path


def validate_yaml_file(filepath: Path) -> tuple[bool, str]:
    """
    Validate YAML file syntax.

    Returns:
        (is_valid, error_message)
    """
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        # Skip Helm template validation for template files
        # (they contain Go templates which aren't valid YAML until rendered)
        if '/templates/' in str(filepath) and filepath.suffix == '.yaml':
            # Just check for basic syntax errors
            if '{{' in content:
                # Contains Helm templates, skip strict YAML parsing
                # Just check for obvious syntax errors
                if content.count('{{') != content.count('}}'):
                    return False, "Mismatched Helm template braces"
                return True, ""

        # For values files and other YAML, parse strictly
        yaml.safe_load(content)
        return True, ""

    except yaml.YAMLError as e:
        return False, f"YAML syntax error: {e}"
    except Exception as e:
        return False, f"Error reading file: {e}"


def validate_values_file(filepath: Path) -> tuple[bool, list[str]]:
    """Validate values.yaml structure."""
    try:
        with open(filepath, 'r') as f:
            values = yaml.safe_load(f)

        errors = []

        # Check required top-level keys
        required_keys = ['loki', 'promtail', 'alerts']
        for key in required_keys:
            if key not in values:
                errors.append(f"Missing required key: {key}")

        # Check Loki configuration
        if 'loki' in values:
            loki = values['loki']
            if 'retention' in loki:
                if 'retentionPeriod' not in loki['retention']:
                    errors.append("Loki retention missing retentionPeriod")

        # Check Promtail PII sanitization
        if 'promtail' in values:
            promtail = values['promtail']
            if 'piiSanitization' not in promtail:
                errors.append("Promtail missing piiSanitization configuration")
            elif not promtail['piiSanitization'].get('enabled', False):
                errors.append("WARNING: PII sanitization is disabled (GDPR risk)")

        return len(errors) == 0, errors

    except Exception as e:
        return False, [f"Error validating values file: {e}"]


def validate_chart_yaml(filepath: Path) -> tuple[bool, list[str]]:
    """Validate Chart.yaml structure."""
    try:
        with open(filepath, 'r') as f:
            chart = yaml.safe_load(f)

        errors = []

        required_keys = ['apiVersion', 'name', 'version', 'appVersion']
        for key in required_keys:
            if key not in chart:
                errors.append(f"Chart.yaml missing required key: {key}")

        if chart.get('name') != 'logging':
            errors.append(f"Chart name should be 'logging', got '{chart.get('name')}'")

        return len(errors) == 0, errors

    except Exception as e:
        return False, [f"Error validating Chart.yaml: {e}"]


def validate_pii_patterns(filepath: Path) -> tuple[bool, list[str]]:
    """Validate PII sanitization patterns are present."""
    try:
        with open(filepath, 'r') as f:
            values = yaml.safe_load(f)

        errors = []

        if 'promtail' not in values or 'piiSanitization' not in values['promtail']:
            errors.append("PII sanitization configuration missing")
            return False, errors

        pii_config = values['promtail']['piiSanitization']

        # Check required patterns
        required_patterns = ['email', 'phone', 'ahv', 'iban', 'creditCard']
        if 'patterns' not in pii_config:
            errors.append("PII patterns missing")
            return False, errors

        patterns = pii_config['patterns']
        for pattern_name in required_patterns:
            if pattern_name not in patterns:
                errors.append(f"Missing PII pattern: {pattern_name}")

        # Validate regex patterns
        for pattern_name, pattern in patterns.items():
            try:
                re.compile(pattern)
            except re.error as e:
                errors.append(f"Invalid regex pattern '{pattern_name}': {e}")

        return len(errors) == 0, errors

    except Exception as e:
        return False, [f"Error validating PII patterns: {e}"]


def main():
    """Run all validations."""
    chart_dir = Path(__file__).parent.parent
    print(f"Validating Helm chart: {chart_dir.name}")
    print("=" * 60)

    all_passed = True

    # Validate Chart.yaml
    print("\n1. Validating Chart.yaml...")
    chart_yaml = chart_dir / 'Chart.yaml'
    if chart_yaml.exists():
        valid, errors = validate_chart_yaml(chart_yaml)
        if valid:
            print("   ✓ Chart.yaml is valid")
        else:
            print("   ✗ Chart.yaml has errors:")
            for error in errors:
                print(f"     - {error}")
            all_passed = False
    else:
        print("   ✗ Chart.yaml not found")
        all_passed = False

    # Validate values files
    print("\n2. Validating values files...")
    values_files = [
        'values.yaml',
        'values-dev.yaml',
        'values-staging.yaml',
        'values-prod.yaml'
    ]

    for values_file in values_files:
        filepath = chart_dir / values_file
        if filepath.exists():
            valid, error = validate_yaml_file(filepath)
            if valid:
                print(f"   ✓ {values_file} syntax is valid")

                # Additional validation for main values.yaml
                if values_file == 'values.yaml':
                    valid, errors = validate_values_file(filepath)
                    if valid:
                        print(f"   ✓ {values_file} structure is valid")
                    else:
                        print(f"   ✗ {values_file} structure errors:")
                        for error in errors:
                            print(f"     - {error}")
                        all_passed = False
            else:
                print(f"   ✗ {values_file}: {error}")
                all_passed = False
        else:
            print(f"   ⚠ {values_file} not found (optional)")

    # Validate PII sanitization patterns
    print("\n3. Validating PII sanitization patterns...")
    main_values = chart_dir / 'values.yaml'
    if main_values.exists():
        valid, errors = validate_pii_patterns(main_values)
        if valid:
            print("   ✓ PII sanitization patterns are valid")
        else:
            print("   ✗ PII sanitization errors:")
            for error in errors:
                print(f"     - {error}")
            all_passed = False

    # Validate template files (basic YAML check)
    print("\n4. Validating template files...")
    templates_dir = chart_dir / 'templates'
    if templates_dir.exists():
        template_files = list(templates_dir.glob('*.yaml'))
        for template_file in template_files:
            valid, error = validate_yaml_file(template_file)
            if valid:
                print(f"   ✓ {template_file.name} syntax OK")
            else:
                print(f"   ✗ {template_file.name}: {error}")
                all_passed = False
    else:
        print("   ✗ templates/ directory not found")
        all_passed = False

    # Check for required templates
    print("\n5. Checking required templates...")
    required_templates = [
        'loki-config.yaml',
        'loki-statefulset.yaml',
        'loki-service.yaml',
        'promtail-config.yaml',
        'promtail-daemonset.yaml',
        'log-alerts.yaml',
        'rbac.yaml',
        '_helpers.tpl'
    ]

    for template in required_templates:
        filepath = templates_dir / template
        if filepath.exists():
            print(f"   ✓ {template} exists")
        else:
            print(f"   ✗ {template} missing")
            all_passed = False

    # Summary
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ All validations passed!")
        return 0
    else:
        print("✗ Some validations failed")
        return 1


if __name__ == '__main__':
    sys.exit(main())
