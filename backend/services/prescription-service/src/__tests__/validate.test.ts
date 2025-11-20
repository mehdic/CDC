/**
 * Unit Tests for Validate Controller
 * T094 - User Story 1: Prescription Processing & Validation
 * Tests validation orchestration, FDB integration, allergy/contraindication checking
 */

import { Request, Response } from 'express';
import { validatePrescription } from '../controllers/validateController';
import { Prescription, PrescriptionStatus } from '../../../../shared/models/Prescription';
import { PrescriptionItem } from '../../../../shared/models/PrescriptionItem';
import { FDBService, DrugInteractionSeverity } from '../integrations/fdb';
import { AllergyChecker, AllergySeverity } from '../utils/allergyCheck';
import { ContraindicationChecker, ContraindicationSeverity } from '../utils/contraindications';

// ============================================================================
// Mocks
// ============================================================================

// Mock TypeORM DataSource
const mockPrescriptionRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockDataSource = {
  getRepository: jest.fn().mockReturnValue(mockPrescriptionRepo),
};

// Mock FDBService
jest.mock('../integrations/fdb');
const MockedFDBService = FDBService as jest.MockedClass<typeof FDBService>;

// Mock AllergyChecker
jest.mock('../utils/allergyCheck');
const MockedAllergyChecker = AllergyChecker as jest.MockedClass<typeof AllergyChecker>;

// Mock ContraindicationChecker
jest.mock('../utils/contraindications');
const MockedContraindicationChecker = ContraindicationChecker as jest.MockedClass<typeof ContraindicationChecker>;

// ============================================================================
// Test Helpers
// ============================================================================

