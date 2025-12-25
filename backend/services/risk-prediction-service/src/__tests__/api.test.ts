/**
 * API Integration Tests
 */

import request from 'supertest';
import { app } from '../index';
import type { PatientData } from '../types/risk.types';

describe('Risk Prediction API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'risk-prediction-service');
    });
  });

  describe('POST /api/risk-prediction/assess', () => {
    it('should assess patient risk successfully', async () => {
      const patientData: PatientData = {
        patientId: 'P001',
        age: 70,
        medications: [
          {
            id: 'M001',
            name: 'Warfarin',
            activeIngredient: 'warfarin',
            dosage: '5mg',
            frequency: 'daily',
            startDate: new Date('2024-01-01'),
          },
          {
            id: 'M002',
            name: 'Aspirin',
            activeIngredient: 'aspirin',
            dosage: '81mg',
            frequency: 'daily',
            startDate: new Date('2024-01-01'),
          },
        ],
        chronicConditions: [],
        allergies: [],
      };

      const response = await request(app)
        .post('/api/risk-prediction/assess')
        .send({
          patientId: 'P001',
          patientData,
          patientName: 'John Doe',
          includeProjection: false,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('assessment');
      expect(response.body.assessment).toHaveProperty('riskScore');
      expect(response.body.assessment.riskScore).toHaveProperty('overall');
      expect(response.body.assessment.riskScore).toHaveProperty('level');
    });

    it('should create alert for high-risk patient', async () => {
      const patientData: PatientData = {
        patientId: 'P002',
        age: 75,
        medications: [
          {
            id: 'M001',
            name: 'Warfarin',
            activeIngredient: 'warfarin',
            dosage: '5mg',
            frequency: 'daily',
            startDate: new Date('2024-01-01'),
          },
          {
            id: 'M002',
            name: 'Aspirin',
            activeIngredient: 'aspirin',
            dosage: '81mg',
            frequency: 'daily',
            startDate: new Date('2024-01-01'),
          },
        ],
        chronicConditions: [
          {
            id: 'C001',
            name: 'Diabetes',
            diagnosedDate: new Date('2020-01-01'),
            severity: 'severe',
            controlStatus: 'uncontrolled',
          },
        ],
        allergies: [],
      };

      const response = await request(app)
        .post('/api/risk-prediction/assess')
        .send({
          patientId: 'P002',
          patientData,
          patientName: 'Jane Smith',
        });

      expect(response.status).toBe(200);
      expect(response.body.alerts.length).toBeGreaterThan(0);
    });

    it('should return 400 for missing patientId', async () => {
      const response = await request(app)
        .post('/api/risk-prediction/assess')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing patientData', async () => {
      const response = await request(app)
        .post('/api/risk-prediction/assess')
        .send({
          patientId: 'P001',
          patientName: 'Test Patient',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/risk-prediction/patient/:id', () => {
    it('should return patient risk history', async () => {
      // First, create an assessment
      const patientData: PatientData = {
        patientId: 'P003',
        age: 50,
        medications: [],
        chronicConditions: [],
        allergies: [],
      };

      await request(app)
        .post('/api/risk-prediction/assess')
        .send({
          patientId: 'P003',
          patientData,
          patientName: 'Test Patient',
        });

      // Then, fetch history
      const response = await request(app).get('/api/risk-prediction/patient/P003');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('patientId', 'P003');
      expect(response.body).toHaveProperty('assessments');
      expect(response.body.assessments.length).toBeGreaterThan(0);
    });

    it('should return empty history for new patient', async () => {
      const response = await request(app).get('/api/risk-prediction/patient/P999');

      expect(response.status).toBe(200);
      expect(response.body.assessments).toHaveLength(0);
    });
  });

  describe('GET /api/risk-prediction/alerts', () => {
    it('should return all active alerts', async () => {
      const response = await request(app).get('/api/risk-prediction/alerts');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('alerts');
      expect(Array.isArray(response.body.alerts)).toBe(true);
    });
  });

  describe('GET /api/risk-prediction/alerts/patient/:id', () => {
    it('should return patient-specific alerts', async () => {
      const response = await request(app).get(
        '/api/risk-prediction/alerts/patient/P001'
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('patientId', 'P001');
      expect(response.body).toHaveProperty('alerts');
      expect(Array.isArray(response.body.alerts)).toBe(true);
    });
  });

  describe('POST /api/risk-prediction/alerts/:id/acknowledge', () => {
    it('should return 400 for missing userId', async () => {
      const response = await request(app)
        .post('/api/risk-prediction/alerts/ALERT-1/acknowledge')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent alert', async () => {
      const response = await request(app)
        .post('/api/risk-prediction/alerts/INVALID-ID/acknowledge')
        .send({ userId: 'USER001' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/risk-prediction/trends/:id', () => {
    it('should return empty trends for new patient', async () => {
      const response = await request(app).get('/api/risk-prediction/trends/P999');

      expect(response.status).toBe(200);
      expect(response.body.trends).toHaveLength(0);
    });

    it('should return trends after multiple assessments', async () => {
      const patientData: PatientData = {
        patientId: 'P004',
        age: 70,
        medications: [
          {
            id: 'M001',
            name: 'Test Med',
            activeIngredient: 'test',
            dosage: '10mg',
            frequency: 'daily',
            startDate: new Date('2024-01-01'),
          },
          {
            id: 'M002',
            name: 'Test Med 2',
            activeIngredient: 'test2',
            dosage: '5mg',
            frequency: 'daily',
            startDate: new Date('2024-01-01'),
          },
          {
            id: 'M003',
            name: 'Test Med 3',
            activeIngredient: 'test3',
            dosage: '15mg',
            frequency: 'daily',
            startDate: new Date('2024-01-01'),
          },
          {
            id: 'M004',
            name: 'Test Med 4',
            activeIngredient: 'test4',
            dosage: '20mg',
            frequency: 'daily',
            startDate: new Date('2024-01-01'),
          },
          {
            id: 'M005',
            name: 'Test Med 5',
            activeIngredient: 'test5',
            dosage: '10mg',
            frequency: 'daily',
            startDate: new Date('2024-01-01'),
          },
        ],
        chronicConditions: [],
        allergies: [],
      };

      // Create multiple assessments
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/risk-prediction/assess')
          .send({
            patientId: 'P004',
            patientData,
            patientName: 'Test Patient',
          });
      }

      const response = await request(app).get('/api/risk-prediction/trends/P004');

      expect(response.status).toBe(200);
      expect(response.body.trends.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for invalid route', async () => {
      const response = await request(app).get('/api/risk-prediction/invalid-route');

      expect(response.status).toBe(404);
    });
  });
});
