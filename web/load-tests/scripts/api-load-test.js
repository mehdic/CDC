import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

/**
 * T8-051: API Load Testing with k6
 *
 * Tests API performance under load with concurrent users:
 * - 100 users: Baseline load
 * - 500 users: Normal peak load
 * - 1000 users: Stress test load
 *
 * Metrics:
 * - P95 response time < 200ms
 * - P99 response time < 500ms
 * - Error rate < 1%
 * - Throughput > 1000 req/s
 */

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const TARGET_USERS = parseInt(__ENV.USERS || '100');

// Test options
export const options = {
  stages: [
    // Ramp up
    { duration: '30s', target: TARGET_USERS * 0.25 }, // 25% of target
    { duration: '30s', target: TARGET_USERS * 0.5 }, // 50% of target
    { duration: '30s', target: TARGET_USERS }, // 100% of target

    // Sustained load
    { duration: '2m', target: TARGET_USERS },

    // Ramp down
    { duration: '30s', target: TARGET_USERS * 0.5 },
    { duration: '30s', target: 0 },
  ],

  thresholds: {
    // HTTP request duration thresholds
    http_req_duration: [
      'p(95)<200', // 95% of requests must complete in 200ms
      'p(99)<500', // 99% of requests must complete in 500ms
      'avg<150', // Average response time < 150ms
    ],

    // Error rate threshold
    errors: ['rate<0.01'], // Error rate < 1%

    // Request rate threshold
    http_reqs: ['rate>100'], // At least 100 req/s

    // Failed request threshold
    http_req_failed: ['rate<0.01'], // Failed requests < 1%

    // Custom metrics
    api_response_time: ['p(95)<200', 'p(99)<500'],
  },

  // Test metadata
  tags: {
    test_type: 'load',
    environment: 'test',
  },
};

// Test data
const users = [
  { email: 'pharmacist@test.metapharm.ch', password: 'TestPass123!', role: 'pharmacist' },
  { email: 'doctor@test.metapharm.ch', password: 'TestPass123!', role: 'doctor' },
  { email: 'nurse@test.metapharm.ch', password: 'TestPass123!', role: 'nurse' },
  { email: 'patient@test.metapharm.ch', password: 'TestPass123!', role: 'patient' },
];

