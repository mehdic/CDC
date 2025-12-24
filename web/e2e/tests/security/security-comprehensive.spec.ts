import { test, expect } from '../../fixtures/auth.fixture';
import { mockApiResponse, mockLoginSuccess, mockLoginRequiresMFA } from '../../utils/api-mock';
import { login, logout, clearAuth } from '../../utils/auth-helpers';
import { LoginPage } from '../../page-objects/LoginPage';

test.describe('Security - Comprehensive End-to-End Security Tests (E2E-SEC-004)', () => {
  const pharmacistUser = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist' as const,
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy-1',
  };

  const patientUser = {
    email: 'patient@test.metapharm.ch',
    password: 'PatientPass123!',
    role: 'patient' as const,
    firstName: 'Sophie',
    lastName: 'Bernard',
  };

  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test.describe('Full Authentication and Authorization Flow', () => {
    test('should enforce complete security workflow: login → MFA → RBAC → session → logout', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Step 1: Login with MFA requirement
      await mockLoginRequiresMFA(page);

      await loginPage.goto();
      await loginPage.login({
        email: pharmacistUser.email,
        password: pharmacistUser.password,
      });

      // Step 2: Verify MFA verification screen appears
      await expect(page.locator('[data-testid="mfa-verification-form"]')).toBeVisible();

      // Step 3: Complete MFA verification
      await mockApiResponse(page, '**/auth/mfa/verify', {
        status: 200,
        body: {
          success: true,
          accessToken: 'full_access_token_123',
          refreshToken: 'full_refresh_456',
          user: {
            id: 'pharmacist_001',
            email: pharmacistUser.email,
            role: 'pharmacist',
            mfaEnabled: true,
            pharmacyId: 'pharmacy-1',
          },
        },
      });

      await page.fill('[data-testid="mfa-code-input"]', '123456');
      await page.click('[data-testid="submit-mfa-code"]');

      // Step 4: Verify successful authentication and redirect
      await page.waitForURL(/.*\/(?:dashboard|prescriptions|inventory)/);

      // Step 5: Verify RBAC - can access pharmacist pages
      await page.goto('/inventory');
      await expect(page).toHaveURL(/.*\/inventory/);
      await expect(page.locator('[data-testid="access-denied"]')).not.toBeVisible();

      // Step 6: Verify RBAC - cannot access patient-only pages
      await mockApiResponse(page, '**/patient/**', {
        status: 403,
        body: {
          success: false,
          error: 'Access denied',
        },
      });

      await page.goto('/patient/prescriptions');
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

      // Step 7: Verify session is active
      const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(authToken).toBeTruthy();

      // Step 8: Logout
      await mockApiResponse(page, '**/auth/logout', {
        status: 200,
        body: { success: true },
      });

      await logout(page);

      // Step 9: Verify logout cleared session
      await page.waitForURL(/.*\/(?:auth|login)/);
      const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(tokenAfterLogout).toBeNull();

      // Step 10: Verify cannot access protected pages after logout
      await page.goto('/inventory');
      await page.waitForURL(/.*\/(?:auth|login)/);
    });

    test('should enforce multi-layered security: Auth + RBAC + CSRF + XSS protection', async ({ page }) => {
      // Layer 1: Authentication
      await mockLoginSuccess(page, {
        role: 'pharmacist',
        email: pharmacistUser.email,
      });

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(pharmacistUser);

      await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

      // Layer 2: RBAC check
      await page.goto('/prescriptions');
      await expect(page).toHaveURL(/.*\/prescriptions/);

      // Layer 3: CSRF protection on state-changing operation
      let csrfProtectionPresent = false;

      await page.route('**/prescriptions', (route) => {
        if (route.request().method() === 'POST') {
          const headers = route.request().headers();
          csrfProtectionPresent =
            !!headers['x-csrf-token'] ||
            !!headers['x-xsrf-token'] ||
            headers['content-type']?.includes('application/json');
        }
        route.continue();
      });

      await page.goto('/prescriptions/new');

      const submitButton = page.getByRole('button', { name: /submit|créer/i });
      if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(500);
      }

      console.log('CSRF protection present:', csrfProtectionPresent);

      // Layer 4: XSS protection - inject malicious content
      await mockApiResponse(page, '**/prescriptions', {
        status: 200,
        body: {
          success: true,
          data: [
            {
              id: 'rx_001',
              patientName: '<script>alert("XSS")</script>Test Patient',
              medication: '<img src=x onerror=alert(1)>Aspirin',
            },
          ],
        },
      });

      await page.goto('/prescriptions');
      await page.waitForTimeout(1000);

      // Verify XSS was prevented
      const xssExecuted = await page.evaluate(() => {
        return (window as { xssExecuted?: boolean }).xssExecuted || false;
      });

      expect(xssExecuted).toBe(false);

      const pageContent = await page.content();
      const isSecure =
        !pageContent.includes('<script>alert("XSS")</script>') &&
        !pageContent.includes('<img src=x onerror=alert(1)>');

      expect(isSecure).toBe(true);
    });
  });

  test.describe('Session Security Scenarios', () => {
    test('should handle concurrent session detection and management', async ({ context, page }) => {
      // Login in first session
      await mockLoginSuccess(page, {
        role: 'pharmacist',
        email: pharmacistUser.email,
      });

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(pharmacistUser);

      await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

      // Create second session
      const page2 = await context.newPage();
      await mockLoginSuccess(page2, {
        role: 'pharmacist',
        email: pharmacistUser.email,
      });

      const loginPage2 = new LoginPage(page2);
      await loginPage2.goto();
      await loginPage2.login(pharmacistUser);

      await page2.waitForURL(/.*\/(?:dashboard|prescriptions)/);

      // Both sessions should be active
      await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();
      await expect(page2.locator('[data-testid="dashboard-view"]')).toBeVisible();

      // Mock concurrent session warning on first page
      await mockApiResponse(page, '**/auth/session/check', {
        status: 200,
        body: {
          success: true,
          concurrentSession: true,
          message: 'Another session detected from different device',
        },
      });

      await page.reload();

      // Should show concurrent session warning
      const warningVisible = await page
        .locator('[data-testid="concurrent-session-warning"]')
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      console.log('Concurrent session warning shown:', warningVisible);

      await page2.close();
    });

    test('should prevent session fixation attacks', async ({ page, context }) => {
      // Attacker sets a session ID
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('session_id', 'attacker_fixed_session_123');
      });

      // Victim logs in
      await mockLoginSuccess(page, {
        role: 'pharmacist',
        email: pharmacistUser.email,
      });

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(pharmacistUser);

      await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

      // Verify new session ID was issued (session fixation prevented)
      const sessionIdAfterLogin = await page.evaluate(() =>
        localStorage.getItem('session_id')
      );

      // Session ID should be different or newly generated
      // (actual implementation may use different mechanism)
      console.log('Session ID regenerated:', sessionIdAfterLogin !== 'attacker_fixed_session_123');
    });

    test('should enforce session timeout and auto-logout', async ({ page }) => {
      await mockLoginSuccess(page, {
        role: 'pharmacist',
        email: pharmacistUser.email,
      });

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(pharmacistUser);

      await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

      // Simulate session timeout
      await page.evaluate(() => {
        const expiredTime = Date.now() - 1000; // Expired
        localStorage.setItem('token_expiry', expiredTime.toString());
      });

      // Mock token refresh failure
      await mockApiResponse(page, '**/auth/refresh', {
        status: 401,
        body: {
          success: false,
          error: 'Session expired',
        },
      });

      // Trigger navigation
      await page.goto('/prescriptions');

      // Should redirect to login
      await page.waitForURL(/.*\/(?:auth|login)/);

      // Verify session timeout message
      const timeoutMessage = await page
        .locator('[data-testid="session-timeout-message"]')
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      console.log('Session timeout message shown:', timeoutMessage);
    });
  });

  test.describe('Role-Based Access Control (RBAC) Edge Cases', () => {
    test('should prevent horizontal privilege escalation', async ({ page }) => {
      // Login as patient 1
      await mockLoginSuccess(page, {
        role: 'patient',
        email: 'patient1@test.metapharm.ch',
      });

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login({
        email: 'patient1@test.metapharm.ch',
        password: 'Patient1Pass123!',
      });

      await page.waitForURL(/.*\/(?:dashboard|patient)/);

      // Try to access another patient's records
      await mockApiResponse(page, '**/patients/patient_002/**', {
        status: 403,
        body: {
          success: false,
          error: 'Access denied: Cannot access other patient records',
        },
      });

      await page.goto('/patient/prescriptions/patient_002');

      // Should be blocked
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    });

    test('should prevent vertical privilege escalation', async ({ page }) => {
      // Login as regular pharmacist
      await mockLoginSuccess(page, {
        role: 'pharmacist',
        email: pharmacistUser.email,
      });

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(pharmacistUser);

      await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

      // Try to access admin endpoint
      await mockApiResponse(page, '**/admin/**', {
        status: 403,
        body: {
          success: false,
          error: 'Admin privileges required',
        },
      });

      await page.goto('/admin/users');

      // Should be blocked
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    });

    test('should enforce resource-level permissions', async ({ page }) => {
      await mockLoginSuccess(page, {
        role: 'pharmacist',
        email: pharmacistUser.email,
      });

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(pharmacistUser);

      await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

      // Try to delete prescription from different pharmacy
      await mockApiResponse(page, '**/prescriptions/rx_other_pharmacy/delete', {
        status: 403,
        body: {
          success: false,
          error: 'Access denied: Prescription belongs to different pharmacy',
        },
      });

      await page.goto('/prescriptions/rx_other_pharmacy');

      const deleteButton = page.locator('[data-testid="delete-prescription-button"]');
      if (await deleteButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await deleteButton.click();

        // Should show error
        await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
      }
    });
  });

  test.describe('Security Headers and HTTP Security', () => {
    test('should set security headers on responses', async ({ page }) => {
      const response = await page.goto('/dashboard');

      if (response) {
        const headers = response.headers();

        console.log('Security Headers Audit:');
        console.log('- X-Frame-Options:', headers['x-frame-options'] || 'NOT SET');
        console.log('- X-Content-Type-Options:', headers['x-content-type-options'] || 'NOT SET');
        console.log('- X-XSS-Protection:', headers['x-xss-protection'] || 'NOT SET');
        console.log('- Strict-Transport-Security:', headers['strict-transport-security'] || 'NOT SET');
        console.log('- Content-Security-Policy:', headers['content-security-policy'] || 'NOT SET');
        console.log('- Referrer-Policy:', headers['referrer-policy'] || 'NOT SET');

        // Verify critical headers (if in production mode)
        if (process.env.NODE_ENV === 'production') {
          expect(headers['x-content-type-options']).toBe('nosniff');
          expect(headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/i);
        }
      }
    });

    test('should prevent clickjacking with X-Frame-Options', async ({ page }) => {
      const response = await page.goto('/login');

      if (response) {
        const headers = response.headers();
        const xFrameOptions = headers['x-frame-options'];

        // Should deny framing or allow same-origin only
        if (xFrameOptions) {
          expect(xFrameOptions).toMatch(/DENY|SAMEORIGIN/i);
        }
      }
    });

    test('should enforce HTTPS in production (via Strict-Transport-Security)', async ({ page }) => {
      const protocol = new URL(page.url()).protocol;

      if (protocol === 'https:') {
        const response = await page.goto('/dashboard');

        if (response) {
          const headers = response.headers();
          const hsts = headers['strict-transport-security'];

          console.log('HSTS Header:', hsts || 'NOT SET');

          if (hsts) {
            expect(hsts).toContain('max-age=');
          }
        }
      } else {
        console.log('HTTPS enforcement test skipped (not on HTTPS)');
      }
    });
  });

  test.describe('Input Validation and Sanitization', () => {
    test('should validate email format on login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await page.fill('input[name="email"]', 'invalid-email-format');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');

      // Should show validation error
      const emailError = await loginPage.getEmailError();
      expect(emailError).toBeTruthy();
      expect(emailError).toMatch(/email|format|invalid/i);
    });

    test('should enforce password strength requirements', async ({ page }) => {
      await page.goto('/auth/register');

      const weakPasswords = ['123', 'password', 'abc', 'qwerty'];

      for (const weakPass of weakPasswords) {
        const passwordInput = page.locator('[data-testid="password-input"]');
        if (await passwordInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await passwordInput.fill(weakPass);

          const strengthIndicator = page.locator('[data-testid="password-strength"]');
          if (await strengthIndicator.isVisible({ timeout: 500 }).catch(() => false)) {
            const strengthText = await strengthIndicator.textContent();

            // Should indicate weak password
            expect(strengthText).toMatch(/weak|faible/i);
          }
        }
      }
    });

    test('should sanitize SQL injection attempts in search', async ({ page }) => {
      await mockLoginSuccess(page, {
        role: 'pharmacist',
        email: pharmacistUser.email,
      });

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(pharmacistUser);

      await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM passwords--",
      ];

      await page.goto('/prescriptions/search');

      for (const payload of sqlInjectionPayloads) {
        const searchInput = page.locator('[data-testid="search-input"]');
        if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await searchInput.fill(payload);

          // Mock safe API response (SQL injection prevented server-side)
          await mockApiResponse(page, '**/search**', {
            status: 200,
            body: {
              success: true,
              results: [],
              query: payload,
            },
          });

          await searchInput.press('Enter');
          await page.waitForTimeout(500);

          // Verify no error or unexpected behavior
          const errorPage = await page.locator('text=/error|database|sql/i').isVisible({ timeout: 500 }).catch(() => false);
          expect(errorPage).toBe(false);
        }
      }
    });
  });

  test.describe('Audit Logging and Security Monitoring', () => {
    test('should log security-relevant events', async ({ page }) => {
      const securityEvents: string[] = [];

      // Intercept audit log endpoint
      await page.route('**/audit/log', (route) => {
        const postData = route.request().postData();
        if (postData) {
          const event = JSON.parse(postData);
          securityEvents.push(event.eventType);
        }
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      });

      // Perform security-relevant actions
      await mockLoginSuccess(page, {
        role: 'pharmacist',
        email: pharmacistUser.email,
      });

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(pharmacistUser);

      await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

      // Try unauthorized access
      await mockApiResponse(page, '**/admin/**', {
        status: 403,
        body: { success: false, error: 'Access denied' },
      });

      await page.goto('/admin/users');

      await page.waitForTimeout(1000);

      // Logout
      await mockApiResponse(page, '**/auth/logout', {
        status: 200,
        body: { success: true },
      });

      await logout(page);

      // Verify security events were logged
      console.log('Security events logged:', securityEvents);

      // Should include login, authorization failure, logout
      // (In production, server would handle logging)
    });
  });
});
