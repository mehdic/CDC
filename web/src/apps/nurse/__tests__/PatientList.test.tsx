/**
 * Unit Tests for PatientList Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PatientList from '../components/PatientList';
import * as usePatientsHook from '../hooks/usePatients';

jest.mock('../hooks/usePatients');

const mockPatients = [
  {
    id: 'patient-1',
    firstName: 'Jean',
    lastName: 'Dupont',
    dateOfBirth: '1980-01-01',
    room: '101',
    ward: 'Cardiologie',
    allergies: ['Pénicilline'],
    chronicConditions: ['Hypertension'],
    currentMedications: [],
    contactNumber: '+41 79 123 45 67',
    emergencyContact: {
      name: 'Marie Dupont',
      phone: '+41 79 987 65 43',
      relationship: 'Épouse',
    },
    nurseNotes: [],
    lastUpdated: '2024-12-01T10:00:00Z',
  },
  {
    id: 'patient-2',
    firstName: 'Marie',
    lastName: 'Martin',
    dateOfBirth: '1975-05-15',
    room: '102',
    ward: 'Oncologie',
    allergies: [],
    chronicConditions: [],
    currentMedications: [],
    contactNumber: '+41 79 234 56 78',
    emergencyContact: {
      name: 'Paul Martin',
      phone: '+41 79 876 54 32',
      relationship: 'Époux',
    },
    nurseNotes: [],
    lastUpdated: '2024-12-01T10:00:00Z',
  },
];

describe('PatientList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientsHook.usePatients as jest.Mock).mockReturnValue({
      patients: mockPatients,
      loading: false,
      error: null,
    });
  });

  it('renders patient list title', () => {
    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    expect(screen.getByText('Mes Patients')).toBeInTheDocument();
  });

  it('displays all patients', () => {
    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Marie Martin')).toBeInTheDocument();
  });

  it('shows patient count', () => {
    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    expect(screen.getByText('2 patients au total')).toBeInTheDocument();
  });

  it('filters patients by search term', () => {
    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Rechercher/);
    fireEvent.change(searchInput, { target: { value: 'Jean' } });

    expect(usePatientsHook.usePatients).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Jean' })
    );
  });

  it('filters patients by ward', () => {
    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    const wardSelect = screen.getByLabelText('Service');
    fireEvent.mouseDown(wardSelect);

    const cardiologieOption = screen.getByText('Cardiologie');
    fireEvent.click(cardiologieOption);

    expect(usePatientsHook.usePatients).toHaveBeenCalledWith(
      expect.objectContaining({ ward: 'Cardiologie' })
    );
  });

  it('displays allergy warning', () => {
    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    expect(screen.getByText('1 allergie')).toBeInTheDocument();
  });

  it('handles empty patient list', () => {
    (usePatientsHook.usePatients as jest.Mock).mockReturnValue({
      patients: [],
      loading: false,
      error: null,
    });

    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    expect(screen.getByText('Aucun patient trouvé')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    (usePatientsHook.usePatients as jest.Mock).mockReturnValue({
      patients: [],
      loading: true,
      error: null,
    });

    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', () => {
    (usePatientsHook.usePatients as jest.Mock).mockReturnValue({
      patients: [],
      loading: false,
      error: 'Failed to fetch patients',
    });

    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    expect(screen.getByText('Failed to fetch patients')).toBeInTheDocument();
  });
});
