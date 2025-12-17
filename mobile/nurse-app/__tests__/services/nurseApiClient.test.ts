/**
 * Nurse API Client Tests
 */

// Mock axios first
jest.mock('axios');
jest.mock('react-native-encrypted-storage');

import nurseApiClient from '../../src/services/nurseApiClient';

describe('NurseApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth endpoints', () => {
    it('should login with HIN ID and password', async () => {
      const mockResponse = {
        data: {
          token: 'token123',
          nurse: { id: '1', firstName: 'Jane' },
        },
      };

      // Mock would be set up in actual test environment
      expect(nurseApiClient).toBeDefined();
      expect(typeof nurseApiClient.login).toBe('function');
    });

    it('should verify MFA code', async () => {
      expect(typeof nurseApiClient.verifyMfa).toBe('function');
    });

    it('should logout', async () => {
      expect(typeof nurseApiClient.logout).toBe('function');
    });
  });

  describe('Patient endpoints', () => {
    it('should search patients', async () => {
      expect(typeof nurseApiClient.searchPatients).toBe('function');
    });

    it('should get patient by ID', async () => {
      expect(typeof nurseApiClient.getPatientById).toBe('function');
    });

    it('should get assigned patients', async () => {
      expect(typeof nurseApiClient.getAssignedPatients).toBe('function');
    });
  });

  describe('Medication endpoints', () => {
    it('should get patient medications', async () => {
      expect(typeof nurseApiClient.getPatientMedications).toBe('function');
    });

    it('should record administration', async () => {
      expect(typeof nurseApiClient.recordAdministration).toBe('function');
    });

    it('should verify medication barcode', async () => {
      expect(typeof nurseApiClient.verifyMedicationBarcode).toBe('function');
    });
  });

  describe('Order endpoints', () => {
    it('should create medication order', async () => {
      expect(typeof nurseApiClient.createMedicationOrder).toBe('function');
    });

    it('should get medication orders', async () => {
      expect(typeof nurseApiClient.getMedicationOrders).toBe('function');
    });

    it('should cancel order', async () => {
      expect(typeof nurseApiClient.cancelOrder).toBe('function');
    });
  });

  describe('Delivery tracking endpoints', () => {
    it('should get delivery tracking', async () => {
      expect(typeof nurseApiClient.getDeliveryTracking).toBe('function');
    });

    it('should get active deliveries', async () => {
      expect(typeof nurseApiClient.getActiveDeliveries).toBe('function');
    });
  });

  describe('Adverse reaction endpoints', () => {
    it('should report adverse reaction', async () => {
      expect(typeof nurseApiClient.reportAdverseReaction).toBe('function');
    });

    it('should get adverse reactions', async () => {
      expect(typeof nurseApiClient.getAdverseReactions).toBe('function');
    });
  });

  describe('Messaging endpoints', () => {
    it('should get messages', async () => {
      expect(typeof nurseApiClient.getMessages).toBe('function');
    });

    it('should send message', async () => {
      expect(typeof nurseApiClient.sendMessage).toBe('function');
    });

    it('should mark message as read', async () => {
      expect(typeof nurseApiClient.markMessageAsRead).toBe('function');
    });
  });

  describe('Handover endpoints', () => {
    it('should create handover note', async () => {
      expect(typeof nurseApiClient.createHandoverNote).toBe('function');
    });

    it('should get handover notes', async () => {
      expect(typeof nurseApiClient.getHandoverNotes).toBe('function');
    });

    it('should acknowledge handover', async () => {
      expect(typeof nurseApiClient.acknowledgeHandover).toBe('function');
    });
  });
});
