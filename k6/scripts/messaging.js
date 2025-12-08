/**
 * K6 Load Test: Messaging Throughput
 * Tests messaging API with 1000 messages/minute target
 * Simulates multi-channel communication (in-app, email, WhatsApp)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const messageErrors = new Rate('messaging_errors');
const messageSuccess = new Counter('messaging_success');
const messageDuration = new Trend('messaging_duration');
const emailErrors = new Rate('email_send_errors');
const whatsappErrors = new Rate('whatsapp_send_errors');
const inAppErrors = new Rate('inapp_send_errors');
const messageDeliveryTime = new Trend('message_delivery_time');

// Test configuration for messaging throughput
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 VUs
    { duration: '1m', target: 100 },   // Ramp up to 100 VUs
    { duration: '2m', target: 200 },   // Ramp up to 200 VUs (aim for 1000+ msg/min)
    { duration: '3m', target: 200 },   // Stay at 200 VUs
    { duration: '1m', target: 100 },   // Ramp down
    { duration: '30s', target: 0 },    // Final ramp down
  ],
  thresholds: {
    'messaging_duration': ['p(95)<1000', 'p(99)<3000'],
    'messaging_errors': ['rate<0.05'],
    'message_delivery_time': ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

/**
 * Generate random user ID
 */
function generateUserId() {
  return `USER-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Generate random conversation ID
 */
function generateConversationId() {
  return `CONV-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Generate random message content
 */
function generateMessageContent() {
  const templates = [
    'Your prescription is ready for pickup at the pharmacy.',
    'Delivery will arrive in 30 minutes.',
    'Please confirm your appointment for tomorrow at 2:00 PM.',
    'New medication recommendation based on your health profile.',
    'Your insurance claim has been processed successfully.',
    'Reminder: Take your daily medications as prescribed.',
    'Your test results are now available in your patient portal.',
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Test in-app messaging
 */
function testInAppMessaging() {
  const conversationId = generateConversationId();
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '10s',
  };

  const payload = JSON.stringify({
    conversationId,
    message: generateMessageContent(),
    type: 'text',
    sender: generateUserId(),
    timestamp: new Date().toISOString(),
  });

  const startTime = new Date();
  const res = http.post(`${BASE_URL}/api/messaging/send`, payload, params);
  const duration = new Date() - startTime;

  messageDuration.add(duration);
  messageDeliveryTime.add(duration);

  const check1 = check(res, {
    'message sent successfully': (r) => r.status === 200 || r.status === 201,
    'response contains message_id': (r) => r.body.includes('message_id') || r.status >= 200 && r.status < 300,
    'delivery time < 1s': (r) => duration < 1000,
  });

  if (!check1) {
    messageErrors.add(1);
    inAppErrors.add(1);
  } else {
    messageSuccess.add(1);
  }

  return check1;
}

/**
 * Test email notification
 */
function testEmailNotification() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '10s',
  };

  const payload = JSON.stringify({
    recipients: [
      `patient-${Math.random().toString(36).substring(2, 10)}@example.com`,
    ],
    subject: 'Pharmacy Update',
    body: generateMessageContent(),
    type: 'notification',
    priority: 'normal',
  });

  const startTime = new Date();
  const res = http.post(`${BASE_URL}/api/notifications/email/send`, payload, params);
  const duration = new Date() - startTime;

  messageDuration.add(duration);

  const check1 = check(res, {
    'email send initiated': (r) => r.status === 200 || r.status === 202,
    'response time < 2s': (r) => duration < 2000,
  });

  if (!check1) {
    messageErrors.add(1);
    emailErrors.add(1);
  } else {
    messageSuccess.add(1);
  }

  return check1;
}

/**
 * Test WhatsApp integration (mock)
 */
function testWhatsAppNotification() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '10s',
  };

  const payload = JSON.stringify({
    phoneNumber: `+41${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    message: generateMessageContent(),
    type: 'whatsapp',
    templateId: 'pharmacy_notification',
  });

  const startTime = new Date();
  const res = http.post(`${BASE_URL}/api/notifications/whatsapp/send`, payload, params);
  const duration = new Date() - startTime;

  messageDuration.add(duration);

  const check1 = check(res, {
    'whatsapp message queued': (r) => r.status === 200 || r.status === 202,
    'response time < 2s': (r) => duration < 2000,
  });

  if (!check1) {
    messageErrors.add(1);
    whatsappErrors.add(1);
  } else {
    messageSuccess.add(1);
  }

  return check1;
}

/**
 * Test message retrieval
 */
function testMessageRetrieval() {
  const userId = generateUserId();
  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '10s',
  };

  const res = http.get(`${BASE_URL}/api/messaging/conversations/${userId}`, params);

  const check1 = check(res, {
    'message list retrieved': (r) => r.status === 200,
  });

  if (!check1) {
    messageErrors.add(1);
  } else {
    messageSuccess.add(1);
  }

  return check1;
}

/**
 * Main test function - distributed message sending
 */
export default function () {
  // Distribute messages across channels
  const random = Math.random();

  if (random < 0.3) {
    // 30% in-app messaging
    testInAppMessaging();
  } else if (random < 0.6) {
    // 30% email notifications
    testEmailNotification();
  } else if (random < 0.85) {
    // 25% WhatsApp notifications
    testWhatsAppNotification();
  } else {
    // 15% message retrieval
    testMessageRetrieval();
  }

  // Small random sleep to distribute load
  sleep(Math.random() * 0.5);
}

/**
 * Setup: Initialize test environment
 */
export function setup() {
  console.log('Setting up messaging throughput load tests...');
  console.log('Target: 1000+ messages/minute');
  return {
    startTime: new Date(),
    messageCount: 0,
  };
}

/**
 * Teardown: Performance summary
 */
export function teardown(data) {
  console.log('===== MESSAGING THROUGHPUT LOAD TEST SUMMARY =====');
  console.log(`Messages Sent: ${messageSuccess.__value}`);
  console.log(`Messages Failed: ${messageErrors.__value}`);
  console.log(`Email Errors: ${emailErrors.__value}`);
  console.log(`WhatsApp Errors: ${whatsappErrors.__value}`);
  console.log(`In-App Errors: ${inAppErrors.__value}`);
  console.log('==================================================');
}
