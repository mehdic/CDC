/**
 * Consent Service Tests
 * Unit tests for patient consent management
 */

import { ConsentService } from '../services/consent.service';
import { VaudAdapter } from '../adapters/vaud.adapter';
import { EPDDocumentType, ConsentStatus, PatientConsent } from '../types/esante.types';

describe('ConsentService', () => {
  let consentService: ConsentService;
  let vaudAdapter: VaudAdapter;

  beforeEach(() => {
    consentService = new ConsentService();
    vaudAdapter = new VaudAdapter();
    consentService.registerAdapter(vaudAdapter);
  });

  describe('requestConsent', () => {
    it('should create a consent request', async () => {
      const consent = await consentService.requestConsent(
        'patient123',
        'pharmacy456',
        'Test Pharmacy',
        [EPDDocumentType.PRESCRIPTION, EPDDocumentType.MEDICATION_LIST],
        'VD'
      );

      expect(consent).toBeDefined();
      expect(consent.patientId).toBe('patient123');
      expect(consent.pharmacyId).toBe('pharmacy456');
      expect(consent.consentStatus).toBe(ConsentStatus.REQUESTED);
      expect(consent.documentTypes.length).toBe(2);
    });
  });

  describe('grantConsent', () => {
    it('should grant consent for patient-pharmacy pair', async () => {
      const consent = await consentService.grantConsent(
        'patient123',
        'pharmacy456',
        [EPDDocumentType.PRESCRIPTION],
        'VD',
        'token123'
      );

      expect(consent).toBeDefined();
      expect(consent.consentStatus).toBe(ConsentStatus.GRANTED);
      expect(consent.grantedAt).toBeDefined();
      expect(consent.expiresAt).toBeDefined();
    });

    it('should set expiration time for consent', async () => {
      const oneHour = 3600; // 1 hour in seconds
      const before = new Date();

      const consent = await consentService.grantConsent(
        'patient123',
        'pharmacy456',
        [EPDDocumentType.PRESCRIPTION],
        'VD',
        'token123',
        oneHour
      );

      expect(consent.expiresAt).toBeDefined();
      if (consent.expiresAt) {
        const diff = consent.expiresAt.getTime() - before.getTime();
        // Allow 1 second tolerance
        expect(diff).toBeLessThanOrEqual(oneHour * 1000 + 1000);
        expect(diff).toBeGreaterThanOrEqual(oneHour * 1000 - 1000);
      }
    });
  });

  describe('getConsent', () => {
    it('should retrieve granted consent', async () => {
      // First grant consent
      const granted = await consentService.grantConsent(
        'patient123',
        'pharmacy456',
        [EPDDocumentType.PRESCRIPTION],
        'VD',
        'token123'
      );

      expect(granted.consentStatus).toBe(ConsentStatus.GRANTED);

      // Then retrieve it
      const consent = await consentService.getConsent('patient123', 'pharmacy456', 'VD', 'token123');

      expect(consent).toBeDefined();
      if (consent) {
        expect(consent.consentStatus).toBe(ConsentStatus.GRANTED);
      }
    });

    it('should return null when consent not found', async () => {
      const consent = await consentService.getConsent('consent_not_found_' + Date.now(), 'pharmacy_not_found', 'VD', 'token123');
      expect(consent).toBeNull();
    });
  });

  describe('revokeConsent', () => {
    it('should revoke previously granted consent', async () => {
      // First grant consent
      const originalConsent = await consentService.grantConsent(
        'patient123',
        'pharmacy456',
        [EPDDocumentType.PRESCRIPTION],
        'VD',
        'token123'
      );

      expect(originalConsent.consentStatus).toBe(ConsentStatus.GRANTED);

      // Then revoke it
      const success = await consentService.revokeConsent('patient123', 'pharmacy456', 'VD', 'token123');

      expect(success).toBe(true);
    });

    it('should throw error when revoking non-existent consent', async () => {
      let errorWasThrown = false;
      try {
        await consentService.revokeConsent('unknown_patient', 'unknown_pharmacy', 'VD', 'token123');
      } catch (error) {
        errorWasThrown = true;
        expect((error as Error).message).toContain('Consent not found');
      }
      expect(errorWasThrown).toBe(true);
    });
  });

  describe('validateConsent', () => {
    it('should validate consent for allowed document type', async () => {
      // Grant consent for prescription
      await consentService.grantConsent(
        'patient123',
        'pharmacy456',
        [EPDDocumentType.PRESCRIPTION],
        'VD',
        'token123'
      );

      // Validate for prescription
      const isValid = await consentService.validateConsent(
        'patient123',
        'pharmacy456',
        EPDDocumentType.PRESCRIPTION,
        'VD',
        'token123'
      );

      expect(isValid).toBe(true);
    });

    it('should reject access when no consent exists', async () => {
      const isValid = await consentService.validateConsent(
        'patient_no_consent',
        'pharmacy456',
        EPDDocumentType.PRESCRIPTION,
        'VD',
        'token123'
      );

      expect(isValid).toBe(false);
    });

    it('should reject access to document type not in consent scope', async () => {
      // Grant consent only for prescription
      await consentService.grantConsent(
        'patient123',
        'pharmacy456',
        [EPDDocumentType.PRESCRIPTION],
        'VD',
        'token123'
      );

      // Try to access medication list (not granted)
      const isValid = await consentService.validateConsent(
        'patient123',
        'pharmacy456',
        EPDDocumentType.MEDICATION_LIST,
        'VD',
        'token123'
      );

      expect(isValid).toBe(false);
    });

    it('should reject access when consent is revoked', async () => {
      // Grant consent
      await consentService.grantConsent(
        'patient123',
        'pharmacy456',
        [EPDDocumentType.PRESCRIPTION],
        'VD',
        'token123'
      );

      // Revoke it
      await consentService.revokeConsent('patient123', 'pharmacy456', 'VD', 'token123');

      // Validate should fail
      const isValid = await consentService.validateConsent(
        'patient123',
        'pharmacy456',
        EPDDocumentType.PRESCRIPTION,
        'VD',
        'token123'
      );

      expect(isValid).toBe(false);
    });

    it('should reject access when consent is expired', async () => {
      // Grant consent with very short expiry (1 second)
      await consentService.grantConsent(
        'patient123',
        'pharmacy456',
        [EPDDocumentType.PRESCRIPTION],
        'VD',
        'token123',
        1 // 1 second
      );

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Validate should fail
      const isValid = await consentService.validateConsent(
        'patient123',
        'pharmacy456',
        EPDDocumentType.PRESCRIPTION,
        'VD',
        'token123'
      );

      expect(isValid).toBe(false);
    });
  });

  describe('getPatientConsents', () => {
    it('should retrieve all consents for a patient', async () => {
      // Grant multiple consents
      await consentService.grantConsent('patient123', 'pharmacy1', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');
      await consentService.grantConsent('patient123', 'pharmacy2', [EPDDocumentType.MEDICATION_LIST], 'VD', 'token123');
      await consentService.grantConsent('patient456', 'pharmacy1', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');

      const consents = await consentService.getPatientConsents('patient123');

      expect(consents.length).toBe(2);
      expect(consents.every((c) => c.patientId === 'patient123')).toBe(true);
    });

    it('should not include revoked consents in patient consents', async () => {
      // Grant and revoke consent
      await consentService.grantConsent('patient123', 'pharmacy1', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');
      await consentService.revokeConsent('patient123', 'pharmacy1', 'VD', 'token123');

      const consents = await consentService.getPatientConsents('patient123');

      expect(consents.length).toBe(0);
    });
  });

  describe('getPharmacyConsents', () => {
    it('should retrieve all consents for a pharmacy', async () => {
      await consentService.grantConsent('patient1', 'pharmacy123', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');
      await consentService.grantConsent('patient2', 'pharmacy123', [EPDDocumentType.MEDICATION_LIST], 'VD', 'token123');
      await consentService.grantConsent('patient1', 'pharmacy456', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');

      const consents = await consentService.getPharmacyConsents('pharmacy123');

      expect(consents.length).toBe(2);
      expect(consents.every((c) => c.pharmacyId === 'pharmacy123')).toBe(true);
    });
  });

  describe('cleanupExpiredConsents', () => {
    it('should remove expired consents', async () => {
      // Grant consent with 1 second expiry
      await consentService.grantConsent('patient123', 'pharmacy456', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123', 1);

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Cleanup should remove it
      const cleaned = consentService.cleanupExpiredConsents();

      expect(cleaned).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    it('should provide consent statistics', async () => {
      // Create various consents
      await consentService.grantConsent('patient1', 'pharmacy1', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');
      await consentService.grantConsent('patient2', 'pharmacy1', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');
      await consentService.requestConsent('patient3', 'pharmacy1', 'Pharmacy', [EPDDocumentType.PRESCRIPTION], 'VD');

      const stats = consentService.getStats();

      expect(stats.totalConsents).toBeGreaterThan(0);
      expect(stats.grantedConsents).toBeGreaterThan(0);
      expect(stats.requestedConsents).toBeGreaterThan(0);
      expect(stats.activeConsents).toBeDefined();
    });
  });
});
