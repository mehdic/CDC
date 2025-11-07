/**
 * Unit Tests for Prescription Redux Slice
 */

import prescriptionReducer, {
  setSelectedPrescription,
  setFilters,
  clearError,
  clearPrescriptions,
  setUploadProgress,
  updatePrescription,
} from '../src/store/prescriptionSlice';
import { PrescriptionStatus, Prescription } from '@metapharm/api-types';

const mockPrescription: Prescription = {
  id: 'test-123',
  patientId: 'patient-456',
  status: PrescriptionStatus.PENDING,
  imageUrl: 'https://example.com/image.jpg',
  createdAt: '2025-11-07T10:00:00Z',
  updatedAt: '2025-11-07T10:00:00Z',
};

describe('prescriptionSlice', () => {
  const initialState = {
    prescriptions: [],
    selectedPrescription: null,
    loading: false,
    uploading: false,
    error: null,
    uploadProgress: 0,
    filters: {},
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false,
    },
  };

  it('should handle initial state', () => {
    expect(prescriptionReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setSelectedPrescription', () => {
    const actual = prescriptionReducer(
      initialState,
      setSelectedPrescription(mockPrescription)
    );
    expect(actual.selectedPrescription).toEqual(mockPrescription);
  });

  it('should handle setFilters', () => {
    const filters = { status: [PrescriptionStatus.APPROVED] };
    const actual = prescriptionReducer(initialState, setFilters(filters));
    expect(actual.filters).toEqual(filters);
  });

  it('should handle clearError', () => {
    const stateWithError = { ...initialState, error: 'Test error' };
    const actual = prescriptionReducer(stateWithError, clearError());
    expect(actual.error).toBeNull();
  });

  it('should handle clearPrescriptions', () => {
    const stateWithData = {
      ...initialState,
      prescriptions: [mockPrescription],
      selectedPrescription: mockPrescription,
      pagination: { page: 2, limit: 20, total: 50, hasMore: true },
    };
    const actual = prescriptionReducer(stateWithData, clearPrescriptions());
    expect(actual.prescriptions).toEqual([]);
    expect(actual.selectedPrescription).toBeNull();
    expect(actual.pagination).toEqual(initialState.pagination);
  });

  it('should handle setUploadProgress', () => {
    const actual = prescriptionReducer(initialState, setUploadProgress(50));
    expect(actual.uploadProgress).toBe(50);
  });

  it('should handle updatePrescription in list', () => {
    const stateWithPrescription = {
      ...initialState,
      prescriptions: [mockPrescription],
    };
    const updatedPrescription = {
      ...mockPrescription,
      status: PrescriptionStatus.APPROVED,
    };
    const actual = prescriptionReducer(
      stateWithPrescription,
      updatePrescription(updatedPrescription)
    );
    expect(actual.prescriptions[0].status).toBe(PrescriptionStatus.APPROVED);
  });

  it('should handle updatePrescription for selected prescription', () => {
    const stateWithSelected = {
      ...initialState,
      selectedPrescription: mockPrescription,
    };
    const updatedPrescription = {
      ...mockPrescription,
      status: PrescriptionStatus.APPROVED,
    };
    const actual = prescriptionReducer(
      stateWithSelected,
      updatePrescription(updatedPrescription)
    );
    expect(actual.selectedPrescription?.status).toBe(PrescriptionStatus.APPROVED);
  });
});
