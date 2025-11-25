# Contract Test Setup Guide

## Overview

This guide explains how to run the 26 contract tests for the Prescription API that were excluded from the standard test suite because they require running backend services.

**Contract tests validate API contracts:**
- Request/response schemas match specification
- HTTP status codes are correct
- Error responses follow standard format
- Headers are properly set
- Content types are correct

**Test Location:** `backend/tests/contract/prescription-api.test.ts`
**Test Count:** 26 contract tests
**Technology:** Supertest + Zod schema validation

---

## Architecture Overview

The MetaPharm Connect backend uses a microservices architecture:

```
┌─────────────────────┐
│   API Gateway       │  Port 4000 (or 4002 for tests)
│   (Entry Point)     │
└──────────┬──────────┘
           │
           ├──────────> Auth Service (Port 4001)
           ├──────────> Prescription Service (Port 4002)
           ├──────────> Teleconsultation Service (Port 4003)
           ├──────────> Inventory Service (Port 4004)
           └──────────> Other Services...
```

**Contract tests expect:**
- API Gateway running on port 4002 OR set `API_BASE_URL` env variable
- Mock authentication tokens (MOCK_PHARMACIST_TOKEN, MOCK_PATIENT_TOKEN)
- Test database seeded with test data

---

## Prerequisites

### 1. System Requirements

- Node.js >= 20.0.0
- PostgreSQL 16+ (for full integration) OR SQLite (for E2E in-memory)
- Redis (optional, for rate limiting)

### 2. Install Dependencies

```bash
cd /Users/mchaouachi/IdeaProjects/CDC/backend
npm install
```

### 3. Environment Variables

Create a `.env.test` file in `/backend` directory:

```bash
# Node Environment
NODE_ENV=test

# API Base URL for contract tests
API_BASE_URL=http://localhost:4002

# Database Configuration (in-memory SQLite for testing)
DB_TYPE=sqlite
DB_DATABASE=:memory:
DB_SYNCHRONIZE=true

# JWT Configuration
JWT_SECRET=test-jwt-secret-key-for-testing-only-do-not-use-in-production
JWT_REFRESH_SECRET=test-refresh-secret-key-for-testing-only
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS Configuration (mocked in tests)
AWS_REGION=eu-central-1
AWS_KMS_KEY_ID=arn:aws:kms:eu-central-1:123456789012:key/test-key-id
AWS_ACCESS_KEY_ID=test-access-key
AWS_SECRET_ACCESS_KEY=test-secret-key
AWS_S3_BUCKET=test-bucket

# Service Ports
API_GATEWAY_PORT=4002
PRESCRIPTION_SERVICE_PORT=4002
AUTH_SERVICE_PORT=4001

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600
```

---

## Method 1: Run Contract Tests with Jest (Recommended)

### Current Status

The contract tests are currently **specifications only** - they define the expected API behavior but do not have live services running behind them.

**To run contract tests:**

```bash
cd /Users/mchaouachi/IdeaProjects/CDC/backend

# Set the API base URL
export API_BASE_URL=http://localhost:4002

# Run contract tests
npm run test:contract
# OR
jest tests/contract/prescription-api.test.ts
```

**Expected Result:**
- Tests will attempt to connect to `http://localhost:4002`
- If no service is running, tests will fail with connection errors
- If API Gateway is running, tests will validate API contracts

---

## Method 2: Start Services Manually

### Step 1: Start API Gateway

```bash
cd /Users/mchaouachi/IdeaProjects/CDC/backend/services/api-gateway

# Install dependencies (if not done)
npm install

# Set port to 4002 for contract tests
export API_GATEWAY_PORT=4002

# Start the gateway
npm run dev
# OR
ts-node src/index.ts
```

**Verify API Gateway is running:**
```bash
curl http://localhost:4002/health
# Expected: {"status": "healthy", ...}
```

### Step 2: Start Prescription Service (if needed)

The API Gateway forwards `/prescriptions` requests to the Prescription Service on port 4002 (by default).

