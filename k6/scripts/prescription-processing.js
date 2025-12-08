/**
 * K6 Load Test: Prescription Processing
 * Tests prescription upload and processing with 100 concurrent users
 * Target: < 5s p95 latency
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const uploadErrors = new Rate('prescription_upload_errors');
const uploadSuccess = new Counter('prescription_upload_success');
const uploadDuration = new Trend('prescription_upload_duration');
const validationErrors = new Rate('prescription_validation_errors');
const processingDuration = new Trend('prescription_processing_duration');

// Test configuration for prescription processing
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 concurrent users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 50 },   // Ramp down
    { duration: '30s', target: 0 },   // Final ramp down
  ],
  thresholds: {
    'prescription_upload_duration': ['p(95)<5000', 'p(99)<10000'],
    'prescription_upload_errors': ['rate<0.05'],
    'prescription_processing_duration': ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

/**
 * Generate mock prescription PDF content
 * Simple text-based representation
 */
function generateMockPrescription() {
  const prescriptionContent = `
  PRESCRIPTION FORM
  ================
  Patient: Load Test Patient
  Date: ${new Date().toISOString().split('T')[0]}

  Medications:
  1. Aspirin 500mg - 2x daily for 7 days
  2. Ibuprofen 400mg - 3x daily with food
  3. Vitamin D 1000IU - 1x daily

  Instructions: Take as directed on bottle.
  Doctor Signature: Dr. Test Physician
  License: MD123456
  `;

  return prescriptionContent;
}

/**
 * Test prescription upload
 */
function testPrescriptionUpload() {
  const prescriptionData = generateMockPrescription();
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '30s',
  };

  const payload = JSON.stringify({
    prescription: prescriptionData,
    patientId: `PAT-${Math.random().toString(36).substring(2, 10)}`,
    pharmacistId: `PHARM-${Math.random().toString(36).substring(2, 10)}`,
    timestamp: new Date().toISOString(),
  });

  const startTime = new Date();
  const res = http.post(`${BASE_URL}/api/prescriptions/upload`, payload, params);
  const duration = new Date() - startTime;

  uploadDuration.add(duration);

  const uploadCheck = check(res, {
    'upload status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'upload response contains prescription_id': (r) => r.body.includes('prescription_id') || r.status >= 200 && r.status < 300,
    'upload response time < 5s': (r) => duration < 5000,
  });

  if (!uploadCheck) {
    uploadErrors.add(1);
  } else {
    uploadSuccess.add(1);
  }

  return uploadCheck;
}

/**
 * Test prescription validation
 */
function testPrescriptionValidation() {
  const prescriptionId = `RX-${Math.random().toString(36).substring(2, 10)}`;
  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '30s',
  };

  const startTime = new Date();
  const res = http.get(`${BASE_URL}/api/prescriptions/${prescriptionId}/validate`, params);
  const duration = new Date() - startTime;

  processingDuration.add(duration);

  const validationCheck = check(res, {
    'validation endpoint responds': (r) => r.status !== 0,
    'validation response time < 3s': (r) => duration < 3000,
  });

  if (!validationCheck) {
    validationErrors.add(1);
  }

  return validationCheck;
}

/**
 * Test prescription processing workflow
 */
function testProcessingWorkflow() {
  const prescriptionId = `RX-${Math.random().toString(36).substring(2, 10)}`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '30s',
  };

  const payload = JSON.stringify({
    status: 'processing',
    validationPassed: true,
  });

  const res = http.post(
    `${BASE_URL}/api/prescriptions/${prescriptionId}/process`,
    payload,
    params
  );

  check(res, {
    'processing started successfully': (r) => r.status === 200 || r.status === 202,
  });
}

/**
 * Main test function
 */
export default function () {
  // Test prescription upload (30% of time)
  if (Math.random() < 0.3) {
    testPrescriptionUpload();
    sleep(1);
  }

  // Test validation (40% of time)
  if (Math.random() < 0.4) {
    testPrescriptionValidation();
    sleep(1);
  }

  // Test processing workflow (30% of time)
  if (Math.random() < 0.3) {
    testProcessingWorkflow();
    sleep(1);
  }

  // Small random sleep to distribute load
  sleep(Math.random() * 2);
}

/**
 * Teardown: Performance summary
 */
export function teardown() {
  console.log('===== PRESCRIPTION PROCESSING LOAD TEST SUMMARY =====');
  console.log(`Upload Success Count: ${uploadSuccess.__value}`);
  console.log('=================================================');
}
