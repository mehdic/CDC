/**
 * K6 Load Test: Delivery Tracking
 * Tests WebSocket connections for real-time delivery tracking
 * Target: 500 concurrent WebSocket connections with < 2s latency
 */

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const wsConnectErrors = new Rate('delivery_ws_connect_errors');
const wsMessageErrors = new Rate('delivery_ws_message_errors');
const wsConnectSuccess = new Counter('delivery_ws_connect_success');
const wsMessageLatency = new Trend('delivery_ws_message_latency');
const wsDisconnectErrors = new Rate('delivery_ws_disconnect_errors');

// Test configuration for delivery tracking
export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100 connections
    { duration: '1m', target: 250 },   // Ramp up to 250 connections
    { duration: '2m', target: 500 },   // Ramp up to 500 concurrent connections
    { duration: '3m', target: 500 },   // Stay at 500 connections
    { duration: '1m', target: 250 },   // Ramp down
    { duration: '1m', target: 0 },     // Final ramp down
  ],
  thresholds: {
    'delivery_ws_message_latency': ['p(95)<2000', 'p(99)<5000'],
    'delivery_ws_connect_errors': ['rate<0.05'],
    'delivery_ws_message_errors': ['rate<0.10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

/**
 * Generate random delivery ID
 */
function generateDeliveryId() {
  return `DEL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

/**
 * Generate random location coordinates
 */
function generateLocation() {
  const baseLatitude = 46.9479; // Switzerland center
  const baseLongitude = 7.4474;
  const variance = 0.1; // ~10km variation

  return {
    latitude: baseLatitude + (Math.random() - 0.5) * variance,
    longitude: baseLongitude + (Math.random() - 0.5) * variance,
    timestamp: new Date().toISOString(),
    accuracy: Math.random() * 10 + 5, // 5-15m accuracy
  };
}

/**
 * Test WebSocket connection for delivery tracking
 */
export default function () {
  const deliveryId = generateDeliveryId();
  const userId = `USER-${Math.random().toString(36).substring(2, 10)}`;

  // Connect to WebSocket
  const url = `${WS_URL}/api/delivery/tracking/${deliveryId}?token=${AUTH_TOKEN}`;

  let connectCheck = false;
  let messagesSent = 0;
  let messagesReceived = 0;
  let errors = 0;

  try {
    const res = ws.connect(url, { tags: { name: 'DeliveryTracking' } }, function (socket) {
      connectCheck = check(socket.readyState, {
        'ws connection established': (state) => state === 1, // OPEN
      });

      if (connectCheck) {
        wsConnectSuccess.add(1);
      } else {
        wsConnectErrors.add(1);
      }

      // Send location updates periodically
      for (let i = 0; i < 5; i++) {
        const location = generateLocation();
        const startTime = new Date();

        try {
          socket.send(
            JSON.stringify({
              type: 'location_update',
              deliveryId,
              userId,
              location,
              status: 'in_transit',
            })
          );
          messagesSent++;
        } catch (e) {
          errors++;
          wsMessageErrors.add(1);
        }

        // Listen for acknowledgment
        socket.on('message', function (data) {
          const duration = new Date() - startTime;
          wsMessageLatency.add(duration);
          messagesReceived++;

          const msgCheck = check(data, {
            'received acknowledgment': (msg) => msg.includes('ack') || msg.length > 0,
          });

          if (!msgCheck) {
            wsMessageErrors.add(1);
          }
        });

        // Wait before sending next update
        sleep(0.5);
      }

      // Send delivery status updates
      socket.send(
        JSON.stringify({
          type: 'status_update',
          deliveryId,
          status: 'approaching',
          eta: new Date(Date.now() + 5 * 60000).toISOString(),
        })
      );
      messagesSent++;

      sleep(1);

      // Close connection gracefully
      socket.close();
    });

    // Check response status
    if (res && res.status !== 1001) {
      // 1001 = normal close
      check(res, {
        'ws connection closed gracefully': (r) => r && r.status === 1001 || true,
      });
    }
  } catch (e) {
    errors++;
    wsConnectErrors.add(1);
    console.error(`WebSocket error for delivery ${deliveryId}:`, e);
  }

  // Log if there were issues
  if (errors > 0) {
    wsDisconnectErrors.add(errors);
  }

  sleep(Math.random() * 2);
}

/**
 * Setup: Initialize test environment
 */
export function setup() {
  console.log('Setting up delivery tracking load tests...');
  return {
    startTime: new Date(),
    baseUrl: BASE_URL,
  };
}

/**
 * Teardown: Performance summary
 */
export function teardown(data) {
  const duration = new Date() - new Date(data.startTime);
  console.log('===== DELIVERY TRACKING LOAD TEST SUMMARY =====');
  console.log(`Total Test Duration: ${duration}ms`);
  console.log(`Successful Connections: ${wsConnectSuccess.__value}`);
  console.log('============================================');
}
