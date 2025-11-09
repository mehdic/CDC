import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for Playwright Tests
 *
 * Runs once before all tests. Used for:
 * - Starting mock servers
 * - Setting up test database
 * - Creating test data
 * - Generating authentication states
 */
async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting Playwright E2E Test Suite Setup...\n');

  const baseURL = config.use?.baseURL || 'http://localhost:5173';

  // Check if dev server is running
  console.log(`📡 Checking dev server at ${baseURL}...`);

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try to access the base URL with retry logic
    let retries = 3;
    let connected = false;

    while (retries > 0 && !connected) {
      try {
        await page.goto(baseURL, { timeout: 10000 });
        connected = true;
        console.log('✅ Dev server is accessible\n');
      } catch (error) {
        retries--;
        if (retries > 0) {
          console.log(
            `⏳ Waiting for dev server... (${retries} retries left)`
          );
          await page.waitForTimeout(5000);
        } else {
          console.log('❌ Dev server not accessible');
          throw error;
        }
      }
    }

    await browser.close();
  } catch (error) {
    console.error('❌ Failed to connect to dev server:', error);
    throw new Error(
      `Dev server not running at ${baseURL}. Please start it with 'npm run dev'`
    );
  }

  // Additional setup tasks can be added here:
  // - Start mock API server
  // - Initialize test database
  // - Seed test data
  // - Generate authentication states

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
