# Complete E2E Journey Tests - MetaPharm Connect

## Overview

This document describes the comprehensive end-to-end journey tests that validate critical user workflows across the MetaPharm Connect platform. These tests simulate real-world user scenarios from start to finish, covering multiple apps and user roles.

## Test Architecture

### Journey Tests vs. Feature Tests

**Feature Tests** (existing):
- Test individual features in isolation
- Focus on specific functionality (login, prescription creation, delivery tracking)
- Single-user, single-app perspective
- Examples: `prescription-management.spec.ts`, `delivery.spec.ts`, `teleconsultation.spec.ts`

**Journey Tests** (new):
- Test complete user workflows across multiple touchpoints
- Multi-user, multi-app interactions
- Real-world scenarios from user's perspective
- Examples: Complete teleconsultation flow, VIP membership lifecycle

## Complete Journey Tests

### 1. Complete Teleconsultation Journey
**File:** `journey-teleconsultation-complete.spec.ts`

**User Story:** As a patient, I want to book a teleconsultation, have a video call with my pharmacist, receive a prescription during the call, and access follow-up resources.

**Test Scenarios:**

#### Scenario 1: Patient Books Teleconsultation
- Patient views available consultation slots
- Patient selects preferred pharmacist and time
- Patient provides consultation reason and symptoms
- Booking confirmation received
- **Validates:** Booking flow, slot availability, reason capture

#### Scenario 2: Pharmacist Accepts Consultation
- Pharmacist receives booking notification
- Pharmacist reviews patient information and consultation reason
- Pharmacist accepts consultation request
- Confirmation sent to patient
- **Validates:** Notification system, pharmacist workflow

#### Scenario 3: Video Consultation with Prescription Creation
- Patient joins video call at scheduled time
- Pharmacist joins call and sees patient medical history
- Chat messaging during video call
- Pharmacist creates prescription during call
- Patient receives in-call prescription notification
- **Validates:** Video infrastructure, chat functionality, prescription workflow integration

#### Scenario 4: Call Completion and Follow-up
- Pharmacist saves consultation notes
- Pharmacist ends consultation
- Completion summary generated
- Patient views consultation history
- Patient accesses prescription created during call
- Follow-up appointment available
- **Validates:** Session management, documentation, follow-up workflow

#### Scenario 5: Complete Journey Integration
- Full workflow from booking to follow-up in one test
- Multi-browser context simulation (patient and pharmacist)
- **Validates:** End-to-end integration, cross-app communication

**Key Technical Features:**
- Twilio video call mocking
- Real-time messaging simulation
- Medical history integration
- Multi-context browser testing

---

### 2. VIP Membership (Golden MetaPharm) Journey
**File:** `journey-vip-membership.spec.ts`

**User Story:** As a patient, I want to subscribe to the VIP program, receive exclusive benefits, use priority services, and track my savings.

**Test Scenarios:**

#### Scenario 1: VIP Program Discovery
- Patient views Golden MetaPharm program page
- Three tiers displayed: Silver, Gold, Platinum
- Benefit comparison across tiers
- Savings calculator shown
- **Validates:** Program presentation, tier comparison, value proposition

#### Scenario 2: VIP Subscription
- Patient selects Gold tier
- Payment method verification
- Terms acceptance
- Subscription confirmation
- Welcome message with active benefits
- Redirect to VIP dashboard
- **Validates:** Subscription flow, payment integration, activation

#### Scenario 3: VIP Discount Application
- Patient adds products to cart
- VIP discount automatically applied (10% for Gold)
- Free delivery benefit applied
- Total savings displayed
- VIP badge visible throughout checkout
- **Validates:** Discount calculation, cart integration, benefit application

#### Scenario 4: Priority Teleconsultation Access
- VIP member views consultation slots
- Priority slots (30 min, 1 hour) visible
- VIP-exclusive slots marked
- Regular slots also available (later times)
- VIP member can book priority slots
- **Validates:** Priority access, slot filtering, VIP-exclusive features

#### Scenario 5: VIP Dashboard and Statistics
- Member views VIP dashboard
- Total savings displayed (€142.35)
- Savings breakdown: discounts vs. delivery fees
- Usage statistics: orders, consultations, priority slots
- Break-even status shown
- Benefit activation status
- Upgrade/downgrade options available
- **Validates:** Statistics tracking, ROI calculation, membership management

#### Scenario 6: Complete VIP Journey
- Full workflow from discovery to usage
- Subscribe → Use benefits → Track savings
- **Validates:** Complete VIP lifecycle

**Key Technical Features:**
- Tier-based benefit application
- Dynamic discount calculation
- Savings tracking and analytics
- Priority service filtering

---

### 3. Full Prescription Lifecycle (Existing)
**File:** `cross-role-prescription-workflow.spec.ts`

**User Story:** As a doctor, pharmacist, and patient, we collaborate to create, validate, and fulfill a prescription.

**Test Scenarios:**
1. Doctor creates prescription and sends to pharmacy
2. Pharmacist receives and validates prescription
3. Pharmacist messages doctor for clarification (if needed)
4. Patient receives notification and views prescription
5. Patient adds prescription to cart and places order
6. Complete workflow: Doctor → Pharmacist → Patient

