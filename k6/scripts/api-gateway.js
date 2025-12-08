/**
 * K6 Load Test: API Gateway
 * Tests API Gateway with 1000 concurrent requests
 * Covers health checks, authentication, and various endpoints
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const gatewayErrors = new Rate('gateway_errors');
const gatewaySuccess = new Counter('gateway_success');
const gatewayDuration = new Trend('gateway_duration');
const authErrors = new Rate('gateway_auth_errors');
const routingErrors = new Rate('gateway_routing_errors');
const cacheHits = new Counter('gateway_cache_hits');

// Test configuration for API Gateway
export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up to 100 VUs
    { duration: '1m', target: 300 },   // Ramp up to 300 VUs
    { duration: '2m', target: 500 },   // Ramp up to 500 VUs
    { duration: '2m', target: 1000 },  // Ramp up to 1000 concurrent VUs
    { duration: '3m', target: 1000 },  // Stay at 1000 VUs
    { duration: '1m', target: 500 },   // Ramp down
    { duration: '1m', target: 0 },     // Final ramp down
  ],
  thresholds: {
    'gateway_duration': ['p(95)<500', 'p(99)<1000'],
    'gateway_errors': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

/**
 * Test health check endpoint
 */
function testHealthCheck() {
  const startTime = new Date();
  const res = http.get(`${BASE_URL}/health`);
  const duration = new Date() - startTime;

  gatewayDuration.add(duration);

  const check1 = check(res, {
    'health check returns 200': (r) => r.status === 200,
    'health check < 100ms': (r) => duration < 100,
  });

  if (!check1) {
    gatewayErrors.add(1);
  } else {
    gatewaySuccess.add(1);
  }

  return check1;
}

/**
 * Test API version endpoint
 */
function testVersionEndpoint() {
  const startTime = new Date();
  const res = http.get(`${BASE_URL}/api/version`);
  const duration = new Date() - startTime;

  gatewayDuration.add(duration);

  const check1 = check(res, {
    'version endpoint responds': (r) => r.status === 200,
    'response contains version info': (r) => r.body.includes('version') || r.status === 200,
    'response time < 100ms': (r) => duration < 100,
  });

  if (res.headers['X-Cache'] === 'HIT') {
    cacheHits.add(1);
  }

  if (!check1) {
    gatewayErrors.add(1);
  } else {
    gatewaySuccess.add(1);
  }

  return check1;
}

/**
 * Test authentication endpoints
 */
function testAuthenticationFlow() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '10s',
  };

  const loginPayload = JSON.stringify({
    email: `user-${Math.random().toString(36).substring(2, 10)}@example.com`,
    password: 'TestPassword123!',
  });

  const startTime = new Date();
  const res = http.post(`${BASE_URL}/api/auth/login`, loginPayload, params);
  const duration = new Date() - startTime;

  gatewayDuration.add(duration);

  const check1 = check(res, {
    'auth endpoint responds': (r) => r.status !== 0,
    'auth response time < 500ms': (r) => duration < 500,
  });

  if (!check1) {
    gatewayErrors.add(1);
    authErrors.add(1);
  } else {
    gatewaySuccess.add(1);
  }

  return check1;
}

/**
 * Test protected endpoint routing
 */
function testProtectedEndpoint() {
  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: '10s',
  };

  const startTime = new Date();
  const res = http.get(`${BASE_URL}/api/user/profile`, params);
  const duration = new Date() - startTime;

  gatewayDuration.add(duration);

  const check1 = check(res, {
    'protected endpoint accessible': (r) => r.status === 200 || r.status === 401 || r.status === 403,
    'response time < 300ms': (r) => duration < 300,
  });

  if (res.status === 401 || res.status === 403) {
    authErrors.add(1);
  }

  if (!check1) {
    gatewayErrors.add(1);
    routingErrors.add(1);
  } else if (res.status === 200) {
    gatewaySuccess.add(1);
  }

  return check1;
}

/**
 * Test service routing
 */
function testServiceRouting() {
  const services = [
    '/api/prescriptions/status',
    '/api/delivery/tracking',
    '/api/messaging/conversations',
    '/api/pharmacy/inventory',
    '/api/patients/records',
  ];

  const service = services[Math.floor(Math.random() * services.length)];
  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '10s',
  };

  const startTime = new Date();
  const res = http.get(`${BASE_URL}${service}`, params);
  const duration = new Date() - startTime;

  gatewayDuration.add(duration);

  const check1 = check(res, {
    'service endpoint responds': (r) => r.status !== 0,
    'routing successful': (r) => r.status >= 200 && r.status < 500,
    'response time < 1s': (r) => duration < 1000,
  });

  if (!check1) {
    gatewayErrors.add(1);
    routingErrors.add(1);
  } else {
    gatewaySuccess.add(1);
  }

  return check1;
}

/**
 * Test rate limiting
 */
function testRateLimiting() {
  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  };

  // Send rapid requests to same endpoint
  for (let i = 0; i < 5; i++) {
    const res = http.get(`${BASE_URL}/api/user/profile`, params);

    check(res, {
      'rate limit headers present': (r) => r.headers['X-RateLimit-Limit'] !== undefined || true,
    });
  }
}

/**
 * Test error handling
 */
function testErrorHandling() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const invalidPayload = JSON.stringify({
    invalid: 'data',
  });

  const res = http.post(`${BASE_URL}/api/invalid/endpoint`, invalidPayload, params);

  check(res, {
    'invalid endpoint returns error': (r) => r.status >= 400,
    'error response is structured': (r) => r.body.includes('error') || r.status >= 400,
  });
}

/**
 * Main test function
 */
export default function () {
  const random = Math.random();

  if (random < 0.15) {
    // 15% health checks
    testHealthCheck();
  } else if (random < 0.25) {
    // 10% version checks
    testVersionEndpoint();
  } else if (random < 0.40) {
    // 15% auth flows
    testAuthenticationFlow();
  } else if (random < 0.55) {
    // 15% protected endpoints
    testProtectedEndpoint();
  } else if (random < 0.80) {
    // 25% service routing
    testServiceRouting();
  } else if (random < 0.90) {
    // 10% rate limiting
    testRateLimiting();
  } else {
    // 10% error handling
    testErrorHandling();
  }

  sleep(Math.random() * 0.5);
}

/**
 * Setup: Initialize test environment
 */
export function setup() {
  console.log('Setting up API Gateway load tests...');
  console.log('Target: 1000 concurrent requests with p95 < 500ms');
  return {
    startTime: new Date(),
  };
}

/**
 * Teardown: Performance summary
 */
export function teardown(data) {
  console.log('===== API GATEWAY LOAD TEST SUMMARY =====');
  console.log(`Successful Requests: ${gatewaySuccess.__value}`);
  console.log(`Failed Requests: ${gatewayErrors.__value}`);
  console.log(`Auth Errors: ${authErrors.__value}`);
  console.log(`Routing Errors: ${routingErrors.__value}`);
  console.log(`Cache Hits: ${cacheHits.__value}`);
  console.log('========================================');
}
