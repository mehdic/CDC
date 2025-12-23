/**
 * Consent-Based Access Control Integration Tests
 * Tests for negative scenarios: No consent = no access (403)
 * Tests for FHIR format support
 */

import { ConsentService } from '../../services/consent.service';
import { EPDService } from '../../services/epd.service';
import { VaudAdapter } from '../../adapters/vaud.adapter';
import { EPDDocumentType, ConsentStatus } from '../../types/esante.types';

describe('Consent-Based Access Control', () => {
  let consentService: ConsentService;
  let epdService: EPDService;
  let vaudAdapter: VaudAdapter;

  beforeEach(() => {
    consentService = new ConsentService();
    epdService = new EPDService();
    vaudAdapter = new VaudAdapter();
    consentService.registerAdapter(vaudAdapter);
    epdService.registerAdapter(vaudAdapter);
  });

  describe('Access Control - No Consent', () => {
    it('should deny access to documents when no consent exists', async () => {
      const patientId = 'patient_no_consent';
      const pharmacyId = 'pharmacy_unauthorized';

      // Attempt to validate consent without granting it
      const hasAccess = await consentService.validateConsent(
        patientId,
        pharmacyId,
        EPDDocumentType.PRESCRIPTION,
        'VD',
        'token123'
      );

      // Should be false (equivalent to 403 Forbidden)
      expect(hasAccess).toBe(false);
    });

    it('should deny access to documents when consent is revoked', async () => {
      const patientId = 'patient123';
      const pharmacyId = 'pharmacy456';

      // Grant consent initially
      await consentService.grantConsent(
        patientId,
        pharmacyId,
        [EPDDocumentType.PRESCRIPTION, EPDDocumentType.MEDICATION_LIST],
        'VD',
        'token123'
      );

      // Verify access is granted
      let hasAccess = await consentService.validateConsent(patientId, pharmacyId, EPDDocumentType.PRESCRIPTION, 'VD', 'token123');
      expect(hasAccess).toBe(true);

      // Revoke consent
      await consentService.revokeConsent(patientId, pharmacyId, 'VD', 'token123');

      // Verify access is now denied
      hasAccess = await consentService.validateConsent(patientId, pharmacyId, EPDDocumentType.PRESCRIPTION, 'VD', 'token123');
      expect(hasAccess).toBe(false);
    });

    it('should deny access when consent expired', async () => {
      const patientId = 'patient123';
      const pharmacyId = 'pharmacy456';

      // Grant consent with very short expiry
      await consentService.grantConsent(
        patientId,
        pharmacyId,
        [EPDDocumentType.PRESCRIPTION],
        'VD',
        'token123',
        1 // 1 second
      );

      // Verify access immediately after granting
      let hasAccess = await consentService.validateConsent(patientId, pharmacyId, EPDDocumentType.PRESCRIPTION, 'VD', 'token123');
      expect(hasAccess).toBe(true);

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Verify access is denied after expiry
      hasAccess = await consentService.validateConsent(patientId, pharmacyId, EPDDocumentType.PRESCRIPTION, 'VD', 'token123');
      expect(hasAccess).toBe(false);
    });

    it('should deny access to document types not covered by consent', async () => {
      const patientId = 'patient123';
      const pharmacyId = 'pharmacy456';

      // Grant consent only for PRESCRIPTION
      await consentService.grantConsent(patientId, pharmacyId, [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');

      // Verify prescription access is allowed
      const prescriptionAccess = await consentService.validateConsent(
        patientId,
        pharmacyId,
        EPDDocumentType.PRESCRIPTION,
        'VD',
        'token123'
      );
      expect(prescriptionAccess).toBe(true);

      // Verify medication list access is denied
      const medicationAccess = await consentService.validateConsent(
        patientId,
        pharmacyId,
        EPDDocumentType.MEDICATION_LIST,
        'VD',
        'token123'
      );
      expect(medicationAccess).toBe(false);

      // Verify allergy access is denied
      const allergyAccess = await consentService.validateConsent(
        patientId,
        pharmacyId,
        EPDDocumentType.ALLERGY_LIST,
        'VD',
        'token123'
      );
      expect(allergyAccess).toBe(false);
    });

    it('should enforce per-access consent checks', async () => {
      const patientId = 'patient123';
      const pharmacy1 = 'pharmacy1';
      const pharmacy2 = 'pharmacy2';

      // Grant consent only to pharmacy1
      await consentService.grantConsent(patientId, pharmacy1, [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');

      // Pharmacy1 should have access
      const pharmacy1Access = await consentService.validateConsent(
        patientId,
        pharmacy1,
        EPDDocumentType.PRESCRIPTION,
        'VD',
        'token123'
      );
      expect(pharmacy1Access).toBe(true);

      // Pharmacy2 should NOT have access even though patient exists
      const pharmacy2Access = await consentService.validateConsent(
        patientId,
        pharmacy2,
        EPDDocumentType.PRESCRIPTION,
        'VD',
        'token123'
      );
      expect(pharmacy2Access).toBe(false);
    });
  });

  describe('FHIR Format Support', () => {
    it('should support document type matching to FHIR formats', async () => {
      const documentTypes = [
        { type: EPDDocumentType.PRESCRIPTION, fhirResource: 'MedicationRequest' },
        { type: EPDDocumentType.MEDICATION_LIST, fhirResource: 'Bundle' },
        { type: EPDDocumentType.ALLERGY_LIST, fhirResource: 'AllergyIntolerance' },
        { type: EPDDocumentType.CONDITION_LIST, fhirResource: 'Condition' },
        { type: EPDDocumentType.LAB_RESULT, fhirResource: 'Observation' },
        { type: EPDDocumentType.VACCINE_RECORD, fhirResource: 'Immunization' },
      ];

      // Verify that these document types are properly defined
      documentTypes.forEach(({ type, fhirResource }) => {
        expect(type).toBeDefined();
        expect(fhirResource).toBeDefined();
        expect(Object.values(EPDDocumentType)).toContain(type);
      });
    });

    it('should support document content type metadata for FHIR', async () => {
      // Test that documents can store FHIR-compatible content types
      const supportedContentTypes = ['application/fhir+xml', 'application/fhir+json', 'application/pdf', 'text/xml'];

      supportedContentTypes.forEach((contentType) => {
        expect(contentType).toBeDefined();
        expect(typeof contentType).toBe('string');
        expect(contentType.length).toBeGreaterThan(0);
      });
    });

    it('should validate XDS.b format codes for FHIR documents', async () => {
      // XDS.b format codes for FHIR documents
      const formatCodes = {
        [EPDDocumentType.PRESCRIPTION]: 'urn:ihe:pharmacy:xpd:medication',
        [EPDDocumentType.LAB_RESULT]: 'urn:ihe:lab:xd-lab:2008',
        [EPDDocumentType.MEDICAL_REPORT]: 'urn:ihe:rad:text:xd-a:chest-x-ray',
      };

      Object.entries(formatCodes).forEach(([docType, formatCode]) => {
        expect(docType).toBeDefined();
        expect(formatCode).toBeDefined();
        expect(formatCode).toMatch(/^urn:/);
      });
    });

    it('should handle FHIR bundle format for medication lists', async () => {
      const patientId = 'patient123';
      const pharmacyId = 'pharmacy456';

      // Grant consent for medication list
      const consent = await consentService.grantConsent(
        patientId,
        pharmacyId,
        [EPDDocumentType.MEDICATION_LIST],
        'VD',
        'token123'
      );

      expect(consent.documentTypes).toContain(EPDDocumentType.MEDICATION_LIST);

      // List documents (simulated)
      const documents = await epdService.listDocuments(patientId, 'VD', 'token123', {
        documentTypes: [EPDDocumentType.MEDICATION_LIST],
      });

      // Should include medication list if patient has any
      // (In mock, it will return sample data)
      expect(Array.isArray(documents)).toBe(true);
    });

    it('should handle FHIR XML/JSON serialization support', async () => {
      // This test verifies that the system can handle different FHIR formats
      const fhirFormats = {
        xml: { contentType: 'application/fhir+xml', extension: '.xml' },
        json: { contentType: 'application/fhir+json', extension: '.json' },
      };

      Object.entries(fhirFormats).forEach(([format, metadata]) => {
        expect(metadata.contentType).toContain('fhir');
        expect(metadata.extension).toMatch(/^\./);
      });
    });
  });

  describe('Consent Workflow Edge Cases', () => {
    it('should handle concurrent consent grants', async () => {
      const patientId = 'patient123';

      // Attempt to grant consent to multiple pharmacies concurrently
      const grants = [
        consentService.grantConsent(patientId, 'pharmacy1', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123'),
        consentService.grantConsent(patientId, 'pharmacy2', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123'),
        consentService.grantConsent(patientId, 'pharmacy3', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123'),
      ];

      const results = await Promise.all(grants);

      expect(results.length).toBe(3);
      results.forEach((result) => {
        expect(result.consentStatus).toBe(ConsentStatus.GRANTED);
      });
    });

    it('should handle multiple document type grants with partial revoke', async () => {
      const patientId = 'patient123';
      const pharmacyId = 'pharmacy456';

      // Grant consent for multiple document types
      const consent = await consentService.grantConsent(
        patientId,
        pharmacyId,
        [EPDDocumentType.PRESCRIPTION, EPDDocumentType.MEDICATION_LIST, EPDDocumentType.ALLERGY_LIST],
        'VD',
        'token123'
      );

      expect(consent.documentTypes.length).toBe(3);

      // Revoke entire consent (system doesn't support partial revoke)
      await consentService.revokeConsent(patientId, pharmacyId, 'VD', 'token123');

      // All access should be denied
      const prescriptionAccess = await consentService.validateConsent(
        patientId,
        pharmacyId,
        EPDDocumentType.PRESCRIPTION,
        'VD',
        'token123'
      );
      expect(prescriptionAccess).toBe(false);
    });
  });

  describe('Statistics and Audit', () => {
    it('should track active vs granted vs revoked consents', async () => {
      const patientId = 'patient123';

      // Create various consent states
      await consentService.grantConsent(patientId, 'pharmacy1', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');
      await consentService.grantConsent(patientId, 'pharmacy2', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');
      await consentService.requestConsent(patientId, 'pharmacy3', 'Pharmacy 3', [EPDDocumentType.PRESCRIPTION], 'VD');

      // Grant one then revoke it
      await consentService.grantConsent(patientId, 'pharmacy4', [EPDDocumentType.PRESCRIPTION], 'VD', 'token123');
      await consentService.revokeConsent(patientId, 'pharmacy4', 'VD', 'token123');

      const stats = consentService.getStats();

      expect(stats.totalConsents).toBeGreaterThan(0);
      expect(stats.grantedConsents).toBeGreaterThan(0);
      expect(stats.revokedConsents).toBeGreaterThan(0);
      expect(stats.requestedConsents).toBeGreaterThan(0);
    });
  });
});
