#!/bin/bash

# CI/CD Workflow Test Suite
# Tests GitHub Actions workflow syntax and configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOWS_DIR="$(dirname "$SCRIPT_DIR")"
FAILED_TESTS=0
PASSED_TESTS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  CI/CD Workflow Test Suite"
echo "========================================"
echo ""

# Test 1: Check workflow YAML syntax
test_yaml_syntax() {
    echo -n "Testing YAML syntax... "

    # Install yamllint if not available
    if ! command -v yamllint &> /dev/null; then
        echo -e "${YELLOW}SKIP${NC} (yamllint not installed)"
        return
    fi

    local failed=0
    for workflow in "$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml; do
        if [ -f "$workflow" ]; then
            if ! yamllint -d relaxed "$workflow" &> /dev/null; then
                echo -e "${RED}FAIL${NC}"
                echo "  Invalid YAML: $workflow"
                failed=1
            fi
        fi
    done

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
}

# Test 2: Check required workflow files exist
test_required_workflows() {
    echo -n "Testing required workflows exist... "

    local required_workflows=(
        "ci.yaml"
        "docker-build-push.yml"
        "k8s-deploy.yml"
        "environment-promotion.yml"
        "rollback.yml"
        "web-tests.yml"
        "backend-tests.yml"
        "mobile-tests.yml"
        "playwright-tests.yml"
        "security-scan.yml"
    )

    local failed=0
    for workflow in "${required_workflows[@]}"; do
        if [ ! -f "$WORKFLOWS_DIR/$workflow" ]; then
            echo -e "${RED}FAIL${NC}"
            echo "  Missing workflow: $workflow"
            failed=1
        fi
    done

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
}

# Test 3: Check workflow names are unique
test_unique_workflow_names() {
    echo -n "Testing workflow names are unique... "

    local names=()
    for workflow in "$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml; do
        if [ -f "$workflow" ]; then
            name=$(grep -m 1 "^name:" "$workflow" | cut -d: -f2- | xargs)
            names+=("$name")
        fi
    done

    local unique_names=$(printf '%s\n' "${names[@]}" | sort -u | wc -l)
    local total_names=${#names[@]}

    if [ "$unique_names" -eq "$total_names" ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}FAIL${NC}"
        echo "  Duplicate workflow names found"
        ((FAILED_TESTS++))
    fi
}

# Test 4: Check workflows have concurrency control
test_concurrency_control() {
    echo -n "Testing workflows have concurrency control... "

    local critical_workflows=(
        "docker-build-push.yml"
        "k8s-deploy.yml"
        "environment-promotion.yml"
        "rollback.yml"
    )

    local failed=0
    for workflow in "${critical_workflows[@]}"; do
        if [ -f "$WORKFLOWS_DIR/$workflow" ]; then
            if ! grep -q "concurrency:" "$WORKFLOWS_DIR/$workflow"; then
                echo -e "${RED}FAIL${NC}"
                echo "  Missing concurrency control: $workflow"
                failed=1
            fi
        fi
    done

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
}

# Test 5: Check timeout settings
test_timeout_settings() {
    echo -n "Testing timeout settings... "

    local failed=0
    for workflow in "$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml; do
        if [ -f "$workflow" ]; then
            # Check for timeout-minutes in long-running jobs
            if grep -q "docker compose" "$workflow" || grep -q "kubectl" "$workflow"; then
                if ! grep -q "timeout" "$workflow"; then
                    echo -e "${YELLOW}WARN${NC}"
                    echo "  Missing timeout: $workflow"
                fi
            fi
        fi
    done

    echo -e "${GREEN}PASS${NC}"
    ((PASSED_TESTS++))
}

# Test 6: Check security best practices
test_security_practices() {
    echo -n "Testing security best practices... "

    local failed=0

    # Check no hardcoded secrets
    for workflow in "$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml; do
        if [ -f "$workflow" ]; then
            if grep -qiE "(password|token|key):\s*['\"][^$]" "$workflow" 2>/dev/null; then
                echo -e "${RED}FAIL${NC}"
                echo "  Possible hardcoded secret in: $workflow"
                failed=1
            fi
        fi
    done

    # Check GITHUB_TOKEN usage
    if grep -r "GITHUB_TOKEN" "$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml | grep -q "password"; then
        : # Expected use of GITHUB_TOKEN
    fi

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
}

# Test 7: Check Docker workflows use caching
test_docker_caching() {
    echo -n "Testing Docker workflows use caching... "

    if [ -f "$WORKFLOWS_DIR/docker-build-push.yml" ]; then
        if grep -q "cache-from: type=gha" "$WORKFLOWS_DIR/docker-build-push.yml" && \
           grep -q "cache-to: type=gha" "$WORKFLOWS_DIR/docker-build-push.yml"; then
            echo -e "${GREEN}PASS${NC}"
            ((PASSED_TESTS++))
        else
            echo -e "${RED}FAIL${NC}"
            echo "  Docker caching not configured properly"
            ((FAILED_TESTS++))
        fi
    else
        echo -e "${YELLOW}SKIP${NC} (workflow not found)"
    fi
}

# Test 8: Check notification integration
test_notification_integration() {
    echo -n "Testing notification integration... "

    local workflows_with_notifications=0
    for workflow in "$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml; do
        if [ -f "$workflow" ]; then
            if grep -q "slack" "$workflow" || grep -q "notify" "$workflow"; then
                ((workflows_with_notifications++))
            fi
        fi
    done

    if [ $workflows_with_notifications -ge 3 ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${YELLOW}WARN${NC}"
        echo "  Only $workflows_with_notifications workflows have notifications"
        ((PASSED_TESTS++))
    fi
}

# Test 9: Check composite action exists
test_composite_action() {
    echo -n "Testing composite action exists... "

    if [ -f "$WORKFLOWS_DIR/../actions/notify-slack/action.yml" ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}FAIL${NC}"
        echo "  Composite action not found: notify-slack"
        ((FAILED_TESTS++))
    fi
}

# Test 10: Check workflow dependencies
test_workflow_dependencies() {
    echo -n "Testing workflow job dependencies... "

    local failed=0

    # Check ci.yaml has proper job dependencies
    if [ -f "$WORKFLOWS_DIR/ci.yaml" ]; then
        if ! grep -q "needs:" "$WORKFLOWS_DIR/ci.yaml"; then
            echo -e "${YELLOW}WARN${NC}"
            echo "  No job dependencies in ci.yaml"
        fi
    fi

    echo -e "${GREEN}PASS${NC}"
    ((PASSED_TESTS++))
}

# Run all tests
test_yaml_syntax
test_required_workflows
test_unique_workflow_names
test_concurrency_control
test_timeout_settings
test_security_practices
test_docker_caching
test_notification_integration
test_composite_action
test_workflow_dependencies

# Summary
echo ""
echo "========================================"
echo "  Test Summary"
echo "========================================"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
