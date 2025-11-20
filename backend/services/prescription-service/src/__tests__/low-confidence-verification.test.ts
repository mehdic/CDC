/**
 * Low-Confidence Field Verification Tests
 * Tests for GROUP_API_3: Low-confidence field verification during prescription approval
 * Phase 3: Prescription Approval Enhancements
 */

import { Request, Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import { approvePrescription, FieldCorrectionInput } from '../controllers/approveController';
import { Prescription, PrescriptionStatus } from '../../../../shared/models/Prescription';
import { PrescriptionItem } from '../../../../shared/models/PrescriptionItem';
import { FieldCorrection } from '../../../../shared/models/FieldCorrection';

// Mock dependencies
jest.mock('../utils/stateMachine');
jest.mock('../utils/treatmentPlan');

describe('Low-Confidence Field Verification', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let mockPrescriptionRepo: jest.Mocked<Repository<Prescription>>;
  let mockFieldCorrectionRepo: jest.Mocked<Repository<FieldCorrection>>;
  let mockItemRepo: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Setup mock repositories
    mockPrescriptionRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    mockFieldCorrectionRepo = {
      save: jest.fn(),
    } as any;

    mockItemRepo = {
      save: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn((entityName: any) => {
        if (entityName === Prescription || entityName === 'Prescription') {
          return mockPrescriptionRepo;
        }
        if (entityName === FieldCorrection || entityName === 'FieldCorrection') {
          return mockFieldCorrectionRepo;
        }
        if (entityName === PrescriptionItem || entityName === 'PrescriptionItem') {
          return mockItemRepo;
        }
        return {} as any;
      }),
    } as any;

    mockRequest = {
      params: { id: 'prescription-123' },
      body: {},
      app: {
        locals: {
          dataSource: mockDataSource,
        },
      } as any,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Low-Confidence Detection', () => {
    it('should reject approval when low-confidence fields exist without verification', async () => {
      // Mock state machine before test
      const { PrescriptionStateMachine } = require('../utils/stateMachine');
      PrescriptionStateMachine.canApprove = jest.fn().mockReturnValue({ canApprove: true });

      // Create prescription with low-confidence item
      const lowConfidenceItem = new PrescriptionItem();
      lowConfidenceItem.id = 'item-1';
      lowConfidenceItem.medication_name = 'Aspirin';
      lowConfidenceItem.dosage = '500mg';
      lowConfidenceItem.frequency = 'twice daily';
      lowConfidenceItem.medication_confidence = 75; // Low confidence (< 80)
      lowConfidenceItem.dosage_confidence = 85; // OK
      lowConfidenceItem.frequency_confidence = 60; // Low confidence (< 80)

      const prescription = new Prescription();
      prescription.id = 'prescription-123';
      prescription.status = PrescriptionStatus.IN_REVIEW;
      prescription.items = [lowConfidenceItem];

      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);

      mockRequest.body = {
        pharmacist_id: 'pharmacist-456',
      };

      await approvePrescription(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Prescription has low-confidence fields requiring manual verification',
          code: 'LOW_CONFIDENCE_VERIFICATION_REQUIRED',
          details: expect.objectContaining({
            items_requiring_verification: 1,
            low_confidence_fields: expect.arrayContaining([
              expect.objectContaining({
                item_id: 'item-1',
                medication_name: 'Aspirin',
                low_confidence_fields: expect.arrayContaining(['medication_name', 'frequency']),
              }),
            ]),
          }),
        })
      );
    });

    it('should reject approval when verified flag is set but no corrections provided', async () => {
      // Mock state machine before test
      const { PrescriptionStateMachine } = require('../utils/stateMachine');
      PrescriptionStateMachine.canApprove = jest.fn().mockReturnValue({ canApprove: true });

      const lowConfidenceItem = new PrescriptionItem();
      lowConfidenceItem.id = 'item-1';
      lowConfidenceItem.medication_name = 'Aspirin';
      lowConfidenceItem.medication_confidence = 75; // Low confidence

      const prescription = new Prescription();
      prescription.id = 'prescription-123';
      prescription.status = PrescriptionStatus.IN_REVIEW;
      prescription.items = [lowConfidenceItem];

      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);

      mockRequest.body = {
        pharmacist_id: 'pharmacist-456',
        low_confidence_verified: true,
        // Missing field_corrections
      };

      await approvePrescription(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Field corrections must be provided for low-confidence fields',
          code: 'FIELD_CORRECTIONS_REQUIRED',
        })
      );
    });

    it('should reject approval when not all low-confidence fields are verified', async () => {
      // Mock state machine before test
      const { PrescriptionStateMachine } = require('../utils/stateMachine');
      PrescriptionStateMachine.canApprove = jest.fn().mockReturnValue({ canApprove: true });

      const item1 = new PrescriptionItem();
      item1.id = 'item-1';
      item1.medication_name = 'Aspirin';
      item1.medication_confidence = 75; // Low confidence
      item1.dosage_confidence = 70; // Low confidence

      const item2 = new PrescriptionItem();
      item2.id = 'item-2';
      item2.medication_name = 'Ibuprofen';
      item2.dosage_confidence = 70; // Low confidence

      const prescription = new Prescription();
      prescription.id = 'prescription-123';
      prescription.status = PrescriptionStatus.IN_REVIEW;
      prescription.items = [item1, item2];

      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);

      mockRequest.body = {
        pharmacist_id: 'pharmacist-456',
        low_confidence_verified: true,
        field_corrections: [
          // Correcting item-1's medication_name but missing dosage field
          {
            item_id: 'item-1',
            field_name: 'medication_name',
            original_value: 'Aspirin',
            corrected_value: 'Aspirin',
            original_confidence: 75,
            was_corrected: false,
          },
          // Correcting item-2's dosage (complete for this item)
          {
            item_id: 'item-2',
            field_name: 'dosage',
            original_value: '500mg',
            corrected_value: '500mg',
            original_confidence: 70,
            was_corrected: false,
          },
        ],
      };

      await approvePrescription(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Missing corrections for fields'),
          code: 'INCOMPLETE_FIELD_VERIFICATION',
          details: expect.objectContaining({
            item_id: 'item-1',
            medication_name: 'Aspirin',
            missing_fields: ['dosage'],
            required_fields: ['medication_name', 'dosage'],
          }),
        })
      );
    });

    it('should allow approval when all low-confidence fields are verified', async () => {
      const lowConfidenceItem = new PrescriptionItem();
      lowConfidenceItem.id = 'item-1';
      lowConfidenceItem.medication_name = 'Aspirin';
      lowConfidenceItem.dosage = '500mg';
      lowConfidenceItem.frequency = 'twice daily';
      lowConfidenceItem.medication_confidence = 75; // Low confidence
      lowConfidenceItem.dosage_confidence = 85; // OK
      lowConfidenceItem.frequency_confidence = 90; // OK
      lowConfidenceItem.markAsCorrectedWithOriginal = jest.fn();
      lowConfidenceItem.markAsCorrected = jest.fn();

      const prescription = new Prescription();
      prescription.id = 'prescription-123';
      prescription.status = PrescriptionStatus.IN_REVIEW;
      prescription.items = [lowConfidenceItem];
      prescription.hasSafetyWarnings = jest.fn().mockReturnValue(false);

      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);
      mockFieldCorrectionRepo.save.mockResolvedValue([] as any);
      mockItemRepo.save.mockResolvedValue(lowConfidenceItem);

      // Mock state machine
      const { PrescriptionStateMachine } = require('../utils/stateMachine');
      PrescriptionStateMachine.canApprove = jest.fn().mockReturnValue({ canApprove: true });
      PrescriptionStateMachine.transitionToApproved = jest.fn();

      // Mock treatment plan generator
      const { generateTreatmentPlan } = require('../utils/treatmentPlan');
      generateTreatmentPlan.mockResolvedValue({ id: 'treatment-plan-1' });

      const fieldCorrections: FieldCorrectionInput[] = [
        {
          item_id: 'item-1',
          field_name: 'medication_name',
          original_value: 'Aspirin',
          corrected_value: 'Aspirin 500mg',
          original_confidence: 75,
          was_corrected: true,
          notes: 'Verified dosage in medication name',
        },
      ];

      mockRequest.body = {
        pharmacist_id: 'pharmacist-456',
        low_confidence_verified: true,
        field_corrections: fieldCorrections,
      };

      await approvePrescription(mockRequest as Request, mockResponse as Response);

      // Should save field corrections
      expect(mockFieldCorrectionRepo.save).toHaveBeenCalled();
      const savedCorrections = mockFieldCorrectionRepo.save.mock.calls[0][0] as any[];
      expect(savedCorrections).toHaveLength(1);
      expect(savedCorrections[0]).toMatchObject({
        prescription_id: 'prescription-123',
        prescription_item_id: 'item-1',
        pharmacist_id: 'pharmacist-456',
        field_name: 'medication_name',
        original_value: 'Aspirin',
        corrected_value: 'Aspirin 500mg',
        original_confidence: 75,
        was_corrected: true,
        correction_notes: 'Verified dosage in medication name',
        correction_type: 'correction',
      });

      // Should update the item with corrected value
      expect(lowConfidenceItem.medication_name).toBe('Aspirin 500mg');
      expect(lowConfidenceItem.markAsCorrected).toHaveBeenCalled();

      // Should approve successfully
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          prescription_id: 'prescription-123',
          status: expect.any(String),
          approved_by: 'pharmacist-456',
        })
      );
    });
  });

  describe('Field Correction Audit Trail', () => {
    it('should create separate audit records for each corrected field', async () => {
      const item = new PrescriptionItem();
      item.id = 'item-1';
      item.medication_name = 'Aspirin';
      item.dosage = '500mg';
      item.frequency = 'twice daily';
      item.medication_confidence = 75;
      item.dosage_confidence = 70;
      item.frequency_confidence = 65;
      item.markAsCorrectedWithOriginal = jest.fn();
      item.markAsCorrected = jest.fn();

      const prescription = new Prescription();
      prescription.id = 'prescription-123';
      prescription.status = PrescriptionStatus.IN_REVIEW;
      prescription.items = [item];
      prescription.hasSafetyWarnings = jest.fn().mockReturnValue(false);

      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);
      mockFieldCorrectionRepo.save.mockResolvedValue([] as any);
      mockItemRepo.save.mockResolvedValue(item);

      const { PrescriptionStateMachine } = require('../utils/stateMachine');
      PrescriptionStateMachine.canApprove = jest.fn().mockReturnValue({ canApprove: true });
      PrescriptionStateMachine.transitionToApproved = jest.fn();

      const { generateTreatmentPlan } = require('../utils/treatmentPlan');
      generateTreatmentPlan.mockResolvedValue(null);

      const fieldCorrections: FieldCorrectionInput[] = [
        {
          item_id: 'item-1',
          field_name: 'medication_name',
          original_value: 'Aspirin',
          corrected_value: 'Aspirin',
          original_confidence: 75,
          was_corrected: false, // Just verified
        },
        {
          item_id: 'item-1',
          field_name: 'dosage',
          original_value: '500mg',
          corrected_value: '500mg',
          original_confidence: 70,
          was_corrected: false, // Just verified
        },
        {
          item_id: 'item-1',
          field_name: 'frequency',
          original_value: 'twice daily',
          corrected_value: 'two times per day',
          original_confidence: 65,
          was_corrected: true, // Corrected
          notes: 'Clarified frequency',
        },
      ];

      mockRequest.body = {
        pharmacist_id: 'pharmacist-456',
        low_confidence_verified: true,
        field_corrections: fieldCorrections,
      };

      await approvePrescription(mockRequest as Request, mockResponse as Response);

      expect(mockFieldCorrectionRepo.save).toHaveBeenCalled();
      const savedCorrections = mockFieldCorrectionRepo.save.mock.calls[0][0] as any[];
      expect(savedCorrections).toHaveLength(3);

      // Verify each correction record
      expect(savedCorrections[0].correction_type).toBe('verification');
      expect(savedCorrections[1].correction_type).toBe('verification');
      expect(savedCorrections[2].correction_type).toBe('correction');
      expect(savedCorrections[2].correction_notes).toBe('Clarified frequency');
    });

    it('should store original AI values when correcting fields', async () => {
      const item = new PrescriptionItem();
      item.id = 'item-1';
      item.medication_name = 'Asprin'; // Misspelled
      item.medication_confidence = 60;
      item.markAsCorrectedWithOriginal = jest.fn();
      item.markAsCorrected = jest.fn();

      const prescription = new Prescription();
      prescription.id = 'prescription-123';
      prescription.status = PrescriptionStatus.IN_REVIEW;
      prescription.items = [item];
      prescription.hasSafetyWarnings = jest.fn().mockReturnValue(false);

      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);
      mockFieldCorrectionRepo.save.mockResolvedValue([] as any);
      mockItemRepo.save.mockResolvedValue(item);

      const { PrescriptionStateMachine } = require('../utils/stateMachine');
      PrescriptionStateMachine.canApprove = jest.fn().mockReturnValue({ canApprove: true });
      PrescriptionStateMachine.transitionToApproved = jest.fn();

      const { generateTreatmentPlan } = require('../utils/treatmentPlan');
      generateTreatmentPlan.mockResolvedValue(null);

      mockRequest.body = {
        pharmacist_id: 'pharmacist-456',
        low_confidence_verified: true,
        field_corrections: [
          {
            item_id: 'item-1',
            field_name: 'medication_name',
            original_value: 'Asprin',
            corrected_value: 'Aspirin',
            original_confidence: 60,
            was_corrected: true,
            notes: 'Fixed spelling',
          },
        ],
      };

      await approvePrescription(mockRequest as Request, mockResponse as Response);

      // Should update item with corrected value
      expect(item.medication_name).toBe('Aspirin');

      // Should mark as corrected with original values
      expect(item.markAsCorrectedWithOriginal).toHaveBeenCalledWith({
        medication_name: 'Asprin',
        confidence: 60,
      });

      // Should set verification status
      expect(item.markAsCorrected).toHaveBeenCalled();
    });
  });

  describe('PrescriptionItem Helper Methods', () => {
    it('hasAnyLowConfidence should detect low confidence fields', () => {
      const item = new PrescriptionItem();
      item.medication_confidence = 75; // < 80
      item.dosage_confidence = 85; // OK
      item.frequency_confidence = 90; // OK

      expect(item.hasAnyLowConfidence()).toBe(true);
    });

    it('getLowConfidenceFields should return array of low confidence field names', () => {
      const item = new PrescriptionItem();
      item.medication_confidence = 75; // < 80
      item.dosage_confidence = 60; // < 80
      item.frequency_confidence = 90; // OK

      const fields = item.getLowConfidenceFields();
      expect(fields).toEqual(['medication_name', 'dosage']);
    });

    it('should handle null confidence scores', () => {
      const item = new PrescriptionItem();
      item.medication_confidence = null;
      item.dosage_confidence = null;
      item.frequency_confidence = null;

      expect(item.hasAnyLowConfidence()).toBe(false);
      expect(item.getLowConfidenceFields()).toEqual([]);
    });
  });

  describe('FieldCorrection Helper Methods', () => {
    it('should distinguish between correction and verification', () => {
      const correction = new FieldCorrection();
      correction.was_corrected = true;
      expect(correction.isCorrection()).toBe(true);
      expect(correction.isVerification()).toBe(false);

      const verification = new FieldCorrection();
      verification.was_corrected = false;
      expect(verification.isCorrection()).toBe(false);
      expect(verification.isVerification()).toBe(true);
    });

    it('should identify low confidence scores', () => {
      const lowConf = new FieldCorrection();
      lowConf.original_confidence = 60;
      expect(lowConf.hadLowConfidence()).toBe(true);

      const highConf = new FieldCorrection();
      highConf.original_confidence = 95;
      expect(highConf.hadLowConfidence()).toBe(false);
    });

    it('should categorize confidence levels', () => {
      const low = new FieldCorrection();
      low.original_confidence = 60;
      expect(low.getConfidenceStatus()).toBe('low');

      const medium = new FieldCorrection();
      medium.original_confidence = 75;
      expect(medium.getConfidenceStatus()).toBe('medium');

      const high = new FieldCorrection();
      high.original_confidence = 90;
      expect(high.getConfidenceStatus()).toBe('high');

      const unknown = new FieldCorrection();
      unknown.original_confidence = null;
      expect(unknown.getConfidenceStatus()).toBe('unknown');
    });
  });
});