**If running full microservices:**

```bash
cd /Users/mchaouachi/IdeaProjects/CDC/backend/services/prescription-service

# Install dependencies
npm install

# Start the service
npm run dev
# OR
ts-node src/index.ts
```

**Verify Prescription Service:**
```bash
curl http://localhost:4002/health
# Expected: service health status
```

### Step 3: Start Auth Service (for authentication)

```bash
cd /Users/mchaouachi/IdeaProjects/CDC/backend/services/auth-service

# Install dependencies
npm install

# Set port
export AUTH_SERVICE_PORT=4001

# Start the service
npm run dev
```

### Step 4: Run Contract Tests

```bash
cd /Users/mchaouachi/IdeaProjects/CDC/backend

# Run tests
jest tests/contract/prescription-api.test.ts --verbose
```

---

## Method 3: Start All Services with Script

### Create Service Startup Script

Create `backend/scripts/start-services-for-tests.sh`:

```bash
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

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
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
check_port 4001 || exit 1
check_port 4002 || exit 1

# Start Auth Service
echo ""
echo "Starting Auth Service (Port 4001)..."
cd "$PROJECT_ROOT/services/auth-service"
npm run dev > /tmp/auth-service.log 2>&1 &
AUTH_PID=$!
echo "Auth Service PID: $AUTH_PID"

# Start API Gateway
echo ""
echo "Starting API Gateway (Port 4002)..."
cd "$PROJECT_ROOT/services/api-gateway"
npm run dev > /tmp/api-gateway.log 2>&1 &
GATEWAY_PID=$!
echo "API Gateway PID: $GATEWAY_PID"

# Wait for services to be ready
echo ""
wait_for_service "http://localhost:4001/health" || {
    echo "Failed to start Auth Service"
    kill $AUTH_PID $GATEWAY_PID 2>/dev/null
    exit 1
}

wait_for_service "http://localhost:4002/health" || {
    echo "Failed to start API Gateway"
    kill $AUTH_PID $GATEWAY_PID 2>/dev/null
    exit 1
}

echo ""
echo "=========================================="
echo "All services started successfully!"
echo "=========================================="
echo "Auth Service:    http://localhost:4001 (PID: $AUTH_PID)"
echo "API Gateway:     http://localhost:4002 (PID: $GATEWAY_PID)"
echo ""
echo "Logs:"
echo "  Auth Service:  /tmp/auth-service.log"
echo "  API Gateway:   /tmp/api-gateway.log"
echo ""
echo "To stop services:"
echo "  kill $AUTH_PID $GATEWAY_PID"
echo ""
echo "To run contract tests:"
echo "  cd $PROJECT_ROOT"
echo "  npm run test:contract"
echo "=========================================="

# Save PIDs for cleanup
echo "$AUTH_PID $GATEWAY_PID" > /tmp/metapharm-test-services.pid
```

**Make script executable:**
```bash
chmod +x backend/scripts/start-services-for-tests.sh
```

**Run the script:**
```bash
./backend/scripts/start-services-for-tests.sh
```

**Stop services:**
```bash
# Read PIDs and kill services
kill $(cat /tmp/metapharm-test-services.pid)
```

---

## Mock Tokens and Test Data

### Mock Authentication Tokens

The contract tests use mock tokens for authentication:

```typescript
const MOCK_PHARMACIST_TOKEN = 'mock-pharmacist-token';
const MOCK_PATIENT_TOKEN = 'mock-patient-token';
```

**For real integration:**
1. Generate real JWT tokens using the Auth Service
2. Seed test database with test users (pharmacist, patient)
3. Use real tokens in test requests

### Test Data Setup

**Seed test database:**

```bash
cd /Users/mchaouachi/IdeaProjects/CDC/backend

# Run seed script (if available)
npm run seed:test

# OR manually create test users
psql -d metapharm_connect_test -f create-test-users.sql
```

