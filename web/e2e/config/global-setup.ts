import { FullConfig, chromium } from '@playwright/test';
import path from 'path';
import { testUsers } from '../fixtures/auth.fixture';
import { spawn, ChildProcess } from 'child_process';

let backendProcess: ChildProcess | null = null;

/**
 * Global Setup for Playwright Tests
 *
 * Runs once before all tests. Used for:
 * - Starting backend services (API Gateway)
 * - Generating authentication states for each user role
 * - This prevents rate limiting by authenticating once and reusing tokens
 *
 * Note: Frontend dev server availability is handled by Playwright's webServer config
 */
async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting Playwright E2E Test Suite Setup...\n');

  // Start backend services if not already running
  const backendURL = 'http://localhost:4000';

  console.log('🔧 Checking backend services availability...\n');

  try {
    const response = await fetch(`${backendURL}/health`).catch(() => null);
    if (response && response.ok) {
      console.log('✅ Backend services already running\n');
    } else {
      throw new Error('Backend not available');
    }
  } catch {
    console.log('⚙️  Starting backend API Gateway...\n');

    // Start API Gateway (which proxies to other services)
    // Set NODE_ENV=test to disable rate limiting for E2E tests
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '../../../backend/services/api-gateway'),
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'test', // Disable rate limiting for E2E tests
      },
    });

    // Wait for backend to be ready
    let attempts = 0;
    const maxAttempts = 60; // 30 seconds (60 * 500ms)

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${backendURL}/health`);
        if (response.ok) {
          console.log('✅ Backend services ready\n');
          break;
        }
      } catch {
        // Service not ready yet
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;

      if (attempts === maxAttempts) {
        console.error('❌ Backend services failed to start after 30 seconds');
        console.error('   Tests will likely fail with 503 errors');
        console.error('   You may need to start backend services manually\n');
      }
    }
  }

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

// Export backend process so it can be killed in teardown
export { backendProcess };

export default globalSetup;
