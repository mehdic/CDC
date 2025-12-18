/**
 * Patient Search Screen Integration Tests
 * Tests for search screen functionality and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PatientSearchScreen from '../PatientSearchScreen';
import patientReducer, { setAllPatients, setSearchQuery } from '../../../store/patientSlice';
import { Patient } from '../../../types/nurse';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('PatientSearchScreen', () => {
  const mockPatient1: Patient = {
    id: 'P001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1960-05-15',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension'],
    currentMedications: [
      {
        id: 'M1',
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'daily',
        route: 'oral',
        startDate: '2024-01-01',
        prescribedBy: 'Dr. Smith',
      },
    ],
    roomNumber: '101',
    admissionDate: '2024-12-01',
  };

  const mockPatient2: Patient = {
    id: 'P002',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1970-08-22',
    allergies: [],
    chronicConditions: ['Diabetes'],
    currentMedications: [
      {
        id: 'M2',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice daily',
        route: 'oral',
        startDate: '2024-06-15',
        prescribedBy: 'Dr. Johnson',
      },
    ],
    roomNumber: '102',
  };

  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        patient: patientReducer,
      },
    });
    mockNavigate.mockClear();
  });

  const renderWithStore = (component: React.ReactElement) => {
    return render(<Provider store={store}>{component}</Provider>);
  };

  describe('initial render', () => {
    it('should render patient search screen', () => {
      renderWithStore(<PatientSearchScreen />);
      expect(screen.getByText('Patient Search')).toBeTruthy();
    });

    it('should display search input', () => {
      renderWithStore(<PatientSearchScreen />);
      const searchInput = screen.getByPlaceholderText(
        'Search by name, ID, DOB, or room'
      );
      expect(searchInput).toBeTruthy();
    });

    it('should display filter button', () => {
      renderWithStore(<PatientSearchScreen />);
      const filterButtons = screen.getAllByText('⚙️');
      expect(filterButtons.length).toBeGreaterThan(0);
    });
  });

  describe('patient list display', () => {
    it('should display all patients when no search query', async () => {
      store.dispatch(setAllPatients([mockPatient1, mockPatient2]));
      renderWithStore(<PatientSearchScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });
    });

    it('should display patient information in list', async () => {
      store.dispatch(setAllPatients([mockPatient1]));
      renderWithStore(<PatientSearchScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('ID: P001')).toBeTruthy();
        expect(screen.getByText('101')).toBeTruthy(); // Room number
      });
    });

    it('should display medication count badge', async () => {
      store.dispatch(setAllPatients([mockPatient1]));
      renderWithStore(<PatientSearchScreen />);

      await waitFor(() => {
        expect(screen.getByText('1 med')).toBeTruthy();
      });
    });

    it('should display all patients by default', async () => {
      store.dispatch(setAllPatients([mockPatient1, mockPatient2]));
      renderWithStore(<PatientSearchScreen />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });
    });
  });

  describe('search functionality', () => {
    beforeEach(() => {
      store.dispatch(setAllPatients([mockPatient1, mockPatient2]));
    });

    it('should filter patients by first name', async () => {
      renderWithStore(<PatientSearchScreen />);
      const searchInput = screen.getByPlaceholderText(
        'Search by name, ID, DOB, or room'
      );

      fireEvent.changeText(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.queryByText('Jane Smith')).toBeNull();
      });
    });

    it('should filter patients by last name', async () => {
      renderWithStore(<PatientSearchScreen />);
      const searchInput = screen.getByPlaceholderText(
        'Search by name, ID, DOB, or room'
      );

      fireEvent.changeText(searchInput, 'Smith');

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });
    });

    it('should filter patients by patient ID', async () => {
      renderWithStore(<PatientSearchScreen />);
      const searchInput = screen.getByPlaceholderText(
        'Search by name, ID, DOB, or room'
      );

      fireEvent.changeText(searchInput, 'P001');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });
    });

    it('should filter patients by room number', async () => {
      renderWithStore(<PatientSearchScreen />);
      const searchInput = screen.getByPlaceholderText(
        'Search by name, ID, DOB, or room'
      );

      fireEvent.changeText(searchInput, '101');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });
    });

    it('should display empty state for no search results', async () => {
      renderWithStore(<PatientSearchScreen />);
      const searchInput = screen.getByPlaceholderText(
        'Search by name, ID, DOB, or room'
      );

      fireEvent.changeText(searchInput, 'NonExistent');

      await waitFor(() => {
        expect(
          screen.getByText('No patients found matching your search')
        ).toBeTruthy();
      });
    });

    it('should clear search results when clear button is pressed', async () => {
      renderWithStore(<PatientSearchScreen />);
      const searchInput = screen.getByPlaceholderText(
        'Search by name, ID, DOB, or room'
      );

      fireEvent.changeText(searchInput, 'NonExistent');

      await waitFor(() => {
        const clearButton = screen.getByText('Clear Search');
        expect(clearButton).toBeTruthy();
        fireEvent.press(clearButton);
      });

      // After clearing search, dispatch action to reset search query
      store.dispatch(setSearchQuery(''));

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });
    });
  });

  describe('patient selection', () => {
    beforeEach(() => {
      store.dispatch(setAllPatients([mockPatient1]));
    });

    it('should add selected patient to recent patients', async () => {
      renderWithStore(<PatientSearchScreen />);

      await waitFor(() => {
        const patientItem = screen.getByText('John Doe');
        fireEvent.press(patientItem);
      });

      const state = store.getState();
      expect(state.patient.recentPatients).toHaveLength(1);
      expect(state.patient.recentPatients).toContainEqual(mockPatient1);
    });
  });

  describe('filter functionality', () => {
    beforeEach(() => {
      store.dispatch(
        setAllPatients([
          mockPatient1,
          mockPatient2,
          {
            ...mockPatient1,
            id: 'P003',
            roomNumber: '201',
            currentMedications: [],
          },
        ])
      );
    });

    it('should display filter panel when filter button is pressed', async () => {
      renderWithStore(<PatientSearchScreen />);
      const filterButtons = screen.getAllByText('⚙️');
      fireEvent.press(filterButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Unit/Ward')).toBeTruthy();
        expect(screen.getByText('Medication Status')).toBeTruthy();
        expect(screen.getByText('Sort By')).toBeTruthy();
      });
    });

    it('should display filter options', async () => {
      renderWithStore(<PatientSearchScreen />);
      const filterButtons = screen.getAllByText('⚙️');
      fireEvent.press(filterButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Unit 1')).toBeTruthy();
        expect(screen.getByText('Active')).toBeTruthy();
        expect(screen.getByText('Name')).toBeTruthy();
      });
    });
  });

  describe('recent patients', () => {
    it('should update recent patients in Redux store when patient is selected', async () => {
      store.dispatch(setAllPatients([mockPatient1, mockPatient2]));
      renderWithStore(<PatientSearchScreen />);

      // Select a patient
      await waitFor(() => {
        const patientItem = screen.getByText('John Doe');
        fireEvent.press(patientItem);
      });

      // Verify Redux state was updated
      const state = store.getState();
      expect(state.patient.recentPatients).toHaveLength(1);
      expect(state.patient.recentPatients[0]).toEqual(mockPatient1);
    });
  });
});
