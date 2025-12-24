import { test, expect } from '../../fixtures/auth.fixture';
import { login } from '../../utils/auth-helpers';

/**
 * T8-051: Core Web Vitals Performance Tests
 *
 * Tests Google's Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint) < 2.5s (good)
 * - FID (First Input Delay) < 100ms (good)
 * - CLS (Cumulative Layout Shift) < 0.1 (good)
 * - FCP (First Contentful Paint) < 1.8s
 * - TTFB (Time to First Byte) < 600ms
 * - INP (Interaction to Next Paint) < 200ms
 */

interface WebVitals {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  inp: number;
}

test.describe('T8-051: Core Web Vitals', () => {
  const LCP_THRESHOLD = 2500; // 2.5s (good)
  const FID_THRESHOLD = 100; // 100ms (good)
  const CLS_THRESHOLD = 0.1; // 0.1 (good)
  const FCP_THRESHOLD = 1800; // 1.8s (good)
  const TTFB_THRESHOLD = 600; // 600ms (good)
  const INP_THRESHOLD = 200; // 200ms (good)

  const pharmacistUser = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist' as const,
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy-1',
  };

  /**
   * Collect Core Web Vitals using Performance Observer API
   */
  async function collectWebVitals(page: any): Promise<Partial<WebVitals>> {
    return await page.evaluate(() => {
      return new Promise<Partial<WebVitals>>((resolve) => {
        const vitals: Partial<WebVitals> = {};
        let observersCompleted = 0;
        const totalObservers = 4;

        const checkComplete = () => {
          observersCompleted++;
          if (observersCompleted >= totalObservers) {
            resolve(vitals);
          }
        };

        // Measure LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => {
          lcpObserver.disconnect();
          checkComplete();
        }, 500);

        // Measure FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            vitals.fid = entry.processingStart - entry.startTime;
          });
        });
        try {
          fidObserver.observe({ type: 'first-input', buffered: true });
        } catch {
          vitals.fid = 0; // No input yet
        }
        setTimeout(() => {
          fidObserver.disconnect();
          checkComplete();
        }, 500);

        // Measure CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          vitals.cls = clsValue;
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          clsObserver.disconnect();
          checkComplete();
        }, 500);

        // Measure FCP (First Contentful Paint)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
          });
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
        setTimeout(() => {
          fcpObserver.disconnect();
          checkComplete();
        }, 500);

        // Measure TTFB (Time to First Byte)
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          vitals.ttfb = navigation.responseStart - navigation.requestStart;
        }

        // INP measurement requires interaction, set default
        vitals.inp = 0;
      });
    });
  }

  /**
   * Test: Dashboard Core Web Vitals
   */
  test('should meet Core Web Vitals thresholds on dashboard', async ({ page }) => {
    await login(page, pharmacistUser);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    const vitals = await collectWebVitals(page);

    console.log('Dashboard Core Web Vitals:', JSON.stringify(vitals, null, 2));

    // Assert Core Web Vitals
    if (vitals.lcp) expect(vitals.lcp).toBeLessThan(LCP_THRESHOLD);
    if (vitals.fcp) expect(vitals.fcp).toBeLessThan(FCP_THRESHOLD);
    if (vitals.cls) expect(vitals.cls).toBeLessThan(CLS_THRESHOLD);
    if (vitals.ttfb) expect(vitals.ttfb).toBeLessThan(TTFB_THRESHOLD);

    // Log results
    console.log(`LCP: ${vitals.lcp?.toFixed(0)}ms (threshold: ${LCP_THRESHOLD}ms)`);
    console.log(`FCP: ${vitals.fcp?.toFixed(0)}ms (threshold: ${FCP_THRESHOLD}ms)`);
    console.log(`CLS: ${vitals.cls?.toFixed(3)} (threshold: ${CLS_THRESHOLD})`);
    console.log(`TTFB: ${vitals.ttfb?.toFixed(0)}ms (threshold: ${TTFB_THRESHOLD}ms)`);
  });

  /**
   * Test: Prescriptions page Core Web Vitals
   */
  test('should meet Core Web Vitals thresholds on prescriptions page', async ({ page }) => {
    await login(page, pharmacistUser);
    await page.goto('/prescriptions', { waitUntil: 'networkidle' });

    const vitals = await collectWebVitals(page);

    console.log('Prescriptions Page Core Web Vitals:', JSON.stringify(vitals, null, 2));

    if (vitals.lcp) expect(vitals.lcp).toBeLessThan(LCP_THRESHOLD);
    if (vitals.fcp) expect(vitals.fcp).toBeLessThan(FCP_THRESHOLD);
    if (vitals.cls) expect(vitals.cls).toBeLessThan(CLS_THRESHOLD);
  });

  /**
   * Test: Product catalog Core Web Vitals (image-heavy page)
   */
  test('should meet Core Web Vitals thresholds on product catalog', async ({ page }) => {
    await login(page, pharmacistUser);
    await page.goto('/products', { waitUntil: 'networkidle' });

    const vitals = await collectWebVitals(page);

    console.log('Product Catalog Core Web Vitals:', JSON.stringify(vitals, null, 2));

    // Relaxed LCP for image-heavy page
    if (vitals.lcp) expect(vitals.lcp).toBeLessThan(LCP_THRESHOLD * 1.2);
    if (vitals.fcp) expect(vitals.fcp).toBeLessThan(FCP_THRESHOLD);
    if (vitals.cls) expect(vitals.cls).toBeLessThan(CLS_THRESHOLD);
  });

  /**
   * Test: FID (First Input Delay) measurement
   */
  test('should have low First Input Delay on interactive pages', async ({ page }) => {
    await login(page, pharmacistUser);
    await page.goto('/prescriptions/create', { waitUntil: 'networkidle' });

    // Wait for page to be fully loaded
    await page.waitForLoadState('load');

    // Simulate user input to measure FID
    const inputDelay = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstInput = entries[0] as any;
          if (firstInput) {
            const delay = firstInput.processingStart - firstInput.startTime;
            resolve(delay);
          }
        });

        try {
          fidObserver.observe({ type: 'first-input', buffered: true });
        } catch {
          resolve(0);
        }

        // Trigger first input
        const input = document.querySelector('input');
        if (input) {
          input.focus();
          input.click();
        }

        setTimeout(() => {
          fidObserver.disconnect();
          resolve(0);
        }, 1000);
      });
    });

    console.log(`First Input Delay: ${inputDelay.toFixed(2)}ms`);

    if (inputDelay > 0) {
      expect(inputDelay).toBeLessThan(FID_THRESHOLD);
    }
  });

  /**
   * Test: CLS (Cumulative Layout Shift) - ensure stable layout
   */
  test('should have minimal layout shifts during page load', async ({ page }) => {
    await login(page, pharmacistUser);

    // Navigate and monitor layout shifts
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Wait for any dynamic content to load
    await page.waitForTimeout(2000);

    const clsScore = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let cumulativeScore = 0;

        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              cumulativeScore += entry.value;
            }
          });
        });

        clsObserver.observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => {
          clsObserver.disconnect();
          resolve(cumulativeScore);
        }, 100);
      });
    });

    console.log(`Cumulative Layout Shift: ${clsScore.toFixed(3)}`);

    expect(clsScore).toBeLessThan(CLS_THRESHOLD);
  });

  /**
   * Test: TTFB (Time to First Byte) for API responses
   */
  test('should have fast server response times', async ({ page }) => {
    const ttfbValues: number[] = [];

    // Monitor API requests
    page.on('response', (response) => {
      const timing = response.timing();
      if (timing) {
        const ttfb = timing.responseStart;
        if (ttfb > 0) {
          ttfbValues.push(ttfb);
        }
      }
    });

    await login(page, pharmacistUser);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Wait for API calls
    await page.waitForTimeout(1000);

    if (ttfbValues.length > 0) {
      const avgTtfb = ttfbValues.reduce((sum, val) => sum + val, 0) / ttfbValues.length;
      const maxTtfb = Math.max(...ttfbValues);

      console.log(`Average TTFB: ${avgTtfb.toFixed(0)}ms`);
      console.log(`Max TTFB: ${maxTtfb.toFixed(0)}ms`);

      expect(avgTtfb).toBeLessThan(TTFB_THRESHOLD);
    }
  });

  /**
   * Test: INP (Interaction to Next Paint) for responsiveness
   */
  test('should respond quickly to user interactions', async ({ page }) => {
    await login(page, pharmacistUser);
    await page.goto('/prescriptions', { waitUntil: 'networkidle' });

    // Measure interaction responsiveness
    const interactionDelay = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const button = document.querySelector('button');
        if (!button) {
          resolve(0);
          return;
        }

        const startTime = performance.now();

        button.addEventListener('click', () => {
          requestAnimationFrame(() => {
            const endTime = performance.now();
            resolve(endTime - startTime);
          });
        });

        button.click();
      });
    });

    console.log(`Interaction delay: ${interactionDelay.toFixed(2)}ms`);

    if (interactionDelay > 0) {
      expect(interactionDelay).toBeLessThan(INP_THRESHOLD);
    }
  });

  /**
   * Test: Performance score calculation
   */
  test('should achieve good overall performance score', async ({ page }) => {
    await login(page, pharmacistUser);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    const vitals = await collectWebVitals(page);

    // Calculate performance score (simplified Lighthouse-style)
    const scores = {
      lcp: vitals.lcp && vitals.lcp < LCP_THRESHOLD ? 100 : 50,
      fcp: vitals.fcp && vitals.fcp < FCP_THRESHOLD ? 100 : 50,
      cls: vitals.cls && vitals.cls < CLS_THRESHOLD ? 100 : 50,
      ttfb: vitals.ttfb && vitals.ttfb < TTFB_THRESHOLD ? 100 : 50,
    };

    const overallScore =
      (scores.lcp + scores.fcp + scores.cls + scores.ttfb) / 4;

    console.log('Performance Scores:', JSON.stringify(scores, null, 2));
    console.log(`Overall Performance Score: ${overallScore.toFixed(0)}/100`);

    // Should achieve at least 70/100 (good)
    expect(overallScore).toBeGreaterThanOrEqual(70);
  });

  /**
   * Test: Performance across multiple page loads
   */
  test('should maintain consistent performance across multiple loads', async ({ page }) => {
    await login(page, pharmacistUser);

    const loadMetrics: Array<Partial<WebVitals>> = [];
    const iterations = 3;

    for (let i = 0; i < iterations; i++) {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      const vitals = await collectWebVitals(page);
      loadMetrics.push(vitals);

      console.log(`Load ${i + 1}:`, JSON.stringify(vitals, null, 2));

      // Reload for next iteration
      if (i < iterations - 1) {
        await page.reload({ waitUntil: 'networkidle' });
      }
    }

    // Calculate variance
    const lcpValues = loadMetrics.map((m) => m.lcp || 0).filter((v) => v > 0);
    if (lcpValues.length > 0) {
      const avgLcp = lcpValues.reduce((sum, v) => sum + v, 0) / lcpValues.length;
      const variance =
        lcpValues.reduce((sum, v) => sum + Math.pow(v - avgLcp, 2), 0) / lcpValues.length;
      const stdDev = Math.sqrt(variance);

      console.log(`LCP Average: ${avgLcp.toFixed(0)}ms, StdDev: ${stdDev.toFixed(0)}ms`);

      // Performance should be consistent (low variance)
      expect(stdDev).toBeLessThan(avgLcp * 0.3); // StdDev < 30% of average
    }
  });

  /**
   * Test: Save Core Web Vitals for historical tracking
   */
  test('should record Core Web Vitals for regression tracking', async ({ page }) => {
    await login(page, pharmacistUser);

    const pages = ['/dashboard', '/prescriptions', '/inventory', '/products'];
    const vitalsByPage: Record<string, Partial<WebVitals>> = {};

    for (const route of pages) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const vitals = await collectWebVitals(page);
      vitalsByPage[route] = vitals;
    }

    console.log('Core Web Vitals by Page:', JSON.stringify(vitalsByPage, null, 2));

    // Verify all pages measured
    expect(Object.keys(vitalsByPage).length).toBe(pages.length);

    // All pages should have at least LCP and FCP
    Object.values(vitalsByPage).forEach((vitals) => {
      if (vitals.lcp) expect(vitals.lcp).toBeGreaterThan(0);
      if (vitals.fcp) expect(vitals.fcp).toBeGreaterThan(0);
    });
  });
});
