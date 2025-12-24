#!/bin/bash

################################################################################
# Manifest Validation Tests
# Validates Kustomize configurations and manifests
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0

# Test result tracking
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS_COUNT++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL_COUNT++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Change to kubernetes directory
cd "$(dirname "$0")/.."

echo "==========================================="
echo "Kubernetes Manifest Validation Tests"
echo "==========================================="
echo ""

# Test 1: Kustomize build succeeds
echo "Test 1: Kustomize Build"
echo "-----------------------"

for env in dev staging prod; do
    if kubectl kustomize "overlays/$env" > /dev/null 2>&1; then
        pass "Kustomize build successful: $env"
    else
        fail "Kustomize build failed: $env"
    fi
done

echo ""

# Test 2: No secrets in Git
echo "Test 2: Secret Leakage Check"
echo "----------------------------"

if ! grep -r "POSTGRES_PASSWORD.*=.*[^c][^h][^a][^n][^g][^e][^m][^e]" overlays/ 2>/dev/null; then
    pass "No hardcoded passwords found in overlays"
else
    fail "Hardcoded passwords detected in overlays"
fi

echo ""

# Test 3: Image tags are pinned (no :latest in prod)
echo "Test 3: Image Tag Validation"
echo "-----------------------------"

if ! kubectl kustomize overlays/prod | grep -q "image:.*:latest"; then
    pass "Production uses pinned image tags (no :latest)"
else
    fail "Production has :latest tags (security risk)"
fi

echo ""

# Test 4: Security contexts are set
echo "Test 4: Security Context Validation"
echo "------------------------------------"

for env in dev staging prod; do
    manifests=$(kubectl kustomize "overlays/$env")

    if echo "$manifests" | grep -q "runAsNonRoot: true"; then
        pass "runAsNonRoot enabled in $env"
    else
        fail "runAsNonRoot missing in $env"
    fi

    if echo "$manifests" | grep -q "readOnlyRootFilesystem: true"; then
        pass "readOnlyRootFilesystem enabled in $env"
    else
        warn "readOnlyRootFilesystem not set in $env"
    fi
done

echo ""

# Test 5: Resource limits are set
echo "Test 5: Resource Limits Validation"
echo "-----------------------------------"

for env in dev staging prod; do
    manifests=$(kubectl kustomize "overlays/$env")

    if echo "$manifests" | grep -q "limits:"; then
        pass "Resource limits set in $env"
    else
        fail "Resource limits missing in $env"
    fi

    if echo "$manifests" | grep -q "requests:"; then
        pass "Resource requests set in $env"
    else
        fail "Resource requests missing in $env"
    fi
done

echo ""

# Test 6: Health probes are configured
echo "Test 6: Health Probe Validation"
echo "--------------------------------"

for env in dev staging prod; do
    manifests=$(kubectl kustomize "overlays/$env")

    if echo "$manifests" | grep -q "livenessProbe:"; then
        pass "Liveness probes configured in $env"
    else
        fail "Liveness probes missing in $env"
    fi

    if echo "$manifests" | grep -q "readinessProbe:"; then
        pass "Readiness probes configured in $env"
    else
        fail "Readiness probes missing in $env"
    fi

    if echo "$manifests" | grep -q "startupProbe:"; then
        pass "Startup probes configured in $env"
    else
        warn "Startup probes missing in $env (recommended)"
    fi
done

echo ""

# Test 7: HPA configured
echo "Test 7: HPA Validation"
echo "----------------------"

for env in dev staging prod; do
    if kubectl kustomize "overlays/$env" | grep -q "kind: HorizontalPodAutoscaler"; then
        pass "HPA configured in $env"
    else
        fail "HPA missing in $env"
    fi
done

echo ""

# Test 8: Production-specific checks
echo "Test 8: Production Safety Checks"
echo "---------------------------------"

prod_manifests=$(kubectl kustomize overlays/prod)

if echo "$prod_manifests" | grep -q "kind: PodDisruptionBudget"; then
    pass "PodDisruptionBudgets configured in production"
else
    fail "PodDisruptionBudgets missing in production"
fi

if echo "$prod_manifests" | grep -q "podAntiAffinity:"; then
    pass "Pod anti-affinity configured in production"
else
    fail "Pod anti-affinity missing in production"
fi

if echo "$prod_manifests" | grep -q "minAvailable:"; then
    pass "PDB minAvailable set in production"
else
    fail "PDB minAvailable missing in production"
fi

echo ""

# Test 9: Namespace consistency
echo "Test 9: Namespace Validation"
echo "-----------------------------"

dev_ns=$(kubectl kustomize overlays/dev | grep "namespace:" | head -1 | awk '{print $2}')
staging_ns=$(kubectl kustomize overlays/staging | grep "namespace:" | head -1 | awk '{print $2}')
prod_ns=$(kubectl kustomize overlays/prod | grep "namespace:" | head -1 | awk '{print $2}')

if [ "$dev_ns" = "metapharm-dev" ]; then
    pass "Dev namespace is metapharm-dev"
else
    fail "Dev namespace incorrect: $dev_ns"
fi

if [ "$staging_ns" = "metapharm-staging" ]; then
    pass "Staging namespace is metapharm-staging"
else
    fail "Staging namespace incorrect: $staging_ns"
fi

if [ "$prod_ns" = "metapharm" ]; then
    pass "Production namespace is metapharm"
else
    fail "Production namespace incorrect: $prod_ns"
fi

echo ""

# Summary
echo "==========================================="
echo "Validation Summary"
echo "==========================================="
echo -e "${GREEN}Passed:${NC} $PASS_COUNT"
echo -e "${RED}Failed:${NC} $FAIL_COUNT"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed!${NC}"
    exit 1
fi
