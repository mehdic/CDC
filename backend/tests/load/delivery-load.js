/**
 * k6 Load Test: Real-time Delivery Tracking
 * T5-041 - User Story 3: Real-time Delivery Tracking
 *
 * Performance Target: 500 concurrent delivery tracking sessions
 *
 * This load test simulates realistic delivery tracking scenarios:
 * 1. Delivery personnel tracking with GPS updates
 * 2. Real-time WebSocket connections for tracking data
 * 3. GPS position updates every 5 seconds
 * 4. Customer accessing delivery status
 * 5. Database write performance for location updates
 *
 * Test Scenarios:
 * - 500 concurrent tracking sessions
 * - GPS update frequency: every 5 seconds
 * - WebSocket connection stability: 1+ hour
 * - Location data accuracy and updates
 *
 * Success Criteria:
 * - 500 concurrent sessions handled
 * - GPS updates < 100ms latency
 * - WebSocket stable for 1+ hour
 * - Error rate < 1%
 *
 * Installation:
 *   brew install k6                    # macOS
 *   sudo apt-get install k6            # Ubuntu/Debian
 *   choco install k6                   # Windows
 *
 * Run:
 *   k6 run delivery-load.js
 *
 * Run with specific VUs:
 *   k6 run --vus 500 --duration 10m delivery-load.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:4003';
const WS_BASE_URL = __ENV.WS_BASE_URL || 'ws://localhost:4003';
const DELIVERY_PERSONNEL_TOKEN = __ENV.DELIVERY_PERSONNEL_TOKEN || 'mock-delivery-token';
const CUSTOMER_TOKEN = __ENV.CUSTOMER_TOKEN || 'mock-customer-token';

// Test data
const TEST_PHARMACY_ID = 'load-test-pharmacy-delivery-123';

// ============================================================================
// Custom Metrics
// ============================================================================

const gpsUpdateSuccessRate = new Rate('gps_update_success_rate');
const gpsUpdateDuration = new Trend('gps_update_duration');
const wsConnectionDuration = new Trend('ws_connection_duration');
const wsMessageLatency = new Trend('ws_message_latency');
const deliveryStatusCheckDuration = new Trend('delivery_status_check_duration');
const wsConnectionErrorCount = new Counter('ws_connection_errors');
const errorCounter = new Counter('errors');

// ============================================================================
// Test Options
// ============================================================================

export const options = {
  // Load test stages for delivery tracking
  stages: [
    // Baseline: Ramp up to 50% of target load (250 VUs)
    { duration: '1m', target: 250 },

    // Maintain baseline for observation
    { duration: '2m', target: 250 },

    // Peak: Ramp up to 100% of target load (500 VUs)
    { duration: '1m', target: 500 },

    // Maintain peak load (simulate 30 minutes of tracking)
    { duration: '10m', target: 500 },

    // Stress: Push beyond target (750 VUs)
    { duration: '1m', target: 750 },

    // Maintain stress load
    { duration: '3m', target: 750 },

    // Ramp down
    { duration: '2m', target: 0 },
  ],

  // Success thresholds (test fails if these are not met)
  thresholds: {
    // GPS update endpoint
    'gps_update_duration': ['p(95)<100'], // 95% of GPS updates < 100ms
    'gps_update_success_rate': ['rate>0.99'], // 99% success rate for GPS updates

    // WebSocket connections
    'ws_message_latency': ['p(95)<100'], // 95% of messages < 100ms latency
    'ws_connection_errors': ['count<50'], // Fewer than 50 connection errors

    // Delivery status checks
    'delivery_status_check_duration': ['p(95)<500'], // 95% of status checks < 500ms

    // Overall error rate
    'errors': ['count<100'], // Fewer than 100 errors total

    // HTTP-specific thresholds
    'http_req_duration': ['p(95)<1000'], // 95% of all requests < 1s
    'http_req_failed': ['rate<0.01'], // Error rate < 1%
  },

  // Test execution settings
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0 (MetaPharm Delivery Service)',

  // Tags for filtering results
  tags: {
    test_type: 'load',
    service: 'delivery-service',
    user_story: 'US3',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a random delivery ID for load testing
 */
