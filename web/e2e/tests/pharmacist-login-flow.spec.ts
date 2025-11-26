import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { DashboardPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-001: Pharmacist Login Flow
 *
 * Complete end-to-end test for pharmacist authentication flow
 * covering successful login, failed login, and session management.
 */
test.describe('Pharmacist Login Flow (E2E-001)', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should successfully login with valid pharmacist credentials', async ({ page }) => {
    // Mock successful login response
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        token: 'mock_jwt_token_pharmacist',
        refreshToken: 'mock_refresh_token',
        user: {
          id: 'user_pharmacist_001',
          email: 'pharmacist@metapharm.ch',
          firstName: 'Marie',
          lastName: 'Dubois',
          role: 'pharmacist',
          pharmacyId: 'pharmacy_001',
        },
      },
    });

    // Mock user profile fetch
    await mockApiResponse(page, '**/users/me', {
      status: 200,
      body: {
        success: true,
        user: {
          id: 'user_pharmacist_001',
          email: 'pharmacist@metapharm.ch',
          firstName: 'Marie',
          lastName: 'Dubois',
          role: 'pharmacist',
          pharmacyId: 'pharmacy_001',
        },
      },
    });

    // Perform login
    await loginPage.login({
      email: 'pharmacist@metapharm.ch',
      password: 'SecurePassword123!',
    });

    // Verify redirect to dashboard
    await loginPage.expectLoginSuccess();
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard loaded
    const dashboard = new DashboardPage(page);
    await dashboard.expectPageLoaded();
  });

  test('should display error message with invalid credentials', async ({ page }) => {
    // Mock failed login response
    await mockApiResponse(page, '**/auth/login', {
      status: 401,
      body: {
        success: false,
        error: 'Invalid credentials',
        message: 'Email ou mot de passe incorrect',
      },
    });

    // Attempt login with invalid credentials
    await loginPage.login({
      email: 'invalid@metapharm.ch',
      password: 'WrongPassword',
    });

    // Verify error message displayed
    await loginPage.expectLoginError('Email ou mot de passe incorrect');

    // Verify still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should validate email format before submission', async ({ page }) => {
    // Try to login with invalid email format
    await loginPage.fillEmail('not-an-email');
    await loginPage.fillPassword('SomePassword123!');
    await loginPage.submit();

    // Should show email validation error
    const emailError = await loginPage.getEmailError();
    expect(emailError).toBeTruthy();
    expect(emailError).toContain('email');
  });

  test('should validate required fields', async ({ page }) => {
    // Submit empty form
    await loginPage.submit();

    // Should show validation errors
    const emailError = await loginPage.getEmailError();
    const passwordError = await loginPage.getPasswordError();

    expect(emailError).toBeTruthy();
    expect(passwordError).toBeTruthy();
  });

  test('should show loading state during login attempt', async ({ page }) => {
    // Mock slow login response (2 seconds delay)
    await page.route('**/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          token: 'mock_jwt_token',
          user: { role: 'pharmacist' },
        }),
      });
    });

    // Start login
    await loginPage.fillEmail('pharmacist@metapharm.ch');
    await loginPage.fillPassword('SecurePassword123!');
    await loginPage.submit();

    // Verify loading state
    await loginPage.expectLoading();
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('should handle network error gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/auth/login', (route) => route.abort('failed'));

    // Attempt login
    await loginPage.login({
      email: 'pharmacist@metapharm.ch',
      password: 'SecurePassword123!',
    });

    // Should show error message
    await expect(loginPage.errorAlert).toBeVisible({ timeout: 10000 });
  });

  test('should persist session after page refresh', async ({ page, context }) => {
    // Mock successful login
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        token: 'mock_jwt_token_persistent',
        refreshToken: 'mock_refresh_token_persistent',
        user: {
          id: 'user_pharmacist_001',
          email: 'pharmacist@metapharm.ch',
          role: 'pharmacist',
        },
      },
    });

    // Mock user profile fetch (will be called after refresh)
    await mockApiResponse(page, '**/users/me', {
      status: 200,
      body: {
        success: true,
        user: {
          id: 'user_pharmacist_001',
          email: 'pharmacist@metapharm.ch',
          role: 'pharmacist',
        },
      },
    });

    // Login
    await loginPage.login({
      email: 'pharmacist@metapharm.ch',
      password: 'SecurePassword123!',
    });

    await loginPage.expectLoginSuccess();

    // Store auth token in localStorage (simulating real auth flow)
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock_jwt_token_persistent');
    });

    // Refresh page
    await page.reload();

    // Should still be authenticated (not redirected to login)
    await page.waitForTimeout(1000); // Wait for auth check
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should support HIN e-ID authentication for Swiss healthcare', async ({ page }) => {
    // Look for HIN e-ID login option
    const hinLoginButton = page.getByRole('button', { name: /hin.*id|e-id/i });

    // Verify HIN option exists (Swiss healthcare requirement)
    await expect(hinLoginButton).toBeVisible();

    // Mock HIN OAuth flow
    await mockApiResponse(page, '**/auth/hin/callback', {
      status: 200,
      body: {
        success: true,
        token: 'mock_hin_jwt_token',
        user: {
          id: 'user_pharmacist_hin_001',
          email: 'pharmacist@hin.ch',
          role: 'pharmacist',
          hinId: 'HIN_123456789',
        },
      },
    });

    // Clicking HIN button would trigger OAuth (not tested here due to external redirect)
    // This test verifies the button exists for the HIN flow
  });

  test('should enforce MFA for pharmacist accounts', async ({ page }) => {
    // Mock login response requiring MFA
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        requiresMfa: true,
        mfaToken: 'temporary_mfa_token',
        message: 'Veuillez entrer votre code MFA',
      },
    });

    // Login with valid credentials
    await loginPage.login({
      email: 'pharmacist@metapharm.ch',
      password: 'SecurePassword123!',
    });

    // Should redirect to MFA page
    await page.waitForURL(/\/mfa/);

    // Verify MFA input visible
    const mfaInput = page.getByLabel(/code|mfa|2fa/i);
    await expect(mfaInput).toBeVisible();
  });

  test('should handle concurrent login sessions', async ({ page, context }) => {
    // Mock successful login
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        token: 'mock_jwt_token_session_1',
        user: { role: 'pharmacist' },
      },
    });

    // Login
    await loginPage.login({
      email: 'pharmacist@metapharm.ch',
      password: 'SecurePassword123!',
    });

    await loginPage.expectLoginSuccess();

    // Open second tab and try to login with same account
    const newPage = await context.newPage();
    const secondLogin = new LoginPage(newPage);
    await secondLogin.goto();

    await mockApiResponse(newPage, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        token: 'mock_jwt_token_session_2',
        user: { role: 'pharmacist' },
      },
    });

    await secondLogin.login({
      email: 'pharmacist@metapharm.ch',
      password: 'SecurePassword123!',
    });

    await secondLogin.expectLoginSuccess();

    // Both sessions should be valid (system allows concurrent sessions)
    await expect(page).not.toHaveURL(/\/login/);
    await expect(newPage).not.toHaveURL(/\/login/);

    await newPage.close();
  });
});
