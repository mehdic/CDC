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

  // Stop backend services if they were started by global-setup
  try {
    const { backendProcess } = await import('./global-setup');
    if (backendProcess) {
      console.log('⏹️  Stopping backend services...\n');
      backendProcess.kill('SIGTERM');

      // Give it time to shut down gracefully
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Backend services stopped\n');
    }
  } catch (error) {
    // Backend process not found or already stopped
    console.log('ℹ️  No backend services to stop\n');
  }

  // Cleanup tasks can be added here:
  // - Stop mock API server
  // - Clean test database
  // - Remove test files
  // - Clear authentication states

  console.log('✅ Global teardown complete\n');
}

export default globalTeardown;
