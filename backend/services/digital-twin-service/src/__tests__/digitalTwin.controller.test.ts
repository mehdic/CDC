/**
 * Digital Twin Controller Tests
 * Unit tests for API endpoints
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '@shared/middleware/auth';
import {
  getDigitalTwinProfile,
  refreshDigitalTwinProfile,
  getHealthTrends,
} from '../controllers/digitalTwin.controller';

// Mock the dependencies
jest.mock('../index', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('@shared/services/digitalTwinService', () => ({
  getDigitalTwinProfile: jest.fn(),
}));

import { AppDataSource } from '../index';
import { getDigitalTwinProfile as computeProfile } from '@shared/services/digitalTwinService';

describe('Digital Twin Controller', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockReq = {
      params: {},
    };

    mockRes = {
      json: mockJson,
      status: mockStatus,
    };

    jest.clearAllMocks();
  });

  describe('getDigitalTwinProfile', () => {
    it('should return 400 if patient ID is missing', async () => {
      mockReq.params = {};

      await getDigitalTwinProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Patient ID is required' });
    });

    it('should return cached profile if available and fresh', async () => {
      const patientId = 'patient-123';
      mockReq.params = { patientId };

      const cachedProfile = {
        patientId,
        patientName: 'John Doe',
        age: 45,
        demographic: { age_group: 'adult' as const, profile_completeness: 90 },
        medicalHistory: {
          chronic_conditions: [],
          allergies: [],
          current_medications: [],
          past_medications: [],
          total_prescriptions: 5,
          last_prescription_date: new Date(),
        },
        purchaseBehavior: {
          total_orders: 10,
          last_order_date: new Date(),
          preferred_categories: [],
          avg_order_value: 50,
          purchase_frequency: 'medium' as const,
        },
        healthInsights: {
          medication_adherence_score: 85,
          health_risk_level: 'low' as const,
          risk_factors: [],
          drug_interactions: [],
          missing_preventive_care: [],
        },
        predictions: {
          refill_due_dates: [],
          upcoming_health_needs: [],
          recommended_screenings: [],
        },
        engagement: {
          app_usage_frequency: 'high' as const,
          teleconsultation_count: 2,
          last_active_date: new Date(),
          vip_status: false,
        },
        privacy: {
          data_sharing_consent: true,
          last_updated: new Date(),
        },
        lastComputed: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago (fresh)
      };

      const mockFindOne = jest.fn().mockResolvedValue(cachedProfile);
      (AppDataSource.getRepository as jest.Mock).mockReturnValue({
        findOne: mockFindOne,
      });

      await getDigitalTwinProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockFindOne).toHaveBeenCalledWith({ where: { patientId } });
      expect(mockJson).toHaveBeenCalled();
      const response = mockJson.mock.calls[0]?.[0];
      expect(response).toBeDefined();
      expect(response?.cached).toBe(true);
    });

    it('should compute new profile if cache is stale', async () => {
      const patientId = 'patient-123';
      mockReq.params = { patientId };

      const staleProfile = {
        patientId,
        lastComputed: new Date(Date.now() - 1000 * 60 * 60 * 25), // 25 hours ago (stale)
      };

      const freshProfile = {
        patient_id: patientId,
        patient_name: 'John Doe',
        age: 45,
        demographic: { age_group: 'adult' as const, profile_completeness: 90 },
        medical_history: {
          chronic_conditions: [],
          allergies: [],
          current_medications: [],
          past_medications: [],
          total_prescriptions: 5,
          last_prescription_date: null,
        },
        purchase_behavior: {
          total_orders: 10,
          last_order_date: null,
          preferred_categories: [],
          avg_order_value: 50,
          purchase_frequency: 'medium' as const,
        },
        health_insights: {
          medication_adherence_score: 85,
          health_risk_level: 'low' as const,
          risk_factors: [],
          drug_interactions: [],
          missing_preventive_care: [],
        },
        predictions: {
          refill_due_dates: [],
          upcoming_health_needs: [],
          recommended_screenings: [],
        },
        engagement: {
          app_usage_frequency: 'high' as const,
          teleconsultation_count: 2,
          last_active_date: null,
          vip_status: false,
        },
        privacy: {
          data_sharing_consent: true,
          last_updated: new Date(),
        },
      };

      const mockFindOne = jest.fn().mockResolvedValue(staleProfile);
      const mockUpdate = jest.fn().mockResolvedValue({});

      (AppDataSource.getRepository as jest.Mock).mockReturnValue({
        findOne: mockFindOne,
        update: mockUpdate,
      });

      (computeProfile as jest.Mock).mockResolvedValue(freshProfile);

      await getDigitalTwinProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(computeProfile).toHaveBeenCalledWith(patientId);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalled();
      const response = mockJson.mock.calls[0]?.[0];
      expect(response).toBeDefined();
      expect(response?.cached).toBe(false);
    });

    it('should return 404 if patient not found', async () => {
      const patientId = 'nonexistent';
      mockReq.params = { patientId };

      const mockFindOne = jest.fn().mockResolvedValue(null);
      (AppDataSource.getRepository as jest.Mock).mockReturnValue({
        findOne: mockFindOne,
      });

      (computeProfile as jest.Mock).mockResolvedValue(null);

      await getDigitalTwinProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Patient not found' });
    });
  });

  describe('refreshDigitalTwinProfile', () => {
    it('should return 400 if patient ID is missing', async () => {
      mockReq.params = {};

      await refreshDigitalTwinProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Patient ID is required' });
    });

    it('should force recompute profile', async () => {
      const patientId = 'patient-123';
      mockReq.params = { patientId };

      const freshProfile = {
        patient_id: patientId,
        patient_name: 'John Doe',
        age: 45,
        demographic: { age_group: 'adult' as const, profile_completeness: 90 },
        medical_history: {
          chronic_conditions: [],
          allergies: [],
          current_medications: [],
          past_medications: [],
          total_prescriptions: 5,
          last_prescription_date: null,
        },
        purchase_behavior: {
          total_orders: 10,
          last_order_date: null,
          preferred_categories: [],
          avg_order_value: 50,
          purchase_frequency: 'medium' as const,
        },
        health_insights: {
          medication_adherence_score: 85,
          health_risk_level: 'low' as const,
          risk_factors: [],
          drug_interactions: [],
          missing_preventive_care: [],
        },
        predictions: {
          refill_due_dates: [],
          upcoming_health_needs: [],
          recommended_screenings: [],
        },
        engagement: {
          app_usage_frequency: 'high' as const,
          teleconsultation_count: 2,
          last_active_date: null,
          vip_status: false,
        },
        privacy: {
          data_sharing_consent: true,
          last_updated: new Date(),
        },
      };

      const mockFindOne = jest.fn().mockResolvedValue(null);
      const mockCreate = jest.fn().mockReturnValue({});
      const mockSave = jest.fn().mockResolvedValue({});

      (AppDataSource.getRepository as jest.Mock).mockReturnValue({
        findOne: mockFindOne,
        create: mockCreate,
        save: mockSave,
      });

      (computeProfile as jest.Mock).mockResolvedValue(freshProfile);

      await refreshDigitalTwinProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(computeProfile).toHaveBeenCalledWith(patientId);
      expect(mockSave).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalled();
      const response = mockJson.mock.calls[0]?.[0];
      expect(response).toBeDefined();
      expect(response?.cached).toBe(false);
    });
  });

  describe('getHealthTrends', () => {
    it('should return 400 if patient ID is missing', async () => {
      mockReq.params = {};

      await getHealthTrends(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Patient ID is required' });
    });

    it('should return placeholder trend data', async () => {
      const patientId = 'patient-123';
      mockReq.params = { patientId };

      await getHealthTrends(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalled();
      const response = mockJson.mock.calls[0]?.[0];
      expect(response).toBeDefined();
      expect(response?.patient_id).toBe(patientId);
      expect(response?.trends).toBeDefined();
    });
  });
});
