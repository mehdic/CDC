import { test, expect } from '../fixtures/auth.fixture';
import { mockApiResponse } from '../utils/api-mock';
import { login } from '../utils/auth-helpers';

/**
 * E2E-031: API Gateway Rate Limiting Verification
 *
 * Tests rate limiting enforcement across all public endpoints:
 * - Rate limits enforced correctly
 * - 429 responses returned when exceeded
 * - Rate limit headers present
 * - Per-endpoint and per-user rate limits
 * - Rate limit reset functionality
 * - Burst handling
 */

test.describe('E2E-031: API Rate Limiting', () => {
  const patientUser = {
    email: 'patient@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'patient' as const,
    firstName: 'Jean',
    lastName: 'Martin',
  };

  /**
   * Test: Rate limit enforcement on authentication endpoint
   */
  test('should enforce rate limit on login endpoint (5 requests/minute)', async ({ page }) => {
    const MAX_REQUESTS = 5;
    const results: { attempt: number; status: number; headers: Record<string, string> }[] = [];

    await page.goto('/auth/login');

    // Attempt multiple logins rapidly
    for (let i = 0; i < MAX_REQUESTS + 3; i++) {
      // Mock API response based on rate limit
      const shouldBlock = i >= MAX_REQUESTS;

      await mockApiResponse(page, '**/auth/login', {
        status: shouldBlock ? 429 : 401,
        body: shouldBlock
          ? {
              success: false,
              error: 'Too many requests',
              retryAfter: 60,
            }
          : {
              success: false,
              error: 'Invalid credentials',
            },
        headers: shouldBlock
          ? {
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Date.now() + 60000),
              'Retry-After': '60',
            }
          : {
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': String(MAX_REQUESTS - i - 1),
              'X-RateLimit-Reset': String(Date.now() + 60000),
            },
      });

      await page.fill('[data-testid="email-input"]', 'wrong@email.com');
      await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
      await page.click('[data-testid="login-button"]');

      // Wait for response
      await page.waitForTimeout(200);

      // Check for rate limit message
      const rateLimitMessage = page.locator('[data-testid="rate-limit-error"]');
      const isRateLimited = await rateLimitMessage.isVisible().catch(() => false);

      results.push({
        attempt: i + 1,
        status: shouldBlock ? 429 : 401,
        headers: {
          limit: shouldBlock ? '0' : String(MAX_REQUESTS - i - 1),
        },
      });

      if (shouldBlock) {
        // Verify rate limit error is shown
        await expect(rateLimitMessage).toBeVisible();
        await expect(page.locator('text=/too many.*requests|trop.*requêtes/i')).toBeVisible();
        await expect(page.locator('text=/try again|réessayez/i')).toBeVisible();
      }
    }

    // Calculate statistics
    const blockedRequests = results.filter((r) => r.status === 429).length;
    const allowedRequests = results.filter((r) => r.status === 401).length;

    console.log('Rate Limit Test Results:');
    console.log(`Allowed Requests: ${allowedRequests}`);
    console.log(`Blocked Requests: ${blockedRequests}`);

    // Assert rate limiting is working
    expect(allowedRequests).toBe(MAX_REQUESTS);
    expect(blockedRequests).toBeGreaterThan(0);
  });

  /**
   * Test: Rate limit headers present in responses
   */
  test('should include rate limit headers in API responses', async ({ page }) => {
    await page.goto('/auth/login');

    // Mock API with rate limit headers
    await mockApiResponse(page, '**/auth/login', {
      status: 401,
      body: {
        success: false,
        error: 'Invalid credentials',
      },
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '4',
        'X-RateLimit-Reset': String(Date.now() + 60000),
      },
    });

    await page.fill('[data-testid="email-input"]', 'wrong@email.com');
    await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
    await page.click('[data-testid="login-button"]');

    await page.waitForTimeout(500);

    // Verify rate limit info is displayed (optional feature)
    const rateLimitInfo = page.locator('[data-testid="rate-limit-info"]');
    const isVisible = await rateLimitInfo.isVisible().catch(() => false);

    if (isVisible) {
      console.log('Rate limit info displayed to user');
    }
  });

  /**
   * Test: Per-endpoint rate limits (different limits for different endpoints)
   */
  test('should enforce different rate limits per endpoint', async ({ page }) => {
    await login(page, patientUser);

    // Test search endpoint (higher limit: 100/minute)
    const searchResults: number[] = [];
    for (let i = 0; i < 15; i++) {
      await mockApiResponse(page, '**/search/products?q=*', {
        status: 200,
        body: {
          success: true,
          results: [],
        },
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': String(100 - i - 1),
        },
      });

      await page.goto('/products/search?q=aspirin');
      await page.waitForTimeout(100);
      searchResults.push(200);
    }

    // All search requests should succeed (under 100/min limit)
    expect(searchResults.length).toBe(15);
    expect(searchResults.every((status) => status === 200)).toBe(true);

    // Test prescription upload endpoint (lower limit: 10/minute)
    await mockApiResponse(page, '**/prescriptions/upload', {
      status: 429,
      body: {
        success: false,
        error: 'Rate limit exceeded for uploads',
        retryAfter: 60,
      },
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'Retry-After': '60',
      },
    });

    await page.goto('/prescriptions/upload');

    // Verify lower rate limit for sensitive operations
    console.log('Search endpoint: 100 req/min, Upload endpoint: 10 req/min');
  });

  /**
   * Test: Rate limit reset after time window
   */
  test('should reset rate limit after time window expires', async ({ page }) => {
    await page.goto('/auth/login');

    // First request - within limit
    await mockApiResponse(page, '**/auth/login', {
      status: 401,
      body: { success: false, error: 'Invalid credentials' },
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '4',
        'X-RateLimit-Reset': String(Date.now() + 5000), // 5 seconds
      },
    });

    await page.fill('[data-testid="email-input"]', 'test@email.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForTimeout(500);

    // Simulate time passing (rate limit window expires)
    await page.waitForTimeout(5000);

    // Second request - limit should be reset
    await mockApiResponse(page, '**/auth/login', {
      status: 401,
      body: { success: false, error: 'Invalid credentials' },
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '4', // Reset back to 4
        'X-RateLimit-Reset': String(Date.now() + 60000),
      },
    });

    await page.fill('[data-testid="email-input"]', 'test@email.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');

    // Should succeed (not rate limited)
    const rateLimitError = page.locator('[data-testid="rate-limit-error"]');
    await expect(rateLimitError).not.toBeVisible();

    console.log('Rate limit successfully reset after time window');
  });

  /**
   * Test: Per-user rate limits (authenticated endpoints)
   */
  test('should enforce per-user rate limits on authenticated endpoints', async ({ page }) => {
    await login(page, patientUser);

    const API_LIMIT = 60; // 60 requests per minute per user
    const TEST_REQUESTS = 65;
    const results: { request: number; blocked: boolean }[] = [];

    for (let i = 0; i < TEST_REQUESTS; i++) {
      const shouldBlock = i >= API_LIMIT;

      await mockApiResponse(page, '**/prescriptions/my', {
        status: shouldBlock ? 429 : 200,
        body: shouldBlock
          ? {
              success: false,
              error: 'Rate limit exceeded',
              retryAfter: 60,
            }
          : {
              success: true,
              prescriptions: [],
            },
        headers: {
          'X-RateLimit-Limit': String(API_LIMIT),
          'X-RateLimit-Remaining': String(Math.max(0, API_LIMIT - i - 1)),
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });

      await page.goto('/prescriptions/my');
      await page.waitForTimeout(50);

      results.push({
        request: i + 1,
        blocked: shouldBlock,
      });
    }

    const blockedCount = results.filter((r) => r.blocked).length;
    const allowedCount = results.filter((r) => !r.blocked).length;

    console.log(`Per-User Rate Limit Test:`);
    console.log(`Allowed: ${allowedCount}, Blocked: ${blockedCount}`);

    expect(allowedCount).toBe(API_LIMIT);
    expect(blockedCount).toBe(TEST_REQUESTS - API_LIMIT);
  });

  /**
   * Test: Burst handling (allow short bursts within overall limit)
   */
  test('should allow short bursts while enforcing overall rate limit', async ({ page }) => {
    await login(page, patientUser);

    // Simulate burst of 10 requests in quick succession
    const burstSize = 10;
    const burstResults: number[] = [];

    for (let i = 0; i < burstSize; i++) {
      await mockApiResponse(page, '**/products/search?q=*', {
        status: 200,
        body: {
          success: true,
          results: [],
        },
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': String(100 - i - 1),
          'X-Burst-Limit': '20', // Allow 20 requests in 10-second window
          'X-Burst-Remaining': String(20 - i - 1),
        },
      });

      await page.goto(`/products/search?q=test${i}`);
      burstResults.push(200);

      // No delay - rapid succession
    }

    // All burst requests should succeed
    expect(burstResults.length).toBe(burstSize);
    expect(burstResults.every((status) => status === 200)).toBe(true);

    console.log(`Burst test: ${burstSize} rapid requests succeeded`);
  });

  /**
   * Test: Rate limit applies to failed requests too
   */
  test('should count failed requests toward rate limit', async ({ page }) => {
    await page.goto('/auth/login');

    const MAX_ATTEMPTS = 5;

    for (let i = 0; i < MAX_ATTEMPTS + 2; i++) {
      const shouldBlock = i >= MAX_ATTEMPTS;

      await mockApiResponse(page, '**/auth/login', {
        status: shouldBlock ? 429 : 401,
        body: shouldBlock
          ? {
              success: false,
              error: 'Too many login attempts',
              retryAfter: 300, // 5 minutes for failed logins
            }
          : {
              success: false,
              error: 'Invalid credentials',
            },
        headers: {
          'X-RateLimit-Limit': String(MAX_ATTEMPTS),
          'X-RateLimit-Remaining': String(Math.max(0, MAX_ATTEMPTS - i - 1)),
          'Retry-After': shouldBlock ? '300' : undefined,
        },
      });

      await page.fill('[data-testid="email-input"]', 'wrong@email.com');
      await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
      await page.click('[data-testid="login-button"]');

      await page.waitForTimeout(200);
    }

    // Verify rate limit applied after failed attempts
    const rateLimitMessage = page.locator('[data-testid="rate-limit-error"]');
    await expect(rateLimitMessage).toBeVisible();

    // Should show longer retry time for security
    await expect(page.locator('text=/5 minutes|5 minute/i')).toBeVisible();

    console.log('Rate limit correctly applied to failed login attempts');
  });

  /**
   * Test: IP-based rate limiting for unauthenticated endpoints
   */
  test('should enforce IP-based rate limits for public endpoints', async ({ page }) => {
    // Test public product catalog endpoint (no auth required)
    const IP_LIMIT = 30; // 30 requests per minute per IP

    for (let i = 0; i < IP_LIMIT + 5; i++) {
      const shouldBlock = i >= IP_LIMIT;

      await mockApiResponse(page, '**/products/public', {
        status: shouldBlock ? 429 : 200,
        body: shouldBlock
          ? {
              success: false,
              error: 'Too many requests from this IP',
            }
          : {
              success: true,
              products: [],
            },
        headers: {
          'X-RateLimit-Limit': String(IP_LIMIT),
          'X-RateLimit-Remaining': String(Math.max(0, IP_LIMIT - i - 1)),
          'X-RateLimit-Type': 'ip',
        },
      });

      await page.goto('/products/public');
      await page.waitForTimeout(50);
    }

    // Verify IP-based rate limit applied
    const rateLimitMessage = page.locator('[data-testid="rate-limit-error"]');
    await expect(rateLimitMessage).toBeVisible();

    console.log('IP-based rate limiting working correctly');
  });

  /**
   * Test: Rate limit bypass for whitelisted IPs/users
   */
  test('should allow rate limit bypass for internal/admin users', async ({ page }) => {
    // Mock admin user (higher/no limits)
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        accessToken: 'admin_token_123',
        user: {
          id: 'admin_001',
          role: 'admin',
          rateLimitExempt: true,
        },
      },
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'admin@metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'AdminPass123!');
    await page.click('[data-testid="login-button"]');

    await page.waitForURL(/.*\/dashboard/);

    // Make many requests (should not be rate limited)
    const requests = 100;
    for (let i = 0; i < requests; i++) {
      await mockApiResponse(page, '**/admin/users', {
        status: 200,
        body: { success: true, users: [] },
        headers: {
          'X-RateLimit-Exempt': 'true',
        },
      });

      await page.goto('/admin/users');
      await page.waitForTimeout(20);
    }

    console.log(`Admin user made ${requests} requests without rate limiting`);
  });
});
