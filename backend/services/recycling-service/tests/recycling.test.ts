/**
 * Recycling Service Tests
 * Unit tests for medication recycling workflow
 * T5-052: Medication Return/Recycling Feature
 */

import recyclingService from '../src/services/recycling.service';
import recyclingRepository from '../src/repositories/RecyclingRepository';
import recyclingReportService from '../src/services/recycling-report.service';
import { RecyclingRequestModel } from '../src/models/RecyclingRequest';

describe('Recycling Service', () => {
  beforeEach(() => {
    // Clear repository before each test
    recyclingRepository.clear();
  });

  describe('RecyclingRequestModel', () => {
    test('should create a new recycling request', () => {
      const medications = [
        {
          name: 'Aspirin',
          quantity: 10,
          unit: 'tablets',
          expiryDate: '2023-12-31',
        },
      ];

      const request = new RecyclingRequestModel({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications,
      });

      expect(request.id).toBeDefined();
      expect(request.patientId).toBe('patient1');
      expect(request.pharmacyId).toBe('pharmacy1');
      expect(request.medications).toEqual(medications);
      expect(request.status).toBe('pending');
      expect(request.createdAt).toBeDefined();
    });

    test('should validate request data', () => {
      const validRequest = new RecyclingRequestModel({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          {
            name: 'Aspirin',
            quantity: 10,
            unit: 'tablets',
            expiryDate: '2025-12-31',
          },
        ],
      });

      const validation = validRequest.validate();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should catch validation errors', () => {
      const invalidRequest = new RecyclingRequestModel({
        patientId: '',
        pharmacyId: 'pharmacy1',
        medications: [
          {
            name: 'Aspirin',
            quantity: -5,
            unit: 'tablets',
            expiryDate: '2025-12-31',
          },
        ],
      });

      const validation = invalidRequest.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should calculate total quantity', () => {
      const request = new RecyclingRequestModel({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
          { name: 'Ibuprofen', quantity: 5, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      expect(request.getTotalQuantity()).toBe(15);
    });

    test('should detect expired medications', () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);
      const expiredDateStr = expiredDate.toISOString().split('T')[0];

      const request = new RecyclingRequestModel({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: expiredDateStr },
        ],
      });

      expect(request.hasExpiredMedications()).toBe(true);
    });

    test('should transition through states', () => {
      const request = new RecyclingRequestModel({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      expect(request.status).toBe('pending');

      request.assignDriver('driver1');
      expect(request.status).toBe('assigned');
      expect(request.driverId).toBe('driver1');

      request.markAsCollected();
      expect(request.status).toBe('collected');
      expect(request.collectedAt).toBeDefined();

      request.markAsProcessed();
      expect(request.status).toBe('processed');
      expect(request.processedAt).toBeDefined();
    });

    test('should prevent invalid state transitions', () => {
      const request = new RecyclingRequestModel({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      // Try to collect without assigning driver
      expect(() => request.markAsCollected()).toThrow();

      // Try to process without collecting
      expect(() => request.markAsProcessed()).toThrow();
    });
  });

  describe('Recycling Service', () => {
    test('should create recycling request', () => {
      const result = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.patientId).toBe('patient1');
    });

    test('should reject invalid request creation', () => {
      const result = recyclingService.createRecyclingRequest({
        patientId: '',
        pharmacyId: 'pharmacy1',
        medications: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should retrieve recycling request', () => {
      const created = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      const retrieved = recyclingService.getRecyclingRequest(created.data!.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.data?.id);
    });

    test('should get patient requests', () => {
      recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy2',
        medications: [
          { name: 'Ibuprofen', quantity: 5, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      const requests = recyclingService.getPatientRequests('patient1');

      expect(requests).toHaveLength(2);
      expect(requests.every(r => r.patientId === 'patient1')).toBe(true);
    });

    test('should get pharmacy requests', () => {
      recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      recyclingService.createRecyclingRequest({
        patientId: 'patient2',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Ibuprofen', quantity: 5, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      const requests = recyclingService.getPharmacyRequests('pharmacy1');

      expect(requests).toHaveLength(2);
      expect(requests.every(r => r.pharmacyId === 'pharmacy1')).toBe(true);
    });
  });

  describe('Recycling Workflow', () => {
    test('should complete full recycling workflow', () => {
      // Step 1: Patient creates request
      const created = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      expect(created.success).toBe(true);
      const requestId = created.data!.id;

      // Step 2: Pharmacy assigns driver
      const assigned = recyclingService.assignDriverToRequest(requestId, 'driver1');

      expect(assigned.success).toBe(true);
      expect(assigned.data?.status).toBe('assigned');
      expect(assigned.data?.driverId).toBe('driver1');

      // Step 3: Driver records collection
      const collected = recyclingService.recordCollection(requestId, 'driver1');

      expect(collected.success).toBe(true);
      expect(collected.data?.status).toBe('collected');

      // Step 4: Pharmacy processes collection
      const processed = recyclingService.processCollection(requestId);

      expect(processed.success).toBe(true);
      expect(processed.data?.status).toBe('processed');
    });

    test('should prevent collection without driver assignment', () => {
      const created = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      const result = recyclingService.recordCollection(created.data!.id, 'driver1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('assigned');
    });

    test('should prevent processing without collection', () => {
      const created = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      const result = recyclingService.processCollection(created.data!.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('collected');
    });

    test('should get driver pending pickups', () => {
      // Create multiple requests
      const req1 = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      const req2 = recyclingService.createRecyclingRequest({
        patientId: 'patient2',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Ibuprofen', quantity: 5, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      // Assign both to driver1
      recyclingService.assignDriverToRequest(req1.data!.id, 'driver1');
      recyclingService.assignDriverToRequest(req2.data!.id, 'driver1');

      // Collect one
      recyclingService.recordCollection(req1.data!.id, 'driver1');

      // Get pending pickups
      const pending = recyclingService.getDriverPendingPickups('driver1');

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(req2.data!.id);
    });

    test('should cancel pending request', () => {
      const created = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      const result = recyclingService.cancelRequest(created.data!.id);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('cancelled');
    });

    test('should prevent cancellation of processed request', () => {
      const created = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      // Complete workflow
      recyclingService.assignDriverToRequest(created.data!.id, 'driver1');
      recyclingService.recordCollection(created.data!.id, 'driver1');
      recyclingService.processCollection(created.data!.id);

      // Try to cancel
      const result = recyclingService.cancelRequest(created.data!.id);

      expect(result.success).toBe(false);
    });
  });

  describe('Recycling Reports', () => {
    test('should generate monthly report', () => {
      // Create processed requests
      for (let i = 0; i < 5; i++) {
        const created = recyclingService.createRecyclingRequest({
          patientId: `patient${i}`,
          pharmacyId: 'pharmacy1',
          medications: [
            { name: 'Aspirin', quantity: 10 + i, unit: 'tablets', expiryDate: '2025-12-31' },
          ],
        });

        recyclingService.assignDriverToRequest(created.data!.id, 'driver1');
        recyclingService.recordCollection(created.data!.id, 'driver1');
        recyclingService.processCollection(created.data!.id);
      }

      const month = new Date().getMonth() + 1;
      const monthStr = String(month).padStart(2, '0');
      const year = new Date().getFullYear();

      const report = recyclingReportService.generateMonthlyReport('pharmacy1', monthStr, year);

      expect(report.pharmacyId).toBe('pharmacy1');
      expect(report.totalRequests).toBe(5);
      expect(report.totalMedicationsCollected).toBe(5);
      expect(report.totalQuantityCollected).toBeGreaterThan(0);
      expect(report.environmentalImpact.wastePreventedKg).toBeGreaterThan(0);
      expect(report.environmentalImpact.carbonFootprintReduction).toBeGreaterThan(0);
    });

    test('should generate annual report', () => {
      const created = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 50, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      recyclingService.assignDriverToRequest(created.data!.id, 'driver1');
      recyclingService.recordCollection(created.data!.id, 'driver1');
      recyclingService.processCollection(created.data!.id);

      const year = new Date().getFullYear();
      const report = recyclingReportService.generateAnnualReport('pharmacy1', year);

      expect(report.totalRequests).toBeGreaterThan(0);
      expect(report.totalWastePreventedKg).toBeGreaterThan(0);
      expect(report.totalCarbonReduction).toBeGreaterThan(0);
    });

    test('should generate compliance report', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1); // Add 1 day to include today's requests

      const created = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      recyclingService.assignDriverToRequest(created.data!.id, 'driver1');
      recyclingService.recordCollection(created.data!.id, 'driver1');
      recyclingService.processCollection(created.data!.id);

      const report = recyclingReportService.generateComplianceReport(
        'pharmacy1',
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      expect(report.pharmacyId).toBe('pharmacy1');
      expect(report.totalRequests).toBeGreaterThan(0);
      expect(report.completionRate).toBeGreaterThan(0);
      expect(report.complianceStatus).toBeDefined();
    });

    test('should generate environmental impact summary', () => {
      const created = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 100, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
      });

      recyclingService.assignDriverToRequest(created.data!.id, 'driver1');
      recyclingService.recordCollection(created.data!.id, 'driver1');
      recyclingService.processCollection(created.data!.id);

      const year = new Date().getFullYear();
      const summary = recyclingReportService.generateEnvironmentalImpactSummary('pharmacy1', year);

      expect(summary.pharmacyId).toBe('pharmacy1');
      expect(summary.wastePreventedKg).toBeGreaterThan(0);
      expect(summary.carbonFootprintReductionKg).toBeGreaterThan(0);
      expect(summary.equivalents.treesPlanted).toBeGreaterThanOrEqual(0);
      expect(summary.equivalents.carsMilesCancelled).toBeGreaterThanOrEqual(0);
      expect(summary.equivalents.plasticBottlesSaved).toBeGreaterThanOrEqual(0);
    });

    test('should generate network summary', () => {
      // Create requests for multiple pharmacies
      for (let p = 1; p <= 3; p++) {
        for (let i = 0; i < 2; i++) {
          const created = recyclingService.createRecyclingRequest({
            patientId: `patient-p${p}-${i}`,
            pharmacyId: `pharmacy${p}`,
            medications: [
              { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
            ],
          });

          recyclingService.assignDriverToRequest(created.data!.id, `driver${p}`);
          recyclingService.recordCollection(created.data!.id, `driver${p}`);
          recyclingService.processCollection(created.data!.id);
        }
      }

      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const year = new Date().getFullYear();

      const summary = recyclingReportService.generateNetworkSummary(month, year);

      expect(summary.totalPharmacies).toBe(3);
      expect(summary.totalRequests).toBe(6);
      expect(summary.networkWastePreventedKg).toBeGreaterThan(0);
      expect(summary.topPharmacies.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle request with multiple medications', () => {
      const medications = [
        { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        { name: 'Ibuprofen', quantity: 5, unit: 'tablets', expiryDate: '2025-12-31' },
        { name: 'Paracetamol', quantity: 8, unit: 'tablets', expiryDate: '2025-12-31' },
      ];

      const result = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications,
      });

      expect(result.success).toBe(true);
      expect(result.data?.medications).toHaveLength(3);
    });

    test('should handle request with notes', () => {
      const result = recyclingService.createRecyclingRequest({
        patientId: 'patient1',
        pharmacyId: 'pharmacy1',
        medications: [
          { name: 'Aspirin', quantity: 10, unit: 'tablets', expiryDate: '2025-12-31' },
        ],
        notes: 'Some medications need special handling',
      });

      expect(result.success).toBe(true);
      expect(result.data?.notes).toBe('Some medications need special handling');
    });

    test('should handle non-existent request retrieval', () => {
      const request = recyclingService.getRecyclingRequest('non-existent-id');

      expect(request).toBeNull();
    });

    test('should handle empty patient requests', () => {
      const requests = recyclingService.getPatientRequests('non-existent-patient');

      expect(requests).toHaveLength(0);
    });
  });
});
