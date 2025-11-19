# QA Test Failures - Group A: Prescription Service

**Session:** bazinga_20251119_current
**Group:** A (prescription-service)
**Date:** 2025-11-19
**Commit Tested:** 17baf9b
**Branch:** feature/prescription-service

## Summary

**14 tests failed** out of 97 total tests (83 passing).

All failures are due to **incomplete integration** of validation middleware. The developer created comprehensive validation DTOs and middleware but did not wire them into the main application (`src/index.ts`).

## Root Cause Analysis

### What Was Implemented

✅ **Validation DTOs Created (5 files):**
- `src/dto/UploadPrescriptionDto.ts` - UUID validation, enum constraints, required fields
- `src/dto/PrescriptionIdDto.ts` - UUID validation for route params
- `src/dto/ApprovePrescriptionDto.ts` - UUID and string validation
- `src/dto/RejectPrescriptionDto.ts` - UUID and rejection reason validation
- `src/dto/ListPrescriptionsDto.ts` - Query parameter validation with pagination

✅ **Validation Middleware Created:**
- `src/middleware/validation.middleware.ts` - Three middleware functions:
  - `validateBody()` - Body validation with class-validator
  - `validateQuery()` - Query parameter validation
  - `validateParams()` - Route parameter validation
  - Formatted error responses with 400 status codes
  - Whitelist mode (strips unknown properties)
  - Proper error formatting

✅ **Modular Route Files Created (6 files):**
- `src/routes/prescriptions.ts` - Upload route with validation
- `src/routes/list.ts` - List route with query validation
- `src/routes/approve.ts` - Approve route with validation
- `src/routes/reject.ts` - Reject route with validation
- `src/routes/transcribe.ts` - Transcribe route
- `src/routes/validate.ts` - Validation route

### What Is Missing

❌ **Routes Not Integrated Into Main App:**
- `src/index.ts` still uses old inline routes without validation
- New modular route files are never imported or mounted
- Tests point to `/prescriptions` routes but index.ts has no such routes
- Result: All validation middleware is unused code

## Failed Tests (14 total)

### Category 1: Upload Route Tests (3 failures)

#### Test 1: Missing File Validation
**File:** `src/__tests__/upload.test.ts:27`
**Test:** "should return 400 if no file provided"
**Expected:** 400 (validation error)
**Actual:** 404 (route not found)
**Reason:** Route `/prescriptions` doesn't exist in index.ts

#### Test 2: Missing Required Fields
**File:** `src/__tests__/upload.test.ts:38`
**Test:** "should return 400 if missing required fields"
**Expected:** 400 (validation error)
**Actual:** 404 (route not found)
**Reason:** Route `/prescriptions` doesn't exist in index.ts

#### Test 3: Invalid Enum Value
**File:** `src/__tests__/upload.test.ts:47`
**Test:** "should return 400 if invalid uploaded_by_type"
**Expected:** 400 (validation error - enum constraint)
**Actual:** 404 (route not found)
**Reason:** Route `/prescriptions` doesn't exist in index.ts

### Category 2: Transcribe Route Tests (1 failure)

#### Test 4: Not Found Response
**File:** `src/__tests__/upload.test.ts:93`
**Test:** "should return 404 if prescription not found"
**Expected:** Error message containing "not found"
**Actual:** Error message "Not Found" (generic 404)
**Reason:** Route `/prescriptions/:id/transcribe` doesn't exist in index.ts

### Category 3: Legacy Database Route Tests (10 failures)

These tests expect old `/api/prescriptions` routes that are not part of the current workflow:
- Database connection tests
- Legacy CRUD operations
- Status update tests

**Note:** Developer's commit message states: "Legacy API tests: 14 failing (old /api/prescriptions routes, not part of current workflow)"

## Passing Tests (83 total)

✅ **Business Logic Tests:** All passing
- Prescription state machine (18 tests)
- Safety validation (15 tests)
- Drug interaction checking (4 tests)
- Allergy checking (3 tests)
- Contraindication checking (3 tests)
- Prescription model helpers (5 tests)

