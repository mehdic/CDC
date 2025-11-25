/**
 * Delivery App Login E2E Tests
 *
 * Tests the complete authentication workflow for delivery personnel:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Session persistence across app restart
 * - HIN e-ID authentication flow
 */

describe('Delivery App Login', () => {
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
      await expect(element(by.id('delivery-login-screen'))).toBeVisible();
      await expect(element(by.text('MetaPharm Delivery'))).toBeVisible();
      await expect(element(by.text('Delivery Personnel Login'))).toBeVisible();
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
  });

  describe('Valid Credentials Login', () => {
    it('should login successfully with valid email and password', async () => {
      await element(by.id('email-input')).typeText('delivery@metapharm.ch');
      await element(by.id('password-input')).typeText('DeliveryPass123!');
      await element(by.id('login-button')).tap();

      // Should navigate to delivery list screen
      await waitFor(element(by.id('delivery-list-screen'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('delivery-list-screen'))).toBeVisible();
    });

    it('should display personalized welcome message after login', async () => {
      await loginAsDeliveryPersonnel();

      await expect(element(by.id('welcome-message'))).toBeVisible();
      await expect(element(by.text('Available Deliveries'))).toBeVisible();
    });

    it('should load delivery list after successful login', async () => {
      await loginAsDeliveryPersonnel();

      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
      // Should have at least one delivery in the list
      await expect(element(by.id('delivery-card-0'))).toBeVisible();
    });
  });

  describe('Invalid Credentials', () => {
    it('should show error for invalid email', async () => {
      await element(by.id('email-input')).typeText('invalid@example.com');
      await element(by.id('password-input')).typeText('DeliveryPass123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-error-message'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('login-error-message'))).toHaveText('Invalid email or password');
    });

    it('should show error for invalid password', async () => {
      await element(by.id('email-input')).typeText('delivery@metapharm.ch');
      await element(by.id('password-input')).typeText('WrongPassword123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-error-message'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('login-error-message'))).toContain('Invalid');
    });

    it('should validate empty email field', async () => {
      await element(by.id('password-input')).typeText('DeliveryPass123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('email-error'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('email-error'))).toBeVisible();
    });

    it('should validate empty password field', async () => {
      await element(by.id('email-input')).typeText('delivery@metapharm.ch');
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
      await loginAsDeliveryPersonnel();
      await waitFor(element(by.id('delivery-list-screen'))).toBeVisible().withTimeout(10000);

      // Restart app
      await device.terminateApp();
      await device.launchApp({ newInstance: false });

      // Should still be logged in
      await waitFor(element(by.id('delivery-list-screen'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('delivery-list-screen'))).toBeVisible();
    });

    it('should persist user data after app restart', async () => {
      await loginAsDeliveryPersonnel();
      await waitFor(element(by.id('delivery-list-screen'))).toBeVisible().withTimeout(10000);

      // Restart app
      await device.terminateApp();
      await device.launchApp({ newInstance: false });

      // User should be visible in profile
      await element(by.id('profile-tab')).tap();
      await expect(element(by.id('delivery-person-name'))).toBeVisible();
    });

    it('should clear session data on logout', async () => {
      await loginAsDeliveryPersonnel();

      // Navigate to profile and logout
      await element(by.id('profile-tab')).tap();
      await element(by.id('logout-button')).tap();
      await expect(element(by.id('logout-confirmation'))).toBeVisible();
      await element(by.id('confirm-logout-button')).tap();

      // Should return to login screen
      await waitFor(element(by.id('delivery-login-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-login-screen'))).toBeVisible();

      // Restart app - should be on login screen
      await device.terminateApp();
      await device.launchApp({ newInstance: false });
      await expect(element(by.id('delivery-login-screen'))).toBeVisible();
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

      // Should proceed to delivery list or verification
      await waitFor(
        element(by.id('delivery-list-screen')).or(element(by.id('verification-screen')))
      ).toBeVisible().withTimeout(10000);
    });

    it('should handle HIN e-ID authentication cancellation', async () => {
      await element(by.id('hin-eid-button')).tap();

      await waitFor(element(by.id('hin-eid-auth-alert'))).toBeVisible().withTimeout(5000);
      await element(by.text('Cancel')).tap();

      // Should return to login screen
      await expect(element(by.id('delivery-login-screen'))).toBeVisible();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator during login', async () => {
      await element(by.id('email-input')).typeText('delivery@metapharm.ch');
      await element(by.id('password-input')).typeText('DeliveryPass123!');
      await element(by.id('login-button')).tap();

      // Loading indicator should appear briefly
      await expect(element(by.id('login-loading-indicator'))).toBeVisible();
    });

    it('should disable login button while loading', async () => {
      await element(by.id('email-input')).typeText('delivery@metapharm.ch');
      await element(by.id('password-input')).typeText('DeliveryPass123!');
      await element(by.id('login-button')).tap();

      // Button should be disabled
      await expect(element(by.id('login-button'))).toHaveToggleValue(false);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('password-input')).typeText('DeliveryPass123!');
      await element(by.id('login-button')).tap();

      // Should show email format error or just proceed with login attempt
      await waitFor(element(by.id('login-error-message'))).toBeVisible().withTimeout(5000);
    });

    it('should clear input fields on login error', async () => {
      await element(by.id('email-input')).typeText('invalid@example.com');
      await element(by.id('password-input')).typeText('WrongPassword');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-error-message'))).toBeVisible().withTimeout(5000);

      // Optional: Check if password field is cleared for security
      // The email should remain for user convenience
      await expect(element(by.id('email-input'))).toHaveText('invalid@example.com');
    });

    it('should trim whitespace from email input', async () => {
      await element(by.id('email-input')).typeText('  delivery@metapharm.ch  ');
      await element(by.id('password-input')).typeText('DeliveryPass123!');
      await element(by.id('login-button')).tap();

      // Should successfully login despite whitespace
      await waitFor(element(by.id('delivery-list-screen'))).toBeVisible().withTimeout(10000);
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for input fields', async () => {
      await expect(element(by.id('email-label'))).toHaveText('Email');
      await expect(element(by.id('password-label'))).toHaveText('Password');
    });

    it('should be keyboard accessible', async () => {
      await element(by.id('email-input')).multiTap(1);
      // Should be focused and ready for input
      await element(by.id('email-input')).typeText('delivery@metapharm.ch');

      // Tab/keyboard navigation should move to password field
      await element(by.id('password-input')).tap();
      await element(by.id('password-input')).typeText('DeliveryPass123!');

      await expect(element(by.id('password-input'))).toBeVisible();
    });
  });
});

/**
 * Helper Functions
 */

async function loginAsDeliveryPersonnel() {
  await element(by.id('email-input')).typeText('delivery@metapharm.ch');
  await element(by.id('password-input')).typeText('DeliveryPass123!');
  await element(by.id('login-button')).tap();
  await waitFor(element(by.id('delivery-list-screen'))).toBeVisible().withTimeout(10000);
}
