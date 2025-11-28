/**
 * Medical Records Service Unit Tests
 * Tests for medical records API endpoints and repository
 */

import request from 'supertest';
import { DataSource } from 'typeorm';
import app from '../index';
import { AppDataSource, initializeDatabase, closeDatabase } from '../config/database';
import { MedicalRecordRepository } from '../repository/MedicalRecordRepository';
import { MedicalRecord } from '../models/MedicalRecord';

describe('Medical Records Service', () => {
  let dataSource: DataSource;
  let repository: MedicalRecordRepository;

  beforeAll(async () => {
    // Initialize test database
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'medical_records_test';
    dataSource = await initializeDatabase();
    repository = new MedicalRecordRepository(dataSource);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear database before each test
    await dataSource.getRepository(MedicalRecord).clear();
    await dataSource.getRepository('AccessLog').clear();
  });

  // ============================================================================
  // Health Check Tests
  // ============================================================================

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('medical-records-service');
      expect(response.body.database).toBe('connected');
    });
  });

  // ============================================================================
  // Repository Tests
  // ============================================================================

  describe('MedicalRecordRepository', () => {
    it('should create a medical record', async () => {
      const recordData = {
        patientId: 'patient-123',
        recordType: 'allergy' as const,
        title: 'Penicillin Allergy',
        description: 'Severe reaction',
        data: { severity: 'high' },
        consentGiven: true,
      };

      const record = await repository.create(recordData);

      expect(record.id).toBeDefined();
      expect(record.patientId).toBe('patient-123');
      expect(record.recordType).toBe('allergy');
      expect(record.title).toBe('Penicillin Allergy');
      expect(record.active).toBe(true);
    });

    it('should find records by patient ID', async () => {
      // Create multiple records
      await repository.create({
        patientId: 'patient-123',
        recordType: 'allergy',
        title: 'Allergy 1',
        consentGiven: true,
      });
      await repository.create({
        patientId: 'patient-123',
        recordType: 'medication',
        title: 'Medication 1',
        consentGiven: true,
      });
      await repository.create({
        patientId: 'patient-456',
        recordType: 'allergy',
        title: 'Allergy 2',
        consentGiven: true,
      });

      const records = await repository.findByPatientId('patient-123');

      expect(records).toHaveLength(2);
      expect(records[0].patientId).toBe('patient-123');
      expect(records[1].patientId).toBe('patient-123');
    });

    it('should find records by type', async () => {
      await repository.create({
        patientId: 'patient-123',
        recordType: 'allergy',
        title: 'Allergy 1',
        consentGiven: true,
      });
      await repository.create({
        patientId: 'patient-123',
        recordType: 'medication',
        title: 'Medication 1',
        consentGiven: true,
      });

      const allergies = await repository.findByPatientIdAndType('patient-123', 'allergy');

      expect(allergies).toHaveLength(1);
      expect(allergies[0].recordType).toBe('allergy');
    });

    it('should log access to medical records', async () => {
      const record = await repository.create({
        patientId: 'patient-123',
        recordType: 'allergy',
        title: 'Test Record',
        consentGiven: true,
      });

      const log = await repository.logAccess({
        recordId: record.id,
        patientId: 'patient-123',
        userId: 'pharmacist-456',
        userRole: 'pharmacist',
        action: 'view',
        ipAddress: '127.0.0.1',
      });

      expect(log.id).toBeDefined();
      expect(log.recordId).toBe(record.id);
      expect(log.action).toBe('view');
    });

    it('should deactivate a record (soft delete)', async () => {
      const record = await repository.create({
        patientId: 'patient-123',
        recordType: 'allergy',
        title: 'Test Record',
        consentGiven: true,
      });

      await repository.deactivate(record.id);

      const foundActive = await repository.findByPatientId('patient-123', true);
      const foundAll = await repository.findByPatientId('patient-123', false);

      expect(foundActive).toHaveLength(0);
      expect(foundAll).toHaveLength(1);
      expect(foundAll[0].active).toBe(false);
    });
  });

  // ============================================================================
  // API Endpoint Tests
  // ============================================================================

  describe('POST /medical-records', () => {
    it('should create a medical record with valid data', async () => {
      const response = await request(app)
        .post('/medical-records')
        .set('X-User-Id', 'patient-123')
        .set('X-User-Role', 'patient')
        .send({
          patientId: 'patient-123',
          recordType: 'allergy',
          title: 'Peanut Allergy',
          description: 'Severe allergic reaction',
          consentGiven: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Medical record created successfully');
      expect(response.body.record.id).toBeDefined();
      expect(response.body.record.title).toBe('Peanut Allergy');
    });

    it('should reject invalid record type', async () => {
      const response = await request(app)
        .post('/medical-records')
        .set('X-User-Id', 'patient-123')
        .set('X-User-Role', 'patient')
        .send({
          patientId: 'patient-123',
          recordType: 'invalid_type',
          title: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/medical-records')
        .set('X-User-Id', 'patient-123')
        .set('X-User-Role', 'patient')
        .send({
          patientId: 'patient-123',
          // Missing recordType and title
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /medical-records/patient/:patientId', () => {
    it('should fetch patient records', async () => {
      // Create test records
      await repository.create({
        patientId: 'patient-123',
        recordType: 'allergy',
        title: 'Test Allergy',
        consentGiven: true,
      });
      await repository.create({
        patientId: 'patient-123',
        recordType: 'medication',
        title: 'Test Medication',
        consentGiven: true,
      });

      const response = await request(app)
        .get('/medical-records/patient/patient-123')
        .set('X-User-Id', 'patient-123')
        .set('X-User-Role', 'patient');

      expect(response.status).toBe(200);
      expect(response.body.recordCount).toBe(2);
      expect(response.body.records).toHaveLength(2);
    });

    it('should enforce role-based filtering for pharmacists', async () => {
      // Create records of different types
      await repository.create({
        patientId: 'patient-123',
        recordType: 'allergy',
        title: 'Test Allergy',
        consentGiven: true,
      });
      await repository.create({
        patientId: 'patient-123',
        recordType: 'diagnosis',
        title: 'Test Diagnosis',
        consentGiven: true,
      });

      const response = await request(app)
        .get('/medical-records/patient/patient-123')
        .set('X-User-Id', 'pharmacist-456')
        .set('X-User-Role', 'pharmacist')
        .set('X-Hin-Token', 'stub_hin_token_123');

      expect(response.status).toBe(200);
      // Pharmacist should only see allergy (not diagnosis)
      expect(response.body.records).toHaveLength(1);
      expect(response.body.records[0].recordType).toBe('allergy');
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .get('/medical-records/patient/patient-123')
        .set('X-User-Id', 'patient-456')
        .set('X-User-Role', 'patient');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/medical-records/patient/patient-123');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /medical-records/patient/:patientId/type/:recordType', () => {
    it('should filter records by type', async () => {
      await repository.create({
        patientId: 'patient-123',
        recordType: 'allergy',
        title: 'Allergy 1',
        consentGiven: true,
      });
      await repository.create({
        patientId: 'patient-123',
        recordType: 'allergy',
        title: 'Allergy 2',
        consentGiven: true,
      });
      await repository.create({
        patientId: 'patient-123',
        recordType: 'medication',
        title: 'Medication 1',
        consentGiven: true,
      });

      const response = await request(app)
        .get('/medical-records/patient/patient-123/type/allergy')
        .set('X-User-Id', 'patient-123')
        .set('X-User-Role', 'patient');

      expect(response.status).toBe(200);
      expect(response.body.recordType).toBe('allergy');
      expect(response.body.records).toHaveLength(2);
    });
  });

  describe('PATCH /medical-records/:id', () => {
    it('should update a medical record', async () => {
      const record = await repository.create({
        patientId: 'patient-123',
        recordType: 'allergy',
        title: 'Original Title',
        consentGiven: true,
      });

      const response = await request(app)
        .patch(`/medical-records/${record.id}`)
        .set('X-User-Id', 'patient-123')
        .set('X-User-Role', 'patient')
        .send({
          title: 'Updated Title',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Medical record updated successfully');
      expect(response.body.record.title).toBe('Updated Title');
    });

    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .patch('/medical-records/non-existent-id')
        .set('X-User-Id', 'patient-123')
        .set('X-User-Role', 'patient')
        .send({
          title: 'Updated Title',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('POST /medical-records/sync-esante', () => {
    it('should sync records from e-santé (stub)', async () => {
      const response = await request(app)
        .post('/medical-records/sync-esante')
        .set('X-User-Id', 'pharmacist-456')
        .set('X-User-Role', 'pharmacist')
        .set('X-Hin-Token', 'stub_hin_token_123')
        .send({
          patientId: 'patient-123',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('e-santé records synced successfully');
      expect(response.body.syncedCount).toBeGreaterThanOrEqual(0);
    });

    it('should require HIN token for sync', async () => {
      const response = await request(app)
        .post('/medical-records/sync-esante')
        .set('X-User-Id', 'pharmacist-456')
        .set('X-User-Role', 'pharmacist')
        .send({
          patientId: 'patient-123',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  });
});
