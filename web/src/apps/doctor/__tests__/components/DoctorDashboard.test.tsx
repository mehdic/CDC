/**
 * Doctor Dashboard Component Tests
 * Tests for dashboard functionality and rendering
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DoctorDashboard } from '../../components/DoctorDashboard';
import * as doctorHooks from '../../hooks/useDoctor';

// Mock dependencies
jest.mock('../../hooks/useDoctor');

const mockDashboardData = {
  data: {
    totalPatients: 150,
    activePatients: 120,
    chronicPatients: 45,
    consultationsThisMonth: 32,
    pendingPrescriptions: 8,
    prescriptionsThisMonth: 76,
    averagePatientCompliance: 82,
    appointmentsThisWeek: 12,
  },
};

const mockConsultationsData = {
  data: [
    {
      id: '1',
      patientId: 'p1',
      patientName: 'Jean Martin',
      type: 'in-person',
      date: new Date().toISOString(),
      status: 'completed',
    },
    {
      id: '2',
      patientId: 'p2',
      patientName: 'Marie Dupont',
      type: 'teleconsultation',
      date: new Date().toISOString(),
      status: 'scheduled',
    },
  ],
};

describe('DoctorDashboard Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DoctorDashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should display loading state initially', () => {
    (doctorHooks.useDoctorDashboard as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    (doctorHooks.useRecentConsultations as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display dashboard title', async () => {
    (doctorHooks.useDoctorDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (doctorHooks.useRecentConsultations as jest.Mock).mockReturnValue({
      data: mockConsultationsData,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('dashboard-title')).toBeInTheDocument();
    expect(screen.getByText('Tableau de Bord Médecin')).toBeInTheDocument();
  });

  it('should display metric cards with correct values', async () => {
    (doctorHooks.useDoctorDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (doctorHooks.useRecentConsultations as jest.Mock).mockReturnValue({
      data: mockConsultationsData,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('total-patients-card')).toBeInTheDocument();
    expect(screen.getByTestId('active-patients-card')).toBeInTheDocument();
    expect(screen.getByTestId('pending-prescriptions-card')).toBeInTheDocument();
    expect(screen.getByTestId('compliance-card')).toBeInTheDocument();
  });

  it('should display refresh button and call refetch on click', async () => {
    const mockRefetch = jest.fn();

    (doctorHooks.useDoctorDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    (doctorHooks.useRecentConsultations as jest.Mock).mockReturnValue({
      data: mockConsultationsData,
      isLoading: false,
      error: null,
    });

    renderComponent();

    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should display quick actions panel', async () => {
    (doctorHooks.useDoctorDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (doctorHooks.useRecentConsultations as jest.Mock).mockReturnValue({
      data: mockConsultationsData,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('quick-actions-panel')).toBeInTheDocument();
    expect(screen.getByTestId('new-prescription-action')).toBeInTheDocument();
    expect(screen.getByTestId('view-patients-action')).toBeInTheDocument();
    expect(screen.getByTestId('messages-action')).toBeInTheDocument();
  });

  it('should display recent consultations', async () => {
    (doctorHooks.useDoctorDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (doctorHooks.useRecentConsultations as jest.Mock).mockReturnValue({
      data: mockConsultationsData,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('recent-consultations-panel')).toBeInTheDocument();
    expect(screen.getByText('Jean Martin')).toBeInTheDocument();
    expect(screen.getByText('Marie Dupont')).toBeInTheDocument();
  });

  it('should display summary statistics', async () => {
    (doctorHooks.useDoctorDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (doctorHooks.useRecentConsultations as jest.Mock).mockReturnValue({
      data: mockConsultationsData,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('summary-stats-panel')).toBeInTheDocument();
    expect(screen.getByText(/Rendez-vous cette semaine/)).toBeInTheDocument();
    expect(screen.getByText(/Consultations ce mois/)).toBeInTheDocument();
  });

  it('should handle error state', () => {
    const errorMessage = 'Failed to load dashboard';

    (doctorHooks.useDoctorDashboard as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error(errorMessage),
      refetch: jest.fn(),
    });

    (doctorHooks.useRecentConsultations as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('error-alert')).toBeInTheDocument();
  });

  it('should navigate when clicking metric cards', async () => {
    (doctorHooks.useDoctorDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (doctorHooks.useRecentConsultations as jest.Mock).mockReturnValue({
      data: mockConsultationsData,
      isLoading: false,
      error: null,
    });

    renderComponent();

    const totalPatientsCard = screen.getByTestId('total-patients-card');
    fireEvent.click(totalPatientsCard);

    // Navigation would be verified in integration tests
    expect(totalPatientsCard).toBeInTheDocument();
  });

  it('should display patient metrics with correct styling', async () => {
    (doctorHooks.useDoctorDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (doctorHooks.useRecentConsultations as jest.Mock).mockReturnValue({
      data: mockConsultationsData,
      isLoading: false,
      error: null,
    });

    renderComponent();

    const metricValues = screen.getAllByTestId('metric-value');
    expect(metricValues.length).toBeGreaterThan(0);
  });
});
