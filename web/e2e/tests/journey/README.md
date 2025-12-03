# End-to-End (E2E) Journey Tests

This directory contains comprehensive end-to-end tests for the three critical user journeys in MetaPharm Connect:

## Test Suites

### 1. Prescription Journey (E2E-046)
**File:** `prescription-journey.test.ts`

**Purpose:** Tests the complete prescription lifecycle from patient upload through delivery and adherence tracking.

**Journey Steps Covered:**
1. Patient uploads prescription photo to the platform
2. OCR transcription automatically extracts medication details
3. System checks for drug interactions using FDB MedKnowledge
4. Pharmacist reviews and approves prescription
5. Order created and payment processed securely
6. Delivery assigned and tracked in real-time with GPS
7. Patient receives medication and confirms delivery
8. Adherence tracking begins automatically

**Key Test Cases:**
- `Step 1: Patient uploads prescription photo` - Validates file upload functionality
- `Step 2: OCR transcribes prescription with high accuracy` - Verifies OCR confidence and medication extraction
- `Step 3: Drug interaction check identifies potential issues` - Tests interaction detection and warnings
- `Step 4: Pharmacist reviews and approves prescription` - Validates pharmacist workflow
- `Step 5: Order created and payment processed successfully` - Tests order and payment flows
- `Step 6: Delivery assigned and tracked with real-time updates` - Verifies tracking and location updates
- `Step 7: Patient receives medication and confirms delivery` - Tests delivery confirmation
- `Step 8: Adherence tracking begins after delivery` - Validates adherence tracking startup
- `Complete prescription lifecycle (all 8 steps)` - Full end-to-end journey test
- `Payment failure handled gracefully with retry option` - Error handling validation

**Expected Behavior:**
- Prescription data flows consistently through all 8 steps
- All interactions are logged for HIPAA audit compliance
- Controlled substances require additional justification
- Drug allergies prevent prescription (or require override with justification)
- Payment failures trigger appropriate error messages and retry options

---

### 2. Teleconsultation Journey (E2E-047)
**File:** `teleconsultation-journey.test.ts`

**Purpose:** Tests the complete teleconsultation lifecycle from booking through follow-up scheduling and recording storage.

**Journey Steps Covered:**
1. Patient books teleconsultation with available pharmacist
2. Reminders sent to both parties before appointment
3. Both parties successfully join video call
4. Pharmacist takes notes with automatic voice transcription
5. Prescription created and digitally signed during call
6. Follow-up consultation scheduled
7. Recording saved with patient consent verification

**Key Test Cases:**
- `Step 1: Patient books teleconsultation successfully` - Tests booking flow with available pharmacists
- `Step 2: Reminders sent to both parties before consultation` - Validates reminder delivery (email/SMS)
- `Step 3: Both parties join video call successfully` - Tests Twilio integration and audio/video streams
- `Step 4: Pharmacist takes notes and voice is transcribed` - Validates voice-to-text conversion and transcription display
- `Step 5: Prescription created and signed during teleconsultation` - Tests prescription creation during call with digital signature
- `Step 6: Follow-up consultation scheduled` - Validates follow-up scheduling UI and logic
- `Step 7: Recording saved with patient consent` - Tests consent verification and recording storage
- `Complete teleconsultation lifecycle (all 7 steps)` - Full end-to-end journey test
- `Call disruption handled gracefully with reconnect option` - Error handling for connection loss

**Expected Behavior:**
- Reminders sent 24 hours and 1 hour before consultation
- Video call uses Twilio with end-to-end encryption
- Voice transcription has minimum 90% accuracy
- Prescriptions can be created and signed during call
- Recording requires explicit consent (GDPR compliance)
- Disconnections allow graceful reconnection within 5 minutes

---

### 3. VIP Membership Journey (E2E-048)
**File:** `vip-membership-journey.test.ts`

**Purpose:** Tests the complete VIP membership lifecycle including signup, points earning, tier upgrades, and benefits.

