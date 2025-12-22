/**
 * ADR Validation Utilities Tests
 * Unit tests for form validation functions
 */

import {
  validateADRForm,
  validateField,
  isCriticalSeverity,
  getSeverityLabel,
  getSeverityColor,
} from '../adrValidation';
import { ADRFormData } from '../../store/adrSlice';

describe('ADR Validation', () => {
  const validFormData: Partial<ADRFormData> = {
    medicationId: 'med-1',
    medicationName: 'Aspirin',
    reactionType: 'Allergic',
    severity: 'mild',
    symptoms: ['Rash'],
    actionTaken: 'Administered antihistamine',
  };

  describe('validateADRForm', () => {
    it('should pass validation with complete data', () => {
      const errors = validateADRForm(validFormData);
      expect(errors).toHaveLength(0);
    });

    it('should require medication ID', () => {
      const data = { ...validFormData, medicationId: '' };
      const errors = validateADRForm(data);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'medicationId',
          message: 'Medication ID is required',
        })
      );
    });

    it('should require medication name', () => {
      const data = { ...validFormData, medicationName: '' };
      const errors = validateADRForm(data);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'medicationName',
          message: 'Medication name is required',
        })
      );
    });

    it('should require reaction type', () => {
      const data = { ...validFormData, reactionType: '' };
      const errors = validateADRForm(data);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'reactionType',
          message: 'Reaction type is required',
        })
      );
    });

    it('should require valid severity', () => {
      const data = {
        ...validFormData,
        severity: 'invalid' as any,
      };
      const errors = validateADRForm(data);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'severity',
          message: 'Valid severity level is required',
        })
      );
    });

    it('should require at least one symptom', () => {
      const data = { ...validFormData, symptoms: [] };
      const errors = validateADRForm(data);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'symptoms',
          message: 'At least one symptom is required',
        })
      );
    });

    it('should require action taken', () => {
      const data = { ...validFormData, actionTaken: '' };
      const errors = validateADRForm(data);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'actionTaken',
          message: 'Action taken is required',
        })
      );
    });

    it('should require minimum action taken length', () => {
      const data = { ...validFormData, actionTaken: 'Short' };
      const errors = validateADRForm(data);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'actionTaken',
          message: 'Action taken must be at least 10 characters',
        })
      );
    });

    it('should return multiple errors', () => {
      const data: Partial<ADRFormData> = {};
      const errors = validateADRForm(data);

      expect(errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateField', () => {
    it('should validate medication ID', () => {
      let error = validateField('medicationId', '');
      expect(error).toBe('Medication ID is required');

      error = validateField('medicationId', 'med-1');
      expect(error).toBeNull();
    });

    it('should validate medication name', () => {
      let error = validateField('medicationName', '');
      expect(error).toBe('Medication name is required');

      error = validateField('medicationName', 'Aspirin');
      expect(error).toBeNull();
    });

    it('should validate reaction type', () => {
      let error = validateField('reactionType', '');
      expect(error).toBe('Reaction type is required');

      error = validateField('reactionType', 'Allergic');
      expect(error).toBeNull();
    });

    it('should validate severity', () => {
      let error = validateField('severity', 'invalid');
      expect(error).toBe('Valid severity level is required');

      error = validateField('severity', 'mild');
      expect(error).toBeNull();
    });

    it('should validate symptoms array', () => {
      let error = validateField('symptoms', []);
      expect(error).toBe('At least one symptom is required');

      error = validateField('symptoms', ['Rash']);
      expect(error).toBeNull();
    });

    it('should validate action taken', () => {
      let error = validateField('actionTaken', '');
      expect(error).toBe('Action taken is required');

      error = validateField('actionTaken', 'Short');
      expect(error).toBe('Action taken must be at least 10 characters');

      error = validateField('actionTaken', 'Administered antihistamine');
      expect(error).toBeNull();
    });
  });

  describe('isCriticalSeverity', () => {
    it('should identify severe as critical', () => {
      expect(isCriticalSeverity('severe')).toBe(true);
    });

    it('should identify life_threatening as critical', () => {
      expect(isCriticalSeverity('life_threatening')).toBe(true);
    });

    it('should not identify mild as critical', () => {
      expect(isCriticalSeverity('mild')).toBe(false);
    });

    it('should not identify moderate as critical', () => {
      expect(isCriticalSeverity('moderate')).toBe(false);
    });
  });

  describe('getSeverityLabel', () => {
    it('should return label for mild', () => {
      expect(getSeverityLabel('mild')).toBe('Mild');
    });

    it('should return label for moderate', () => {
      expect(getSeverityLabel('moderate')).toBe('Moderate');
    });

    it('should return label for severe', () => {
      expect(getSeverityLabel('severe')).toBe('Severe');
    });

    it('should return label for life_threatening', () => {
      expect(getSeverityLabel('life_threatening')).toBe('Life Threatening');
    });
  });

  describe('getSeverityColor', () => {
    it('should return color for mild', () => {
      expect(getSeverityColor('mild')).toBe('#F39C12');
    });

    it('should return color for moderate', () => {
      expect(getSeverityColor('moderate')).toBe('#E67E22');
    });

    it('should return color for severe', () => {
      expect(getSeverityColor('severe')).toBe('#E74C3C');
    });

    it('should return color for life_threatening', () => {
      expect(getSeverityColor('life_threatening')).toBe('#C0392B');
    });
  });
});
