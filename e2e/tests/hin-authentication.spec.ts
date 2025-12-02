/**
 * HIN Authentication E2E Tests
 *
 * Tests for HIN e-ID OAuth2 authentication flow
 * Task: T5-004 (HIN Integration E2E Tests)
 *
 * Test Scenarios:
 * 1. Complete HIN authentication flow
 * 2. Token refresh and session expiry
 * 3. Role-based access after HIN auth
 * 4. Error scenarios (invalid code, expired state, etc.)
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('HIN Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should show HIN login button for doctor role', async ({ page }) => {
    // Navigate to doctor login page (assuming role is passed via query param or route)
    await page.goto('/login?role=doctor');

    // HIN login button should be visible
    const hinButton = page.getByRole('button', { name: /Se connecter avec HIN e-ID/i });
    await expect(hinButton).toBeVisible();

    // Should also show email/password form
    await expect(page.getByLabel(/Adresse email/i)).toBeVisible();
    await expect(page.getByLabel(/Mot de passe/i)).toBeVisible();

    // Should show divider text
    await expect(page.getByText(/ou avec email et mot de passe/i)).toBeVisible();
  });

  test('should show HIN login button for pharmacist role', async ({ page }) => {
    await page.goto('/login?role=pharmacist');

    const hinButton = page.getByRole('button', { name: /Se connecter avec HIN e-ID/i });
    await expect(hinButton).toBeVisible();
  });

  test('should show HIN login button for nurse role', async ({ page }) => {
    await page.goto('/login?role=nurse');

    const hinButton = page.getByRole('button', { name: /Se connecter avec HIN e-ID/i });
    await expect(hinButton).toBeVisible();
  });

  test('should NOT show HIN login button for patient role', async ({ page }) => {
    await page.goto('/login?role=patient');

    const hinButton = page.getByRole('button', { name: /Se connecter avec HIN e-ID/i });
    await expect(hinButton).not.toBeVisible();
  });

  test('should redirect to HIN authorization when HIN button clicked', async ({ page, context }) => {
    await page.goto('/login?role=doctor');

    // Listen for navigation
    const navigationPromise = page.waitForURL(/oauth2\.hin\.ch/);

    // Click HIN login button
    const hinButton = page.getByRole('button', { name: /Se connecter avec HIN e-ID/i });
    await hinButton.click();

    // Should redirect to HIN authorization endpoint
    await navigationPromise;

    // Verify URL contains expected OAuth2 parameters
    const currentUrl = page.url();
    expect(currentUrl).toContain('oauth2.hin.ch/authorize');
    expect(currentUrl).toContain('client_id=');
    expect(currentUrl).toContain('redirect_uri=');
    expect(currentUrl).toContain('response_type=code');
    expect(currentUrl).toContain('state=');
  });
});

test.describe('HIN OAuth2 Callback Handling', () => {
  test('should handle successful HIN callback', async ({ page, context }) => {
    // Mock the HIN callback with authorization code
    const mockAuthCode = 'mock_authorization_code_12345';
    const mockState = Buffer.from(
      JSON.stringify({
        timestamp: Date.now(),
        nonce: 'test_nonce',
      })
    ).toString('base64url');

    // Intercept the token exchange request
    await page.route('**/auth/hin/callback*', async (route) => {
      const url = new URL(route.request().url());
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (code && state) {
        // Simulate successful token exchange
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            expiresIn: 3600,
            user: {
              id: 'user_123',
              email: 'doctor@example.com',
              role: 'doctor',
              hinId: 'hin_12345',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to callback URL (simulating HIN redirect)
    await page.goto(`/auth/hin/callback?code=${mockAuthCode}&state=${mockState}`);

    // Should redirect to dashboard after successful authentication
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify user is authenticated (check for logout button or user menu)
    await expect(page.getByRole('button', { name: /Se déconnecter/i })).toBeVisible();
  });

  test('should handle HIN callback with invalid state parameter', async ({ page }) => {
    const mockAuthCode = 'mock_authorization_code_12345';
    const invalidState = 'invalid_state_parameter';

    // Intercept the callback request
    await page.route('**/auth/hin/callback*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid or expired state parameter',
        }),
      });
    });

    await page.goto(`/auth/hin/callback?code=${mockAuthCode}&state=${invalidState}`);

    // Should show error message
    await expect(page.getByText(/Invalid or expired state parameter/i)).toBeVisible();
  });

  test('should handle HIN callback with OAuth error', async ({ page }) => {
    // Simulate HIN returning an error
    await page.goto('/auth/hin/callback?error=access_denied&error_description=User%20denied%20authorization');

    // Should show error message
    await expect(
      page.getByText(/HIN authentication failed: User denied authorization/i)
    ).toBeVisible();
  });

  test('should handle HIN callback without authorization code', async ({ page }) => {
    // Missing code parameter
    await page.goto('/auth/hin/callback?state=some_state');

    // Should show error message
    await expect(page.getByText(/Authorization code not received from HIN/i)).toBeVisible();
  });
});