**Test users needed:**
- Pharmacist: pharmacist-789 (for approval/rejection operations)
- Patient: patient-123 (for prescription uploads)
- Doctor: doctor-012 (for prescription records)
- Pharmacy: pharmacy-123 (for multi-tenancy)

---

## Contract Test Coverage

### 26 Contract Tests Breakdown

#### 1. POST /prescriptions (4 tests)
- ✅ Successful upload (201 Created)
- ✅ Missing file error (400 Bad Request)
- ✅ Unauthorized request (401 Unauthorized)
- ✅ File too large error (413 Payload Too Large)

#### 2. GET /prescriptions (3 tests)
- ✅ List prescriptions (200 OK)
- ✅ Pagination query parameters
- ✅ Filtering by status

#### 3. GET /prescriptions/:id (2 tests)
- ✅ Get single prescription (200 OK)
- ✅ Not found error (404 Not Found)

#### 4. POST /prescriptions/:id/transcribe (2 tests)
- ✅ Successful transcription (200 OK)
- ✅ Forbidden for patients (403 Forbidden)

#### 5. POST /prescriptions/:id/validate (2 tests)
- ✅ Validation result (200 OK)
- ✅ Prescription without items (400 Bad Request)

#### 6. PUT /prescriptions/:id/approve (3 tests)
- ✅ Successful approval (200 OK)
- ✅ Missing pharmacist_id (400 Bad Request)
- ✅ Invalid state transition (400 Bad Request)

#### 7. PUT /prescriptions/:id/reject (2 tests)
- ✅ Successful rejection (200 OK)
- ✅ Missing rejection_reason (400 Bad Request)

#### 8. HTTP Headers (3 tests)
- ✅ Content-Type header for JSON responses
- ✅ CORS headers
- ✅ Security headers (Helmet)

#### 9. Error Response Format (3 tests)
- ✅ Consistent 400 error format
- ✅ Consistent 404 error format
- ✅ Consistent 500 error format

#### 10. Request Validation (2 tests)
- ✅ UUID format validation
- ✅ Enum values validation

**Total: 26 contract tests**

---

## Running Contract Tests - Full Workflow

### Complete End-to-End Workflow

```bash
# 1. Navigate to backend directory
cd /Users/mchaouachi/IdeaProjects/CDC/backend

# 2. Install dependencies (if not done)
npm install

# 3. Start services for testing
./scripts/start-services-for-tests.sh

# 4. Wait for services to be ready (30 seconds)

# 5. Run contract tests
npm run test:contract
# OR
jest tests/contract/prescription-api.test.ts --verbose

# 6. View results
# - All 26 tests should validate API contracts
# - Schema validation using Zod
# - HTTP status codes verified
# - Error formats verified

# 7. Stop services
kill $(cat /tmp/metapharm-test-services.pid)

# 8. Clean up
rm /tmp/metapharm-test-services.pid
rm /tmp/auth-service.log /tmp/api-gateway.log
```

---

## E2E Tests

### E2E Test Files

In addition to contract tests, there are E2E tests that also require running services:

```bash
backend/tests/e2e/
├── basic-functionality.test.ts       # Basic API functionality
├── delivery-workflow.test.ts         # Delivery workflow E2E
├── health-checks.test.ts             # Health check endpoints
├── inventory-restock-workflow.test.ts # Inventory restocking
├── inventory-scanning.test.ts        # QR code scanning
├── prescription-review.test.ts       # Prescription review workflow
├── prescription-upload.test.ts       # Prescription upload workflow
├── prescription-workflow.test.ts     # Full prescription workflow
├── teleconsultation-workflow.test.ts # Teleconsultation E2E
└── teleconsultation.test.ts          # Teleconsultation tests
```

**Run all E2E tests:**
```bash
npm run test:e2e
# OR
jest --config jest.e2e.config.js
```

**E2E tests use:**
- In-memory SQLite database (`:memory:`)
- Mock AWS services (S3, Textract, KMS)
- Test JWT tokens
- Supertest for HTTP requests

