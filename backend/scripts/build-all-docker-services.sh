#!/bin/bash

#############################################
# Build All MetaPharm Connect Services
#############################################
# This script builds Docker images for all 31 microservices
# Usage: ./scripts/build-all-docker-services.sh [registry] [tag]
# Example: ./scripts/build-all-docker-services.sh metapharm-connect latest
#############################################

set -e

# Configuration
REGISTRY="${1:-metapharm-connect}"
TAG="${2:-latest}"
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Services to build (31 total)
SERVICES=(
  "adherence-service"
  "analytics-service"
  "api-gateway"
  "appointment-service"
  "auth-service"
  "calendar-service"
  "controlled-substance-service"
  "delivery-service"
  "digital-twin-service"
  "doctor-service"
  "ecommerce-service"
  "esante-service"
  "insurance-service"
  "inventory-service"
  "marketing-service"
  "medical-records-service"
  "messaging-service"
  "notification-service"
  "nurse-service"
  "order-service"
  "patient-service"
  "payment-service"
  "pharmacy-service"
  "prescription-service"
  "recycling-service"
  "refill-service"
  "subscription-service"
  "teleconsultation-service"
  "user-service"
  "vip-service"
  "voice-service"
)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MetaPharm Connect Docker Build Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Validate arguments
if [ -z "$REGISTRY" ]; then
  echo -e "${RED}Error: Registry name required${NC}"
  echo "Usage: $0 [registry] [tag]"
  exit 1
fi

# Verify we're in the right directory
if [ ! -f "$BACKEND_DIR/Dockerfile" ]; then
  echo -e "${RED}Error: Dockerfile not found in $BACKEND_DIR${NC}"
  exit 1
fi

# Check if npm run build is needed
echo -e "${YELLOW}Checking if TypeScript needs rebuilding...${NC}"
if [ ! -d "$BACKEND_DIR/dist/services/auth-service/src" ]; then
  echo -e "${YELLOW}Building TypeScript...${NC}"
  cd "$BACKEND_DIR"
  npm run build
  echo -e "${GREEN}✓ TypeScript built${NC}"
else
  echo -e "${GREEN}✓ TypeScript already built${NC}"
fi

echo ""
echo -e "${YELLOW}Building ${#SERVICES[@]} services...${NC}"
echo -e "${YELLOW}Registry: $REGISTRY${NC}"
echo -e "${YELLOW}Tag: $TAG${NC}"
echo ""

# Track build results
BUILT=0
FAILED=0
FAILED_SERVICES=()

# Build each service
for service in "${SERVICES[@]}"; do
  SERVICE_IMAGE="$REGISTRY/$service:$TAG"
  echo -e "${BLUE}[$(($BUILT + $FAILED + 1))/${#SERVICES[@]}]${NC} Building $service..."
  echo "  → Image: $SERVICE_IMAGE"

  cd "$BACKEND_DIR"

  if docker build \
    --build-arg SERVICE_NAME="$service" \
    --build-arg NODE_ENV=production \
    -t "$SERVICE_IMAGE" \
    -f Dockerfile \
    . > /tmp/docker_build_$service.log 2>&1; then

    echo -e "${GREEN}✓ $service built successfully${NC}"
    ((BUILT++))

  else
    echo -e "${RED}✗ Failed to build $service${NC}"
    echo -e "${RED}  Log: /tmp/docker_build_$service.log${NC}"
    tail -20 /tmp/docker_build_$service.log | sed 's/^/    /'
    ((FAILED++))
    FAILED_SERVICES+=("$service")
  fi

  echo ""
done

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Build Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Built: $BUILT/${#SERVICES[@]}${NC}"

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED/${#SERVICES[@]}${NC}"
  echo -e "${RED}Failed services:${NC}"
  for service in "${FAILED_SERVICES[@]}"; do
    echo -e "${RED}  - $service${NC}"
  done
  exit 1
else
  echo -e "${GREEN}All services built successfully!${NC}"
fi

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  docker-compose up -d       # Start all services"
echo "  docker ps                  # List running containers"
echo "  docker logs <container>    # View service logs"
echo ""
