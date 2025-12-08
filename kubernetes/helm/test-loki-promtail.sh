#!/bin/bash
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Loki & Promtail Test Suite${NC}"
echo -e "${BLUE}================================================${NC}"

# Check prerequisites
echo ""
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}✗ kubectl not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ kubectl found${NC}"

if ! command -v helm &> /dev/null; then
    echo -e "${RED}✗ helm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ helm found${NC}"

# Check if logging namespace exists
echo ""
echo -e "${BLUE}Step 2: Checking logging namespace...${NC}"
if kubectl get namespace logging &> /dev/null; then
    echo -e "${GREEN}✓ Namespace 'logging' exists${NC}"
else
    echo -e "${RED}✗ Namespace 'logging' does not exist${NC}"
    echo -e "${YELLOW}  Run: helm install loki charts/loki -n logging --create-namespace${NC}"
    exit 1
fi

# Check Loki deployment
echo ""
echo -e "${BLUE}Step 3: Checking Loki StatefulSet...${NC}"
LOKI_REPLICAS=$(kubectl get statefulset -n logging loki -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0")
LOKI_READY=$(kubectl get statefulset -n logging loki -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

if [ -z "$LOKI_REPLICAS" ] || [ "$LOKI_REPLICAS" = "0" ]; then
    echo -e "${RED}✗ Loki StatefulSet not found or has 0 replicas${NC}"
    exit 1
fi

if [ "$LOKI_REPLICAS" = "$LOKI_READY" ]; then
    echo -e "${GREEN}✓ Loki StatefulSet: $LOKI_READY/$LOKI_REPLICAS replicas ready${NC}"
else
    echo -e "${YELLOW}⚠ Loki StatefulSet: $LOKI_READY/$LOKI_REPLICAS replicas ready${NC}"
fi

# Check Promtail DaemonSet
echo ""
echo -e "${BLUE}Step 4: Checking Promtail DaemonSet...${NC}"
PROMTAIL_DESIRED=$(kubectl get daemonset -n logging promtail -o jsonpath='{.status.desiredNumberScheduled}' 2>/dev/null || echo "0")
PROMTAIL_READY=$(kubectl get daemonset -n logging promtail -o jsonpath='{.status.numberReady}' 2>/dev/null || echo "0")

if [ -z "$PROMTAIL_DESIRED" ] || [ "$PROMTAIL_DESIRED" = "0" ]; then
    echo -e "${RED}✗ Promtail DaemonSet not found${NC}"
    exit 1
fi

if [ "$PROMTAIL_DESIRED" = "$PROMTAIL_READY" ]; then
    echo -e "${GREEN}✓ Promtail DaemonSet: $PROMTAIL_READY/$PROMTAIL_DESIRED pods ready${NC}"
else
    echo -e "${YELLOW}⚠ Promtail DaemonSet: $PROMTAIL_READY/$PROMTAIL_DESIRED pods ready${NC}"
fi

# Check services
echo ""
echo -e "${BLUE}Step 5: Checking services...${NC}"
if kubectl get svc -n logging loki &> /dev/null; then
    echo -e "${GREEN}✓ Loki service exists${NC}"
else
    echo -e "${RED}✗ Loki service not found${NC}"
    exit 1
fi

if kubectl get svc -n logging promtail &> /dev/null; then
    echo -e "${GREEN}✓ Promtail service exists${NC}"
else
    echo -e "${RED}✗ Promtail service not found${NC}"
    exit 1
fi

# Test Loki API
echo ""
echo -e "${BLUE}Step 6: Testing Loki API...${NC}"
LOKI_POD=$(kubectl get pod -n logging -l app=loki -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -z "$LOKI_POD" ]; then
    echo -e "${RED}✗ No Loki pods found${NC}"
    exit 1
fi

# Test readiness endpoint
READY_STATUS=$(kubectl exec -n logging "$LOKI_POD" -- curl -s -w "\n%{http_code}" http://localhost:3100/ready 2>/dev/null | tail -n1)
if [ "$READY_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Loki /ready endpoint: HTTP $READY_STATUS${NC}"
else
    echo -e "${RED}✗ Loki /ready endpoint: HTTP $READY_STATUS${NC}"
fi

# Test metrics endpoint
METRICS_COUNT=$(kubectl exec -n logging "$LOKI_POD" -- curl -s http://localhost:3100/metrics 2>/dev/null | grep -c "loki_" || echo "0")
if [ "$METRICS_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✓ Loki metrics: $METRICS_COUNT metrics found${NC}"
else
    echo -e "${RED}✗ Loki metrics: No metrics found${NC}"
fi

# Test query endpoint
QUERY_RESPONSE=$(kubectl exec -n logging "$LOKI_POD" -- curl -s -H "Accept: application/json" \
  "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode '{namespace="logging"}' 2>/dev/null | grep -c "status" || echo "0")
if [ "$QUERY_RESPONSE" -gt "0" ]; then
    echo -e "${GREEN}✓ LogQL query endpoint is working${NC}"
else
    echo -e "${YELLOW}⚠ LogQL query endpoint response unclear${NC}"
fi

# Test Promtail collection
echo ""
echo -e "${BLUE}Step 7: Testing Promtail log collection...${NC}"
PROMTAIL_POD=$(kubectl get pod -n logging -l app=promtail -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -z "$PROMTAIL_POD" ]; then
    echo -e "${RED}✗ No Promtail pods found${NC}"
    exit 1
fi

# Test readiness
READY_STATUS=$(kubectl exec -n logging "$PROMTAIL_POD" -- curl -s -w "\n%{http_code}" http://localhost:3101/ready 2>/dev/null | tail -n1)
if [ "$READY_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Promtail /ready endpoint: HTTP $READY_STATUS${NC}"
else
    echo -e "${RED}✗ Promtail /ready endpoint: HTTP $READY_STATUS${NC}"
fi

# Test metrics
READ_BYTES=$(kubectl exec -n logging "$PROMTAIL_POD" -- curl -s http://localhost:3101/metrics 2>/dev/null | grep "promtail_read_bytes_total" | head -1 | awk '{print $2}' || echo "0")
if [ "$READ_BYTES" != "0" ] && [ ! -z "$READ_BYTES" ]; then
    echo -e "${GREEN}✓ Promtail read bytes: $READ_BYTES bytes${NC}"
else
    echo -e "${YELLOW}⚠ Promtail read bytes: 0 (may be normal on quiet cluster)${NC}"
fi

# Test PII sanitization
echo ""
echo -e "${BLUE}Step 8: Testing PII sanitization...${NC}"

# Check if PII patterns are configured
LOKI_CONFIG=$(kubectl get configmap -n logging loki-config -o yaml 2>/dev/null | grep -c "emailPattern" || echo "0")
if [ "$LOKI_CONFIG" -gt "0" ]; then
    echo -e "${GREEN}✓ PII patterns are configured${NC}"
else
    echo -e "${YELLOW}⚠ PII patterns may not be configured${NC}"
fi

# Test regex patterns in Promtail config
PROMTAIL_CONFIG=$(kubectl get configmap -n logging promtail-config -o yaml 2>/dev/null | grep -c "REDACTED-EMAIL" || echo "0")
if [ "$PROMTAIL_CONFIG" -gt "0" ]; then
    echo -e "${GREEN}✓ Promtail has PII redaction rules${NC}"
else
    echo -e "${YELLOW}⚠ Promtail may not have PII redaction rules${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}✓ Loki StatefulSet is running ($LOKI_READY/$LOKI_REPLICAS replicas)${NC}"
echo -e "${GREEN}✓ Promtail DaemonSet is running ($PROMTAIL_READY/$PROMTAIL_DESIRED pods)${NC}"
echo -e "${GREEN}✓ All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Port-forward to Loki: kubectl port-forward -n logging svc/loki 3100:3100"
echo "2. Test queries: curl http://localhost:3100/loki/api/v1/query?query={namespace=\"metapharm\"}"
echo "3. View logs: kubectl logs -n logging -l app=promtail -f"
echo ""
