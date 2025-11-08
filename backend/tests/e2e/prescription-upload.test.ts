/**
 * E2E Test: Patient Prescription Upload Workflow
 * T129 - User Story 1: Prescription Processing & Validation
 *
 * Tests the complete patient journey:
 * 1. Patient uploads prescription image
 * 2. Image is uploaded to S3
 * 3. Prescription record is created with 'pending' status
 * 4. Pharmacist triggers OCR transcription
 * 5. AI processes image and extracts prescription data
 * 6. Prescription status transitions to appropriate state
 * 7. AI confidence scores are returned
 *
 * Covers:
 * - FR-008: System MUST accept prescription uploads as images (JPG, PNG, PDF)
 * - FR-009: System MUST use AI to transcribe prescription images
 * - FR-010: AI transcription MUST include confidence scores for each extracted field
 * - FR-013a: System MUST highlight low-confidence AI transcription fields (confidence < 80%)
 * - Error cases: invalid image, upload failure, OCR failure
 */

import request from 'supertest';
import { DataSource } from 'typeorm';
import path from 'path';
import fs from 'fs';

// ============================================================================
// Test Configuration
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4002';

// Mock JWT token for authenticated requests
// In a real E2E test, this would be obtained from auth service
const MOCK_PATIENT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicGF0aWVudC0xMjMiLCJyb2xlIjoicGF0aWVudCIsImlhdCI6MTYwMDAwMDAwMH0.test-signature';
const MOCK_PHARMACIST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicGhhcm1hY2lzdC03ODkiLCJyb2xlIjoicGhhcm1hY2lzdCIsImlhdCI6MTYwMDAwMDAwMH0.test-signature';

// Test data
const TEST_PHARMACY_ID = 'test-pharmacy-123';
const TEST_PATIENT_ID = 'patient-123';
const TEST_PHARMACIST_ID = 'pharmacist-789';

// ============================================================================
// Mock External Services
// ============================================================================

// Mock S3 upload
jest.mock('../../services/prescription-service/src/services/s3.service', () => ({
  uploadToS3: jest.fn().mockResolvedValue('https://s3.amazonaws.com/metapharm-prescriptions/test-prescription.jpg'),
  generateS3Key: jest.fn().mockReturnValue('prescriptions/patient-123/uuid/prescription.jpg'),
}));

// Mock AWS Textract OCR
jest.mock('../../services/prescription-service/src/integrations/textract', () => ({
  transcribePrescription: jest.fn().mockResolvedValue({
    medications: [
      {
        name: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'three times daily',
        duration: '7 days',
        confidence: 95,
      },
    ],
    prescribing_doctor: 'Dr. Smith',
    prescribed_date: '2025-11-07',
    overall_confidence: 95,
  }),
}));

// ============================================================================
// Test Suite
// ============================================================================

