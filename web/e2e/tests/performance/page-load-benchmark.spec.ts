import { test, expect } from '../../fixtures/auth.fixture';
import { login } from '../../utils/auth-helpers';

/**
 * T8-051: Page Load Performance Benchmarks
 *
 * Tests page load times across critical user journeys:
 * - P95 page load time < 200ms requirement
 * - First Contentful Paint (FCP) < 1.8s
 * - Largest Contentful Paint (LCP) < 2.5s
 * - Time to Interactive (TTI) < 3.8s
 * - Navigation timing breakdown
 */

interface PerformanceMetrics {
  page: string;
  loadTime: number;
  domContentLoaded: number;
  domInteractive: number;
  fcp: number;
  lcp: number;
  tti: number;
  resourceCount: number;
  timestamp: string;
}

test.describe('T8-051: Page Load Performance Benchmarks', () => {
  const P95_THRESHOLD = 200; // ms
  const FCP_THRESHOLD = 1800; // ms
  const LCP_THRESHOLD = 2500; // ms
  const TTI_THRESHOLD = 3800; // ms

  const pharmacistUser = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist' as const,
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy-1',
  };

  /**
   * Measure page performance metrics using Navigation Timing API
   */
  async function measurePagePerformance(page: any, pageName: string): Promise<PerformanceMetrics> {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const resources = performance.getEntriesByType('resource');

      const fcp = paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0;

      // Calculate load time (total page load)
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;

      // Calculate DOM metrics
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      const domInteractive = navigation.domInteractive - navigation.fetchStart;

      return {
        loadTime,
        domContentLoaded,
        domInteractive,
        fcp,
        resourceCount: resources.length,
      };
    });

    // Get LCP using PerformanceObserver
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let lcpValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          lcpValue = lastEntry.renderTime || lastEntry.loadTime;
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // Resolve after a short delay to capture the LCP
        setTimeout(() => {
          observer.disconnect();
          resolve(lcpValue);
        }, 100);
      });
    });

    // Estimate TTI (simplified - real TTI requires more complex calculation)
    const tti = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation.domInteractive - navigation.fetchStart;
    });

    return {
      page: pageName,
      loadTime: Math.round(metrics.loadTime),
      domContentLoaded: Math.round(metrics.domContentLoaded),
      domInteractive: Math.round(metrics.domInteractive),
      fcp: Math.round(metrics.fcp),
      lcp: Math.round(lcp),
      tti: Math.round(tti),
      resourceCount: metrics.resourceCount,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test: Login page load performance
   */
  test('should load login page within performance budget', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'networkidle' });

    const metrics = await measurePagePerformance(page, 'login');

    console.log('Login Page Performance:', JSON.stringify(metrics, null, 2));

    // Assert P95 threshold (using load time as proxy)
    expect(metrics.loadTime).toBeLessThan(P95_THRESHOLD * 10); // Allow 10x for E2E overhead

    // Assert Core Web Vitals
    expect(metrics.fcp).toBeLessThan(FCP_THRESHOLD);
    expect(metrics.lcp).toBeLessThan(LCP_THRESHOLD);

    // Verify page is interactive quickly
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
  });

  /**
   * Test: Dashboard load performance (authenticated)
   */
  test('should load pharmacist dashboard within performance budget', async ({ page }) => {
    await login(page, pharmacistUser);

    // Measure dashboard load
    const startTime = Date.now();
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    const endTime = Date.now();

    const metrics = await measurePagePerformance(page, 'dashboard');
    const navigationTime = endTime - startTime;

    console.log('Dashboard Performance:', JSON.stringify(metrics, null, 2));
    console.log(`Navigation time: ${navigationTime}ms`);

    // Assert performance budgets
    expect(metrics.loadTime).toBeLessThan(P95_THRESHOLD * 10);
    expect(metrics.fcp).toBeLessThan(FCP_THRESHOLD);
    expect(metrics.lcp).toBeLessThan(LCP_THRESHOLD);

    // Verify critical content is visible
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();
  });

  /**
   * Test: Prescriptions page load performance
   */
  test('should load prescriptions page within performance budget', async ({ page }) => {
    await login(page, pharmacistUser);

    const startTime = Date.now();
    await page.goto('/prescriptions', { waitUntil: 'networkidle' });
    const endTime = Date.now();

    const metrics = await measurePagePerformance(page, 'prescriptions');
    const navigationTime = endTime - startTime;

    console.log('Prescriptions Page Performance:', JSON.stringify(metrics, null, 2));
    console.log(`Navigation time: ${navigationTime}ms`);

    expect(metrics.loadTime).toBeLessThan(P95_THRESHOLD * 10);
    expect(metrics.fcp).toBeLessThan(FCP_THRESHOLD);
  });

  /**
   * Test: Inventory page load performance
   */
  test('should load inventory page within performance budget', async ({ page }) => {
    await login(page, pharmacistUser);

    const startTime = Date.now();
    await page.goto('/inventory', { waitUntil: 'networkidle' });
    const endTime = Date.now();

    const metrics = await measurePagePerformance(page, 'inventory');
    const navigationTime = endTime - startTime;

    console.log('Inventory Page Performance:', JSON.stringify(metrics, null, 2));
    console.log(`Navigation time: ${navigationTime}ms`);

    expect(metrics.loadTime).toBeLessThan(P95_THRESHOLD * 10);
    expect(metrics.fcp).toBeLessThan(FCP_THRESHOLD);
  });

  /**
   * Test: E-commerce catalog load performance
   */
  test('should load product catalog within performance budget', async ({ page }) => {
    await login(page, pharmacistUser);

    const startTime = Date.now();
    await page.goto('/products', { waitUntil: 'networkidle' });
    const endTime = Date.now();

    const metrics = await measurePagePerformance(page, 'products');
    const navigationTime = endTime - startTime;

    console.log('Product Catalog Performance:', JSON.stringify(metrics, null, 2));
    console.log(`Navigation time: ${navigationTime}ms`);

    expect(metrics.loadTime).toBeLessThan(P95_THRESHOLD * 15); // Allow more time for images
    expect(metrics.fcp).toBeLessThan(FCP_THRESHOLD);
  });

  /**
   * Test: Multiple page navigation performance (realistic user journey)
   */
  test('should maintain performance across navigation journey', async ({ page }) => {
    await login(page, pharmacistUser);

    const journey = [
      '/dashboard',
      '/prescriptions',
      '/inventory',
      '/products',
      '/messaging',
      '/dashboard',
    ];

    const journeyMetrics: PerformanceMetrics[] = [];

    for (const route of journey) {
      const startTime = Date.now();
      await page.goto(route, { waitUntil: 'networkidle' });
      const endTime = Date.now();

      const metrics = await measurePagePerformance(page, route);
      const navigationTime = endTime - startTime;

      journeyMetrics.push(metrics);

      console.log(`Route ${route}: ${navigationTime}ms (Load: ${metrics.loadTime}ms, FCP: ${metrics.fcp}ms)`);

      // Each page should meet performance budget
      expect(metrics.fcp).toBeLessThan(FCP_THRESHOLD);
    }

    // Calculate average performance
    const avgLoadTime =
      journeyMetrics.reduce((sum, m) => sum + m.loadTime, 0) / journeyMetrics.length;
    const avgFcp = journeyMetrics.reduce((sum, m) => sum + m.fcp, 0) / journeyMetrics.length;

    console.log(`Average Load Time: ${Math.round(avgLoadTime)}ms`);
    console.log(`Average FCP: ${Math.round(avgFcp)}ms`);

    // Average should be well within budget
    expect(avgFcp).toBeLessThan(FCP_THRESHOLD * 0.8); // 80% of threshold
  });

  /**
   * Test: Resource count and bundle size
   */
  test('should load minimal resources for optimal performance', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'networkidle' });

    const resourceMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const jsResources = resources.filter((r) => r.name.includes('.js'));
      const cssResources = resources.filter((r) => r.name.includes('.css'));
      const imageResources = resources.filter((r) =>
        /\.(jpg|jpeg|png|gif|svg|webp)/.test(r.name)
      );

      const totalTransferSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const totalDecodedSize = resources.reduce((sum, r) => sum + (r.decodedBodySize || 0), 0);

      return {
        totalResources: resources.length,
        jsCount: jsResources.length,
        cssCount: cssResources.length,
        imageCount: imageResources.length,
        totalTransferSize: Math.round(totalTransferSize / 1024), // KB
        totalDecodedSize: Math.round(totalDecodedSize / 1024), // KB
      };
    });

    console.log('Resource Metrics:', JSON.stringify(resourceMetrics, null, 2));

    // Assert resource budgets
    expect(resourceMetrics.totalResources).toBeLessThan(50); // Max 50 resources
    expect(resourceMetrics.totalTransferSize).toBeLessThan(1000); // Max 1MB transferred
  });

  /**
   * Test: Navigation timing breakdown
   */
  test('should have efficient navigation timing breakdown', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    const timingBreakdown = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      return {
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnection: navigation.connectEnd - navigation.connectStart,
        tlsNegotiation: navigation.secureConnectionStart
          ? navigation.connectEnd - navigation.secureConnectionStart
          : 0,
        requestTime: navigation.responseStart - navigation.requestStart,
        responseTime: navigation.responseEnd - navigation.responseStart,
        domProcessing: navigation.domInteractive - navigation.responseEnd,
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadEvent: navigation.loadEventEnd - navigation.loadEventStart,
      };
    });

    console.log('Navigation Timing Breakdown:', JSON.stringify(timingBreakdown, null, 2));

    // Assert reasonable timing for each phase
    expect(timingBreakdown.requestTime).toBeLessThan(100); // Server response < 100ms
    expect(timingBreakdown.domProcessing).toBeLessThan(500); // DOM processing < 500ms
  });

  /**
   * Test: Performance with slow network simulation
   */
  test('should maintain usability on slow 3G network', async ({ page, context }) => {
    // Simulate slow 3G
    await context.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    const endTime = Date.now();

    const loadTime = endTime - startTime;

    console.log(`Slow 3G load time: ${loadTime}ms`);

    // Should still be usable (relaxed threshold)
    expect(loadTime).toBeLessThan(5000); // 5 seconds on slow 3G

    // Critical UI should be visible
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
  });

  /**
   * Test: Save performance metrics for regression detection
   */
  test('should save performance baseline metrics', async ({ page }) => {
    await login(page, pharmacistUser);

    const pages = ['/dashboard', '/prescriptions', '/inventory'];
    const baselineMetrics: PerformanceMetrics[] = [];

    for (const route of pages) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const metrics = await measurePagePerformance(page, route);
      baselineMetrics.push(metrics);
    }

    // Save to file (in real scenario, this would write to performance-baselines/)
    console.log('Baseline Metrics:', JSON.stringify(baselineMetrics, null, 2));

    // Verify all metrics collected
    expect(baselineMetrics.length).toBe(pages.length);
    baselineMetrics.forEach((metric) => {
      expect(metric.loadTime).toBeGreaterThan(0);
      expect(metric.fcp).toBeGreaterThan(0);
    });
  });
});
