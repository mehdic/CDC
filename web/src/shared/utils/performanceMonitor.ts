/**
 * Performance Monitoring Utility
 *
 * Tracks and reports performance metrics for MetaPharm Connect
 *
 * Features:
 * - Page load metrics (FCP, LCP, FID, CLS)
 * - API call performance
 * - Resource timing
 * - Memory usage
 * - Custom metrics
 */

import { useState, useEffect } from 'react';

export interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte

  // Navigation timing
  domContentLoaded?: number;
  pageLoad?: number;

  // Resource counts
  jsSize?: number;
  cssSize?: number;
  imageSize?: number;
  totalSize?: number;

  // Memory (if available)
  jsHeapSize?: number;
  jsHeapSizeLimit?: number;

  // Custom
  customMetrics?: Record<string, number>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  /**
   * Initialize performance monitoring
   */
  private init() {
    // Monitor Core Web Vitals
    this.observeWebVitals();

    // Monitor navigation timing
    this.observeNavigationTiming();

    // Monitor resource loading
    this.observeResourceTiming();

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.report();
    });
  }

  /**
   * Observe Core Web Vitals (FCP, LCP, FID, CLS)
   */
  private observeWebVitals() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              console.log('[Performance] FCP:', this.metrics.fcp.toFixed(2), 'ms');
            }
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
        this.observers.set('fcp', fcpObserver);
      } catch (e) {
        console.warn('[Performance] FCP observer not supported');
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1] as any;
            this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
            if (this.metrics.lcp) {
              console.log('[Performance] LCP:', this.metrics.lcp.toFixed(2), 'ms');
            }
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('[Performance] LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.fid = (entry as any).processingStart - entry.startTime;
            console.log('[Performance] FID:', this.metrics.fid.toFixed(2), 'ms');
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('[Performance] FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              this.metrics.cls = clsValue;
            }
          }
          console.log('[Performance] CLS:', this.metrics.cls?.toFixed(4));
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('[Performance] CLS observer not supported');
      }
    }
  }

  /**
   * Observe navigation timing
   */
  private observeNavigationTiming() {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as any;

      if (perfData) {
        this.metrics.ttfb = perfData.responseStart - perfData.requestStart;
        this.metrics.domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
        this.metrics.pageLoad = perfData.loadEventEnd - perfData.loadEventStart;

        console.log('[Performance] TTFB:', this.metrics.ttfb.toFixed(2), 'ms');
        console.log('[Performance] DOM Content Loaded:', this.metrics.domContentLoaded.toFixed(2), 'ms');
        console.log('[Performance] Page Load:', this.metrics.pageLoad.toFixed(2), 'ms');
      }
    });
  }

  /**
   * Observe resource loading
   */
  private observeResourceTiming() {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource') as any[];

      let jsSize = 0;
      let cssSize = 0;
      let imageSize = 0;

      resources.forEach((resource) => {
        const size = resource.transferSize || 0;

        if (resource.initiatorType === 'script') {
          jsSize += size;
        } else if (resource.initiatorType === 'link' && resource.name.includes('.css')) {
          cssSize += size;
        } else if (resource.initiatorType === 'img' || resource.initiatorType === 'image') {
          imageSize += size;
        }
      });

      this.metrics.jsSize = jsSize;
      this.metrics.cssSize = cssSize;
      this.metrics.imageSize = imageSize;
      this.metrics.totalSize = jsSize + cssSize + imageSize;

      console.log('[Performance] JS Size:', (jsSize / 1024).toFixed(2), 'KB');
      console.log('[Performance] CSS Size:', (cssSize / 1024).toFixed(2), 'KB');
      console.log('[Performance] Image Size:', (imageSize / 1024).toFixed(2), 'KB');
      console.log('[Performance] Total Size:', (this.metrics.totalSize / 1024).toFixed(2), 'KB');
    });
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.jsHeapSize = memory.usedJSHeapSize;
      this.metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;

      console.log('[Performance] Memory:', (memory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
    }
  }

  /**
   * Track custom metric
   */
  public trackMetric(name: string, value: number): void {
    if (!this.metrics.customMetrics) {
      this.metrics.customMetrics = {};
    }
    this.metrics.customMetrics[name] = value;
    console.log(`[Performance] Custom: ${name}:`, value.toFixed(2), 'ms');
  }

  /**
   * Mark a custom timing point
   */
  public mark(name: string): void {
    performance.mark(name);
  }

  /**
   * Measure time between two marks
   */
  public measure(name: string, startMark: string, endMark: string): number {
    performance.measure(name, startMark, endMark);
    const entries = performance.getEntriesByName(name);
    const duration = entries[entries.length - 1]?.duration || 0;
    this.trackMetric(name, duration);
    return duration;
  }

  /**
   * Get all metrics
   */
  public getMetrics(): PerformanceMetrics {
    this.getMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * Report metrics (send to analytics/monitoring service)
   */
  public report(): void {
    const metrics = this.getMetrics();

    // In production, send to monitoring service (e.g., CloudWatch, DataDog, New Relic)
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to custom analytics endpoint
      // fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     metrics,
      //     userAgent: navigator.userAgent,
      //     url: window.location.href,
      //     timestamp: new Date().toISOString(),
      //   }),
      // }).catch(console.error);

      console.log('[Performance] Metrics Report:', metrics);
    } else {
      console.log('[Performance] Development Metrics:', metrics);
    }
  }

  /**
   * Get performance grade
   */
  public getGrade(): { grade: string; score: number; issues: string[] } {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    let score = 100;

    // Check FCP (should be < 1.8s)
    if (metrics.fcp && metrics.fcp > 1800) {
      score -= 15;
      issues.push(`FCP too slow: ${(metrics.fcp / 1000).toFixed(2)}s (target: <1.8s)`);
    }

    // Check LCP (should be < 2.5s)
    if (metrics.lcp && metrics.lcp > 2500) {
      score -= 20;
      issues.push(`LCP too slow: ${(metrics.lcp / 1000).toFixed(2)}s (target: <2.5s)`);
    }

    // Check FID (should be < 100ms)
    if (metrics.fid && metrics.fid > 100) {
      score -= 15;
      issues.push(`FID too high: ${metrics.fid.toFixed(0)}ms (target: <100ms)`);
    }

    // Check CLS (should be < 0.1)
    if (metrics.cls && metrics.cls > 0.1) {
      score -= 15;
      issues.push(`CLS too high: ${metrics.cls.toFixed(4)} (target: <0.1)`);
    }

    // Check TTFB (should be < 600ms)
    if (metrics.ttfb && metrics.ttfb > 600) {
      score -= 10;
      issues.push(`TTFB too slow: ${metrics.ttfb.toFixed(0)}ms (target: <600ms)`);
    }

    // Check total page size (should be < 2MB)
    if (metrics.totalSize && metrics.totalSize > 2 * 1024 * 1024) {
      score -= 10;
      issues.push(`Page size too large: ${(metrics.totalSize / 1024 / 1024).toFixed(2)}MB (target: <2MB)`);
    }

    // Determine grade
    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    return { grade, score, issues };
  }

  /**
   * Cleanup observers
   */
  public cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [grade, setGrade] = useState({ grade: 'N/A', score: 0, issues: [] as string[] });

  useEffect(() => {
    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
      setGrade(performanceMonitor.getGrade());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { metrics, grade };
}

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
}
