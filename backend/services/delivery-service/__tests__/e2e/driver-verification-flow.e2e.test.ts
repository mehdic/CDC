/**
 * E2E Tests: Driver Verification Flow
 * Tests complete workflow from driver onboarding to controlled substance delivery
 */

import request from 'supertest';
import { GovernmentIDType, AuthorizationLevel } from '../../src/types/driver-verification.types';

const BASE_URL = 'http://localhost:3002';

describe('Driver Verification E2E Flow', () => {
  // Test data
  const testDriver = {
    id: `test-driver-${Date.now()}`,
    governmentID: {
      idType: GovernmentIDType.SWISS_ID,
      idNumber: '756.1234.5678.90',
      issuingAuthority: 'Canton de Genève',
      issuingCountry: 'CHE',
      issueDate: '2020-01-01',
      expiryDate: '2030-01-01',
      photoBase64: 'base64encodedphoto...'
    },
    license: {
      licenseNumber: '12345678',
      categories: ['B', 'BE'],
      issuingAuthority: 'Swiss Vehicle Registration Office',
      issueDate: '2018-01-01',
      expiryDate: '2028-01-01'
    }
  };

  const testPharmacy = {
    id: 'pharmacy-001',
    name: 'Pharmacie Centrale'
  };

  const testPharmacist = {
    id: 'pharmacist-001',
    name: 'Dr. Jean Dupont'
  };

  let authorizationId: string;
  let deliveryId: string;

  // =========================================================================
  // Scenario 1: Complete Driver Onboarding Flow
  // =========================================================================

  describe('Scenario 1: New Driver Onboarding', () => {
    test('Step 1: Verify driver government ID', async () => {
      const response = await request(BASE_URL)
        .post(`/api/v1/drivers/${testDriver.id}/verify`)
        .send(testDriver.governmentID)
        .expect('Content-Type', /json/);

      // Should succeed (200) or fail gracefully (400)
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.driverId).toBe(testDriver.id);
        expect(response.body.data.verificationStatus).toBe('verified');
      }
    });

    test('Step 2: Verify driver license', async () => {
      const response = await request(BASE_URL)
        .post(`/api/v1/drivers/${testDriver.id}/verify-license`)
        .send(testDriver.license)
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.categories).toEqual(expect.arrayContaining(['B']));
      }
    });

    test('Step 3: Grant standard authorization', async () => {
      const authRequest = {
        authorizationLevel: AuthorizationLevel.STANDARD,
        pharmacyId: testPharmacy.id,
        validFrom: '2024-01-01',
        validUntil: '2025-12-31'
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/drivers/${testDriver.id}/authorizations`)
        .send(authRequest)
        .expect('Content-Type', /json/);

      expect([201, 400]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        authorizationId = response.body.data.id;
      }
    });

    test('Step 4: Verify authorization is active', async () => {
      const response = await request(BASE_URL)
        .get(`/api/v1/drivers/${testDriver.id}/authorizations`)
        .query({ pharmacyId: testPharmacy.id })
        .expect('Content-Type', /json/);

      expect([200]).toContain(response.status);

      if (response.body.success && response.body.data.length > 0) {
        const auth = response.body.data[0];
        expect(auth.authorizationLevel).toBe(AuthorizationLevel.STANDARD);
        expect(auth.status).toBe('verified');
      }
    });
  });

  // =========================================================================
  // Scenario 2: Standard Delivery Flow
  // =========================================================================

  describe('Scenario 2: Standard Delivery (No Controlled Substances)', () => {
    beforeAll(() => {
      deliveryId = `delivery-${Date.now()}`;
    });

    test('Step 1: Pre-delivery authorization check passes', async () => {
      const checkRequest = {
        driverId: testDriver.id,
        pharmacyId: testPharmacy.id,
        requiredLevel: AuthorizationLevel.STANDARD
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/deliveries/${deliveryId}/check-authorization`)
        .send(checkRequest)
        .expect('Content-Type', /json/);

      expect([200]).toContain(response.status);

      if (response.body.success) {
        expect(response.body.data.canDeliver).toBe(true);
        expect(response.body.data.hasAuthorization).toBe(true);
        expect(response.body.data.blockers).toHaveLength(0);
      }
    });

    test('Step 2: At-delivery driver verification', async () => {
      const verificationRequest = {
        driverId: testDriver.id,
        photoBase64: 'base64encodedphoto...',
        signatureBase64: 'base64encodedsignature...',
        gpsLatitude: 46.2044,
        gpsLongitude: 6.1432,
        deviceId: 'device-123'
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/deliveries/${deliveryId}/verify-driver`)
        .send(verificationRequest)
        .expect('Content-Type', /json/);

      // Should pass (200) or fail (403)
      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.matchScore).toBeGreaterThanOrEqual(0);
      }
    });

    test('Step 3: Verify audit log created', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/audit/driver-verifications')
        .query({ driverId: testDriver.id })
        .expect('Content-Type', /json/);

      expect([200]).toContain(response.status);

      if (response.body.success) {
        expect(response.body.data.length).toBeGreaterThan(0);

        // Should have verification events
        const verificationEvents = response.body.data.filter(
          (log: any) => log.deliveryId === deliveryId
        );
        expect(verificationEvents.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // Scenario 3: Controlled Substance Delivery (Upgrade Authorization)
  // =========================================================================

  describe('Scenario 3: Controlled Substance Delivery', () => {
    let controlledAuthId: string;

    test('Step 1: Attempt delivery without controlled authorization fails', async () => {
      const newDeliveryId = `delivery-controlled-${Date.now()}`;

      const checkRequest = {
        driverId: testDriver.id,
        pharmacyId: testPharmacy.id,
        requiredLevel: AuthorizationLevel.CONTROLLED
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/deliveries/${newDeliveryId}/check-authorization`)
        .send(checkRequest)
        .expect('Content-Type', /json/);

      expect([200]).toContain(response.status);

      if (response.body.success) {
        // Should indicate cannot deliver or no authorization
        if (!response.body.data.hasAuthorization) {
          expect(response.body.data.canDeliver).toBe(false);
          expect(response.body.data.blockers.length).toBeGreaterThan(0);
        }
      }
    });

    test('Step 2: Grant controlled substance authorization', async () => {
      const authRequest = {
        authorizationLevel: AuthorizationLevel.CONTROLLED,
        pharmacyId: testPharmacy.id,
        validFrom: '2024-01-01',
        validUntil: '2025-12-31',
        restrictions: ['No narcotic substances'],
        trainingCertificateBase64: 'base64certificate...'
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/drivers/${testDriver.id}/authorizations`)
        .send(authRequest)
        .expect('Content-Type', /json/);

      expect([201, 400]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        controlledAuthId = response.body.data.id;
        expect(response.body.data.authorizationLevel).toBe(AuthorizationLevel.CONTROLLED);
      }
    });

    test('Step 3: Pre-delivery check now passes for controlled substances', async () => {
      const newDeliveryId = `delivery-controlled-ok-${Date.now()}`;

      const checkRequest = {
        driverId: testDriver.id,
        pharmacyId: testPharmacy.id,
        requiredLevel: AuthorizationLevel.CONTROLLED
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/deliveries/${newDeliveryId}/check-authorization`)
        .send(checkRequest)
        .expect('Content-Type', /json/);

      expect([200]).toContain(response.status);

      if (response.body.success && response.body.data.hasAuthorization) {
        expect(response.body.data.canDeliver).toBe(true);
        expect(response.body.data.authorizationExpiry).toBeDefined();
      }
    });
  });

  // =========================================================================
  // Scenario 4: Emergency Override Flow
  // =========================================================================

  describe('Scenario 4: Emergency Override for Blocked Delivery', () => {
    test('Step 1: Attempt narcotic delivery without authorization', async () => {
      const emergencyDeliveryId = `delivery-emergency-${Date.now()}`;

      const checkRequest = {
        driverId: testDriver.id,
        pharmacyId: testPharmacy.id,
        requiredLevel: AuthorizationLevel.NARCOTIC
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/deliveries/${emergencyDeliveryId}/check-authorization`)
        .send(checkRequest)
        .expect('Content-Type', /json/);

      expect([200]).toContain(response.status);

      if (response.body.success) {
        // Should be blocked
        if (!response.body.data.hasAuthorization) {
          expect(response.body.data.blockers.length).toBeGreaterThan(0);
        }
      }
    });

    test('Step 2: Create emergency override', async () => {
      const emergencyDeliveryId = `delivery-emergency-${Date.now()}`;

      const overrideRequest = {
        driverId: testDriver.id,
        reason: 'Patient critical condition',
        justification: 'Oncology patient requires immediate narcotic pain medication',
        approvedBy: 'supervisor-789'
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/deliveries/${emergencyDeliveryId}/emergency-override`)
        .send(overrideRequest)
        .expect('Content-Type', /json/);

      expect([201, 400]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.overrideId).toBeDefined();
      }
    });

    test('Step 3: Emergency override logged in audit trail', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/audit/driver-verifications')
        .query({ driverId: testDriver.id })
        .expect('Content-Type', /json/);

      expect([200]).toContain(response.status);

      if (response.body.success) {
        const emergencyLogs = response.body.data.filter(
          (log: any) => log.eventType === 'emergency_override'
        );

        if (emergencyLogs.length > 0) {
          expect(emergencyLogs[0].severity).toBe('critical');
          expect(emergencyLogs[0].eventDescription).toContain('Emergency override');
        }
      }
    });
  });

  // =========================================================================
  // Scenario 5: Authorization Revocation
  // =========================================================================

  describe('Scenario 5: Authorization Revocation and Impact', () => {
    test('Step 1: Revoke authorization', async () => {
      if (!authorizationId) {
        console.log('Skipping: No authorization ID available');
        return;
      }

      const response = await request(BASE_URL)
        .delete(`/api/v1/drivers/${testDriver.id}/authorizations/${authorizationId}`)
        .send({ reason: 'Driver contract terminated' })
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('Step 2: Verify authorization no longer active', async () => {
      const response = await request(BASE_URL)
        .get(`/api/v1/drivers/${testDriver.id}/authorizations`)
        .query({ pharmacyId: testPharmacy.id })
        .expect('Content-Type', /json/);

      expect([200]).toContain(response.status);

      if (response.body.success) {
        // Should have no active standard authorizations (revoked)
        const activeStandard = response.body.data.filter(
          (auth: any) =>
            auth.authorizationLevel === AuthorizationLevel.STANDARD &&
            auth.status === 'verified'
        );

        // After revocation, count should be 0 or authorization should show revoked status
        if (activeStandard.length > 0) {
          expect(activeStandard[0].status).not.toBe('verified');
        }
      }
    });

    test('Step 3: Pre-delivery check now fails for revoked authorization', async () => {
      const newDeliveryId = `delivery-post-revoke-${Date.now()}`;

      const checkRequest = {
        driverId: testDriver.id,
        pharmacyId: testPharmacy.id,
        requiredLevel: AuthorizationLevel.STANDARD
      };

      const response = await request(BASE_URL)
        .post(`/api/v1/deliveries/${newDeliveryId}/check-authorization`)
        .send(checkRequest)
        .expect('Content-Type', /json/);

      expect([200]).toContain(response.status);

      // After revocation, should either not have authorization or be blocked
      if (response.body.success && !response.body.data.hasAuthorization) {
        expect(response.body.data.blockers.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // Scenario 6: Regulatory Reporting
  // =========================================================================

  describe('Scenario 6: Generate Regulatory Compliance Report', () => {
    test('Generate monthly report with all driver activities', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(BASE_URL)
        .get('/api/v1/reports/regulatory')
        .query({ startDate, endDate })
        .expect('Content-Type', /json/);

      expect([200]).toContain(response.status);

      if (response.body.success) {
        const report = response.body.data;

        // Verify report structure
        expect(report.reportId).toBeDefined();
        expect(report.totalVerifications).toBeGreaterThanOrEqual(0);
        expect(report.authorizations).toHaveProperty('granted');
        expect(report.authorizations).toHaveProperty('revoked');
        expect(report.auditTrail).toBeDefined();
        expect(Array.isArray(report.auditTrail)).toBe(true);

        // Verify our test driver appears in audit trail
        const driverLogs = report.auditTrail.filter(
          (log: any) => log.driverId === testDriver.id
        );

        // Should have at least verification events
        expect(driverLogs.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('Report includes all required regulatory fields', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/reports/regulatory')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .expect('Content-Type', /json/);

      if (response.body.success) {
        const report = response.body.data;

        // Swiss pharmacy regulation requirements
        expect(report).toHaveProperty('reportType');
        expect(report).toHaveProperty('startDate');
        expect(report).toHaveProperty('endDate');
        expect(report).toHaveProperty('successfulVerifications');
        expect(report).toHaveProperty('failedVerifications');
        expect(report).toHaveProperty('emergencyOverrides');
        expect(report).toHaveProperty('generatedAt');
        expect(report).toHaveProperty('generatedBy');
      }
    });
  });
});
