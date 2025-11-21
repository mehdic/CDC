# Developer Assignment - OpenTelemetry Conditional Mocking Fix

**Session:** bazinga_20251120_195103
**Task Group:** TEST_INFRA
**Assigned To:** Developer-1
**Status:** CHANGES_REQUESTED (Tech Lead Review)
**Branch:** feature/test-infrastructure-fixes
**Initial Branch:** main

## Tech Lead Feedback Summary

**Critical Issue:** Global mock in `tests/setup.ts` applies to ALL tests, including tracing tests. This causes:
- 31/50 tracing tests failing
- 0% code coverage for tracing module
- Circular mocking problem (tests checking if mocks return mocks)

## Required Changes: Conditional Mocking Strategy

### Task 1: Remove Global Mock
**File:** `backend/tests/setup.ts`
**Action:** Delete lines 35-76 (the entire `jest.mock('../shared/middleware/tracing')` block)

**Why:** Global mocks prevent tracing tests from testing the real implementation.

---

### Task 2: Create Reusable Mock Factory
**File:** `backend/tests/__mocks__/tracing-mock.ts` (NEW FILE)

**Action:** Create this exact file:

```typescript
export const createTracingMock = () => ({
  initializeTracing: jest.fn(),
  getTracer: jest.fn(() => ({
    startSpan: jest.fn(() => ({
      end: jest.fn(),
      setAttribute: jest.fn(),
      setAttributes: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
    })),
  })),
  createSpan: jest.fn(() => ({
    end: jest.fn(),
    setAttribute: jest.fn(),
    setAttributes: jest.fn(),
  })),
  withSpan: jest.fn(async (name, fn) => {
    const mockSpan = {
      end: jest.fn(),
      setAttribute: jest.fn(),
      setAttributes: jest.fn(),
    };
    return await fn(mockSpan);
  }),
  withSpanSync: jest.fn((name, fn) => {
    const mockSpan = {
      end: jest.fn(),
      setAttribute: jest.fn(),
      setAttributes: jest.fn(),
    };
    return fn(mockSpan);
  }),
  traceDbQuery: jest.fn(async (query, operation, table, fn) => await fn()),
  traceExternalCall: jest.fn(async (service, method, url, fn) => await fn()),
  traceCacheOperation: jest.fn(async (operation, key, cacheName, fn) => await fn()),
  tracingMiddleware: jest.fn((req, res, next) => next()),
  addSpanEvent: jest.fn(),
  setSpanAttribute: jest.fn(),
  recordException: jest.fn(),
  getCurrentSpan: jest.fn(() => undefined),
});
```

**Why:** Centralized mock factory allows selective mocking in specific tests only.

---

### Task 3: Update tracing.test.ts to Mock External Dependencies Only
**File:** `backend/shared/middleware/__tests__/tracing.test.ts`

**Action:** Add this at the VERY TOP of the file (before any imports from '../tracing'):

```typescript
// Mock external dependencies only
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: jest.fn().mockImplementation(() => ({
    export: jest.fn(),
    shutdown: jest.fn(),
  })),
}));

jest.mock('@opentelemetry/sdk-trace-base', () => {
  const mockSpan = {
    setAttribute: jest.fn(),
    setAttributes: jest.fn(),
    setStatus: jest.fn(),
    recordException: jest.fn(),
    end: jest.fn(),
    addEvent: jest.fn(),
  };
  const mockTracer = {
    startSpan: jest.fn(() => mockSpan),
  };
  return {
    BasicTracerProvider: jest.fn().mockImplementation(function() {
      this.addSpanProcessor = jest.fn();
      this.register = jest.fn();
      this.getTracer = jest.fn(() => mockTracer);
    }),
    BatchSpanProcessor: jest.fn(),
    ConsoleSpanExporter: jest.fn(),
  };
});
```

**Why:** Tracing tests should test REAL tracing implementation, only mock external OTEL dependencies.

---

### Task 4: Update Other Tests That Need Tracing Mock
**Files:** Tests that fail with tracing errors (TBD - find them after Task 1-3)

**Action:** For each test file that needs tracing mocked, add at the TOP:

```typescript
jest.mock('../../middleware/tracing', () => 
  require('../../../tests/__mocks__/tracing-mock').createTracingMock()
);
```

**Adjust path:** Relative path depends on test file location.

**Why:** Only tests that DON'T test tracing functionality should use the mock.

---

## Expected Outcomes

✅ **Tracing tests** test the REAL implementation (not mocks)
✅ **Other tests** use the mock to avoid OpenTelemetry setup issues
✅ **All tracing tests pass** (or fail for legitimate reasons, not mock issues)
✅ **Tracing module coverage** > 70% (currently 0%)
✅ **No new test failures** introduced by this change

---

## Implementation Steps

1. **Remove global mock** (Task 1) - This will cause many tests to fail temporarily
2. **Create mock factory** (Task 2) - Centralized mock for selective use
3. **Update tracing tests** (Task 3) - Mock only external dependencies
4. **Run tracing tests** and verify they pass
5. **Find failing tests** that need the tracing mock
6. **Update failing tests** (Task 4) one by one with conditional mock
7. **Run full test suite** and verify results
8. **Report final test counts** and coverage

---

## Testing Commands

```bash
# Run only tracing tests
cd /Users/mchaouachi/IdeaProjects/CDC/backend
npm test -- tracing.test.ts

# Run full test suite
npm test

# Check coverage for tracing module
npm test -- --coverage --collectCoverageFrom='shared/middleware/tracing.ts'
```

---

## Context

**Backend path:** `/Users/mchaouachi/IdeaProjects/CDC/backend`
**Session ID:** `bazinga_20251120_195103`
**Task Group:** `TEST_INFRA`

**Testing Mode:** full (all quality checks enforced)
**Project Context:** Available in `bazinga/project_context.json`

---

## Success Criteria

Before marking READY_FOR_REVIEW:

- [ ] Global mock removed from `tests/setup.ts`
- [ ] Mock factory created in `tests/__mocks__/tracing-mock.ts`
- [ ] `tracing.test.ts` updated to mock only external deps
- [ ] Tracing tests passing (≥80% of 50 tests)
- [ ] Tracing module coverage ≥70%
- [ ] Other tests updated selectively with conditional mock
- [ ] Full test suite run completed
- [ ] Actual test results reported (no estimates)

