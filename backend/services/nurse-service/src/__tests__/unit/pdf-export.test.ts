/**
 * PDF Export Controller Unit Tests
 * Tests for care plan PDF validation and export controller functionality
 * Task: NURSE-PDF - Nurse Care Plan PDF Export
 */

import { PDFController } from '../../controllers/pdfController';
import { Response } from 'express';

describe('PDFController', () => {
  let mockRes: any;

  beforeEach(() => {
    mockRes = {
      setHeader: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      pipe: jest.fn().mockReturnThis(),
      headersSent: false,
      on: jest.fn().mockReturnThis(),
    };
  });

  describe('validateCarePlanData', () => {
    test('should validate complete care plan data', () => {
      const validData = {
        patientName: 'John Doe',
        patientId: 'patient-123',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Post-Surgery Care Plan',
        startDate: '2025-01-01',
        goals: ['Goal 1', 'Goal 2'],
        interventions: [
          {
            description: 'Monitor vitals',
            frequency: 'Every 4 hours',
          },
        ],
      };

      const result = PDFController.validateCarePlanData(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate complete care plan with all optional fields', () => {
      const validData = {
        patientName: 'John Doe',
        patientId: 'patient-123',
        dateOfBirth: '1980-01-15',
        medicalRecordNumber: 'MRN-001',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Post-Surgery Care Plan',
        startDate: '2025-01-01',
        endDate: '2025-02-01',
        goals: ['Goal 1', 'Goal 2'],
        interventions: [
          {
            description: 'Monitor vitals',
            frequency: 'Every 4 hours',
            timeOfDay: '06:00, 10:00, 14:00, 18:00, 22:00, 02:00',
          },
        ],
        medications: [
          {
            name: 'Ibuprofen',
            dosage: '400mg',
            frequency: 'Every 6 hours',
            route: 'Oral',
            indication: 'Pain management',
          },
        ],
        precautions: [
          'Do not apply pressure to surgical site',
          'Avoid strenuous activity for 2 weeks',
        ],
        notes: 'Patient is recovering well.',
      };

      const result = PDFController.validateCarePlanData(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return error for missing patientName', () => {
      const invalidData = {
        patientId: 'patient-123',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: [],
        interventions: [],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('patientName is required');
    });

    test('should return error for missing nurseId', () => {
      const invalidData = {
        patientName: 'John Doe',
        patientId: 'patient-123',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: [],
        interventions: [],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('nurseId is required');
    });

    test('should return error for missing nurseName', () => {
      const invalidData = {
        patientName: 'John Doe',
        patientId: 'patient-123',
        nurseId: 'nurse-456',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: [],
        interventions: [],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('nurseName is required');
    });

    test('should return error for missing carePlanTitle', () => {
      const invalidData = {
        patientName: 'John Doe',
        patientId: 'patient-123',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        startDate: '2025-01-01',
        goals: [],
        interventions: [],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('carePlanTitle is required');
    });

    test('should return error for missing startDate', () => {
      const invalidData = {
        patientName: 'John Doe',
        patientId: 'patient-123',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        goals: [],
        interventions: [],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('startDate is required');
    });

    test('should validate goals array', () => {
      const invalidData = {
        patientName: 'John Doe',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: 'not an array',
        interventions: [],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('goals must be an array');
    });

    test('should validate interventions array', () => {
      const invalidData = {
        patientName: 'John Doe',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: [],
        interventions: 'not an array',
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('interventions must be an array');
    });

    test('should validate interventions array structure - missing description', () => {
      const invalidData = {
        patientName: 'John Doe',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: ['Goal 1'],
        interventions: [
          {
            // missing description
            frequency: 'Daily',
          },
        ],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('interventions[0].description is required');
    });

    test('should validate interventions array structure - missing frequency', () => {
      const invalidData = {
        patientName: 'John Doe',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: ['Goal 1'],
        interventions: [
          {
            description: 'Test intervention',
            // missing frequency
          },
        ],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('interventions[0].frequency is required');
    });

    test('should validate medications array structure - missing name', () => {
      const invalidData = {
        patientName: 'John Doe',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: ['Goal 1'],
        interventions: [
          {
            description: 'Test',
            frequency: 'Daily',
          },
        ],
        medications: [
          {
            // missing name
            dosage: '400mg',
            frequency: 'Daily',
            route: 'Oral',
            indication: 'Test',
          },
        ],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('medications[0].name is required');
    });

    test('should validate medications array structure - missing dosage', () => {
      const invalidData = {
        patientName: 'John Doe',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: ['Goal 1'],
        interventions: [
          {
            description: 'Test',
            frequency: 'Daily',
          },
        ],
        medications: [
          {
            name: 'Aspirin',
            // missing dosage
            frequency: 'Daily',
            route: 'Oral',
            indication: 'Test',
          },
        ],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('medications[0].dosage is required');
    });

    test('should validate medications array structure - missing frequency', () => {
      const invalidData = {
        patientName: 'John Doe',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: ['Goal 1'],
        interventions: [
          {
            description: 'Test',
            frequency: 'Daily',
          },
        ],
        medications: [
          {
            name: 'Aspirin',
            dosage: '400mg',
            // missing frequency
            route: 'Oral',
            indication: 'Test',
          },
        ],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('medications[0].frequency is required');
    });

    test('should validate medications array structure - missing route', () => {
      const invalidData = {
        patientName: 'John Doe',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: ['Goal 1'],
        interventions: [
          {
            description: 'Test',
            frequency: 'Daily',
          },
        ],
        medications: [
          {
            name: 'Aspirin',
            dosage: '400mg',
            frequency: 'Daily',
            // missing route
            indication: 'Test',
          },
        ],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('medications[0].route is required');
    });

    test('should allow optional fields to be missing', () => {
      const validData = {
        patientName: 'John Doe',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: ['Goal 1'],
        interventions: [
          {
            description: 'Test',
            frequency: 'Daily',
          },
        ],
        // no medications, precautions, notes, dateOfBirth, or endDate
      };

      const result = PDFController.validateCarePlanData(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle multiple validation errors', () => {
      const invalidData = {
        // missing patientName, nurseId, nurseName, carePlanTitle, startDate
        goals: 'not array',
        interventions: 'not array',
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(5);
      expect(result.errors).toContain('patientName is required');
      expect(result.errors).toContain('nurseId is required');
      expect(result.errors).toContain('goals must be an array');
      expect(result.errors).toContain('interventions must be an array');
    });
  });

  describe('exportCarePlanPDF', () => {
    test('should return 400 error for missing required fields', () => {
      const invalidData = {
        nurseId: 'nurse-456',
        // missing patientName
      } as any;

      PDFController.exportCarePlanPDF(invalidData, {}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('Security Fixes', () => {
    // FIX #1 & #2: Filename Injection and PII Exposure - These are verified through integration tests
    // The critical security measures have been added:
    // - sanitizeFilename() method prevents path traversal and injection
    // - patientId is used instead of patientName to prevent PII exposure in filenames

    // FIX #4: Input Length Validation
    test('should reject patientName exceeding 255 characters', () => {
      const invalidData = {
        patientName: 'a'.repeat(256),
        patientId: 'patient-123',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: ['Goal 1'],
        interventions: [{ description: 'Test', frequency: 'Daily' }],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('patientName must not exceed 255 characters');
    });

    test('should reject notes exceeding 10,000 characters', () => {
      const invalidData = {
        patientName: 'John Doe',
        patientId: 'patient-123',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: ['Goal 1'],
        interventions: [{ description: 'Test', frequency: 'Daily' }],
        notes: 'a'.repeat(10001),
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('notes must not exceed 10,000 characters');
    });

    test('should reject intervention description exceeding 2,000 characters', () => {
      const invalidData = {
        patientName: 'John Doe',
        patientId: 'patient-123',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: ['Goal 1'],
        interventions: [{ description: 'a'.repeat(2001), frequency: 'Daily' }],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('interventions[0].description must not exceed 2,000 characters');
    });

    test('should reject medication name exceeding 255 characters', () => {
      const invalidData = {
        patientName: 'John Doe',
        patientId: 'patient-123',
        nurseId: 'nurse-456',
        nurseName: 'Jane Smith',
        carePlanTitle: 'Test',
        startDate: '2025-01-01',
        goals: ['Goal 1'],
        interventions: [{ description: 'Test', frequency: 'Daily' }],
        medications: [
          {
            name: 'a'.repeat(256),
            dosage: '400mg',
            frequency: 'Daily',
            route: 'Oral',
          },
        ],
      };

      const result = PDFController.validateCarePlanData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('medications[0].name must not exceed 255 characters');
    });

    // FIX #5: Generic Error Messages
    test('should return generic error messages (no internal details)', () => {
      const invalidData = {
        nurseId: 'nurse-456',
      } as any;

      PDFController.exportCarePlanPDF(invalidData, {}, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid Request',
        message: expect.not.stringContaining('patientName'),
      });
    });
  });
});
