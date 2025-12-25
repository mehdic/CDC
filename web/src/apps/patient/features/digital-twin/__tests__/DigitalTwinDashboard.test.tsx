/**
 * Digital Twin Dashboard Tests
 * Unit tests for the main dashboard component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DigitalTwinDashboard } from '../pages/DigitalTwinDashboard';
import * as useDigitalTwinModule from '../hooks/useDigitalTwin';

// Mock the useDigitalTwin hook
jest.mock('../hooks/useDigitalTwin');

const mockProfile = {
  patient_id: 'patient-123',
  patient_name: 'John Doe',
  age: 45,
  demographic: {
    age_group: 'adult' as const,
    profile_completeness: 90,
  },
  medical_history: {
    chronic_conditions: [
      {
        condition_name: 'Type 2 Diabetes',
        diagnosed_date: new Date('2020-01-01'),
        severity: 'moderate' as const,
        managed_by: ['Metformin'],
      },
    ],
    allergies: [],
    current_medications: [
      {
        medication_name: 'Metformin 500mg',
        rxnorm_code: '6809',
        dosage: '500mg',
        frequency: 'twice daily',
        start_date: new Date('2020-01-01'),
        last_refill_date: new Date('2024-12-01'),
        next_refill_due: new Date('2025-01-01'),
        adherence_score: 85,
      },
    ],
    past_medications: [],
    total_prescriptions: 12,
    last_prescription_date: new Date('2024-12-01'),
  },
  purchase_behavior: {
    total_orders: 25,
    last_order_date: new Date('2024-12-10'),
    preferred_categories: ['Medications', 'Supplements'],
    avg_order_value: 45.5,
    purchase_frequency: 'medium' as const,
  },
  health_insights: {
    medication_adherence_score: 85,
    health_risk_level: 'moderate' as const,
    risk_factors: ['Chronic condition present'],
    drug_interactions: [],
    missing_preventive_care: ['Annual flu vaccine'],
  },
  predictions: {
    refill_due_dates: [
      {
        medication_name: 'Metformin 500mg',
        predicted_refill_date: new Date('2025-01-01'),
        confidence: 85,
        auto_refill_eligible: true,
      },
    ],
    upcoming_health_needs: ['Quarterly HbA1c test'],
    recommended_screenings: [],
  },
  engagement: {
    app_usage_frequency: 'high' as const,
    teleconsultation_count: 3,
    last_active_date: new Date('2024-12-20'),
    vip_status: false,
  },
  privacy: {
    data_sharing_consent: true,
    last_updated: new Date(),
  },
  cached: true,
  computed_at: new Date(),
};

const mockUseDigitalTwin = useDigitalTwinModule.useDigitalTwin as jest.MockedFunction<
  typeof useDigitalTwinModule.useDigitalTwin
>;

describe('DigitalTwinDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockUseDigitalTwin.mockReturnValue({
      profile: null,
      loading: true,
      error: null,
      refresh: jest.fn(),
    });

    render(<DigitalTwinDashboard patientId="patient-123" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render error state when API fails', async () => {
    mockUseDigitalTwin.mockReturnValue({
      profile: null,
      loading: false,
      error: new Error('Network error'),
      refresh: jest.fn(),
    });

    render(<DigitalTwinDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load digital twin profile/)
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should render profile data when loaded successfully', async () => {
    mockUseDigitalTwin.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<DigitalTwinDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check header info
    expect(screen.getByText(/Age: 45/)).toBeInTheDocument();
    expect(screen.getByText(/adult/)).toBeInTheDocument();
    expect(screen.getByText(/Profile 90% complete/)).toBeInTheDocument();

    // Check summary stats
    expect(screen.getByText('12')).toBeInTheDocument(); // Total Prescriptions
    expect(screen.getByText('25')).toBeInTheDocument(); // Total Orders
    expect(screen.getByText('3')).toBeInTheDocument(); // Teleconsultations
    expect(screen.getByText('1')).toBeInTheDocument(); // Chronic Conditions
  });

  it('should refresh profile when refresh button is clicked', async () => {
    const mockRefresh = jest.fn();
    mockUseDigitalTwin.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      refresh: mockRefresh,
    });

    const user = userEvent.setup();

    render(<DigitalTwinDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh Profile');
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should display medication adherence score', async () => {
    mockUseDigitalTwin.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<DigitalTwinDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Medication Adherence/)).toBeInTheDocument();
    });

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should display health risk level', async () => {
    mockUseDigitalTwin.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<DigitalTwinDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Overall Health Risk/)).toBeInTheDocument();
    });

    expect(screen.getByText('MODERATE')).toBeInTheDocument();
  });

  it('should display current medications', async () => {
    mockUseDigitalTwin.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<DigitalTwinDashboard patientId="patient-123" />);

    await waitFor(() => {
      const medicationElements = screen.getAllByText('Metformin 500mg');
      expect(medicationElements.length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/500mg • twice daily/)).toBeInTheDocument();
    expect(screen.getByText(/85% adherence/)).toBeInTheDocument();
  });

  it('should display refill predictions', async () => {
    mockUseDigitalTwin.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<DigitalTwinDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Upcoming Refills/)).toBeInTheDocument();
    });

    expect(screen.getByText(/85% confidence/)).toBeInTheDocument();
    expect(screen.getByText(/Auto-refill eligible/)).toBeInTheDocument();
  });
});
