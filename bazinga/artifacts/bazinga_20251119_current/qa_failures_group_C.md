# QA Test Failures - Group C: Delivery Service

**Session:** bazinga_20251119_current
**Group:** C (delivery-service)
**Date:** 2025-11-19T17:10:00Z
**Iteration:** Wave 1 Revision 2 Testing

## Summary

Package.json fixes are CORRECT, but test suite has 40/40 failures due to API contract mismatches.

## Package.json Fixes - VERIFIED ✅

**What Was Fixed:**
1. ✅ Moved `better-sqlite3` from devDependencies to dependencies
2. ✅ Removed `pg` (PostgreSQL) from dependencies
3. ✅ Production install verified working

**Service Startup:**
```
[Delivery Service] 🚀 Running on port 4006
[Delivery Service] Environment: development
[Delivery Service] Health check: http://localhost:4006/health
[Delivery Service] ✓ Database connected
```

**Health Check Response:**
```json
{"status":"healthy","service":"delivery-service","port":4006,"timestamp":"2025-11-19T16:08:28.000Z"}
```

## Test Results - FAILED ❌

**Test Suites:** 2 failed, 2 total
**Tests:** 40 failed, 40 total
**Duration:** 7.395s

## Critical Issue 1: Route Path Mismatch

### Problem
Tests call `/api/deliveries` but service routes at `/deliveries`

### Evidence
**Test Code** (`__tests__/index.test.ts:29`):
```typescript
const response = await request(app)
  .post('/api/deliveries')  // ← Tests use /api/deliveries
  .send(newDelivery);
```

**Service Routes** (`src/index.ts:86`):
```typescript
app.use('/deliveries', authenticateJWT as RequestHandler, deliveriesRouter);
// ← Service uses /deliveries (no /api prefix)
```

### Result
All requests return `404 "Not found"` instead of reaching handlers

### Impact
CRITICAL - All 40 tests fail at route level

### Fix Required
**Option A (Recommended):** Update service to use `/api` prefix
```typescript
// In src/index.ts:86
app.use('/api/deliveries', authenticateJWT as RequestHandler, deliveriesRouter);
```

**Option B:** Update all tests to remove `/api` prefix
```typescript
// In tests
.post('/deliveries')  // Remove /api
```

---

## Critical Issue 2: API Contract Mismatch

### Problem
Tests use different field names and format than controller expects

### Test Expectations
**From** `__tests__/index.test.ts:19-26`:
```javascript
const newDelivery = {
  orderId: 'order-123',              // camelCase
  pharmacyId: 'pharmacy-456',        // camelCase
  patientId: 'patient-789',          // camelCase
  pickupAddress: '123 Main St',      // Plaintext address
  deliveryAddress: '456 Oak Ave',    // Plaintext address
  estimatedDeliveryTime: '2025-01-20T10:00:00Z'
};
```

### Controller Implementation
**From** `src/controllers/deliveryController.ts:123-129`:
```javascript
const {
  user_id,                         // snake_case (not patientId)
  order_id,                        // snake_case (not orderId)
  delivery_address_encrypted,      // Base64 encrypted (not plaintext!)
  delivery_notes_encrypted,        // Optional
  scheduled_at                     // snake_case (not estimatedDeliveryTime)
} = req.body;
```

### Field Mapping Issues

| Test Field | Controller Field | Issue |
|------------|------------------|-------|
| `orderId` | `order_id` | Name mismatch (camelCase vs snake_case) |
| `pharmacyId` | N/A | Field doesn't exist in controller |
| `patientId` | `user_id` | Name mismatch + semantic difference |
| `pickupAddress` | N/A | Field doesn't exist in controller |
| `deliveryAddress` | `delivery_address_encrypted` | Name + format mismatch (plaintext vs base64 encrypted) |
| `estimatedDeliveryTime` | `scheduled_at` | Name mismatch |
| `driverId` | `delivery_personnel_id` | Name mismatch (from routes) |

### Security Issue
**Tests expect plaintext addresses:**
```javascript
deliveryAddress: '456 Oak Ave, City, Country'
```

**Controller expects encrypted base64:**
```javascript
delivery_address_encrypted: Buffer.from(delivery_address_encrypted, 'base64')
```

### Impact
CRITICAL - Complete API contract incompatibility

### Fix Required
**Option A (Update Controller - Recommended):**
Match controller to test expectations:
```typescript
// In deliveryController.ts
const {
  orderId,              // Accept camelCase
  pharmacyId,           // Add pharmacy field
  patientId,            // Rename from user_id
  pickupAddress,        // Add pickup field
  deliveryAddress,      // Accept plaintext (handle encryption internally)
  estimatedDeliveryTime,
  driverId
} = req.body;

// Validation
if (!orderId) {
  res.status(400).json({
    error: 'Validation Error',
    message: 'Missing required fields: orderId'
  });
  return;
}

// Handle encryption internally
const delivery = deliveryRepo.create({
  user_id: patientId,
  order_id: orderId,
  pharmacy_id: pharmacyId,
  delivery_address_encrypted: encryptAddress(deliveryAddress),  // Encrypt internally
  pickup_address_encrypted: encryptAddress(pickupAddress),      // Encrypt internally
  scheduled_at: estimatedDeliveryTime,
  delivery_personnel_id: driverId,
  status: 'pending'
});
```

