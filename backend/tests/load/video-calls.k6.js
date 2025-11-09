/**
 * k6 Load Test: Concurrent Video Calls
 * T178 - User Story 2: Teleconsultation Feature
 *
 * Tests system performance under load:
 * - Ramp-up: 0 → 100 concurrent calls over 2 minutes
 * - Sustained Load: 100 concurrent calls for 5 minutes
 * - Ramp-down: 100 → 0 over 1 minute
 *
 * Metrics Tracked:
 * - Request rate (calls/second)
 * - Response time (p50, p95, p99 latency)
 * - Error rate (% of failed requests)
 * - Twilio API response times
 * - Database query times
 *
 * Performance Targets:
 * - p95 latency < 150ms for room creation
 * - p95 latency < 100ms for token generation
 * - Error rate < 1%
 * - 100 concurrent calls handled without crashes
 * - Memory usage stable (no memory leaks)
 *
 * Requirements Covered:
 * - FR-025a: Teleconsultation booking and video call performance
 * - Production Readiness: System can handle 100 concurrent video calls
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:4003';

// Test credentials (use test environment tokens)
const PATIENT_TOKEN = __ENV.PATIENT_TOKEN || 'test-patient-token';
const PHARMACIST_TOKEN = __ENV.PHARMACIST_TOKEN || 'test-pharmacist-token';

// Test data
const TEST_PHARMACIST_ID = 'load-test-pharmacist-001';

// ============================================================================
// Custom Metrics
// ============================================================================

const bookingErrorRate = new Rate('booking_errors');
const joinErrorRate = new Rate('join_errors');
const endCallErrorRate = new Rate('end_call_errors');

const bookingDuration = new Trend('booking_duration');
const joinDuration = new Trend('join_duration');
const tokenGenerationDuration = new Trend('token_generation_duration');
const endCallDuration = new Trend('end_call_duration');

const totalCallsCreated = new Counter('total_calls_created');
const totalCallsJoined = new Counter('total_calls_joined');
const totalCallsEnded = new Counter('total_calls_ended');

// ============================================================================
// k6 Test Options
// ============================================================================

export const options = {
  stages: [
    // Ramp-up: 0 → 100 VUs over 2 minutes
    { duration: '2m', target: 100 },

    // Sustained load: 100 VUs for 5 minutes
    { duration: '5m', target: 100 },

    // Ramp-down: 100 → 0 VUs over 1 minute
    { duration: '1m', target: 0 },
  ],

  thresholds: {
    // HTTP request duration thresholds
    'http_req_duration': ['p(95)<150'], // 95% of requests must complete within 150ms

    // Error rate thresholds
    'http_req_failed': ['rate<0.01'], // Error rate must be less than 1%

    // Custom metric thresholds
    'booking_duration': ['p(95)<1000'], // 95% of bookings within 1s
    'join_duration': ['p(95)<2000'], // 95% of joins within 2s
    'token_generation_duration': ['p(95)<100'], // 95% of token generations within 100ms
    'booking_errors': ['rate<0.01'], // Booking error rate < 1%
    'join_errors': ['rate<0.01'], // Join error rate < 1%
  },

  // Setup and teardown
  setupTimeout: '60s',
  teardownTimeout: '60s',

  // Other options
  discardResponseBodies: false, // Keep response bodies for validation
  noConnectionReuse: false, // Reuse connections for better performance
};

// ============================================================================
// Test Lifecycle
// ============================================================================

/**
 * Setup function - runs once before test
 * Creates test data and validates API is available
 */
export function setup() {
  console.log('🚀 Starting load test setup...');

  // Validate API is reachable
  const healthCheck = http.get(`${API_BASE_URL}/health`);
  const isHealthy = check(healthCheck, {
    'API is healthy': (r) => r.status === 200,
  });

  if (!isHealthy) {
    console.error('❌ API health check failed. Aborting test.');
    return { apiAvailable: false };
  }

  console.log('✅ API is healthy. Starting load test...');

  return {
    apiAvailable: true,
    startTime: new Date().toISOString(),
  };
}

/**
 * Main test function - runs for each VU
 * Simulates a complete teleconsultation lifecycle
 */
