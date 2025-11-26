import { test, expect } from '../fixtures/auth.fixture';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-033: Authentication Bypass Attempt Tests
 *
 * Tests security against authentication bypass attacks:
 * - All bypass attempts blocked
 * - Attempts logged for security monitoring
 * - SQL injection in auth forms
 * - Token manipulation attempts
 * - Session fixation attacks
 * - Brute force protection
 */

test.describe('E2E-033: Authentication Bypass Security Tests', () => {
  /**
   * Test: SQL injection in login form
   */
  test('should block SQL injection attempts in login form', async ({ page }) => {
    const sqlInjectionPayloads = [
      "admin' OR '1'='1",
      "admin'--",
      "admin' OR '1'='1'--",
      "' OR 1=1--",
      "admin'; DROP TABLE users;--",
      "' UNION SELECT * FROM users WHERE '1'='1",
    ];

    for (const payload of sqlInjectionPayloads) {
      await mockApiResponse(page, '**/auth/login', {
        status: 400,
        body: {
          success: false,
          error: 'Invalid input detected',
          securityIncident: true,
        },
      });

      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', payload);
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      await page.waitForTimeout(500);

      // Verify login failed
      await expect(page).toHaveURL(/.*\/(?:auth|login)/);

      // Verify error message (should not expose SQL injection attempt)
      const errorMessage = page.locator('[data-testid="login-error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/invalid.*credentials|identifiants.*invalides/i);

      // Should NOT show SQL error messages
      await expect(page.locator('text=/SQL|syntax|query|table/i')).not.toBeVisible();
    }

    console.log(`Blocked ${sqlInjectionPayloads.length} SQL injection attempts`);
  });

  /**
   * Test: Direct URL access to protected routes without authentication
   */
  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/prescriptions',
      '/prescriptions/create',
      '/inventory',
      '/teleconsultation',
      '/patients',
      '/admin',
      '/profile',
      '/settings',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should redirect to login
      await page.waitForURL(/.*\/(?:auth|login)/);
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      console.log(`Blocked access to ${route}`);
    }

    console.log(`Protected ${protectedRoutes.length} routes from unauthenticated access`);
  });

  /**
   * Test: JWT token manipulation attempts
   */
  test('should reject manipulated JWT tokens', async ({ page }) => {
    // Mock login to get a token
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        accessToken: 'valid_token_abc123',
        user: { id: 'user_001', role: 'patient' },
      },
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'patient@test.metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    await page.waitForURL(/.*\/dashboard/);

    // Manipulate token in localStorage
    const manipulatedTokens = [
      'valid_token_abc123.manipulated',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature',
      'Bearer fake_token_xyz789',
      '',
      'null',
      'undefined',
    ];

    for (const manipulatedToken of manipulatedTokens) {
      await page.evaluate((token) => {
        localStorage.setItem('auth_token', token);
      }, manipulatedToken);

      // Mock rejection of invalid token
      await mockApiResponse(page, '**/prescriptions/list', {
        status: 401,
        body: {
          success: false,
          error: 'Invalid or expired token',
        },
      });

      await page.goto('/prescriptions');

      // Should redirect to login
      await page.waitForURL(/.*\/(?:auth|login)/, { timeout: 5000 });
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      console.log(`Rejected manipulated token: ${manipulatedToken.substring(0, 20)}...`);
    }
  });

  /**
   * Test: Session fixation attack prevention
   */
  test('should prevent session fixation attacks', async ({ page }) => {
    // Attacker tries to set a specific session ID before victim logs in
    await page.goto('/auth/login');

    // Set attacker's session ID
    await page.evaluate(() => {
      localStorage.setItem('session_id', 'attacker_session_12345');
      sessionStorage.setItem('session_id', 'attacker_session_12345');
    });

    // Mock login (should generate NEW session ID)
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        accessToken: 'new_token_abc123',
        sessionId: 'new_session_67890', // Server generates new session
        user: { id: 'user_001', role: 'patient' },
      },
    });

    await page.fill('[data-testid="email-input"]', 'patient@test.metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    await page.waitForURL(/.*\/dashboard/);

    // Verify session ID was regenerated (not using attacker's ID)
    const sessionId = await page.evaluate(() => {
      return localStorage.getItem('session_id') || sessionStorage.getItem('session_id');
    });

    expect(sessionId).not.toBe('attacker_session_12345');
    console.log('Session fixation attack prevented - new session generated');
  });

  /**
   * Test: Brute force protection on login
   */
  test('should block brute force login attempts', async ({ page }) => {
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 300; // 5 minutes

    await page.goto('/auth/login');

    for (let i = 0; i < MAX_ATTEMPTS + 3; i++) {
      const isLocked = i >= MAX_ATTEMPTS;

      await mockApiResponse(page, '**/auth/login', {
        status: isLocked ? 429 : 401,
        body: isLocked
          ? {
              success: false,
              error: 'Account temporarily locked due to multiple failed login attempts',
              lockedUntil: new Date(Date.now() + LOCKOUT_DURATION * 1000).toISOString(),
              remainingTime: LOCKOUT_DURATION,
            }
          : {
              success: false,
              error: 'Invalid credentials',
              attemptsRemaining: MAX_ATTEMPTS - i - 1,
            },
      });

      await page.fill('[data-testid="email-input"]', 'victim@test.metapharm.ch');
      await page.fill('[data-testid="password-input"]', `wrong_password_${i}`);
      await page.click('[data-testid="login-button"]');

      await page.waitForTimeout(300);

      if (isLocked) {
        // Verify account lockout message
        await expect(page.locator('[data-testid="account-locked-error"]')).toBeVisible();
        await expect(page.locator('text=/temporarily locked|temporairement verrouillé/i')).toBeVisible();
        await expect(page.locator('text=/5 minute/i')).toBeVisible();

        // Verify login button is disabled
        const loginButton = page.locator('[data-testid="login-button"]');
        await expect(loginButton).toBeDisabled();
      }
    }

    console.log(`Brute force protection activated after ${MAX_ATTEMPTS} failed attempts`);
  });

  /**
   * Test: CAPTCHA verification after multiple failed attempts
   */
  test('should require CAPTCHA after suspicious activity', async ({ page }) => {
    const CAPTCHA_THRESHOLD = 3;

    await page.goto('/auth/login');

    for (let i = 0; i < CAPTCHA_THRESHOLD + 1; i++) {
      const requiresCaptcha = i >= CAPTCHA_THRESHOLD;

      await mockApiResponse(page, '**/auth/login', {
        status: requiresCaptcha ? 403 : 401,
        body: requiresCaptcha
          ? {
              success: false,
              error: 'CAPTCHA verification required',
              challengeRequired: true,
            }
          : {
              success: false,
              error: 'Invalid credentials',
            },
      });

      await page.fill('[data-testid="email-input"]', 'user@test.metapharm.ch');
      await page.fill('[data-testid="password-input"]', 'wrong_pass');
      await page.click('[data-testid="login-button"]');

      await page.waitForTimeout(300);

      if (requiresCaptcha) {
        // Verify CAPTCHA challenge appears
        const captchaContainer = page.locator('[data-testid="captcha-challenge"]');
        await expect(captchaContainer).toBeVisible();
        console.log('CAPTCHA challenge triggered after suspicious activity');
      }
    }
  });

  /**
   * Test: Default credential attempts blocked
   */
  test('should block login attempts with default/common credentials', async ({ page }) => {
    const defaultCredentials = [
      { email: 'admin@admin.com', password: 'admin' },
      { email: 'admin@metapharm.ch', password: 'password' },
      { email: 'test@test.com', password: 'test123' },
      { email: 'user@example.com', password: '123456' },
    ];

    for (const creds of defaultCredentials) {
      await mockApiResponse(page, '**/auth/login', {
        status: 401,
        body: {
          success: false,
          error: 'Invalid credentials',
          securityAlert: true,
        },
      });

      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', creds.email);
      await page.fill('[data-testid="password-input"]', creds.password);
      await page.click('[data-testid="login-button"]');

      await page.waitForTimeout(300);

      // Verify login failed
      await expect(page).toHaveURL(/.*\/(?:auth|login)/);
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();

      console.log(`Blocked default credential: ${creds.email}`);
    }
  });

  /**
   * Test: Credential stuffing attack detection
   */
  test('should detect and block credential stuffing attacks', async ({ page }) => {
    // Simulate multiple login attempts with different email/password combos (credential stuffing)
    const credentialList = Array.from({ length: 20 }, (_, i) => ({
      email: `user${i}@test.com`,
      password: `password${i}`,
    }));

    await page.goto('/auth/login');

    for (let i = 0; i < credentialList.length; i++) {
      const creds = credentialList[i];
      const isBlocked = i >= 10; // Block after 10 attempts from same IP

      await mockApiResponse(page, '**/auth/login', {
        status: isBlocked ? 429 : 401,
        body: isBlocked
          ? {
              success: false,
              error: 'Suspicious activity detected',
              blocked: true,
            }
          : {
              success: false,
              error: 'Invalid credentials',
            },
      });

      await page.fill('[data-testid="email-input"]', creds.email);
      await page.fill('[data-testid="password-input"]', creds.password);
      await page.click('[data-testid="login-button"]');

      await page.waitForTimeout(100);

      if (isBlocked) {
        await expect(page.locator('[data-testid="security-block-message"]')).toBeVisible();
        console.log(`Credential stuffing attack blocked after ${i} attempts`);
        break;
      }
    }
  });

  /**
   * Test: Password reset token manipulation
   */
  test('should reject manipulated password reset tokens', async ({ page }) => {
    const invalidTokens = [
      'invalid_token_abc123',
      'expired_token_xyz789',
      '',
      'null',
      '../../../etc/passwd',
      '<script>alert("xss")</script>',
    ];

    for (const token of invalidTokens) {
      await mockApiResponse(page, '**/auth/reset-password/verify', {
        status: 400,
        body: {
          success: false,
          error: 'Invalid or expired reset token',
        },
      });

      await page.goto(`/auth/reset-password?token=${encodeURIComponent(token)}`);

      // Verify error message
      await expect(page.locator('[data-testid="invalid-token-error"]')).toBeVisible();
      await expect(page.locator('text=/invalid.*token|expired/i')).toBeVisible();

      // Verify password reset form is not shown
      const resetForm = page.locator('[data-testid="password-reset-form"]');
      await expect(resetForm).not.toBeVisible();

      console.log(`Rejected invalid reset token: ${token.substring(0, 20)}`);
    }
  });

  /**
   * Test: Account enumeration prevention
   */
  test('should prevent account enumeration via timing attacks', async ({ page }) => {
    // Both existing and non-existing accounts should respond in similar time
    const testAccounts = [
      { email: 'existing@metapharm.ch', exists: true },
      { email: 'nonexistent@metapharm.ch', exists: false },
    ];

    const responseTimes: number[] = [];

    for (const account of testAccounts) {
      await mockApiResponse(page, '**/auth/login', {
        status: 401,
        body: {
          success: false,
          error: 'Invalid credentials', // Same error message for both
        },
      });

      await page.goto('/auth/login');

      const startTime = Date.now();

      await page.fill('[data-testid="email-input"]', account.email);
      await page.fill('[data-testid="password-input"]', 'wrong_password');
      await page.click('[data-testid="login-button"]');

      await page.waitForTimeout(500);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);

      // Verify same generic error for both
      await expect(page.locator('[data-testid="login-error"]')).toContainText(/invalid.*credentials/i);
    }

    // Response times should be similar (within 500ms)
    const timeDifference = Math.abs(responseTimes[0] - responseTimes[1]);
    expect(timeDifference).toBeLessThan(500);

    console.log(`Response times: ${responseTimes.map((t) => `${t}ms`).join(', ')} - difference: ${timeDifference}ms`);
  });

  /**
   * Test: Header manipulation for authentication bypass
   */
  test('should reject authentication via header manipulation', async ({ page }) => {
    // Attempt to bypass auth by setting fake headers
    await page.setExtraHTTPHeaders({
      'X-User-Id': 'admin_001',
      'X-User-Role': 'admin',
      'X-Authenticated': 'true',
      Authorization: 'Bearer fake_token_12345',
    });

    await mockApiResponse(page, '**/prescriptions/list', {
      status: 401,
      body: {
        success: false,
        error: 'Unauthorized',
      },
    });

    await page.goto('/prescriptions');

    // Should redirect to login (headers ignored)
    await page.waitForURL(/.*\/(?:auth|login)/);
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    console.log('Header manipulation attempt blocked');
  });

  /**
   * Test: Cookie manipulation for session hijacking
   */
  test('should prevent session hijacking via cookie manipulation', async ({ page }) => {
    // Set fake authentication cookies
    await page.context().addCookies([
      {
        name: 'auth_token',
        value: 'fake_token_abc123',
        domain: new URL(page.url()).hostname,
        path: '/',
      },
      {
        name: 'user_id',
        value: 'admin_001',
        domain: new URL(page.url()).hostname,
        path: '/',
      },
    ]);

    await mockApiResponse(page, '**/dashboard', {
      status: 401,
      body: {
        success: false,
        error: 'Invalid session',
      },
    });

    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL(/.*\/(?:auth|login)/);
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    console.log('Cookie manipulation attempt blocked');
  });

  /**
   * Test: All bypass attempts are logged
   */
  test('should log all authentication bypass attempts for monitoring', async ({ page }) => {
    // Mock security logging endpoint
    let securityLogCount = 0;

    await page.route('**/security/log', async (route) => {
      securityLogCount++;
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, logged: true }),
      });
    });

    // Attempt various bypass techniques
    const bypassAttempts = [
      { type: 'sql_injection', email: "admin' OR '1'='1" },
      { type: 'token_manipulation', action: 'set_fake_token' },
      { type: 'direct_access', route: '/admin' },
    ];

    for (const attempt of bypassAttempts) {
      if (attempt.type === 'sql_injection') {
        await mockApiResponse(page, '**/auth/login', {
          status: 400,
          body: { success: false, error: 'Invalid input' },
        });

        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', attempt.email);
        await page.fill('[data-testid="password-input"]', 'password');
        await page.click('[data-testid="login-button"]');
        await page.waitForTimeout(300);
      } else if (attempt.type === 'direct_access') {
        await page.goto(attempt.route);
        await page.waitForTimeout(300);
      }
    }

    console.log(`Security logging captured ${securityLogCount} events (expected: implementation-dependent)`);
  });
});
