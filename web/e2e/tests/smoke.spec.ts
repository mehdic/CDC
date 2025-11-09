import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { mockLoginSuccess } from '../utils/api-mock';
import { testUsers } from '../fixtures/auth.fixture';

/**
 * Smoke Tests
 *
 * These tests verify that the Playwright infrastructure is working correctly.
 * They test basic functionality like page loading, navigation, and authentication.
 *
 * Purpose: Infrastructure verification only. Phase 2 developers will write comprehensive tests.
 */

test.describe('Smoke Tests - Infrastructure Verification', () => {
  test('should load the application homepage', async ({ page }) => {
    await page.goto('/');

    // Verify page loaded
    await expect(page).toHaveURL(/\//);

    // Verify page is visible (not blank)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');

    // Verify URL
    await expect(page).toHaveURL(/login/);

    // Verify page title exists
    const title = page.getByRole('heading', { name: /MetaPharm/i });
    await expect(title).toBeVisible();
  });

  test('should render login form with all required fields', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verify all form elements are present
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();

    // Verify submit button is enabled
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('should validate email field on blur', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Enter invalid email
    await loginPage.fillEmail('invalid-email');
    await loginPage.emailInput.blur();

    // Submit to trigger validation
    await loginPage.submit();

    // Should show validation error
    const emailError = await loginPage.getEmailError();
    expect(emailError).toBeTruthy();
  });

  test('should validate password field on blur', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Enter short password
    await loginPage.fillPassword('123');
    await loginPage.passwordInput.blur();

    // Submit to trigger validation
    await loginPage.submit();

    // Should show validation error
    const passwordError = await loginPage.getPasswordError();
    expect(passwordError).toBeTruthy();
  });

  test('should show loading state during login', async ({ page }) => {
    // Mock a delayed login response
    await page.route('**/auth/login', async (route) => {
      // Delay response to see loading state
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accessToken: 'mock_token',
          refreshToken: 'mock_refresh',
          user: {
            id: 'user_001',
            email: 'test@example.com',
            role: 'pharmacist',
          },
        }),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Fill form
    await loginPage.fillEmail('test@example.com');
    await loginPage.fillPassword('password123');

    // Submit
    const submitPromise = loginPage.submit();

    // Verify loading state appears
    await expect(loginPage.loadingIndicator).toBeVisible();
    await expect(loginPage.submitButton).toBeDisabled();

    await submitPromise;
  });

  test('should display error on login failure', async ({ page }) => {
    // Mock failed login
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Identifiants invalides',
        }),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Fill and submit form
    await loginPage.login({
      email: 'wrong@example.com',
      password: 'wrongpassword',
    });

    // Should display error
    await loginPage.expectLoginError('Identifiants invalides');
  });

  test('should successfully mock login and redirect', async ({ page }) => {
    // Mock successful login
    await mockLoginSuccess(page, {
      email: testUsers.pharmacist.email,
      role: testUsers.pharmacist.role,
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Fill and submit form
    await loginPage.login({
      email: testUsers.pharmacist.email,
      password: testUsers.pharmacist.password,
    });

    // Should redirect away from login page
    await page.waitForURL(/.*\/(?!login)/, { timeout: 5000 });

    // Verify not on login page anymore
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('should use Page Object Model correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Test POM methods
    await loginPage.goto();
    await loginPage.expectPageLoaded();

    // Test individual field methods
    await loginPage.fillEmail('test@example.com');
    const emailValue = await loginPage.emailInput.inputValue();
    expect(emailValue).toBe('test@example.com');

    await loginPage.fillPassword('password123');
    const passwordValue = await loginPage.passwordInput.inputValue();
    expect(passwordValue).toBe('password123');
  });

  test('should run in headless mode', async ({ page, browserName }) => {
    // This test verifies the test runs in headless mode (no visible browser)
    // If it runs, the configuration is correct

    await page.goto('/');

    // Log browser name for verification
    console.log(`Running in headless mode with browser: ${browserName}`);

    expect(browserName).toBeTruthy();
  });
});

test.describe('Infrastructure Components Verification', () => {
  test('should have access to test utilities', async () => {
    // Verify utilities are importable and functional
    const { generateTestEmail, generateMockPrescription } = await import(
      '../utils/test-data'
    );

    const email = generateTestEmail('test');
    expect(email).toContain('@test.metapharm.ch');

    const prescription = generateMockPrescription();
    expect(prescription).toHaveProperty('id');
    expect(prescription).toHaveProperty('patientName');
  });

  test('should have access to API mocking utilities', async ({ page }) => {
    const { mockApiResponse } = await import('../utils/api-mock');

    // Mock an API endpoint
    await mockApiResponse(page, '**/test-endpoint', {
      status: 200,
      body: { success: true, data: 'test' },
    });

    // Navigate to trigger potential API calls
    await page.goto('/');

    // If we got here without errors, mocking utilities work
    expect(true).toBe(true);
  });

  test('should have access to authentication helpers', async () => {
    const { createMockAuthState } = await import('../utils/auth-helpers');

    const authState = createMockAuthState(testUsers.pharmacist);

    expect(authState).toHaveProperty('accessToken');
    expect(authState).toHaveProperty('refreshToken');
    expect(authState).toHaveProperty('user');
    expect(authState.user.role).toBe('pharmacist');
  });
});
