# MetaPharm Connect - Test Suite

## Overview

This directory contains comprehensive tests for the MetaPharm Connect backend services, organized by test type and phase.

## Test Structure

```
tests/
├── setup.ts                 # Global test setup (Jest configuration)
├── e2e/                     # End-to-end workflow tests
│   ├── prescription-upload.test.ts      (T129)
│   └── prescription-review.test.ts      (T130)
├── contract/                # API contract tests
│   └── prescription-api.test.ts         (T131)
├── load/                    # Load/performance tests
│   └── prescription-load.js             (T132 - k6)
└── README.md               # This file
```

## Test Types

### 1. E2E Tests (End-to-End)

**Purpose**: Test complete user workflows from start to finish

**Location**: `tests/e2e/`

**Coverage**:
- **T129**: Patient prescription upload workflow (20 tests)
  - Upload image → OCR transcription → Status transitions
  - AI confidence scores validation
  - Error handling (missing file, invalid type, file size)

- **T130**: Pharmacist prescription review workflow (27 tests)
  - Get prescription queue → Validate → Approve/Reject
  - Drug interactions, allergies, contraindications
  - Low-confidence field handling (FR-013a)
  - Treatment plan generation

**Run**:
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npm test tests/e2e/prescription-upload.test.ts
npm test tests/e2e/prescription-review.test.ts

# Run with coverage
npm run test:e2e -- --coverage
```

**Requirements**:
- Prescription Service running on port 4002
- Test database with seeded data
- Mocked AWS services (S3, Textract)
- Valid JWT tokens (configured in test setup)

---

### 2. Contract Tests

**Purpose**: Validate API contracts (request/response schemas, status codes, headers)

**Location**: `tests/contract/`

**Coverage**:
- **T131**: Prescription API contract tests (30+ tests)
  - Request/response schema validation using Zod
  - HTTP status code verification (200, 201, 400, 401, 403, 404, 413, 500)
  - Error response format consistency
  - Header validation (Content-Type, CORS, security)
  - Pagination and filtering
  - UUID format validation

**Run**:
```bash
# Run contract tests
npm run test:contract

# Or directly with Jest
npm test tests/contract/prescription-api.test.ts
```

**Benefits**:
- Detect breaking API changes before deployment
- Ensure frontend/mobile apps can rely on consistent responses
- Validate API documentation matches implementation
- Enable safe microservice integration

---

### 3. Load Tests

**Purpose**: Test system performance under load

**Location**: `tests/load/`

**Coverage**:
- **T132**: Prescription submission load test
  - Target: 1000 prescriptions/hour (~16.67/minute)
  - Scenarios: 70% patient uploads, 30% pharmacist reviews
  - Stages: Baseline (50%) → Peak (100%) → Stress (150%)
  - Metrics: Response times, throughput, error rate

**Run**:
```bash
# Install k6 (if not already installed)
# macOS:
brew install k6

# Ubuntu/Debian:
sudo apt-get install k6

# Windows:
choco install k6

# Run load test
cd tests/load
k6 run prescription-load.js

# Run with custom duration
k6 run --stage "5m:20" prescription-load.js

# Run with metrics export (InfluxDB)
k6 run --out influxdb=http://localhost:8086/k6 prescription-load.js
```

**Performance Targets**:
- Upload p95 < 1000ms
- OCR transcription p95 < 10000ms (AWS Textract external service)
- Validation p95 < 500ms
- Approval p95 < 500ms
- Error rate < 1%

---

## Running All Tests

### Quick Test (All Unit + Integration)
```bash
cd /home/user/CDC/backend
npm test
```

### Run E2E Tests Only
```bash
npm run test:e2e
```

### Run Contract Tests Only
```bash
npm run test:contract
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run All Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

---

## Test Configuration

### Jest Configuration

**File**: `/home/user/CDC/backend/jest.config.js`

**Key Settings**:
- Test environment: Node.js
- Transform: TypeScript via ts-jest
- Setup files: `tests/setup.ts`
- Coverage threshold: 70% (branches, functions, lines, statements)
- Timeout: 10 seconds

### E2E Configuration

**File**: `backend/jest.e2e.config.js` (if exists)

**Settings**:
- Extended timeout: 30 seconds
- Real database connection (test schema)
- Mocked external services

### Test Database Setup

For E2E tests, configure test database:

