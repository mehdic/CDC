#!/bin/bash

# MetaPharm Connect - Start Services for E2E/Contract Tests
# This script starts the minimum required services for contract testing

set -e

PROJECT_ROOT="/Users/mchaouachi/IdeaProjects/CDC/backend"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "Starting MetaPharm Services for Testing"
echo "=========================================="

# Load test environment
export NODE_ENV=test
export API_BASE_URL=http://localhost:4002
export API_GATEWAY_PORT=4002
export AUTH_SERVICE_PORT=4001
export PRESCRIPTION_SERVICE_PORT=4002

# JWT Configuration
export JWT_SECRET=test-jwt-secret-key-for-testing-only-do-not-use-in-production
export JWT_REFRESH_SECRET=test-refresh-secret-key-for-testing-only
export JWT_EXPIRES_IN=15m
export JWT_REFRESH_EXPIRES_IN=7d

# AWS Configuration (mocked)
export AWS_REGION=eu-central-1
export AWS_KMS_KEY_ID=arn:aws:kms:eu-central-1:123456789012:key/test-key-id
export AWS_ACCESS_KEY_ID=test-access-key
export AWS_SECRET_ACCESS_KEY=test-secret-key
export AWS_S3_BUCKET=test-bucket

# Database Configuration (in-memory for testing)
export DB_TYPE=sqlite
export DB_DATABASE=:memory:
export DB_SYNCHRONIZE=true

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        echo "   Process: $(lsof -Pi :$port -sTCP:LISTEN -t | head -1)"
        echo "   To kill: kill $(lsof -Pi :$port -sTCP:LISTEN -t | head -1)"
        return 1
    else
        echo "✓ Port $port is available"
        return 0
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local max_attempts=30
    local attempt=0

    echo "Waiting for service at $url..."

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✓ Service is ready"
            return 0
        fi

        attempt=$((attempt + 1))
        echo "  Attempt $attempt/$max_attempts..."
        sleep 1
    done

    echo "✗ Service failed to start after $max_attempts seconds"
    return 1
}

# Check required ports
echo ""
echo "Checking ports..."
check_port 4001 || {
    echo ""
    echo "To free port 4001: kill \$(lsof -ti:4001)"
    exit 1
}
check_port 4002 || {
    echo ""
    echo "To free port 4002: kill \$(lsof -ti:4002)"
    exit 1
}

# Start Auth Service
echo ""
echo "Starting Auth Service (Port 4001)..."
if [ -d "$PROJECT_ROOT/services/auth-service" ]; then
    cd "$PROJECT_ROOT/services/auth-service"
    npm run dev > /tmp/auth-service.log 2>&1 &
    AUTH_PID=$!
    echo "Auth Service PID: $AUTH_PID"
else
    echo "⚠️  Auth Service directory not found, skipping..."
    AUTH_PID=""
fi

# Start API Gateway
echo ""
echo "Starting API Gateway (Port 4002)..."
if [ -d "$PROJECT_ROOT/services/api-gateway" ]; then
    cd "$PROJECT_ROOT/services/api-gateway"
    npm run dev > /tmp/api-gateway.log 2>&1 &
    GATEWAY_PID=$!
    echo "API Gateway PID: $GATEWAY_PID"
else
    echo "⚠️  API Gateway directory not found, skipping..."
    GATEWAY_PID=""
fi

# Wait for services to be ready
echo ""
if [ -n "$AUTH_PID" ]; then
    wait_for_service "http://localhost:4001/health" || {
        echo "Failed to start Auth Service"
        echo "Check logs: tail -f /tmp/auth-service.log"
        [ -n "$AUTH_PID" ] && kill $AUTH_PID 2>/dev/null
        [ -n "$GATEWAY_PID" ] && kill $GATEWAY_PID 2>/dev/null
        exit 1
    }
fi

if [ -n "$GATEWAY_PID" ]; then
    wait_for_service "http://localhost:4002/health" || {
        echo "Failed to start API Gateway"
        echo "Check logs: tail -f /tmp/api-gateway.log"
        [ -n "$AUTH_PID" ] && kill $AUTH_PID 2>/dev/null
        [ -n "$GATEWAY_PID" ] && kill $GATEWAY_PID 2>/dev/null
        exit 1
    }
fi

echo ""
echo "=========================================="
echo "All services started successfully!"
echo "=========================================="
[ -n "$AUTH_PID" ] && echo "Auth Service:    http://localhost:4001 (PID: $AUTH_PID)"
[ -n "$GATEWAY_PID" ] && echo "API Gateway:     http://localhost:4002 (PID: $GATEWAY_PID)"
echo ""
echo "Logs:"
[ -n "$AUTH_PID" ] && echo "  Auth Service:  /tmp/auth-service.log"
[ -n "$GATEWAY_PID" ] && echo "  API Gateway:   /tmp/api-gateway.log"
echo ""
echo "To view logs:"
[ -n "$AUTH_PID" ] && echo "  tail -f /tmp/auth-service.log"
[ -n "$GATEWAY_PID" ] && echo "  tail -f /tmp/api-gateway.log"
echo ""
echo "To stop services:"
if [ -n "$AUTH_PID" ] && [ -n "$GATEWAY_PID" ]; then
    echo "  kill $AUTH_PID $GATEWAY_PID"
elif [ -n "$GATEWAY_PID" ]; then
    echo "  kill $GATEWAY_PID"
fi
echo ""
echo "To run contract tests:"
echo "  cd $PROJECT_ROOT"
echo "  npm run test:contract"
echo "  # OR"
echo "  jest tests/contract/prescription-api.test.ts --verbose"
echo ""
echo "To run E2E tests:"
echo "  cd $PROJECT_ROOT"
echo "  npm run test:e2e"
echo "=========================================="

# Save PIDs for cleanup
PIDS=""
[ -n "$AUTH_PID" ] && PIDS="$AUTH_PID"
[ -n "$GATEWAY_PID" ] && PIDS="$PIDS $GATEWAY_PID"

if [ -n "$PIDS" ]; then
    echo "$PIDS" > /tmp/metapharm-test-services.pid
    echo ""
    echo "PIDs saved to /tmp/metapharm-test-services.pid"
fi
