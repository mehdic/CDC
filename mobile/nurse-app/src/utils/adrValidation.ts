/**
 * ADR Form Validation Utilities
 * Validates adverse reaction form data
 */

import { ADRFormData } from '../store/adrSlice';

export interface ValidationError {
  field: keyof ADRFormData;
  message: string;
}

/**
 * Validates ADR form data
 * @param formData - The form data to validate
 * @returns Array of validation errors, empty if valid
 */
export function validateADRForm(formData: Partial<ADRFormData>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate medication
  if (!formData.medicationId?.trim()) {
    errors.push({
      field: 'medicationId',
      message: 'Medication ID is required',
    });
  }

  if (!formData.medicationName?.trim()) {
    errors.push({
      field: 'medicationName',
      message: 'Medication name is required',
    });
  }

  // Validate reaction type
  if (!formData.reactionType?.trim()) {
    errors.push({
      field: 'reactionType',
      message: 'Reaction type is required',
    });
  }

  // Validate severity
  const validSeverities = ['mild', 'moderate', 'severe', 'life_threatening'];
  if (!formData.severity || !validSeverities.includes(formData.severity)) {
    errors.push({
      field: 'severity',
      message: 'Valid severity level is required',
    });
  }

  // Validate symptoms
  if (!formData.symptoms || formData.symptoms.length === 0) {
    errors.push({
      field: 'symptoms',
      message: 'At least one symptom is required',
    });
  }

  // Validate action taken
  if (!formData.actionTaken?.trim()) {
    errors.push({
      field: 'actionTaken',
      message: 'Action taken is required',
    });
  }

  // Validate action taken length
  if (formData.actionTaken && formData.actionTaken.length < 10) {
    errors.push({
      field: 'actionTaken',
      message: 'Action taken must be at least 10 characters',
    });
  }

  return errors;
}

/**
 * Validates a single form field
 * @param field - The field name
 * @param value - The field value
 * @returns Validation error message or null if valid
 */
export function validateField(
  field: keyof ADRFormData,
  value: any
): string | null {
  switch (field) {
    case 'medicationId':
      if (!value?.trim()) {
        return 'Medication ID is required';
      }
      return null;

    case 'medicationName':
      if (!value?.trim()) {
        return 'Medication name is required';
      }
      return null;

    case 'reactionType':
      if (!value?.trim()) {
        return 'Reaction type is required';
      }
      return null;

    case 'severity':
      const validSeverities = ['mild', 'moderate', 'severe', 'life_threatening'];
      if (!validSeverities.includes(value)) {
        return 'Valid severity level is required';
      }
      return null;

    case 'symptoms':
      if (!Array.isArray(value) || value.length === 0) {
        return 'At least one symptom is required';
      }
      return null;

    case 'actionTaken':
      if (!value?.trim()) {
        return 'Action taken is required';
      }
      if (value.trim().length < 10) {
        return 'Action taken must be at least 10 characters';
      }
      return null;

    default:
      return null;
  }
}

/**
 * Checks if a severity level is critical (requires immediate attention)
 * @param severity - The severity level
 * @returns true if severity is severe or life_threatening
 */
export function isCriticalSeverity(
  severity: ADRFormData['severity']
): boolean {
  return severity === 'severe' || severity === 'life_threatening';
}

/**
 * Gets severity label for display
 * @param severity - The severity level
 * @returns Human-readable severity label
 */
export function getSeverityLabel(
  severity: ADRFormData['severity']
): string {
  const labels: Record<ADRFormData['severity'], string> = {
    mild: 'Mild',
    moderate: 'Moderate',
    severe: 'Severe',
    life_threatening: 'Life Threatening',
  };
  return labels[severity] || 'Unknown';
}

/**
 * Gets severity color for UI display
 * @param severity - The severity level
 * @returns Color code for display
 */
export function getSeverityColor(severity: ADRFormData['severity']): string {
  const colors: Record<ADRFormData['severity'], string> = {
    mild: '#F39C12',
    moderate: '#E67E22',
    severe: '#E74C3C',
    life_threatening: '#C0392B',
  };
  return colors[severity] || '#95A5A6';
}
