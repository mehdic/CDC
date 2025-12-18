# Delivery App E2E Tests

Comprehensive end-to-end tests for the MetaPharm Connect Delivery App covering all critical user workflows.

## 📋 Test Coverage

### 1. Complete Delivery Workflow (`01-complete-delivery.e2e.ts`)
Tests the full happy path delivery:
- Login and authentication
- Viewing and accepting deliveries
- GPS navigation to pharmacy
- QR code package pickup
- Navigation to patient address
- Proof of delivery collection (signature, photo)
- Delivery completion and statistics update
- Offline mode synchronization

### 2. Cold Chain Handling (`02-cold-chain.e2e.ts`)
Tests temperature-sensitive medication delivery:
- Cold chain indicator recognition
- Temperature monitoring during transit
- Temperature log verification
- Alert system for out-of-range temperatures
- Temperature compliance reporting
- Temperature history charts

### 3. Controlled Substance Workflow (`03-controlled-substance.e2e.ts`)
Tests narcotics delivery with enhanced security:
- Security requirement acknowledgment
- Patient ID verification with photo capture
- Mandatory signature collection
- Security checklist validation
- Audit trail logging
- Patient unavailability handling (return to pharmacy)

### 4. Failed Delivery Scenarios (`04-failed-delivery.e2e.ts`)
Tests various failure cases:
- Patient absent
- Wrong address correction
- Refused delivery
- GPS location validation
- Package return to pharmacy
- Contact patient attempts
- Failed delivery statistics

### 5. GPS Tracking Verification (`05-gps-tracking.e2e.ts`)
Tests real-time GPS tracking:
- Location updates during transit
- Route following and waypoint tracking
- ETA calculation and updates
- Location history logging
- Turn-by-turn navigation
- Route deviation detection
- GPS signal loss handling
- Offline location caching

## 🚀 Setup

### Prerequisites

#### Option 1: Detox (Recommended)

1. **Install Detox CLI globally:**
   ```bash
   npm install -g detox-cli
   ```

2. **Install Detox as dev dependency (once dependency issues are resolved):**
   ```bash
   cd mobile/delivery-app
   npm install --save-dev detox --legacy-peer-deps
   ```

3. **For iOS:**
   - Xcode 14+ installed
   - iOS Simulator configured
   - Run: `xcode-select --install`

4. **For Android:**
   - Android Studio installed
   - Android SDK and emulator configured
   - Run: `$ANDROID_HOME/emulator/emulator -list-avds` to verify emulators

#### Option 2: Maestro (Fallback)

1. **Install Maestro:**
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. **Start iOS Simulator or Android Emulator:**
   ```bash
   # iOS
   open -a Simulator

   # Android
   $ANDROID_HOME/emulator/emulator -avd Pixel_7_API_34
   ```

## 🧪 Running Tests

### Detox Tests

#### iOS
```bash
# Build app for testing
detox build --configuration ios.sim.debug

# Run all E2E tests
detox test --configuration ios.sim.debug

# Run specific test file
detox test e2e/tests/01-complete-delivery.e2e.ts --configuration ios.sim.debug

# Run with logs
detox test --configuration ios.sim.debug --loglevel verbose

# Run in headless mode (CI)
detox test --configuration ios.sim.debug --headless
```

#### Android
```bash
# Build app for testing
detox build --configuration android.emu.debug

# Run all E2E tests
detox test --configuration android.emu.debug

# Run specific test
detox test e2e/tests/02-cold-chain.e2e.ts --configuration android.emu.debug

# Run with recording
detox test --configuration android.emu.debug --record-videos all
```

### Maestro Tests

```bash
# Run all Maestro tests
maestro test e2e/.maestro/

# Run specific test
maestro test e2e/.maestro/01-complete-delivery.yaml

# Run with recording
maestro test --format junit e2e/.maestro/ > test-results.xml

# Debug mode
maestro test --debug e2e/.maestro/01-complete-delivery.yaml
```

## 🏗️ Test Architecture

### Directory Structure
```
e2e/
├── helpers/
│   ├── mockGPS.ts          # GPS location mocking utilities
│   ├── mockAPI.ts          # API response mocking
│   └── testData.ts         # Test data fixtures
├── tests/
│   ├── 01-complete-delivery.e2e.ts
│   ├── 02-cold-chain.e2e.ts
│   ├── 03-controlled-substance.e2e.ts
│   ├── 04-failed-delivery.e2e.ts
│   └── 05-gps-tracking.e2e.ts
├── .maestro/               # Maestro YAML test flows (fallback)
│   ├── 01-complete-delivery.yaml
│   ├── 02-cold-chain.yaml
│   └── 03-gps-tracking.yaml
├── jest.config.js          # Jest configuration for Detox
└── README.md               # This file
```

### Test Helpers

#### GPS Mocking (`helpers/mockGPS.ts`)
- Predefined test locations in Switzerland (Geneva, Zurich)
- Route generation between waypoints
- Location permission granting
- Route movement simulation

#### API Mocking (`helpers/mockAPI.ts`)
- Mock API responses for delivery endpoints
- Accept/update delivery status
- Submit proof of delivery
- Location updates

#### Test Data (`helpers/testData.ts`)
- Standard delivery fixtures
- Cold chain delivery data
- Controlled substance delivery data
- Failed delivery scenarios
- Test user credentials

## 🔧 Configuration

### Detox Configuration (`detox.config.js`)

Supports both iOS and Android platforms with debug and release builds:

- **iOS Simulator:** iPhone 15 Pro
- **Android Emulator:** Pixel 7 API 34
- **Test timeout:** 120 seconds
- **Jest runner:** Single worker for test isolation

### Environment Variables

Create `.env.test` in the root directory:

