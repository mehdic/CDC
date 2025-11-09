import { FullConfig } from '@playwright/test';

/**
 * Global Teardown for Playwright Tests
 *
 * Runs once after all tests complete. Used for:
 * - Stopping mock servers
 * - Cleaning up test database
 * - Removing test data
 * - Cleanup of authentication states
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Starting Playwright E2E Test Suite Teardown...\n');

  // Cleanup tasks can be added here:
  // - Stop mock API server
  // - Clean test database
  // - Remove test files
  // - Clear authentication states

  console.log('✅ Global teardown complete\n');
}

export default globalTeardown;