**Key Validations:**
- Cross-role communication
- AI drug interaction checking
- Prescription workflow states
- Notification system
- E-commerce integration

---

### 4. Complete Delivery Workflow (Existing)
**File:** `delivery-driver-workflows.spec.ts`

**User Story:** As a delivery driver, I accept delivery requests, navigate with GPS, scan QR codes, and complete deliveries with proof.

**Test Scenarios:**
1. Driver login and dashboard access
2. Driver views and accepts delivery requests
3. GPS tracking during delivery
4. QR code scanning for pickup and delivery verification
5. Delivery completion with signature/photo
6. Failed delivery handling
7. Statistics and history

**Key Validations:**
- GPS tracking and route optimization
- QR code verification
- Special handling (controlled substances, cold chain)
- Proof of delivery (signature, photo)
- Notification system

---

## Test Data and Fixtures

### Test Users
All journey tests use standardized test users from `auth.fixture.ts`:

```typescript
testUsers = {
  pharmacist: { email: 'pharmacist@test.metapharm.ch', role: 'pharmacist' },
  doctor: { email: 'doctor@test.metapharm.ch', role: 'doctor' },
  patient: { email: 'patient@test.metapharm.ch', role: 'patient' },
  nurse: { email: 'nurse@test.metapharm.ch', role: 'nurse' },
  delivery: { email: 'delivery@test.metapharm.ch', role: 'delivery' },
}
```

### Mock API Responses
All tests use `mockApiResponse()` helper from `utils/api-mock.ts` to simulate backend responses.

**Example:**
```typescript
await mockApiResponse(page, '**/teleconsultation/book', {
  status: 201,
  body: {
    success: true,
    consultationId: 'consult_001',
  },
});
```

### Page Objects
Journey tests leverage existing page objects:
- `LoginPage` - Authentication
- `TeleconsultationPage` - Video calls
- `PrescriptionPage` - Prescription management
- `DeliveryPage` - Delivery tracking

---

## Running the Tests

### Run All Journey Tests
```bash
cd web
npx playwright test journey-
```

### Run Specific Journey
```bash
# Teleconsultation journey
npx playwright test journey-teleconsultation-complete.spec.ts

# VIP membership journey
npx playwright test journey-vip-membership.spec.ts

# Prescription lifecycle
npx playwright test cross-role-prescription-workflow.spec.ts

# Delivery workflow
npx playwright test delivery-driver-workflows.spec.ts
```

### Run with UI Mode (Debugging)
```bash
npx playwright test journey-teleconsultation-complete.spec.ts --ui
```

### Run on Specific Browser
```bash
npx playwright test journey-vip-membership.spec.ts --project=chromium
```

---

## CI/CD Integration

Journey tests are included in the CI pipeline:

**Workflow:** `.github/workflows/playwright.yml`

```yaml
- name: Run E2E Journey Tests
  run: |
    cd web
    npx playwright test journey- --project=chromium
```

**Test Reports:**
- HTML Report: `web/playwright-report/index.html`
- JSON Results: `web/playwright-report/results.json`
- JUnit XML: `web/playwright-report/junit.xml`

**Artifacts:**
- Screenshots on failure
- Video recordings on failure
- Trace files for debugging

---

## Test Coverage

### Critical User Journeys Coverage

| Journey | Status | Tests | Coverage |
|---------|--------|-------|----------|
| Prescription Lifecycle | ✅ Complete | 6 scenarios | Doctor → Pharmacist → Patient |
| Teleconsultation | ✅ Complete | 5 scenarios | Booking → Video call → Prescription → Follow-up |
| VIP Membership | ✅ Complete | 6 scenarios | Discovery → Subscribe → Benefits → Tracking |
| Delivery Workflow | ✅ Complete | 15 scenarios | Accept → GPS → QR → Completion |

### Feature Coverage

**Authentication & Authorization:**
- ✅ Multi-role login (5 roles)
- ✅ Session management
- ✅ Role-based access control

**Communication:**
- ✅ Secure messaging between roles
- ✅ Video calls (Twilio integration)
- ✅ In-call chat
- ✅ Notifications

**E-commerce:**
- ✅ Product catalog
- ✅ Cart management
- ✅ Checkout flow
- ✅ VIP discounts
- ✅ Order history

**Healthcare Workflows:**
- ✅ Prescription creation
- ✅ Prescription validation
- ✅ AI drug interaction checking
- ✅ Teleconsultation booking
- ✅ Medical history access

**Delivery & Logistics:**
- ✅ GPS tracking
- ✅ QR code verification
- ✅ Route optimization
- ✅ Proof of delivery
- ✅ Special handling

**Monetization:**
- ✅ VIP subscription tiers
- ✅ Benefit application
- ✅ Savings tracking
- ✅ Priority services

---

## Test Maintenance

### Adding New Journey Tests

1. **Create new test file:**
   ```
   web/e2e/tests/journey-[name].spec.ts
   ```

2. **Follow naming convention:**
   - `journey-` prefix for all journey tests
   - Descriptive name (e.g., `journey-doctor-workflow.spec.ts`)

