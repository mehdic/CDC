/**
 * Treatment View Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TreatmentView } from '../../components/TreatmentView';
import * as doctorHooks from '../../hooks/useDoctor';

jest.mock('../../hooks/useDoctor');

const mockTreatmentData = {
  data: {
    currentTreatments: [
      {
        id: 't1',
        patientId: 'p1',
        name: 'Diabète Type 2',
        description: 'Gestion du diabète avec insuline',
        startDate: new Date('2024-01-01').toISOString(),
        status: 'active' as const,
        medications: [
          {
            id: 'm1',
            patientId: 'p1',
            medication: 'Insuline Glargine',
            dosage: '100 UI',
            frequency: 'Une fois par jour',
            duration: '12 mois',
            quantity: 10,
            createdAt: new Date().toISOString(),
            validFrom: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active' as const,
            renewalCount: 1,
            maxRenewals: 3,
          },
        ],
        notes: 'Patient stable',
      },
    ],
    treatmentHistory: [
      {
        id: 'h1',
        patientId: 'p1',
        treatmentName: 'Hypertension',
        medications: ['Lisinopril 10mg'],
        startDate: new Date('2022-01-01').toISOString(),
        endDate: new Date('2023-12-31').toISOString(),
        outcome: 'Bien contrôlée',
      },
    ],
  },
};

describe('TreatmentView Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    jest.clearAllMocks();
  });

  const renderComponent = (patientId: string = 'p1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TreatmentView patientId={patientId} />
      </QueryClientProvider>
    );
  };

  it('should display loading state', () => {
    (doctorHooks.usePatientTreatments as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    (doctorHooks.useRenewPrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (doctorHooks.useUpdatePrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    // Check for loading indicator
    const elements = screen.queryAllByRole('progressbar');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should display tabs', () => {
    (doctorHooks.usePatientTreatments as jest.Mock).mockReturnValue({
      data: mockTreatmentData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.useRenewPrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (doctorHooks.useUpdatePrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    expect(screen.getByTestId('treatment-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('current-treatments-tab')).toBeInTheDocument();
    expect(screen.getByTestId('history-tab')).toBeInTheDocument();
  });

  it('should display current treatments', () => {
    (doctorHooks.usePatientTreatments as jest.Mock).mockReturnValue({
      data: mockTreatmentData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.useRenewPrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (doctorHooks.useUpdatePrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    expect(screen.getByTestId('treatment-card-t1')).toBeInTheDocument();
    expect(screen.getByTestId('treatment-name')).toHaveTextContent('Diabète Type 2');
  });

  it('should display prescriptions table', () => {
    (doctorHooks.usePatientTreatments as jest.Mock).mockReturnValue({
      data: mockTreatmentData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.useRenewPrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (doctorHooks.useUpdatePrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    expect(screen.getByTestId('prescriptions-table')).toBeInTheDocument();
    expect(screen.getByText('Insuline Glargine')).toBeInTheDocument();
  });

  it('should display renew button for active prescriptions', () => {
    (doctorHooks.usePatientTreatments as jest.Mock).mockReturnValue({
      data: mockTreatmentData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.useRenewPrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (doctorHooks.useUpdatePrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    const renewButtons = screen.getAllByTestId('renew-button');
    expect(renewButtons.length).toBeGreaterThan(0);
  });

  it('should handle renew button click', () => {
    const mockRenew = jest.fn().mockResolvedValue({});

    (doctorHooks.usePatientTreatments as jest.Mock).mockReturnValue({
      data: mockTreatmentData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.useRenewPrescription as jest.Mock).mockReturnValue({
      mutateAsync: mockRenew,
      isPending: false,
    });

    (doctorHooks.useUpdatePrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    const renewButtons = screen.getAllByTestId('renew-button');
    fireEvent.click(renewButtons[0]);

    expect(mockRenew).toHaveBeenCalled();
  });

  it('should switch to history tab', () => {
    (doctorHooks.usePatientTreatments as jest.Mock).mockReturnValue({
      data: mockTreatmentData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.useRenewPrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (doctorHooks.useUpdatePrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    const historyTab = screen.getByTestId('history-tab');
    fireEvent.click(historyTab);

    expect(screen.getByTestId('history-table')).toBeInTheDocument();
  });

  it('should display treatment history', () => {
    (doctorHooks.usePatientTreatments as jest.Mock).mockReturnValue({
      data: mockTreatmentData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.useRenewPrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (doctorHooks.useUpdatePrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    const historyTab = screen.getByTestId('history-tab');
    fireEvent.click(historyTab);

    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('Bien contrôlée')).toBeInTheDocument();
  });

  it('should display treatment status', () => {
    (doctorHooks.usePatientTreatments as jest.Mock).mockReturnValue({
      data: mockTreatmentData,
      isLoading: false,
      error: null,
    });

    (doctorHooks.useRenewPrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (doctorHooks.useUpdatePrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    const statusBadges = screen.getAllByTestId('treatment-status');
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('should handle error state', () => {
    (doctorHooks.usePatientTreatments as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    (doctorHooks.useRenewPrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (doctorHooks.useUpdatePrescription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    // Should show error message
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });
});
