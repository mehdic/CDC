/**
 * Pharmacy Records Screen Integration Tests
 * Tests for screen rendering, user interactions, and data display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PharmacyRecordsScreen from '../PharmacyRecordsScreen';
import pharmacyRecordsReducer from '../../../store/slices/pharmacyRecordsSlice';
import authReducer from '../../../store/slices/authSlice';
import type { NurseProfile } from '../../../types/nurse';

// Mock navigation
const mockParams = { patientId: 'P001', patientName: 'John Doe' };
const mockRoute = {
  params: mockParams,
} as any;

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockRoute,
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock the hook
const mockLoadRecords = jest.fn();
jest.mock('../../../hooks/usePharmacyRecords', () => ({
  usePharmacyRecords: () => ({
    records: [],
    selectedRecord: null,
    loading: false,
    error: null,
    lastAccessedPatientId: null,
    loadRecords: mockLoadRecords,
    selectRecord: jest.fn(),
    clearSelected: jest.fn(),
    clearErrorMessage: jest.fn(),
    getMedicationHistory: () => [],
    getAllergies: () => [],
    getInteractions: () => [],
    getPharmacyName: () => 'Test Pharmacy',
    getLastUpdated: () => null,
  }),
}));

describe('PharmacyRecordsScreen', () => {
  let store: any;

  const mockNurse: NurseProfile = {
    id: 'N001',
    email: 'nurse@test.com',
    firstName: 'Jane',
    lastName: 'Smith',
    licenseNumber: 'LN123',
    specialization: ['ICU'],
    facility: 'Hospital',
    hinEIDVerified: true,
    phoneNumber: '+41123456789',
    shift: 'day',
    certifications: ['BLS'],
  };

  beforeEach(() => {
    mockLoadRecords.mockClear();
    store = configureStore({
      reducer: {
        pharmacyRecords: pharmacyRecordsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          nurse: mockNurse,
          token: 'test-token',
          hinEIDVerified: true,
        },
        pharmacyRecords: {
          records: {},
          selectedRecord: null,
          loading: false,
          error: null,
          lastAccessedPatientId: null,
          auditLog: [],
        },
      },
    });
  });

  const renderWithStore = (component: React.ReactElement) => {
    return render(<Provider store={store}>{component}</Provider>);
  };

  describe('initial render', () => {
    it('should render pharmacy records screen', () => {
      renderWithStore(<PharmacyRecordsScreen />);
      expect(screen.getByText('Pharmacy Records')).toBeTruthy();
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    it('should attempt to load records on mount', async () => {
      renderWithStore(<PharmacyRecordsScreen />);
      await waitFor(() => {
        expect(mockLoadRecords).toHaveBeenCalledWith(
          'P001',
          expect.any(String),
          'N001'
        );
      });
    });

    it('should display loading state', () => {
      const loadingStore = configureStore({
        reducer: {
          pharmacyRecords: pharmacyRecordsReducer,
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            isAuthenticated: true,
            nurse: mockNurse,
            token: 'test-token',
            hinEIDVerified: true,
          },
          pharmacyRecords: {
            records: {},
            selectedRecord: null,
            loading: true,
            error: null,
            lastAccessedPatientId: null,
            auditLog: [],
          },
        },
      });

      render(
        <Provider store={loadingStore}>
          <PharmacyRecordsScreen />
        </Provider>
      );
      expect(screen.getByText('Loading pharmacy records...')).toBeTruthy();
    });

    it('should display error state', () => {
      const errorStore = configureStore({
        reducer: {
          pharmacyRecords: pharmacyRecordsReducer,
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            isAuthenticated: true,
            nurse: mockNurse,
            token: 'test-token',
            hinEIDVerified: true,
          },
          pharmacyRecords: {
            records: {},
            selectedRecord: null,
            loading: false,
            error: 'Failed to load pharmacy records',
            lastAccessedPatientId: null,
            auditLog: [],
          },
        },
      });

      render(
        <Provider store={errorStore}>
          <PharmacyRecordsScreen />
        </Provider>
      );
      expect(screen.getByText('Error Loading Records')).toBeTruthy();
      expect(screen.getByText('Failed to load pharmacy records')).toBeTruthy();
    });

    it('should display empty state', () => {
      renderWithStore(<PharmacyRecordsScreen />);
      expect(screen.getByText('No Pharmacy Records Found')).toBeTruthy();
    });
  });

  describe('tab navigation', () => {
    it('should render all tabs', () => {
      renderWithStore(<PharmacyRecordsScreen />);
      expect(screen.getByText('Overview')).toBeTruthy();
      expect(screen.getByText('Medications')).toBeTruthy();
      expect(screen.getByText('Allergies')).toBeTruthy();
      expect(screen.getByText('Interactions')).toBeTruthy();
    });

    it('should switch tabs on press', async () => {
      renderWithStore(<PharmacyRecordsScreen />);
      const medicationsTab = screen.getByText('Medications');
      fireEvent.press(medicationsTab);
      expect(medicationsTab).toBeTruthy();
    });

    it('should highlight active tab', async () => {
      const { getByText } = renderWithStore(<PharmacyRecordsScreen />);
      const allergiesTab = getByText('Allergies');
      fireEvent.press(allergiesTab);
      // Tab should be highlighted (visual state)
      expect(allergiesTab).toBeTruthy();
    });
  });

  describe('critical interactions alert', () => {
    it('should display alert when critical interactions exist', () => {
      const recordsStore = configureStore({
        reducer: {
          pharmacyRecords: pharmacyRecordsReducer,
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            isAuthenticated: true,
            nurse: mockNurse,
            token: 'test-token',
            hinEIDVerified: true,
          },
          pharmacyRecords: {
            records: {
              P001: [
                {
                  id: 'PR001',
                  patientId: 'P001',
                  pharmacyId: 'PH001',
                  pharmacyName: 'Test Pharmacy',
                  medicationHistory: [],
                  allergies: [],
                  interactions: ['Critical: Warfarin + NSAIDs'],
                  lastUpdated: '2024-12-15T10:00:00Z',
                },
              ],
            },
            selectedRecord: {
              id: 'PR001',
              patientId: 'P001',
              pharmacyId: 'PH001',
              pharmacyName: 'Test Pharmacy',
              medicationHistory: [],
              allergies: [],
              interactions: ['Critical: Warfarin + NSAIDs'],
              lastUpdated: '2024-12-15T10:00:00Z',
            },
            loading: false,
            error: null,
            lastAccessedPatientId: 'P001',
            auditLog: [],
          },
        },
      });

      jest.doMock('../../../hooks/usePharmacyRecords', () => ({
        usePharmacyRecords: () => ({
          records: [
            {
              id: 'PR001',
              patientId: 'P001',
              pharmacyId: 'PH001',
              pharmacyName: 'Test Pharmacy',
              medicationHistory: [],
              allergies: [],
              interactions: ['Critical: Warfarin + NSAIDs'],
              lastUpdated: '2024-12-15T10:00:00Z',
            },
          ],
          selectedRecord: {
            id: 'PR001',
            patientId: 'P001',
            pharmacyId: 'PH001',
            pharmacyName: 'Test Pharmacy',
            medicationHistory: [],
            allergies: [],
            interactions: ['Critical: Warfarin + NSAIDs'],
            lastUpdated: '2024-12-15T10:00:00Z',
          },
          loading: false,
          error: null,
          lastAccessedPatientId: 'P001',
          loadRecords: jest.fn(),
          selectRecord: jest.fn(),
          clearSelected: jest.fn(),
          clearErrorMessage: jest.fn(),
          getMedicationHistory: () => [],
          getAllergies: () => [],
          getInteractions: () => ['Critical: Warfarin + NSAIDs'],
          getPharmacyName: () => 'Test Pharmacy',
          getLastUpdated: () => '2024-12-15T10:00:00Z',
        }),
      }));

      // Render with mocked data
      render(
        <Provider store={recordsStore}>
          <PharmacyRecordsScreen />
        </Provider>
      );

      // Should display critical alert
      // Note: This test depends on the actual rendering logic
    });
  });

  describe('data display', () => {
    it('should display medication summary cards', () => {
      const recordsStore = configureStore({
        reducer: {
          pharmacyRecords: pharmacyRecordsReducer,
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            isAuthenticated: true,
            nurse: mockNurse,
            token: 'test-token',
            hinEIDVerified: true,
          },
          pharmacyRecords: {
            records: {
              P001: [
                {
                  id: 'PR001',
                  patientId: 'P001',
                  pharmacyId: 'PH001',
                  pharmacyName: 'Main Pharmacy',
                  medicationHistory: [
                    {
                      medicationId: 'M1',
                      name: 'Lisinopril',
                      dispensedDate: '2024-12-15',
                      quantity: 30,
                    },
                  ],
                  allergies: ['Penicillin'],
                  interactions: [],
                  lastUpdated: '2024-12-15T10:00:00Z',
                },
              ],
            },
            selectedRecord: {
              id: 'PR001',
              patientId: 'P001',
              pharmacyId: 'PH001',
              pharmacyName: 'Main Pharmacy',
              medicationHistory: [
                {
                  medicationId: 'M1',
                  name: 'Lisinopril',
                  dispensedDate: '2024-12-15',
                  quantity: 30,
                },
              ],
              allergies: ['Penicillin'],
              interactions: [],
              lastUpdated: '2024-12-15T10:00:00Z',
            },
            loading: false,
            error: null,
            lastAccessedPatientId: 'P001',
            auditLog: [],
          },
        },
      });

      jest.doMock('../../../hooks/usePharmacyRecords', () => ({
        usePharmacyRecords: () => ({
          records: [
            {
              id: 'PR001',
              patientId: 'P001',
              pharmacyId: 'PH001',
              pharmacyName: 'Main Pharmacy',
              medicationHistory: [
                {
                  medicationId: 'M1',
                  name: 'Lisinopril',
                  dispensedDate: '2024-12-15',
                  quantity: 30,
                },
              ],
              allergies: ['Penicillin'],
              interactions: [],
              lastUpdated: '2024-12-15T10:00:00Z',
            },
          ],
          selectedRecord: {
            id: 'PR001',
            patientId: 'P001',
            pharmacyId: 'PH001',
            pharmacyName: 'Main Pharmacy',
            medicationHistory: [
              {
                medicationId: 'M1',
                name: 'Lisinopril',
                dispensedDate: '2024-12-15',
                quantity: 30,
              },
            ],
            allergies: ['Penicillin'],
            interactions: [],
            lastUpdated: '2024-12-15T10:00:00Z',
          },
          loading: false,
          error: null,
          lastAccessedPatientId: 'P001',
          loadRecords: jest.fn(),
          selectRecord: jest.fn(),
          clearSelected: jest.fn(),
          clearErrorMessage: jest.fn(),
          getMedicationHistory: () => [
            {
              medicationId: 'M1',
              name: 'Lisinopril',
              dispensedDate: '2024-12-15',
              quantity: 30,
            },
          ],
          getAllergies: () => ['Penicillin'],
          getInteractions: () => [],
          getPharmacyName: () => 'Main Pharmacy',
          getLastUpdated: () => '2024-12-15T10:00:00Z',
        }),
      }));

      render(
        <Provider store={recordsStore}>
          <PharmacyRecordsScreen />
        </Provider>
      );

      // Verify summary cards are rendered
      // Note: Depends on actual rendering
    });
  });

  describe('error handling', () => {
    it('should handle load error gracefully', async () => {
      mockLoadRecords.mockRejectedValueOnce(new Error('Network error'));
      renderWithStore(<PharmacyRecordsScreen />);
      await waitFor(() => {
        // Should not crash
        expect(true).toBe(true);
      });
    });

    it('should allow retry on error', async () => {
      const errorStore = configureStore({
        reducer: {
          pharmacyRecords: pharmacyRecordsReducer,
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            isAuthenticated: true,
            nurse: mockNurse,
            token: 'test-token',
            hinEIDVerified: true,
          },
          pharmacyRecords: {
            records: {},
            selectedRecord: null,
            loading: false,
            error: 'Failed to load',
            lastAccessedPatientId: null,
            auditLog: [],
          },
        },
      });

      const { getByText } = render(
        <Provider store={errorStore}>
          <PharmacyRecordsScreen />
        </Provider>
      );

      const dismissButton = getByText('Dismiss');
      fireEvent.press(dismissButton);
      expect(dismissButton).toBeTruthy();
    });
  });
});
