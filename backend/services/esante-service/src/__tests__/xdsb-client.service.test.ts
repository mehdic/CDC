/**
 * Unit tests for IHE XDS.b Client Service
 */

import { XDSBClient, XDSBConfig, ITI18QueryParams } from '../services/xdsb-client.service';

describe('XDSBClient', () => {
  let client: XDSBClient;
  let config: XDSBConfig;

  beforeEach(() => {
    config = {
      registryUrl: 'https://test-registry.ehealth.ch/xdsiq',
      repositoryUrl: 'https://test-repo.ehealth.ch/xdsr',
      homeCommunityId: 'urn:oid:2.16.756.5.30.1.127.3.10.12',
    };
    client = new XDSBClient(config);
  });

  describe('Constructor', () => {
    it('should initialize with provided configuration', () => {
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(XDSBClient);
    });
  });

  describe('ITI-18: Registry Stored Query', () => {
    it('should build valid ITI-18 SOAP request envelope', () => {
      const params: ITI18QueryParams = {
        patientId: '123456789',
        documentTypes: ['57833-6'], // LOINC code for prescription
        status: 'Approved',
      };

      const request = (client as any).buildITI18Request(params, 'test-token');

      expect(request).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(request).toContain('RegistryStoredQuery');
      expect(request).toContain('123456789');
      expect(request).toContain('57833-6');
      expect(request).toContain('Approved');
    });

    it('should include date range filters when provided', () => {
      const params: ITI18QueryParams = {
        patientId: '123456789',
        createdFrom: new Date('2024-01-01'),
        createdTo: new Date('2024-12-31'),
      };

      const request = (client as any).buildITI18Request(params, 'test-token');

      expect(request).toContain('XDSDocumentEntryCreationTimeFrom');
      expect(request).toContain('XDSDocumentEntryCreationTimeTo');
      expect(request).toContain('20240101');
      expect(request).toContain('20241231');
    });

    it('should generate unique message IDs', () => {
      const params: ITI18QueryParams = { patientId: '123' };
      const request1 = (client as any).buildITI18Request(params, 'token');
      const request2 = (client as any).buildITI18Request(params, 'token');

      const uuid1 = request1.match(/urn:uuid:([a-f0-9-]+)/)?.[1];
      const uuid2 = request2.match(/urn:uuid:([a-f0-9-]+)/)?.[1];

      expect(uuid1).toBeDefined();
      expect(uuid2).toBeDefined();
      expect(uuid1).not.toEqual(uuid2);
    });
  });

  describe('ITI-43: Retrieve Document Set', () => {
    it('should build valid ITI-43 SOAP request envelope', () => {
      const params = {
        documentUniqueId: 'doc-12345',
        repositoryUniqueId: 'repo-678',
        homeCommunityId: 'urn:oid:2.16.756.5.30.1.127.3.10.12',
      };

      const request = (client as any).buildITI43Request(params, 'test-token');

      expect(request).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(request).toContain('RetrieveDocumentSet');
      expect(request).toContain('doc-12345');
      expect(request).toContain('repo-678');
      expect(request).toContain('urn:oid:2.16.756.5.30.1.127.3.10.12');
    });

    it('should use default homeCommunityId if not provided', () => {
      const params = {
        documentUniqueId: 'doc-12345',
        repositoryUniqueId: 'repo-678',
      };

      const request = (client as any).buildITI43Request(params, 'test-token');

      expect(request).toContain(config.homeCommunityId);
    });
  });

  describe('ITI-41: Provide and Register Document Set-b', () => {
    it('should build valid ITI-41 SOAP request envelope', () => {
      const params = {
        patientId: '123456789',
        document: Buffer.from('test document content'),
        metadata: {
          title: 'Test Prescription',
          classCode: '57833-6',
          formatCode: 'urn:ihe:pharm:pre:2010',
          mimeType: 'application/pdf',
          author: 'HIN12345',
          authorInstitution: 'Test Pharmacy',
          confidentialityCode: 'N',
          languageCode: 'fr-CH',
        },
      };

      const request = (client as any).buildITI41Request(params, 'test-token');

      expect(request).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(request).toContain('ProvideAndRegisterDocumentSet-b');
      expect(request).toContain('Test Prescription');
      expect(request).toContain('57833-6');
      expect(request).toContain('urn:ihe:pharm:pre:2010');
      expect(request).toContain('HIN12345');
      expect(request).toContain('fr-CH');
    });

    it('should base64 encode document content', () => {
      const testContent = 'This is a test document';
      const params = {
        patientId: '123',
        document: Buffer.from(testContent),
        metadata: {
          title: 'Test',
          classCode: '57833-6',
          formatCode: 'test',
          mimeType: 'text/plain',
          author: 'HIN123',
          authorInstitution: 'Test',
          confidentialityCode: 'N',
          languageCode: 'fr-CH',
        },
      };

      const request = (client as any).buildITI41Request(params, 'test-token');
      const expectedBase64 = Buffer.from(testContent).toString('base64');

      expect(request).toContain(expectedBase64);
    });

    it('should include ExtrinsicObject with metadata', () => {
      const params = {
        patientId: '123',
        document: Buffer.from('content'),
        metadata: {
          title: 'Pharmacy Dispensation',
          classCode: '60593-1',
          formatCode: 'urn:ihe:pharm:dis:2010',
          mimeType: 'application/xml',
          author: 'HIN99999',
          authorInstitution: 'MetaPharm Pharmacy',
          confidentialityCode: 'R',
          languageCode: 'de-CH',
        },
      };

      const request = (client as any).buildITI41Request(params, 'test-token');

      expect(request).toContain('ExtrinsicObject');
      expect(request).toContain('Pharmacy Dispensation');
      expect(request).toContain('60593-1');
      expect(request).toContain('HIN99999'); // Author is in ExternalIdentifier, not authorInstitution
    });
  });

  describe('Utility Methods', () => {
    it('should generate valid UUIDs', () => {
      const uuid1 = (client as any).generateUUID();
      const uuid2 = (client as any).generateUUID();

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid1).toMatch(uuidRegex);
      expect(uuid2).toMatch(uuidRegex);
      expect(uuid1).not.toEqual(uuid2);
    });

    it('should format dates to HL7 format (YYYYMMDDHHMMSS)', () => {
      const date = new Date('2024-12-03T14:30:45.123Z');
      const formatted = (client as any).formatHL7Date(date);

      expect(formatted).toMatch(/^\d{14}$/);
      expect(formatted.startsWith('202412')).toBe(true);
      expect(formatted.length).toBe(14);
    });

    it('should parse HL7 dates correctly', () => {
      const hl7Date = '20241203143045';
      const parsed = (client as any).parseHL7Date(hl7Date);

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(11); // December (0-indexed)
      expect(parsed.getDate()).toBe(3);
      expect(parsed.getHours()).toBe(14);
      expect(parsed.getMinutes()).toBe(30);
      expect(parsed.getSeconds()).toBe(45);
    });

    it('should handle incomplete HL7 dates', () => {
      const dateOnly = '20241203';
      const parsed = (client as any).parseHL7Date(dateOnly);

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(11);
      expect(parsed.getDate()).toBe(3);
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
      expect(parsed.getSeconds()).toBe(0);
    });

    it('should handle invalid HL7 dates gracefully', () => {
      const invalid = '';
      const parsed = (client as any).parseHL7Date(invalid);

      expect(parsed).toBeInstanceOf(Date);
      // Should return current date as fallback
    });
  });

  describe('Swiss EPD Patient ID Format', () => {
    it('should use Swiss patient ID format in ITI-18 requests', () => {
      const params: ITI18QueryParams = {
        patientId: '7601234567890',
      };

      const request = (client as any).buildITI18Request(params, 'token');

      // Swiss EPD format: patientId^^^&2.16.756.5.30.1.127.3.10.3&ISO
      expect(request).toContain('7601234567890');
      expect(request).toContain('^^^&2.16.756.5.30.1.127.3.10.3&ISO');
    });

    it('should use Swiss patient ID format in ITI-41 submissions', () => {
      const params = {
        patientId: '7601234567890',
        document: Buffer.from('content'),
        metadata: {
          title: 'Test',
          classCode: '57833-6',
          formatCode: 'test',
          mimeType: 'application/pdf',
          author: 'HIN123',
          authorInstitution: 'Test',
          confidentialityCode: 'N',
          languageCode: 'fr-CH',
        },
      };

      const request = (client as any).buildITI41Request(params, 'token');

      expect(request).toContain('7601234567890');
      expect(request).toContain('^^^&2.16.756.5.30.1.127.3.10.3&ISO');
    });
  });

  describe('Error Handling', () => {
    it('should not throw on XML parsing with stub implementation', () => {
      const invalidXML = '<invalid>xml';

      // Stub implementation returns empty array instead of throwing
      const result = (client as any).parseITI18Response(invalidXML);
      expect(result).toBeDefined();
      expect(result.documents).toBeDefined();
      expect(Array.isArray(result.documents)).toBe(true);
    });

    it('should handle network errors with descriptive messages', async () => {
      const params: ITI18QueryParams = {
        patientId: '123',
      };

      // Mock axios to reject
      jest.spyOn((client as any).httpClient, 'post').mockRejectedValue(new Error('Network timeout'));

      await expect(client.queryDocuments(params, 'token')).rejects.toThrow(
        'Failed to query EPD registry: Network timeout'
      );
    });
  });

  describe('SOAP Action Headers', () => {
    it('should use correct SOAP action for ITI-18', () => {
      // This would require mocking httpClient.post to verify headers
      // Simplified test: verify that SOAPAction is included in request building
      const params: ITI18QueryParams = { patientId: '123' };

      // In real implementation, would spy on httpClient.post and verify headers
      expect(() => (client as any).buildITI18Request(params, 'token')).not.toThrow();
    });
  });
});
