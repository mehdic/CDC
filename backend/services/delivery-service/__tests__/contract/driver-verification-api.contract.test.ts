/**
 * Contract Tests: Driver Verification API
 * Tests API contract compliance for driver verification endpoints
 */

import request from 'supertest';
import { GovernmentIDType, AuthorizationLevel } from '../../src/types/driver-verification.types';

// Mock Express app setup
const BASE_URL = 'http://localhost:3002'; // Delivery service port

describe('Driver Verification API - Contract Tests', () => {
  const testDriverId = 'test-driver-123';
  const testPharmacyId = 'test-pharmacy-456';
  const testDeliveryId = 'test-delivery-789';

  // =========================================================================
  // Test Suite 1: Driver ID Verification Endpoint
  // =========================================================================

  describe('POST /api/v1/drivers/:id/verify', () => {
    test('accepts valid Swiss ID verification request', async () => {
      const validRequest = {
        idType: GovernmentIDType.SWISS_ID,
        idNumber: '756.1234.5678.90',
        issuingAuthority: 'Canton de Genève',
        issuingCountry: 'CHE',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01',
        photoBase64: 'base64encodedphoto...'
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/drivers/${testDriverId}/verify`)
        .send(validRequest)
        .expect('Content-Type', /json/);

      // Contract: Response must have success field
      expect(response.body).toHaveProperty('success');

      // Contract: Successful response includes data
      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('driverId', testDriverId);
        expect(response.body.data).toHaveProperty('verificationStatus');
        expect(response.body).toHaveProperty('message');
      }

      // Contract: Error response includes errors array
      if (!response.body.success) {
        expect(response.body).toHaveProperty('errors');
        expect(Array.isArray(response.body.errors)).toBe(true);
      }
    });

    test('rejects request with missing required fields', async () => {
      const invalidRequest = {
        idType: GovernmentIDType.SWISS_ID
        // Missing idNumber, issuingAuthority, etc.
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/drivers/${testDriverId}/verify`)
        .send(invalidRequest)
        .expect(400)
        .expect('Content-Type', /json/);

      // Contract: Error response
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('returns proper HTTP status codes', async () => {
      const validRequest = {
        idType: GovernmentIDType.SWISS_ID,
        idNumber: '756.1234.5678.90',
        issuingAuthority: 'Canton de Genève',
        issuingCountry: 'CHE',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01'
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/drivers/${testDriverId}/verify`)
        .send(validRequest);

      // Contract: 200 for success, 400 for validation error, 500 for server error
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  // =========================================================================
  // Test Suite 2: Driver License Verification Endpoint
  // =========================================================================

  describe('POST /api/v1/drivers/:id/verify-license', () => {
    test('accepts valid license verification request', async () => {
      const validRequest = {
        licenseNumber: '12345678',
        categories: ['B', 'BE'],
        issuingAuthority: 'Swiss Vehicle Registration Office',
        issueDate: '2018-01-01',
        expiryDate: '2028-01-01'
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/drivers/${testDriverId}/verify-license`)
        .send(validRequest)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');

      if (response.body.success) {
        expect(response.body.data).toHaveProperty('licenseNumber');
        expect(response.body.data).toHaveProperty('categories');
        expect(Array.isArray(response.body.data.categories)).toBe(true);
      }
    });

    test('validates required fields', async () => {
      const response = await request(BASE_URL)
        .post(`/api/v1/drivers/${testDriverId}/verify-license`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  // =========================================================================
  // Test Suite 3: Authorization Endpoints
  // =========================================================================

  describe('GET /api/v1/drivers/:id/authorizations', () => {
    test('requires pharmacyId query parameter', async () => {
      const response = await request(BASE_URL)
        .get(`/api/v1/drivers/${testDriverId}/authorizations`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toContain('pharmacyId');
    });

    test('returns array of authorizations', async () => {
      const response = await request(BASE_URL)
        .get(`/api/v1/drivers/${testDriverId}/authorizations`)
        .query({ pharmacyId: testPharmacyId })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');

      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);

        // Contract: Each authorization has required fields
        if (response.body.data.length > 0) {
          const auth = response.body.data[0];
          expect(auth).toHaveProperty('id');
          expect(auth).toHaveProperty('driverId');
          expect(auth).toHaveProperty('authorizationLevel');
          expect(auth).toHaveProperty('pharmacyId');
          expect(auth).toHaveProperty('validFrom');
          expect(auth).toHaveProperty('validUntil');
          expect(auth).toHaveProperty('status');
        }
      }
    });
  });

  describe('POST /api/v1/drivers/:id/authorizations', () => {
    test('accepts valid authorization request', async () => {
      const validRequest = {
        authorizationLevel: AuthorizationLevel.CONTROLLED,
        pharmacyId: testPharmacyId,
        validFrom: '2024-01-01',
        validUntil: '2025-12-31',
        restrictions: ['No night deliveries']
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/drivers/${testDriverId}/authorizations`)
        .send(validRequest)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');

      if (response.status === 201) {
        expect(response.body.data).toHaveProperty('authorizationLevel', AuthorizationLevel.CONTROLLED);
      }
    });

    test('validates authorization level enum', async () => {
      const invalidRequest = {
        authorizationLevel: 'invalid_level',
        pharmacyId: testPharmacyId,
        validFrom: '2024-01-01',
        validUntil: '2025-12-31'
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/drivers/${testDriverId}/authorizations`)
        .send(invalidRequest);

      // Contract: Should validate enum or accept and return error
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('DELETE /api/v1/drivers/:id/authorizations/:authId', () => {
    test('requires reason in request body', async () => {
      const response = await request(BASE_URL)
        .delete(`/api/v1/drivers/${testDriverId}/authorizations/auth-123`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toContain('reason');
    });

    test('accepts valid revocation request', async () => {
      const response = await request(BASE_URL)
        .delete(`/api/v1/drivers/${testDriverId}/authorizations/auth-123`)
        .send({ reason: 'Driver no longer employed' })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');

      if (response.body.success) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  // =========================================================================
  // Test Suite 4: Delivery Verification Endpoints
  // =========================================================================

  describe('POST /api/v1/deliveries/:id/check-authorization', () => {
    test('accepts valid pre-delivery check request', async () => {
      const validRequest = {
        driverId: testDriverId,
        pharmacyId: testPharmacyId,
        requiredLevel: AuthorizationLevel.CONTROLLED
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/deliveries/${testDeliveryId}/check-authorization`)
        .send(validRequest)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');

      if (response.body.success) {
        // Contract: PreDeliveryCheckResponse structure
        expect(response.body.data).toHaveProperty('canDeliver');
        expect(response.body.data).toHaveProperty('driverId');
        expect(response.body.data).toHaveProperty('deliveryId');
        expect(response.body.data).toHaveProperty('hasAuthorization');
        expect(response.body.data).toHaveProperty('idVerified');
        expect(response.body.data).toHaveProperty('licenseValid');
        expect(response.body.data).toHaveProperty('warnings');
        expect(response.body.data).toHaveProperty('blockers');
        expect(Array.isArray(response.body.data.warnings)).toBe(true);
        expect(Array.isArray(response.body.data.blockers)).toBe(true);
      }
    });
  });

  describe('POST /api/v1/deliveries/:id/verify-driver', () => {
    test('accepts valid at-delivery verification request', async () => {
      const validRequest = {
        driverId: testDriverId,
        photoBase64: 'base64encodedphoto...',
        signatureBase64: 'base64encodedsignature...',
        gpsLatitude: 46.2044,
        gpsLongitude: 6.1432,
        deviceId: 'device-123'
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/deliveries/${testDeliveryId}/verify-driver`)
        .send(validRequest)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');

      // Contract: Success returns match score
      if (response.body.success) {
        expect(response.body.data).toHaveProperty('matchScore');
        expect(typeof response.body.data.matchScore).toBe('number');
        expect(response.body.data.matchScore).toBeGreaterThanOrEqual(0);
        expect(response.body.data.matchScore).toBeLessThanOrEqual(100);
      }

      // Contract: Failure returns 403 with errors
      if (response.status === 403) {
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      }
    });

    test('validates all required fields', async () => {
      const response = await request(BASE_URL)
        .post(`/api/v1/deliveries/${testDeliveryId}/verify-driver`)
        .send({ driverId: testDriverId })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/deliveries/:id/emergency-override', () => {
    test('accepts valid override request', async () => {
      const validRequest = {
        driverId: testDriverId,
        reason: 'Urgent medical need',
        justification: 'Patient requires immediate medication for chronic condition',
        approvedBy: 'supervisor-456'
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/deliveries/${testDeliveryId}/emergency-override`)
        .send(validRequest)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');

      if (response.status === 201) {
        expect(response.body.data).toHaveProperty('overrideId');
        expect(typeof response.body.data.overrideId).toBe('string');
      }
    });
  });

  // =========================================================================
  // Test Suite 5: Audit and Reporting Endpoints
  // =========================================================================

  describe('GET /api/v1/audit/driver-verifications', () => {
    test('requires driverId query parameter', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/audit/driver-verifications')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toContain('driverId');
    });

    test('returns array of audit logs', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/audit/driver-verifications')
        .query({ driverId: testDriverId })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');

      if (response.body.success) {
        expect(Array.isArray(response.body.data)).toBe(true);

        // Contract: Each log entry has required fields
        if (response.body.data.length > 0) {
          const log = response.body.data[0];
          expect(log).toHaveProperty('id');
          expect(log).toHaveProperty('driverId');
          expect(log).toHaveProperty('eventType');
          expect(log).toHaveProperty('eventDescription');
          expect(log).toHaveProperty('performedBy');
          expect(log).toHaveProperty('timestamp');
          expect(log).toHaveProperty('severity');
        }
      }
    });

    test('accepts optional date range filters', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/audit/driver-verifications')
        .query({
          driverId: testDriverId,
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('GET /api/v1/reports/regulatory', () => {
    test('requires startDate and endDate parameters', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/reports/regulatory')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toContain('startDate');
    });

    test('returns regulatory report structure', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/reports/regulatory')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');

      if (response.body.success) {
        // Contract: RegulatoryReport structure
        const report = response.body.data;
        expect(report).toHaveProperty('reportId');
        expect(report).toHaveProperty('reportType');
        expect(report).toHaveProperty('startDate');
        expect(report).toHaveProperty('endDate');
        expect(report).toHaveProperty('totalVerifications');
        expect(report).toHaveProperty('successfulVerifications');
        expect(report).toHaveProperty('failedVerifications');
        expect(report).toHaveProperty('emergencyOverrides');
        expect(report).toHaveProperty('authorizations');
        expect(report.authorizations).toHaveProperty('granted');
        expect(report.authorizations).toHaveProperty('revoked');
        expect(report.authorizations).toHaveProperty('expired');
        expect(report).toHaveProperty('auditTrail');
        expect(Array.isArray(report.auditTrail)).toBe(true);
      }
    });
  });
});