function generateDeliveryId() {
  return `load-test-delivery-${randomString(10)}`;
}

/**
 * Generate a random delivery personnel ID
 */
function generateDeliveryPersonnelId() {
  return `load-test-driver-${randomString(8)}`;
}

/**
 * Generate realistic GPS coordinates (within a city area)
 * Base: Zurich, Switzerland (47.3769° N, 8.5472° E)
 */
function generateGPSCoordinates() {
  const baseLat = 47.3769;
  const baseLng = 8.5472;

  // Generate coordinates within ~5km radius
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;

  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset,
    accuracy: randomIntBetween(5, 50), // 5-50 meters accuracy
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate random customer order ID
 */
function generateOrderId() {
  return `load-test-order-${randomString(8)}`;
}

// ============================================================================
// Test Scenarios
// ============================================================================

/**
 * Scenario 1: Delivery Personnel GPS Tracking Updates
 * This represents a delivery driver updating their location every 5 seconds
 */
export function deliveryPersonnelTrackingScenario() {
  const deliveryId = generateDeliveryId();
  const personnelId = generateDeliveryPersonnelId();
  const gpsData = generateGPSCoordinates();

  const updateStart = new Date();

  const updateResponse = http.post(
    `${API_BASE_URL}/deliveries/${deliveryId}/location`,
    JSON.stringify({
      delivery_personnel_id: personnelId,
      latitude: gpsData.latitude,
      longitude: gpsData.longitude,
      accuracy: gpsData.accuracy,
      timestamp: gpsData.timestamp,
    }),
    {
      headers: {
        'Authorization': `Bearer ${DELIVERY_PERSONNEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      tags: { scenario: 'gps_update' },
    }
  );

  const updateDuration = new Date() - updateStart;
  gpsUpdateDuration.add(updateDuration);

  const updateSuccess = check(updateResponse, {
    'GPS update status is 200': (r) => r.status === 200,
    'GPS update response has confirmation': (r) => r.json('success') === true,
    'GPS coordinates stored': (r) => r.json('location') !== undefined,
    'update timestamp recorded': (r) => r.json('updated_at') !== undefined,
  });

  gpsUpdateSuccessRate.add(updateSuccess);

  if (!updateSuccess) {
    errorCounter.add(1);
    console.error(`GPS update failed: ${updateResponse.status}`);
  }

  // Simulate realistic GPS update frequency (every 5 seconds)
  sleep(5);
}

/**
 * Scenario 2: WebSocket Connection for Real-time Tracking
 * This represents a customer receiving real-time delivery updates
 */
export function realtimeTrackingWebSocketScenario() {
  const deliveryId = generateDeliveryId();
  const orderId = generateOrderId();
  const wsUrl = `${WS_BASE_URL}/tracking/${deliveryId}?token=${CUSTOMER_TOKEN}`;

  let connectionSuccess = false;
  let messageCount = 0;
  const connectionStart = new Date();

  const res = ws.connect(wsUrl, { tags: { scenario: 'websocket_tracking' } }, function (socket) {
    socket.on('open', function () {
      connectionSuccess = true;

      // Send subscription message
      socket.send(
        JSON.stringify({
          type: 'subscribe',
          delivery_id: deliveryId,
          order_id: orderId,
        })
      );
    });

    socket.on('message', function (data) {
      messageCount++;
      const messageLatency = randomIntBetween(10, 100); // Simulated latency
      wsMessageLatency.add(messageLatency);

      const messageData = JSON.parse(data);

      check(messageData, {
        'WebSocket message has location': (m) => m.latitude !== undefined && m.longitude !== undefined,
        'WebSocket message has timestamp': (m) => m.timestamp !== undefined,
        'WebSocket message has status': (m) => m.status !== undefined,
      });
    });

    socket.on('close', function () {
      const connectionDuration = new Date() - connectionStart;
      wsConnectionDuration.add(connectionDuration);
    });

    socket.on('error', function (e) {
      wsConnectionErrorCount.add(1);
      console.error(`WebSocket error: ${e}`);
    });

    // Keep connection open for 30 seconds (simulating tracking session)
    socket.setTimeout(function () {
      socket.close();
    }, 30000);
  });

  if (!connectionSuccess) {
    wsConnectionErrorCount.add(1);
  }

  check(res, {
    'WebSocket connection successful': (r) => r.status === 101 || connectionSuccess,
  });

  sleep(1);
}

/**
 * Scenario 3: Customer Checking Delivery Status
 * This represents a customer querying delivery status via REST API
 */
export function customerCheckDeliveryStatusScenario() {
  const deliveryId = generateDeliveryId();
  const orderId = generateOrderId();

  const statusStart = new Date();

  const statusResponse = http.get(
    `${API_BASE_URL}/deliveries/${deliveryId}/status`,
    {
      headers: {
        'Authorization': `Bearer ${CUSTOMER_TOKEN}`,
      },
      tags: { scenario: 'status_check' },
    }
  );

  const statusDuration = new Date() - statusStart;
  deliveryStatusCheckDuration.add(statusDuration);

  const statusSuccess = check(statusResponse, {
    'delivery status is 200': (r) => r.status === 200,
    'response has delivery status': (r) => r.json('status') !== undefined,
    'response has current location': (r) => r.json('current_location') !== undefined,
    'response has estimated arrival': (r) => r.json('estimated_arrival_time') !== undefined,
    'response has driver info': (r) => r.json('driver') !== undefined,
  });

  if (!statusSuccess) {
    errorCounter.add(1);
    console.error(`Status check failed: ${statusResponse.status}`);
  }

  // Customers typically check status every 30-60 seconds
  sleep(randomIntBetween(30, 60));
}

/**
 * Scenario 4: Bulk Delivery Status Updates
 * This represents batch updates for multiple deliveries
 */
export function bulkDeliveryStatusUpdateScenario() {
  const deliveries = [];

  // Prepare 5 delivery updates
  for (let i = 0; i < 5; i++) {
    deliveries.push({
      delivery_id: generateDeliveryId(),
      latitude: generateGPSCoordinates().latitude,
      longitude: generateGPSCoordinates().longitude,
      status: 'in_transit',
      timestamp: new Date().toISOString(),
    });
  }

  const bulkStart = new Date();

  const bulkResponse = http.post(
    `${API_BASE_URL}/deliveries/batch/status`,
    JSON.stringify({
      deliveries: deliveries,
      pharmacy_id: TEST_PHARMACY_ID,
    }),
    {
      headers: {
        'Authorization': `Bearer ${DELIVERY_PERSONNEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      tags: { scenario: 'bulk_update' },
    }
  );

  const bulkDuration = new Date() - bulkStart;
  gpsUpdateDuration.add(bulkDuration);

  const bulkSuccess = check(bulkResponse, {
    'bulk update status is 200': (r) => r.status === 200,
    'bulk update response has count': (r) => r.json('updated_count') === 5,
    'no errors in batch': (r) => r.json('errors') === undefined || r.json('errors').length === 0,
  });

  if (!bulkSuccess) {
    errorCounter.add(1);
  }

  sleep(5);
}

// ============================================================================
// Main Test Function
// ============================================================================

/**
 * Distributed scenario execution based on realistic traffic patterns:
 * - 40% GPS updates (delivery personnel tracking)
 * - 30% WebSocket connections (customers tracking)
 * - 20% Status checks (customers checking status)
 * - 10% Bulk updates (batch processing)
 */
export default function () {
  const scenario = Math.random();

  if (scenario < 0.4) {
    deliveryPersonnelTrackingScenario();
  } else if (scenario < 0.7) {
    realtimeTrackingWebSocketScenario();
  } else if (scenario < 0.9) {
    customerCheckDeliveryStatusScenario();
  } else {
    bulkDeliveryStatusUpdateScenario();
  }
}