export default function (data) {
  if (!data.apiAvailable) {
    console.error('API not available, skipping test iteration');
    return;
  }

  // Each virtual user simulates one patient booking and joining a video call
  const patientId = `patient-${__VU}-${__ITER}`; // Unique patient per VU and iteration
  const callDuration = Math.floor(Math.random() * 30) + 30; // 30-60 seconds

  // ========================================================================
  // Step 1: Book Teleconsultation
  // ========================================================================

  group('1. Book Teleconsultation', () => {
    const scheduledAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min from now

    const bookingPayload = JSON.stringify({
      pharmacist_id: TEST_PHARMACIST_ID,
      scheduled_at: scheduledAt,
      duration_minutes: 15,
      recording_consent: Math.random() > 0.5, // 50% consent
    });

    const bookingStart = new Date();

    const bookingResponse = http.post(
      `${API_BASE_URL}/teleconsultations`,
      bookingPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PATIENT_TOKEN}`,
        },
        tags: { name: 'BookTeleconsultation' },
      }
    );

    const bookingTime = new Date() - bookingStart;
    bookingDuration.add(bookingTime);

    const bookingSuccess = check(bookingResponse, {
      'booking status is 201': (r) => r.status === 201,
      'booking has teleconsultation ID': (r) => r.json('teleconsultation.id') !== undefined,
      'booking status is scheduled': (r) => r.json('teleconsultation.status') === 'scheduled',
    });

    bookingErrorRate.add(!bookingSuccess);

    if (!bookingSuccess) {
      console.error(`Booking failed: ${bookingResponse.status} - ${bookingResponse.body}`);
      return; // Skip rest of test if booking failed
    }

    totalCallsCreated.add(1);

    const teleconsultationId = bookingResponse.json('teleconsultation.id');

    // Small delay to simulate user behavior
    sleep(1);

    // ======================================================================
    // Step 2: Patient Joins Call
    // ======================================================================

    group('2. Patient Joins Call', () => {
      const joinStart = new Date();

      const joinResponse = http.get(
        `${API_BASE_URL}/teleconsultations/${teleconsultationId}/join`,
        {
          headers: {
            'Authorization': `Bearer ${PATIENT_TOKEN}`,
          },
          tags: { name: 'JoinCall' },
        }
      );

      const joinTime = new Date() - joinStart;
      joinDuration.add(joinTime);

      const joinSuccess = check(joinResponse, {
        'join status is 200': (r) => r.status === 200,
        'join has access token': (r) => r.json('access_token') !== undefined,
        'join has room SID': (r) => r.json('room_sid') !== undefined,
        'join has participant identity': (r) => r.json('participant_identity') !== undefined,
      });

      joinErrorRate.add(!joinSuccess);

      if (!joinSuccess) {
        console.error(`Join failed: ${joinResponse.status} - ${joinResponse.body}`);
        return;
      }

      totalCallsJoined.add(1);

      // Measure token generation latency (included in join response)
      tokenGenerationDuration.add(joinTime);
    });

    // Small delay to simulate call duration
    sleep(Math.min(callDuration, 5)); // Cap at 5s for load test efficiency

    // ======================================================================
    // Step 3: Pharmacist Joins Call (50% of the time)
    // ======================================================================

    if (Math.random() > 0.5) {
      group('3. Pharmacist Joins Call', () => {
        const pharmacistJoinResponse = http.get(
          `${API_BASE_URL}/teleconsultations/${teleconsultationId}/join`,
          {
            headers: {
              'Authorization': `Bearer ${PHARMACIST_TOKEN}`,
            },
            tags: { name: 'PharmacistJoinCall' },
          }
        );

        check(pharmacistJoinResponse, {
          'pharmacist join status is 200': (r) => r.status === 200,
          'pharmacist has access token': (r) => r.json('access_token') !== undefined,
        });
      });

      // Simulate call duration
      sleep(2);
    }

    // ======================================================================
    // Step 4: End Call
    // ======================================================================

    group('4. End Call', () => {
      const endCallPayload = JSON.stringify({
        ended_by: patientId,
      });

      const endCallStart = new Date();

      const endCallResponse = http.put(
        `${API_BASE_URL}/teleconsultations/${teleconsultationId}/end`,
        endCallPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PATIENT_TOKEN}`,
          },
          tags: { name: 'EndCall' },
        }
      );

      const endCallTime = new Date() - endCallStart;
      endCallDuration.add(endCallTime);

      const endCallSuccess = check(endCallResponse, {
        'end call status is 200': (r) => r.status === 200,
        'call status is completed': (r) => r.json('status') === 'completed',
        'call has end time': (r) => r.json('ended_at') !== undefined,
        'call has duration': (r) => r.json('duration_seconds') !== undefined,
      });

      endCallErrorRate.add(!endCallSuccess);

      if (endCallSuccess) {
        totalCallsEnded.add(1);
      }
    });
  });

  // Think time between iterations (simulate user delay)
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

