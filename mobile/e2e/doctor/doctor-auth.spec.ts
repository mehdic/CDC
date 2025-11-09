/**
 * Doctor Authentication E2E Tests
 *
 * Tests the complete authentication workflow for doctors including:
 * - Login with e-ID integration (HIN provider)
 * - Multi-factor authentication
 * - Session management
 * - Logout
 * - Password reset
 */

describe('Doctor Authentication', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Login with e-ID (HIN Provider)', () => {
    it('should display login screen with e-ID option', async () => {
      await expect(element(by.id('doctor-login-screen'))).toBeVisible();
      await expect(element(by.id('login-title'))).toHaveText('Doctor Login');
      await expect(element(by.id('eid-login-button'))).toBeVisible();
    });

    it('should navigate to HIN e-ID authentication', async () => {
      await element(by.id('eid-login-button')).tap();
      await expect(element(by.id('eid-auth-webview'))).toBeVisible();
    });

    it('should successfully login with valid e-ID credentials', async () => {
      // Mock e-ID login flow
      await element(by.id('eid-login-button')).tap();
      await waitFor(element(by.id('eid-username-input'))).toBeVisible().withTimeout(5000);

      await element(by.id('eid-username-input')).typeText('doctor@hin.ch');
      await element(by.id('eid-password-input')).typeText('ValidPassword123!');
      await element(by.id('eid-submit-button')).tap();

      // Should navigate to MFA screen
      await waitFor(element(by.id('mfa-screen'))).toBeVisible().withTimeout(10000);
    });

    it('should show error for invalid e-ID credentials', async () => {
      await element(by.id('eid-login-button')).tap();
      await waitFor(element(by.id('eid-username-input'))).toBeVisible().withTimeout(5000);

      await element(by.id('eid-username-input')).typeText('invalid@hin.ch');
      await element(by.id('eid-password-input')).typeText('WrongPassword');
      await element(by.id('eid-submit-button')).tap();

      await expect(element(by.id('login-error-message'))).toBeVisible();
      await expect(element(by.id('login-error-message'))).toHaveText('Invalid credentials');
    });
  });

  describe('Multi-Factor Authentication', () => {
    beforeEach(async () => {
      // Login to get to MFA screen
      await element(by.id('eid-login-button')).tap();
      await waitFor(element(by.id('eid-username-input'))).toBeVisible().withTimeout(5000);
      await element(by.id('eid-username-input')).typeText('doctor@hin.ch');
      await element(by.id('eid-password-input')).typeText('ValidPassword123!');
      await element(by.id('eid-submit-button')).tap();
      await waitFor(element(by.id('mfa-screen'))).toBeVisible().withTimeout(10000);
    });

    it('should display MFA code input screen', async () => {
      await expect(element(by.id('mfa-screen'))).toBeVisible();
      await expect(element(by.id('mfa-title'))).toHaveText('Two-Factor Authentication');
      await expect(element(by.id('mfa-code-input'))).toBeVisible();
      await expect(element(by.id('mfa-submit-button'))).toBeVisible();
    });

    it('should successfully authenticate with valid MFA code', async () => {
      await element(by.id('mfa-code-input')).typeText('123456');
      await element(by.id('mfa-submit-button')).tap();

      // Should navigate to main doctor dashboard
      await waitFor(element(by.id('doctor-dashboard'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('welcome-message'))).toBeVisible();
    });

    it('should show error for invalid MFA code', async () => {
      await element(by.id('mfa-code-input')).typeText('000000');
      await element(by.id('mfa-submit-button')).tap();

      await expect(element(by.id('mfa-error-message'))).toBeVisible();
      await expect(element(by.id('mfa-error-message'))).toHaveText('Invalid verification code');
    });

    it('should allow resending MFA code', async () => {
      await element(by.id('mfa-resend-button')).tap();
      await expect(element(by.id('mfa-resend-success'))).toBeVisible();
      await expect(element(by.id('mfa-resend-success'))).toHaveText('Code sent successfully');
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      // Complete login flow
      await completeLogin();
    });

    it('should maintain session after app backgrounding', async () => {
      await device.sendToHome();
      await device.launchApp({ newInstance: false });

      // Should still be on dashboard, not login screen
      await expect(element(by.id('doctor-dashboard'))).toBeVisible();
    });

    it('should refresh expired session token', async () => {
      // Mock token expiration by waiting
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Make an API call that requires authentication
      await element(by.id('prescriptions-tab')).tap();

      // Should still work (token refreshed automatically)
      await expect(element(by.id('prescriptions-list'))).toBeVisible();
    });

    it('should redirect to login on invalid session', async () => {
      // Mock session invalidation
      await device.terminateApp();
      await device.launchApp({ newInstance: true, delete: true });

      await expect(element(by.id('doctor-login-screen'))).toBeVisible();
    });
  });

  describe('Logout', () => {
    beforeEach(async () => {
      await completeLogin();
    });

    it('should successfully logout from settings', async () => {
      await element(by.id('settings-tab')).tap();
      await element(by.id('logout-button')).tap();

      // Confirm logout dialog
      await expect(element(by.id('logout-confirmation-dialog'))).toBeVisible();
      await element(by.id('logout-confirm-button')).tap();

      // Should return to login screen
      await waitFor(element(by.id('doctor-login-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should clear session data on logout', async () => {
      await element(by.id('settings-tab')).tap();
      await element(by.id('logout-button')).tap();
      await element(by.id('logout-confirm-button')).tap();

      // Wait for login screen
      await waitFor(element(by.id('doctor-login-screen'))).toBeVisible().withTimeout(5000);

      // Try to go back (should not be possible)
      await device.sendToHome();
      await device.launchApp({ newInstance: false });

      // Should still be on login screen
      await expect(element(by.id('doctor-login-screen'))).toBeVisible();
    });
  });

  describe('Password Reset', () => {
    it('should display password reset option on login screen', async () => {
      await expect(element(by.id('forgot-password-link'))).toBeVisible();
    });

    it('should navigate to password reset flow', async () => {
      await element(by.id('forgot-password-link')).tap();
      await expect(element(by.id('password-reset-screen'))).toBeVisible();
      await expect(element(by.id('reset-email-input'))).toBeVisible();
    });

    it('should send password reset email for valid address', async () => {
      await element(by.id('forgot-password-link')).tap();
      await element(by.id('reset-email-input')).typeText('doctor@hin.ch');
      await element(by.id('send-reset-button')).tap();

      await expect(element(by.id('reset-success-message'))).toBeVisible();
      await expect(element(by.id('reset-success-message'))).toHaveText('Password reset email sent');
    });

    it('should show error for unregistered email', async () => {
      await element(by.id('forgot-password-link')).tap();
      await element(by.id('reset-email-input')).typeText('unknown@email.com');
      await element(by.id('send-reset-button')).tap();

      await expect(element(by.id('reset-error-message'))).toBeVisible();
      await expect(element(by.id('reset-error-message'))).toHaveText('Email not found');
    });
  });
});

/**
 * Helper function to complete the full login flow
 */
async function completeLogin() {
  await element(by.id('eid-login-button')).tap();
  await waitFor(element(by.id('eid-username-input'))).toBeVisible().withTimeout(5000);
  await element(by.id('eid-username-input')).typeText('doctor@hin.ch');
  await element(by.id('eid-password-input')).typeText('ValidPassword123!');
  await element(by.id('eid-submit-button')).tap();
  await waitFor(element(by.id('mfa-screen'))).toBeVisible().withTimeout(10000);
  await element(by.id('mfa-code-input')).typeText('123456');
  await element(by.id('mfa-submit-button')).tap();
  await waitFor(element(by.id('doctor-dashboard'))).toBeVisible().withTimeout(10000);
}
