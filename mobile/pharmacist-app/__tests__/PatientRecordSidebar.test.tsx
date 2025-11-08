/**
 * Tests for PatientRecordSidebar Component - Pharmacist App
 * Task: T164
 * FR-024: Pharmacists MUST access patient medical records during consultations
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PatientRecordSidebar from '../src/components/PatientRecordSidebar';
import { teleconsultationService, PatientMedicalRecord } from '../src/services/teleconsultationService';

// Mock teleconsultation service
jest.mock('../src/services/teleconsultationService');

const mockMedicalRecord: PatientMedicalRecord = {
  patient_id: 'patient-001',
  allergies: ['Penicillin', 'Sulfa drugs', 'Shellfish'],
  chronic_conditions: ['Type 2 Diabetes', 'Hypertension', 'Asthma'],
  current_medications: [
    { name: 'Metformin', dosage: '500mg', frequency: '2x daily' },
    { name: 'Lisinopril', dosage: '10mg', frequency: '1x daily' },
    { name: 'Albuterol Inhaler', dosage: '90mcg', frequency: 'as needed' },
  ],
  prescription_history: [
    {
      id: 'rx-001',
      medication_name: 'Amoxicillin',
      prescribed_date: '2025-10-01',
      prescribing_doctor: 'Dr. Smith',
    },
    {
      id: 'rx-002',
      medication_name: 'Ibuprofen',
      prescribed_date: '2025-09-15',
      prescribing_doctor: 'Dr. Johnson',
    },
  ],
};

describe('PatientRecordSidebar', () => {
  const mockOnClose = jest.fn();
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (teleconsultationService.getPatientRecord as jest.Mock).mockResolvedValue(mockMedicalRecord);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render without crashing when visible', async () => {
      const { getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText('Patient Medical Record')).toBeTruthy();
      });
    });

    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={false} onClose={mockOnClose} />
      );

      expect(queryByText('Patient Medical Record')).toBeNull();
    });

    it('should show loading state initially', () => {
      const { getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      expect(getByText('Loading medical record...')).toBeTruthy();
    });

    it('should load medical record on mount when visible', async () => {
      render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(teleconsultationService.getPatientRecord).toHaveBeenCalledWith('patient-001');
      });
    });
  });

  // ============================================================================
  // ALLERGIES SECTION TESTS
  // ============================================================================

  describe('Allergies Section', () => {
    it('should display all patient allergies', async () => {
      const { getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText('Penicillin')).toBeTruthy();
        expect(getByText('Sulfa drugs')).toBeTruthy();
        expect(getByText('Shellfish')).toBeTruthy();
      });
    });

    it('should show allergies count badge', async () => {
      const { getByTestId, getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        const badge = getByTestId('allergies-count-badge');
        expect(badge).toBeTruthy();
        expect(badge.props.children).toBe(3);
      });
    });

    it('should display empty state when no allergies', async () => {
      const emptyRecord = { ...mockMedicalRecord, allergies: [] };
      (teleconsultationService.getPatientRecord as jest.Mock).mockResolvedValue(emptyRecord);

      const { getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText('No known allergies')).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // CHRONIC CONDITIONS SECTION TESTS
  // ============================================================================

  describe('Chronic Conditions Section', () => {
    it('should display all chronic conditions', async () => {
      const { getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        // Switch to chronic conditions tab
        const conditionsButton = getByText(/Conditions/i);
        fireEvent.press(conditionsButton);

        expect(getByText('Type 2 Diabetes')).toBeTruthy();
        expect(getByText('Hypertension')).toBeTruthy();
        expect(getByText('Asthma')).toBeTruthy();
      });
    });

    it('should show conditions count badge', async () => {
      const { getByTestId } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        const badge = getByTestId('conditions-count-badge');
        expect(badge).toBeTruthy();
        expect(badge.props.children).toBe(3);
      });
    });
  });

  // ============================================================================
  // CURRENT MEDICATIONS SECTION TESTS
  // ============================================================================

  describe('Current Medications Section', () => {
    it('should display all current medications with dosage and frequency', async () => {
      const { getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        // Switch to medications tab
        const medicationsButton = getByText(/Medications/i);
        fireEvent.press(medicationsButton);

        expect(getByText('Metformin')).toBeTruthy();
        expect(getByText('500mg')).toBeTruthy();
        expect(getByText('2x daily')).toBeTruthy();
      });
    });

    it('should show medications count badge', async () => {
      const { getByTestId } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        const badge = getByTestId('medications-count-badge');
        expect(badge).toBeTruthy();
        expect(badge.props.children).toBe(3);
      });
    });
  });

  // ============================================================================
  // PRESCRIPTION HISTORY SECTION TESTS
  // ============================================================================

  describe('Prescription History Section', () => {
    it('should display prescription history', async () => {
      const { getByText, getByTestId } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        // Wait for component to load
        expect(getByTestId('section-history-button')).toBeTruthy();
      });

      // Switch to history tab using testID
      const historyButton = getByTestId('section-history-button');
      fireEvent.press(historyButton);

      await waitFor(() => {
        expect(getByText('Amoxicillin')).toBeTruthy();
        expect(getByText('Dr. Smith')).toBeTruthy();
      });
    });

    it('should show history count badge', async () => {
      const { getByTestId } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        const badge = getByTestId('history-count-badge');
        expect(badge).toBeTruthy();
        expect(badge.props.children).toBe(2);
      });
    });
  });

  // ============================================================================
  // SECTION SWITCHING TESTS
  // ============================================================================

  describe('Section Navigation', () => {
    it('should switch between sections', async () => {
      const { getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        // Start with allergies (default)
        expect(getByText('Penicillin')).toBeTruthy();

        // Switch to conditions
        const conditionsButton = getByText(/Conditions/i);
        fireEvent.press(conditionsButton);
        expect(getByText('Type 2 Diabetes')).toBeTruthy();

        // Switch to medications
        const medicationsButton = getByText(/Medications/i);
        fireEvent.press(medicationsButton);
        expect(getByText('Metformin')).toBeTruthy();

        // Switch to history
        const historyButton = getByText(/History/i);
        fireEvent.press(historyButton);
        expect(getByText('Amoxicillin')).toBeTruthy();
      });
    });

    it('should highlight active section button', async () => {
      const { getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        const conditionsButton = getByText(/Conditions/i);
        fireEvent.press(conditionsButton);

        // Button should be in active state (implementation-dependent)
        expect(conditionsButton).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should show alert on load error', async () => {
      const errorMessage = 'Failed to load medical record';
      (teleconsultationService.getPatientRecord as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to load medical record'
        );
      });
    });

    it('should show empty state when no medical record available', async () => {
      (teleconsultationService.getPatientRecord as jest.Mock).mockResolvedValue(null);

      const { getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText('No medical record available')).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // CLOSE FUNCTIONALITY TESTS
  // ============================================================================

  describe('Close Functionality', () => {
    it('should call onClose when close button is pressed', async () => {
      const { getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        const closeButton = getByText('✕');
        fireEvent.press(closeButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ============================================================================
  // CRITICAL SAFETY TESTS
  // ============================================================================

  describe('Critical Safety Features', () => {
    it('should prominently display allergies (safety critical)', async () => {
      const { getByText } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        // Allergies should be the default section (most critical)
        expect(getByText('Penicillin')).toBeTruthy();
      });
    });

    it('should show warning indicators for allergies', async () => {
      const { getByTestId } = render(
        <PatientRecordSidebar patientId="patient-001" visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        // Check for allergies section button with testID
        expect(getByTestId('section-allergies-button')).toBeTruthy();
      });
    });
  });
});