**Option B (Update Tests):**
Change all tests to match controller expectations - requires updating 40 test cases

---

## Minor Issue: Error Message Inconsistency

### Problem
Tests expect capitalized error message

**Test Expectation** (`__tests__/index.test.ts:375`):
```typescript
expect(response.body).toHaveProperty('error', 'Not Found');  // Capital F
```

**Service Response** (`src/index.ts:94`):
```typescript
res.status(404).json({
  error: 'Not found',  // Lowercase f
  path: req.path,
});
```

### Fix Required
```typescript
// In src/index.ts:94
res.status(404).json({
  error: 'Not Found',  // ← Capitalize 'F'
  path: req.path,
});
```

---

## Sample Test Failures

### Failure 1: Route Not Found
```
● Delivery Service API › POST /api/deliveries › should create a new delivery

expected 201 "Created", got 404 "Not Found"

  43 |         .post('/api/deliveries')
  44 |         .send(deliveryData)
> 45 |         .expect(201);
     |          ^

at Object.<anonymous> (__tests__/index.test.ts:45:10)
```

### Failure 2: Missing Response Body
```
● Delivery Service API › POST /api/deliveries › should create a new delivery

TypeError: Cannot read properties of undefined (reading 'id')

> 358 |       const deliveryId = createResponse.body.delivery.id;
      |                                                       ^

at Object.<anonymous> (__tests__/index.test.ts:358:55)
```
*Caused by 404 response having no `delivery` object*

### Failure 3: Error Message Case
```
● Delivery Service API › 404 Handler › should return 404 for unknown routes

Expected path: "error"
Expected value: "Not Found"
Received value: "Not found"

> 569 |       expect(response.body).toHaveProperty('error', 'Not Found');
      |                             ^

at Object.<anonymous> (__tests__/index.test.ts:569:29)
```

---

## Complete Test Output

<details>
<summary>Full npm test output (click to expand)</summary>

```
Test Suites: 2 failed, 2 total
Tests:       40 failed, 40 total
Snapshots:   0 total
Time:        7.395 s

FAIL __tests__/deliveries.integration.test.ts
FAIL __tests__/index.test.ts

All 40 tests failed with:
- Route path mismatches (404 errors)
- API contract mismatches (field name differences)
- Missing response bodies (due to 404s)
```
</details>

---

## Root Cause Analysis

The tests and implementation were developed against **different API specifications**:

1. **Tests written for**: REST API with camelCase, plaintext addresses, `/api` prefix
2. **Implementation follows**: Different spec with snake_case, encrypted addresses, no `/api` prefix

This suggests:
- Tests created before implementation without synchronization
- Implementation changed specification without updating tests
- Possible copy-paste from different service with different conventions

---

## Recommendations

### Immediate Actions (Developer)

1. **Choose API Style Consistently**:
   - Either camelCase (tests) OR snake_case (controller)
   - Document decision in API spec

2. **Fix Route Prefix**:
   - Add `/api` prefix to service routes
   - OR remove from tests

3. **Resolve Field Names**:
   - Standardize on one naming convention
   - Update controller or tests accordingly

4. **Handle Encryption Properly**:
   - If tests should use plaintext: Controller encrypts internally
   - If tests should encrypt: Update all test cases with base64 encoding

5. **Fix Error Messages**:
   - Capitalize "Not Found" in 404 handler

6. **Add API Documentation**:
   - Create OpenAPI/Swagger spec as source of truth
   - Use contract testing to prevent future drift

### Long-term (Tech Lead Review)

1. Consider contract-first API development
2. Add API contract validation in CI/CD
3. Use tools like Pact or Dredd for contract testing
4. Document encryption requirements clearly

---

## Developer Action Items

- [ ] Fix route path: Add `/api` prefix or update tests
- [ ] Fix API contract: Align field names (camelCase vs snake_case)
- [ ] Fix encryption: Handle encryption internally or update tests
- [ ] Fix error messages: Capitalize "Not Found"
- [ ] Add missing fields: `pharmacyId`, `pickupAddress` to controller
- [ ] Re-run tests and verify all 40 pass
- [ ] Create API documentation (OpenAPI spec)

---

## Files Requiring Changes

### If Updating Service (Recommended)
1. `backend/services/delivery-service/src/index.ts` (line 86 - add /api prefix)
2. `backend/services/delivery-service/src/index.ts` (line 94 - capitalize error)
3. `backend/services/delivery-service/src/controllers/deliveryController.ts` (full refactor for camelCase + encryption)
4. `backend/shared/models/Delivery.ts` (may need new fields)

### If Updating Tests (Alternative)
1. `backend/services/delivery-service/__tests__/index.test.ts` (40 test cases)
2. `backend/services/delivery-service/__tests__/deliveries.integration.test.ts` (integration tests)

---

## Conclusion

**Package.json fixes: APPROVED ✅**
**Test suite: BLOCKED - requires API contract alignment ❌**

The developer successfully fixed the package.json configuration for SQLite deployment. However, the test suite reveals a critical API contract mismatch that must be resolved before deployment.

**Recommendation:** Send back to Developer to align API implementation with test expectations (or vice versa).
