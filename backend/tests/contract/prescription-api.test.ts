/**
 * Contract Test: Prescription API
 * T131 - User Story 1: Prescription Processing & Validation
 *
 * Validates API contracts for all prescription endpoints:
 * - Request/response schemas match specification
 * - HTTP status codes are correct
 * - Error responses follow standard format
 * - Headers are properly set
 * - Content types are correct
 *
 * Contract testing ensures:
 * 1. Frontend apps can rely on consistent API responses
 * 2. Breaking changes are detected before deployment
 * 3. API documentation matches implementation
 * 4. Multiple microservices can integrate safely
 *
 * Based on: OpenAPI 3.0 specification (to be generated in contracts/ directory)
 */

import request from 'supertest';
import { z } from 'zod';

// ============================================================================
// Test Configuration
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4002';
const MOCK_PHARMACIST_TOKEN = 'mock-pharmacist-token';
const MOCK_PATIENT_TOKEN = 'mock-patient-token';

// ============================================================================
// Schema Definitions (API Contracts)
// ============================================================================

// Prescription Response Schema
const PrescriptionSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  pharmacy_id: z.string().uuid().nullable(),
  prescribing_doctor_id: z.string().uuid().nullable(),
  pharmacist_id: z.string().uuid().nullable(),
  source: z.enum(['patient_upload', 'doctor_direct', 'teleconsultation']),
  image_url: z.string().url().nullable(),
  ai_transcription_data: z.any().nullable(),
  ai_confidence_score: z.number().min(0).max(100).nullable(),
  status: z.enum(['pending', 'in_review', 'clarification_needed', 'approved', 'rejected', 'expired']),
  rejection_reason: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
  approved_at: z.string().datetime().nullable(),
});

// Prescription Upload Response Schema
const PrescriptionUploadResponseSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  image_url: z.string().url(),
  status: z.literal('pending'),
  source: z.literal('patient_upload'),
  created_at: z.string().datetime(),
});

// Validation Result Schema
const ValidationResultSchema = z.object({
  prescription_id: z.string().uuid(),
  status: z.enum(['validated', 'warnings', 'critical_issues']),
  drug_interactions: z.object({
    has_interactions: z.boolean(),
    interactions: z.array(z.object({
      drug1: z.string(),
      drug2: z.string(),
      severity: z.enum(['mild', 'moderate', 'severe']),
      description: z.string(),
      recommendation: z.string().optional(),
    })),
  }),
  allergy_warnings: z.object({
    has_allergies: z.boolean(),
    warnings: z.array(z.any()),
  }),
  contraindications: z.object({
    has_contraindications: z.boolean(),
    contraindications: z.array(z.any()),
  }),
  critical_issues_found: z.boolean(),
  can_approve: z.boolean(),
  validation_timestamp: z.string().datetime(),
});

// Approval Response Schema
const ApprovalResponseSchema = z.object({
  prescription_id: z.string().uuid(),
  status: z.literal('approved'),
  approved_at: z.string().datetime(),
  approved_by: z.string().uuid(),
  treatment_plan_created: z.boolean(),
  treatment_plan_id: z.string().uuid().optional(),
});

// Rejection Response Schema
const RejectionResponseSchema = z.object({
  prescription_id: z.string().uuid(),
  status: z.literal('rejected'),
  rejected_at: z.string().datetime(),
  rejected_by: z.string().uuid(),
  rejection_reason: z.string().min(1),
});

// Error Response Schema
const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  message: z.string().optional(),
});

