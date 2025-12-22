/**
 * useADRForm Hook Tests
 * Unit tests for ADR form management hook
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useADRForm } from '../useADRForm';
import adrReducer from '../../store/adrSlice';

// Helper function to create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      adr: adrReducer,
      auth: (state = { nurse: null }) => state,
      patient: (state = {}) => state,
      medication: (state = {}) => state,
      delivery: (state = {}) => state,
      pharmacyRecords: (state = {}) => state,
      handover: (state = {}) => state,
      administration: (state = {}) => state,
    },
  });
};

// Wrapper component for Redux
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createTestStore();
  return React.createElement(Provider, { store }, children);
};

describe('useADRForm Hook', () => {
  it('should initialize with null form data', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    expect(result.current.formData).toBeNull();
    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(false);
    expect(result.current.isCritical).toBe(false);
  });

  it('should initialize form with patient info', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    act(() => {
      result.current.initForm({
        patientId: 'p-1',
        patientName: 'John Doe',
        medicationId: 'med-1',
        medicationName: 'Aspirin',
      });
    });

    expect(result.current.formData).not.toBeNull();
    expect(result.current.formData?.patientId).toBe('p-1');
    expect(result.current.formData?.patientName).toBe('John Doe');
    expect(result.current.formData?.medicationId).toBe('med-1');
    expect(result.current.formData?.medicationName).toBe('Aspirin');
  });

  it('should update form field', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    act(() => {
      result.current.initForm({
        patientId: 'p-1',
        patientName: 'John Doe',
      });
    });

    act(() => {
      result.current.updateField('reactionType', 'Allergic');
    });

    expect(result.current.formData?.reactionType).toBe('Allergic');
  });

  it('should update severity field', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    act(() => {
      result.current.initForm({
        patientId: 'p-1',
        patientName: 'John Doe',
      });
    });

    act(() => {
      result.current.updateField('severity', 'severe');
    });

    expect(result.current.formData?.severity).toBe('severe');
    expect(result.current.isCritical).toBe(true);
  });

  it('should toggle symptoms', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    act(() => {
      result.current.initForm({
        patientId: 'p-1',
        patientName: 'John Doe',
      });
    });

    act(() => {
      result.current.toggleSymptom('Rash');
    });

    expect(result.current.formData?.symptoms).toContain('Rash');

    act(() => {
      result.current.toggleSymptom('Rash');
    });

    expect(result.current.formData?.symptoms).not.toContain('Rash');
  });

  it('should add photo attachment', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    act(() => {
      result.current.initForm({
        patientId: 'p-1',
        patientName: 'John Doe',
      });
    });

    act(() => {
      result.current.addPhoto({
        id: 'photo-1',
        uri: 'file:///path',
        fileName: 'photo.jpg',
      });
    });

    expect(result.current.formData?.photoAttachments).toHaveLength(1);
  });

  it('should remove photo attachment', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    act(() => {
      result.current.initForm({
        patientId: 'p-1',
        patientName: 'John Doe',
      });
    });

    act(() => {
      result.current.addPhoto({
        id: 'photo-1',
        uri: 'file:///path1',
        fileName: 'photo1.jpg',
      });
      result.current.addPhoto({
        id: 'photo-2',
        uri: 'file:///path2',
        fileName: 'photo2.jpg',
      });
    });

    expect(result.current.formData?.photoAttachments).toHaveLength(2);

    act(() => {
      result.current.removePhoto('photo-1');
    });

    expect(result.current.formData?.photoAttachments).toHaveLength(1);
  });

  it('should validate complete form', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    act(() => {
      result.current.initForm({
        patientId: 'p-1',
        patientName: 'John Doe',
      });
    });

    // Form initially has errors
    let isValid = result.current.validateForm();
    expect(isValid).toBe(false);

    // Fill in required fields
    act(() => {
      result.current.updateField('medicationId', 'med-1');
      result.current.updateField('medicationName', 'Aspirin');
      result.current.updateField('reactionType', 'Allergic');
      result.current.toggleSymptom('Rash');
      result.current.updateField('actionTaken', 'Administered antihistamine');
    });

    isValid = result.current.validateForm();
    expect(isValid).toBe(true);
  });

  it('should track field-level errors', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    act(() => {
      result.current.initForm({
        patientId: 'p-1',
        patientName: 'John Doe',
      });
    });

    // Update with too-short action
    act(() => {
      result.current.updateField('actionTaken', 'Short');
    });

    expect(result.current.errors.actionTaken).toBeDefined();
  });

  it('should clear errors when field becomes valid', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    act(() => {
      result.current.initForm({
        patientId: 'p-1',
        patientName: 'John Doe',
      });
    });

    // Create error
    act(() => {
      result.current.updateField('actionTaken', 'Short');
    });

    expect(result.current.errors.actionTaken).toBeDefined();

    // Fix error
    act(() => {
      result.current.updateField('actionTaken', 'Administered antihistamine');
    });

    expect(result.current.errors.actionTaken).toBeUndefined();
  });

  it('should clear form', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    act(() => {
      result.current.initForm({
        patientId: 'p-1',
        patientName: 'John Doe',
      });
    });

    act(() => {
      result.current.updateField('reactionType', 'Allergic');
    });

    expect(result.current.formData).not.toBeNull();

    act(() => {
      result.current.clearForm();
    });

    expect(result.current.formData).toBeNull();
    expect(result.current.errors).toEqual({});
  });

  it('should detect critical severity', () => {
    const { result } = renderHook(() => useADRForm(), { wrapper });

    act(() => {
      result.current.initForm({
        patientId: 'p-1',
        patientName: 'John Doe',
      });
    });

    expect(result.current.isCritical).toBe(false);

    act(() => {
      result.current.updateField('severity', 'severe');
    });

    expect(result.current.isCritical).toBe(true);

    act(() => {
      result.current.updateField('severity', 'mild');
    });

    expect(result.current.isCritical).toBe(false);
  });
});
