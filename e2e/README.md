# MetaPharm Connect - E2E Test Suite

Comprehensive end-to-end testing for the MetaPharm Connect platform using Playwright.

## Overview

This E2E test suite covers all critical user flows for the 5 distinct user roles:

- **Patient**: Appointment booking, prescription refills, teleconsultation
- **Pharmacist**: Prescription processing, inventory management, secure messaging
- **Doctor**: Patient management, prescription creation and renewal
- **Nurse**: Medication ordering, patient record access
- **Delivery Personnel**: Delivery tracking, order management, proof of delivery

## Test Coverage

### Test Structure

```
e2e/
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts (10 tests)
│   │   └── logout.spec.ts (8 tests)
│   ├── patient/
│   │   ├── appointments.spec.ts (10 tests)
│   │   ├── refills.spec.ts (9 tests)
│   │   └── teleconsult.spec.ts (9 tests)
│   ├── pharmacist/
│   │   ├── prescriptions.spec.ts (10 tests)
│   │   ├── inventory.spec.ts (12 tests)
│   │   └── messaging.spec.ts (12 tests)
│   ├── doctor/
│   │   └── patient-management.spec.ts (10 tests)
│   ├── nurse/
│   │   └── medication-orders.spec.ts (11 tests)
│   ├── delivery/
│   │   └── delivery-tracking.spec.ts (12 tests)
│   └── journeys/ (NEW - T7-008)
│       ├── prescription-lifecycle.spec.ts (5 tests)
│       ├── teleconsultation.spec.ts (5 tests)
│       ├── vip-membership.spec.ts (6 tests)
│       └── delivery-workflow.spec.ts (7 tests)
├── pages/
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── AppointmentPage.ts
│   ├── MessagingPage.ts
│   ├── PrescriptionPage.ts (NEW)
│   ├── TeleconsultationPage.ts (NEW)
│   ├── VIPMembershipPage.ts (NEW)
│   └── DeliveryPage.ts (NEW)
├── fixtures/
│   ├── users.ts
│   └── test-data.ts
├── utils/
│   ├── helpers.ts
│   └── api-mocks.ts
└── playwright.config.ts
```

## Installation

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Setup

```bash
# Install dependencies
npm install --workspace=e2e

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Run All Tests

```bash
npm run test --workspace=e2e
```

### Run Tests by Category

```bash
# Authentication tests
npm run test:auth --workspace=e2e

# Patient flows
npm run test:patient --workspace=e2e

# Pharmacist flows
npm run test:pharmacist --workspace=e2e

# Doctor flows
npm run test:doctor --workspace=e2e

# Nurse flows
npm run test:nurse --workspace=e2e

# Delivery flows
npm run test:delivery --workspace=e2e

