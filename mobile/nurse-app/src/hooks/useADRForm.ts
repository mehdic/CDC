/**
 * useADRForm Hook
 * Manages adverse reaction form state and operations
 */

import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  initializeForm,
  updateFormField,
  addSymptom,
  removeSymptom,
  addPhotoAttachment,
  removePhotoAttachment,
  clearCurrentForm,
} from '../store/adrSlice';
import { ADRFormData } from '../store/adrSlice';
import {
  validateADRForm,
  validateField,
  isCriticalSeverity,
} from '../utils/adrValidation';

export interface UseADRFormResult {
  formData: Partial<ADRFormData> | null;
  errors: Record<string, string>;
  isValid: boolean;
  isCritical: boolean;

  // Form operations
  initForm: (params: {
    patientId: string;
    patientName: string;
    medicationId?: string;
    medicationName?: string;
  }) => void;
  updateField: (field: keyof ADRFormData, value: any) => void;
  toggleSymptom: (symptom: string) => void;
  addPhoto: (photo: {
    id: string;
    uri: string;
    fileName: string;
  }) => void;
  removePhoto: (photoId: string) => void;
  validateForm: () => boolean;
  clearForm: () => void;
}

/**
 * Hook for managing ADR form state
 * @returns ADR form management interface
 */
export function useADRForm(): UseADRFormResult {
  const dispatch = useDispatch();
  const formData = useSelector((state: RootState) => state.adr.currentReport);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form
  const initForm = useCallback(
    (params: {
      patientId: string;
      patientName: string;
      medicationId?: string;
      medicationName?: string;
    }) => {
      dispatch(initializeForm(params));
      setErrors({});
    },
    [dispatch]
  );

  // Update form field
  const updateField = useCallback(
    (field: keyof ADRFormData, value: string | string[] | ADRFormData['severity']) => {
      dispatch(updateFormField({ field, value }));

      // Validate field on change
      const fieldError = validateField(field, value);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (fieldError) {
          newErrors[field] = fieldError;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    },
    [dispatch]
  );

  // Toggle symptom (add/remove)
  const toggleSymptom = useCallback(
    (symptom: string) => {
      if (formData?.symptoms?.includes(symptom)) {
        dispatch(removeSymptom(symptom));
      } else {
        dispatch(addSymptom(symptom));
      }
    },
    [dispatch, formData?.symptoms]
  );

  // Add photo
  const addPhoto = useCallback(
    (photo: { id: string; uri: string; fileName: string }) => {
      dispatch(addPhotoAttachment(photo));
    },
    [dispatch]
  );

  // Remove photo
  const removePhoto = useCallback(
    (photoId: string) => {
      dispatch(removePhotoAttachment(photoId));
    },
    [dispatch]
  );

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const validationErrors = validateADRForm(formData || {});
    const errorMap: Record<string, string> = {};

    validationErrors.forEach((error) => {
      errorMap[error.field] = error.message;
    });

    setErrors(errorMap);
    return validationErrors.length === 0;
  }, [formData]);

  // Clear form
  const clearForm = useCallback(() => {
    dispatch(clearCurrentForm());
    setErrors({});
  }, [dispatch]);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 && formData !== null;

  // Check if severity is critical
  const isCritical =
    formData && formData.severity
      ? isCriticalSeverity(formData.severity)
      : false;

  return {
    formData,
    errors,
    isValid,
    isCritical,
    initForm,
    updateField,
    toggleSymptom,
    addPhoto,
    removePhoto,
    validateForm,
    clearForm,
  };
}
