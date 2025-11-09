# MetaPharm Connect Mobile E2E Tests

Comprehensive End-to-End test suites for MetaPharm Connect doctor and patient mobile applications using Detox framework.

## Overview

This directory contains 11 E2E test suites covering all critical user workflows for the MetaPharm Connect mobile apps:

### Doctor App Tests (5 suites)

1. **doctor-auth.spec.ts** - Authentication with e-ID (HIN provider), MFA, session management, logout
2. **doctor-prescription.spec.ts** - Create prescriptions, select medications, set dosage, send to pharmacy, renewal
3. **doctor-messaging.spec.ts** - Secure messaging with pharmacists, attachments, encryption
4. **doctor-records.spec.ts** - Patient record access, medical history, Swiss cantonal health records (e-santé API), consent management
5. **doctor-teleconsultation.spec.ts** - View requests, accept/decline, video calls, screen sharing, in-call prescriptions

### Patient App Tests (6 suites)

6. **patient-auth.spec.ts** - Registration, login, social OAuth, profile management, logout
7. **patient-prescription.spec.ts** - Upload prescription photo (OCR), track status, history, renewal requests, notifications
8. **patient-teleconsultation.spec.ts** - Browse pharmacists, book appointments, join video calls, rate consultations
9. **patient-ecommerce.spec.ts** - Browse OTC products, cart management, checkout, payment, order tracking
10. **patient-appointments.spec.ts** - Book pharmacy visits, reschedule, cancel, reminders, check-in
11. **patient-vip.spec.ts** - VIP program enrollment, loyalty points, redeem rewards, exclusive offers, priority support

## Test Statistics

- **Total Test Suites**: 11 (5 doctor + 6 patient)
- **Estimated Total Tests**: ~250+ functional test cases
- **Framework**: Detox v20.18.5 with Jest
- **Language**: TypeScript

## Prerequisites

### System Requirements

- Node.js >= 20.0.0
- npm >= 10.0.0
- Xcode (for iOS testing)
- Android Studio (for Android testing)

### iOS Requirements

- Xcode 14.0 or later
- iOS Simulator (iPhone 14 or later recommended)
- Command Line Tools installed

### Android Requirements

- Android Studio
- Android SDK 30 or later
- Emulator configured (Pixel 3a API 30 recommended)

## Installation

From the mobile workspace root:

```bash
npm install
```

This installs all dependencies including:
- `detox` (v20.18.5)
- `ts-jest` (for TypeScript support)
- `@types/detox` (TypeScript definitions)

## Configuration

Detox configuration is defined in `.detoxrc.js`:

- **iOS Simulator**: `ios.sim.debug` and `ios.sim.release`
- **Android Emulator**: `android.emu.debug` and `android.emu.release`
- **Test Runner**: Jest with 120s timeout
- **Test Pattern**: `e2e/**/*.spec.ts`

## Running Tests

### iOS Tests

```bash
# Run all tests on iOS simulator (debug build)
npm run test:e2e:ios

# Run specific test suite
detox test --configuration ios.sim.debug e2e/doctor/doctor-auth.spec.ts

# Run tests with logs
detox test --configuration ios.sim.debug --loglevel verbose
```

### Android Tests

```bash
# Run all tests on Android emulator (debug build)
npm run test:e2e:android

# Run specific test suite
detox test --configuration android.emu.debug e2e/patient/patient-prescription.spec.ts
```

### Build Apps Before Testing

```bash
# iOS
detox build --configuration ios.sim.debug

# Android
detox build --configuration android.emu.debug
```

## Test Structure

Each test suite follows this pattern:

```typescript
describe('Feature Name', () => {
  beforeAll(async () => {
    // Launch app and login
  });

  beforeEach(async () => {
    // Navigate to feature screen
  });

  describe('Sub-feature', () => {
    it('should perform specific workflow', async () => {
      // Test steps using Detox API
    });
  });
});
```

### Common Detox Patterns

```typescript
// Find element and tap
await element(by.id('button-id')).tap();

// Type text
await element(by.id('input-id')).typeText('text');

// Wait for element
await waitFor(element(by.id('element-id')))
  .toBeVisible()
  .withTimeout(5000);

// Assertions
await expect(element(by.id('element-id'))).toBeVisible();
await expect(element(by.id('text-id'))).toHaveText('Expected Text');
```

## Test Data & Mocks

Tests use mock data for:

- **Authentication**: Mock e-ID login, OAuth providers
- **API Responses**: Mock backend responses for prescriptions, appointments, etc.
- **External Services**: Mock e-santé API, payment gateways (Stripe/PayPal), video calls
- **OCR**: Mock prescription image recognition

## Debugging

### View Test Logs

```bash
detox test --configuration ios.sim.debug --loglevel trace
```

### Record Test Videos

Add to `.detoxrc.js`:

```javascript
artifacts: {
  rootDir: './e2e/artifacts',
  plugins: {
    screenshot: 'failing',
    video: 'failing',
  },
}
```

### Run Single Test

```bash
detox test --configuration ios.sim.debug e2e/doctor/doctor-auth.spec.ts -f "should login with valid credentials"
```

## CI/CD Integration

For continuous integration, add to your pipeline:

```yaml
- name: Run E2E Tests
  run: |
    npm run test:e2e:ios
    npm run test:e2e:android
```

## Known Limitations

1. **Native Builds Required**: Tests require actual iOS/Android builds. Doctor and patient apps currently don't have native build configurations set up.

2. **Mock Services**: External services (e-santé, payment, video) are mocked and need proper integration testing.

3. **Test Data**: Tests assume specific test data exists in the backend.

## Next Steps

To run these tests in production:

1. Set up iOS and Android native projects for doctor and patient apps
2. Configure build schemes in Xcode and Gradle
3. Set up CI/CD pipeline with device/simulator access
4. Implement actual backend API mocks or use test environment
5. Add test data seeding scripts
6. Configure artifact collection (screenshots, videos, logs)

## Test Coverage

These tests cover:

- ✅ User authentication and authorization
- ✅ Core feature workflows (prescriptions, consultations, orders)
- ✅ Navigation and UI interactions
- ✅ Form validation and error handling
- ✅ Real-time updates and notifications
- ✅ Payment flows (mocked)
- ✅ Healthcare compliance features (e-santé, consent)

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Use descriptive test names that explain the workflow
3. Add helper functions for common operations
4. Mock external dependencies
5. Ensure tests are idempotent and can run in any order
6. Add comments for complex test logic

## Support

For issues or questions about E2E tests:
- Check Detox documentation: https://wix.github.io/Detox/
- Review existing test examples in this directory
- Contact the QA team

---

**Last Updated**: 2025-11-09
**Detox Version**: 20.18.5
**Test Framework**: Jest with TypeScript
