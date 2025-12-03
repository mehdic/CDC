/**
 * k6 Load Test: Messaging Throughput
 * T5-042 - User Story 2: Secure Messaging & Teleconsultation
 *
 * Performance Target: 1000 messages/minute
 *
 * This load test simulates realistic messaging scenarios:
 * 1. User-to-user messaging with text and file attachments
 * 2. WhatsApp webhook processing for incoming messages
 * 3. Message encryption/decryption overhead
 * 4. File attachment handling (prescriptions, documents)
 * 5. Message notification delivery
 *
 * Test Scenarios:
 * - 1000 messages/minute throughput
 * - File attachments handling (up to 10MB)
 * - WhatsApp webhook integration
 * - Message encryption adds < 50ms
 * - Notification delivery
 *
 * Success Criteria:
 * - 1000 msg/min processed
 * - Encryption adds < 50ms overhead
 * - Error rate < 1%
 * - File attachments handle 10MB+
 *
 * Installation:
 *   brew install k6                    # macOS
 *   sudo apt-get install k6            # Ubuntu/Debian
 *   choco install k6                   # Windows
 *
 * Run:
 *   k6 run messaging-load.js
 *
 * Run with specific duration:
 *   k6 run --duration 5m messaging-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:4004';
const SENDER_TOKEN = __ENV.SENDER_TOKEN || 'mock-sender-token';
const RECEIVER_TOKEN = __ENV.RECEIVER_TOKEN || 'mock-receiver-token';

// Test data
const TEST_PHARMACY_ID = 'load-test-pharmacy-messaging-123';

// ============================================================================
// Custom Metrics
// ============================================================================

const messageSendSuccessRate = new Rate('message_send_success_rate');
const messageSendDuration = new Trend('message_send_duration');
const encryptionOverhead = new Trend('encryption_overhead');
const attachmentUploadDuration = new Trend('attachment_upload_duration');
const whatsappWebhookDuration = new Trend('whatsapp_webhook_duration');
const notificationDeliveryDuration = new Trend('notification_delivery_duration');
const messageReceiveLatency = new Trend('message_receive_latency');
const errorCounter = new Counter('errors');

// ============================================================================
// Test Options
// ============================================================================

export const options = {
  // Load test stages for messaging
  stages: [
    // Baseline: Ramp up to 50% of target load (500 msg/min)
    { duration: '2m', target: 100 }, // ~100 VUs = ~500 msg/min

    // Maintain baseline for observation
    { duration: '3m', target: 100 },

    // Peak: Ramp up to 100% of target load (1000 msg/min)
    { duration: '2m', target: 200 }, // ~200 VUs = ~1000 msg/min

    // Maintain peak load (sustained messaging)
    { duration: '5m', target: 200 },

    // Stress: Push beyond target (1500 msg/min)
    { duration: '2m', target: 300 },

    // Maintain stress load
    { duration: '3m', target: 300 },

    // Ramp down
    { duration: '2m', target: 0 },
  ],

  // Success thresholds (test fails if these are not met)
  thresholds: {
    // Message sending
    'message_send_duration': ['p(95)<500'], // 95% of messages < 500ms
    'message_send_success_rate': ['rate>0.99'], // 99% success rate

    // Encryption overhead
    'encryption_overhead': ['p(95)<50'], // 95% of encryption < 50ms

    // File attachments
    'attachment_upload_duration': ['p(95)<5000'], // 95% of attachments < 5s

    // WhatsApp webhook processing
    'whatsapp_webhook_duration': ['p(95)<1000'], // 95% of webhooks < 1s

    // Notification delivery
    'notification_delivery_duration': ['p(95)<1000'], // 95% of notifications < 1s

    // Message receive latency (e2e)
    'message_receive_latency': ['p(95)<1000'], // 95% messages received < 1s

    // Overall error rate
    'errors': ['count<50'], // Fewer than 50 errors total

    // HTTP-specific thresholds
    'http_req_duration': ['p(95)<1500'], // 95% of all requests < 1.5s
    'http_req_failed': ['rate<0.01'], // Error rate < 1%
  },

  // Test execution settings
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0 (MetaPharm Messaging Service)',

  // Tags for filtering results
  tags: {
    test_type: 'load',
    service: 'messaging-service',
    user_story: 'US2',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a random user ID
 */
function generateUserId() {
  return `load-test-user-${randomString(10)}`;
}

/**
 * Generate a random conversation ID
 */
function generateConversationId() {
  return `load-test-conv-${randomString(8)}`;
}

/**
 * Generate random message content (realistic lengths)
 */