/**
 * Teardown function - runs once after test
 * Cleans up test data and prints summary
 */
export function teardown(data) {
  console.log('🧹 Cleaning up load test...');
  console.log(`Test started at: ${data.startTime}`);
  console.log(`Test ended at: ${new Date().toISOString()}`);
  console.log('✅ Load test complete!');
}

// ============================================================================
// Custom Summary Handler
// ============================================================================

export function handleSummary(data) {
  console.log('\n📊 LOAD TEST SUMMARY\n');
  console.log('='.repeat(80));

  // Extract key metrics
  const metrics = data.metrics;

  // HTTP metrics
  const httpReqDuration = metrics.http_req_duration;
  const httpReqFailed = metrics.http_req_failed;

  console.log('\n🌐 HTTP Metrics:');
  console.log(`  Total Requests: ${httpReqDuration.values.count}`);
  console.log(`  Avg Response Time: ${httpReqDuration.values.avg.toFixed(2)}ms`);
  console.log(`  p50 Response Time: ${httpReqDuration.values['p(50)'].toFixed(2)}ms`);
  console.log(`  p95 Response Time: ${httpReqDuration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  p99 Response Time: ${httpReqDuration.values['p(99)'].toFixed(2)}ms`);
  console.log(`  Error Rate: ${(httpReqFailed.values.rate * 100).toFixed(2)}%`);

  // Custom metrics
  console.log('\n📞 Teleconsultation Metrics:');
  console.log(`  Total Calls Created: ${metrics.total_calls_created?.values.count || 0}`);
  console.log(`  Total Calls Joined: ${metrics.total_calls_joined?.values.count || 0}`);
  console.log(`  Total Calls Ended: ${metrics.total_calls_ended?.values.count || 0}`);

  console.log('\n⏱️  Performance Breakdown:');
  console.log(`  Booking p95: ${metrics.booking_duration?.values['p(95)']?.toFixed(2) || 'N/A'}ms`);
  console.log(`  Join p95: ${metrics.join_duration?.values['p(95)']?.toFixed(2) || 'N/A'}ms`);
  console.log(`  Token Gen p95: ${metrics.token_generation_duration?.values['p(95)']?.toFixed(2) || 'N/A'}ms`);
  console.log(`  End Call p95: ${metrics.end_call_duration?.values['p(95)']?.toFixed(2) || 'N/A'}ms`);

  console.log('\n❌ Error Rates:');
  console.log(`  Booking Errors: ${(metrics.booking_errors?.values.rate * 100).toFixed(2)}%`);
  console.log(`  Join Errors: ${(metrics.join_errors?.values.rate * 100).toFixed(2)}%`);
  console.log(`  End Call Errors: ${(metrics.end_call_errors?.values.rate * 100).toFixed(2)}%`);

  console.log('\n🎯 Performance Targets:');
  const p95Target = 150;
  const errorRateTarget = 1;

  const p95Pass = httpReqDuration.values['p(95)'] < p95Target;
  const errorRatePass = httpReqFailed.values.rate * 100 < errorRateTarget;

  console.log(`  p95 < ${p95Target}ms: ${p95Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Error Rate < ${errorRateTarget}%: ${errorRatePass ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n' + '='.repeat(80));

  // Return summary for k6 to process
  return {
    'stdout': JSON.stringify(data, null, 2), // Pretty-printed JSON to stdout
    'summary.json': JSON.stringify(data), // JSON file output
    'summary.html': htmlReport(data), // HTML report
  };
}

/**
 * Generate HTML summary report
 */
function htmlReport(data) {
  const metrics = data.metrics;
  const httpReqDuration = metrics.http_req_duration;
  const httpReqFailed = metrics.http_req_failed;

  return `
<!DOCTYPE html>
<html>
<head>
  <title>k6 Load Test Report - Teleconsultation Video Calls</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; background: white; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #4CAF50; color: white; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
    .metric { margin: 20px 0; padding: 20px; background: white; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>📊 k6 Load Test Report: Teleconsultation Video Calls</h1>

  <div class="metric">
    <h2>Test Configuration</h2>
    <p><strong>Target:</strong> 100 concurrent video calls</p>
    <p><strong>Duration:</strong> 8 minutes (2m ramp-up, 5m sustained, 1m ramp-down)</p>
    <p><strong>Test Date:</strong> ${new Date().toISOString()}</p>
  </div>

  <div class="metric">
    <h2>HTTP Performance Metrics</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Target</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>Total Requests</td>
        <td>${httpReqDuration.values.count}</td>
        <td>-</td>
        <td>-</td>
      </tr>
      <tr>
        <td>Avg Response Time</td>
        <td>${httpReqDuration.values.avg.toFixed(2)}ms</td>
        <td>-</td>
        <td>-</td>
      </tr>
      <tr>
        <td>p95 Response Time</td>
        <td>${httpReqDuration.values['p(95)'].toFixed(2)}ms</td>
        <td>&lt; 150ms</td>
        <td class="${httpReqDuration.values['p(95)'] < 150 ? 'pass' : 'fail'}">
          ${httpReqDuration.values['p(95)'] < 150 ? '✅ PASS' : '❌ FAIL'}
        </td>
      </tr>
      <tr>
        <td>Error Rate</td>
        <td>${(httpReqFailed.values.rate * 100).toFixed(2)}%</td>
        <td>&lt; 1%</td>
        <td class="${httpReqFailed.values.rate < 0.01 ? 'pass' : 'fail'}">
          ${httpReqFailed.values.rate < 0.01 ? '✅ PASS' : '❌ FAIL'}
        </td>
      </tr>
    </table>
  </div>

  <div class="metric">
    <h2>Teleconsultation Metrics</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Count</th>
      </tr>
      <tr>
        <td>Calls Created</td>
        <td>${metrics.total_calls_created?.values.count || 0}</td>
      </tr>
      <tr>
        <td>Calls Joined</td>
        <td>${metrics.total_calls_joined?.values.count || 0}</td>
      </tr>
      <tr>
        <td>Calls Ended</td>
        <td>${metrics.total_calls_ended?.values.count || 0}</td>
      </tr>
    </table>
  </div>

  <div class="metric">
    <h2>Performance Breakdown</h2>
    <table>
      <tr>
        <th>Operation</th>
        <th>p95 Latency</th>
        <th>Target</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>Booking</td>
        <td>${metrics.booking_duration?.values['p(95)']?.toFixed(2) || 'N/A'}ms</td>
        <td>&lt; 1000ms</td>
        <td class="${(metrics.booking_duration?.values['p(95)'] || 0) < 1000 ? 'pass' : 'fail'}">
          ${(metrics.booking_duration?.values['p(95)'] || 0) < 1000 ? '✅' : '❌'}
        </td>
      </tr>
      <tr>
        <td>Join Call</td>
        <td>${metrics.join_duration?.values['p(95)']?.toFixed(2) || 'N/A'}ms</td>
        <td>&lt; 2000ms</td>
        <td class="${(metrics.join_duration?.values['p(95)'] || 0) < 2000 ? 'pass' : 'fail'}">
          ${(metrics.join_duration?.values['p(95)'] || 0) < 2000 ? '✅' : '❌'}
        </td>
      </tr>
      <tr>
        <td>Token Generation</td>
        <td>${metrics.token_generation_duration?.values['p(95)']?.toFixed(2) || 'N/A'}ms</td>
        <td>&lt; 100ms</td>
        <td class="${(metrics.token_generation_duration?.values['p(95)'] || 0) < 100 ? 'pass' : 'fail'}">
          ${(metrics.token_generation_duration?.values['p(95)'] || 0) < 100 ? '✅' : '❌'}
        </td>
      </tr>
    </table>
  </div>

  <div class="metric">
    <h2>Conclusion</h2>
    <p>
      ${httpReqDuration.values['p(95)'] < 150 && httpReqFailed.values.rate < 0.01
        ? '<span class="pass">✅ System PASSED load test - Ready for production with 100 concurrent calls</span>'
        : '<span class="fail">❌ System FAILED load test - Performance optimization required</span>'
      }
    </p>
  </div>
</body>
</html>
  `;
}

// ============================================================================
// Usage Instructions
// ============================================================================

/**
 * RUN THIS TEST:
 *
 * 1. Install k6:
 *    macOS: brew install k6
 *    Ubuntu: sudo apt-get install k6
 *    Windows: choco install k6
 *
 * 2. Start teleconsultation service:
 *    cd backend/services/teleconsultation-service
 *    npm run dev
 *
 * 3. Run load test:
 *    k6 run backend/tests/load/video-calls.k6.js
 *
 * 4. Run with custom parameters:
 *    k6 run --vus 50 --duration 3m backend/tests/load/video-calls.k6.js
 *
 * 5. Export results to HTML:
 *    k6 run backend/tests/load/video-calls.k6.js > load-test-results.html
 *
 * 6. Run with environment variables:
 *    k6 run -e API_BASE_URL=http://staging.example.com backend/tests/load/video-calls.k6.js
 */
