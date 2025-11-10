import { Page, Route } from '@playwright/test';

/**
 * API Mocking Utilities
 *
 * Provides utilities for mocking API responses in E2E tests.
 * Useful for testing UI behavior without backend dependencies.
 */

/**
 * Mock API response configuration
 */
export interface MockResponse {
  status?: number;
  contentType?: string;
  body: unknown;
  headers?: Record<string, string>;
}

/**
 * Mock a successful login response
 *
 * @param page - Playwright page object
 * @param userData - User data to return
 */
export async function mockLoginSuccess(
  page: Page,
  userData?: {
    id?: string;
    email?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    pharmacyId?: string;
  }
): Promise<void> {
  await page.route('**/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        accessToken: 'mock_access_token_123',
        refreshToken: 'mock_refresh_token_456',
        expiresIn: 3600,
        user: {
          id: userData?.id || 'user_001',
          email: userData?.email || 'test@example.com',
          role: userData?.role || 'pharmacist',
          firstName: userData?.firstName || 'Test',
          lastName: userData?.lastName || 'User',
          pharmacyId: userData?.pharmacyId || 'pharmacy_001',
        },
      }),
    });
  });
}

/**
 * Mock a failed login response
 *
 * @param page - Playwright page object
 * @param errorMessage - Error message to return
 */
export async function mockLoginFailure(
  page: Page,
  errorMessage: string = 'Invalid credentials'
): Promise<void> {
  await page.route('**/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: errorMessage,
      }),
    });
  });
}

/**
 * Mock a login response requiring MFA
 *
 * @param page - Playwright page object
 */
export async function mockLoginRequiresMFA(page: Page): Promise<void> {
  await page.route('**/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        requiresMFA: true,
        tempToken: 'temp_mfa_token_789',
      }),
    });
  });
}

/**
 * Mock API endpoint with custom response
 *
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match
 * @param response - Response to return
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: MockResponse
): Promise<void> {
  await page.route(urlPattern, async (route: Route) => {
    await route.fulfill({
      status: response.status || 200,
      contentType: response.contentType || 'application/json',
      headers: response.headers,
      body:
        typeof response.body === 'string'
          ? response.body
          : JSON.stringify(response.body),
    });
  });
}

/**
 * Mock API endpoint with error response
 *
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match
 * @param status - HTTP status code
 * @param errorMessage - Error message
 */
export async function mockApiError(
  page: Page,
  urlPattern: string | RegExp,
  status: number = 500,
  errorMessage: string = 'Internal Server Error'
): Promise<void> {
  await page.route(urlPattern, async (route: Route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: errorMessage,
      }),
    });
  });
}

/**
 * Mock network delay for API endpoint
 *
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match
 * @param delayMs - Delay in milliseconds
 * @param response - Response to return after delay
 */
export async function mockApiWithDelay(
  page: Page,
  urlPattern: string | RegExp,
  delayMs: number,
  response: MockResponse
): Promise<void> {
  await page.route(urlPattern, async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({
      status: response.status || 200,
      contentType: response.contentType || 'application/json',
      headers: response.headers,
      body:
        typeof response.body === 'string'
          ? response.body
          : JSON.stringify(response.body),
    });
  });
}

/**
 * Clear all API route mocks
 *
 * @param page - Playwright page object
 */
export async function clearApiMocks(page: Page): Promise<void> {
  await page.unroute('**/*');
}

/**
 * Mock prescription list API response
 *
 * @param page - Playwright page object
 * @param prescriptions - Array of prescriptions to return
 */
export async function mockPrescriptionList(
  page: Page,
  prescriptions: unknown[] = []
): Promise<void> {
  await mockApiResponse(page, '**/prescriptions**', {
    status: 200,
    body: {
      success: true,
      data: prescriptions,
      total: prescriptions.length,
    },
  });
}

/**
 * Mock inventory list API response
 *
 * @param page - Playwright page object
 * @param items - Array of inventory items to return
 */
export async function mockInventoryList(
  page: Page,
  items: unknown[] = []
): Promise<void> {
  await mockApiResponse(page, '**/inventory**', {
    status: 200,
    body: {
      success: true,
      data: items,
      total: items.length,
    },
  });
}

/**
 * Intercept and log API requests
 *
 * Useful for debugging tests
 *
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to intercept
 */
export async function interceptAndLogRequests(
  page: Page,
  urlPattern: string | RegExp = '**/*'
): Promise<void> {
  await page.route(urlPattern, async (route: Route) => {
    const request = route.request();
    console.log(`[API] ${request.method()} ${request.url()}`);
    console.log(`[API] Headers:`, request.headers());
    if (request.postData()) {
      console.log(`[API] Body:`, request.postData());
    }
    await route.continue();
  });
}
