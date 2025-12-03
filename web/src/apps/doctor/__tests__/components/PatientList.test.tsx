/**
 * Patient List Component Tests
 */

import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../../shared/utils/test-utils';
import { PatientList } from '../../components/PatientList';
import * as doctorHooks from '../../hooks/useDoctor';

jest.mock('../../hooks/useDoctor');

const mockPatients = {
  data: {
    patients: [
      {
        id: 'p1',
        firstName: 'Jean',
        lastName: 'Martin',
        email: 'jean@example.com',
        phone: '+41 79 123 45 67',
        dateOfBirth: '1970-05-15',
        medicalHistory: ['Hypertension'],
        allergies: ['Pénicilline'],
        lastVisit: new Date().toISOString(),
        activeConditions: ['Diabète de type 2'],
        chronicPatient: true,
      },
      {
        id: 'p2',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie@example.com',
        phone: '+41 79 987 65 43',
        dateOfBirth: '1985-03-20',
        medicalHistory: [],
        allergies: [],
        lastVisit: new Date().toISOString(),
        activeConditions: [],
        chronicPatient: false,
      },
    ],
    total: 2,
    page: 1,
    pageSize: 9,
  },
};

describe.skip('PatientList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <PatientList />,
      { withRouter: true, withQueryClient: true }
    );
  };

  it('should display page title', () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: mockPatients,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('page-title')).toBeInTheDocument();
    expect(screen.getByText('Liste des Patients')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display patient cards', () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: mockPatients,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('patient-card-p1')).toBeInTheDocument();
    expect(screen.getByTestId('patient-card-p2')).toBeInTheDocument();
  });

  it('should display patient information in cards', () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: mockPatients,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('Jean Martin')).toBeInTheDocument();
    expect(screen.getByText('Marie Dupont')).toBeInTheDocument();
    expect(screen.getByText('jean@example.com')).toBeInTheDocument();
    expect(screen.getByText('marie@example.com')).toBeInTheDocument();
  });

  it('should display search input', () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: mockPatients,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('should display sort dropdown', () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: mockPatients,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('sort-select')).toBeInTheDocument();
  });

  it('should display chronic patient filter', () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: mockPatients,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('chronic-filter')).toBeInTheDocument();
  });

  it('should display chronic badge for chronic patients', () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: mockPatients,
      isLoading: false,
      error: null,
    });

    renderComponent();

    const chronicBadges = screen.getAllByTestId('chronic-badge');
    expect(chronicBadges.length).toBe(1); // Only first patient is chronic
  });

  it('should display active conditions', () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: mockPatients,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('Diabète de type 2')).toBeInTheDocument();
  });

  it('should handle search input', async () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: mockPatients,
      isLoading: false,
      error: null,
    });

    renderComponent();

    const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Jean' } });

    expect(searchInput.value).toBe('Jean');
  });

  it('should display empty state when no patients found', () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: { data: { patients: [], total: 0, page: 1, pageSize: 9 } },
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should display error alert on error', () => {
    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    renderComponent();

    expect(screen.getByTestId('error-alert')).toBeInTheDocument();
  });

  it('should display pagination when there are multiple pages', () => {
    const manyPatients = {
      data: {
        patients: Array(20).fill(null).map((_, i) => ({
          ...mockPatients.data.patients[0],
          id: `p${i}`,
          firstName: `Patient${i}`,
        })),
        total: 20,
        page: 1,
        pageSize: 9,
      },
    };

    (doctorHooks.useDoctorPatients as jest.Mock).mockReturnValue({
      data: manyPatients,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });
});
