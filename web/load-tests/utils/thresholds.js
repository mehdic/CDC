/**
 * T8-051: Performance Thresholds Configuration
 *
 * Centralized threshold definitions for performance testing
 */

export const PERFORMANCE_THRESHOLDS = {
  // Page Load Metrics (ms)
  pageLoad: {
    p95: 200,
    p99: 500,
    average: 150,
  },

  // API Response Time (ms)
  apiResponseTime: {
    p95: 200,
    p99: 500,
    average: 150,
  },

  // Core Web Vitals
  coreWebVitals: {
    lcp: 2500, // Largest Contentful Paint (ms)
    fid: 100, // First Input Delay (ms)
    cls: 0.1, // Cumulative Layout Shift (score)
    fcp: 1800, // First Contentful Paint (ms)
    ttfb: 600, // Time to First Byte (ms)
    inp: 200, // Interaction to Next Paint (ms)
  },

  // Error Rates (%)
  errorRates: {
    http: 1, // Max 1% HTTP errors
    journey: 2, // Max 2% journey failures
  },

  // Throughput
  throughput: {
    minRequestsPerSecond: 100,
    targetRequestsPerSecond: 500,
  },

  // Resource Budgets
  resources: {
    maxTotalResources: 50,
    maxJsResources: 10,
    maxCssResources: 5,
    maxImageResources: 30,
    maxTransferSizeKb: 1000, // 1MB
    maxDecodedSizeKb: 2000, // 2MB
  },

  // Load Test Targets
  loadTargets: {
    baseline: 100,
    normal: 500,
    stress: 1000,
    spike: 1500,
  },

  // Duration Budgets (ms)
  durations: {
    dnsLookup: 50,
    tcpConnection: 100,
    tlsNegotiation: 200,
    serverResponse: 100,
    domProcessing: 500,
    domContentLoaded: 200,
    loadEvent: 100,
  },
};

/**
 * Get threshold for specific metric
 */
export function getThreshold(category, metric) {
  return PERFORMANCE_THRESHOLDS[category]?.[metric];
}

/**
 * Validate metric against threshold
 */
export function validateMetric(category, metric, value) {
  const threshold = getThreshold(category, metric);
  if (threshold === undefined) {
    return { valid: true, message: 'No threshold defined' };
  }

  const valid = value <= threshold;
  return {
    valid,
    message: valid
      ? `✓ ${metric}: ${value} ≤ ${threshold}`
      : `✗ ${metric}: ${value} > ${threshold} (exceeded by ${value - threshold})`,
    value,
    threshold,
    exceeded: valid ? 0 : value - threshold,
  };
}

/**
 * Validate multiple metrics
 */
export function validateMetrics(category, metrics) {
  const results = {};
  let allValid = true;

  for (const [metric, value] of Object.entries(metrics)) {
    const result = validateMetric(category, metric, value);
    results[metric] = result;
    if (!result.valid) {
      allValid = false;
    }
  }

  return {
    valid: allValid,
    results,
  };
}

/**
 * Generate k6 threshold configuration
 */
export function generateK6Thresholds() {
  return {
    http_req_duration: [
      `p(95)<${PERFORMANCE_THRESHOLDS.apiResponseTime.p95}`,
      `p(99)<${PERFORMANCE_THRESHOLDS.apiResponseTime.p99}`,
      `avg<${PERFORMANCE_THRESHOLDS.apiResponseTime.average}`,
    ],
    errors: [`rate<${PERFORMANCE_THRESHOLDS.errorRates.http / 100}`],
    http_reqs: [`rate>${PERFORMANCE_THRESHOLDS.throughput.minRequestsPerSecond}`],
    http_req_failed: [`rate<${PERFORMANCE_THRESHOLDS.errorRates.http / 100}`],
  };
}

export default PERFORMANCE_THRESHOLDS;
