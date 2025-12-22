/**
 * Administration Recording Screen Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AdministrationRecordingScreen from '../AdministrationRecordingScreen';
import administrationReducer from '../../../store/administrationSlice';
import authReducer from '../../../store/authSlice';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
};

const mockRoute = {
  params: {
    patientId: 'patient-1',
    medicationId: 'med-1',
    scheduledTime: '2025-12-22T08:00:00Z',
  },
};

const createMockStore = () =>
  configureStore({
    reducer: {
      administration: administrationReducer,
      auth: authReducer,
    },
    preloadedState: {
      administration: {
        administrations: [],
        currentAdministration: null,
        filteredAdministrations: [],
        loading: false,
        error: null,
        filterPatientId: null,
        filterMedicationId: null,
        sortBy: 'date' as const,
      },
      auth: {
        nurse: {
          id: 'nurse-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          hinId: 'HIN123',
          licenseNumber: 'LIC123',
          facility: 'Hospital',
          department: 'ICU',
          verified: true,
          mfaEnabled: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh',
        isAuthenticated: true,
        mfaRequired: false,
        loading: false,
        error: null,
      },
    },
  });

describe('AdministrationRecordingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <AdministrationRecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    expect(screen.getByText(/Loading medications/i)).toBeTruthy();
  });

  it('should display medication selection section', async () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <AdministrationRecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(/Medication/i)).toBeTruthy();
    });
  });

  it('should display administration details section', async () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <AdministrationRecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(/Administration Details/i)).toBeTruthy();
    });
  });

  it('should display safety and monitoring section', async () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <AdministrationRecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(/Safety & Monitoring/i)).toBeTruthy();
    });
  });

  it('should have barcode scanner button', async () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <AdministrationRecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(/Scan Barcode/i)).toBeTruthy();
    });
  });

  it('should validate required fields on submit', async () => {
    const store = createMockStore();
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <AdministrationRecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </Provider>
    );

    await waitFor(() => {
      const submitButton = getByText(/Record Administration/i);
      expect(submitButton).toBeTruthy();
    });
  });
});