```env
# API Configuration
TEST_API_URL=http://localhost:3000/api
TEST_API_TIMEOUT=30000

# Test User Credentials
TEST_USER_EMAIL=delivery@test.com
TEST_USER_PASSWORD=Test123!

# GPS Test Locations (Switzerland)
TEST_PHARMACY_LAT=46.2044
TEST_PHARMACY_LNG=6.1432
TEST_PATIENT_LAT=46.2097
TEST_PATIENT_LNG=6.1432

# Feature Flags
ENABLE_COLD_CHAIN_TESTS=true
ENABLE_GPS_TRACKING_TESTS=true
ENABLE_OFFLINE_TESTS=true
```

## 📊 Test Reports

### Detox Reports

Test artifacts are saved to:
- **Screenshots:** `e2e/artifacts/<timestamp>/screenshots/`
- **Videos:** `e2e/artifacts/<timestamp>/videos/`
- **Logs:** `e2e/artifacts/<timestamp>/logs/`

### Maestro Reports

Reports are generated in JUnit XML format:
```bash
maestro test --format junit e2e/.maestro/ > test-results.xml
```

## 🐛 Debugging

### Detox Debugging

1. **Run tests in debug mode:**
   ```bash
   detox test --debug-synchronization 500 --configuration ios.sim.debug
   ```

2. **Enable element inspector:**
   - Shake device/simulator during test
   - Use Detox element inspector

3. **Check logs:**
   ```bash
   detox test --loglevel trace
   ```

### Maestro Debugging

1. **Interactive mode:**
   ```bash
   maestro test --debug e2e/.maestro/01-complete-delivery.yaml
   ```

2. **Studio mode (visual debugger):**
   ```bash
   maestro studio
   ```

## 🚨 Common Issues

### Issue: Detox installation fails with peer dependency conflicts
**Solution:** Use `--legacy-peer-deps` flag or wait for dependency updates:
```bash
npm install --save-dev detox --legacy-peer-deps
```

### Issue: GPS mocking not working on Android
**Solution:** Ensure location permissions are granted in test setup:
```typescript
await device.launchApp({
  permissions: { location: 'always' }
});
```

### Issue: Tests timeout waiting for elements
**Solution:** Increase timeout in `detox.config.js`:
```javascript
testRunner: {
  jest: {
    setupTimeout: 180000  // 3 minutes
  }
}
```

### Issue: QR scanner not working in tests
**Solution:** Use manual entry fallback for E2E tests:
```typescript
// Instead of actual camera scan
await element(by.id('manual-entry-button')).tap();
await element(by.id('qr-code-input')).typeText('QR-CODE-HERE');
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: |
          cd mobile/delivery-app
          npm ci --legacy-peer-deps

      - name: Build app
        run: detox build --configuration ios.sim.release

      - name: Run E2E tests
        run: detox test --configuration ios.sim.release --headless --record-videos failing

      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-artifacts
          path: mobile/delivery-app/e2e/artifacts/

  e2e-android:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Android SDK
        uses: android-actions/setup-android@v2

      - name: Install dependencies
        run: |
          cd mobile/delivery-app
          npm ci --legacy-peer-deps

      - name: Build app
        run: detox build --configuration android.emu.release

      - name: Run E2E tests
        run: detox test --configuration android.emu.release --headless
```

## 📝 Writing New Tests

### Test Template

```typescript
import { device, element, by, expect as detoxExpect, waitFor } from 'detox';
import { testUser } from '../helpers/testData';
import { grantLocationPermissions } from '../helpers/mockGPS';

describe('Feature Name', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { location: 'always', camera: 'YES' },
      newInstance: true
    });
    await grantLocationPermissions(device);
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should do something', async () => {
    // Login
    await element(by.id('email-input')).typeText(testUser.email);
    await element(by.id('password-input')).typeText(testUser.password);
    await element(by.id('login-button')).tap();

    // Test steps
    await waitFor(element(by.id('some-element')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.text('Expected Text'))).toBeVisible();

    // Assertions
    await detoxExpect(element(by.id('result'))).toHaveText('Success');
  });
});
```

### Best Practices

1. **Use testID props** in React components for stable selectors
2. **Wait for elements** before interacting (use `waitFor`)
3. **Mock external dependencies** (GPS, camera, API)
4. **Keep tests independent** (no shared state between tests)
5. **Use descriptive test names** (describe what is being tested)
6. **Clean up after tests** (`beforeEach` resets state)
7. **Handle async operations** properly (await all promises)
8. **Test negative scenarios** (failures, errors, edge cases)

## 🎯 Test Scenarios Checklist

- ✅ Complete delivery workflow (order → delivered → confirmed)
- ✅ Cold chain temperature monitoring
- ✅ Controlled substance ID verification and signature
- ✅ Failed delivery (patient absent, return to pharmacy)
- ✅ GPS tracking and location updates
- ✅ QR code scanning for package verification
- ✅ Offline mode and data synchronization
- ✅ Wrong address detection and prevention
- ✅ Route deviation detection
- ✅ Contact patient functionality

## 📚 Additional Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Maestro Documentation](https://maestro.mobile.dev/)
- [React Native Testing Best Practices](https://reactnative.dev/docs/testing-overview)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

## 🤝 Contributing

When adding new E2E tests:

1. Follow the existing test structure
2. Add test data to `helpers/testData.ts`
3. Use helper functions for GPS and API mocking
4. Document new test scenarios in this README
5. Ensure tests pass on both iOS and Android (if applicable)
6. Create corresponding Maestro YAML flow for fallback

## 📞 Support

For issues or questions about E2E tests:
- Check existing issues in the repository
- Review test logs in `e2e/artifacts/`
- Consult Detox/Maestro documentation
- Contact the QA team
