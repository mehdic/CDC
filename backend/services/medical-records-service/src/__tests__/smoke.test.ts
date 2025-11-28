/**
 * Smoke Tests
 * Basic tests to ensure service compiles and basic functionality works
 */

describe('Medical Records Service - Smoke Tests', () => {
  describe('Module Imports', () => {
    it('should import models without errors', () => {
      const { MedicalRecord } = require('../models/MedicalRecord');
      const { AccessLog } = require('../models/AccessLog');

      expect(MedicalRecord).toBeDefined();
      expect(AccessLog).toBeDefined();
    });

    it('should import repository without errors', () => {
      const { MedicalRecordRepository } = require('../repository/MedicalRecordRepository');

      expect(MedicalRecordRepository).toBeDefined();
    });

    it('should import controllers without errors', () => {
      const { MedicalRecordsController } = require('../controllers/MedicalRecordsController');

      expect(MedicalRecordsController).toBeDefined();
    });

    it('should import integrations without errors', () => {
      const { HinAuthProvider } = require('../integrations/HinAuthProvider');
      const { ESanteApiClient } = require('../integrations/ESanteApiClient');

      expect(HinAuthProvider).toBeDefined();
      expect(ESanteApiClient).toBeDefined();
    });

    it('should import middleware without errors', () => {
      const accessControl = require('../middleware/accessControl');

      expect(accessControl.authenticate).toBeDefined();
      expect(accessControl.requireRole).toBeDefined();
      expect(accessControl.canAccessPatientRecords).toBeDefined();
    });
  });

  describe('HIN Auth Provider (Stub)', () => {
    it('should authenticate (stub)', async () => {
      const { HinAuthProvider } = require('../integrations/HinAuthProvider');
      const provider = new HinAuthProvider();

      const result = await provider.authenticate('test-user', 'password');

      expect(result.accessToken).toBeDefined();
      expect(result.verified).toBe(true);
    });

    it('should verify token (stub)', async () => {
      const { HinAuthProvider } = require('../integrations/HinAuthProvider');
      const provider = new HinAuthProvider();

      const result = await provider.verifyToken('stub_hin_token_123');

      expect(result).toBe(true);
    });
  });

  describe('E-Santé API Client (Stub)', () => {
    it('should fetch patient records (stub)', async () => {
      const { ESanteApiClient } = require('../integrations/ESanteApiClient');
      const client = new ESanteApiClient();

      const records = await client.fetchPatientRecords('patient-123', 'stub_token');

      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
    });

    it('should check consent (stub)', async () => {
      const { ESanteApiClient } = require('../integrations/ESanteApiClient');
      const client = new ESanteApiClient();

      const consent = await client.checkConsent('patient-123');

      expect(consent.granted).toBe(true);
    });
  });

  describe('Access Control', () => {
    it('should check patient access permissions', () => {
      const { canAccessPatientRecords } = require('../middleware/accessControl');

      // Patient can access own records
      expect(canAccessPatientRecords('patient-123', 'patient', 'patient-123')).toBe(true);

      // Patient cannot access other records
      expect(canAccessPatientRecords('patient-123', 'patient', 'patient-456')).toBe(false);

      // Pharmacist can access (with consent check in controller)
      expect(canAccessPatientRecords('pharmacist-123', 'pharmacist', 'patient-456')).toBe(true);
    });

    it('should return allowed record types by role', () => {
      const { getAllowedRecordTypes } = require('../middleware/accessControl');

      const patientTypes = getAllowedRecordTypes('patient');
      const pharmacistTypes = getAllowedRecordTypes('pharmacist');
      const nurseTypes = getAllowedRecordTypes('nurse');

      expect(patientTypes.length).toBeGreaterThan(pharmacistTypes.length);
      expect(pharmacistTypes).toContain('allergy');
      expect(pharmacistTypes).toContain('medication');
      expect(nurseTypes).toContain('medication');
    });
  });

  describe('Build Verification', () => {
    it('should have compiled index.ts successfully', () => {
      const fs = require('fs');
      const path = require('path');

      const distPath = path.join(__dirname, '../../dist/index.js');
      expect(fs.existsSync(distPath)).toBe(true);
    });

    it('should have compiled models successfully', () => {
      const fs = require('fs');
      const path = require('path');

      const medicalRecordPath = path.join(__dirname, '../../dist/models/MedicalRecord.js');
      expect(fs.existsSync(medicalRecordPath)).toBe(true);
    });
  });
});