**Journey Steps Covered:**
1. Patient signs up for VIP (Golden MetaPharm program)
2. Points earned on every purchase (1 point per CHF spent + bonuses)
3. Tier upgrade automatically triggered when threshold reached
4. Discount applied on next order after tier upgrade
5. Birthday bonus received on patient's birthday
6. Free delivery eligibility verified based on tier

**VIP Tier Structure:**
- **Bronze** (0 pts): Initial tier, 5% discount, sign-up bonus (100 pts)
- **Silver** (500 pts): 10% discount, free delivery over 100 CHF
- **Gold** (1500 pts): 15% discount, always free delivery, priority support
- **Platinum** (3000+ pts): 20% discount, free delivery, exclusive products, birthday bonus 150 pts

**Key Test Cases:**
- `Step 1: Patient signs up for VIP membership` - Tests VIP signup and initial points allocation
- `Step 2: Points earned on purchase` - Validates points calculation (1 pt/CHF)
- `Step 3: Tier upgrade triggered when points threshold reached` - Tests automatic tier progression
- `Step 4: VIP discount applied on next order` - Validates discount calculation and display
- `Step 5: Birthday bonus received on birthday` - Tests birthday detection and bonus awarding
- `Step 6: Free delivery eligibility verified by tier` - Validates free delivery logic by tier
- `Complete VIP membership lifecycle (all 6 steps)` - Full end-to-end journey test
- `VIP tier benefits displayed correctly for each level` - Tests tier comparison display
- `Duplicate VIP signup prevented with appropriate message` - Error handling for duplicate signup

**Expected Behavior:**
- Points calculation: 1 point per CHF spent + tier bonuses
- Tier upgrades trigger immediately when threshold reached
- Discounts apply to all future orders until downgrade
- Birthday bonus (100 pts, 30-day expiration) awarded on birthday
- Free delivery thresholds vary by tier
- Duplicate signup prevented with user-friendly error

---

## Shared Utilities

### `e2e-utils.ts`

Provides reusable components for journey testing:

#### Journey State Manager
```typescript
const journeyState = new JourneyStateManager();
journeyState.set('prescriptionData', data);
const data = journeyState.get('prescriptionData');
```

Tracks data across multiple test steps to verify consistency.

#### Test Data Generators

Generate mock data for each journey type:

```typescript
// Prescription journey
const prescriptionData = generatePrescriptionJourneyData({
  interactionCheckStatus: 'warning',
  paymentStatus: 'completed'
});

// Teleconsultation journey
const consultationData = generateTeleconsultationJourneyData({
  recordingConsent: true,
  followUpScheduled: true
});

// VIP membership journey
const vipData = generateVIPMembershipJourneyData({
  currentTier: 'silver',
  discountPercentage: 10
});
```

#### Service Mocks

Mock individual journey steps:

```typescript
// Prescription steps
await mockPrescriptionUploadStep(page, journeyData);
await mockDrugInteractionCheckStep(page, journeyData);
await mockPharmacistApprovalStep(page, journeyData);
await mockPaymentProcessingStep(page, journeyData);
await mockDeliveryAssignmentStep(page, journeyData);
await mockAdherenceTrackingStep(page, journeyData);

// Teleconsultation steps
await mockTeleconsultationBookingStep(page, journeyData);
await mockReminderSendingStep(page, journeyData);
await mockVideoCallJoinStep(page, journeyData);
await mockVoiceTranscriptionStep(page, journeyData);
await mockFollowUpSchedulingStep(page, journeyData);
await mockRecordingSavingStep(page, journeyData);

// VIP membership steps
await mockVIPSignupStep(page, journeyData);
await mockPointsEarningStep(page, journeyData);
await mockTierUpgradeStep(page, journeyData);
await mockDiscountApplicationStep(page, journeyData);
await mockBirthdayBonusStep(page, journeyData);
await mockFreeDeliveryEligibilityStep(page, journeyData);
```

#### Assertion Helpers

Verify journey completion:

```typescript
await assertPrescriptionJourneyComplete(page, journeyData);
await assertTeleconsultationJourneyComplete(page, journeyData);
await assertVIPMembershipJourneyComplete(page, journeyData);
```

