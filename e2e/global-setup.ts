import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for E2E Tests
 * Ensures environment is ready before tests run
 */

async function globalSetup(config: FullConfig) {
  console.log('🔧 Starting global E2E test setup...');

  // Launch browser to verify server is running
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Check if the dev server is accessible
    const baseURL = config.use?.baseURL || 'http://localhost:5173';
    console.log(`📡 Checking dev server at ${baseURL}...`);

    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✅ Dev server is running');
  } catch (error) {
    console.error('❌ Failed to connect to dev server:', error);
    throw new Error('Dev server is not running. Please start it with: npm run dev --workspace=web');
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup complete');
}

export default globalSetup;
