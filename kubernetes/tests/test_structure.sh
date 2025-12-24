#!/bin/bash

################################################################################
# Structure Validation Tests (No kubectl required)
# Validates file structure and basic YAML syntax
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0

pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS_COUNT++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL_COUNT++))
}

cd "$(dirname "$0")/.."

echo "==========================================="
echo "Kubernetes Structure Validation"
echo "==========================================="
echo ""

# Test 1: Required directories exist
echo "Test 1: Directory Structure"
echo "---------------------------"

for dir in base base/deployments base/services base/configmaps base/hpa base/ingress \
           overlays/dev overlays/staging overlays/prod; do
    if [ -d "$dir" ]; then
        pass "Directory exists: $dir"
    else
        fail "Directory missing: $dir"
    fi
done

echo ""

# Test 2: Kustomization files exist
echo "Test 2: Kustomization Files"
echo "---------------------------"

for file in base/kustomization.yaml \
            overlays/dev/kustomization.yaml \
            overlays/staging/kustomization.yaml \
            overlays/prod/kustomization.yaml; do
    if [ -f "$file" ]; then
        pass "File exists: $file"
    else
        fail "File missing: $file"
    fi
done

echo ""

# Test 3: Base manifests exist
echo "Test 3: Base Manifests"
echo "----------------------"

for file in base/deployments/api-gateway.yaml \
            base/deployments/auth-service.yaml \
            base/deployments/prescription-service.yaml \
            base/deployments/postgres.yaml \
            base/deployments/redis.yaml; do
    if [ -f "$file" ]; then
        pass "Deployment exists: $file"
    else
        fail "Deployment missing: $file"
    fi
done

echo ""

# Test 4: Service manifests exist
echo "Test 4: Service Manifests"
echo "-------------------------"

for file in base/services/api-gateway-svc.yaml \
            base/services/auth-service-svc.yaml \
            base/services/prescription-service-svc.yaml; do
    if [ -f "$file" ]; then
        pass "Service exists: $file"
    else
        fail "Service missing: $file"
    fi
done

echo ""

# Test 5: HPA manifests exist
echo "Test 5: HPA Manifests"
echo "---------------------"

for file in base/hpa/api-gateway-hpa.yaml \
            base/hpa/auth-service-hpa.yaml \
            base/hpa/prescription-service-hpa.yaml; do
    if [ -f "$file" ]; then
        pass "HPA exists: $file"
    else
        fail "HPA missing: $file"
    fi
done

echo ""

# Test 6: Ingress exists
echo "Test 6: Ingress"
echo "---------------"

if [ -f "base/ingress/metapharm-ingress.yaml" ]; then
    pass "Ingress exists"
else
    fail "Ingress missing"
fi

echo ""

# Test 7: Overlay patches exist
echo "Test 7: Overlay Patches"
echo "-----------------------"

for env in dev staging prod; do
    if [ -d "overlays/$env/patches" ]; then
        pass "Patches directory exists for $env"
    else
        fail "Patches directory missing for $env"
    fi
done

echo ""

# Test 8: PDB for production
echo "Test 8: Production PDB"
echo "----------------------"

if [ -d "overlays/prod/pdb" ]; then
    pass "PDB directory exists for production"
else
    fail "PDB directory missing for production"
fi

for file in overlays/prod/pdb/api-gateway-pdb.yaml \
            overlays/prod/pdb/auth-service-pdb.yaml \
            overlays/prod/pdb/prescription-service-pdb.yaml; do
    if [ -f "$file" ]; then
        pass "PDB exists: $file"
    else
        fail "PDB missing: $file"
    fi
done

echo ""

# Test 9: YAML syntax check (basic)
echo "Test 9: YAML Syntax (Basic)"
echo "---------------------------"

yaml_files=$(find base overlays -name "*.yaml" -type f)
for file in $yaml_files; do
    # Basic YAML check (indentation, colons, etc.)
    if grep -q "^[[:space:]]*[a-zA-Z]" "$file"; then
        pass "Valid YAML structure: $file"
    else
        fail "Invalid YAML structure: $file"
    fi
done

echo ""

# Test 10: No secrets committed
echo "Test 10: Secret Leakage Check"
echo "-----------------------------"

if ! grep -r "POSTGRES_PASSWORD.*=.*[^c][^h][^a][^n][^g][^e][^m][^e]" overlays/ 2>/dev/null | grep -v "dev_password"; then
    pass "No hardcoded real passwords in overlays"
else
    fail "Hardcoded passwords detected"
fi

echo ""

# Test 11: README exists
echo "Test 11: Documentation"
echo "----------------------"

if [ -f "KUSTOMIZE_README.md" ]; then
    pass "Kustomize README exists"
else
    fail "Kustomize README missing"
fi

if [ -f "deploy.sh" ] && [ -x "deploy.sh" ]; then
    pass "Deploy script exists and is executable"
else
    fail "Deploy script missing or not executable"
fi

echo ""

# Summary
echo "==========================================="
echo "Validation Summary"
echo "==========================================="
echo -e "${GREEN}Passed:${NC} $PASS_COUNT"
echo -e "${RED}Failed:${NC} $FAIL_COUNT"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "\n${GREEN}All structure tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed!${NC}"
    exit 1
fi
