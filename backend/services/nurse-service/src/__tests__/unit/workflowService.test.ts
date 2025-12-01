/**
 * Unit Tests for WorkflowService
 */

import axios from 'axios';
import { WorkflowService } from '../../services/workflowService';
import { NurseOrder, OrderStatus, OrderUrgency } from '../../models/NurseOrder';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WorkflowService', () => {
  let workflowService: WorkflowService;

  beforeEach(() => {
    workflowService = new WorkflowService();
    jest.clearAllMocks();
  });

  describe('checkStock', () => {
    it('should return stock availability when service responds', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          available: true,
          currentStock: 100,
        },
      });

      const result = await workflowService.checkStock('Aspirin', 30);

      expect(result).toEqual({
        available: true,
        currentStock: 100,
        medication: 'Aspirin',
      });
    });

    it('should return unavailable when service fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Service unavailable'));

      const result = await workflowService.checkStock('Aspirin', 30);

      expect(result).toEqual({
        available: false,
        currentStock: 0,
        medication: 'Aspirin',
      });
    });
  });

  describe('validatePrescription', () => {
    it('should return valid when prescription exists', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          valid: true,
          prescriptionId: 'prescription-1',
        },
      });

      const result = await workflowService.validatePrescription(
        'patient-1',
        'Aspirin',
        '100mg'
      );

      expect(result).toEqual({
        valid: true,
        prescriptionId: 'prescription-1',
      });
    });

    it('should return invalid when service fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Service unavailable'));

      const result = await workflowService.validatePrescription(
        'patient-1',
        'Aspirin',
        '100mg'
      );

      expect(result).toEqual({
        valid: false,
        message: 'Validation service unavailable',
      });
    });
  });

  describe('processOrderWorkflow', () => {
    it('should process complete workflow successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        medication: 'Aspirin',
        dosage: '100mg',
        quantity: 30,
        patientId: 'patient-1',
      } as NurseOrder;

      mockedAxios.post
        .mockResolvedValueOnce({
          data: { available: true, currentStock: 100 },
        })
        .mockResolvedValueOnce({
          data: { valid: true, prescriptionId: 'prescription-1' },
        });

      const result = await workflowService.processOrderWorkflow(mockOrder);

      expect(result.stockCheck.available).toBe(true);
      expect(result.prescriptionValidation.valid).toBe(true);
      expect(result.canProceed).toBe(true);
    });

    it('should return canProceed false when stock unavailable', async () => {
      const mockOrder = {
        id: 'order-1',
        medication: 'Aspirin',
        dosage: '100mg',
        quantity: 30,
        patientId: 'patient-1',
      } as NurseOrder;

      mockedAxios.post
        .mockResolvedValueOnce({
          data: { available: false, currentStock: 0 },
        })
        .mockResolvedValueOnce({
          data: { valid: true },
        });

      const result = await workflowService.processOrderWorkflow(mockOrder);

      expect(result.canProceed).toBe(false);
    });
  });
});
