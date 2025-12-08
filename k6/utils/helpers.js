/**
 * K6 Load Testing Helper Functions
 * Common utilities for load test scripts
 */

import { Rate, Counter, Trend } from 'k6/metrics';

/**
 * Create standard metrics for a load test scenario
 * @param {string} name - Name of the test scenario
 * @returns {Object} Object containing custom metrics
 */
export function createMetrics(name) {
  return {
    errorRate: new Rate(`${name}_errors`),
    successCount: new Counter(`${name}_success`),
    failureCount: new Counter(`${name}_failure`),
    duration: new Trend(`${name}_duration`),
  };
}

/**
 * Standard check helper that records metrics
 * @param {Object} response - HTTP response object
 * @param {Object} checks - Check conditions object
 * @param {Object} metrics - Metrics object
 * @returns {boolean} true if checks pass, false otherwise
 */
export function checkResponse(response, checks, metrics) {
  let passed = true;
  for (const [name, condition] of Object.entries(checks)) {
    if (!condition(response)) {
      passed = false;
      break;
    }
  }

  if (passed) {
    metrics.successCount.add(1);
  } else {
    metrics.failureCount.add(1);
    metrics.errorRate.add(1);
  }

  return passed;
}

/**
 * Generate random email for load testing
 * @returns {string} Random email address
 */
export function generateRandomEmail() {
  const randomId = Math.random().toString(36).substring(2, 15);
  return `loadtest-${randomId}@example.com`;
}

/**
 * Generate random prescription ID
 * @returns {string} Random prescription ID
 */
export function generateRandomPrescriptionId() {
  return `RX-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
}

/**
 * Generate random patient ID
 * @returns {string} Random patient ID
 */
export function generateRandomPatientId() {
  return `PAT-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
}

/**
 * Generate random delivery ID
 * @returns {string} Random delivery ID
 */
export function generateRandomDeliveryId() {
  return `DEL-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
}

/**
 * Standard threshold configuration for load tests
 */
export const standardThresholds = {
  http_req_duration: ['p(95)<5000', 'p(99)<10000'],
  http_req_failed: ['rate<0.05'],
  'http_reqs': ['rate>100'],
};

/**
 * Generate authorization header with JWT token
 * @param {string} token - JWT token
 * @returns {Object} Headers object with authorization
 */
export function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Generate standard request parameters
 * @param {Object} headers - Additional headers
 * @returns {Object} Parameters object for HTTP requests
 */
export function getRequestParams(headers = {}) {
  return {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-test/1.0',
      ...headers,
    },
    timeout: '30s',
  };
}

/**
 * Calculate statistics for load test results
 * @param {Array} values - Array of numeric values
 * @returns {Object} Statistics object
 */
export function calculateStats(values) {
  if (!values || values.length === 0) {
    return { min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);

  return {
    min,
    max,
    avg,
    p95: sorted[p95Index],
    p99: sorted[p99Index],
  };
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Sleep with jitter to avoid thundering herd
 * @param {number} baseSeconds - Base sleep duration in seconds
 * @param {number} jitterPercent - Jitter percentage (default 20%)
 * @returns {void}
 */
export function sleepWithJitter(baseSeconds, jitterPercent = 20) {
  const jitter = (baseSeconds * jitterPercent) / 100;
  const randomJitter = (Math.random() - 0.5) * 2 * jitter;
  const sleep = Math.max(0.1, baseSeconds + randomJitter);
  // sleep(sleep); // Note: uncomment in actual k6 context
  return sleep;
}