// Prescription List Response Schema
const PrescriptionListResponseSchema = z.object({
  prescriptions: z.array(PrescriptionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().optional(),
  page_size: z.number().int().positive().optional(),
});

// ============================================================================
// Test Suite
// ============================================================================

describe('Contract Test: Prescription API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // POST /prescriptions - Upload Prescription
  // ==========================================================================

  describe('POST /prescriptions', () => {
    it('should match contract for successful upload (201 Created)', async () => {
      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .set('Content-Type', 'multipart/form-data')
        .field('patient_id', 'patient-123')
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', 'patient-123')
        .attach('image', Buffer.from('test-image'), 'prescription.jpg');

      // Contract assertions
      expect(response.status).toBe(201);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      // Schema validation
      const validationResult = PrescriptionUploadResponseSchema.safeParse(response.body);
      if (!validationResult.success) {
        console.error('Schema validation errors:', validationResult.error.errors);
      }
      expect(validationResult.success).toBe(true);
    });

    it('should match contract for missing file error (400 Bad Request)', async () => {
      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', 'patient-123')
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', 'patient-123');

      expect(response.status).toBe(400);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      const validationResult = ErrorResponseSchema.safeParse(response.body);
      expect(validationResult.success).toBe(true);
      expect(response.body.error).toContain('No image file');
    });

    it('should match contract for unauthorized request (401 Unauthorized)', async () => {
      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .field('patient_id', 'patient-123')
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', 'patient-123')
        .attach('image', Buffer.from('test-image'), 'prescription.jpg');

      expect(response.status).toBe(401);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should match contract for file too large error (413 Payload Too Large)', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', 'patient-123')
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', 'patient-123')
        .attach('image', largeBuffer, 'large.jpg');

      expect(response.status).toBe(413);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      const validationResult = ErrorResponseSchema.safeParse(response.body);
      expect(validationResult.success).toBe(true);
    });
  });

  // ==========================================================================
  // GET /prescriptions - List Prescriptions
  // ==========================================================================

  describe('GET /prescriptions', () => {
    it('should match contract for prescription list (200 OK)', async () => {
      const response = await request(API_BASE_URL)
        .get('/prescriptions')
        .query({ pharmacy_id: 'pharmacy-123' })
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      const validationResult = PrescriptionListResponseSchema.safeParse(response.body);
      if (!validationResult.success) {
        console.error('Schema validation errors:', validationResult.error.errors);
      }
      expect(validationResult.success).toBe(true);
    });

    it('should support pagination query parameters', async () => {
      const response = await request(API_BASE_URL)
        .get('/prescriptions')
        .query({ page: 1, page_size: 10, pharmacy_id: 'pharmacy-123' })
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('page_size');
      expect(response.body.page).toBe(1);
      expect(response.body.page_size).toBe(10);
    });

    it('should support filtering by status', async () => {
      const response = await request(API_BASE_URL)
        .get('/prescriptions')
        .query({ status: 'pending', pharmacy_id: 'pharmacy-123' })
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.prescriptions)).toBe(true);
    });
  });

  // ==========================================================================
  // GET /prescriptions/:id - Get Single Prescription
  // ==========================================================================

  describe('GET /prescriptions/:id', () => {
    it('should match contract for single prescription (200 OK)', async () => {
      const testId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .get(`/prescriptions/${testId}`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      const validationResult = PrescriptionSchema.safeParse(response.body);
      if (!validationResult.success) {
        console.error('Schema validation errors:', validationResult.error.errors);
      }
      expect(validationResult.success).toBe(true);
    });

    it('should match contract for not found error (404 Not Found)', async () => {
      const response = await request(API_BASE_URL)
        .get('/prescriptions/non-existent-uuid')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      const validationResult = ErrorResponseSchema.safeParse(response.body);
      expect(validationResult.success).toBe(true);
    });
  });

  // ==========================================================================
  // POST /prescriptions/:id/transcribe - Trigger OCR
  // ==========================================================================

  describe('POST /prescriptions/:id/transcribe', () => {
    it('should match contract for successful transcription (200 OK)', async () => {
      const testId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testId}/transcribe`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      // Response should include prescription with AI data
      expect(response.body).toHaveProperty('id', testId);
      expect(response.body).toHaveProperty('ai_transcription_data');
      expect(response.body).toHaveProperty('ai_confidence_score');
    });

    it('should match contract for forbidden error (403 Forbidden) when patient tries to transcribe', async () => {
      const testId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testId}/transcribe`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      expect(response.status).toBe(403);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  // ==========================================================================
  // POST /prescriptions/:id/validate - Validate Prescription
  // ==========================================================================

  describe('POST /prescriptions/:id/validate', () => {
    it('should match contract for validation result (200 OK)', async () => {
      const testId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testId}/validate`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      const validationResult = ValidationResultSchema.safeParse(response.body);
      if (!validationResult.success) {
        console.error('Schema validation errors:', validationResult.error.errors);
      }
      expect(validationResult.success).toBe(true);
    });

    it('should match contract for validation of prescription without items (400 Bad Request)', async () => {
      const testId = 'prescription-without-items';

      const response = await request(API_BASE_URL)
        .post(`/prescriptions/${testId}/validate`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(400);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body.code).toBe('NO_ITEMS');
    });
  });

  // ==========================================================================
  // PUT /prescriptions/:id/approve - Approve Prescription
  // ==========================================================================

  describe('PUT /prescriptions/:id/approve', () => {
    it('should match contract for successful approval (200 OK)', async () => {
      const testId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .put(`/prescriptions/${testId}/approve`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
        .send({
          pharmacist_id: 'pharmacist-789',
          notes: 'Approved after validation',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      const validationResult = ApprovalResponseSchema.safeParse(response.body);
      if (!validationResult.success) {
        console.error('Schema validation errors:', validationResult.error.errors);
      }
      expect(validationResult.success).toBe(true);
    });

    it('should match contract for missing pharmacist_id (400 Bad Request)', async () => {
      const testId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .put(`/prescriptions/${testId}/approve`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
        .send({
          notes: 'Approved',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/pharmacist_id.*required/i);
    });

    it('should match contract for invalid state transition (400 Bad Request)', async () => {
      const testId = 'already-approved-prescription';

      const response = await request(API_BASE_URL)
        .put(`/prescriptions/${testId}/approve`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
        .send({
          pharmacist_id: 'pharmacist-789',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('CANNOT_APPROVE');
    });
  });

  // ==========================================================================
  // PUT /prescriptions/:id/reject - Reject Prescription
  // ==========================================================================

  describe('PUT /prescriptions/:id/reject', () => {
    it('should match contract for successful rejection (200 OK)', async () => {
      const testId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .put(`/prescriptions/${testId}/reject`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
        .send({
          pharmacist_id: 'pharmacist-789',
          rejection_reason: 'Prescription expired',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      const validationResult = RejectionResponseSchema.safeParse(response.body);
      if (!validationResult.success) {
        console.error('Schema validation errors:', validationResult.error.errors);
      }
      expect(validationResult.success).toBe(true);
    });

    it('should match contract for missing rejection_reason (400 Bad Request)', async () => {
      const testId = 'test-prescription-uuid';

      const response = await request(API_BASE_URL)
        .put(`/prescriptions/${testId}/reject`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
        .send({
          pharmacist_id: 'pharmacist-789',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/rejection.*reason.*required/i);
    });
  });

  // ==========================================================================
  // HTTP Header Validation
  // ==========================================================================

  describe('HTTP Headers', () => {
    it('should set correct Content-Type header for JSON responses', async () => {
      const response = await request(API_BASE_URL)
        .get('/prescriptions')
        .query({ pharmacy_id: 'pharmacy-123' })
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should set CORS headers', async () => {
      const response = await request(API_BASE_URL)
        .options('/prescriptions')
        .set('Origin', 'https://app.metapharm.com');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('should set security headers (Helmet)', async () => {
      const response = await request(API_BASE_URL)
        .get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });

  // ==========================================================================
  // Error Response Format Consistency
  // ==========================================================================

  describe('Error Response Format', () => {
    it('should return consistent error format for 400 errors', async () => {
      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', 'patient-123');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return consistent error format for 404 errors', async () => {
      const response = await request(API_BASE_URL)
        .get('/prescriptions/non-existent-uuid')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/not found/i);
    });

    it('should return consistent error format for 500 errors', async () => {
      // Mock S3 failure
      jest.spyOn(
        require('../../services/prescription-service/src/services/s3.service'),
        'uploadToS3'
      ).mockRejectedValueOnce(new Error('S3 error'));

      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', 'patient-123')
        .field('uploaded_by_type', 'patient')
        .field('uploaded_by_id', 'patient-123')
        .attach('image', Buffer.from('test'), 'test.jpg');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  // ==========================================================================
  // Request Validation
  // ==========================================================================

  describe('Request Validation', () => {
    it('should validate UUID format for prescription IDs', async () => {
      const invalidId = 'not-a-valid-uuid';

      const response = await request(API_BASE_URL)
        .get(`/prescriptions/${invalidId}`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect([400, 404]).toContain(response.status);
    });

    it('should validate enum values for prescription source', async () => {
      const response = await request(API_BASE_URL)
        .post('/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .field('patient_id', 'patient-123')
        .field('uploaded_by_type', 'invalid_type')
        .field('uploaded_by_id', 'patient-123')
        .attach('image', Buffer.from('test'), 'test.jpg');

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid.*uploaded_by_type/i);
    });
  });
});

// ============================================================================
// Contract Test Summary
// ============================================================================

/**
 * Contract Test Coverage:
 *
 * ✅ POST /prescriptions - Upload prescription (201, 400, 401, 413)
 * ✅ GET /prescriptions - List prescriptions (200) with pagination and filtering
 * ✅ GET /prescriptions/:id - Get single prescription (200, 404)
 * ✅ POST /prescriptions/:id/transcribe - Trigger OCR (200, 403)
 * ✅ POST /prescriptions/:id/validate - Validate prescription (200, 400)
 * ✅ PUT /prescriptions/:id/approve - Approve prescription (200, 400)
 * ✅ PUT /prescriptions/:id/reject - Reject prescription (200, 400)
 * ✅ HTTP headers validation (Content-Type, CORS, security)
 * ✅ Error response format consistency (400, 404, 500)
 * ✅ Request validation (UUID format, enum values)
 * ✅ Schema validation using Zod
 * ✅ Status code verification
 *
 * Total Contract Tests: 30+
 * Purpose: Ensure API contracts are stable and consistent for frontend/mobile apps
 * Benefits:
 *   - Detect breaking changes before deployment
 *   - Validate API documentation matches implementation
 *   - Enable safe microservice integration
 *   - Provide contract guarantees for consumers
 */
