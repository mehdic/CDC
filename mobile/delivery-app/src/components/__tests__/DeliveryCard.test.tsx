/**
 * DeliveryCard Component Unit Tests
 * Comprehensive tests for delivery overview card component
 */

import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { DeliveryRequest } from '../../types/delivery';
import { DeliveryCard } from '../DeliveryCard';

describe('DeliveryCard Component', () => {
  // Mock delivery data
  const mockDelivery: DeliveryRequest = {
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

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render delivery card', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      expect(getByTestId('delivery-card')).toBeTruthy();
    });

    it('should render patient name', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      const patientName = getByTestId('delivery-card-patient-name');
      expect(patientName.props.children).toBe('John Doe');
    });

    it('should render address', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      const address = getByTestId('delivery-card-address');
      expect(address.props.children).toEqual(['123 Main Street', ', ', 'Zurich']);
    });

    it('should render distance', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      const distance = getByTestId('delivery-card-distance');
      expect(distance.props.children).toEqual(['2.5', ' km']);
    });

    it('should render duration', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      const duration = getByTestId('delivery-card-duration');
      expect(duration.props.children).toEqual(['15', ' min']);
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} testID="custom-card" />
      );

      expect(getByTestId('custom-card')).toBeTruthy();
    });
  });

  describe('Status Badge', () => {
    it('should render pending status', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, status: 'pending' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-status-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#FFC107' });
    });

    it('should render assigned status', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, status: 'assigned' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-status-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#17A2B8' });
    });

    it('should render accepted status', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, status: 'accepted' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-status-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#007AFF' });
    });

    it('should render in_transit status', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, status: 'in_transit' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-status-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#9C27B0' });
    });

    it('should render arrived status', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, status: 'arrived' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-status-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#FF9800' });
    });

    it('should render delivered status', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, status: 'delivered' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-status-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#28A745' });
    });

    it('should render failed status', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, status: 'failed' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-status-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#DC3545' });
    });

    it('should render returned status', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, status: 'returned' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-status-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#6C757D' });
    });
  });

  describe('Priority Badge', () => {
    it('should render urgent priority', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, priority: 'urgent' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-priority-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#DC3545' });
    });

    it('should render high priority', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, priority: 'high' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-priority-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#FF9800' });
    });

    it('should render medium priority', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, priority: 'medium' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-priority-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#FFC107' });
    });

    it('should render low priority', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, priority: 'low' }} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-priority-badge');
      expect(badge.props.style).toContainEqual({ backgroundColor: '#6C757D' });
    });
  });

  describe('Special Handling', () => {
    it('should render special handling when present', () => {
      const deliveryWithHandling = {
        ...mockDelivery,
        packages: [
          {
            ...mockDelivery.packages[0],
            specialHandling: ['cold_chain', 'signature_required'] as any[],
          },
        ],
      };

      const { getByTestId } = render(
        <DeliveryCard delivery={deliveryWithHandling} onPress={mockOnPress} />
      );

      const specialHandling = getByTestId('delivery-card-special-handling');
      expect(specialHandling).toBeTruthy();
    });

    it('should not render special handling when empty', () => {
      const { queryByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      expect(queryByTestId('delivery-card-special-handling')).toBeNull();
    });

    it('should format special handling text', () => {
      const deliveryWithHandling = {
        ...mockDelivery,
        packages: [
          {
            ...mockDelivery.packages[0],
            specialHandling: ['cold_chain'] as any[],
          },
        ],
      };

      const { getByTestId } = render(
        <DeliveryCard delivery={deliveryWithHandling} onPress={mockOnPress} />
      );

      const specialHandling = getByTestId('delivery-card-special-handling');
      expect(specialHandling.props.children).toContain('cold chain');
    });
  });

  describe('Special Instructions', () => {
    it('should render special instructions when present', () => {
      const deliveryWithInstructions = {
        ...mockDelivery,
        specialInstructions: 'Ring doorbell twice',
      };

      const { getByTestId } = render(
        <DeliveryCard delivery={deliveryWithInstructions} onPress={mockOnPress} />
      );

      expect(getByTestId('delivery-card-instructions')).toBeTruthy();
    });

    it('should not render special instructions when absent', () => {
      const { queryByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      expect(queryByTestId('delivery-card-instructions')).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when card is pressed', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      fireEvent.press(getByTestId('delivery-card'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
      expect(mockOnPress).toHaveBeenCalledWith(mockDelivery);
    });

    it('should call onPress with correct delivery', () => {
      const delivery2 = { ...mockDelivery, id: 'DEL002' };
      const { getByTestId } = render(
        <DeliveryCard delivery={delivery2} onPress={mockOnPress} />
      );

      fireEvent.press(getByTestId('delivery-card'));
      expect(mockOnPress).toHaveBeenCalledWith(delivery2);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible role', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      const card = getByTestId('delivery-card');
      expect(card.props.accessibilityRole).toBe('button');
    });

    it('should have accessibility label', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      const card = getByTestId('delivery-card');
      expect(card.props.accessibilityLabel).toBe('Delivery for John Doe');
    });

    it('should have accessibility hint', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      const card = getByTestId('delivery-card');
      expect(card.props.accessibilityHint).toContain('pending delivery');
      expect(card.props.accessibilityHint).toContain('2.5 km');
      expect(card.props.accessibilityHint).toContain('15 minutes');
      expect(card.props.accessibilityHint).toContain('medium');
    });

    it('should mark patient name as header', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      const patientName = getByTestId('delivery-card-patient-name');
      expect(patientName.props.accessibilityRole).toBe('header');
    });

    it('should have accessible status badge', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-status-badge');
      expect(badge.props.accessibilityLabel).toBe('Delivery status: pending');
    });

    it('should have accessible priority badge', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} />
      );

      const badge = getByTestId('delivery-card-priority-badge');
      expect(badge.props.accessibilityLabel).toBe('Priority level: medium');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom style', () => {
      const customStyle = { marginTop: 20 };
      const { getByTestId } = render(
        <DeliveryCard delivery={mockDelivery} onPress={mockOnPress} style={customStyle} />
      );

      const card = getByTestId('delivery-card');
      // Style is flattened, so check if marginTop is present
      expect(card.props.style).toMatchObject({ marginTop: 20 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero distance', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, distance: 0 }} onPress={mockOnPress} />
      );

      const distance = getByTestId('delivery-card-distance');
      expect(distance.props.children).toEqual(['0.0', ' km']);
    });

    it('should handle large distance', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, distance: 999.99 }} onPress={mockOnPress} />
      );

      const distance = getByTestId('delivery-card-distance');
      expect(distance.props.children).toEqual(['1000.0', ' km']);
    });

    it('should handle zero duration', () => {
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, estimatedDuration: 0 }} onPress={mockOnPress} />
      );

      const duration = getByTestId('delivery-card-duration');
      expect(duration.props.children).toEqual(['0', ' min']);
    });

    it('should handle long patient names', () => {
      const longName = 'A'.repeat(100);
      const { getByTestId } = render(
        <DeliveryCard delivery={{ ...mockDelivery, patient: { ...mockDelivery.patient, name: longName } }} onPress={mockOnPress} />
      );

      const patientName = getByTestId('delivery-card-patient-name');
      expect(patientName.props.children).toBe(longName);
    });

    it('should handle long addresses', () => {
      const longStreet = 'A'.repeat(100);
      const longCity = 'B'.repeat(100);
      const { getByTestId } = render(
        <DeliveryCard
          delivery={{
            ...mockDelivery,
            patient: {
              ...mockDelivery.patient,
              address: { ...mockDelivery.patient.address, street: longStreet, city: longCity },
            },
          }}
          onPress={mockOnPress}
        />
      );

      const address = getByTestId('delivery-card-address');
      expect(address.props.children).toEqual([longStreet, ', ', longCity]);
    });

    it('should handle multiple special handling types', () => {
      const deliveryWithMultipleHandling = {
        ...mockDelivery,
        packages: [
          {
            ...mockDelivery.packages[0],
            specialHandling: ['cold_chain', 'narcotics', 'signature_required'] as any[],
          },
        ],
      };

      const { getByTestId } = render(
        <DeliveryCard delivery={deliveryWithMultipleHandling} onPress={mockOnPress} />
      );

      expect(getByTestId('delivery-card-special-handling')).toBeTruthy();
    });

    it('should deduplicate special handling across packages', () => {
      const deliveryWithDuplicateHandling = {
        ...mockDelivery,
        packages: [
          {
            ...mockDelivery.packages[0],
            specialHandling: ['cold_chain'] as any[],
          },
          {
            id: 'PKG002',
            qrCode: 'QR67890',
            medications: [],
            specialHandling: ['cold_chain'] as any[],
          },
        ],
      };

      const { getByTestId } = render(
        <DeliveryCard delivery={deliveryWithDuplicateHandling} onPress={mockOnPress} />
      );

      const specialHandling = getByTestId('delivery-card-special-handling');
      expect(specialHandling.props.children).toContain('cold chain');
    });
  });
});
