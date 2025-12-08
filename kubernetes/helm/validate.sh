#!/bin/bash

# Helm Chart Validation Script for MetaPharm Connect
# This script validates the Helm chart using helm lint and template rendering

set -e

CHART_DIR="./charts/metapharm"
NAMESPACE="metapharm"

echo "🔍 MetaPharm Connect Helm Chart Validation"
echo "==========================================="
echo ""

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    echo "❌ ERROR: helm is not installed"
    echo "Please install Helm 3: https://helm.sh/docs/intro/install/"
    exit 1
fi

echo "✅ Helm version:"
helm version --short
echo ""

# 1. Lint the chart
echo "📋 Step 1: Linting Helm chart..."
helm lint "$CHART_DIR"
if [ $? -eq 0 ]; then
    echo "✅ Lint passed"
else
    echo "❌ Lint failed"
    exit 1
fi
echo ""

# 2. Lint with dev values
echo "📋 Step 2: Linting with development values..."
helm lint "$CHART_DIR" -f "$CHART_DIR/values-dev.yaml"
if [ $? -eq 0 ]; then
    echo "✅ Dev values lint passed"
else
    echo "❌ Dev values lint failed"
    exit 1
fi
echo ""

# 3. Lint with staging values
echo "📋 Step 3: Linting with staging values..."
helm lint "$CHART_DIR" -f "$CHART_DIR/values-staging.yaml"
if [ $? -eq 0 ]; then
    echo "✅ Staging values lint passed"
else
    echo "❌ Staging values lint failed"
    exit 1
fi
echo ""

# 4. Lint with production values
echo "📋 Step 4: Linting with production values..."
helm lint "$CHART_DIR" -f "$CHART_DIR/values-prod.yaml"
if [ $? -eq 0 ]; then
    echo "✅ Production values lint passed"
else
    echo "❌ Production values lint failed"
    exit 1
fi
echo ""

# 5. Dry-run template rendering (dev)
echo "📋 Step 5: Testing template rendering (development)..."
helm template metapharm "$CHART_DIR" \
    -f "$CHART_DIR/values-dev.yaml" \
    -n "$NAMESPACE" \
    --debug > /tmp/metapharm-dev-rendered.yaml 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Development template rendering successful"
    echo "   Output: /tmp/metapharm-dev-rendered.yaml"
else
    echo "❌ Development template rendering failed"
    cat /tmp/metapharm-dev-rendered.yaml
    exit 1
fi
echo ""

# 6. Dry-run template rendering (prod)
echo "📋 Step 6: Testing template rendering (production)..."
helm template metapharm "$CHART_DIR" \
    -f "$CHART_DIR/values-prod.yaml" \
    -n "$NAMESPACE" \
    --debug > /tmp/metapharm-prod-rendered.yaml 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Production template rendering successful"
    echo "   Output: /tmp/metapharm-prod-rendered.yaml"
else
    echo "❌ Production template rendering failed"
    cat /tmp/metapharm-prod-rendered.yaml
    exit 1
fi
echo ""

# 7. Validate Kubernetes schema (if kubectl is available)
if command -v kubectl &> /dev/null; then
    echo "📋 Step 7: Validating Kubernetes schema..."

    # Dev schema validation
    helm template metapharm "$CHART_DIR" \
        -f "$CHART_DIR/values-dev.yaml" \
        -n "$NAMESPACE" | \
        kubectl apply --dry-run=client -f - > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ Development schema validation passed"
    else
        echo "⚠️  Development schema validation had warnings"
    fi

    # Prod schema validation
    helm template metapharm "$CHART_DIR" \
        -f "$CHART_DIR/values-prod.yaml" \
        -n "$NAMESPACE" | \
        kubectl apply --dry-run=client -f - > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ Production schema validation passed"
    else
        echo "⚠️  Production schema validation had warnings"
    fi
else
    echo "⚠️  kubectl not found, skipping schema validation"
fi
echo ""

# 8. Run Helm unit tests (if plugin is installed)
if helm plugin list | grep -q unittest; then
    echo "📋 Step 8: Running Helm unit tests..."
    helm unittest "$CHART_DIR"
    if [ $? -eq 0 ]; then
        echo "✅ Unit tests passed"
    else
        echo "❌ Unit tests failed"
        exit 1
    fi
else
    echo "⚠️  helm-unittest plugin not installed, skipping unit tests"
    echo "   Install with: helm plugin install https://github.com/helm-unittest/helm-unittest"
fi
echo ""

# 9. Check for required secrets documentation
echo "📋 Step 9: Checking documentation..."
if [ -f "$CHART_DIR/../README.md" ]; then
    echo "✅ README.md exists"
else
    echo "❌ README.md not found"
    exit 1
fi
echo ""

# Summary
echo "==========================================="
echo "✅ All validation checks passed!"
echo ""
echo "Next steps:"
echo "1. Install to development: helm install metapharm $CHART_DIR -f $CHART_DIR/values-dev.yaml -n $NAMESPACE"
echo "2. Or use Helmfile: helmfile -e dev sync"
echo ""
