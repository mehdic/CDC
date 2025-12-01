/**
 * Observance Statistics Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ObservanceStats } from '../../components/ObservanceStats';
import * as doctorHooks from '../../hooks/useDoctor';

jest.mock('../../hooks/useDoctor');

const mockObservanceData = {
  data: {
    overallStats: [
      {
        patientId: 'p1',
        patientName: 'Jean Martin',
        overallCompliance: 85,
        medicationAdherence: 90,
        appointmentAttendance: 80,
        labTestCompletion: 75,
        trend: 'improving' as const,
        lastUpdated: new Date().toISOString(),
      },
      {
        patientId: 'p2',
        patientName: 'Marie Dupont',
        overallCompliance: 65,
        medicationAdherence: 70,
        appointmentAttendance: 60,
        labTestCompletion: 65,
        trend: 'declining' as const,
        lastUpdated: new Date().toISOString(),
      },
    ],
    chartData: [
      { date: new Date().toISOString(), compliance: 80 },
      { date: new Date(Date.now() - 86400000).toISOString(), compliance: 82 },
    ],
    topCompliantPatients: [
      {
        id: 'p1',
        firstName: 'Jean',
        lastName: 'Martin',
        email: 'jean@example.com',
        phone: '+41 79 123 45 67',
        dateOfBirth: '1970-05-15',
        medicalHistory: [],
        allergies: [],
        activeConditions: [],
        chronicPatient: true,
      },
    ],
    needsAttentionPatients: [
      {
        id: 'p2',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie@example.com',
        phone: '+41 79 987 65 43',
        dateOfBirth: '1985-03-20',
        medicalHistory: [],
        allergies: [],
        activeConditions: [],
        chronicPatient: false,
      },
    ],
  },
};

describe('ObservanceStats Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ObservanceStats />
      </QueryClientProvider>
    );
  };

  it('should display page title', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: mockObservanceData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByTestId('page-title')).toBeInTheDocument();
    expect(screen.getByText(/Statistiques d'Observance/)).toBeInTheDocument();
  });

  it('should display export button', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: mockObservanceData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByTestId('export-button')).toBeInTheDocument();
  });

  it('should display overall compliance panel', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: mockObservanceData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByTestId('overall-compliance-panel')).toBeInTheDocument();
  });

  it('should display top compliant patients panel', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: mockObservanceData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByTestId('top-compliant-panel')).toBeInTheDocument();
    expect(screen.getByText('Jean Martin')).toBeInTheDocument();
  });

  it('should display observance table', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: mockObservanceData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByTestId('observance-table')).toBeInTheDocument();
  });

  it('should display patient observance rows', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: mockObservanceData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByTestId('observance-row-p1')).toBeInTheDocument();
    expect(screen.getByTestId('observance-row-p2')).toBeInTheDocument();
  });

  it('should display needs attention section', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: mockObservanceData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByText('Nécessite une Attention')).toBeInTheDocument();
  });

  it('should handle view chart button click', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: mockObservanceData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: { data: [{ date: new Date().toISOString(), compliance: 85 }] },
      isLoading: false,
    });

    renderComponent();

    const viewChartButtons = screen.getAllByTestId('view-chart-button');
    fireEvent.click(viewChartButtons[0]);

    expect(screen.getByTestId('chart-dialog')).toBeInTheDocument();
  });

  it('should display chart dialog when opened', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: mockObservanceData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: { data: [{ date: new Date().toISOString(), compliance: 85 }] },
      isLoading: false,
    });

    renderComponent();

    const viewChartButtons = screen.getAllByTestId('view-chart-button');
    fireEvent.click(viewChartButtons[0]);

    expect(screen.getByText(/Évolution de l'observance/)).toBeInTheDocument();
  });

  it('should display loading state', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    // Should have loading spinner
    const spinners = screen.getAllByRole('progressbar');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('should display error state', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByText(/Erreur lors du chargement/)).toBeInTheDocument();
  });

  it('should display compliance percentage values', () => {
    (doctorHooks.useDoctorObservanceStats as jest.Mock).mockReturnValue({
      data: mockObservanceData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.usePatientComplianceChart as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    // Check for compliance percentages in the table
    const cells = screen.getAllByText('85');
    expect(cells.length).toBeGreaterThan(0);
  });
});
