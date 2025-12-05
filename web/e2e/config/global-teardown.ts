import { FullConfig } from '@playwright/test';

/**
 * Global Teardown for Playwright Tests
 *
 * Runs once after all tests complete. Used for:
 * - Stopping backend services
 * - Stopping mock servers
 * - Cleaning up test database
 * - Removing test data
 * - Cleanup of authentication states
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Starting Playwright E2E Test Suite Teardown...\n');

  // Backend services cleanup is handled by global-setup via process cleanup
  // This ensures proper process termination when playwright test runner exits
  console.log('ℹ️  Playwright will automatically clean up background processes\n');

  // Cleanup tasks can be added here:
  // - Stop mock API server
  // - Clean test database
  // - Remove test files
  // - Clear authentication states

  console.log('✅ Global teardown complete\n');
}

export default globalTeardown;
