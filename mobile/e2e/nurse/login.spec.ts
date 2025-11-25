/**
 * Nurse App Login E2E Tests
 *
 * Tests the complete authentication workflow for nurses:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Session persistence across app restart
 * - HIN e-ID authentication flow
 */

describe('Nurse App Login', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Login Form Display', () => {
    it('should display login screen on app launch', async () => {
      await expect(element(by.id('nurse-login-screen'))).toBeVisible();
      await expect(element(by.text('MetaPharm Nurse'))).toBeVisible();
      await expect(element(by.text('Nurse Login'))).toBeVisible();
    });

    it('should display email and password input fields', async () => {
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('login-button'))).toBeVisible();
    });

    it('should display HIN e-ID login option', async () => {
      await expect(element(by.id('hin-eid-button'))).toBeVisible();
      await expect(element(by.text('Login with HIN e-ID'))).toBeVisible();
    });

    it('should display forgot password link', async () => {
      await expect(element(by.id('forgot-password-link'))).toBeVisible();
    });

    it('should display healthcare facility indicator', async () => {
      await expect(element(by.id('facility-indicator'))).toBeVisible();
    });
  });

  describe('Valid Credentials Login', () => {
    it('should login successfully with valid nurse credentials', async () => {
      await element(by.id('email-input')).typeText('nurse@healthcarefacility.ch');
      await element(by.id('password-input')).typeText('NursePass123!');
      await element(by.id('login-button')).tap();

      // Should navigate to patient list screen
      await waitFor(element(by.id('nurse-dashboard-screen'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('nurse-dashboard-screen'))).toBeVisible();
    });

    it('should display personalized welcome message after login', async () => {
      await loginAsNurse();

      await expect(element(by.id('welcome-message'))).toBeVisible();
      await expect(element(by.text(/Welcome|Patients|Medications/i))).toBeVisible();
    });

    it('should load patient list after successful login', async () => {
      await loginAsNurse();

      await waitFor(element(by.id('patient-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-list'))).toBeVisible();
    });

    it('should display nurse facility information', async () => {
      await loginAsNurse();

      await expect(element(by.id('facility-name'))).toBeVisible();
      await expect(element(by.id('facility-location'))).toBeVisible();
    });

    it('should display assigned patients count', async () => {
      await loginAsNurse();

      await expect(element(by.id('patients-count'))).toBeVisible();
    });
  });

  describe('Invalid Credentials', () => {
    it('should show error for invalid email', async () => {
      await element(by.id('email-input')).typeText('invalid@example.com');
      await element(by.id('password-input')).typeText('NursePass123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-error-message'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('login-error-message'))).toHaveText('Invalid email or password');
    });

    it('should show error for invalid password', async () => {
      await element(by.id('email-input')).typeText('nurse@healthcarefacility.ch');
      await element(by.id('password-input')).typeText('WrongPassword123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-error-message'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('login-error-message'))).toContain('Invalid');
    });

    it('should validate empty email field', async () => {
      await element(by.id('password-input')).typeText('NursePass123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('email-error'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('email-error'))).toBeVisible();
    });

    it('should validate empty password field', async () => {
      await element(by.id('email-input')).typeText('nurse@healthcarefacility.ch');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('password-error'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('password-error'))).toBeVisible();
    });

    it('should require both email and password', async () => {
      await element(by.id('login-button')).tap();

      await expect(element(by.id('email-error'))).toBeVisible();
      await expect(element(by.id('password-error'))).toBeVisible();
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session after app restart', async () => {
      // Login first
      await loginAsNurse();
      await waitFor(element(by.id('nurse-dashboard-screen'))).toBeVisible().withTimeout(10000);

      // Restart app
      await device.terminateApp();
      await device.launchApp({ newInstance: false });

      // Should still be logged in
      await waitFor(element(by.id('nurse-dashboard-screen'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('nurse-dashboard-screen'))).toBeVisible();
    });

    it('should persist user data after app restart', async () => {
      await loginAsNurse();
      await waitFor(element(by.id('nurse-dashboard-screen'))).toBeVisible().withTimeout(10000);

      // Restart app
      await device.terminateApp();
      await device.launchApp({ newInstance: false });

      // Nurse data should still be visible
      await expect(element(by.id('facility-name'))).toBeVisible();
      await expect(element(by.id('patient-list'))).toBeVisible();
    });

    it('should clear session data on logout', async () => {
      await loginAsNurse();

      // Navigate to profile and logout
      await element(by.id('profile-tab')).tap();
      await element(by.id('logout-button')).tap();
      await expect(element(by.id('logout-confirmation'))).toBeVisible();
      await element(by.id('confirm-logout-button')).tap();

      // Should return to login screen
      await waitFor(element(by.id('nurse-login-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('nurse-login-screen'))).toBeVisible();

      // Restart app - should be on login screen
      await device.terminateApp();
      await device.launchApp({ newInstance: false });
      await expect(element(by.id('nurse-login-screen'))).toBeVisible();
    });
  });

  describe('HIN e-ID Authentication', () => {
    it('should display HIN e-ID login button', async () => {
      await expect(element(by.id('hin-eid-button'))).toBeVisible();
      await expect(element(by.text('Login with HIN e-ID'))).toBeVisible();
    });

    it('should initiate HIN e-ID flow on button tap', async () => {
      await element(by.id('hin-eid-button')).tap();

      // Should show HIN e-ID authentication dialog or redirect
      await waitFor(element(by.id('hin-eid-auth-alert'))).toBeVisible().withTimeout(5000);
    });

    it('should handle HIN e-ID authentication success', async () => {
      await element(by.id('hin-eid-button')).tap();

      await waitFor(element(by.id('hin-eid-auth-alert'))).toBeVisible().withTimeout(5000);
      await element(by.text('Continue')).tap();

      // Should proceed to dashboard or verification
      await waitFor(
        element(by.id('nurse-dashboard-screen')).or(element(by.id('verification-screen')))
      ).toBeVisible().withTimeout(10000);
    });

    it('should handle HIN e-ID authentication cancellation', async () => {
      await element(by.id('hin-eid-button')).tap();

      await waitFor(element(by.id('hin-eid-auth-alert'))).toBeVisible().withTimeout(5000);
      await element(by.text('Cancel')).tap();

      // Should return to login screen
      await expect(element(by.id('nurse-login-screen'))).toBeVisible();
    });
  });

  describe('Loading States', () => {
    it('should display loading indicator during login', async () => {
      await element(by.id('email-input')).typeText('nurse@healthcarefacility.ch');
      await element(by.id('password-input')).typeText('NursePass123!');
      await element(by.id('login-button')).tap();

      // Loading state should be briefly visible
      await expect(element(by.id('login-loading-spinner'))).toBeVisible();
    });

    it('should disable login button during submission', async () => {
      await element(by.id('email-input')).typeText('nurse@healthcarefacility.ch');
      await element(by.id('password-input')).typeText('NursePass123!');
      await element(by.id('login-button')).tap();

      // Button should be disabled
      await expect(element(by.id('login-button'))).toHaveToggleValue(false);
    });
  });
});

// Helper function for nurse login
async function loginAsNurse() {
  await element(by.id('email-input')).typeText('nurse@healthcarefacility.ch');
  await element(by.id('password-input')).typeText('NursePass123!');
  await element(by.id('login-button')).tap();
}