3. **Structure:**
   ```typescript
   import { test, expect, testUsers } from '../fixtures/auth.fixture';

   test.describe('Journey Name', () => {
     // Setup
     const journeyId = 'unique_id';

     // Scenario 1
     test('should complete step 1', async ({ context }) => {
       // Test implementation
     });

     // Scenario 2
     test('should complete step 2', async ({ context }) => {
       // Test implementation
     });

     // Complete journey
     test('should complete entire journey', async ({ context }) => {
       // Full workflow
     });
   });
   ```

4. **Document in this README:**
   - Add to "Complete Journey Tests" section
   - Update coverage table
   - Include user story and scenarios

### Best Practices

1. **Use Multi-Context Testing:**
   ```typescript
   const patientPage = await context.newPage();
   const pharmacistPage = await context.newPage();
   ```

2. **Mock All API Calls:**
   ```typescript
   await mockApiResponse(page, '**/api/endpoint', { ... });
   ```

3. **Use Data Test IDs:**
   ```typescript
   await page.locator('[data-testid="unique-id"]').click();
   ```

4. **Clean Up After Tests:**
   ```typescript
   await patientPage.close();
   await clearAuth(page);
   ```

5. **Verify Success States:**
   ```typescript
   await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
   ```

---

## Debugging Journey Tests

### Common Issues

**1. Test Timeout:**
```typescript
// Increase timeout for complex journeys
test.setTimeout(120000); // 2 minutes
```

**2. Race Conditions:**
```typescript
// Wait for navigation
await page.waitForURL(/.*\/dashboard/);

// Wait for element
await expect(page.locator('[data-testid="element"]')).toBeVisible({ timeout: 10000 });
```

**3. Mock Not Intercepted:**
```typescript
// Mock BEFORE navigation
await mockApiResponse(page, '**/api/endpoint', { ... });
await page.goto('/path');
```

### Debugging Tools

**1. Playwright Inspector:**
```bash
npx playwright test --debug
```

**2. Trace Viewer:**
```bash
npx playwright show-trace trace.zip
```

**3. Screenshots:**
```typescript
await page.screenshot({ path: 'debug.png' });
```

**4. Console Logs:**
```typescript
page.on('console', msg => console.log(msg.text()));
```

---

## Performance Considerations

### Test Duration

| Journey Test | Duration | Browser Contexts |
|--------------|----------|------------------|
| Teleconsultation | ~45s | 2 (patient, pharmacist) |
| VIP Membership | ~30s | 1 (patient) |
| Prescription Lifecycle | ~60s | 3 (doctor, pharmacist, patient) |
| Delivery Workflow | ~40s | 1 (driver) |

### Optimization Strategies

1. **Parallel Execution:**
   ```typescript
   test.describe.configure({ mode: 'parallel' });
   ```

2. **Shared Context:**
   ```typescript
   // Reuse authentication state
   test.use({ storageState: 'auth.json' });
   ```

3. **Selective Mocking:**
   - Mock only essential endpoints
   - Use mock data consistently

4. **CI Optimization:**
   - Run on single browser in CI (chromium)
   - Enable retries for flaky tests
   - Shard tests across workers

---

## Future Journey Tests (Roadmap)

### Planned Journey Tests

1. **Doctor-Patient Consultation Journey**
   - Doctor reviews patient history
   - Doctor creates prescription
   - Direct doctor-patient messaging
   - Follow-up appointment scheduling

2. **Nurse Medication Ordering Journey**
   - Nurse accesses patient records
   - Nurse orders medications for patient
   - Nurse tracks delivery
   - Nurse confirms receipt

3. **Emergency Prescription Journey**
   - Patient requests emergency prescription
   - Pharmacist reviews urgently
   - Express delivery assigned
   - Real-time tracking
   - Immediate fulfillment

4. **Insurance Integration Journey**
   - Patient submits prescription
   - Insurance verification
   - Coverage calculation
   - Co-payment processing
   - Claims submission

5. **Multi-Pharmacy Network Journey**
   - Patient searches across pharmacies
   - Compares availability and prices
   - Orders from different pharmacies
   - Coordinated delivery

---

## Metrics and Reporting

### Test Metrics Tracked

- ✅ Journey completion rate
- ✅ Average test duration
- ✅ Failure rate per scenario
- ✅ Coverage per user role
- ✅ API mock hit rate

### Reports Generated

1. **HTML Report:**
   - Visual test results
   - Screenshots and videos
   - Trace files
   - Timing information

2. **JUnit XML:**
   - CI/CD integration
   - Test suite statistics
   - Failure details

3. **JSON Results:**
   - Programmatic analysis
   - Custom reporting
   - Trend analysis

---

## Contact and Support

**Test Maintenance:** Senior Software Engineer
**Documentation:** Developer Agent
**CI/CD Issues:** DevOps Team

**Resources:**
- [Playwright Documentation](https://playwright.dev)
- [MetaPharm Connect Architecture](../../docs/architecture.md)
- [API Documentation](../../docs/api.md)

---

**Last Updated:** 2025-12-08
**Version:** 1.0.0
**Status:** ✅ Production Ready
