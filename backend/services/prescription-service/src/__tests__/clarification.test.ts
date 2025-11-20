/**
 * Unit Tests for Clarification Controller
 * T091 - User Story 1: Prescription Processing & Validation
 * Tests clarification request workflow between pharmacists and doctors
 */

import { Request, Response } from 'express';
import { requestClarification } from '../controllers/clarificationController';
import { Prescription, PrescriptionStatus } from '../../../../shared/models/Prescription';
import { Clarification, ClarificationStatus } from '../../../../shared/models/Clarification';
import { PrescriptionStateMachine } from '../utils/stateMachine';

// ============================================================================
// Mocks
// ============================================================================

// Mock TypeORM DataSource
const mockPrescriptionRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockClarificationRepo = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockDataSource = {
  getRepository: jest.fn((entity: any) => {
    if (entity.name === 'Prescription') {
      return mockPrescriptionRepo;
    }
    if (entity.name === 'Clarification') {
      return mockClarificationRepo;
    }
    return null;
  }),
};

// Mock PrescriptionStateMachine
jest.mock('../utils/stateMachine', () => ({
  PrescriptionStateMachine: {
    canRequestClarification: jest.fn(),
    transitionToClarificationNeeded: jest.fn(),
  },
}));

// ============================================================================
// Test Helpers
// ============================================================================

function createMockRequest(prescriptionId: string, body: any): Partial<Request> {
  return {
    params: { id: prescriptionId },
    body,
    app: {
      locals: {
        dataSource: mockDataSource,
      },
    } as any,
  };
}

