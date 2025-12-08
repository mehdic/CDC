/**
 * K6 Load Test: Database Query Performance
 * Tests complex database queries under load
 * Monitors query execution time, connection pooling, and slow queries
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const queryErrors = new Rate('db_query_errors');
const querySuccess = new Counter('db_query_success');
const queryDuration = new Trend('db_query_duration');
const slowQueries = new Counter('db_slow_queries');
const connectionErrors = new Rate('db_connection_errors');
const lockTimeouts = new Counter('db_lock_timeouts');

// Test configuration for database queries
export const options = {
  stages: [
    { duration: '30s', target: 25 },   // Ramp up to 25 VUs
    { duration: '1m', target: 50 },    // Ramp up to 50 VUs
    { duration: '2m', target: 100 },   // Ramp up to 100 VUs
    { duration: '3m', target: 100 },   // Stay at 100 VUs
    { duration: '1m', target: 50 },    // Ramp down
    { duration: '30s', target: 0 },    // Final ramp down
  ],
  thresholds: {
    'db_query_duration': ['p(95)<1000', 'p(99)<3000'],
    'db_query_errors': ['rate<0.05'],
    'db_slow_queries': ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

/**
 * Test simple SELECT query (e.g., get patient by ID)
 */
function testSimpleQuery() {
  const patientId = Math.floor(Math.random() * 10000) + 1;
  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '10s',
  };

  const startTime = new Date();
  const res = http.get(`${BASE_URL}/api/query/simple?id=${patientId}`, params);
  const duration = new Date() - startTime;

  queryDuration.add(duration);

  const check1 = check(res, {
    'simple query successful': (r) => r.status === 200,
    'simple query < 100ms': (r) => duration < 100,
  });

  if (duration > 100) {
    slowQueries.add(1);
  }

  if (!check1) {
    queryErrors.add(1);
  } else {
    querySuccess.add(1);
  }

  return check1;
}

/**
 * Test JOIN query (e.g., get patient with prescriptions)
 */
function testJoinQuery() {
  const patientId = Math.floor(Math.random() * 10000) + 1;
  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '10s',
  };

  const startTime = new Date();
  const res = http.get(
    `${BASE_URL}/api/query/join?patientId=${patientId}`,
    params
  );
  const duration = new Date() - startTime;

  queryDuration.add(duration);

  const check1 = check(res, {
    'join query successful': (r) => r.status === 200,
    'join query < 500ms': (r) => duration < 500,
  });

  if (duration > 500) {
    slowQueries.add(1);
  }

  if (!check1) {
    queryErrors.add(1);
  } else {
    querySuccess.add(1);
  }

  return check1;
}

/**
 * Test aggregation query (e.g., prescription statistics)
 */
function testAggregationQuery() {
  const pharmacyId = Math.floor(Math.random() * 100) + 1;
  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '15s',
  };

  const startTime = new Date();
  const res = http.get(
    `${BASE_URL}/api/query/aggregation?pharmacyId=${pharmacyId}`,
    params
  );
  const duration = new Date() - startTime;

  queryDuration.add(duration);

  const check1 = check(res, {
    'aggregation query successful': (r) => r.status === 200,
    'aggregation query < 2000ms': (r) => duration < 2000,
  });

  if (duration > 2000) {
    slowQueries.add(1);
  }

  if (!check1) {
    queryErrors.add(1);
  } else {
    querySuccess.add(1);
  }

  return check1;
}

/**
 * Test full text search query
 */
function testFullTextSearch() {
  const searchTerms = [
    'aspirin',
    'ibuprofen',
    'vitamin',
    'antibiotic',
    'pain relief',
  ];
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '15s',
  };

  const startTime = new Date();
  const res = http.get(
    `${BASE_URL}/api/query/search?q=${encodeURIComponent(searchTerm)}`,
    params
  );
  const duration = new Date() - startTime;

  queryDuration.add(duration);

  const check1 = check(res, {
    'search query successful': (r) => r.status === 200,
    'search query < 1000ms': (r) => duration < 1000,
  });

  if (duration > 1000) {
    slowQueries.add(1);
  }

  if (!check1) {
    queryErrors.add(1);
  } else {
    querySuccess.add(1);
  }

  return check1;
}

