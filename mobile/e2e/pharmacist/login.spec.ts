/**
 * Pharmacist App Login E2E Tests
 *
 * Tests the complete authentication workflow for pharmacists:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Session persistence across app restart
 * - HIN e-ID authentication flow
 * - Master account vs sub-user authentication
 */

describe('Pharmacist App Login', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', camera: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Login Form Display', () => {
    it('should display login screen on app launch', async () => {
      await expect(element(by.id('pharmacist-login-screen'))).toBeVisible();
      await expect(element(by.text('MetaPharm Pharmacist'))).toBeVisible();
      await expect(element(by.text('Pharmacist Login'))).toBeVisible();
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

    it('should display master account indicator', async () => {
      await expect(element(by.id('master-account-badge'))).toBeVisible();
    });
  });

  describe('Valid Credentials Login', () => {
    it('should login successfully with valid master pharmacist credentials', async () => {
      await element(by.id('email-input')).typeText('pharmacist@metapharm.ch');
      await element(by.id('password-input')).typeText('PharmacistPass123!');
      await element(by.id('login-button')).tap();

      // Should navigate to dashboard screen
      await waitFor(element(by.id('pharmacist-dashboard-screen'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('pharmacist-dashboard-screen'))).toBeVisible();
    });

    it('should display personalized welcome message after login', async () => {
      await loginAsPharmacist();

      await expect(element(by.id('welcome-message'))).toBeVisible();
      await expect(element(by.text(/Welcome|Dashboard|Prescriptions/i))).toBeVisible();
    });

    it('should load prescription dashboard after successful login', async () => {
      await loginAsPharmacist();

      await waitFor(element(by.id('prescription-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('prescription-list'))).toBeVisible();
    });

    it('should display pharmacist master account data', async () => {
      await loginAsPharmacist();

      await expect(element(by.id('pharmacy-name'))).toBeVisible();
      await expect(element(by.id('pharmacy-location'))).toBeVisible();
      await expect(element(by.id('master-account-indicator'))).toBeVisible();
    });
  });

  describe('Sub-User Login', () => {
    it('should login successfully as sub-pharmacist', async () => {
      await element(by.id('email-input')).typeText('subuser@metapharm.ch');
      await element(by.id('password-input')).typeText('SubUserPass123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('pharmacist-dashboard-screen'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('pharmacist-dashboard-screen'))).toBeVisible();
    });

    it('should display sub-user permissions and restrictions', async () => {
      await loginAsSubPharmacist();

      // Sub-users should see limited menu options
      await expect(element(by.id('prescription-menu'))).toBeVisible();
      await expect(element(by.id('master-account-menu'))).not.toBeVisible();
    });

    it('should restrict access to master account features', async () => {
      await loginAsSubPharmacist();

      // Should not be able to access master account management
      await expect(element(by.id('master-account-button'))).not.toBeVisible();
    });
  });

  describe('Invalid Credentials', () => {
    it('should show error for invalid email', async () => {
      await element(by.id('email-input')).typeText('invalid@example.com');
      await element(by.id('password-input')).typeText('PharmacistPass123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-error-message'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('login-error-message'))).toHaveText('Invalid email or password');
    });

    it('should show error for invalid password', async () => {
      await element(by.id('email-input')).typeText('pharmacist@metapharm.ch');
      await element(by.id('password-input')).typeText('WrongPassword123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-error-message'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('login-error-message'))).toContain('Invalid');
    });

    it('should validate empty email field', async () => {
      await element(by.id('password-input')).typeText('PharmacistPass123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('email-error'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('email-error'))).toBeVisible();
    });

    it('should validate empty password field', async () => {
      await element(by.id('email-input')).typeText('pharmacist@metapharm.ch');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('password-error'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('password-error'))).toBeVisible();
    });

    it('should require both email and password', async () => {
      await element(by.id('login-button')).tap();

      await expect(element(by.id('email-error'))).toBeVisible();
      await expect(element(by.id('password-error'))).toBeVisible();
    });

    it('should show error for unregistered pharmacist', async () => {
      await element(by.id('email-input')).typeText('unregistered@metapharm.ch');
      await element(by.id('password-input')).typeText('ValidPass123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-error-message'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('login-error-message'))).toBeVisible();
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session after app restart', async () => {
      // Login first
      await loginAsPharmacist();
      await waitFor(element(by.id('pharmacist-dashboard-screen'))).toBeVisible().withTimeout(10000);

      // Restart app
      await device.terminateApp();
      await device.launchApp({ newInstance: false });

      // Should still be logged in
      await waitFor(element(by.id('pharmacist-dashboard-screen'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('pharmacist-dashboard-screen'))).toBeVisible();
    });

    it('should persist user data after app restart', async () => {
      await loginAsPharmacist();
      await waitFor(element(by.id('pharmacist-dashboard-screen'))).toBeVisible().withTimeout(10000);

      // Restart app
      await device.terminateApp();
      await device.launchApp({ newInstance: false });

      // Pharmacist data should still be visible
      await expect(element(by.id('pharmacy-name'))).toBeVisible();
    });

    it('should clear session data on logout', async () => {
      await loginAsPharmacist();

      // Navigate to profile and logout
      await element(by.id('profile-tab')).tap();
      await element(by.id('logout-button')).tap();
      await expect(element(by.id('logout-confirmation'))).toBeVisible();
      await element(by.id('confirm-logout-button')).tap();

      // Should return to login screen
      await waitFor(element(by.id('pharmacist-login-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('pharmacist-login-screen'))).toBeVisible();

      // Restart app - should be on login screen
      await device.terminateApp();
      await device.launchApp({ newInstance: false });
      await expect(element(by.id('pharmacist-login-screen'))).toBeVisible();
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
        element(by.id('pharmacist-dashboard-screen')).or(element(by.id('verification-screen')))
      ).toBeVisible().withTimeout(10000);
    });

    it('should handle HIN e-ID authentication cancellation', async () => {
      await element(by.id('hin-eid-button')).tap();

      await waitFor(element(by.id('hin-eid-auth-alert'))).toBeVisible().withTimeout(5000);
      await element(by.text('Cancel')).tap();

      // Should return to login screen
      await expect(element(by.id('pharmacist-login-screen'))).toBeVisible();
    });
  });

  describe('MFA for Pharmacists', () => {
    it('should prompt for MFA after password entry', async () => {
      await element(by.id('email-input')).typeText('pharmacist@metapharm.ch');
      await element(by.id('password-input')).typeText('PharmacistPass123!');
      await element(by.id('login-button')).tap();

      // Should display MFA screen
      await waitFor(element(by.id('mfa-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('mfa-input'))).toBeVisible();
    });

    it('should allow entry of MFA code', async () => {
      await loginWithMFA('pharmacist@metapharm.ch', 'PharmacistPass123!');

      await element(by.id('mfa-input')).typeText('123456');
      await element(by.id('mfa-submit-button')).tap();

      await waitFor(element(by.id('pharmacist-dashboard-screen'))).toBeVisible().withTimeout(10000);
    });

    it('should show error for invalid MFA code', async () => {
      await loginWithMFA('pharmacist@metapharm.ch', 'PharmacistPass123!');

      await element(by.id('mfa-input')).typeText('000000');
      await element(by.id('mfa-submit-button')).tap();

      await waitFor(element(by.id('mfa-error'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('mfa-error'))).toBeVisible();
    });
  });

  describe('Loading States', () => {
    it('should display loading indicator during login', async () => {
      await element(by.id('email-input')).typeText('pharmacist@metapharm.ch');
      await element(by.id('password-input')).typeText('PharmacistPass123!');
      await element(by.id('login-button')).tap();

      // Loading state should be briefly visible
      await expect(element(by.id('login-loading-spinner'))).toBeVisible();
    });

    it('should disable login button during submission', async () => {
      await element(by.id('email-input')).typeText('pharmacist@metapharm.ch');
      await element(by.id('password-input')).typeText('PharmacistPass123!');
      await element(by.id('login-button')).tap();

      // Button should be disabled
      await expect(element(by.id('login-button'))).toHaveToggleValue(false);
    });
  });
});

// Helper function for pharmacist login
async function loginAsPharmacist() {
  await element(by.id('email-input')).typeText('pharmacist@metapharm.ch');
  await element(by.id('password-input')).typeText('PharmacistPass123!');
  await element(by.id('login-button')).tap();
}

// Helper function for sub-pharmacist login
async function loginAsSubPharmacist() {
  await element(by.id('email-input')).typeText('subuser@metapharm.ch');
  await element(by.id('password-input')).typeText('SubUserPass123!');
  await element(by.id('login-button')).tap();
}

// Helper function for MFA login
async function loginWithMFA(email: string, password: string) {
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('login-button')).tap();
  await waitFor(element(by.id('mfa-screen'))).toBeVisible().withTimeout(5000);
}