# Journey tests (NEW - T7-008)
npm run test:journeys --workspace=e2e
```

### Run Tests in Headed Mode

```bash
npm run test:headed --workspace=e2e
```

### Run Tests with UI

```bash
npm run test:ui --workspace=e2e
```

### Debug Tests

```bash
npm run test:debug --workspace=e2e
```

### Run on Specific Browser

```bash
npm run test:chrome --workspace=e2e
npm run test:firefox --workspace=e2e
npm run test:webkit --workspace=e2e
```

### Run on Mobile

```bash
npm run test:mobile --workspace=e2e
```

## Test Statistics

### Total Test Count

- **Authentication**: 18 tests
- **Patient Flows**: 28 tests
- **Pharmacist Flows**: 34 tests
- **Doctor Flows**: 10 tests
- **Nurse Flows**: 11 tests
- **Delivery Personnel**: 12 tests
- **Journey Tests** (NEW): 23 tests
  - Prescription Lifecycle: 5 tests
  - Teleconsultation: 5 tests
  - VIP Membership: 6 tests
  - Delivery Workflow: 7 tests

**Total: 136 tests** (previously 113)

### Coverage by Feature

#### Authentication (18 tests)
- Login for all 5 user roles
- Error handling for invalid credentials
- Session security and token management
- Logout and session cleanup

#### Patient Features (28 tests)
- Appointment booking and management
- Prescription refills with validation
- Teleconsultation scheduling
- Mobile responsiveness

#### Pharmacist Features (34 tests)
- Prescription review and approval/rejection
- Inventory management and low-stock alerts
- QR code scanning for stock updates
- Secure messaging with patients
- Drug interaction checking
- Patient allergy verification

#### Doctor Features (10 tests)
- Patient search and lookup
- Medical history access
- Prescription creation and renewal
- Lab results access
- Patient filtering by condition

#### Nurse Features (11 tests)
- Patient medication ordering
- Medical record access
- Allergy checking
- Active medication display
- Quantity validation

#### Delivery Features (12 tests)
- Order acceptance
- GPS tracking
- QR code scanning
- Proof of delivery capture
- Delivery completion tracking
- Special instructions handling

## Page Objects

### LoginPage
- Login with credentials
- Role-based login
- Logout
- Error message handling
- Remember me checkbox
- Password recovery

### DashboardPage
- Dashboard navigation
- Section visibility
- User greeting display
- Settings access
- Notification management

### AppointmentPage
- Appointment booking
- Date/time selection
- Type and reason specification
- Appointment listing
- Cancellation
- Mobile responsiveness

### MessagingPage
- Message composition
- Message sending
- Conversation browsing
- Message search
- Reply functionality
- Conversation management

## Test Data

### User Fixtures
- Patient credentials
- Pharmacist credentials
- Doctor credentials
- Nurse credentials
- Delivery personnel credentials
- Invalid user credentials for error testing

### Data Fixtures
- Prescription data (valid, invalid, empty)
- Appointment data (future, past, missing dates)
- Refill data with quantities
- Inventory data with stock levels
- Messaging data
- E-commerce data
- Delivery data

## Utilities

### TestHelpers
- Network synchronization
- Storage management
- Auth token retrieval
- Viewport checking
- Date/time formatting
- Random data generation
- Accessibility checking
- Screenshot capture

### APIMocks
- Login endpoint mocking
- Prescription endpoint mocking
- Appointment mocking
- Message endpoint mocking
- Inventory endpoint mocking
- User profile mocking
- Delivery order mocking
- Request logging and interception

## Configuration

### Playwright Config

- Multi-browser testing (Chromium, Firefox, WebKit)
- Mobile viewport testing (iPhone 12, Pixel 5, iPad Pro)
- Tablet viewport testing
- Screenshots on failure
- Video recording on failure
- Automatic report generation

### Environment Variables

```bash
BASE_URL=http://localhost:3000  # Application base URL
```

## Viewing Test Results

### HTML Report

```bash
npm run report --workspace=e2e
```

### JUnit Report

Generated at: `e2e/test-results/junit.xml`

### JSON Report

Generated at: `e2e/test-results/results.json`

## Best Practices

1. **Page Objects**: Use page objects for element selection and interaction
2. **Fixtures**: Use test data fixtures for consistency
3. **Helpers**: Use helper utilities for common operations
4. **Error Handling**: Tests should handle element visibility gracefully
5. **Mobile Testing**: Tests include mobile viewport verification
6. **Accessibility**: Tests check for basic accessibility compliance
7. **Async/Await**: Always wait for network and element state
8. **Naming**: Use descriptive test names matching user flows

## CI/CD Integration

The E2E tests are configured for CI/CD pipelines:

- Single worker execution in CI mode
- Automatic browser installation
- JUnit and JSON report generation
- Screenshot and video capture on failures
- Retry logic for flaky tests

## Troubleshooting

### Tests Timing Out

```bash
# Increase timeout globally
npm run test --workspace=e2e -- --timeout=60000
```

### Element Not Found

- Check if application is running on correct port
- Verify selectors match current UI
- Use `--headed` mode to debug
- Check browser console for errors

### Mobile Test Failures

- Ensure viewport sizes are correct
- Check touch interactions vs click
- Verify responsive design breakpoints

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use page objects for element interaction
3. Include test fixtures in test data
4. Add appropriate error handling
5. Test on multiple viewports
6. Include comments for complex flows
7. Verify mobile compatibility

## Contact

For questions or issues with the E2E test suite, please contact the QA team.
