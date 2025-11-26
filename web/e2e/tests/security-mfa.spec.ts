import { test, expect } from '../fixtures/auth.fixture';
import { mockApiResponse, mockLoginRequiresMFA, mockLoginFailure } from '../utils/api-mock';

test.describe('Security - MFA Enrollment and Verification (E2E-021)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
  });

  test('should display MFA enrollment option for pharmacist accounts', async ({ page }) => {
    // Mock successful login with MFA not yet enrolled
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        accessToken: 'mock_token_123',
        refreshToken: 'mock_refresh_456',
        user: {
          id: 'pharmacist_001',
          email: 'pharmacist@test.metapharm.ch',
          role: 'pharmacist',
          firstName: 'Marie',
          lastName: 'Dupont',
          mfaEnabled: false,
          requiresMfaSetup: true,
        },
      },
    });

    // Login
    await page.fill('[data-testid="email-input"]', 'pharmacist@test.metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    // Verify MFA setup prompt appears
    await expect(page.locator('[data-testid="mfa-setup-prompt"]')).toBeVisible();
    await expect(page.locator('text=/activer.*authentification|enable.*authentication/i')).toBeVisible();
  });

  test('should enroll with SMS-based MFA', async ({ page }) => {
    // Navigate to MFA setup page
    await mockApiResponse(page, '**/auth/mfa/enroll/sms', {
      status: 200,
      body: {
        success: true,
        message: 'SMS verification code sent',
        phone: '+41 76 *** ** 45',
      },
    });

    await page.goto('/auth/mfa/setup');

    // Select SMS method
    const smsOption = page.locator('[data-testid="mfa-method-sms"]');
    await smsOption.click();

    // Enter phone number
    await page.fill('[data-testid="phone-input"]', '+41761234567');
    await page.click('[data-testid="send-verification-code"]');

    // Verify SMS sent notification
    await expect(page.locator('[data-testid="verification-code-sent"]')).toBeVisible();
    await expect(page.locator('text=/code.*envoyé|code.*sent/i')).toBeVisible();

    // Mock verification success
    await mockApiResponse(page, '**/auth/mfa/verify/sms', {
      status: 200,
      body: {
        success: true,
        mfaEnabled: true,
        recoveryCodes: [
          '1234-5678-90AB',
          'CDEF-1234-5678',
          '90AB-CDEF-1234',
        ],
      },
    });

    // Enter verification code
    await page.fill('[data-testid="verification-code-input"]', '123456');
    await page.click('[data-testid="verify-code-button"]');

    // Verify recovery codes are displayed
    await expect(page.locator('[data-testid="recovery-codes-display"]')).toBeVisible();
    await expect(page.locator('text=1234-5678-90AB')).toBeVisible();

    // Verify success message
    await expect(page.locator('[data-testid="mfa-setup-success"]')).toBeVisible();
  });

  test('should enroll with authenticator app MFA', async ({ page }) => {
    // Navigate to MFA setup page
    await mockApiResponse(page, '**/auth/mfa/enroll/totp', {
      status: 200,
      body: {
        success: true,
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        secret: 'JBSWY3DPEHPK3PXP',
      },
    });

    await page.goto('/auth/mfa/setup');

    // Select authenticator app method
    const totpOption = page.locator('[data-testid="mfa-method-totp"]');
    await totpOption.click();

    // Verify QR code is displayed
    await expect(page.locator('[data-testid="qr-code-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="secret-key-display"]')).toContainText('JBSWY3DPEHPK3PXP');

    // Mock verification success
    await mockApiResponse(page, '**/auth/mfa/verify/totp', {
      status: 200,
      body: {
        success: true,
        mfaEnabled: true,
        recoveryCodes: [
          'ABCD-1234-EFGH',
          '5678-IJKL-9012',
          'MNOP-3456-QRST',
        ],
      },
    });

    // Enter code from authenticator app
    await page.fill('[data-testid="totp-code-input"]', '654321');
    await page.click('[data-testid="verify-totp-button"]');

    // Verify recovery codes are displayed
    await expect(page.locator('[data-testid="recovery-codes-display"]')).toBeVisible();
    await expect(page.locator('text=ABCD-1234-EFGH')).toBeVisible();
  });

  test('should require MFA verification during login for enrolled accounts', async ({ page }) => {
    // Mock login requiring MFA
    await mockLoginRequiresMFA(page);

    // Login with credentials
    await page.fill('[data-testid="email-input"]', 'pharmacist@test.metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    // Verify MFA verification screen appears
    await expect(page.locator('[data-testid="mfa-verification-form"]')).toBeVisible();
    await expect(page.locator('text=/enter.*code|entrez.*code/i')).toBeVisible();

    // Mock successful MFA verification
    await mockApiResponse(page, '**/auth/mfa/verify', {
      status: 200,
      body: {
        success: true,
        accessToken: 'full_access_token_789',
        refreshToken: 'full_refresh_012',
        user: {
          id: 'pharmacist_001',
          email: 'pharmacist@test.metapharm.ch',
          role: 'pharmacist',
          mfaEnabled: true,
        },
      },
    });

    // Enter MFA code
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="submit-mfa-code"]');

    // Verify successful login and navigation to dashboard
    await page.waitForURL(/.*\/(?:dashboard|prescriptions|inventory)/);
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();
  });

  test('should reject invalid MFA codes', async ({ page }) => {
    // Mock login requiring MFA
    await mockLoginRequiresMFA(page);

    // Login with credentials
    await page.fill('[data-testid="email-input"]', 'pharmacist@test.metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    // Wait for MFA screen
    await expect(page.locator('[data-testid="mfa-verification-form"]')).toBeVisible();

    // Mock failed MFA verification
    await mockApiResponse(page, '**/auth/mfa/verify', {
      status: 401,
      body: {
        success: false,
        error: 'Invalid MFA code',
      },
    });

    // Enter invalid MFA code
    await page.fill('[data-testid="mfa-code-input"]', '000000');
    await page.click('[data-testid="submit-mfa-code"]');

    // Verify error message
    await expect(page.locator('[data-testid="mfa-error-message"]')).toBeVisible();
    await expect(page.locator('text=/invalid.*code|code.*incorrect/i')).toBeVisible();

    // Verify user is not logged in
    await expect(page).not.toHaveURL(/.*\/dashboard/);
  });

  test('should allow login with recovery code when MFA device unavailable', async ({ page }) => {
    // Mock login requiring MFA
    await mockLoginRequiresMFA(page);

    // Login with credentials
    await page.fill('[data-testid="email-input"]', 'pharmacist@test.metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    // Wait for MFA screen
    await expect(page.locator('[data-testid="mfa-verification-form"]')).toBeVisible();

    // Click "Use recovery code" link
    const recoveryCodeLink = page.locator('[data-testid="use-recovery-code-link"]');
    await recoveryCodeLink.click();

    // Verify recovery code input is displayed
    await expect(page.locator('[data-testid="recovery-code-input"]')).toBeVisible();

    // Mock successful recovery code verification
    await mockApiResponse(page, '**/auth/mfa/verify/recovery', {
      status: 200,
      body: {
        success: true,
        accessToken: 'recovery_access_token_345',
        refreshToken: 'recovery_refresh_678',
        user: {
          id: 'pharmacist_001',
          email: 'pharmacist@test.metapharm.ch',
          role: 'pharmacist',
        },
        warning: 'Recovery code used. Please set up MFA again.',
      },
    });

    // Enter recovery code
    await page.fill('[data-testid="recovery-code-input"]', '1234-5678-90AB');
    await page.click('[data-testid="submit-recovery-code"]');

    // Verify successful login
    await page.waitForURL(/.*\/(?:dashboard|prescriptions|inventory)/);
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();

    // Verify warning about MFA reset
    await expect(page.locator('[data-testid="mfa-reset-warning"]')).toBeVisible();
  });

  test('should prevent MFA bypass attempts', async ({ page }) => {
    // Mock login requiring MFA
    await mockLoginRequiresMFA(page);

    // Login with credentials
    await page.fill('[data-testid="email-input"]', 'pharmacist@test.metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    // Wait for MFA screen
    await expect(page.locator('[data-testid="mfa-verification-form"]')).toBeVisible();

    // Attempt to bypass by navigating directly to dashboard
    await page.goto('/dashboard');

    // Verify still on login/MFA verification page
    await expect(page).toHaveURL(/.*\/(?:auth|login|mfa)/);
    await expect(page.locator('[data-testid="mfa-verification-form"]')).toBeVisible();

    // Attempt to bypass by setting localStorage
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'fake_token_attempt');
    });

    await page.goto('/dashboard');

    // Verify unauthorized access blocked
    await expect(page).toHaveURL(/.*\/(?:auth|login)/);
  });

  test('should enforce MFA requirement for doctor accounts', async ({ page }) => {
    // Mock doctor login requiring MFA
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        requiresMFA: true,
        tempToken: 'doctor_temp_mfa_token',
        user: {
          role: 'doctor',
        },
      },
    });

    // Login with doctor credentials
    await page.fill('[data-testid="email-input"]', 'doctor@test.metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    // Verify MFA verification required for doctor
    await expect(page.locator('[data-testid="mfa-verification-form"]')).toBeVisible();
  });

  test('should display MFA enrollment status in user profile', async ({ page }) => {
    // Mock authenticated pharmacist with MFA enabled
    await mockApiResponse(page, '**/auth/me', {
      status: 200,
      body: {
        success: true,
        user: {
          id: 'pharmacist_001',
          email: 'pharmacist@test.metapharm.ch',
          role: 'pharmacist',
          mfaEnabled: true,
          mfaMethod: 'totp',
        },
      },
    });

    await page.goto('/profile');

    // Verify MFA status is displayed
    const mfaStatusBadge = page.locator('[data-testid="mfa-status-badge"]');
    await expect(mfaStatusBadge).toBeVisible();
    await expect(mfaStatusBadge).toContainText(/activé|enabled/i);

    // Verify MFA method is displayed
    await expect(page.locator('[data-testid="mfa-method-display"]')).toContainText(/authenticator/i);
  });

  test('should allow disabling MFA after re-authentication', async ({ page }) => {
    // Navigate to profile security settings
    await mockApiResponse(page, '**/auth/me', {
      status: 200,
      body: {
        success: true,
        user: {
          id: 'pharmacist_001',
          email: 'pharmacist@test.metapharm.ch',
          role: 'pharmacist',
          mfaEnabled: true,
        },
      },
    });

    await page.goto('/profile/security');

    // Click disable MFA button
    const disableMfaButton = page.getByRole('button', { name: /désactiver.*mfa|disable.*mfa/i });
    await disableMfaButton.click();

    // Verify confirmation dialog
    const confirmDialog = page.locator('[data-testid="confirm-disable-mfa-dialog"]');
    await expect(confirmDialog).toBeVisible();

    // Mock password re-authentication
    await mockApiResponse(page, '**/auth/verify-password', {
      status: 200,
      body: {
        success: true,
      },
    });

    // Enter password to confirm
    await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
    await page.click('[data-testid="confirm-disable-mfa-button"]');

    // Mock MFA disable success
    await mockApiResponse(page, '**/auth/mfa/disable', {
      status: 200,
      body: {
        success: true,
        message: 'MFA has been disabled',
      },
    });

    // Verify success message
    await expect(page.locator('[data-testid="mfa-disabled-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="mfa-status-badge"]')).toContainText(/désactivé|disabled/i);
  });

  test('should rate-limit MFA verification attempts', async ({ page }) => {
    // Mock login requiring MFA
    await mockLoginRequiresMFA(page);

    // Login with credentials
    await page.fill('[data-testid="email-input"]', 'pharmacist@test.metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    // Wait for MFA screen
    await expect(page.locator('[data-testid="mfa-verification-form"]')).toBeVisible();

    // Attempt multiple failed verifications
    for (let i = 0; i < 5; i++) {
      await mockApiResponse(page, '**/auth/mfa/verify', {
        status: 401,
        body: {
          success: false,
          error: 'Invalid MFA code',
          attemptsRemaining: 5 - i - 1,
        },
      });

      await page.fill('[data-testid="mfa-code-input"]', '000000');
      await page.click('[data-testid="submit-mfa-code"]');
    }

    // Mock rate limit response
    await mockApiResponse(page, '**/auth/mfa/verify', {
      status: 429,
      body: {
        success: false,
        error: 'Too many failed attempts. Please wait 15 minutes.',
      },
    });

    await page.fill('[data-testid="mfa-code-input"]', '000000');
    await page.click('[data-testid="submit-mfa-code"]');

    // Verify rate limit error message
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
    await expect(page.locator('text=/too many.*attempts|trop.*tentatives/i')).toBeVisible();

    // Verify submit button is disabled
    const submitButton = page.locator('[data-testid="submit-mfa-code"]');
    await expect(submitButton).toBeDisabled();
  });
});