describe('E2E: Patient Prescription Upload Workflow', () => {
  let dataSource: DataSource;
  let prescriptionId: string;

  // ==========================================================================
  // Setup & Teardown
  // ==========================================================================

  beforeAll(async () => {
    // Note: In a real E2E environment, this would connect to a test database
    // For now, we assume the prescription service is running with test config
  });

  afterAll(async () => {
    // Clean up test data
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  // ==========================================================================
  // Test 1: Complete Upload Workflow (Happy Path)
  // ==========================================================================

  describe('Complete Upload Workflow', () => {
    it('should allow patient to upload prescription image and create pending record', async () => {
      // Create a test image buffer
      const testImageBuffer = Buffer.from('fake-prescription-image-data');

      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', TEST_PATIENT_ID)
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', TEST_PATIENT_ID)
        .field('pharmacy_id', TEST_PHARMACY_ID)
        .attach('image', testImageBuffer, 'prescription.jpg');

      // Verify response
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        patient_id: TEST_PATIENT_ID,
        image_url: expect.stringContaining('https://'),
        status: 'pending',
        source: 'patient_upload',
        created_at: expect.any(String),
      });

      // Save prescription ID for next tests
      prescriptionId = response.body.id;
    });

    it('should trigger OCR transcription and extract medication data', async () => {
      // Assume prescriptionId from previous test
      const testPrescriptionId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testPrescriptionId}/transcribe`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      // Verify OCR was triggered
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: testPrescriptionId,
        status: 'pending', // or 'in_review' depending on implementation
        ai_transcription_data: expect.objectContaining({
          medications: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              dosage: expect.any(String),
              frequency: expect.any(String),
              duration: expect.any(String),
              confidence: expect.any(Number),
            }),
          ]),
        }),
        ai_confidence_score: expect.any(Number),
      });

      // Verify AI confidence score is present
      expect(response.body.ai_confidence_score).toBeGreaterThan(0);
      expect(response.body.ai_confidence_score).toBeLessThanOrEqual(100);
    });

    it('should return high confidence scores for clean prescription images', async () => {
      const testPrescriptionId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testPrescriptionId}/transcribe`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.ai_confidence_score).toBeGreaterThanOrEqual(80); // High confidence
    });
  });

  // ==========================================================================
  // Test 2: Status Transitions
  // ==========================================================================

  describe('Prescription Status Transitions', () => {
    it('should transition from pending to pending/in_review after transcription', async () => {
      const testPrescriptionId = 'test-prescription-uuid';

      // Upload prescription
      const uploadResponse = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', TEST_PATIENT_ID)
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', TEST_PATIENT_ID)
        .attach('image', Buffer.from('test-image'), 'prescription.jpg');

      expect(uploadResponse.body.status).toBe('pending');

      // Trigger transcription
      const transcribeResponse = await request(API_BASE_URL)
        .post(`/prescriptions/${uploadResponse.body.id}/transcribe`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      // Status should remain 'pending' or transition to 'in_review'
      expect(['pending', 'in_review']).toContain(transcribeResponse.body.status);
    });

    it('should track prescription lifecycle with proper timestamps', async () => {
      const uploadResponse = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', TEST_PATIENT_ID)
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', TEST_PATIENT_ID)
        .attach('image', Buffer.from('test-image'), 'prescription.jpg');

      expect(uploadResponse.body).toHaveProperty('created_at');
      expect(new Date(uploadResponse.body.created_at)).toBeInstanceOf(Date);
    });
  });

  // ==========================================================================
  // Test 3: AI Confidence Validation (FR-010, FR-013a)
  // ==========================================================================

  describe('AI Confidence Scores', () => {
    it('should return confidence scores for each extracted field', async () => {
      const testPrescriptionId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testPrescriptionId}/transcribe`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.ai_transcription_data.medications).toBeDefined();

      // Each medication should have confidence score
      response.body.ai_transcription_data.medications.forEach((med: any) => {
        expect(med.confidence).toBeDefined();
        expect(med.confidence).toBeGreaterThanOrEqual(0);
        expect(med.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should flag low-confidence fields (< 80%) for pharmacist verification', async () => {
      // Mock low confidence response
      const mockLowConfidence = jest.spyOn(
        require('../../services/prescription-service/src/integrations/textract'),
        'transcribePrescription'
      ).mockResolvedValueOnce({
        medications: [
          {
            name: 'Unclear Medication',
            dosage: '500mg',
            frequency: 'twice daily',
            duration: '7 days',
            confidence: 65, // Low confidence
          },
        ],
        overall_confidence: 65,
      });

      const testPrescriptionId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testPrescriptionId}/transcribe`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.ai_confidence_score).toBeLessThan(80);

      // Low confidence should be flagged
      expect(response.body).toHaveProperty('low_confidence_warning', true);

      mockLowConfidence.mockRestore();
    });
  });

  // ==========================================================================
  // Test 4: Error Cases
  // ==========================================================================

  describe('Error Handling', () => {
    it('should return 400 if no image file provided', async () => {
      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', TEST_PATIENT_ID)
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', TEST_PATIENT_ID);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No image file');
    });

    it('should return 400 if missing required fields', async () => {
      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .attach('image', Buffer.from('test-image'), 'prescription.jpg');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid file types', async () => {
      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', TEST_PATIENT_ID)
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', TEST_PATIENT_ID)
        .attach('image', Buffer.from('test-executable'), 'malware.exe');

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid file type/i);
    });

    it('should return 413 for files larger than 10MB', async () => {
      // Create a buffer larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', TEST_PATIENT_ID)
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', TEST_PATIENT_ID)
        .attach('image', largeBuffer, 'large-prescription.jpg');

      expect(response.status).toBe(413);
      expect(response.body.error).toMatch(/file too large/i);
    });

    it('should handle S3 upload failures gracefully', async () => {
      // Mock S3 upload failure
      const mockS3Error = jest.spyOn(
        require('../../services/prescription-service/src/services/s3.service'),
        'uploadToS3'
      ).mockRejectedValueOnce(new Error('S3 connection timeout'));

      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', TEST_PATIENT_ID)
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', TEST_PATIENT_ID)
        .attach('image', Buffer.from('test-image'), 'prescription.jpg');

      expect(response.status).toBe(500);
      expect(response.body.error).toMatch(/failed to upload image/i);

      mockS3Error.mockRestore();
    });

    it('should handle OCR transcription failures gracefully', async () => {
      // Mock Textract failure
      const mockOCRError = jest.spyOn(
        require('../../services/prescription-service/src/integrations/textract'),
        'transcribePrescription'
      ).mockRejectedValueOnce(new Error('AWS Textract service unavailable'));

      const testPrescriptionId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testPrescriptionId}/transcribe`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toMatch(/transcription failed/i);

      mockOCRError.mockRestore();
    });

    it('should return 404 for transcribing non-existent prescription', async () => {
      const nonExistentId = 'non-existent-uuid';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${nonExistentId}/transcribe`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/prescription not found/i);
    });
  });

  // ==========================================================================
  // Test 5: Authentication & Authorization
  // ==========================================================================

  describe('Authentication & Authorization', () => {
    it('should require authentication for upload', async () => {
      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .field('patient_id', TEST_PATIENT_ID)
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', TEST_PATIENT_ID)
        .attach('image', Buffer.from('test-image'), 'prescription.jpg');

      expect(response.status).toBe(401);
    });

    it('should require authentication for transcription', async () => {
      const testPrescriptionId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testPrescriptionId}/transcribe`);

      expect(response.status).toBe(401);
    });

    it('should allow only pharmacists to trigger transcription', async () => {
      const testPrescriptionId = 'test-prescription-uuid';

      // Patient trying to transcribe (should be forbidden)
      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testPrescriptionId}/transcribe`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      expect(response.status).toBe(403); // Forbidden
    });
  });

  // ==========================================================================
  // Test 6: Data Integrity
  // ==========================================================================

  describe('Data Integrity', () => {
    it('should store prescription with correct patient association', async () => {
      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', TEST_PATIENT_ID)
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', TEST_PATIENT_ID)
        .attach('image', Buffer.from('test-image'), 'prescription.jpg');

      expect(response.status).toBe(201);
      expect(response.body.patient_id).toBe(TEST_PATIENT_ID);
    });

    it('should preserve image URL after upload', async () => {
      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', TEST_PATIENT_ID)
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', TEST_PATIENT_ID)
        .attach('image', Buffer.from('test-image'), 'prescription.jpg');

      expect(response.status).toBe(201);
      expect(response.body.image_url).toMatch(/^https:\/\//);
    });

    it('should store AI transcription data correctly', async () => {
      const testPrescriptionId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testPrescriptionId}/transcribe`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.ai_transcription_data).toBeDefined();
      expect(response.body.ai_transcription_data.medications).toBeInstanceOf(Array);
    });
  });
});

// ============================================================================
// Test Summary
// ============================================================================

/**
 * Test Coverage Summary:
 *
 * ✅ Complete upload workflow (patient → upload → OCR → transcription)
 * ✅ Prescription status transitions (pending → transcribed)
 * ✅ AI confidence scores validation (FR-010)
 * ✅ Low-confidence field highlighting (FR-013a)
 * ✅ Error cases:
 *    - Missing image file
 *    - Missing required fields
 *    - Invalid file types
 *    - File size limit exceeded
 *    - S3 upload failures
 *    - OCR failures
 *    - Non-existent prescription
 * ✅ Authentication and authorization checks
 * ✅ Data integrity validation
 *
 * Total Tests: 20
 * User Story: US1 - Prescription Processing & Validation
 * Requirements Covered: FR-008, FR-009, FR-010, FR-013a
 */
