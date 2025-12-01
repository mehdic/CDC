# MetaPharm Connect E2E Test Suite

End-to-end testing for MetaPharm Connect using Playwright, covering all 5 user roles and critical workflows.

## Quick Start

```bash
# Install dependencies
npm install --workspace=e2e

# Run all tests
npm run test --workspace=e2e

# Run with UI
npm run test:ui --workspace=e2e
```

## Test Statistics

- **Total Tests**: 133
- **Test Files**: 11
- **Page Objects**: 4
- **User Roles**: 5
- **Browsers**: 3 (Chromium, Firefox, WebKit)
- **Mobile Viewports**: 2 (iPhone 12, Pixel 5)

## Test Coverage

### Authentication (18 tests)
- Login for all 5 roles
- Error handling
- Session security
- Logout workflow

### Patient Features (28 tests)
- Appointment booking
- Prescription refills
- Teleconsultation

### Pharmacist Features (34 tests)
- Prescription processing
- Inventory management
- Secure messaging

### Doctor Features (10 tests)
- Patient management
- Medical records
- Prescription creation

### Nurse Features (11 tests)
- Medication ordering
- Patient records access

### Delivery Features (12 tests)
- Delivery tracking
- Order management
- GPS and QR scanning

## Running Tests

```bash
# By category
npm run test:auth --workspace=e2e
npm run test:patient --workspace=e2e
npm run test:pharmacist --workspace=e2e
npm run test:doctor --workspace=e2e
npm run test:nurse --workspace=e2e
npm run test:delivery --workspace=e2e

# By browser
npm run test:chrome --workspace=e2e
npm run test:firefox --workspace=e2e
npm run test:webkit --workspace=e2e

# Mobile
npm run test:mobile --workspace=e2e

# Interactive modes
npm run test:headed --workspace=e2e    # See browser
npm run test:ui --workspace=e2e        # Playwright UI
npm run test:debug --workspace=e2e     # Step through

# View reports
npm run report --workspace=e2e
```

## Test Files

### Tests
- `tests/auth/` - Login/logout for all roles
- `tests/patient/` - Appointments, refills, teleconsultation
- `tests/pharmacist/` - Prescriptions, inventory, messaging
- `tests/doctor/` - Patient management, prescriptions
- `tests/nurse/` - Medication ordering
- `tests/delivery/` - Delivery tracking

### Page Objects
- `LoginPage` - Authentication
- `DashboardPage` - Navigation
- `AppointmentPage` - Booking
- `MessagingPage` - Messaging

### Supporting Files
- `playwright.config.ts` - Multi-browser configuration
- `package.json` - Dependencies and scripts
- `E2E_TEST_SUITE_SUMMARY.md` - Detailed breakdown

## Key Features

✅ Multi-browser testing (Chrome, Firefox, Safari)
✅ Mobile and tablet viewports
✅ All 5 user roles covered
✅ Error handling scenarios
✅ Accessibility checks
✅ Screenshot/video on failure
✅ HTML, JUnit, and JSON reports
✅ CI/CD ready

## Configuration

### Environment
```bash
BASE_URL=http://localhost:3000
```

### Playwright Features
- Automatic browser management
- Network synchronization
- Failure screenshots
- Video recording
- JUnit reports for CI

## Test Data

Predefined users for testing:
```
patient@test.metapharm.ch
pharmacist@test.metapharm.ch
doctor@test.metapharm.ch
nurse@test.metapharm.ch
delivery@test.metapharm.ch
```

## Reports

- **HTML**: `playwright-report/index.html`
- **JUnit**: `test-results/junit.xml`
- **Screenshots**: On failure
- **Videos**: Mobile tests on failure

## Documentation

See `E2E_TEST_SUITE_SUMMARY.md` for:
- Complete test breakdown
- All 133 test cases listed
- Page object methods
- Test fixtures
- Utilities reference

## Troubleshooting

### Tests timing out
```bash
npm run test --workspace=e2e -- --timeout=60000
```

### Browser not found
```bash
npx playwright install
```

### Element not visible
- Use `--headed` to debug
- Check application is running
- Verify selectors match current UI

## Contributing

1. Use page objects for element selection
2. Include mobile viewport tests
3. Test error scenarios
4. Keep test data in fixtures
5. Use descriptive test names

## Next Steps

1. Install Playwright browsers: `npx playwright install`
2. Start application: `npm run dev --workspace=web`
3. Run tests: `npm run test --workspace=e2e`
4. View results: `npm run report --workspace=e2e`