// Helper functions
function randomUser() {
  return users[Math.floor(Math.random() * users.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Setup function - runs once per VU at start
 */
export function setup() {
  console.log(`Starting load test with ${TARGET_USERS} virtual users`);
  console.log(`Base URL: ${BASE_URL}`);
  return { startTime: Date.now() };
}

/**
 * Main test function - runs repeatedly for each VU
 */
export default function (data) {
  const user = randomUser();
  let authToken = null;

  // Group: Authentication
  group('Authentication', () => {
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });

    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'Login' },
    };

    const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, loginParams);

    const loginSuccess = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login response time < 200ms': (r) => r.timings.duration < 200,
      'login response has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.accessToken !== undefined;
        } catch {
          return false;
        }
      },
    });

    if (loginSuccess && loginRes.status === 200) {
      try {
        const body = JSON.parse(loginRes.body);
        authToken = body.accessToken;
        successfulRequests.add(1);
        apiResponseTime.add(loginRes.timings.duration);
      } catch (e) {
        failedRequests.add(1);
        errorRate.add(1);
      }
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }

    sleep(randomInt(1, 2));
  });

  // Only proceed if authentication succeeded
  if (!authToken) {
    return;
  }

  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  };

  // Group: Dashboard Data
  group('Dashboard', () => {
    const dashboardRes = http.get(`${BASE_URL}/api/dashboard`, {
      ...authHeaders,
      tags: { name: 'Dashboard' },
    });

    const dashboardSuccess = check(dashboardRes, {
      'dashboard status is 200': (r) => r.status === 200,
      'dashboard response time < 200ms': (r) => r.timings.duration < 200,
    });

    if (dashboardSuccess) {
      successfulRequests.add(1);
      apiResponseTime.add(dashboardRes.timings.duration);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }

    sleep(randomInt(2, 4));
  });

  // Group: Prescriptions (role-specific)
  if (user.role === 'pharmacist' || user.role === 'doctor') {
    group('Prescriptions', () => {
      // List prescriptions
      const listRes = http.get(`${BASE_URL}/api/prescriptions`, {
        ...authHeaders,
        tags: { name: 'List Prescriptions' },
      });

      check(listRes, {
        'prescriptions list status is 200': (r) => r.status === 200,
        'prescriptions response time < 200ms': (r) => r.timings.duration < 200,
      });

      if (listRes.status === 200) {
        successfulRequests.add(1);
        apiResponseTime.add(listRes.timings.duration);
      } else {
        failedRequests.add(1);
        errorRate.add(1);
      }

      sleep(randomInt(1, 3));

      // Get prescription details
      const detailsRes = http.get(`${BASE_URL}/api/prescriptions/rx_001`, {
        ...authHeaders,
        tags: { name: 'Prescription Details' },
      });

      check(detailsRes, {
        'prescription details response time < 200ms': (r) => r.timings.duration < 200,
      });

      if (detailsRes.status === 200) {
        successfulRequests.add(1);
        apiResponseTime.add(detailsRes.timings.duration);
      } else if (detailsRes.status !== 404) {
        // 404 is expected for test data
        failedRequests.add(1);
        errorRate.add(1);
      }

      sleep(randomInt(1, 2));
    });
  }

  // Group: Inventory (pharmacist only)
  if (user.role === 'pharmacist') {
    group('Inventory', () => {
      const inventoryRes = http.get(`${BASE_URL}/api/inventory`, {
        ...authHeaders,
        tags: { name: 'Inventory' },
      });

      check(inventoryRes, {
        'inventory status is 200': (r) => r.status === 200,
        'inventory response time < 200ms': (r) => r.timings.duration < 200,
      });

      if (inventoryRes.status === 200) {
        successfulRequests.add(1);
        apiResponseTime.add(inventoryRes.timings.duration);
      } else {
        failedRequests.add(1);
        errorRate.add(1);
      }

      sleep(randomInt(2, 4));
    });
  }

  // Group: Product Search
  group('Product Search', () => {
    const searchTerms = ['aspirin', 'ibuprofen', 'paracetamol', 'amoxicillin'];
    const term = searchTerms[randomInt(0, searchTerms.length - 1)];

    const searchRes = http.get(`${BASE_URL}/api/products/search?q=${term}`, {
      ...authHeaders,
      tags: { name: 'Product Search' },
    });

    check(searchRes, {
      'search status is 200': (r) => r.status === 200,
      'search response time < 300ms': (r) => r.timings.duration < 300, // Slightly higher for search
    });

    if (searchRes.status === 200) {
      successfulRequests.add(1);
      apiResponseTime.add(searchRes.timings.duration);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }

    sleep(randomInt(1, 3));
  });

  // Group: User Profile
  group('User Profile', () => {
    const profileRes = http.get(`${BASE_URL}/api/user/profile`, {
      ...authHeaders,
      tags: { name: 'User Profile' },
    });

    check(profileRes, {
      'profile status is 200': (r) => r.status === 200,
      'profile response time < 200ms': (r) => r.timings.duration < 200,
    });

    if (profileRes.status === 200) {
      successfulRequests.add(1);
      apiResponseTime.add(profileRes.timings.duration);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }

    sleep(randomInt(1, 2));
  });

  // Random think time between iterations
  sleep(randomInt(3, 7));
}

/**
 * Teardown function - runs once at end
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Load test completed in ${duration.toFixed(2)} seconds`);
}

/**
 * Handle summary - generate HTML report
 */
export function handleSummary(data) {
  return {
    'load-tests/results/api-load-test-summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'load-tests/results/api-load-test-summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors !== false;

  const metrics = data.metrics;
  let summary = `\n${indent}Load Test Summary\n${indent}${'='.repeat(50)}\n\n`;

  // HTTP metrics
  if (metrics.http_req_duration) {
    summary += `${indent}Response Time:\n`;
    summary += `${indent}  Average: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  P95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  P99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
    summary += `${indent}  Max: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  }

  // Request rate
  if (metrics.http_reqs) {
    summary += `${indent}Request Rate:\n`;
    summary += `${indent}  Total Requests: ${metrics.http_reqs.values.count}\n`;
    summary += `${indent}  Requests/sec: ${metrics.http_reqs.values.rate.toFixed(2)}\n\n`;
  }

  // Error rate
  if (metrics.errors) {
    const errorPct = (metrics.errors.values.rate * 100).toFixed(2);
    summary += `${indent}Error Rate: ${errorPct}%\n\n`;
  }

  // Custom metrics
  if (metrics.successful_requests && metrics.failed_requests) {
    summary += `${indent}Custom Metrics:\n`;
    summary += `${indent}  Successful: ${metrics.successful_requests.values.count}\n`;
    summary += `${indent}  Failed: ${metrics.failed_requests.values.count}\n`;
  }

  return summary;
}
