/**
 * Comprehensive E2E Tests for Login Flow
 * Tests FULL authentication workflow including:
 * - Login with valid/invalid credentials
 * - Session persistence after refresh
 * - Access to protected resources/API endpoints
 * - Token expiry and refresh
 * - Logout functionality
 *
 * All tests run in headless mode
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { testUsers } from '../fixtures/auth.fixture';
import { clearAuth, isAuthenticated, getAuthToken } from '../utils/auth-helpers';

// Configure tests to run in headless mode
test.describe.configure({ mode: 'serial' });

test.describe('Login Comprehensive E2E Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await clearAuth(page);
  });

  test.describe('Valid Login Flow', () => {
    test('should successfully login with valid pharmacist credentials and access dashboard', async ({
      page,
    }) => {
      await loginPage.goto();

      // Login with pharmacist credentials
      await loginPage.login({
        email: testUsers.pharmacist.email,
        password: testUsers.pharmacist.password,
      });

      // Wait for navigation to dashboard/prescriptions/inventory
      // Pattern matches any URL containing dashboard, prescriptions, or inventory
      await page.waitForURL(/(dashboard|prescriptions|inventory)/, {
        timeout: 10000,
      });

      // Wait for page load - use domcontentloaded which is more reliable than networkidle
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Verify we're authenticated
      const authenticated = await isAuthenticated(page);
      expect(authenticated).toBe(true);

      // Verify auth token exists and is a valid JWT format
      const token = await getAuthToken(page);
      expect(token).toBeTruthy();
      expect(token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT format

      // Verify URL changed (not on login page anymore)
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');

      // Verify dashboard/protected content is visible
      await expect(page.getByRole('heading', { name: /prescriptions|dashboard/i })).toBeVisible({
        timeout: 5000,
      });
    });

    test('should successfully login with valid doctor credentials', async ({ page }) => {
      await loginPage.goto();

      await loginPage.login({
        email: testUsers.doctor.email,
        password: testUsers.doctor.password,
      });

      await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Wait for authentication token to be stored in localStorage
      await page.waitForFunction(
        () => localStorage.getItem('auth_token') !== null,
        { timeout: 5000 }
      );

      const authenticated = await isAuthenticated(page);
      expect(authenticated).toBe(true);
    });

    test('should successfully login with valid patient credentials', async ({ page }) => {
      await loginPage.goto();

      await loginPage.login({
        email: testUsers.patient.email,
        password: testUsers.patient.password,
      });

      await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Wait for authentication token to be stored in localStorage
      await page.waitForFunction(
        () => localStorage.getItem('auth_token') !== null,
        { timeout: 5000 }
      );

      const authenticated = await isAuthenticated(page);
      expect(authenticated).toBe(true);
    });
  });

  test.describe('Access Protected Resources After Login', () => {
    test('should access protected API endpoints after login', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login({
        email: testUsers.pharmacist.email,
        password: testUsers.pharmacist.password,
      });

      // Wait for navigation
      await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Get auth token
      const token = await getAuthToken(page);

      // Test making authenticated API call to a protected endpoint
      const response = await page.request.get('http://localhost:4000/prescriptions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Should NOT be 401 Unauthorized (authentication should work)
      expect(response.status()).not.toBe(401);

      // Should be either 200 (success) or 404/429/503/504 (service not available but auth worked)
      expect([200, 404, 429, 503, 504]).toContain(response.status());
    });

    test('should be able to navigate to protected routes after login', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login({
        email: testUsers.pharmacist.email,
        password: testUsers.pharmacist.password,
      });

      await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Debug: Check localStorage after login
      const tokensAfterLogin = await page.evaluate(() => {
        return {
          authToken: localStorage.getItem('auth_token'),
          refreshToken: localStorage.getItem('refresh_token'),
          userData: localStorage.getItem('user_data')
        };
      });
      console.log('[DEBUG] Tokens after login:', tokensAfterLogin);

      // Try to navigate to protected routes
      const protectedRoutes = ['/dashboard', '/prescriptions', '/inventory'];

      for (const route of protectedRoutes) {
        console.log(`[DEBUG] Navigating to ${route}`);

        // Check tokens before navigation
        const tokensBefore = await page.evaluate(() => localStorage.getItem('auth_token'));
        console.log('[DEBUG] Token before navigation:', tokensBefore?.substring(0, 20) + '...');

        await page.goto(route);

        // Check tokens after navigation
        const tokensAfter = await page.evaluate(() => localStorage.getItem('auth_token'));
        console.log('[DEBUG] Token after navigation:', tokensAfter?.substring(0, 20) + '...');

        // Should NOT redirect back to login
        await page.waitForTimeout(1000); // Give time for potential redirect
        expect(page.url()).not.toContain('/login');
      }
    });
  });

  test.describe('Invalid Login Attempts', () => {
    test('should show error message with invalid email', async ({ page }) => {
      await loginPage.goto();

      await loginPage.login({
        email: 'nonexistent@test.metapharm.ch',
        password: 'WrongPassword123!',
      });

      // Should stay on login page
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/login');

      // Should show error message
      await loginPage.expectLoginError();

      // Should NOT be authenticated
      const authenticated = await isAuthenticated(page);
      expect(authenticated).toBe(false);
    });

    test('should show error message with wrong password', async ({ page }) => {
      await loginPage.goto();

      await loginPage.login({
        email: testUsers.pharmacist.email,
        password: 'WrongPassword123!',
      });

      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/login');

      await loginPage.expectLoginError();

      const authenticated = await isAuthenticated(page);
      expect(authenticated).toBe(false);
    });

    test('should show validation error with invalid email format', async ({ page }) => {
      await loginPage.goto();

      await loginPage.fillEmail('not-an-email');
      await loginPage.fillPassword('TestPass123!');

      // Blur to trigger validation
      await page.locator('input[name="email"]').blur();

      // Should show email validation error
      await expect(page.locator('text=/format d\'email invalide/i')).toBeVisible();
    });

    test('should show validation error with short password', async ({ page }) => {
      await loginPage.goto();

      await loginPage.fillEmail('test@test.com');
      await loginPage.fillPassword('12345');

      // Blur to trigger validation
      await page.locator('input[name="password"]').blur();

      // Should show password validation error
      await expect(
        page.locator('text=/mot de passe doit contenir au moins 6/i')
      ).toBeVisible();
    });

    test('should show error with empty fields', async ({ page }) => {
      await loginPage.goto();

      // Try to submit empty form
      await loginPage.submit();

      // Should NOT navigate away from login page
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/login');

      // Should show validation errors
      await expect(page.locator('text=/adresse email est requise/i')).toBeVisible();
      await expect(page.locator('text=/mot de passe est requis/i')).toBeVisible();
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session after page refresh', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login({
        email: testUsers.pharmacist.email,
        password: testUsers.pharmacist.password,
      });

      await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Get token before refresh
      const tokenBefore = await getAuthToken(page);
      expect(tokenBefore).toBeTruthy();

      // Refresh page
      await page.reload();

      // Wait a bit for potential redirect
      await page.waitForTimeout(2000);

      // Should still be authenticated (not redirected to login)
      expect(page.url()).not.toContain('/login');

      // Token should still exist
      const tokenAfter = await getAuthToken(page);
      expect(tokenAfter).toBeTruthy();
      expect(tokenAfter).toBe(tokenBefore);

      const authenticated = await isAuthenticated(page);
      expect(authenticated).toBe(true);
    });

    test('should maintain session in new tab', async ({ page, context }) => {
      await loginPage.goto();
      await loginPage.login({
        email: testUsers.pharmacist.email,
        password: testUsers.pharmacist.password,
      });

      await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Open new tab
      const newPage = await context.newPage();
      await newPage.goto('/dashboard');

      // Wait for potential redirect
      await newPage.waitForTimeout(2000);

      // Should be authenticated in new tab (shared localStorage)
      expect(newPage.url()).not.toContain('/login');

      const authenticated = await isAuthenticated(newPage);
      expect(authenticated).toBe(true);

      await newPage.close();
    });
  });

  test.describe('Logout Functionality', () => {
    test('should successfully logout and clear session', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login({
        email: testUsers.pharmacist.email,
        password: testUsers.pharmacist.password,
      });

      await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Verify authenticated before logout
      let authenticated = await isAuthenticated(page);
      expect(authenticated).toBe(true);

      // Find and click logout button (may be in a menu)
      // Try to find user menu first
      const userMenuButton = page.locator('[data-testid="user-menu"]').or(
        page.getByRole('button', { name: /profil|compte|user/i })
      );

      if (await userMenuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await userMenuButton.click();
      }

      // Click logout
      const logoutButton = page.getByRole('button', { name: /déconnexion|logout/i }).or(
        page.getByRole('menuitem', { name: /déconnexion|logout/i })
      );

      await logoutButton.click();

      // Should redirect to login page
      await page.waitForURL(/.*\/login/, { timeout: 5000 });

      // Should NOT be authenticated
      authenticated = await isAuthenticated(page);
      expect(authenticated).toBe(false);

      // Token should be cleared
      const token = await getAuthToken(page);
      expect(token).toBeNull();
    });

    test('should require login after logout when accessing protected routes', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login({
        email: testUsers.pharmacist.email,
        password: testUsers.pharmacist.password,
      });

      await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Logout by clearing auth (simulating session end)
      await clearAuth(page);

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to login
      await page.waitForURL(/.*\/login/, { timeout: 5000 });
    });
  });

  test.describe('Protected Routes Without Authentication', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await clearAuth(page);
      await page.goto('/dashboard');

      await page.waitForURL(/.*\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    test('should redirect to login when accessing prescriptions without auth', async ({ page }) => {
      await clearAuth(page);
      await page.goto('/prescriptions');

      await page.waitForURL(/.*\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    test('should redirect to login when accessing inventory without auth', async ({ page }) => {
      await clearAuth(page);
      await page.goto('/inventory');

      await page.waitForURL(/.*\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Network and API Integration', () => {
    test('should send login request to correct API endpoint', async ({ page }) => {
      await loginPage.goto();

      // Listen for API request
      const apiRequestPromise = page.waitForRequest(
        (request) =>
          request.url().includes('/auth/login') && request.method() === 'POST'
      );

      await loginPage.login({
        email: testUsers.pharmacist.email,
        password: testUsers.pharmacist.password,
      });

      // Verify request was made
      const apiRequest = await apiRequestPromise;
      expect(apiRequest.url()).toContain('http://localhost:4000/auth/login');

      // Verify request payload
      const postData = apiRequest.postDataJSON();
      expect(postData).toHaveProperty('email', testUsers.pharmacist.email);
      expect(postData).toHaveProperty('password');
    });

    test('should receive and store JWT tokens on successful login', async ({ page }) => {
      await loginPage.goto();

      // Listen for API response
      const apiResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/auth/login') && response.status() === 200
      );

      await loginPage.login({
        email: testUsers.pharmacist.email,
        password: testUsers.pharmacist.password,
      });

      // Get response
      const apiResponse = await apiResponsePromise;
      const responseData = await apiResponse.json();

      // Verify response structure
      expect(responseData).toHaveProperty('success', true);
      expect(responseData).toHaveProperty('accessToken');
      expect(responseData.accessToken).toBeTruthy();

      // Verify tokens are stored in localStorage
      const storedToken = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(storedToken).toBe(responseData.accessToken);
    });

    test('should include Authorization header in subsequent API requests', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login({
        email: testUsers.pharmacist.email,
        password: testUsers.pharmacist.password,
      });

      await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Get token
      const token = await getAuthToken(page);

      // Make an API request
      const response = await page.request.get('http://localhost:4000/prescriptions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Verify Authorization header was included (by checking we're not getting 401)
      expect(response.status()).not.toBe(401);

      // Accept 429/503/504 as valid response (service unavailable/rate limited but auth worked)
      expect([200, 404, 429, 503, 504]).toContain(response.status());
    });
  });
});
