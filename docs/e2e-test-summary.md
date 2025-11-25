# E2E Test Summary

## Overview

This document provides a summary of all End-to-End (E2E) tests in the MetaPharm Connect backend.

**Total E2E Test Files:** 10
**Total E2E Test Cases:** 110

---

## E2E Test Breakdown

### 1. basic-functionality.test.ts
- **Test Count:** 17 tests
- **Purpose:** Basic API functionality and core features
- **Coverage:** Foundation API operations

### 2. delivery-workflow.test.ts
- **Test Count:** 2 tests
- **Purpose:** Delivery workflow end-to-end
- **Coverage:** Delivery request creation, status updates, GPS tracking

### 3. health-checks.test.ts
- **Test Count:** 2 tests
- **Purpose:** Service health check endpoints
- **Coverage:**
  - Inventory Service health check
  - Prescription Service health check
- **Services Tested:** Direct service imports (not through API Gateway)

### 4. inventory-restock-workflow.test.ts
- **Test Count:** 2 tests
- **Purpose:** Inventory restocking workflow
- **Coverage:** Low stock detection, restock orders, supplier integration

### 5. inventory-scanning.test.ts
- **Test Count:** 6 tests
- **Purpose:** QR code scanning for inventory management
- **Coverage:** Product scanning, stock updates, multi-pharmacy sync

### 6. prescription-review.test.ts
- **Test Count:** 27 tests
- **Purpose:** Prescription review and validation workflow
- **Coverage:**
  - Pharmacist prescription review
  - Drug interaction checking
  - Allergy warnings
  - Approval/rejection flows
  - State machine validation

### 7. prescription-upload.test.ts
- **Test Count:** 20 tests
- **Purpose:** Prescription upload and processing
- **Coverage:**
  - Patient prescription uploads
  - Image validation
  - OCR transcription (AWS Textract)
  - File size limits
  - Error handling

### 8. prescription-workflow.test.ts
- **Test Count:** 7 tests
- **Purpose:** Complete prescription workflow
- **Coverage:** Upload → OCR → Validate → Approve → Treatment Plan

### 9. teleconsultation-workflow.test.ts
- **Test Count:** 2 tests
- **Purpose:** Teleconsultation workflow end-to-end
- **Coverage:** Video consultation creation, patient-pharmacist communication

### 10. teleconsultation.test.ts
- **Test Count:** 25 tests
- **Purpose:** Teleconsultation features and functionality
- **Coverage:**
  - Consultation scheduling
  - Video call integration (Twilio)
  - Prescription creation during consultation
  - Consultation history

---

## Running E2E Tests

### Quick Start

```bash
cd /Users/mchaouachi/IdeaProjects/CDC/backend

# Run all E2E tests
npm run test:e2e

# Run specific E2E test file
jest tests/e2e/health-checks.test.ts

# Run with verbose output
jest tests/e2e/ --verbose
```

### With Services Running

Some E2E tests may require backend services to be running:

```bash
# 1. Start services
./scripts/start-services-for-tests.sh

# 2. Run E2E tests
npm run test:e2e

# 3. Stop services
./scripts/stop-services-for-tests.sh
```

---

## E2E Test Configuration

### Jest Configuration

**Config File:** `backend/jest.e2e.config.js`

**Key Settings:**
- Test environment: Node.js
- Root directory: `backend/tests/e2e`
- Transform: TypeScript with ts-jest
- Setup file: `tests/e2e-setup.ts`
- Max workers: 1 (sequential execution to avoid port conflicts)
- Test timeout: 30 seconds

### Test Setup

**Setup File:** `backend/tests/e2e-setup.ts`

**Mocked Services:**
- AWS KMS (encryption keys)
- AWS S3 (file storage)
- AWS Textract (OCR)

**Environment Variables:**
- `NODE_ENV=test`
- `DB_TYPE=sqlite` (in-memory)
- `DB_DATABASE=:memory:`
- `API_BASE_URL=http://localhost:4002`
- JWT secrets and test configuration

---

## E2E vs Contract Tests

### E2E Tests (110 tests)
- **Purpose:** Test complete user workflows end-to-end
- **Scope:** Multiple services, database, external APIs
- **Duration:** 30-60 seconds for full suite
- **Database:** In-memory SQLite
- **Services:** Mock or direct imports

### Contract Tests (26 tests)
- **Purpose:** Validate API contracts (request/response schemas)
- **Scope:** HTTP API endpoints only
- **Duration:** 2-5 seconds
- **Database:** Not required (can mock)
- **Services:** Require API Gateway running on port 4002

---

## Test Status

### Current Status

**E2E Tests:** ✅ Passing (with mocked services)
- Use in-memory SQLite database
- Mock AWS services (S3, Textract, KMS)
- Direct service imports (no HTTP calls)

**Contract Tests:** ⚠️ Require running services
- Need API Gateway on port 4002
- Need mock authentication tokens
- HTTP-based testing with Supertest

