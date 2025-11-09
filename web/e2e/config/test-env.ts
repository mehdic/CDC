/**
 * Test Environment Configuration
 *
 * Environment-specific configuration for E2E tests.
 */

/**
 * Get environment variable with fallback
 */
function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Test environment configuration
 */
export const testEnv = {
  // Application URLs
  baseUrl: getEnv('PLAYWRIGHT_BASE_URL', 'http://localhost:5173'),
  apiUrl: getEnv('PLAYWRIGHT_API_URL', 'http://localhost:4000'),

  // Test execution settings
  headless: getEnv('PLAYWRIGHT_HEADLESS', 'true') === 'true',
  slowMo: parseInt(getEnv('PLAYWRIGHT_SLOW_MO', '0'), 10),
  timeout: parseInt(getEnv('PLAYWRIGHT_TIMEOUT', '30000'), 10),

  // Video and screenshot settings
  video: getEnv('PLAYWRIGHT_VIDEO', 'retain-on-failure'),
  screenshot: getEnv('PLAYWRIGHT_SCREENSHOT', 'only-on-failure'),

  // CI/CD settings
  isCI: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,

  // Test data settings
  useRealApi: getEnv('USE_REAL_API', 'false') === 'true',
  mockDelay: parseInt(getEnv('MOCK_API_DELAY', '0'), 10),

  // Authentication settings
  testUserEmail: getEnv('TEST_USER_EMAIL', 'pharmacist@test.metapharm.ch'),
  testUserPassword: getEnv('TEST_USER_PASSWORD', 'TestPass123!'),
};

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return testEnv.isCI;
}

/**
 * Check if using real API
 */
export function useRealApi(): boolean {
  return testEnv.useRealApi;
}

/**
 * Get test timeout based on environment
 */
export function getTestTimeout(): number {
  return testEnv.timeout;
}

/**
 * Get video recording setting
 */
export function getVideoSetting(): 'on' | 'off' | 'retain-on-failure' {
  return testEnv.video as 'on' | 'off' | 'retain-on-failure';
}

/**
 * Get screenshot setting
 */
export function getScreenshotSetting(): 'on' | 'off' | 'only-on-failure' {
  return testEnv.screenshot as 'on' | 'off' | 'only-on-failure';
}
