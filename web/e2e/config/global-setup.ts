import { FullConfig, chromium } from '@playwright/test';
import path from 'path';
import { testUsers } from '../fixtures/auth.fixture';

/**
 * Global Setup for Playwright Tests
 *
 * Runs once before all tests. Used for:
 * - Generating authentication states for each user role
 * - This prevents rate limiting by authenticating once and reusing tokens
 *
 * Note: Dev server availability is handled by Playwright's webServer config
 */
async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting Playwright E2E Test Suite Setup...\n');

  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5173';
  const authDir = path.join(__dirname, '../../.auth');

  console.log('📝 Generating authentication states for test users...\n');

  // Authenticate for each user role
  for (const [role, user] of Object.entries(testUsers)) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`  ↳ Authenticating as ${role} (${user.email})...`);

    try {
      // Navigate to login page
      await page.goto(baseURL);

      // Wait for login form to be visible
      await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });

      // Fill login form
      await page.fill('input[name="email"], input[type="email"]', user.email);
      await page.fill('input[name="password"], input[type="password"]', user.password);

      // Submit login and wait for network request
      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/auth/login') && resp.status() === 200, { timeout: 15000 }),
        page.click('button[type="submit"]'),
      ]);

      // Wait a bit for localStorage to be set by the app
      await page.waitForTimeout(1000);

      // Verify authentication token was set
      const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
      if (!authToken) {
        throw new Error('Authentication token not found in localStorage after login');
      }

      // Wait for navigation away from login page
      await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });

      console.log(`  ✅ ${role} authentication successful`);

      // Save authentication state
      await context.storageState({ path: path.join(authDir, `${role}.json`) });
    } catch (error) {
      console.error(`  ❌ Failed to authenticate as ${role}:`, error);
      // Don't throw - allow tests to run even if auth setup fails
      // Tests will handle auth themselves as fallback
    } finally {
      await browser.close();
    }
  }

  console.log('\n✅ Global setup complete\n');
}

export default globalSetup;
