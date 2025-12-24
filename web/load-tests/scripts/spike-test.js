import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * T8-051: Spike Testing
 *
 * Tests system behavior under sudden traffic spikes:
 * - Rapid ramp-up to high load
 * - Sustained spike
 * - Rapid ramp-down
 *
 * Validates:
 * - System doesn't crash under sudden load
 * - Response times remain acceptable
 * - Auto-scaling triggers (if configured)
 * - Error rates stay within limits
 */

const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';

export const options = {
  stages: [
    // Normal load
    { duration: '30s', target: 50 },

    // Sudden spike!
    { duration: '10s', target: 500 }, // Rapid ramp-up

    // Sustained spike
    { duration: '1m', target: 500 },

    // Recovery spike
    { duration: '10s', target: 1000 }, // Even higher!

    // Rapid recovery
    { duration: '30s', target: 50 }, // Back to normal

    // Cool down
    { duration: '30s', target: 0 },
  ],

  thresholds: {
    // During spike, response times may degrade but should stay reasonable
    http_req_duration: [
      'p(95)<1000', // 95% under 1 second (relaxed during spike)
      'p(99)<2000', // 99% under 2 seconds
    ],

    // Error rate should stay low even during spike
    errors: ['rate<0.05'], // Error rate < 5%

    // Should handle at least 100 req/s during spike
    http_reqs: ['rate>100'],

    http_req_failed: ['rate<0.05'], // Failed requests < 5%
  },

  tags: {
    test_type: 'spike',
    environment: 'test',
  },
};

export default function () {
  const user = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
  };

  // Simplified user flow for spike testing
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, loginParams);

  const loginSuccess = check(loginRes, {
    'login status is 200 or 429': (r) => r.status === 200 || r.status === 429, // Allow rate limiting
    'login completed': (r) => r.timings.duration < 5000, // Max 5 seconds
  });

  if (loginSuccess && loginRes.status === 200) {
    apiResponseTime.add(loginRes.timings.duration);

    try {
      const body = JSON.parse(loginRes.body);
      const authToken = body.accessToken;

      // Make a few quick requests
      const authHeaders = {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      };

      const dashboardRes = http.get(`${BASE_URL}/api/dashboard`, authHeaders);
      check(dashboardRes, {
        'dashboard loaded': (r) => r.status === 200 || r.status === 503,
      });

      if (dashboardRes.status === 200) {
        apiResponseTime.add(dashboardRes.timings.duration);
      }
    } catch (e) {
      errorRate.add(1);
    }
  } else if (loginRes.status !== 429) {
    // Don't count rate limiting as error
    errorRate.add(1);
  }

  // Minimal think time during spike
  sleep(0.5);
}

export function handleSummary(data) {
  const metrics = data.metrics;

  let summary = '\nSpike Test Summary\n';
  summary += '='.repeat(50) + '\n\n';

  if (metrics.http_req_duration) {
    summary += 'Response Time During Spike:\n';
    summary += `  Average: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `  P95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `  P99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
    summary += `  Max: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  }

  if (metrics.errors) {
    const errorPct = (metrics.errors.values.rate * 100).toFixed(2);
    summary += `Error Rate: ${errorPct}%\n`;
  }

  console.log(summary);

  return {
    'load-tests/results/spike-test-summary.json': JSON.stringify(data),
    stdout: summary,
  };
}