/**
 * Test time-series query (e.g., delivery tracking history)
 */
function testTimeSeriesQuery() {
  const deliveryId = `DEL-${Math.random().toString(36).substring(2, 10)}`;
  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '15s',
  };

  const startTime = new Date();
  const res = http.get(
    `${BASE_URL}/api/query/timeseries?deliveryId=${deliveryId}&limit=1000`,
    params
  );
  const duration = new Date() - startTime;

  queryDuration.add(duration);

  const check1 = check(res, {
    'time-series query successful': (r) => r.status === 200,
    'time-series query < 2000ms': (r) => duration < 2000,
  });

  if (duration > 2000) {
    slowQueries.add(1);
  }

  if (!check1) {
    queryErrors.add(1);
  } else {
    querySuccess.add(1);
  }

  return check1;
}

/**
 * Test transaction query
 */
function testTransactionQuery() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '15s',
  };

  const payload = JSON.stringify({
    patientId: Math.floor(Math.random() * 10000) + 1,
    prescriptionId: `RX-${Math.random().toString(36).substring(2, 10)}`,
  });

  const startTime = new Date();
  const res = http.post(
    `${BASE_URL}/api/query/transaction`,
    payload,
    params
  );
  const duration = new Date() - startTime;

  queryDuration.add(duration);

  const check1 = check(res, {
    'transaction successful': (r) => r.status === 200 || r.status === 201,
    'transaction < 1000ms': (r) => duration < 1000,
  });

  if (duration > 1000) {
    slowQueries.add(1);
  }

  if (!check1) {
    queryErrors.add(1);
    connectionErrors.add(1);
  } else {
    querySuccess.add(1);
  }

  return check1;
}

/**
 * Test concurrent write query (insert/update)
 */
function testConcurrentWrite() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '10s',
  };

  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    value: Math.random() * 100,
  });

  const startTime = new Date();
  const res = http.post(
    `${BASE_URL}/api/query/write`,
    payload,
    params
  );
  const duration = new Date() - startTime;

  queryDuration.add(duration);

  const check1 = check(res, {
    'write successful': (r) => r.status === 200 || r.status === 201,
    'write < 500ms': (r) => duration < 500,
  });

  if (duration > 500) {
    slowQueries.add(1);
  }

  if (!check1) {
    queryErrors.add(1);
  } else {
    querySuccess.add(1);
  }

  return check1;
}

/**
 * Main test function - distributed query execution
 */
export default function () {
  const random = Math.random();

  if (random < 0.2) {
    // 20% simple queries
    testSimpleQuery();
  } else if (random < 0.4) {
    // 20% join queries
    testJoinQuery();
  } else if (random < 0.55) {
    // 15% aggregation queries
    testAggregationQuery();
  } else if (random < 0.70) {
    // 15% full-text search
    testFullTextSearch();
  } else if (random < 0.82) {
    // 12% time-series queries
    testTimeSeriesQuery();
  } else if (random < 0.91) {
    // 9% transactions
    testTransactionQuery();
  } else {
    // 9% concurrent writes
    testConcurrentWrite();
  }

  sleep(Math.random() * 0.5);
}

/**
 * Setup: Initialize test environment
 */
export function setup() {
  console.log('Setting up database query performance tests...');
  console.log('Target: p95 query time < 1000ms for simple queries');
  return {
    startTime: new Date(),
  };
}

/**
 * Teardown: Performance summary
 */
export function teardown(data) {
  console.log('===== DATABASE QUERY PERFORMANCE SUMMARY =====');
  console.log(`Successful Queries: ${querySuccess.__value}`);
  console.log(`Failed Queries: ${queryErrors.__value}`);
  console.log(`Slow Queries (> threshold): ${slowQueries.__value}`);
  console.log(`Connection Errors: ${connectionErrors.__value}`);
  console.log(`Lock Timeouts: ${lockTimeouts.__value}`);
  console.log('============================================');
}
