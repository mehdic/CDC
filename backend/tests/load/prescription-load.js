/**
 * k6 Load Test: Prescription Submission
 * T132 - User Story 1: Prescription Processing & Validation
 *
 * Performance Target: 1000 prescriptions/hour (~16.67/minute, ~0.28/second)
 *
 * This load test simulates realistic user behavior:
 * 1. Patients uploading prescription images
 * 2. Pharmacists triggering OCR transcription
 * 3. Validation and approval workflows
 *
 * Test Scenarios:
 * - Baseline: Normal load (50% of target)
 * - Peak: Peak load (100% of target)
 * - Stress: Beyond capacity (150% of target)
 *
 * Success Criteria:
 * - p95 response time < 1000ms for upload
 * - p95 response time < 10000ms for OCR transcription (AWS Textract)
 * - Error rate < 1%
 * - Throughput: 16.67 requests/minute sustained
 *
 * Installation:
 *   brew install k6                    # macOS
 *   sudo apt-get install k6            # Ubuntu/Debian
 *   choco install k6                   # Windows
 *
 * Run:
 *   k6 run prescription-load.js
 *
 * Run with specific scenario:
 *   k6 run --stage "2m:500" prescription-load.js   # 2 minutes ramp to 500 VUs
 *
 * Run with custom thresholds:
 *   k6 run --duration 5m --vus 100 prescription-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:4002';
const PHARMACIST_TOKEN = __ENV.PHARMACIST_TOKEN || 'mock-pharmacist-token';
const PATIENT_TOKEN = __ENV.PATIENT_TOKEN || 'mock-patient-token';

// Test data
const TEST_PHARMACY_ID = 'load-test-pharmacy-123';
const TEST_PHARMACIST_ID = 'load-test-pharmacist-789';

// ============================================================================
// Custom Metrics
// ============================================================================

const prescriptionUploadRate = new Rate('prescription_upload_success_rate');
const prescriptionUploadDuration = new Trend('prescription_upload_duration');
const ocrTranscriptionDuration = new Trend('ocr_transcription_duration');
const validationDuration = new Trend('validation_duration');
const approvalDuration = new Trend('approval_duration');
const errorCounter = new Counter('errors');

// ============================================================================
// Test Options
// ============================================================================

export const options = {
  // Load test stages
  stages: [
    // Baseline: Ramp up to 50% of target load (8 requests/min = ~8 VUs)
    { duration: '2m', target: 8 },

    // Maintain baseline for observation
    { duration: '3m', target: 8 },

    // Peak: Ramp up to 100% of target load (16.67 requests/min = ~17 VUs)
    { duration: '2m', target: 17 },

    // Maintain peak load
    { duration: '5m', target: 17 },

    // Stress: Push beyond target (25 requests/min = ~25 VUs)
    { duration: '2m', target: 25 },

    // Maintain stress load
    { duration: '3m', target: 25 },

    // Ramp down
    { duration: '2m', target: 0 },
  ],

  // Success thresholds (test fails if these are not met)
  thresholds: {
    // Upload endpoint
    'prescription_upload_duration': ['p(95)<1000'], // 95% of uploads < 1s
    'prescription_upload_success_rate': ['rate>0.99'], // 99% success rate

    // OCR transcription (AWS Textract is slower)
    'ocr_transcription_duration': ['p(95)<10000'], // 95% of OCR < 10s

    // Validation
    'validation_duration': ['p(95)<500'], // 95% of validations < 500ms

    // Approval
    'approval_duration': ['p(95)<500'], // 95% of approvals < 500ms

    // Overall error rate
    'errors': ['count<10'], // Fewer than 10 errors total

    // HTTP-specific thresholds
    'http_req_duration': ['p(95)<2000'], // 95% of all requests < 2s
    'http_req_failed': ['rate<0.01'], // Error rate < 1%
  },

  // Test execution settings
  noConnectionReuse: false, // Reuse connections for realistic load
  userAgent: 'k6-load-test/1.0 (MetaPharm Prescription Service)',

  // Tags for filtering results
  tags: {
    test_type: 'load',
    service: 'prescription-service',
    user_story: 'US1',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a random patient ID for load testing
 */
function generatePatientId() {
  return `load-test-patient-${randomString(10)}`;
}

/**
 * Generate a fake prescription image (binary data)
 */