```bash
# Create test database
createdb test_metapharm

# Run migrations
DATABASE_URL=postgresql://test:test@localhost:5432/test_metapharm npm run migrate:up

# Seed test data
DATABASE_URL=postgresql://test:test@localhost:5432/test_metapharm npm run seed:dev
```

---

## Environment Variables

Tests use environment variables from `.env.test`:

```bash
# API Configuration
API_BASE_URL=http://localhost:4002

# Database
DATABASE_URL=postgresql://test:test@localhost:5432/test_metapharm

# JWT
JWT_SECRET=test-jwt-secret-key-for-testing-only

# AWS (mocked in tests)
AWS_REGION=eu-central-1
AWS_KMS_KEY_ID=arn:aws:kms:eu-central-1:123456789012:key/test-key-id

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Mock Services

Tests mock external services to avoid dependencies:

### Mocked Services
- ✅ AWS S3 (prescription image upload)
- ✅ AWS Textract (OCR transcription)
- ✅ AWS KMS (encryption)
- ✅ FDB MedKnowledge API (drug interactions)
- ✅ Notification Service (email, SMS)

### How Mocking Works

**File**: `tests/setup.ts`

```typescript
// Mock AWS KMS
jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ Plaintext: Buffer.from('...') }),
  })),
}));

// Tests can override mocks:
jest.spyOn(S3Service, 'uploadToS3').mockResolvedValue('https://...');
```

---

## Test Data

### Test Users

```typescript
TEST_PATIENT_ID = 'patient-123'
TEST_PHARMACIST_ID = 'pharmacist-789'
TEST_DOCTOR_ID = 'doctor-012'
TEST_PHARMACY_ID = 'pharmacy-123'
```

### Test Tokens

Mock JWT tokens are used (no signature validation in tests):
```typescript
MOCK_PATIENT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
MOCK_PHARMACIST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

---

## CI/CD Integration

Tests are run automatically in GitHub Actions:

### Workflow: `.github/workflows/backend-tests.yml`

```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run unit tests
        run: npm test
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Run contract tests
        run: npm run test:contract
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Test Coverage

### Current Coverage (Phase 3 US1 Complete)

**Prescription Service**:
- Unit tests: 15 tests (validate.test.ts)
- Integration tests: 36 specifications (workflow.test.ts)
- E2E tests: 47 tests (T129 + T130)
- Contract tests: 30+ tests (T131)
- Load tests: 1 scenario (T132)

**Total**: 128+ tests for US1 (Prescription Processing & Validation)

### Coverage Report

```bash
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

## Troubleshooting

### Tests Failing: "Cannot connect to database"

**Solution**: Ensure test database is running and migrations are applied:
```bash
docker-compose up -d postgres
DATABASE_URL=postgresql://test:test@localhost:5432/test_metapharm npm run migrate:up
```

### Tests Failing: "Module not found: @aws-sdk/..."

**Solution**: Install dependencies:
```bash
npm install
```

### Tests Failing: "Timeout exceeded"

**Solution**: Increase Jest timeout in test file:
```typescript
jest.setTimeout(30000); // 30 seconds
```

### Load Test: "k6: command not found"

**Solution**: Install k6:
```bash
# macOS
brew install k6

# Ubuntu
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

---

## Next Steps

1. ✅ **T129**: E2E test for patient prescription upload workflow - COMPLETE
2. ✅ **T130**: E2E test for pharmacist prescription review workflow - COMPLETE
3. ✅ **T131**: Contract test for Prescription API - COMPLETE
4. ✅ **T132**: Load test for prescription submission using k6 - COMPLETE

### Future Testing Phases

**Phase 4 (US2 - Teleconsultation)**:
- E2E tests for video call booking and session
- Load tests for concurrent video calls (target: 100 concurrent)

**Phase 5 (US3 - Inventory Management)**:
- E2E tests for QR scanning workflow
- Load tests for inventory updates (target: 5000 scans/hour)

---

## Test Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after each test
3. **Mocking**: Mock external services to avoid dependencies
4. **Assertions**: Use specific assertions (not just "truthy")
5. **Coverage**: Aim for >70% code coverage
6. **Speed**: Keep unit tests fast (<100ms each)
7. **Descriptive**: Use clear test names describing what is tested
8. **AAA Pattern**: Arrange, Act, Assert

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [k6 Documentation](https://k6.io/docs/)
- [Zod Schema Validation](https://zod.dev/)

---

**Last Updated**: 2025-11-08
**Author**: MetaPharm Development Team
**User Story**: US1 - Prescription Processing & Validation
