/**
 * Patient Authentication E2E Tests
 *
 * Tests the complete authentication workflow for patients:
 * - Register new account
 * - Login with email/password
 * - Social login (mock OAuth)
 * - Profile management
 * - Logout
 */

describe('Patient Authentication', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', camera: 'YES', photos: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Register New Account', () => {
    it('should display registration screen', async () => {
      await element(by.id('welcome-screen')).tap();
      await element(by.id('register-button')).tap();

      await expect(element(by.id('registration-screen'))).toBeVisible();
      await expect(element(by.id('register-title'))).toHaveText('Create Account');
    });

    it('should register with valid email and password', async () => {
      await navigateToRegistration();

      await element(by.id('register-first-name-input')).typeText('John');
      await element(by.id('register-last-name-input')).typeText('Smith');
      await element(by.id('register-email-input')).typeText('john.smith@example.com');
      await element(by.id('register-password-input')).typeText('SecurePass123!');
      await element(by.id('register-confirm-password-input')).typeText('SecurePass123!');
      await element(by.id('register-terms-checkbox')).tap();
      await element(by.id('register-submit-button')).tap();

      // Should navigate to verification screen
      await waitFor(element(by.id('email-verification-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('verification-message'))).toContain('verification email');
    });

    it('should validate email format', async () => {
      await navigateToRegistration();

      await element(by.id('register-email-input')).typeText('invalid-email');
      await element(by.id('register-password-input')).typeText('SecurePass123!');
      await element(by.id('register-submit-button')).tap();

      await expect(element(by.id('email-error'))).toBeVisible();
      await expect(element(by.id('email-error'))).toHaveText('Invalid email format');
    });

    it('should validate password strength', async () => {
      await navigateToRegistration();

      await element(by.id('register-email-input')).typeText('test@example.com');
      await element(by.id('register-password-input')).typeText('weak');
      await element(by.id('register-submit-button')).tap();

      await expect(element(by.id('password-error'))).toBeVisible();
      await expect(element(by.id('password-error'))).toContain('at least 8 characters');
    });

    it('should verify password confirmation matches', async () => {
      await navigateToRegistration();

      await element(by.id('register-password-input')).typeText('SecurePass123!');
      await element(by.id('register-confirm-password-input')).typeText('DifferentPass123!');
      await element(by.id('register-submit-button')).tap();

      await expect(element(by.id('confirm-password-error'))).toBeVisible();
      await expect(element(by.id('confirm-password-error'))).toHaveText('Passwords do not match');
    });

    it('should require terms acceptance', async () => {
      await navigateToRegistration();

      await element(by.id('register-email-input')).typeText('test@example.com');
      await element(by.id('register-password-input')).typeText('SecurePass123!');
      await element(by.id('register-confirm-password-input')).typeText('SecurePass123!');
      // Don't check terms checkbox
      await element(by.id('register-submit-button')).tap();

      await expect(element(by.id('terms-error'))).toBeVisible();
      await expect(element(by.id('terms-error'))).toHaveText('You must accept the terms');
    });

    it('should verify email with verification code', async () => {
      await registerNewAccount('jane.doe@example.com', 'SecurePass123!');

      // Enter verification code
      await element(by.id('verification-code-input')).typeText('123456');
      await element(by.id('verify-button')).tap();

      // Should navigate to welcome dashboard
      await waitFor(element(by.id('patient-dashboard'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('welcome-banner'))).toBeVisible();
    });
  });

  describe('Login with Email/Password', () => {
    it('should display login screen', async () => {
      await expect(element(by.id('welcome-screen'))).toBeVisible();
      await expect(element(by.id('login-button'))).toBeVisible();
    });

    it('should login with valid credentials', async () => {
      await element(by.id('login-button')).tap();
      await expect(element(by.id('login-screen'))).toBeVisible();

      await element(by.id('login-email-input')).typeText('patient@example.com');
      await element(by.id('login-password-input')).typeText('ValidPassword123!');
      await element(by.id('login-submit-button')).tap();

      await waitFor(element(by.id('patient-dashboard'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('welcome-message'))).toBeVisible();
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('login-button')).tap();

      await element(by.id('login-email-input')).typeText('invalid@example.com');
      await element(by.id('login-password-input')).typeText('WrongPassword');
      await element(by.id('login-submit-button')).tap();

      await expect(element(by.id('login-error'))).toBeVisible();
      await expect(element(by.id('login-error'))).toHaveText('Invalid email or password');
    });

    it('should remember me option', async () => {
      await element(by.id('login-button')).tap();

      await element(by.id('login-email-input')).typeText('patient@example.com');
      await element(by.id('login-password-input')).typeText('ValidPassword123!');
      await element(by.id('remember-me-checkbox')).tap();
      await element(by.id('login-submit-button')).tap();

      await waitFor(element(by.id('patient-dashboard'))).toBeVisible().withTimeout(10000);

      // Restart app
      await device.terminateApp();
      await device.launchApp({ newInstance: true });

      // Should be logged in automatically
      await expect(element(by.id('patient-dashboard'))).toBeVisible();
    });

    it('should handle forgot password flow', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('forgot-password-link')).tap();

      await expect(element(by.id('password-reset-screen'))).toBeVisible();
      await element(by.id('reset-email-input')).typeText('patient@example.com');
      await element(by.id('send-reset-button')).tap();

      await expect(element(by.id('reset-email-sent'))).toBeVisible();
      await expect(element(by.id('reset-email-sent'))).toHaveText('Password reset email sent');
    });
  });

  describe('Social Login (OAuth)', () => {
    it('should display social login options', async () => {
      await element(by.id('login-button')).tap();

      await expect(element(by.id('google-login-button'))).toBeVisible();
      await expect(element(by.id('apple-login-button'))).toBeVisible();
      await expect(element(by.id('facebook-login-button'))).toBeVisible();
    });

    it('should login with Google OAuth', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('google-login-button')).tap();

      // Mock OAuth webview
      await waitFor(element(by.id('oauth-webview'))).toBeVisible().withTimeout(5000);
      await element(by.id('oauth-email-input')).typeText('patient@gmail.com');
      await element(by.id('oauth-password-input')).typeText('GooglePass123');
      await element(by.id('oauth-signin-button')).tap();

      // Should return to app and be logged in
      await waitFor(element(by.id('patient-dashboard'))).toBeVisible().withTimeout(15000);
    });

    it('should login with Apple ID', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('apple-login-button')).tap();

      // Apple native sign-in dialog
      await waitFor(element(by.text('Continue with Apple ID'))).toBeVisible().withTimeout(5000);
      await element(by.text('Continue')).tap();

      await waitFor(element(by.id('patient-dashboard'))).toBeVisible().withTimeout(15000);
    });

    it('should handle OAuth cancellation', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('google-login-button')).tap();

      await waitFor(element(by.id('oauth-webview'))).toBeVisible().withTimeout(5000);
      await element(by.id('oauth-cancel-button')).tap();

      // Should return to login screen
      await expect(element(by.id('login-screen'))).toBeVisible();
    });
  });

  describe('Profile Management', () => {
    beforeEach(async () => {
      await loginAsPatient();
    });

    it('should view profile information', async () => {
      await element(by.id('profile-tab')).tap();
      await expect(element(by.id('profile-screen'))).toBeVisible();

      await expect(element(by.id('profile-name'))).toBeVisible();
      await expect(element(by.id('profile-email'))).toBeVisible();
      await expect(element(by.id('profile-phone'))).toBeVisible();
    });

    it('should edit profile details', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('edit-profile-button')).tap();

      await expect(element(by.id('edit-profile-screen'))).toBeVisible();
      await element(by.id('edit-phone-input')).replaceText('+41 76 123 45 67');
      await element(by.id('edit-address-input')).typeText('123 Main St, Lausanne');
      await element(by.id('save-profile-button')).tap();

      await expect(element(by.id('profile-updated-success'))).toBeVisible();
      await expect(element(by.id('profile-phone'))).toHaveText('+41 76 123 45 67');
    });

    it('should upload profile picture', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('profile-picture')).tap();

      await expect(element(by.id('photo-options-modal'))).toBeVisible();
      await element(by.id('choose-from-library')).tap();

      // Mock photo picker
      await waitFor(element(by.id('photo-picker'))).toBeVisible().withTimeout(5000);
      await element(by.id('photo-0')).tap();

      await expect(element(by.id('profile-picture-updated'))).toBeVisible();
    });

    it('should change password', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('security-settings-button')).tap();

      await expect(element(by.id('security-screen'))).toBeVisible();
      await element(by.id('change-password-button')).tap();

      await element(by.id('current-password-input')).typeText('ValidPassword123!');
      await element(by.id('new-password-input')).typeText('NewSecurePass456!');
      await element(by.id('confirm-new-password-input')).typeText('NewSecurePass456!');
      await element(by.id('save-password-button')).tap();

      await expect(element(by.id('password-changed-success'))).toBeVisible();
    });

    it('should manage notification preferences', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('notification-settings-button')).tap();

      await expect(element(by.id('notifications-screen'))).toBeVisible();
      await element(by.id('prescription-notifications-toggle')).tap();
      await element(by.id('appointment-reminders-toggle')).tap();

      await expect(element(by.id('preferences-saved'))).toBeVisible();
    });
  });

  describe('Logout', () => {
    beforeEach(async () => {
      await loginAsPatient();
    });

    it('should logout successfully', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('logout-button')).tap();

      await expect(element(by.id('logout-confirmation'))).toBeVisible();
      await element(by.id('confirm-logout-button')).tap();

      // Should return to welcome screen
      await waitFor(element(by.id('welcome-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should clear session data on logout', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('logout-button')).tap();
      await element(by.id('confirm-logout-button')).tap();

      await waitFor(element(by.id('welcome-screen'))).toBeVisible().withTimeout(5000);

      // Restart app
      await device.terminateApp();
      await device.launchApp({ newInstance: true });

      // Should not be logged in
      await expect(element(by.id('welcome-screen'))).toBeVisible();
    });
  });
});

/**
 * Helper Functions
 */

async function navigateToRegistration() {
  await element(by.id('welcome-screen')).tap();
  await element(by.id('register-button')).tap();
  await expect(element(by.id('registration-screen'))).toBeVisible();
}

async function registerNewAccount(email: string, password: string) {
  await navigateToRegistration();
  await element(by.id('register-first-name-input')).typeText('Test');
  await element(by.id('register-last-name-input')).typeText('User');
  await element(by.id('register-email-input')).typeText(email);
  await element(by.id('register-password-input')).typeText(password);
  await element(by.id('register-confirm-password-input')).typeText(password);
  await element(by.id('register-terms-checkbox')).tap();
  await element(by.id('register-submit-button')).tap();
  await waitFor(element(by.id('email-verification-screen'))).toBeVisible().withTimeout(5000);
}

async function loginAsPatient() {
  await element(by.id('login-button')).tap();
  await element(by.id('login-email-input')).typeText('patient@example.com');
  await element(by.id('login-password-input')).typeText('ValidPassword123!');
  await element(by.id('login-submit-button')).tap();
  await waitFor(element(by.id('patient-dashboard'))).toBeVisible().withTimeout(10000);
}
