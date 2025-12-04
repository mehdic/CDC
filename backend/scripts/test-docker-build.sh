#!/bin/bash

#############################################
# Test Docker Build for Services
#############################################
# Validates that the Dockerfile can successfully
# build different services
#############################################

set -e

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="${1:-metapharm-connect}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Docker Build Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test services (covering different types)
TEST_SERVICES=(
  "api-gateway"
  "auth-service"
  "user-service"
  "pharmacy-service"
  "prescription-service"
)

echo -e "${YELLOW}Building TypeScript...${NC}"
cd "$BACKEND_DIR"
npm run build
echo -e "${GREEN}✓ TypeScript built${NC}"
echo ""

echo -e "${YELLOW}Testing Docker builds for ${#TEST_SERVICES[@]} services...${NC}"
echo ""

PASSED=0
FAILED=0

for service in "${TEST_SERVICES[@]}"; do
  echo -e "${BLUE}Testing: $service${NC}"

  # Check if dist path exists
  if [ ! -f "$BACKEND_DIR/dist/services/$service/src/index.js" ]; then
    echo -e "${RED}✗ Service files not found at dist/services/$service/src/index.js${NC}"
    ((FAILED++))
    continue
  fi

  # Try to build the service
  if docker build \
    --build-arg SERVICE_NAME="$service" \
    -t "$REGISTRY/$service:test" \
    -f "$BACKEND_DIR/Dockerfile" \
    "$BACKEND_DIR" > /tmp/test_build_$service.log 2>&1; then

    # Verify the image was created
    if docker inspect "$REGISTRY/$service:test" > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Build successful${NC}"
      echo "  Image: $REGISTRY/$service:test"

      # Get image size
      SIZE=$(docker images "$REGISTRY/$service:test" --format="{{.Size}}")
      echo "  Size: $SIZE"

      ((PASSED++))
    else
      echo -e "${RED}✗ Image creation failed${NC}"
      ((FAILED++))
    fi

  else
    echo -e "${RED}✗ Build failed${NC}"
    echo -e "${YELLOW}Last 15 lines of build log:${NC}"
    tail -15 /tmp/test_build_$service.log | sed 's/^/  /'
    ((FAILED++))
  fi

  echo ""
done

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Results${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Passed: $PASSED/${#TEST_SERVICES[@]}${NC}"

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED/${#TEST_SERVICES[@]}${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed!${NC}"
  echo ""
  echo -e "${YELLOW}Built images:${NC}"
  docker images "$REGISTRY/*:test" --format="table {{.Repository}}\t{{.Size}}"
fi