---

## Troubleshooting

### Issue 1: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::4002
```

**Solution:**
```bash
# Find process using port 4002
lsof -i :4002

# Kill the process
kill -9 <PID>

# Or kill all node processes
pkill -f node
```

### Issue 2: Connection Refused

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:4002
```

**Solution:**
- Ensure services are actually started
- Check service logs for startup errors
- Verify ports are correct in `.env.test`
- Wait longer for services to initialize

### Issue 3: Authentication Failures

**Error:**
```
401 Unauthorized - Invalid token
```

**Solution:**
- Contract tests use mock tokens by default
- For real integration, generate real JWT tokens
- Seed test database with test users
- Configure JWT_SECRET in `.env.test`

### Issue 4: Database Connection Errors

**Error:**
```
Database connection failed
```

**Solution:**
- E2E tests use in-memory SQLite by default
- Check `DB_TYPE=sqlite` and `DB_DATABASE=:memory:` in env
- For PostgreSQL, ensure database exists and is accessible
- Run migrations if needed: `npm run migrate:up`

### Issue 5: Schema Validation Failures

**Error:**
```
Zod validation error: Expected uuid, received string
```

**Solution:**
- API response doesn't match contract schema
- Check API implementation matches OpenAPI spec
- Update schema in contract test if API intentionally changed
- Review validation error details in test output

---

## Common Issues and Solutions

### Mock vs Real Services

**Contract tests can run in two modes:**

1. **Mock Mode (Current):**
   - Tests use mock tokens
   - No real authentication
   - Fast execution
   - Limited validation

2. **Real Mode (Full Integration):**
   - Real services running
   - Real database
   - Real JWT tokens
   - Complete end-to-end validation

**To switch to Real Mode:**
1. Start all required services
2. Seed test database
3. Generate real JWT tokens
4. Replace mock tokens in tests
5. Run contract tests

---

## Performance Considerations

- **Contract tests:** Fast (~2-5 seconds for 26 tests)
- **E2E tests:** Slower (~30-60 seconds for full suite)
- **With real services:** Add 10-20 seconds for startup time
- **Parallel execution:** Not recommended (port conflicts)

**Optimization tips:**
- Use in-memory SQLite for E2E tests
- Mock external services (AWS, Twilio)
- Run contract tests in CI/CD without starting services
- Use Docker Compose for consistent service startup

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Contract Tests

on: [push, pull_request]

jobs:
  contract-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: metapharm_test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd backend
          npm install

      - name: Start services
        run: |
          cd backend
          ./scripts/start-services-for-tests.sh

      - name: Run contract tests
        run: |
          cd backend
          npm run test:contract

      - name: Stop services
        if: always()
        run: |
          kill $(cat /tmp/metapharm-test-services.pid) || true
```

---

## Summary

**Contract tests validate:**
- ✅ API request/response schemas
- ✅ HTTP status codes
- ✅ Error response formats
- ✅ Header configurations
- ✅ Authentication requirements
- ✅ RBAC enforcement
- ✅ Input validation
- ✅ Content-Type headers

**To run contract tests:**
1. Start API Gateway on port 4002
2. Set `API_BASE_URL=http://localhost:4002`
3. Run `npm run test:contract`

**Benefits:**
- Detect breaking API changes before deployment
- Validate API documentation matches implementation
- Enable safe microservice integration
- Provide contract guarantees for frontend/mobile apps

---

## Additional Resources

- **OpenAPI Specification:** `backend/contracts/openapi.yaml` (to be created)
- **Test Data:** `backend/tests/fixtures/` (to be created)
- **Service Architecture:** `docs/architecture.md`
- **API Documentation:** `docs/api-reference.md`

---

## Contact

For questions or issues with contract tests:
- Check service logs in `/tmp/`
- Review test output for detailed error messages
- Consult API Gateway README: `backend/services/api-gateway/README.md`
- Consult Prescription Service README: `backend/services/prescription-service/README.md`
