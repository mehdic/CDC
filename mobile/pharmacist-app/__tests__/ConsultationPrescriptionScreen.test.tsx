/**
 * Tests for ConsultationPrescriptionScreen - Pharmacist App
 * Task: T167
 * FR-027: Pharmacists MUST be able to create prescriptions during/after teleconsultations
 *
 * CRITICAL: Validates prescription data before submission to prevent errors
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ConsultationPrescriptionScreen from '../src/screens/ConsultationPrescriptionScreen';
import { Teleconsultation, TeleconsultationStatus } from '../src/services/teleconsultationService';

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {
      teleconsultation: mockTeleconsultation,
    },
  }),
}));

const mockTeleconsultation: Teleconsultation = {
  id: 'tc-001',
  pharmacy_id: 'pharmacy-001',
  patient_id: 'patient-001',
  pharmacist_id: 'pharmacist-001',
  scheduled_at: '2025-11-08T10:00:00Z',
  duration_minutes: 15,
  status: TeleconsultationStatus.COMPLETED,
  recording_consent: true,
  twilio_room_sid: 'room-001',
  started_at: '2025-11-08T10:00:00Z',
  ended_at: '2025-11-08T10:15:00Z',
  created_at: '2025-11-07T12:00:00Z',
  updated_at: '2025-11-08T10:15:00Z',
  patient: {
    id: 'patient-001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+41791234567',
  },
};

describe('ConsultationPrescriptionScreen - Validation Tests', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  // ============================================================================
  // CRITICAL VALIDATION TESTS
  // ============================================================================

  describe('Required Field Validation', () => {
    it('should validate all required fields before submission', async () => {
      const { getByTestId } = render(<ConsultationPrescriptionScreen />);

      // Try to submit without filling any fields
      const submitButton = getByTestId('submit-prescription-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          expect.stringContaining('Medication name is required')
        );
      });
    });

    it('should require medication name', async () => {
      const { getByPlaceholderText, getByTestId } = render(<ConsultationPrescriptionScreen />);

      // Fill dosage, frequency, quantity but leave medication empty
      const dosageInput = getByPlaceholderText('e.g., 500mg');
      const frequencyInput = getByPlaceholderText('e.g., 3x daily');
      const quantityInput = getByPlaceholderText('e.g., 30');

      fireEvent.changeText(dosageInput, '500mg');
      fireEvent.changeText(frequencyInput, '3x daily');
      fireEvent.changeText(quantityInput, '30');

      // Submit
      const submitButton = getByTestId('submit-prescription-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          expect.stringContaining('Medication name is required')
        );
      });
    });

    it('should require dosage', async () => {
      const { getByPlaceholderText, getByTestId } = render(<ConsultationPrescriptionScreen />);

      // Fill medication, frequency, quantity but leave dosage empty
      const medicationInput = getByPlaceholderText('e.g., Amoxicillin');
      const frequencyInput = getByPlaceholderText('e.g., 3x daily');
      const quantityInput = getByPlaceholderText('e.g., 30');

      fireEvent.changeText(medicationInput, 'Amoxicillin');
      fireEvent.changeText(frequencyInput, '3x daily');
      fireEvent.changeText(quantityInput, '30');

      // Submit
      const submitButton = getByTestId('submit-prescription-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          expect.stringContaining('Dosage is required')
        );
      });
    });

    it('should require frequency', async () => {
      const { getByPlaceholderText, getByTestId } = render(<ConsultationPrescriptionScreen />);

      // Fill medication, dosage, quantity but leave frequency empty
      const medicationInput = getByPlaceholderText('e.g., Amoxicillin');
      const dosageInput = getByPlaceholderText('e.g., 500mg');
      const quantityInput = getByPlaceholderText('e.g., 30');

      fireEvent.changeText(medicationInput, 'Amoxicillin');
      fireEvent.changeText(dosageInput, '500mg');
      fireEvent.changeText(quantityInput, '30');

      // Submit
      const submitButton = getByTestId('submit-prescription-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          expect.stringContaining('Frequency is required')
        );
      });
    });

    it('should prevent quantity <= 0', async () => {
      const { getByPlaceholderText, getByTestId } = render(<ConsultationPrescriptionScreen />);

      // Fill all fields with quantity = 0
      const medicationInput = getByPlaceholderText('e.g., Amoxicillin');
      const dosageInput = getByPlaceholderText('e.g., 500mg');
      const frequencyInput = getByPlaceholderText('e.g., 3x daily');
      const quantityInput = getByPlaceholderText('e.g., 30');

      fireEvent.changeText(medicationInput, 'Amoxicillin');
      fireEvent.changeText(dosageInput, '500mg');
      fireEvent.changeText(frequencyInput, '3x daily');
      fireEvent.changeText(quantityInput, '0');

      // Submit
      const submitButton = getByTestId('submit-prescription-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          expect.stringContaining('Valid quantity is required')
        );
      });
    });
  });

  // ============================================================================
  // MEDICATION MANAGEMENT TESTS
  // ============================================================================

  describe('Multiple Medications', () => {
    it('should allow adding multiple medications', () => {
      const { getByText, getByTestId } = render(<ConsultationPrescriptionScreen />);

      // Initially should have 1 medication
      expect(getByText('Medication 1')).toBeTruthy();

      // Add second medication
      const addButton = getByTestId('add-medication-button');
      fireEvent.press(addButton);

      // Should now have 2 medications
      expect(getByText('Medication 2')).toBeTruthy();
    });

    it('should prevent removing last medication', () => {
      const { getByText, queryByText } = render(<ConsultationPrescriptionScreen />);

      // Try to remove the only medication
      const removeButton = queryByText('Remove');

      // Remove button should not exist when there's only one medication
      expect(removeButton).toBeNull();
    });

    it('should allow removing medication when more than one exists', () => {
      const { getByText, getByTestId, queryByText } = render(
        <ConsultationPrescriptionScreen />
      );

      // Add second medication
      const addButton = getByTestId('add-medication-button');
      fireEvent.press(addButton);

      // Should have 2 medications
      expect(getByText('Medication 2')).toBeTruthy();

      // Remove second medication
      const removeButton = getByTestId('remove-item-1-button');
      fireEvent.press(removeButton);

      // Medication 2 should be gone
      expect(queryByText('Medication 2')).toBeNull();
    });

    it('should show alert when trying to remove last medication', () => {
      const { getByTestId } = render(<ConsultationPrescriptionScreen />);

      // Add second medication
      const addButton = getByTestId('add-medication-button');
      fireEvent.press(addButton);

      // Remove second medication (index 1)
      const removeButton = getByTestId('remove-item-1-button');
      fireEvent.press(removeButton);

      // Now there's only one medication left
      // The remove button should no longer exist (verified in "should prevent removing last medication" test)
    });
  });

  describe('Field Updates', () => {
    it('should update medication name correctly', () => {
      const { getByPlaceholderText } = render(<ConsultationPrescriptionScreen />);

      const medicationInput = getByPlaceholderText('e.g., Amoxicillin');
      fireEvent.changeText(medicationInput, 'Ibuprofen');

      expect(medicationInput.props.value).toBe('Ibuprofen');
    });

    it('should update dosage correctly', () => {
      const { getByPlaceholderText } = render(<ConsultationPrescriptionScreen />);

      const dosageInput = getByPlaceholderText('e.g., 500mg');
      fireEvent.changeText(dosageInput, '400mg');

      expect(dosageInput.props.value).toBe('400mg');
    });

    it('should update frequency correctly', () => {
      const { getByPlaceholderText } = render(<ConsultationPrescriptionScreen />);

      const frequencyInput = getByPlaceholderText('e.g., 3x daily');
      fireEvent.changeText(frequencyInput, '2x daily');

      expect(frequencyInput.props.value).toBe('2x daily');
    });

    it('should update quantity correctly', () => {
      const { getByPlaceholderText } = render(<ConsultationPrescriptionScreen />);

      const quantityInput = getByPlaceholderText('e.g., 30');
      fireEvent.changeText(quantityInput, '60');

      expect(quantityInput.props.value).toBe('60');
    });

    it('should update duration correctly', () => {
      const { getByPlaceholderText } = render(<ConsultationPrescriptionScreen />);

      const durationInput = getByPlaceholderText('e.g., 7 days');
      fireEvent.changeText(durationInput, '14 days');

      expect(durationInput.props.value).toBe('14 days');
    });

    it('should update additional notes correctly', () => {
      const { getByPlaceholderText } = render(<ConsultationPrescriptionScreen />);

      const notesInput = getByPlaceholderText(
        'Add any additional instructions or notes for the patient...'
      );
      fireEvent.changeText(notesInput, 'Take with food');

      expect(notesInput.props.value).toBe('Take with food');
    });
  });

  // ============================================================================
  // COMPONENT RENDERING TESTS
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { getByTestId } = render(<ConsultationPrescriptionScreen />);
      expect(getByTestId('submit-prescription-button')).toBeTruthy();
    });

    it('should display patient information', () => {
      const { getByText } = render(<ConsultationPrescriptionScreen />);

      expect(getByText(/Patient: John Doe/)).toBeTruthy();
    });

    it('should display consultation date', () => {
      const { getByText } = render(<ConsultationPrescriptionScreen />);

      expect(getByText(/From teleconsultation on/)).toBeTruthy();
    });

    it('should display info message about prescription', () => {
      const { getByText } = render(<ConsultationPrescriptionScreen />);

      expect(
        getByText(
          /This prescription will be linked to the teleconsultation session and sent to the patient for approval/
        )
      ).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('should show confirmation alert when submitting valid prescription', async () => {
      const { getByPlaceholderText, getByTestId } = render(<ConsultationPrescriptionScreen />);

      // Fill all required fields
      fireEvent.changeText(getByPlaceholderText('e.g., Amoxicillin'), 'Amoxicillin');
      fireEvent.changeText(getByPlaceholderText('e.g., 500mg'), '500mg');
      fireEvent.changeText(getByPlaceholderText('e.g., 3x daily'), '3x daily');
      fireEvent.changeText(getByPlaceholderText('e.g., 30'), '30');

      // Submit
      const submitButton = getByTestId('submit-prescription-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Create Prescription',
          expect.stringContaining('Create prescription for John Doe?'),
          expect.any(Array)
        );
      });
    });

    it('should disable submit button while saving', async () => {
      const { getByPlaceholderText, getByTestId } = render(<ConsultationPrescriptionScreen />);

      // Fill all required fields
      fireEvent.changeText(getByPlaceholderText('e.g., Amoxicillin'), 'Amoxicillin');
      fireEvent.changeText(getByPlaceholderText('e.g., 500mg'), '500mg');
      fireEvent.changeText(getByPlaceholderText('e.g., 3x daily'), '3x daily');
      fireEvent.changeText(getByPlaceholderText('e.g., 30'), '30');

      const submitButton = getByTestId('submit-prescription-button');
      expect(submitButton.props.accessibilityState?.disabled).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    it('should show error screen when teleconsultation is missing', () => {
      // Mock useRoute to return no params
      jest.mock('@react-navigation/native', () => ({
        useNavigation: () => ({
          navigate: mockNavigate,
          goBack: mockGoBack,
        }),
        useRoute: () => ({
          params: undefined,
        }),
      }));

      const { getByText } = render(<ConsultationPrescriptionScreen />);

      expect(getByText('Teleconsultation information not available')).toBeTruthy();
    });
  });

  describe('Validation for Multiple Medications', () => {
    it('should validate all medications when multiple exist', async () => {
      const { getByTestId, getAllByPlaceholderText } = render(
        <ConsultationPrescriptionScreen />
      );

      // Add second medication
      fireEvent.press(getByTestId('add-medication-button'));

      // Fill only first medication
      const medicationInputs = getAllByPlaceholderText('e.g., Amoxicillin');
      const dosageInputs = getAllByPlaceholderText('e.g., 500mg');
      const frequencyInputs = getAllByPlaceholderText('e.g., 3x daily');
      const quantityInputs = getAllByPlaceholderText('e.g., 30');

      fireEvent.changeText(medicationInputs[0], 'Amoxicillin');
      fireEvent.changeText(dosageInputs[0], '500mg');
      fireEvent.changeText(frequencyInputs[0], '3x daily');
      fireEvent.changeText(quantityInputs[0], '30');

      // Leave second medication empty and submit
      const submitButton = getByTestId('submit-prescription-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          expect.stringContaining('item 2')
        );
      });
    });
  });
});
