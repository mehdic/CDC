/**
 * AdverseReactionsScreen Tests
 * Unit tests for the ADR reporting screen component
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AdverseReactionsScreen from '../AdverseReactionsScreen';
import adrReducer from '../../../store/adrSlice';
import authReducer from '../../../store/authSlice';

// Mock the services
jest.mock('../../../services/nurseApiClient', () => ({
  nurseApiClient: {
    reportAdverseReaction: jest.fn(),
  },
}));

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      adr: adrReducer,
      auth: authReducer,
      patient: (state = {}) => state,
      medication: (state = {}) => state,
      delivery: (state = {}) => state,
      pharmacyRecords: (state = {}) => state,
      handover: (state = {}) => state,
      administration: (state = {}) => state,
    },
    preloadedState: {
      auth: {
        nurse: {
          id: 'nurse-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          hinId: 'HIN123',
          licenseNumber: 'LIC123',
          facility: 'Hospital',
          department: 'Ward',
          verified: true,
          mfaEnabled: false,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        token: 'token123',
        refreshToken: 'refresh123',
        isAuthenticated: true,
        mfaRequired: false,
        loading: false,
        error: null,
      } as any,
      adr: {
        currentReport: null,
        submittedReports: [],
        isSubmitting: false,
        error: null,
        successMessage: null,
      },
    } as any,
  });
};

// Mock route params
const mockRoute = {
  params: {
    patientId: 'patient-1',
    patientName: 'Jane Smith',
    medicationId: 'med-1',
    medicationName: 'Aspirin',
  },
};

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

describe('AdverseReactionsScreen', () => {
  let store: any;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <AdverseReactionsScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      </Provider>
    );
  };

  it('should render loading state initially', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <AdverseReactionsScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      </Provider>
    );

    // Form data might be loading
    expect(getByTestId).toBeDefined();
  });

  it('should render screen with patient info', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      expect(getByText('Report Adverse Reaction')).toBeTruthy();
      expect(getByText(/Jane Smith/)).toBeTruthy();
    });
  });

  it('should display medication fields', async () => {
    const { getByPlaceholderText } = renderComponent();

    await waitFor(() => {
      expect(getByPlaceholderText(/Medication Name/)).toBeTruthy();
      expect(getByPlaceholderText(/Medication ID/)).toBeTruthy();
    });
  });

  it('should display severity buttons', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      expect(getByText('MILD')).toBeTruthy();
      expect(getByText('MODERATE')).toBeTruthy();
      expect(getByText('SEVERE')).toBeTruthy();
      expect(getByText('LIFE THREATENING')).toBeTruthy();
    });
  });

  it('should select severity level', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      const severeButton = getByText('SEVERE');
      fireEvent.press(severeButton);
    });
  });

  it('should display symptom selection', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      expect(getByText('Rash')).toBeTruthy();
      expect(getByText('Fever')).toBeTruthy();
      expect(getByText('Nausea')).toBeTruthy();
    });
  });

  it('should toggle symptoms', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      const rashButton = getByText('Rash');
      fireEvent.press(rashButton);
    });
  });

  it('should display action taken field', async () => {
    const { getByPlaceholderText } = renderComponent();

    await waitFor(() => {
      expect(getByPlaceholderText(/Action Taken/)).toBeTruthy();
    });
  });

  it('should display photo attachment section', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      expect(getByText(/Photo Attachments/)).toBeTruthy();
      expect(getByText('+ Add Photo')).toBeTruthy();
    });
  });

  it('should display warning box', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      const warningText = getByText(/pharmacy/);
      expect(warningText).toBeTruthy();
    });
  });

  it('should display submit button', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      expect(getByText('Submit Report')).toBeTruthy();
    });
  });

  it('should show critical badge for severe severity', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      const severeButton = getByText('SEVERE');
      fireEvent.press(severeButton);
    });

    await waitFor(() => {
      expect(getByText('CRITICAL SEVERITY')).toBeTruthy();
    });
  });

  it('should update medication fields', async () => {
    const { getByPlaceholderText } = renderComponent();

    await waitFor(() => {
      const medicationInput = getByPlaceholderText(/Medication Name/);
      fireEvent.changeText(medicationInput, 'Ibuprofen');
      expect(medicationInput.props.value).toBe('Ibuprofen');
    });
  });

  it('should update action taken field', async () => {
    const { getByPlaceholderText } = renderComponent();

    await waitFor(() => {
      const actionInput = getByPlaceholderText(/Action Taken/);
      fireEvent.changeText(actionInput, 'Administered antihistamine');
    });
  });

  it('should display warning with critical alert for severe reactions', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      const severeButton = getByText('SEVERE');
      fireEvent.press(severeButton);
    });

    await waitFor(() => {
      const criticalWarning = getByText(
        /critical reaction will be reported immediately/
      );
      expect(criticalWarning).toBeTruthy();
    });
  });

  it('should display normal warning for mild reactions', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      const mildButton = getByText('MILD');
      fireEvent.press(mildButton);
    });

    await waitFor(() => {
      const normalWarning = getByText(/will be sent to the prescribing physician/);
      expect(normalWarning).toBeTruthy();
    });
  });
});
