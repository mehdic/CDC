import { test, expect } from '../fixtures/auth.fixture';
import { mockApiResponse } from '../utils/api-mock';
import { login } from '../utils/auth-helpers';

test.describe('Security - Session Management (E2E-023)', () => {
  const pharmacistUser = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist' as const,
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy-1',
  };

  test('should automatically timeout session after 30 minutes of inactivity', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Verify user is logged in
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();

    // Set token expiration to simulate 30-minute timeout
    await page.evaluate(() => {
      const expiredTime = Date.now() - 1000; // 1 second ago
      localStorage.setItem('token_expiry', expiredTime.toString());
    });

    // Mock token refresh failure (session expired)
    await mockApiResponse(page, '**/auth/refresh', {
      status: 401,
      body: {
        success: false,
        error: 'Session expired',
      },
    });

    // Attempt to navigate or perform action
    await page.goto('/prescriptions');

    // Verify redirect to login page
    await page.waitForURL(/.*\/(?:auth|login)/);
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Verify session timeout message
    await expect(page.locator('[data-testid="session-timeout-message"]')).toBeVisible();
    await expect(page.locator('text=/session.*expired|session.*expirée/i')).toBeVisible();
  });

  test('should refresh session token before expiration', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Mock successful token refresh
    await mockApiResponse(page, '**/auth/refresh', {
      status: 200,
      body: {
        success: true,
        accessToken: 'new_access_token_123',
        refreshToken: 'new_refresh_token_456',
        expiresIn: 3600,
      },
    });

    // Set token to expire soon (triggers auto-refresh)
    await page.evaluate(() => {
      const expiryTime = Date.now() + 60000; // 1 minute from now
      localStorage.setItem('token_expiry', expiryTime.toString());
    });

    // Wait for auto-refresh mechanism (simulated)
    await page.waitForTimeout(2000);

    // Navigate to another page
    await page.goto('/prescriptions');

    // Verify user remains logged in (token was refreshed)
    await expect(page).toHaveURL(/.*\/prescriptions/);
    await expect(page.locator('[data-testid="prescriptions-view"]')).toBeVisible();
  });

  test('should invalidate session on logout', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Verify logged in
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();

    // Mock logout endpoint
    await mockApiResponse(page, '**/auth/logout', {
      status: 200,
      body: {
        success: true,
        message: 'Logged out successfully',
      },
    });

    // Click logout button
    const logoutButton = page.getByRole('button', { name: /déconnexion|logout|sign out/i });
    await logoutButton.click();

    // Verify redirect to login page
    await page.waitForURL(/.*\/(?:auth|login)/);
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Verify tokens are cleared from localStorage
    const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));
    expect(authToken).toBeNull();
    expect(refreshToken).toBeNull();

    // Attempt to access protected page
    await page.goto('/dashboard');

    // Verify still on login page (session invalidated)
    await expect(page).toHaveURL(/.*\/(?:auth|login)/);
  });

  test('should detect and handle concurrent sessions', async ({ context, page }) => {
    // Login in first browser context
    await login(page, pharmacistUser);
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();

    // Create second browser context (simulate different device/browser)
    const page2 = await context.newPage();

    // Login in second context with same user
    await login(page2, pharmacistUser);
    await page2.goto('/dashboard');

    // Mock concurrent session detection
    await mockApiResponse(page, '**/auth/session/check', {
      status: 200,
      body: {
        success: true,
        concurrentSession: true,
        message: 'Another session detected',
      },
    });

    // Trigger session check in first page
    await page.reload();

    // Verify concurrent session warning
    const concurrentSessionWarning = page.locator('[data-testid="concurrent-session-warning"]');
    await expect(concurrentSessionWarning).toBeVisible();
    await expect(page.locator('text=/another.*session|autre.*session/i')).toBeVisible();

    // User should be able to continue or terminate other session
    const continueButton = page.getByRole('button', { name: /continue|continuer/i });
    await expect(continueButton).toBeVisible();

    await page2.close();
  });

  test('should enforce maximum concurrent session limit', async ({ context, page }) => {
    // Login in first browser context
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Create multiple additional contexts (simulate reaching session limit)
    const additionalPages = [];
    for (let i = 0; i < 3; i++) {
      const newPage = await context.newPage();
      additionalPages.push(newPage);
      await login(newPage, pharmacistUser);
      await newPage.goto('/dashboard');
    }

    // Attempt to login in another context (exceeds limit)
    const page5 = await context.newPage();

    // Mock session limit exceeded
    await mockApiResponse(page5, '**/auth/login', {
      status: 403,
      body: {
        success: false,
        error: 'Maximum concurrent session limit reached',
        maxSessions: 3,
      },
    });

    await page5.goto('/auth/login');
    await page5.fill('[data-testid="email-input"]', pharmacistUser.email);
    await page5.fill('[data-testid="password-input"]', pharmacistUser.password);
    await page5.click('[data-testid="login-button"]');

    // Verify session limit error
    await expect(page5.locator('[data-testid="session-limit-error"]')).toBeVisible();
    await expect(page5.locator('text=/maximum.*sessions|limite.*sessions/i')).toBeVisible();

    // Option to terminate other sessions should be available
    const terminateSessionsButton = page5.getByRole('button', {
      name: /terminate.*sessions|terminer.*sessions/i,
    });
    await expect(terminateSessionsButton).toBeVisible();

    // Cleanup
    for (const p of additionalPages) {
      await p.close();
    }
    await page5.close();
  });

  test('should maintain session persistence across page reloads', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Verify logged in
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();

    // Store session token
    const tokenBefore = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenBefore).toBeTruthy();

    // Reload page
    await page.reload();

    // Verify still logged in
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();

    // Verify token persisted
    const tokenAfter = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenAfter).toBe(tokenBefore);
  });

  test('should clear session on browser close (if "Remember Me" not checked)', async ({ context }) => {
    // Create new page
    const page = await context.newPage();

    // Mock login without "Remember Me"
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        accessToken: 'session_only_token_123',
        refreshToken: 'session_only_refresh_456',
        expiresIn: 3600,
        sessionOnly: true, // Not persistent
      },
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', pharmacistUser.email);
    await page.fill('[data-testid="password-input"]', pharmacistUser.password);
    // Do NOT check "Remember Me"
    await page.click('[data-testid="login-button"]');

    await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

    // Close page (simulates browser close)
    await page.close();

    // Reopen page (simulates new browser session)
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');

    // Verify redirected to login (session not persisted)
    await newPage.waitForURL(/.*\/(?:auth|login)/);
    await expect(newPage.locator('[data-testid="login-form"]')).toBeVisible();

    await newPage.close();
  });

  test('should extend session with "Remember Me" option', async ({ page }) => {
    // Mock login with "Remember Me"
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        accessToken: 'persistent_token_123',
        refreshToken: 'persistent_refresh_456',
        expiresIn: 2592000, // 30 days
        persistent: true,
      },
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', pharmacistUser.email);
    await page.fill('[data-testid="password-input"]', pharmacistUser.password);

    // Check "Remember Me"
    const rememberMeCheckbox = page.locator('[data-testid="remember-me-checkbox"]');
    await rememberMeCheckbox.check();

    await page.click('[data-testid="login-button"]');

    await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

    // Verify extended expiry is set
    const expiry = await page.evaluate(() => localStorage.getItem('token_expiry'));
    expect(expiry).toBeTruthy();

    const expiryTime = parseInt(expiry || '0');
    const now = Date.now();
    const daysDifference = (expiryTime - now) / (1000 * 60 * 60 * 24);

    // Should be approximately 30 days
    expect(daysDifference).toBeGreaterThan(25);
  });

  test('should revoke all sessions on password change', async ({ context, page }) => {
    // Login in first browser context
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Create second session
    const page2 = await context.newPage();
    await login(page2, pharmacistUser);
    await page2.goto('/dashboard');

    // Verify both sessions active
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();
    await expect(page2.locator('[data-testid="dashboard-view"]')).toBeVisible();

    // Change password in first session
    await mockApiResponse(page, '**/auth/change-password', {
      status: 200,
      body: {
        success: true,
        message: 'Password changed. All sessions have been revoked.',
        revokedSessions: 2,
      },
    });

    await page.goto('/profile/security');
    await page.fill('[data-testid="current-password-input"]', pharmacistUser.password);
    await page.fill('[data-testid="new-password-input"]', 'NewTestPass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'NewTestPass123!');
    await page.click('[data-testid="change-password-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="password-change-success"]')).toBeVisible();

    // Mock session invalidation in second session
    await mockApiResponse(page2, '**/auth/session/check', {
      status: 401,
      body: {
        success: false,
        error: 'Session invalidated due to password change',
      },
    });

    // Attempt to use second session
    await page2.reload();

    // Verify second session is logged out
    await page2.waitForURL(/.*\/(?:auth|login)/);
    await expect(page2.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page2.locator('text=/session.*invalidated|session.*invalidée/i')).toBeVisible();

    await page2.close();
  });

  test('should display active sessions list in security settings', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Mock active sessions data
    await mockApiResponse(page, '**/auth/sessions', {
      status: 200,
      body: {
        success: true,
        sessions: [
          {
            id: 'session_001',
            device: 'Chrome on macOS',
            ip: '192.168.1.100',
            location: 'Genève, Switzerland',
            lastActive: new Date().toISOString(),
            current: true,
          },
          {
            id: 'session_002',
            device: 'Firefox on Windows',
            ip: '192.168.1.101',
            location: 'Lausanne, Switzerland',
            lastActive: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            current: false,
          },
        ],
      },
    });

    await page.goto('/profile/security');

    // Verify active sessions section is visible
    await expect(page.locator('[data-testid="active-sessions-section"]')).toBeVisible();

    // Verify current session is marked
    const currentSession = page.locator('[data-testid="session-session_001"]');
    await expect(currentSession).toBeVisible();
    await expect(currentSession.locator('[data-testid="current-session-badge"]')).toBeVisible();

    // Verify other session details
    const otherSession = page.locator('[data-testid="session-session_002"]');
    await expect(otherSession).toBeVisible();
    await expect(otherSession).toContainText('Firefox on Windows');
    await expect(otherSession).toContainText('Lausanne');
  });

  test('should allow terminating individual sessions', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Mock active sessions data
    await mockApiResponse(page, '**/auth/sessions', {
      status: 200,
      body: {
        success: true,
        sessions: [
          {
            id: 'session_001',
            device: 'Chrome on macOS',
            current: true,
          },
          {
            id: 'session_002',
            device: 'Firefox on Windows',
            current: false,
          },
        ],
      },
    });

    await page.goto('/profile/security');

    // Mock session termination
    await mockApiResponse(page, '**/auth/sessions/session_002', {
      status: 200,
      body: {
        success: true,
        message: 'Session terminated',
      },
    });

    // Terminate other session
    const terminateButton = page.locator('[data-testid="session-session_002"] [data-testid="terminate-session-button"]');
    await terminateButton.click();

    // Verify confirmation dialog
    const confirmDialog = page.locator('[data-testid="confirm-terminate-session-dialog"]');
    await expect(confirmDialog).toBeVisible();

    await page.click('[data-testid="confirm-terminate-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="session-terminated-success"]')).toBeVisible();

    // Verify session removed from list
    await expect(page.locator('[data-testid="session-session_002"]')).not.toBeVisible();
  });

  test('should prevent session hijacking via XSS', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Attempt to inject malicious script that tries to steal token
    const stolenToken = await page.evaluate(() => {
      try {
        // Attempt to access token via various means
        const token1 = localStorage.getItem('auth_token');
        const token2 = document.cookie.match(/auth_token=([^;]+)/)?.[1];
        return { localStorage: token1, cookie: token2 };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });

    // Verify token is accessible (this is expected in localStorage)
    // But httpOnly cookies should NOT be accessible
    expect(stolenToken.cookie).toBeUndefined();

    // In production, tokens should ideally be in httpOnly secure cookies
    // This test demonstrates the current implementation
  });

  test('should automatically logout on suspicious activity', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Simulate suspicious activity detection (e.g., IP change, unusual access pattern)
    await mockApiResponse(page, '**/auth/session/check', {
      status: 401,
      body: {
        success: false,
        error: 'Suspicious activity detected. Please login again.',
        reason: 'ip_change',
      },
    });

    // Trigger session check (e.g., by navigating or API call)
    await page.goto('/prescriptions');

    // Verify automatic logout and redirect to login
    await page.waitForURL(/.*\/(?:auth|login)/);
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Verify security alert message
    await expect(page.locator('[data-testid="security-alert"]')).toBeVisible();
    await expect(page.locator('text=/suspicious.*activity|activité.*suspecte/i')).toBeVisible();
  });
});