### Running Tests Locally

**E2E tests run successfully WITHOUT services:**
```bash
npm run test:e2e
# Uses in-memory database and mocks
```

**Contract tests REQUIRE services:**
```bash
# 1. Start services
./scripts/start-services-for-tests.sh

# 2. Run tests
npm run test:contract

# 3. Stop services
./scripts/stop-services-for-tests.sh
```

---

## Test Coverage by Feature

### Prescription Management
- **Files:** prescription-upload.test.ts, prescription-review.test.ts, prescription-workflow.test.ts
- **Total Tests:** 54 tests
- **Coverage:**
  - Upload and OCR
  - Validation and drug interaction checking
  - Approval/rejection workflows
  - Treatment plan generation

### Inventory Management
- **Files:** inventory-scanning.test.ts, inventory-restock-workflow.test.ts
- **Total Tests:** 8 tests
- **Coverage:**
  - QR code scanning
  - Stock updates
  - Restock workflows

### Teleconsultation
- **Files:** teleconsultation.test.ts, teleconsultation-workflow.test.ts
- **Total Tests:** 27 tests
- **Coverage:**
  - Consultation scheduling
  - Video calls (Twilio)
  - Prescription creation

### Delivery
- **Files:** delivery-workflow.test.ts
- **Total Tests:** 2 tests
- **Coverage:**
  - Delivery request creation
  - GPS tracking
  - Status updates

### Health & Monitoring
- **Files:** health-checks.test.ts, basic-functionality.test.ts
- **Total Tests:** 19 tests
- **Coverage:**
  - Service health checks
  - Basic API operations

---

## Common Test Patterns

### 1. Direct Service Import

```typescript
const inventoryApp = require('../../services/inventory-service/src/index').default;

describe('E2E: Service Tests', () => {
  it('should test feature', async () => {
    const response = await request(inventoryApp).get('/endpoint');
    expect(response.status).toBe(200);
  });
});
```

**Pros:**
- Fast execution
- No service startup required
- Easy to run in CI/CD

**Cons:**
- Doesn't test HTTP routing
- Misses API Gateway middleware

### 2. HTTP-Based Testing (Contract Tests)

```typescript
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4002';

describe('Contract: API Tests', () => {
  it('should validate API contract', async () => {
    const response = await request(API_BASE_URL).get('/endpoint');
    expect(response.status).toBe(200);
  });
});
```

**Pros:**
- Tests full HTTP stack
- Validates API Gateway routing
- Tests middleware (auth, rate limiting, CORS)

**Cons:**
- Requires services running
- Slower execution
- Port conflicts in parallel execution

---

## Troubleshooting E2E Tests

### Issue 1: Database Connection Errors

**Solution:** E2E tests use in-memory SQLite by default. Check `e2e-setup.ts`:

```typescript
process.env.DB_TYPE = 'sqlite';
process.env.DB_DATABASE = ':memory:';
```

### Issue 2: AWS Service Errors

**Solution:** AWS services are mocked in `e2e-setup.ts`. If you see AWS errors, ensure mocks are properly configured.

### Issue 3: Port Conflicts

**Solution:** E2E tests run sequentially (`maxWorkers: 1` in `jest.e2e.config.js`) to avoid port conflicts.

### Issue 4: Test Timeouts

**Solution:** E2E tests have 30-second timeout. For longer operations, increase timeout in test:

```typescript
jest.setTimeout(60000); // 60 seconds
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

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

      - name: Run E2E tests
        run: |
          cd backend
          npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-test-results
          path: backend/coverage/
```

---

## Future Improvements

### 1. Full Service Integration Tests
- Start all microservices using Docker Compose
- Test real HTTP routing through API Gateway
- Validate inter-service communication

### 2. Performance Testing
- Load testing with Artillery or k6
- Stress testing for rate limiting
- Concurrent user simulations

### 3. Security Testing
- Penetration testing for auth endpoints
- SQL injection testing
- XSS vulnerability scanning

### 4. Visual Regression Testing
- Screenshot comparison for error responses
- API response structure validation

---

## Summary

**E2E Tests:**
- ✅ 110 tests across 10 files
- ✅ Run without external services
- ✅ Use in-memory database
- ✅ Mock external APIs
- ⚡ Fast execution (30-60 seconds)

**Contract Tests:**
- ⚠️ 26 tests in 1 file
- ⚠️ Require API Gateway running
- ⚠️ Need mock tokens
- ⚡ Fast execution (2-5 seconds when services running)

**To run all tests:**
```bash
# E2E only (no services needed)
npm run test:e2e

# Contract tests (services needed)
./scripts/start-services-for-tests.sh
npm run test:contract
./scripts/stop-services-for-tests.sh
```

---

## See Also

- [Contract Test Setup Guide](./contract-test-setup.md)
- [Backend Test Scripts](../backend/scripts/README.md)
- [API Gateway Documentation](../backend/services/api-gateway/README.md)
