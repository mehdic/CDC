import { Page } from '@playwright/test';
import { TestUser } from '../fixtures/auth.fixture';

/**
 * Authentication Helper Utilities
 *
 * Provides reusable functions for authentication flows in E2E tests.
 */

/**
 * Login a user via the UI
 *
 * @param page - Playwright page object
 * @param user - Test user credentials
 */
export async function login(page: Page, user: TestUser): Promise<void> {
  // Navigate to login page
  await page.goto('/login');

  // Fill login form
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);

  // Submit form
  await page.locator('button[type="submit"]').click();

  // Wait for navigation to complete (redirected away from login)
  await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
}

/**
 * Login a user using stored authentication state (faster than UI login)
 *
 * This bypasses the UI and directly sets authentication tokens in localStorage,
 * making tests faster when authentication isn't being tested.
 *
 * @param page - Playwright page object
 * @param authState - Pre-generated authentication state
 */
export async function loginWithStoredAuth(
  page: Page,
  authState: {
    accessToken: string;
    refreshToken: string;
    user: Record<string, unknown>;
  }
): Promise<void> {
  // Navigate to any page to establish context
  await page.goto('/');

  // Set authentication tokens in localStorage
  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_data', JSON.stringify(user));
    },
    authState
  );

  // Reload to apply authentication
  await page.reload();
}

/**
 * Logout and clear authentication state
 *
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  // Try to click logout button if available
  const logoutButton = page.getByRole('button', { name: /déconnexion|logout/i });
  if (await logoutButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL(/.*\/login/, { timeout: 5000 });
  } else {
    // Fallback: clear auth manually
    await clearAuth(page);
  }
}

/**
 * Clear authentication state without using UI
 *
 * @param page - Playwright page object
 */
export async function clearAuth(page: Page): Promise<void> {
  try {
    // Navigate to app first to ensure localStorage is accessible
    const currentUrl = page.url();
    if (currentUrl === 'about:blank' || !currentUrl.startsWith('http')) {
      await page.goto('/');
    }

    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      sessionStorage.clear();
    });
  } catch (error) {
    // If localStorage is not accessible, just navigate to ensure clean state
    console.log('clearAuth: localStorage not accessible, navigating to clean state');
    await page.goto('/');
  }
}

/**
 * Get current authentication token from localStorage
 *
 * @param page - Playwright page object
 * @returns Access token or null
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  // Wait for token to be available (handles async storage timing)
  await page.waitForFunction(
    () => localStorage.getItem('auth_token') !== null,
    { timeout: 10000 }
  ).catch(() => {
    // If timeout, token doesn't exist - return null
    return null;
  });

  return page.evaluate(() => localStorage.getItem('auth_token'));
}

/**
 * Check if user is authenticated
 *
 * @param page - Playwright page object
 * @returns True if authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await getAuthToken(page);
  return token !== null && token.length > 0;
}

/**
 * Get current user data from localStorage
 *
 * @param page - Playwright page object
 * @returns User data or null
 */
export async function getUserData(page: Page): Promise<Record<string, unknown> | null> {
  const userData = await page.evaluate(() =>
    localStorage.getItem('user_data')
  );
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * Wait for authentication to complete
 *
 * Useful when login is triggered programmatically
 *
 * @param page - Playwright page object
 * @param timeout - Maximum wait time in milliseconds
 */
export async function waitForAuth(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  await page.waitForFunction(
    () => localStorage.getItem('auth_token') !== null,
    { timeout }
  );
}

/**
 * Create mock authentication state for testing
 *
 * Useful for tests that need authentication but don't want to go through
 * the actual auth flow.
 *
 * @param user - Test user
 * @returns Mock auth state
 */
export function createMockAuthState(user: TestUser): {
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
} {
  return {
    accessToken: `mock_access_token_${user.email}`,
    refreshToken: `mock_refresh_token_${user.email}`,
    user: {
      id: `user_${user.role}_001`,
      email: user.email,
      role: user.role,
      firstName: user.firstName || 'Test',
      lastName: user.lastName || 'User',
      pharmacyId: user.pharmacyId || null,
    },
  };
}