---

## Running the Tests

### Run all journey tests
```bash
npm test -- tests/journey/
```

### Run specific journey test
```bash
npm test -- tests/journey/prescription-journey.test.ts
npm test -- tests/journey/teleconsultation-journey.test.ts
npm test -- tests/journey/vip-membership-journey.test.ts
```

### Run specific test case
```bash
npm test -- tests/journey/prescription-journey.test.ts -g "Step 1"
npm test -- tests/journey/prescription-journey.test.ts -g "Complete prescription lifecycle"
```

### Run with debugging
```bash
npm test -- tests/journey/ --debug
npm test -- tests/journey/ --headed
```

### Generate coverage report
```bash
npm test -- tests/journey/ --coverage
```

---

## Test Infrastructure

### Fixtures & Utilities

All tests use the extended `auth.fixture.ts` which provides:
- `patientPage` - Authenticated patient context
- `pharmacistPage` - Authenticated pharmacist context
- `loginPage` - Login page object

### API Mocking

All external services are mocked using Playwright's route interception:
- OCR service (prescription transcription)
- FDB MedKnowledge (drug interactions)
- Twilio (video calling)
- Payment processor
- Delivery tracking service
- Email/SMS delivery service

No real API calls are made during test execution.

### Data Consistency

Journey state manager ensures:
- Data created in step 1 appears in step 5
- IDs generated consistently throughout journey
- Status transitions validated across steps
- Error conditions properly handled

---

## Service Dependencies

### External Services Mocked

| Service | Purpose | Mock Endpoint |
|---------|---------|---|
| OCR API | Prescription transcription | `/ocr/transcribe` |
| FDB MedKnowledge | Drug interactions | `/prescriptions/check-interactions` |
| Twilio | Video calling | `/consultations/*/join` |
| Payment Processor | Payment processing | `/payments/process` |
| Delivery Service | Delivery assignment & tracking | `/deliveries/*` |
| Email Service | Reminder emails | (mocked in route) |
| SMS Service | SMS reminders | (mocked in route) |

---

## Error Scenarios Tested

### Prescription Journey
- Payment failure with retry option
- Drug interaction warnings
- Allergies blocking prescription (override with justification)
- OCR confidence below threshold
- Missing required fields

### Teleconsultation Journey
- Connection loss during call
- Unavailable pharmacists
- Recording consent denial
- Time slot booking conflicts
- Reminder delivery failures

### VIP Membership Journey
- Duplicate signup prevention
- Points expiration (birthday bonus)
- Tier downgrade (if applicable)
- Insufficient points for discount
- Birthday bonus eligibility validation

---

## Best Practices for Journey Tests

1. **Use Journey State Manager** - Track data across steps to catch consistency issues
2. **Mock All External Services** - Never depend on real external services
3. **Test Both Happy Path and Error Cases** - Validate error handling
4. **Verify Data Flows** - Ensure data created in step 1 appears in step 8
5. **Check Audit Trails** - Verify logging for compliance
6. **Use Test Data Generators** - Keep test data realistic and consistent
7. **Clean Up Between Tests** - Use `beforeEach` to reset state

---

## Future Enhancements

- [ ] Performance profiling for each journey step
- [ ] Load testing with concurrent journeys
- [ ] API contract validation against real endpoints
- [ ] Video stream quality testing (Twilio)
- [ ] Payment failure retry logic validation
- [ ] SMS/Email content validation
- [ ] GDPR consent flow comprehensive testing
- [ ] Multi-language journey testing (French/English/German)

---

## Documentation

For detailed requirements, see:
- **Prescription Journey**: `initial-docs/CDC_Final.md` - Section "Prescription Flow"
- **Teleconsultation**: `initial-docs/CDC_Final.md` - Section "Pharmacist-Patient Teleconsultation"
- **VIP Program**: `initial-docs/CDC_Final.md` - Section "Golden MetaPharm VIP Program"

---

## Questions?

For test infrastructure questions, contact the QA team.
For feature requirements, refer to the Cahier des Charges (CDC_Final.md).