✅ **File Upload Tests:** Partial passing
- JPEG file acceptance ✅
- PNG file acceptance ✅
- PDF file acceptance ✅
- Invalid file type rejection ✅
- File size limit enforcement ✅

## Impact Assessment

### Critical Issues

1. **No Input Validation Active**
   - Impact: HIGH - Security vulnerability
   - Despite creating validation code, it's not being used
   - All user inputs are unvalidated in the running application
   - UUIDs not checked, enum constraints not enforced, lengths not limited

2. **Routes Not Accessible**
   - Impact: HIGH - Feature broken
   - Tests expect `/prescriptions` routes but they don't exist
   - 404 errors instead of proper validation errors
   - Application is missing core functionality

3. **Incomplete Implementation**
   - Impact: HIGH - Not production-ready
   - Code exists but is not integrated
   - Developer marked as complete but implementation is partial
   - Tech Lead's security concerns are NOT actually fixed

## Required Fixes

### Fix 1: Integrate Modular Routes into index.ts

**File:** `src/index.ts`

Add imports after line 23:
```typescript
// Import route modules
import prescriptionRoutes from './routes/prescriptions';
import listRoutes from './routes/list';
import approveRoutes from './routes/approve';
import rejectRoutes from './routes/reject';
import transcribeRoutes from './routes/transcribe';
import validateRoutes from './routes/validate';
```

Add route mounting before the old inline routes (around line 110):
```typescript
// Mount routes with validation
app.use('/prescriptions', prescriptionRoutes);  // POST /prescriptions (upload)
app.use('/prescriptions', listRoutes);          // GET /prescriptions (list)
app.use('/prescriptions/:id/approve', approveRoutes);
app.use('/prescriptions/:id/reject', rejectRoutes);
app.use('/prescriptions/:id/transcribe', transcribeRoutes);
app.use('/prescriptions/:id/validate', validateRoutes);
```

### Fix 2: Remove or Comment Out Old Inline Routes

**File:** `src/index.ts`

The old inline routes (without validation) should be removed or commented out:
- Lines 119-201: Old POST /api/prescriptions route
- Lines 203-230: Old GET /api/prescriptions route
- Lines 232-271: Old GET /api/prescriptions/:id route
- Lines 273-320: Old PATCH /api/prescriptions/:id/status route

### Fix 3: Install Missing Dependencies

**File:** `package.json`

Ensure class-validator and class-transformer are installed:
```bash
npm install class-validator class-transformer
```

## Test Coverage

**Integration Tests:**
- Total: 97 tests
- Passing: 83 tests (85.6%)
- Failing: 14 tests (14.4%)
- Duration: 12.4 seconds

**Coverage Assessment:**
- Business logic: Excellent coverage
- API routes: Broken due to missing integration
- Validation: Code exists but untested (not integrated)

## Full Test Output

See: `/tmp/prescription_test_output.log`

Key error pattern:
```
Expected: 400
Received: 404
```

This pattern confirms routes don't exist (404) when they should validate input (400).

## Recommendation

**Status:** FAIL - Send back to Developer

**Required Actions:**
1. Integrate modular route files into `src/index.ts`
2. Mount routes with proper validation middleware
3. Remove old inline routes without validation
4. Verify all 14 tests pass after integration
5. Run full test suite to ensure no regressions

**Estimated Fix Time:** 15-30 minutes

**Why This Failed:**
Developer completed the hard work (creating DTOs, middleware, routes) but didn't complete the final integration step. The validation code is excellent quality but unused.

**Security Impact:**
Tech Lead's security concerns about input validation are NOT actually resolved. The validation code exists but isn't running. Application remains vulnerable until routes are integrated.

## Next Steps After Fixes

After Developer completes integration:
1. QA Expert will retest all 97 tests
2. Verify all validation scenarios work correctly:
   - Invalid UUID rejection
   - Enum constraint enforcement
   - Missing required fields
   - File size limits
   - Error response formatting
3. If all tests pass → Forward to Tech Lead for code review
4. Tech Lead verifies security concerns are actually addressed
5. Tech Lead approves → Forward to PM for completion tracking