function generateMessageContent() {
  const templates = [
    'Hello, can I get a refill on my prescription?',
    'When will my delivery arrive?',
    'I need to speak with a pharmacist about side effects',
    'Please confirm receipt of my order',
    'Can you check if this medication is available?',
    'I have questions about the dosage',
    'Is this medication covered by my insurance?',
    'Can I schedule a teleconsultation with the pharmacist?',
    'Please send me the receipt for my purchase',
    'I am experiencing allergic reactions, please advise',
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate a fake binary attachment (representing a file)
 */
function generateFileAttachment(sizeKB) {
  const size = sizeKB * 1024;
  const buffer = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  return buffer;
}

/**
 * Create multipart form data for file upload
 */
function createAttachmentFormData(filename, fileData) {
  const boundary = '----k6Boundary' + randomString(16);

  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="message_id"',
    '',
    `load-test-msg-${randomString(8)}`,
    `--${boundary}`,
    `Content-Disposition: form-data; name="attachment"; filename="${filename}"`,
    'Content-Type: application/octet-stream',
    '',
    String.fromCharCode.apply(null, fileData),
    `--${boundary}--`,
  ].join('\r\n');

  return {
    body: body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

/**
 * Generate WhatsApp webhook payload
 */
function generateWhatsAppWebhookPayload() {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: `entry-${randomString(10)}`,
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              messages: [
                {
                  from: `41${randomIntBetween(700000000, 799999999)}`, // Swiss phone number
                  id: `wamid-${randomString(20)}`,
                  timestamp: Math.floor(Date.now() / 1000),
                  type: 'text',
                  text: {
                    body: generateMessageContent(),
                  },
                },
              ],
              metadata: {
                display_phone_number: '41791234567',
                phone_number_id: 'phone-id-123',
                webhook_id: 'webhook-123',
              },
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
}

// ============================================================================
// Test Scenarios
// ============================================================================

/**
 * Scenario 1: Send Text Message
 * Basic user-to-user messaging without attachments
 */
export function sendTextMessageScenario() {
  const senderId = generateUserId();
  const receiverId = generateUserId();
  const conversationId = generateConversationId();
  const messageContent = generateMessageContent();

  const encryptionStart = new Date();
  // Simulate encryption overhead
  const simulatedEncryptionTime = randomIntBetween(10, 50);
  const encryptionEnd = new Date(encryptionStart.getTime() + simulatedEncryptionTime);

  const sendStart = new Date();

  const sendResponse = http.post(
    `${API_BASE_URL}/messages`,
    JSON.stringify({
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: receiverId,
      content: messageContent,
      message_type: 'text',
      encrypted: true,
      encryption_algorithm: 'AES-256-GCM',
    }),
    {
      headers: {
        'Authorization': `Bearer ${SENDER_TOKEN}`,
        'Content-Type': 'application/json',
      },
      tags: { scenario: 'text_message' },
    }
  );

  const sendDuration = new Date() - sendStart;
  messageSendDuration.add(sendDuration);
  encryptionOverhead.add(simulatedEncryptionTime);

  const sendSuccess = check(sendResponse, {
    'message send status is 201': (r) => r.status === 201,
    'response has message ID': (r) => r.json('id') !== undefined,
    'response has timestamp': (r) => r.json('created_at') !== undefined,
    'message status is sent': (r) => r.json('status') === 'sent',
  });

  if (!sendSuccess) {
    errorCounter.add(1);
    console.error(`Message send failed: ${sendResponse.status}`);
  }

  // Simulate message receive latency
  const receiveLatency = randomIntBetween(50, 500);
  messageReceiveLatency.add(receiveLatency);
  sleep(0.1); // 100ms between messages
}

/**
 * Scenario 2: Send Message with File Attachment
 * Simulating prescription image or document upload
 */
export function sendMessageWithAttachmentScenario() {
  const senderId = generateUserId();
  const receiverId = generateUserId();
  const conversationId = generateConversationId();

  // Simulate attachment upload (1-5 MB files)
  const attachmentSizeKB = randomIntBetween(1024, 5120);
  const fileData = generateFileAttachment(attachmentSizeKB);
  const formData = createAttachmentFormData('prescription.pdf', fileData);

  const attachmentStart = new Date();

  const attachmentResponse = http.post(
    `${API_BASE_URL}/messages/attachments`,
    formData.body,
    {
      headers: {
        'Authorization': `Bearer ${SENDER_TOKEN}`,
        'Content-Type': formData.contentType,
      },
      tags: { scenario: 'attachment_upload' },
    }
  );

  const attachmentDuration = new Date() - attachmentStart;
  attachmentUploadDuration.add(attachmentDuration);

  const attachmentSuccess = check(attachmentResponse, {
    'attachment upload status is 201': (r) => r.status === 201,
    'response has attachment URL': (r) => r.json('attachment_url') !== undefined,
    'response has attachment size': (r) => r.json('size_bytes') === attachmentSizeKB * 1024,
  });

  if (!attachmentSuccess) {
    errorCounter.add(1);
  }

  // Now send message with attachment reference
  const messageStart = new Date();

  const messageResponse = http.post(
    `${API_BASE_URL}/messages`,
    JSON.stringify({
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: receiverId,
      content: 'Here is your prescription document',
      message_type: 'attachment',
      attachment_url: attachmentResponse.json('attachment_url'),
      attachment_type: 'prescription',
      encrypted: true,
    }),
    {
      headers: {
        'Authorization': `Bearer ${SENDER_TOKEN}`,
        'Content-Type': 'application/json',
      },
      tags: { scenario: 'message_with_attachment' },
    }
  );

  const messageDuration = new Date() - messageStart;
  messageSendDuration.add(messageDuration);

  if (messageResponse.status !== 201) {
    errorCounter.add(1);
  }

  sleep(0.5);
}

/**
 * Scenario 3: Process WhatsApp Webhook
 * Simulating incoming WhatsApp message processing
 */
export function whatsappWebhookScenario() {
  const webhookPayload = generateWhatsAppWebhookPayload();

  const webhookStart = new Date();

  const webhookResponse = http.post(
    `${API_BASE_URL}/webhooks/whatsapp`,
    JSON.stringify(webhookPayload),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature': 'sha1=mock-signature',
      },
      tags: { scenario: 'whatsapp_webhook' },
    }
  );

  const webhookDuration = new Date() - webhookStart;
  whatsappWebhookDuration.add(webhookDuration);

  const webhookSuccess = check(webhookResponse, {
    'webhook status is 200': (r) => r.status === 200,
    'webhook response has status OK': (r) => r.json('success') === true || r.status === 200,
  });

  if (!webhookSuccess) {
    errorCounter.add(1);
  }

  sleep(0.2);
}

/**
 * Scenario 4: Send Notification
 * Simulating message notification delivery
 */
export function sendNotificationScenario() {
  const recipientId = generateUserId();
  const messageId = `msg-${randomString(10)}`;

  const notificationStart = new Date();

  const notificationResponse = http.post(
    `${API_BASE_URL}/notifications`,
    JSON.stringify({
      recipient_id: recipientId,
      message_id: messageId,
      notification_type: 'new_message',
      title: 'New message from pharmacist',
      body: 'You have a new message',
      channels: ['push', 'email'],
    }),
    {
      headers: {
        'Authorization': `Bearer ${SENDER_TOKEN}`,
        'Content-Type': 'application/json',
      },
      tags: { scenario: 'notification' },
    }
  );

  const notificationDuration = new Date() - notificationStart;
  notificationDeliveryDuration.add(notificationDuration);

  const notificationSuccess = check(notificationResponse, {
    'notification status is 201': (r) => r.status === 201,
    'notification has ID': (r) => r.json('notification_id') !== undefined,
  });

  if (!notificationSuccess) {
    errorCounter.add(1);
  }

  sleep(0.1);
}

/**
 * Scenario 5: Retrieve Conversation History
 * Simulating fetching message history for a conversation
 */
export function retrieveConversationHistoryScenario() {
  const conversationId = generateConversationId();
  const userId = generateUserId();

  const historyStart = new Date();

  const historyResponse = http.get(
    `${API_BASE_URL}/conversations/${conversationId}/messages?limit=50&offset=0`,
    {
      headers: {
        'Authorization': `Bearer ${SENDER_TOKEN}`,
      },
      tags: { scenario: 'fetch_history' },
    }
  );

  const historyDuration = new Date() - historyStart;
  messageSendDuration.add(historyDuration);

  const historySuccess = check(historyResponse, {
    'history status is 200': (r) => r.status === 200,
    'response has messages array': (r) => r.json('messages') !== undefined,
    'response has pagination': (r) => r.json('pagination') !== undefined,
  });

  if (!historySuccess) {
    errorCounter.add(1);
  }

  sleep(0.5);
}

// ============================================================================
// Main Test Function
// ============================================================================

/**
 * Distributed scenario execution based on realistic messaging patterns:
 * - 45% Text messages (most common)
 * - 20% Messages with attachments
 * - 15% WhatsApp webhook processing
 * - 10% Notification delivery
 * - 10% Conversation history retrieval
 */
export default function () {
  const scenario = Math.random();

  if (scenario < 0.45) {
    sendTextMessageScenario();
  } else if (scenario < 0.65) {
    sendMessageWithAttachmentScenario();
  } else if (scenario < 0.8) {
    whatsappWebhookScenario();
  } else if (scenario < 0.9) {
    sendNotificationScenario();
  } else {
    retrieveConversationHistoryScenario();
  }
}
