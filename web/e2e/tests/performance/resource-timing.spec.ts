import { test, expect } from '../../fixtures/auth.fixture';
import { login } from '../../utils/auth-helpers';

/**
 * T8-051: Resource Timing and Network Performance
 *
 * Tests resource loading performance:
 * - Resource timing breakdown
 * - Network latency simulation
 * - Bandwidth constraints
 * - Memory profiling
 * - CPU profiling
 */

interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  transferSize: number;
  decodedSize: number;
  cached: boolean;
  dns: number;
  tcp: number;
  request: number;
  response: number;
  domProcessing?: number;
}

test.describe('T8-051: Resource Timing & Network Performance', () => {
  const pharmacistUser = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist' as const,
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy-1',
  };

  /**
   * Analyze resource timing
   */
  async function analyzeResourceTiming(page: any): Promise<ResourceTiming[]> {
    return await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      return resources.map((resource) => {
        const getResourceType = (name: string): string => {
          if (/\.js$/.test(name)) return 'script';
          if (/\.css$/.test(name)) return 'stylesheet';
          if (/\.(jpg|jpeg|png|gif|svg|webp)$/.test(name)) return 'image';
          if (/\.(woff|woff2|ttf|eot)$/.test(name)) return 'font';
          if (/\/api\//.test(name)) return 'api';
          return 'other';
        };

        return {
          name: resource.name,
          type: getResourceType(resource.name),
          duration: resource.duration,
          transferSize: resource.transferSize || 0,
          decodedSize: resource.decodedBodySize || 0,
          cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
          dns: resource.domainLookupEnd - resource.domainLookupStart,
          tcp: resource.connectEnd - resource.connectStart,
          request: resource.responseStart - resource.requestStart,
          response: resource.responseEnd - resource.responseStart,
        };
      });
    });
  }

  /**
   * Test: Resource timing breakdown
   */
  test('should have efficient resource loading times', async ({ page }) => {
    await login(page, pharmacistUser);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    const resources = await analyzeResourceTiming(page);

    console.log(`Total resources loaded: ${resources.length}`);

    // Analyze by type
    const byType = resources.reduce((acc, r) => {
      if (!acc[r.type]) {
        acc[r.type] = { count: 0, totalSize: 0, totalDuration: 0 };
      }
      acc[r.type].count++;
      acc[r.type].totalSize += r.transferSize;
      acc[r.type].totalDuration += r.duration;
      return acc;
    }, {} as Record<string, { count: number; totalSize: number; totalDuration: number }>);

    console.log('\nResources by Type:');
    for (const [type, stats] of Object.entries(byType)) {
      console.log(`  ${type}:`);
      console.log(`    Count: ${stats.count}`);
      console.log(`    Total Size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
      console.log(`    Avg Duration: ${(stats.totalDuration / stats.count).toFixed(2)}ms`);
    }

    // Assert resource budgets
    expect(byType.script?.count || 0).toBeLessThan(15); // Max 15 JS files
    expect(byType.stylesheet?.count || 0).toBeLessThan(5); // Max 5 CSS files
    expect((byType.script?.totalSize || 0) / 1024).toBeLessThan(500); // Max 500KB JS

    // Check for slow resources
    const slowResources = resources.filter((r) => r.duration > 1000);
    if (slowResources.length > 0) {
      console.log('\nSlow resources (>1s):');
      slowResources.forEach((r) => {
        console.log(`  ${r.name}: ${r.duration.toFixed(0)}ms`);
      });
    }

    expect(slowResources.length).toBeLessThan(3); // Max 2 slow resources
  });

  /**
   * Test: Network latency simulation (Fast 3G)
   */
  test('should perform acceptably on Fast 3G network', async ({ page, context }) => {
    // Simulate Fast 3G: 1.6 Mbps down, 750 Kbps up, 562ms RTT
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps in bytes/s
      uploadThroughput: (750 * 1024) / 8, // 750 Kbps in bytes/s
      latency: 562, // 562ms RTT
    });

    await login(page, pharmacistUser);

    const startTime = Date.now();
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const endTime = Date.now();

    const loadTime = endTime - startTime;

    console.log(`Fast 3G load time: ${loadTime}ms`);

    // Should still be usable on Fast 3G
    expect(loadTime).toBeLessThan(8000); // 8 seconds max

    // Critical content should be visible
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();
  });

  /**
   * Test: Network latency simulation (Slow 3G)
   */
  test('should remain functional on Slow 3G network', async ({ page, context }) => {
    // Simulate Slow 3G: 400 Kbps down, 400 Kbps up, 2000ms RTT
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (400 * 1024) / 8, // 400 Kbps
      uploadThroughput: (400 * 1024) / 8, // 400 Kbps
      latency: 2000, // 2000ms RTT
    });

    await login(page, pharmacistUser);

    const startTime = Date.now();
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const endTime = Date.now();

    const loadTime = endTime - startTime;

    console.log(`Slow 3G load time: ${loadTime}ms`);

    // Very relaxed threshold for Slow 3G
    expect(loadTime).toBeLessThan(15000); // 15 seconds max

    // Core UI should still load
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 20000 });
  });

  /**
   * Test: Memory usage profiling
   */
  test('should have acceptable memory usage', async ({ page }) => {
    await login(page, pharmacistUser);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Get memory metrics
    const memoryMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        return {
          usedJSHeapSize: mem.usedJSHeapSize,
          totalJSHeapSize: mem.totalJSHeapSize,
          jsHeapSizeLimit: mem.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (memoryMetrics) {
      const usedMB = memoryMetrics.usedJSHeapSize / (1024 * 1024);
      const totalMB = memoryMetrics.totalJSHeapSize / (1024 * 1024);
      const limitMB = memoryMetrics.jsHeapSizeLimit / (1024 * 1024);

      console.log('\nMemory Usage:');
      console.log(`  Used: ${usedMB.toFixed(2)} MB`);
      console.log(`  Total: ${totalMB.toFixed(2)} MB`);
      console.log(`  Limit: ${limitMB.toFixed(2)} MB`);
      console.log(`  Usage: ${((usedMB / limitMB) * 100).toFixed(1)}%`);

      // Should use less than 100MB
      expect(usedMB).toBeLessThan(100);
    } else {
      console.log('Memory API not available in this browser');
    }
  });

  /**
   * Test: Memory leak detection across navigation
   */
  test('should not leak memory across page navigation', async ({ page }) => {
    await login(page, pharmacistUser);

    const getMemoryUsage = async () => {
      const mem = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return null;
      });
      return mem;
    };

    // Initial memory
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    const initialMemory = await getMemoryUsage();

    if (!initialMemory) {
      console.log('Memory API not available - skipping leak detection');
      return;
    }

    // Navigate through pages multiple times
    const pages = ['/prescriptions', '/inventory', '/products', '/dashboard'];
    for (let i = 0; i < 3; i++) {
      for (const route of pages) {
        await page.goto(route, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
      }
    }

    // Final memory
    const finalMemory = await getMemoryUsage();
    const memoryGrowth = ((finalMemory - initialMemory) / initialMemory) * 100;

    console.log('\nMemory Leak Test:');
    console.log(`  Initial: ${(initialMemory / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  Final: ${(finalMemory / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  Growth: ${memoryGrowth.toFixed(1)}%`);

    // Memory should not grow more than 50%
    expect(memoryGrowth).toBeLessThan(50);
  });

  /**
   * Test: Cached vs uncached resource loading
   */
  test('should efficiently use browser cache', async ({ page }) => {
    await login(page, pharmacistUser);

    // First load (cold cache)
    const startTime1 = Date.now();
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    const endTime1 = Date.now();
    const coldLoadTime = endTime1 - startTime1;

    const resources1 = await analyzeResourceTiming(page);
    const cachedCount1 = resources1.filter((r) => r.cached).length;

    console.log(`Cold cache load: ${coldLoadTime}ms`);
    console.log(`Cached resources (1st load): ${cachedCount1}`);

    // Second load (warm cache)
    await page.reload({ waitUntil: 'networkidle' });

    const resources2 = await analyzeResourceTiming(page);
    const cachedCount2 = resources2.filter((r) => r.cached).length;

    console.log(`Cached resources (2nd load): ${cachedCount2}`);

    // Should have more cached resources on second load
    expect(cachedCount2).toBeGreaterThanOrEqual(cachedCount1);
  });

  /**
   * Test: Resource compression
   */
  test('should serve compressed resources', async ({ page }) => {
    await login(page, pharmacistUser);

    // Monitor response headers
    const compressionStats = { compressed: 0, uncompressed: 0 };

    page.on('response', (response) => {
      const headers = response.headers();
      const contentEncoding = headers['content-encoding'];
      const contentType = headers['content-type'];

      // Check if text-based resource is compressed
      if (
        contentType &&
        (contentType.includes('javascript') ||
          contentType.includes('css') ||
          contentType.includes('html') ||
          contentType.includes('json'))
      ) {
        if (contentEncoding === 'gzip' || contentEncoding === 'br') {
          compressionStats.compressed++;
        } else {
          compressionStats.uncompressed++;
        }
      }
    });

    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    console.log('\nCompression Stats:');
    console.log(`  Compressed: ${compressionStats.compressed}`);
    console.log(`  Uncompressed: ${compressionStats.uncompressed}`);

    // Most text resources should be compressed
    const compressionRate =
      compressionStats.compressed / (compressionStats.compressed + compressionStats.uncompressed);
    expect(compressionRate).toBeGreaterThan(0.8); // 80% compression rate
  });

  /**
   * Test: Offline resilience
   */
  test('should handle offline gracefully', async ({ page, context }) => {
    await login(page, pharmacistUser);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Verify initial load
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Trigger page action
    await page.click('[data-testid="dashboard-view"]').catch(() => {});

    // Should show offline message
    const offlineMessage = page.locator(
      'text=/offline|hors ligne|no.*connection|pas.*connexion/i'
    );
    await expect(offlineMessage).toBeVisible({ timeout: 5000 });

    console.log('Offline mode detected and handled');
  });
});