function createMockResponse(): Partial<Response> {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

function createMockPrescription(overrides?: Partial<Prescription>): Prescription {
  const prescription = new Prescription();
  prescription.id = 'test-prescription-id';
  prescription.status = PrescriptionStatus.IN_REVIEW;
  prescription.patient_id = 'test-patient-id';
  prescription.pharmacy_id = 'test-pharmacy-id';
  prescription.prescribing_doctor_id = 'test-doctor-id';
  return Object.assign(prescription, overrides);
}

function createMockClarification(overrides?: Partial<Clarification>): Clarification {
  const clarification = new Clarification();
  clarification.id = 'test-clarification-id';
  clarification.prescription_id = 'test-prescription-id';
  clarification.pharmacist_id = 'test-pharmacist-id';
  clarification.doctor_id = 'test-doctor-id';
  clarification.question = 'What is the correct dosage?';
  clarification.status = ClarificationStatus.PENDING;
  clarification.created_at = new Date();
  return Object.assign(clarification, overrides);
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Clarification Controller - requestClarification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation
    mockDataSource.getRepository = jest.fn((entity: any) => {
      if (entity.name === 'Prescription') {
        return mockPrescriptionRepo;
      }
      if (entity.name === 'Clarification') {
        return mockClarificationRepo;
      }
      return null;
    });
  });

  // ==========================================================================
  // Happy Path Tests
  // ==========================================================================

  describe('Happy Path', () => {
    it('should successfully request clarification from doctor', async () => {
      const prescription = createMockPrescription();
      const clarification = createMockClarification();
      const requestBody = {
        pharmacist_id: 'test-pharmacist-id',
        question: 'What is the correct dosage for this medication?',
        category: 'dosage',
      };

      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockClarificationRepo.create.mockReturnValue(clarification);
      mockClarificationRepo.save.mockResolvedValue(clarification);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      (PrescriptionStateMachine.canRequestClarification as jest.Mock).mockReturnValue({ can: true });
      (PrescriptionStateMachine.transitionToClarificationNeeded as jest.Mock).mockImplementation((presc: Prescription) => {
        presc.status = PrescriptionStatus.CLARIFICATION_NEEDED;
      });

      const req = createMockRequest('test-prescription-id', requestBody);
      const res = createMockResponse();

      await requestClarification(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          clarification_id: 'test-clarification-id',
          prescription_id: 'test-prescription-id',
          question: 'What is the correct dosage?',
          doctor_id: 'test-doctor-id',
        })
      );
      expect(mockClarificationRepo.save).toHaveBeenCalled();
      expect(mockPrescriptionRepo.save).toHaveBeenCalled();
    });

    it('should accept clarification request without category', async () => {
      const prescription = createMockPrescription();
      const clarification = createMockClarification({ category: null });
      const requestBody = {
        pharmacist_id: 'test-pharmacist-id',
        question: 'Please clarify the medication name',
      };

      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockClarificationRepo.create.mockReturnValue(clarification);
      mockClarificationRepo.save.mockResolvedValue(clarification);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      (PrescriptionStateMachine.canRequestClarification as jest.Mock).mockReturnValue({ can: true });
      (PrescriptionStateMachine.transitionToClarificationNeeded as jest.Mock).mockImplementation((presc: Prescription) => {
        presc.status = PrescriptionStatus.CLARIFICATION_NEEDED;
      });

      const req = createMockRequest('test-prescription-id', requestBody);
      const res = createMockResponse();

      await requestClarification(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockClarificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: null,
        })
      );
    });
  });

  // ==========================================================================
  // Validation Error Tests
  // ==========================================================================

  describe('Validation Errors', () => {
    it('should reject request without pharmacist_id', async () => {
      const requestBody = {
        question: 'What is the correct dosage?',
      };

      const req = createMockRequest('test-prescription-id', requestBody);
      const res = createMockResponse();

      await requestClarification(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'pharmacist_id is required',
          code: 'MISSING_PHARMACIST_ID',
        })
      );
      expect(mockClarificationRepo.save).not.toHaveBeenCalled();
    });

    it('should reject request without question', async () => {
      const requestBody = {
        pharmacist_id: 'test-pharmacist-id',
      };

      const req = createMockRequest('test-prescription-id', requestBody);
      const res = createMockResponse();

      await requestClarification(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'question is required',
          code: 'MISSING_QUESTION',
        })
      );
    });

    it('should reject question that is too short', async () => {
      const requestBody = {
        pharmacist_id: 'test-pharmacist-id',
        question: 'Too short',
      };

      const req = createMockRequest('test-prescription-id', requestBody);
      const res = createMockResponse();

      await requestClarification(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'question must be at least 10 characters',
          code: 'QUESTION_TOO_SHORT',
        })
      );
    });
  });

  // ==========================================================================
  // Business Logic Error Tests
  // ==========================================================================

  describe('Business Logic Errors', () => {
    it('should return 404 when prescription not found', async () => {
      mockPrescriptionRepo.findOne.mockResolvedValue(null);

      const requestBody = {
        pharmacist_id: 'test-pharmacist-id',
        question: 'What is the correct dosage?',
      };

      const req = createMockRequest('non-existent-id', requestBody);
      const res = createMockResponse();

      await requestClarification(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Prescription not found',
          code: 'PRESCRIPTION_NOT_FOUND',
        })
      );
    });

    it('should reject when prescription has no prescribing doctor', async () => {
      const prescription = createMockPrescription({ prescribing_doctor_id: null });
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);

      const requestBody = {
        pharmacist_id: 'test-pharmacist-id',
        question: 'What is the correct dosage?',
      };

      const req = createMockRequest('test-prescription-id', requestBody);
      const res = createMockResponse();

      await requestClarification(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Prescription has no prescribing doctor to contact',
          code: 'NO_DOCTOR',
        })
      );
    });

    it('should reject when prescription is not in valid state', async () => {
      const prescription = createMockPrescription({ status: PrescriptionStatus.APPROVED });
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);

      (PrescriptionStateMachine.canRequestClarification as jest.Mock).mockReturnValue({
        can: false,
        reason: 'Prescription must be in in_review state',
      });

      const requestBody = {
        pharmacist_id: 'test-pharmacist-id',
        question: 'What is the correct dosage?',
      };

      const req = createMockRequest('test-prescription-id', requestBody);
      const res = createMockResponse();

      await requestClarification(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Prescription must be in in_review state',
          code: 'CANNOT_REQUEST_CLARIFICATION',
        })
      );
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrescriptionRepo.findOne.mockRejectedValue(new Error('Database connection failed'));

      const requestBody = {
        pharmacist_id: 'test-pharmacist-id',
        question: 'What is the correct dosage?',
      };

      const req = createMockRequest('test-prescription-id', requestBody);
      const res = createMockResponse();

      await requestClarification(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to request clarification',
          code: 'CLARIFICATION_ERROR',
        })
      );
    });
  });
});