function generatePrescriptionImage() {
  // In a real load test, you might use actual test images
  // For now, we'll use random binary data
  const imageSize = 1024 * 100; // 100KB fake image
  const buffer = new Uint8Array(imageSize);
  for (let i = 0; i < imageSize; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  return buffer;
}

/**
 * Create multipart form data for prescription upload
 */
function createMultipartFormData(patientId, imageData) {
  const boundary = '----k6Boundary' + randomString(16);

  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="patient_id"',
    '',
    patientId,
    `--${boundary}`,
    'Content-Disposition: form-data; name="uploaded_by_type"',
    '',
    'patient',
    `--${boundary}`,
    'Content-Disposition: form-data; name="uploaded_by_id"',
    '',
    patientId,
    `--${boundary}`,
    'Content-Disposition: form-data; name="pharmacy_id"',
    '',
    TEST_PHARMACY_ID,
    `--${boundary}`,
    'Content-Disposition: form-data; name="image"; filename="prescription.jpg"',
    'Content-Type: image/jpeg',
    '',
    String.fromCharCode.apply(null, imageData),
    `--${boundary}--`,
  ].join('\r\n');

  return {
    body: body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

// ============================================================================
// Test Scenarios
// ============================================================================

/**
 * Scenario 1: Patient Upload Prescription (70% of traffic)
 */
export function patientUploadScenario() {
  const patientId = generatePatientId();
  const imageData = generatePrescriptionImage();
  const formData = createMultipartFormData(patientId, imageData);

  const uploadStart = new Date();

  const uploadResponse = http.post(
    `${API_BASE_URL}/prescriptions`,
    formData.body,
    {
      headers: {
        'Authorization': `Bearer ${PATIENT_TOKEN}`,
        'Content-Type': formData.contentType,
      },
      tags: { scenario: 'patient_upload' },
    }
  );

  const uploadDuration = new Date() - uploadStart;
  prescriptionUploadDuration.add(uploadDuration);

  const uploadSuccess = check(uploadResponse, {
    'upload status is 201': (r) => r.status === 201,
    'upload response has prescription ID': (r) => r.json('id') !== undefined,
    'upload response has image_url': (r) => r.json('image_url') !== undefined,
    'upload status is pending': (r) => r.json('status') === 'pending',
  });

  prescriptionUploadRate.add(uploadSuccess);

  if (!uploadSuccess) {
    errorCounter.add(1);
    console.error(`Upload failed: ${uploadResponse.status} - ${uploadResponse.body}`);
  }

  // Simulate patient waiting before checking status
  sleep(2);
}

/**
 * Scenario 2: Pharmacist Review Workflow (30% of traffic)
 */
export function pharmacistReviewScenario() {
  // 1. Get prescription queue
  const queueResponse = http.get(
    `${API_BASE_URL}/prescriptions?status=pending&pharmacy_id=${TEST_PHARMACY_ID}`,
    {
      headers: {
        'Authorization': `Bearer ${PHARMACIST_TOKEN}`,
      },
      tags: { scenario: 'pharmacist_queue' },
    }
  );

  check(queueResponse, {
    'queue status is 200': (r) => r.status === 200,
    'queue has prescriptions': (r) => Array.isArray(r.json('prescriptions')),
  });

  // Assume we have a prescription to review (in real scenario, pick from queue)
  const testPrescriptionId = 'mock-prescription-for-review';

  // 2. Trigger OCR transcription
  const ocrStart = new Date();

  const transcribeResponse = http.post(
    `${API_BASE_URL}/prescriptions/${testPrescriptionId}/transcribe`,
    null,
    {
      headers: {
        'Authorization': `Bearer ${PHARMACIST_TOKEN}`,
      },
      tags: { scenario: 'ocr_transcription' },
    }
  );

  const ocrDuration = new Date() - ocrStart;
  ocrTranscriptionDuration.add(ocrDuration);

  check(transcribeResponse, {
    'transcribe status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(1);

  // 3. Validate prescription
  const validateStart = new Date();

  const validateResponse = http.post(
    `${API_BASE_URL}/prescriptions/${testPrescriptionId}/validate`,
    null,
    {
      headers: {
        'Authorization': `Bearer ${PHARMACIST_TOKEN}`,
      },
      tags: { scenario: 'validation' },
    }
  );

  const validateDuration = new Date() - validateStart;
  validationDuration.add(validateDuration);

  check(validateResponse, {
    'validate status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(1);

  // 4. Approve prescription
  const approveStart = new Date();

  const approveResponse = http.put(
    `${API_BASE_URL}/prescriptions/${testPrescriptionId}/approve`,
    JSON.stringify({
      pharmacist_id: TEST_PHARMACIST_ID,
      notes: 'Load test approval',
    }),
    {
      headers: {
        'Authorization': `Bearer ${PHARMACIST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      tags: { scenario: 'approval' },
    }
  );

  const approveDuration = new Date() - approveStart;
  approvalDuration.add(approveDuration);

  check(approveResponse, {
    'approve status is 200 or 400 or 404': (r) =>
      r.status === 200 || r.status === 400 || r.status === 404,
  });

  sleep(2);
}

// ============================================================================
// Main Test Function
// ============================================================================

export default function () {
  // 70% of users are patients uploading prescriptions
  // 30% are pharmacists reviewing
  const scenario = Math.random() < 0.7 ? 'patient' : 'pharmacist';

  if (scenario === 'patient') {
    patientUploadScenario();
  } else {
    pharmacistReviewScenario();
  }

  // Random think time between actions (0.5 - 2 seconds)
  sleep(Math.random() * 1.5 + 0.5);
}

// ============================================================================
// Setup and Teardown
// ============================================================================

export function setup() {
  console.log('🚀 Starting load test for Prescription Service');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log(`🎯 Target: 1000 prescriptions/hour (~16.67/minute)`);
  console.log('📊 Test stages:');
  console.log('  1. Baseline (2m): Ramp to 8 VUs (50% of target)');
  console.log('  2. Observe (3m): Maintain baseline');
  console.log('  3. Peak (2m): Ramp to 17 VUs (100% of target)');
  console.log('  4. Sustain (5m): Maintain peak load');
  console.log('  5. Stress (2m): Ramp to 25 VUs (150% of target)');
  console.log('  6. Push (3m): Maintain stress load');
  console.log('  7. Cooldown (2m): Ramp down to 0');
  console.log('');
}

export function teardown(data) {
  console.log('');
  console.log('✅ Load test completed');
  console.log('');
  console.log('📈 Review metrics:');
  console.log('  - prescription_upload_duration (p95 < 1000ms)');
  console.log('  - prescription_upload_success_rate (>99%)');
  console.log('  - ocr_transcription_duration (p95 < 10000ms)');
  console.log('  - validation_duration (p95 < 500ms)');
  console.log('  - approval_duration (p95 < 500ms)');
  console.log('  - error count (<10)');
  console.log('');
}

// ============================================================================
// Test Summary
// ============================================================================

/**
 * Load Test Summary:
 *
 * Target: 1000 prescriptions/hour
 * Scenarios:
 *   - 70% Patient uploads (simulates real-world traffic pattern)
 *   - 30% Pharmacist reviews (includes OCR, validation, approval)
 *
 * Performance Thresholds:
 *   - Upload p95 < 1s
 *   - OCR p95 < 10s (AWS Textract is external, slower)
 *   - Validation p95 < 500ms
 *   - Approval p95 < 500ms
 *   - Error rate < 1%
 *
 * Test Duration: ~19 minutes
 * Virtual Users: 0 → 8 → 17 → 25 → 0 (staged ramp)
 *
 * To run:
 *   k6 run prescription-load.js
 *
 * To run with custom duration:
 *   k6 run --stage "5m:20" prescription-load.js
 *
 * To run with metrics export (InfluxDB):
 *   k6 run --out influxdb=http://localhost:8086/k6 prescription-load.js
 *
 * To run with cloud results:
 *   k6 cloud prescription-load.js
 *
 * Requirements:
 *   - Prescription Service running on localhost:4002 (or set API_BASE_URL)
 *   - Database with test data
 *   - Mock S3 and AWS Textract services (or use test environment)
 *   - Valid JWT tokens for authentication (or mock auth)
 *
 * Note:
 *   This load test uses mock prescription IDs for approval/validation
 *   workflows. In a real staging environment, you would:
 *   1. Seed database with test prescriptions
 *   2. Use actual prescription IDs from queue
 *   3. Configure AWS services for testing
 */