function createMockRequest(prescriptionId: string): Partial<Request> {
  return {
    params: { id: prescriptionId },
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
  prescription.status = PrescriptionStatus.PENDING;
  prescription.patient_id = 'test-patient-id';
  prescription.pharmacy_id = 'test-pharmacy-id';
  prescription.items = [
    {
      id: 'item-1',
      medication_name: 'Aspirin 500mg',
      dosage: '500mg',
      quantity: 30,
    } as PrescriptionItem,
  ];
  return Object.assign(prescription, overrides);
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Validate Controller - validatePrescription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation
    mockDataSource.getRepository.mockReturnValue(mockPrescriptionRepo);
  });

  // ==========================================================================
  // Happy Path Tests
  // ==========================================================================

  describe('Happy Path', () => {
    it('should validate prescription with no safety issues', async () => {
      const prescription = createMockPrescription();
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      // Mock FDB Service - no interactions
      const mockFdbInstance = {
        checkDrugInteractions: jest.fn().mockResolvedValue({
          hasInteractions: false,
          interactions: [],
          checkedAt: new Date(),
        }),
      };
      MockedFDBService.mockImplementation(() => mockFdbInstance as any);
      MockedFDBService.sortBySeverity = jest.fn((interactions) => interactions);

      // Mock AllergyChecker - no allergies
      const mockAllergyInstance = {
        checkAllergies: jest.fn().mockResolvedValue({
          hasAllergies: false,
          warnings: [],
          checkedAt: new Date(),
        }),
      };
      MockedAllergyChecker.mockImplementation(() => mockAllergyInstance as any);
      MockedAllergyChecker.sortBySeverity = jest.fn((warnings) => warnings);
      MockedAllergyChecker.hasLifeThreateningAllergies = jest.fn(() => false);

      // Mock ContraindicationChecker - no contraindications
      const mockContraindicationInstance = {
        checkContraindications: jest.fn().mockResolvedValue({
          hasContraindications: false,
          contraindications: [],
          checkedAt: new Date(),
        }),
      };
      MockedContraindicationChecker.mockImplementation(() => mockContraindicationInstance as any);
      MockedContraindicationChecker.sortBySeverity = jest.fn((contraindications) => contraindications);
      MockedContraindicationChecker.hasAbsoluteContraindications = jest.fn(() => false);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          prescription_id: 'test-prescription-id',
          status: 'validated',
          critical_issues_found: false,
          can_approve: true,
          drug_interactions: {
            has_interactions: false,
            interactions: [],
          },
          allergy_warnings: {
            has_allergies: false,
            warnings: [],
          },
          contraindications: {
            has_contraindications: false,
            contraindications: [],
          },
        })
      );

      expect(mockPrescriptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PrescriptionStatus.IN_REVIEW,
        })
      );
    });

    it('should flag drug interactions with severity levels', async () => {
      const prescription = createMockPrescription({
        items: [
          { medication_name: 'Warfarin', dosage: '5mg' } as PrescriptionItem,
          { medication_name: 'Aspirin', dosage: '81mg' } as PrescriptionItem,
        ],
      });
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      // Mock FDB Service - major interaction
      const mockInteraction = {
        drug1: 'Warfarin',
        drug2: 'Aspirin',
        severity: DrugInteractionSeverity.MAJOR,
        description: 'Increased bleeding risk',
        recommendation: 'Monitor INR closely',
      };

      const mockFdbInstance = {
        checkDrugInteractions: jest.fn().mockResolvedValue({
          hasInteractions: true,
          interactions: [mockInteraction],
          checkedAt: new Date(),
        }),
      };
      MockedFDBService.mockImplementation(() => mockFdbInstance as any);
      MockedFDBService.sortBySeverity = jest.fn((interactions) => interactions);

      // Mock AllergyChecker - no allergies
      const mockAllergyInstance = {
        checkAllergies: jest.fn().mockResolvedValue({
          hasAllergies: false,
          warnings: [],
          checkedAt: new Date(),
        }),
      };
      MockedAllergyChecker.mockImplementation(() => mockAllergyInstance as any);
      MockedAllergyChecker.sortBySeverity = jest.fn((warnings) => warnings);
      MockedAllergyChecker.hasLifeThreateningAllergies = jest.fn(() => false);

      // Mock ContraindicationChecker - no contraindications
      const mockContraindicationInstance = {
        checkContraindications: jest.fn().mockResolvedValue({
          hasContraindications: false,
          contraindications: [],
          checkedAt: new Date(),
        }),
      };
      MockedContraindicationChecker.mockImplementation(() => mockContraindicationInstance as any);
      MockedContraindicationChecker.sortBySeverity = jest.fn((contraindications) => contraindications);
      MockedContraindicationChecker.hasAbsoluteContraindications = jest.fn(() => false);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'warnings',
          drug_interactions: {
            has_interactions: true,
            interactions: [mockInteraction],
          },
          critical_issues_found: false,
          can_approve: true,
        })
      );
    });

    it('should flag patient allergies', async () => {
      const prescription = createMockPrescription({
        items: [{ medication_name: 'Penicillin', dosage: '500mg' } as PrescriptionItem],
      });
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      // Mock FDB Service - no interactions
      const mockFdbInstance = {
        checkDrugInteractions: jest.fn().mockResolvedValue({
          hasInteractions: false,
          interactions: [],
          checkedAt: new Date(),
        }),
      };
      MockedFDBService.mockImplementation(() => mockFdbInstance as any);
      MockedFDBService.sortBySeverity = jest.fn((interactions) => interactions);

      // Mock AllergyChecker - severe allergy
      const mockAllergyWarning = {
        allergen: 'Penicillin',
        medication: 'Penicillin',
        reaction_type: 'anaphylaxis',
        severity: AllergySeverity.SEVERE,
        recommendation: 'Contact prescriber for alternative medication',
      };

      const mockAllergyInstance = {
        checkAllergies: jest.fn().mockResolvedValue({
          hasAllergies: true,
          warnings: [mockAllergyWarning],
          checkedAt: new Date(),
        }),
      };
      MockedAllergyChecker.mockImplementation(() => mockAllergyInstance as any);
      MockedAllergyChecker.sortBySeverity = jest.fn((warnings) => warnings);
      MockedAllergyChecker.hasLifeThreateningAllergies = jest.fn(() => false);

      // Mock ContraindicationChecker - no contraindications
      const mockContraindicationInstance = {
        checkContraindications: jest.fn().mockResolvedValue({
          hasContraindications: false,
          contraindications: [],
          checkedAt: new Date(),
        }),
      };
      MockedContraindicationChecker.mockImplementation(() => mockContraindicationInstance as any);
      MockedContraindicationChecker.sortBySeverity = jest.fn((contraindications) => contraindications);
      MockedContraindicationChecker.hasAbsoluteContraindications = jest.fn(() => false);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'warnings',
          allergy_warnings: {
            has_allergies: true,
            warnings: [mockAllergyWarning],
          },
          critical_issues_found: false,
          can_approve: true,
        })
      );
    });

    it('should flag contraindications against medical conditions', async () => {
      const prescription = createMockPrescription({
        items: [{ medication_name: 'Metformin', dosage: '500mg' } as PrescriptionItem],
      });
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      // Mock FDB Service - no interactions
      const mockFdbInstance = {
        checkDrugInteractions: jest.fn().mockResolvedValue({
          hasInteractions: false,
          interactions: [],
          checkedAt: new Date(),
        }),
      };
      MockedFDBService.mockImplementation(() => mockFdbInstance as any);
      MockedFDBService.sortBySeverity = jest.fn((interactions) => interactions);

      // Mock AllergyChecker - no allergies
      const mockAllergyInstance = {
        checkAllergies: jest.fn().mockResolvedValue({
          hasAllergies: false,
          warnings: [],
          checkedAt: new Date(),
        }),
      };
      MockedAllergyChecker.mockImplementation(() => mockAllergyInstance as any);
      MockedAllergyChecker.sortBySeverity = jest.fn((warnings) => warnings);
      MockedAllergyChecker.hasLifeThreateningAllergies = jest.fn(() => false);

      // Mock ContraindicationChecker - kidney disease contraindication
      const mockContraindication = {
        condition: 'Kidney Disease',
        medication: 'Metformin',
        severity: ContraindicationSeverity.RELATIVE,
        reason: 'May increase risk of lactic acidosis',
        recommendation: 'Monitor renal function closely',
      };

      const mockContraindicationInstance = {
        checkContraindications: jest.fn().mockResolvedValue({
          hasContraindications: true,
          contraindications: [mockContraindication],
          checkedAt: new Date(),
        }),
      };
      MockedContraindicationChecker.mockImplementation(() => mockContraindicationInstance as any);
      MockedContraindicationChecker.sortBySeverity = jest.fn((contraindications) => contraindications);
      MockedContraindicationChecker.hasAbsoluteContraindications = jest.fn(() => false);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'warnings',
          contraindications: {
            has_contraindications: true,
            contraindications: [mockContraindication],
          },
          critical_issues_found: false,
          can_approve: true,
        })
      );
    });
  });

  // ==========================================================================
  // Critical Issues Tests
  // ==========================================================================

  describe('Critical Issues', () => {
    it('should block approval when life-threatening allergies detected', async () => {
      const prescription = createMockPrescription();
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      // Mock FDB Service - no interactions
      const mockFdbInstance = {
        checkDrugInteractions: jest.fn().mockResolvedValue({
          hasInteractions: false,
          interactions: [],
          checkedAt: new Date(),
        }),
      };
      MockedFDBService.mockImplementation(() => mockFdbInstance as any);
      MockedFDBService.sortBySeverity = jest.fn((interactions) => interactions);

      // Mock AllergyChecker - life-threatening allergy
      const mockAllergyWarning = {
        allergen: 'Penicillin',
        medication: 'Amoxicillin',
        reaction_type: 'anaphylaxis',
        severity: AllergySeverity.LIFE_THREATENING,
        recommendation: 'DO NOT DISPENSE',
      };

      const mockAllergyInstance = {
        checkAllergies: jest.fn().mockResolvedValue({
          hasAllergies: true,
          warnings: [mockAllergyWarning],
          checkedAt: new Date(),
        }),
      };
      MockedAllergyChecker.mockImplementation(() => mockAllergyInstance as any);
      MockedAllergyChecker.sortBySeverity = jest.fn((warnings) => warnings);
      MockedAllergyChecker.hasLifeThreateningAllergies = jest.fn(() => true);

      // Mock ContraindicationChecker - no contraindications
      const mockContraindicationInstance = {
        checkContraindications: jest.fn().mockResolvedValue({
          hasContraindications: false,
          contraindications: [],
          checkedAt: new Date(),
        }),
      };
      MockedContraindicationChecker.mockImplementation(() => mockContraindicationInstance as any);
      MockedContraindicationChecker.sortBySeverity = jest.fn((contraindications) => contraindications);
      MockedContraindicationChecker.hasAbsoluteContraindications = jest.fn(() => false);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'critical_issues',
          critical_issues_found: true,
          can_approve: false,
        })
      );
    });

    it('should block approval when absolute contraindications detected', async () => {
      const prescription = createMockPrescription();
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      // Mock FDB Service - no interactions
      const mockFdbInstance = {
        checkDrugInteractions: jest.fn().mockResolvedValue({
          hasInteractions: false,
          interactions: [],
          checkedAt: new Date(),
        }),
      };
      MockedFDBService.mockImplementation(() => mockFdbInstance as any);
      MockedFDBService.sortBySeverity = jest.fn((interactions) => interactions);

      // Mock AllergyChecker - no allergies
      const mockAllergyInstance = {
        checkAllergies: jest.fn().mockResolvedValue({
          hasAllergies: false,
          warnings: [],
          checkedAt: new Date(),
        }),
      };
      MockedAllergyChecker.mockImplementation(() => mockAllergyInstance as any);
      MockedAllergyChecker.sortBySeverity = jest.fn((warnings) => warnings);
      MockedAllergyChecker.hasLifeThreateningAllergies = jest.fn(() => false);

      // Mock ContraindicationChecker - absolute contraindication
      const mockContraindication = {
        condition: 'Pregnancy',
        medication: 'Warfarin',
        severity: ContraindicationSeverity.ABSOLUTE,
        reason: 'Teratogenic',
        recommendation: 'DO NOT DISPENSE',
      };

      const mockContraindicationInstance = {
        checkContraindications: jest.fn().mockResolvedValue({
          hasContraindications: true,
          contraindications: [mockContraindication],
          checkedAt: new Date(),
        }),
      };
      MockedContraindicationChecker.mockImplementation(() => mockContraindicationInstance as any);
      MockedContraindicationChecker.sortBySeverity = jest.fn((contraindications) => contraindications);
      MockedContraindicationChecker.hasAbsoluteContraindications = jest.fn(() => true);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'critical_issues',
          critical_issues_found: true,
          can_approve: false,
        })
      );
    });

    it('should block approval when contraindicated drug interactions detected', async () => {
      const prescription = createMockPrescription();
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      // Mock FDB Service - contraindicated interaction
      const mockInteraction = {
        drug1: 'Simvastatin',
        drug2: 'Clarithromycin',
        severity: DrugInteractionSeverity.CONTRAINDICATED,
        description: 'Risk of rhabdomyolysis',
        recommendation: 'DO NOT USE TOGETHER',
      };

      const mockFdbInstance = {
        checkDrugInteractions: jest.fn().mockResolvedValue({
          hasInteractions: true,
          interactions: [mockInteraction],
          checkedAt: new Date(),
        }),
      };
      MockedFDBService.mockImplementation(() => mockFdbInstance as any);
      MockedFDBService.sortBySeverity = jest.fn((interactions) => interactions);

      // Mock AllergyChecker - no allergies
      const mockAllergyInstance = {
        checkAllergies: jest.fn().mockResolvedValue({
          hasAllergies: false,
          warnings: [],
          checkedAt: new Date(),
        }),
      };
      MockedAllergyChecker.mockImplementation(() => mockAllergyInstance as any);
      MockedAllergyChecker.sortBySeverity = jest.fn((warnings) => warnings);
      MockedAllergyChecker.hasLifeThreateningAllergies = jest.fn(() => false);

      // Mock ContraindicationChecker - no contraindications
      const mockContraindicationInstance = {
        checkContraindications: jest.fn().mockResolvedValue({
          hasContraindications: false,
          contraindications: [],
          checkedAt: new Date(),
        }),
      };
      MockedContraindicationChecker.mockImplementation(() => mockContraindicationInstance as any);
      MockedContraindicationChecker.sortBySeverity = jest.fn((contraindications) => contraindications);
      MockedContraindicationChecker.hasAbsoluteContraindications = jest.fn(() => false);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'critical_issues',
          critical_issues_found: true,
          can_approve: false,
        })
      );
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should return 404 if prescription not found', async () => {
      mockPrescriptionRepo.findOne.mockResolvedValue(null);

      const req = createMockRequest('non-existent-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Prescription not found',
        code: 'PRESCRIPTION_NOT_FOUND',
      });
    });

    it('should return 400 if prescription cannot be edited (immutable state)', async () => {
      const prescription = createMockPrescription({
        status: PrescriptionStatus.APPROVED,
      });
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Cannot validate prescription in 'approved' state",
        code: 'INVALID_STATE',
      });
    });

    it('should return 400 if prescription has no items', async () => {
      const prescription = createMockPrescription({
        items: [],
      });
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Prescription has no items to validate',
        code: 'NO_ITEMS',
      });
    });

    it('should handle Patient Service unavailability gracefully', async () => {
      const prescription = createMockPrescription();
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      // Mock FDB Service - working
      const mockFdbInstance = {
        checkDrugInteractions: jest.fn().mockResolvedValue({
          hasInteractions: false,
          interactions: [],
          checkedAt: new Date(),
        }),
      };
      MockedFDBService.mockImplementation(() => mockFdbInstance as any);
      MockedFDBService.sortBySeverity = jest.fn((interactions) => interactions);

      // Mock AllergyChecker - Patient Service unavailable
      const mockAllergyInstance = {
        checkAllergies: jest.fn().mockResolvedValue({
          hasAllergies: false,
          warnings: [],
          checkedAt: new Date(),
        }),
      };
      MockedAllergyChecker.mockImplementation(() => mockAllergyInstance as any);
      MockedAllergyChecker.sortBySeverity = jest.fn((warnings) => warnings);
      MockedAllergyChecker.hasLifeThreateningAllergies = jest.fn(() => false);

      // Mock ContraindicationChecker - working
      const mockContraindicationInstance = {
        checkContraindications: jest.fn().mockResolvedValue({
          hasContraindications: false,
          contraindications: [],
          checkedAt: new Date(),
        }),
      };
      MockedContraindicationChecker.mockImplementation(() => mockContraindicationInstance as any);
      MockedContraindicationChecker.sortBySeverity = jest.fn((contraindications) => contraindications);
      MockedContraindicationChecker.hasAbsoluteContraindications = jest.fn(() => false);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      // Should still return success (graceful degradation)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'validated',
          critical_issues_found: false,
          can_approve: true,
        })
      );
    });

    it('should return 500 if database error occurs', async () => {
      mockPrescriptionRepo.findOne.mockRejectedValue(new Error('Database connection failed'));

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to validate prescription',
        code: 'VALIDATION_ERROR',
        message: 'Database connection failed',
      });
    });
  });

  // ==========================================================================
  // State Transition Tests
  // ==========================================================================

  describe('State Transitions', () => {
    it('should transition prescription from PENDING to IN_REVIEW', async () => {
      const prescription = createMockPrescription({
        status: PrescriptionStatus.PENDING,
      });
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      // Mock all services
      const mockFdbInstance = {
        checkDrugInteractions: jest.fn().mockResolvedValue({
          hasInteractions: false,
          interactions: [],
          checkedAt: new Date(),
        }),
      };
      MockedFDBService.mockImplementation(() => mockFdbInstance as any);
      MockedFDBService.sortBySeverity = jest.fn((interactions) => interactions);

      const mockAllergyInstance = {
        checkAllergies: jest.fn().mockResolvedValue({
          hasAllergies: false,
          warnings: [],
          checkedAt: new Date(),
        }),
      };
      MockedAllergyChecker.mockImplementation(() => mockAllergyInstance as any);
      MockedAllergyChecker.sortBySeverity = jest.fn((warnings) => warnings);
      MockedAllergyChecker.hasLifeThreateningAllergies = jest.fn(() => false);

      const mockContraindicationInstance = {
        checkContraindications: jest.fn().mockResolvedValue({
          hasContraindications: false,
          contraindications: [],
          checkedAt: new Date(),
        }),
      };
      MockedContraindicationChecker.mockImplementation(() => mockContraindicationInstance as any);
      MockedContraindicationChecker.sortBySeverity = jest.fn((contraindications) => contraindications);
      MockedContraindicationChecker.hasAbsoluteContraindications = jest.fn(() => false);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(mockPrescriptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PrescriptionStatus.IN_REVIEW,
        })
      );
    });

    it('should not change status if already IN_REVIEW', async () => {
      const prescription = createMockPrescription({
        status: PrescriptionStatus.IN_REVIEW,
      });
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      // Mock all services
      const mockFdbInstance = {
        checkDrugInteractions: jest.fn().mockResolvedValue({
          hasInteractions: false,
          interactions: [],
          checkedAt: new Date(),
        }),
      };
      MockedFDBService.mockImplementation(() => mockFdbInstance as any);
      MockedFDBService.sortBySeverity = jest.fn((interactions) => interactions);

      const mockAllergyInstance = {
        checkAllergies: jest.fn().mockResolvedValue({
          hasAllergies: false,
          warnings: [],
          checkedAt: new Date(),
        }),
      };
      MockedAllergyChecker.mockImplementation(() => mockAllergyInstance as any);
      MockedAllergyChecker.sortBySeverity = jest.fn((warnings) => warnings);
      MockedAllergyChecker.hasLifeThreateningAllergies = jest.fn(() => false);

      const mockContraindicationInstance = {
        checkContraindications: jest.fn().mockResolvedValue({
          hasContraindications: false,
          contraindications: [],
          checkedAt: new Date(),
        }),
      };
      MockedContraindicationChecker.mockImplementation(() => mockContraindicationInstance as any);
      MockedContraindicationChecker.sortBySeverity = jest.fn((contraindications) => contraindications);
      MockedContraindicationChecker.hasAbsoluteContraindications = jest.fn(() => false);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(mockPrescriptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PrescriptionStatus.IN_REVIEW,
        })
      );
    });
  });

  // ==========================================================================
  // Data Persistence Tests
  // ==========================================================================

  describe('Data Persistence', () => {
    it('should save validation results to prescription', async () => {
      const prescription = createMockPrescription();
      mockPrescriptionRepo.findOne.mockResolvedValue(prescription);
      mockPrescriptionRepo.save.mockResolvedValue(prescription);

      const mockInteraction = {
        drug1: 'Drug A',
        drug2: 'Drug B',
        severity: DrugInteractionSeverity.MODERATE,
        description: 'Test interaction',
        recommendation: 'Monitor',
      };

      const mockAllergyWarning = {
        allergen: 'Allergen X',
        medication: 'Drug A',
        reaction_type: 'rash',
        severity: AllergySeverity.MILD,
        recommendation: 'Verify tolerance',
      };

      const mockContraindication = {
        condition: 'Condition Y',
        medication: 'Drug A',
        severity: ContraindicationSeverity.PRECAUTION,
        reason: 'Test reason',
        recommendation: 'Monitor',
      };

      // Mock FDB Service
      const mockFdbInstance = {
        checkDrugInteractions: jest.fn().mockResolvedValue({
          hasInteractions: true,
          interactions: [mockInteraction],
          checkedAt: new Date(),
        }),
      };
      MockedFDBService.mockImplementation(() => mockFdbInstance as any);
      MockedFDBService.sortBySeverity = jest.fn((interactions) => interactions);

      // Mock AllergyChecker
      const mockAllergyInstance = {
        checkAllergies: jest.fn().mockResolvedValue({
          hasAllergies: true,
          warnings: [mockAllergyWarning],
          checkedAt: new Date(),
        }),
      };
      MockedAllergyChecker.mockImplementation(() => mockAllergyInstance as any);
      MockedAllergyChecker.sortBySeverity = jest.fn((warnings) => warnings);
      MockedAllergyChecker.hasLifeThreateningAllergies = jest.fn(() => false);

      // Mock ContraindicationChecker
      const mockContraindicationInstance = {
        checkContraindications: jest.fn().mockResolvedValue({
          hasContraindications: true,
          contraindications: [mockContraindication],
          checkedAt: new Date(),
        }),
      };
      MockedContraindicationChecker.mockImplementation(() => mockContraindicationInstance as any);
      MockedContraindicationChecker.sortBySeverity = jest.fn((contraindications) => contraindications);
      MockedContraindicationChecker.hasAbsoluteContraindications = jest.fn(() => false);

      const req = createMockRequest('test-prescription-id') as Request;
      const res = createMockResponse() as Response;

      await validatePrescription(req, res);

      expect(mockPrescriptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          drug_interactions: [mockInteraction],
          allergy_warnings: [mockAllergyWarning],
          contraindications: [mockContraindication],
        })
      );
    });
  });
});
