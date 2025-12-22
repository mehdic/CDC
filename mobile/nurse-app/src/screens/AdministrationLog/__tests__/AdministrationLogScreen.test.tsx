/**
 * Administration Log Screen Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AdministrationLogScreen from '../AdministrationLogScreen';
import administrationReducer from '../../../store/administrationSlice';
import authReducer from '../../../store/authSlice';

const createMockStore = (administrations = []) =>
  configureStore({
    reducer: {
      administration: administrationReducer,
      auth: authReducer,
    },
    preloadedState: {
      administration: {
        administrations,
        currentAdministration: null,
        filteredAdministrations: administrations,
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

describe('AdministrationLogScreen', () => {
  const mockAdministration = {
    id: 'admin-1',
    patientId: 'patient-1',
    medicationId: 'med-1',
    scheduledTime: '2025-12-22T08:00:00Z',
    administeredAt: '2025-12-22T08:05:00Z',
    administeredBy: 'nurse-1',
    dosage: '500mg',
    route: 'oral' as const,
    notes: 'Test note',
    barcodeVerified: true,
    sideEffects: ['nausea'],
    witnessed: true,
    witnessedBy: 'nurse-2',
  };

  it('should render empty state when no administrations', () => {
    const store = createMockStore([]);
    render(
      <Provider store={store}>
        <AdministrationLogScreen />
      </Provider>
    );

    expect(screen.getByText(/No administration records found/i)).toBeTruthy();
  });

  it('should display header with filter button', () => {
    const store = createMockStore([]);
    render(
      <Provider store={store}>
        <AdministrationLogScreen />
      </Provider>
    );

    expect(screen.getByText(/Administration Log/i)).toBeTruthy();
    expect(screen.getByText(/Filter/i)).toBeTruthy();
  });

  it('should display search input', () => {
    const store = createMockStore([]);
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <AdministrationLogScreen />
      </Provider>
    );

    expect(getByPlaceholderText(/Search medication or patient/i)).toBeTruthy();
  });

  it('should render administration item when data exists', () => {
    const store = createMockStore([mockAdministration]);
    const { getByText } = render(
      <Provider store={store}>
        <AdministrationLogScreen />
      </Provider>
    );

    expect(getByText(mockAdministration.id)).toBeTruthy();
    expect(getByText(/500mg/i)).toBeTruthy();
  });

  it('should display verified badge for barcode verified administrations', () => {
    const store = createMockStore([mockAdministration]);
    const { getByText } = render(
      <Provider store={store}>
        <AdministrationLogScreen />
      </Provider>
    );

    expect(getByText(/✓ Verified/i)).toBeTruthy();
  });

  it('should display side effects warning when present', () => {
    const store = createMockStore([mockAdministration]);
    const { getByText } = render(
      <Provider store={store}>
        <AdministrationLogScreen />
      </Provider>
    );

    expect(getByText(/Side Effects: nausea/i)).toBeTruthy();
  });

  it('should display witness information when witnessed', () => {
    const store = createMockStore([mockAdministration]);
    const { getByText } = render(
      <Provider store={store}>
        <AdministrationLogScreen />
      </Provider>
    );

    expect(getByText(/Witnessed by: nurse-2/i)).toBeTruthy();
  });

  it('should filter administrations when search text is entered', async () => {
    const admin2 = { ...mockAdministration, id: 'admin-2', medicationId: 'med-2' };
    const store = createMockStore([mockAdministration, admin2]);
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <AdministrationLogScreen />
      </Provider>
    );

    const searchInput = getByPlaceholderText(/Search medication or patient/i);
    fireEvent.changeText(searchInput, 'med-1');

    await waitFor(() => {
      expect(screen.getByText(mockAdministration.id)).toBeTruthy();
    });
  });
});