test.describe('HIN Badge Display', () => {
  test('should display HIN verification badge on authenticated user profile', async ({ page, context }) => {
    // Mock authentication with HIN
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'mock_hin_access_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock user info with HIN credentials
    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'user_123',
            email: 'doctor@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'doctor',
            hinId: 'hin_12345',
            gln: '7601001234567',
            emailVerified: true,
          },
        }),
      });
    });

    // Navigate to dashboard/profile
    await page.goto('/dashboard');

    // HIN badge should be visible
    await expect(page.getByText(/HIN/i)).toBeVisible();

    // Tooltip should show HIN details
    const badge = page.getByText(/HIN/i).first();
    await badge.hover();

    // Should show tooltip with HIN info
    await expect(page.getByText(/Authentifié via HIN e-ID/i)).toBeVisible();
    await expect(page.getByText(/GLN: 7601001234567/i)).toBeVisible();
  });
});

test.describe('HIN Token Refresh', () => {
  test('should automatically refresh token when it expires', async ({ page, context }) => {
    // Set up initial authentication with short-lived token
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'mock_expiring_token',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'refreshToken',
        value: 'mock_refresh_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock API call that triggers token refresh
    let refreshCalled = false;
    await page.route('**/api/**', async (route) => {
      const authHeader = route.request().headers()['authorization'];

      if (authHeader === 'Bearer mock_expiring_token') {
        // First call: Token expired, return 401
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Token expired',
          }),
        });
      } else if (authHeader === 'Bearer new_access_token') {
        // Second call: New token, return success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {},
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock token refresh endpoint
    await page.route('**/auth/hin/refresh', async (route) => {
      refreshCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accessToken: 'new_access_token',
          refreshToken: 'new_refresh_token',
          expiresIn: 3600,
        }),
      });
    });

    await page.goto('/dashboard');

    // Make an API call that will trigger token refresh
    await page.evaluate(() => {
      return fetch('/api/users/me', {
        headers: {
          Authorization: 'Bearer mock_expiring_token',
        },
      });
    });

    // Wait a bit for refresh to complete
    await page.waitForTimeout(1000);

    // Verify refresh was called
    expect(refreshCalled).toBe(true);
  });

  test('should redirect to login when refresh token is invalid', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'expired_token',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'refreshToken',
        value: 'invalid_refresh_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock failed token refresh
    await page.route('**/auth/hin/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Refresh token expired or invalid',
        }),
      });
    });

    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('HIN Role-Based Access Control', () => {
  test('should allow doctor access to prescription creation after HIN auth', async ({ page, context }) => {
    // Mock doctor authentication via HIN
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'doctor_hin_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'doctor_123',
            email: 'doctor@example.com',
            role: 'doctor',
            hinId: 'hin_doctor_123',
          },
        }),
      });
    });

    await page.goto('/doctor/prescriptions/create');

    // Should be able to access prescription creation page
    await expect(page.getByRole('heading', { name: /Créer une ordonnance/i })).toBeVisible();
  });

  test('should allow pharmacist access to inventory after HIN auth', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'pharmacist_hin_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'pharmacist_123',
            email: 'pharmacist@example.com',
            role: 'pharmacist',
            hinId: 'hin_pharmacist_123',
          },
        }),
      });
    });

    await page.goto('/pharmacist/inventory');

    // Should be able to access inventory management
    await expect(page.getByRole('heading', { name: /Gestion de stock/i })).toBeVisible();
  });

  test('should deny patient access to healthcare professional routes', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'patient_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'patient_123',
            email: 'patient@example.com',
            role: 'patient',
          },
        }),
      });
    });

    // Try to access doctor route
    await page.goto('/doctor/prescriptions/create');

    // Should be redirected or show error
    await expect(page).not.toHaveURL(/\/doctor\/prescriptions\/create/);
    // Should either be on login or error page
    const isLoginPage = await page.url().includes('/login');
    const isErrorPage = await page.getByText(/Accès refusé|Access denied|Non autorisé/i).isVisible().catch(() => false);

    expect(isLoginPage || isErrorPage).toBe(true);
  });
});

test.describe('HIN Session Management', () => {
  test('should maintain HIN session across page reloads', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'valid_hin_token',
        domain: 'localhost',
        path: '/',
        expires: Date.now() / 1000 + 3600,
      },
    ]);

    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'user_123',
            email: 'doctor@example.com',
            role: 'doctor',
            hinId: 'hin_12345',
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Reload page
    await page.reload();

    // Should still be authenticated
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('button', { name: /Se déconnecter/i })).toBeVisible();
  });

  test('should clear HIN session on logout', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'valid_hin_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');

    // Click logout button
    const logoutButton = page.getByRole('button', { name: /Se déconnecter/i });
    await logoutButton.click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Cookies should be cleared
    const cookies = await context.cookies();
    const accessTokenCookie = cookies.find((c) => c.name === 'accessToken');
    expect(accessTokenCookie).toBeUndefined();
  });
});
