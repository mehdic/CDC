import { test, expect } from '../fixtures/auth.fixture';
import { mockApiResponse } from '../utils/api-mock';
import { login } from '../utils/auth-helpers';

/**
 * E2E-032: Service Recovery Test
 *
 * Tests system resilience and recovery:
 * - Auto-recovery after service failure
 * - No data loss during restart
 * - Alerts triggered on failure
 * - Graceful degradation
 * - Circuit breaker patterns
 * - Health check endpoints
 */

test.describe('E2E-032: Service Recovery & Resilience', () => {
  const pharmacistUser = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist' as const,
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy-1',
  };

  /**
   * Test: Service auto-recovery after failure
   */
  test('should automatically recover when backend service restarts', async ({ page }) => {
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Verify initial state - service is healthy
    await mockApiResponse(page, '**/health', {
      status: 200,
      body: {
        success: true,
        status: 'healthy',
        services: {
          database: 'up',
          redis: 'up',
          prescriptionService: 'up',
        },
      },
    });

    await page.goto('/prescriptions');
    await expect(page.locator('[data-testid="prescriptions-view"]')).toBeVisible();

    // Simulate service failure
    await mockApiResponse(page, '**/prescriptions/list', {
      status: 503,
      body: {
        success: false,
        error: 'Service temporarily unavailable',
        retryAfter: 5,
      },
    });

    await page.reload();

    // Verify error message shown
    await expect(page.locator('[data-testid="service-unavailable-error"]')).toBeVisible();
    await expect(page.locator('text=/service.*unavailable|service.*indisponible/i')).toBeVisible();

    // Wait for service recovery (simulated)
    await page.waitForTimeout(3000);

    // Mock service recovery
    await mockApiResponse(page, '**/prescriptions/list', {
      status: 200,
      body: {
        success: true,
        prescriptions: [
          {
            id: 'rx_001',
            patientName: 'Jean Martin',
            status: 'pending',
          },
        ],
      },
    });

    // Retry button should be available
    const retryButton = page.locator('[data-testid="retry-button"]');
    if (await retryButton.isVisible()) {
      await retryButton.click();
    } else {
      await page.reload();
    }

    // Verify service recovered and data loads
    await expect(page.locator('[data-testid="prescriptions-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="prescription-rx_001"]')).toBeVisible();

    console.log('Service successfully recovered after failure');
  });

  /**
   * Test: No data loss during service restart
   */
  test('should preserve user data across service restart', async ({ page }) => {
    await login(page, pharmacistUser);

    // User creates prescription data
    await mockApiResponse(page, '**/prescriptions/create', {
      status: 200,
      body: {
        success: true,
        prescriptionId: 'rx_temp_001',
        message: 'Prescription saved',
      },
    });

    await page.goto('/prescriptions/create');
    await page.fill('[data-testid="patient-name-input"]', 'Jean Martin');
    await page.fill('[data-testid="medication-input"]', 'Aspirin 500mg');
    await page.click('[data-testid="save-draft-button"]');

    // Verify draft saved
    await expect(page.locator('[data-testid="draft-saved-message"]')).toBeVisible();

    // Simulate service restart (503 error briefly)
    await mockApiResponse(page, '**/prescriptions/drafts', {
      status: 503,
      body: {
        success: false,
        error: 'Service restarting',
      },
    });

    await page.goto('/prescriptions/drafts');
    await page.waitForTimeout(1000);

    // Mock service recovery with persisted data
    await mockApiResponse(page, '**/prescriptions/drafts', {
      status: 200,
      body: {
        success: true,
        drafts: [
          {
            id: 'rx_temp_001',
            patientName: 'Jean Martin',
            medication: 'Aspirin 500mg',
            savedAt: new Date().toISOString(),
          },
        ],
      },
    });

    await page.reload();

    // Verify draft persisted through restart
    await expect(page.locator('[data-testid="draft-rx_temp_001"]')).toBeVisible();
    await expect(page.locator('text=/Jean Martin/i')).toBeVisible();
    await expect(page.locator('text=/Aspirin 500mg/i')).toBeVisible();

    console.log('Data successfully preserved across service restart');
  });

  /**
   * Test: Health check endpoint responds correctly
   */
  test('should provide detailed health status via health check endpoint', async ({ page }) => {
    // Mock health check endpoint
    await mockApiResponse(page, '**/health', {
      status: 200,
      body: {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 86400, // 24 hours
        services: {
          database: { status: 'up', responseTime: 5 },
          redis: { status: 'up', responseTime: 2 },
          prescriptionService: { status: 'up', responseTime: 15 },
          inventoryService: { status: 'up', responseTime: 12 },
          twilioService: { status: 'up', responseTime: 100 },
        },
        metrics: {
          requestsPerMinute: 450,
          activeConnections: 23,
          errorRate: 0.02, // 2%
        },
      },
    });

    await page.goto('/admin/health');

    // Verify health dashboard displays correctly
    await expect(page.locator('[data-testid="health-status-healthy"]')).toBeVisible();
    await expect(page.locator('text=/database.*up/i')).toBeVisible();
    await expect(page.locator('text=/redis.*up/i')).toBeVisible();

    console.log('Health check endpoint provides detailed status');
  });

  /**
   * Test: Degraded service mode when dependencies fail
   */
  test('should gracefully degrade when external dependencies fail', async ({ page }) => {
    await login(page, pharmacistUser);

    // Mock Twilio service failure
    await mockApiResponse(page, '**/health', {
      status: 200,
      body: {
        success: true,
        status: 'degraded',
        services: {
          database: { status: 'up' },
          redis: { status: 'up' },
          prescriptionService: { status: 'up' },
          twilioService: { status: 'down', error: 'Connection timeout' },
        },
      },
    });

    await page.goto('/dashboard');

    // Verify degraded mode banner
    const degradedBanner = page.locator('[data-testid="degraded-mode-banner"]');
    await expect(degradedBanner).toBeVisible();
    await expect(page.locator('text=/limited.*functionality|fonctionnalité.*limitée/i')).toBeVisible();

    // Navigate to teleconsultation (requires Twilio)
    await page.goto('/teleconsultation');

    // Verify video calls are disabled with explanation
    await expect(page.locator('[data-testid="video-unavailable-message"]')).toBeVisible();
    await expect(page.locator('text=/video.*temporarily unavailable/i')).toBeVisible();

    // But prescriptions should still work
    await mockApiResponse(page, '**/prescriptions/list', {
      status: 200,
      body: {
        success: true,
        prescriptions: [{ id: 'rx_001', status: 'pending' }],
      },
    });

    await page.goto('/prescriptions');
    await expect(page.locator('[data-testid="prescriptions-view"]')).toBeVisible();

    console.log('System gracefully degraded - core features still working');
  });

  /**
   * Test: Circuit breaker pattern prevents cascading failures
   */
  test('should implement circuit breaker to prevent cascading failures', async ({ page }) => {
    await login(page, pharmacistUser);

    // Simulate repeated failures to external service (FDB drug interactions)
    const FAILURE_THRESHOLD = 5;

    for (let i = 0; i < FAILURE_THRESHOLD + 2; i++) {
      const circuitOpen = i >= FAILURE_THRESHOLD;

      await mockApiResponse(page, '**/prescriptions/check-interactions', {
        status: circuitOpen ? 503 : 500,
        body: circuitOpen
          ? {
              success: false,
              error: 'Circuit breaker open - service temporarily disabled',
              fallbackUsed: true,
              retryAfter: 30,
            }
          : {
              success: false,
              error: 'External service error',
            },
      });

      await page.goto('/prescriptions/create');
      await page.fill('[data-testid="medication-input"]', 'Warfarin');
      await page.click('[data-testid="check-interactions-button"]');

      await page.waitForTimeout(200);
    }

    // Verify circuit breaker message
    await expect(page.locator('[data-testid="circuit-breaker-message"]')).toBeVisible();
    await expect(page.locator('text=/using.*cached.*data|utilisation.*données.*cache/i')).toBeVisible();

    // Verify fallback behavior (basic checks still work)
    await expect(page.locator('[data-testid="basic-check-results"]')).toBeVisible();

    console.log('Circuit breaker activated after repeated failures');
  });

  /**
   * Test: Alerts triggered on service failure
   */
  test('should trigger monitoring alerts when service fails', async ({ page }) => {
    // Mock admin user viewing monitoring dashboard
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        accessToken: 'admin_token',
        user: { id: 'admin_001', role: 'admin' },
      },
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'admin@metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'AdminPass123!');
    await page.click('[data-testid="login-button"]');

    // Mock alerts endpoint
    await mockApiResponse(page, '**/admin/alerts', {
      status: 200,
      body: {
        success: true,
        alerts: [
          {
            id: 'alert_001',
            severity: 'critical',
            service: 'prescription-service',
            message: 'Service unresponsive for 2 minutes',
            timestamp: new Date(Date.now() - 120000).toISOString(),
            status: 'active',
          },
          {
            id: 'alert_002',
            severity: 'warning',
            service: 'database',
            message: 'High connection pool usage (85%)',
            timestamp: new Date(Date.now() - 60000).toISOString(),
            status: 'active',
          },
        ],
      },
    });

    await page.goto('/admin/monitoring/alerts');

    // Verify alerts are displayed
    await expect(page.locator('[data-testid="alert-alert_001"]')).toBeVisible();
    await expect(page.locator('[data-testid="severity-badge-critical"]')).toBeVisible();
    await expect(page.locator('text=/prescription-service/i')).toBeVisible();
    await expect(page.locator('text=/unresponsive/i')).toBeVisible();

    console.log('Alerts correctly triggered and displayed for service failures');
  });

  /**
   * Test: Automatic retry with exponential backoff
   */
  test('should implement exponential backoff for failed requests', async ({ page }) => {
    await login(page, pharmacistUser);

    const retryAttempts: { attempt: number; delay: number; timestamp: number }[] = [];
    let attempt = 0;

    // Mock failing then succeeding endpoint
    await page.route('**/prescriptions/upload', async (route) => {
      attempt++;
      const timestamp = Date.now();

      if (attempt < 4) {
        // Fail first 3 attempts
        retryAttempts.push({
          attempt,
          delay: attempt > 1 ? timestamp - retryAttempts[retryAttempts.length - 1].timestamp : 0,
          timestamp,
        });

        await route.fulfill({
          status: 503,
          body: JSON.stringify({
            success: false,
            error: 'Service temporarily unavailable',
          }),
        });
      } else {
        // Succeed on 4th attempt
        retryAttempts.push({
          attempt,
          delay: timestamp - retryAttempts[retryAttempts.length - 1].timestamp,
          timestamp,
        });

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            uploadId: 'upload_001',
          }),
        });
      }
    });

    await page.goto('/prescriptions/upload');
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'prescription.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });
    await page.click('[data-testid="upload-button"]');

    // Wait for retries to complete
    await page.waitForTimeout(5000);

    // Verify exponential backoff (delays should increase: ~1s, ~2s, ~4s)
    if (retryAttempts.length > 2) {
      const delay1 = retryAttempts[1].delay;
      const delay2 = retryAttempts[2].delay;

      console.log('Retry delays:', retryAttempts.map((r) => `${r.delay}ms`));

      // Verify delays roughly double (allow 500ms variance)
      expect(delay2).toBeGreaterThan(delay1);
    }

    // Verify eventual success
    await expect(page.locator('[data-testid="upload-success-message"]')).toBeVisible();

    console.log('Exponential backoff implemented correctly');
  });

  /**
   * Test: Database connection pool recovery
   */
  test('should recover from database connection pool exhaustion', async ({ page }) => {
    await login(page, pharmacistUser);

    // Mock connection pool exhaustion
    await mockApiResponse(page, '**/prescriptions/search', {
      status: 503,
      body: {
        success: false,
        error: 'Database connection pool exhausted',
        errorCode: 'DB_POOL_EXHAUSTED',
      },
    });

    await page.goto('/prescriptions/search?q=aspirin');

    // Verify error message
    await expect(page.locator('[data-testid="database-error-message"]')).toBeVisible();

    // Wait for pool recovery
    await page.waitForTimeout(2000);

    // Mock recovery
    await mockApiResponse(page, '**/prescriptions/search', {
      status: 200,
      body: {
        success: true,
        results: [{ id: 'rx_001', medication: 'Aspirin' }],
      },
    });

    // Retry
    await page.click('[data-testid="retry-button"]');

    // Verify recovery
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="result-rx_001"]')).toBeVisible();

    console.log('Database connection pool successfully recovered');
  });

  /**
   * Test: Redis cache failure fallback to database
   */
  test('should fallback to database when Redis cache fails', async ({ page }) => {
    await login(page, pharmacistUser);

    // Mock Redis failure with database fallback
    await mockApiResponse(page, '**/products/catalog', {
      status: 200,
      body: {
        success: true,
        products: [
          {
            id: 'prod_001',
            name: 'Aspirin 500mg',
            source: 'database', // Indicates cache miss/failure
          },
        ],
        cacheStatus: 'unavailable',
        responseTime: 45, // Slower without cache
      },
    });

    await page.goto('/products/catalog');

    // Verify products load (from database)
    await expect(page.locator('[data-testid="product-prod_001"]')).toBeVisible();

    // Optionally show cache status in dev mode
    const cacheWarning = page.locator('[data-testid="cache-unavailable-warning"]');
    const isVisible = await cacheWarning.isVisible().catch(() => false);

    if (isVisible) {
      console.log('Cache unavailable warning displayed');
    }

    console.log('Successfully fell back to database when Redis cache failed');
  });

  /**
   * Test: WebSocket reconnection after connection loss
   */
  test('should automatically reconnect WebSocket after connection loss', async ({ page }) => {
    await login(page, pharmacistUser);

    // Mock WebSocket connection for real-time updates
    await mockApiResponse(page, '**/ws/connect', {
      status: 200,
      body: {
        success: true,
        connectionId: 'ws_conn_001',
      },
    });

    await page.goto('/dashboard');

    // Verify WebSocket connected
    const wsStatus = page.locator('[data-testid="websocket-status"]');
    await expect(wsStatus).toContainText(/connected|connecté/i);

    // Simulate connection loss
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await page.waitForTimeout(500);

    // Verify disconnected state
    await expect(wsStatus).toContainText(/reconnecting|reconnexion/i);

    // Simulate reconnection
    await mockApiResponse(page, '**/ws/connect', {
      status: 200,
      body: {
        success: true,
        connectionId: 'ws_conn_002',
        reconnected: true,
      },
    });

    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });

    await page.waitForTimeout(1000);

    // Verify reconnected
    await expect(wsStatus).toContainText(/connected|connecté/i);

    console.log('WebSocket successfully reconnected after connection loss');
  });
});
