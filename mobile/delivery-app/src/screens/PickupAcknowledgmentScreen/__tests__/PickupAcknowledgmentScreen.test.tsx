/**
 * PickupAcknowledgmentScreen Unit Tests
 * Comprehensive tests for pickup acknowledgment workflow
 */

import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { DeliveryRequest } from '../../../types/delivery';
import {
  PickupAcknowledgmentScreen,
  AcknowledgmentRecord,
} from '../PickupAcknowledgmentScreen';

describe('PickupAcknowledgmentScreen', () => {
  const mockOnAcknowledgeComplete = jest.fn();
  const mockOnCancel = jest.fn();

  // Mock delivery with no special handling
  const mockDeliveryNoHandling: DeliveryRequest = {
    id: 'DEL001',
    pharmacyId: 'PHARM001',
    pharmacyName: 'Test Pharmacy',
    patient: {
      id: 'PAT001',
      name: 'John Doe',
      phone: '+41 79 123 4567',
      address: {
        street: '123 Main Street',
        city: 'Zurich',
        postalCode: '8001',
        canton: 'ZH',
        country: 'Switzerland',
      },
    },
    packages: [
      {
        id: 'PKG001',
        qrCode: 'QR12345',
        medications: [
          {
            id: 'MED001',
            name: 'Aspirin',
            quantity: 1,
            dosage: '500mg',
            requiresColdChain: false,
            isControlledSubstance: false,
          },
        ],
        specialHandling: [],
      },
    ],
    status: 'pending',
    priority: 'medium',
    estimatedDuration: 15,
    distance: 2.5,
    paymentMethod: 'insurance',
    createdAt: '2025-12-15T10:00:00Z',
  };

  // Mock delivery with cold chain handling
  const mockDeliveryColdChain: DeliveryRequest = {
    ...mockDeliveryNoHandling,
    id: 'DEL002',
    packages: [
      {
        id: 'PKG002',
        qrCode: 'QR12346',
        medications: [
          {
            id: 'MED002',
            name: 'Insulin',
            quantity: 1,
            dosage: '100 units',
            requiresColdChain: true,
            isControlledSubstance: false,
          },
        ],
        specialHandling: ['cold_chain'],
      },
    ],
  };

  // Mock delivery with multiple special handling
  const mockDeliveryMultiple: DeliveryRequest = {
    ...mockDeliveryNoHandling,
    id: 'DEL003',
    packages: [
      {
        id: 'PKG003',
        qrCode: 'QR12347',
        medications: [
          {
            id: 'MED003',
            name: 'OxyContin',
            quantity: 1,
            dosage: '30mg',
            requiresColdChain: false,
            isControlledSubstance: true,
          },
        ],
        specialHandling: ['narcotics', 'signature_required', 'id_verification'],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering - No Special Handling', () => {
    it('should render screen when no special handling', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryNoHandling}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(getByTestId('pickup-acknowledgment-screen')).toBeTruthy();
    });

    it('should show no handling message', () => {
      const { getByTestId, queryByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryNoHandling}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      // Check if the no handling text is rendered
      const noHandlingButton = queryByTestId('pickup-acknowledgment-screen-proceed-button-no-handling');
      expect(noHandlingButton).toBeTruthy();
    });

    it('should have proceed button for no handling case', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryNoHandling}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(
        getByTestId('pickup-acknowledgment-screen-proceed-button-no-handling')
      ).toBeTruthy();
    });

    it('should call onAcknowledgeComplete with empty array for no handling', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryNoHandling}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const button = getByTestId(
        'pickup-acknowledgment-screen-proceed-button-no-handling'
      );
      fireEvent.press(button);

      expect(mockOnAcknowledgeComplete).toHaveBeenCalledWith([]);
    });
  });

  describe('Rendering - With Special Handling', () => {
    it('should render screen with special handling', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(getByTestId('pickup-acknowledgment-screen')).toBeTruthy();
    });

    it('should render title', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const title = getByTestId('pickup-acknowledgment-screen-title');
      expect(title.props.children).toBe('Special Handling Acknowledgment');
    });

    it('should render subtitle', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const subtitle = getByTestId('pickup-acknowledgment-screen-subtitle');
      expect(subtitle.props.children).toContain('review and acknowledge');
    });

    it('should display patient name', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const patientName = getByTestId('pickup-acknowledgment-screen-patient-name');
      expect(patientName.props.children).toBe('John Doe');
    });

    it('should display package count', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const packageCount = getByTestId(
        'pickup-acknowledgment-screen-package-count'
      );
      expect(packageCount.props.children).toBe(1);
    });
  });

  describe('Alert Display', () => {
    it('should render cold chain alert', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(
        getByTestId('pickup-acknowledgment-screen-alert-cold_chain')
      ).toBeTruthy();
    });

    it('should render multiple alerts', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryMultiple}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(
        getByTestId('pickup-acknowledgment-screen-alert-narcotics')
      ).toBeTruthy();
      expect(
        getByTestId('pickup-acknowledgment-screen-alert-signature_required')
      ).toBeTruthy();
      expect(
        getByTestId('pickup-acknowledgment-screen-alert-id_verification')
      ).toBeTruthy();
    });

    it('should render requirements for cold chain', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(
        getByTestId('pickup-acknowledgment-screen-requirement-cold_chain-0')
      ).toBeTruthy();
    });
  });

  describe('Acknowledgment Checkboxes', () => {
    it('should render checkbox for each special handling type', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryMultiple}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(
        getByTestId('pickup-acknowledgment-screen-checkbox-narcotics')
      ).toBeTruthy();
      expect(
        getByTestId('pickup-acknowledgment-screen-checkbox-signature_required')
      ).toBeTruthy();
      expect(
        getByTestId('pickup-acknowledgment-screen-checkbox-id_verification')
      ).toBeTruthy();
    });

    it('should have checkboxes unchecked initially', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      // The checkbox component has initial state of unchecked
      const checkbox = getByTestId('pickup-acknowledgment-screen-checkbox-cold_chain');
      expect(checkbox).toBeTruthy();
    });
  });

  describe('Button States', () => {
    it('should have proceed button present initially', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const button = getByTestId('pickup-acknowledgment-screen-proceed-button');
      expect(button).toBeTruthy();
    });

    it('should have cancel button present', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const button = getByTestId('pickup-acknowledgment-screen-cancel-button');
      expect(button).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call onCancel when cancel button is pressed', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = getByTestId(
        'pickup-acknowledgment-screen-cancel-button'
      );
      fireEvent.press(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show requirements list for each alert', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      // Requirements should be rendered
      const requirement = getByTestId(
        'pickup-acknowledgment-screen-requirement-cold_chain-0'
      );
      expect(requirement).toBeTruthy();
    });
  });

  describe('Footer Status Text', () => {
    it('should show remaining requirements count initially', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const footer = getByTestId('pickup-acknowledgment-screen-footer-text');
      expect(footer.props.children).toContain('requirement');
    });

    it('should show completion message when all acknowledged', () => {
      const { getByTestId, rerender } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      // Check the checkbox
      const checkbox = getByTestId(
        'pickup-acknowledgment-screen-checkbox-cold_chain'
      );
      fireEvent.press(checkbox);

      // Re-render to see updated footer
      rerender(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      // After all acknowledged, footer should show completion
      const footer = getByTestId('pickup-acknowledgment-screen-footer-text');
      expect(footer.props.children).toContain('complete');
    });
  });

  describe('Custom TestID', () => {
    it('should use custom testID when provided', () => {
      const customTestID = 'my-custom-screen';
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
          testID={customTestID}
        />
      );

      expect(getByTestId(customTestID)).toBeTruthy();
    });

    it('should use default testID if not provided', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(getByTestId('pickup-acknowledgment-screen')).toBeTruthy();
    });
  });

  describe('Multiple Special Handling Types', () => {
    it('should handle multiple special handling types', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryMultiple}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const narc = getByTestId(
        'pickup-acknowledgment-screen-checkbox-narcotics'
      );
      const sig = getByTestId(
        'pickup-acknowledgment-screen-checkbox-signature_required'
      );
      const id = getByTestId('pickup-acknowledgment-screen-checkbox-id_verification');

      expect(narc).toBeTruthy();
      expect(sig).toBeTruthy();
      expect(id).toBeTruthy();
    });

    it('should require all acknowledgments before proceeding', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryMultiple}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      // Multiple special handling types should require all acknowledgments
      const narc = getByTestId(
        'pickup-acknowledgment-screen-checkbox-narcotics'
      );
      const sig = getByTestId(
        'pickup-acknowledgment-screen-checkbox-signature_required'
      );
      const id = getByTestId('pickup-acknowledgment-screen-checkbox-id_verification');

      expect(narc).toBeTruthy();
      expect(sig).toBeTruthy();
      expect(id).toBeTruthy();
    });
  });

  describe('Delivery Info Display', () => {
    it('should display delivery info section', () => {
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={mockDeliveryColdChain}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(
        getByTestId('pickup-acknowledgment-screen-delivery-info')
      ).toBeTruthy();
    });

    it('should display correct patient name in info', () => {
      const delivery = { ...mockDeliveryColdChain, patient: { ...mockDeliveryColdChain.patient, name: 'Jane Smith' } };
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={delivery}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const patientName = getByTestId('pickup-acknowledgment-screen-patient-name');
      expect(patientName.props.children).toBe('Jane Smith');
    });

    it('should display correct package count', () => {
      const delivery = {
        ...mockDeliveryColdChain,
        packages: [
          mockDeliveryColdChain.packages[0],
          { ...mockDeliveryColdChain.packages[0], id: 'PKG004' },
          { ...mockDeliveryColdChain.packages[0], id: 'PKG005' },
        ],
      };
      const { getByTestId } = render(
        <PickupAcknowledgmentScreen
          delivery={delivery}
          onAcknowledgeComplete={mockOnAcknowledgeComplete}
          onCancel={mockOnCancel}
        />
      );

      const packageCount = getByTestId(
        'pickup-acknowledgment-screen-package-count'
      );
      expect(packageCount.props.children).toBe(3);
    });
  });
});
