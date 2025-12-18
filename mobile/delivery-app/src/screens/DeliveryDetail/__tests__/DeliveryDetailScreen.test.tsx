/**
 * DeliveryDetailScreen Unit Tests
 * Tests delivery detail display, acceptance, and special handling indicators
 */

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';

import deliveryReducer from '../../../store/deliverySlice';
import { DeliveryRequest, DeliveryStatus } from '../../../types/delivery';
import DeliveryDetailScreen from '../DeliveryDetailScreen';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

const mockRoute = {
  params: {
    deliveryId: 'delivery-1',
  },
};

// Mock delivery slice actions
jest.mock('../../../store/deliverySlice', () => ({
  ...jest.requireActual('../../../store/deliverySlice'),
  acceptDeliveryAsync: jest.fn(() => ({ type: 'delivery/accept/fulfilled', payload: {} })),
}));

// Helper to create mock delivery
const createMockDelivery = (overrides?: Partial<DeliveryRequest>): DeliveryRequest => ({
  id: 'delivery-1',
  pharmacyId: 'pharmacy-1',
  pharmacyName: 'Central Pharmacy',
  patient: {
    id: 'patient-1',
    name: 'John Doe',
    phone: '+41791234567',
    address: {
      street: '123 Main St',
      city: 'Geneva',
      postalCode: '1200',
      canton: 'GE',
      country: 'Switzerland',
    },
    availabilityWindow: {
      start: new Date('2025-12-17T14:00:00').toISOString(),
      end: new Date('2025-12-17T16:00:00').toISOString(),
    },
  },
  packages: [
    {
      id: 'pkg-1',
      qrCode: 'QR123456789',
      medications: [
        {
          id: 'med-1',
          name: 'Ibuprofen',
          quantity: 2,
          dosage: '200mg',
          requiresColdChain: false,
          isControlledSubstance: false,
        },
      ],
      specialHandling: [],
    },
  ],
  status: 'pending' as DeliveryStatus,
  priority: 'high',
  estimatedDuration: 30,
  distance: 5.2,
  paymentMethod: 'insurance',
  specialInstructions: 'Please call before arrival',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Helper to render with Redux
const renderWithRedux = (
  component: React.ReactElement,
  deliveries: DeliveryRequest[] = []
) => {
  const store = configureStore({
    reducer: {
      delivery: (state = {
        requests: deliveries,
        activeDelivery: null,
        route: null,
        currentLocation: null,
        locationHistory: [],
        isTracking: false,
        stats: null,
        syncQueue: [],
        isOnline: true,
      }, action) => state,
      auth: (state = { isAuthenticated: false, personnel: null, token: null, hinEIDVerified: false }, action) => state,
    },
  });

  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('DeliveryDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Display - Delivery Not Found', () => {
    it('should display error message when delivery not found', () => {
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        []
      );

      expect(screen.getByText('Delivery not found')).toBeTruthy();
    });
  });

  describe('Display - Patient Information', () => {
    it('should display patient information section', () => {
      const delivery = createMockDelivery();
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('Patient Information')).toBeTruthy();
      expect(screen.getByText(delivery.patient.name)).toBeTruthy();
    });

    it('should display patient phone number', () => {
      const delivery = createMockDelivery();
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText(delivery.patient.phone)).toBeTruthy();
    });

    it('should display complete patient address with all components', () => {
      const delivery = createMockDelivery();
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      const address = delivery.patient.address;
      expect(screen.getByText(new RegExp(address.street))).toBeTruthy();
      expect(screen.getByText(new RegExp(address.city))).toBeTruthy();
      expect(screen.getByText(new RegExp(address.canton))).toBeTruthy();
    });

    it('should display patient availability window when present', () => {
      const delivery = createMockDelivery();
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText(/Available:/)).toBeTruthy();
    });

    it('should not display availability when not present', () => {
      const delivery = createMockDelivery({
        patient: {
          ...createMockDelivery().patient,
          availabilityWindow: undefined,
        },
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.queryByText(/Available:/)).toBeFalsy();
    });
  });

  describe('Display - Delivery Information', () => {
    it('should display delivery information section', () => {
      const delivery = createMockDelivery();
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('Delivery Information')).toBeTruthy();
    });

    it('should display distance', () => {
      const delivery = createMockDelivery({ distance: 5.2 });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('5.20 km')).toBeTruthy();
    });

    it('should display estimated duration', () => {
      const delivery = createMockDelivery({ estimatedDuration: 25 });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('25 min')).toBeTruthy();
    });

    it('should display payment method', () => {
      const delivery = createMockDelivery({ paymentMethod: 'insurance' });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('insurance')).toBeTruthy();
    });

    it('should display priority level', () => {
      const delivery = createMockDelivery({ priority: 'urgent' });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('URGENT')).toBeTruthy();
    });
  });

  describe('Display - Package Information', () => {
    it('should display package section', () => {
      const delivery = createMockDelivery();
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText(/Package 1/)).toBeTruthy();
    });

    it('should display QR code', () => {
      const delivery = createMockDelivery({
        packages: [{
          ...createMockDelivery().packages[0],
          qrCode: 'QR123456789',
        }],
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText(/QR123456789/)).toBeTruthy();
    });

    it('should display multiple packages', () => {
      const delivery = createMockDelivery({
        packages: [
          createMockDelivery().packages[0],
          {
            ...createMockDelivery().packages[0],
            id: 'pkg-2',
            qrCode: 'QR987654321',
          },
        ],
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText(/Package 1/)).toBeTruthy();
      expect(screen.getByText(/Package 2/)).toBeTruthy();
    });
  });

  describe('Display - Medications', () => {
    it('should display medication section', () => {
      const delivery = createMockDelivery();
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('Medications:')).toBeTruthy();
    });

    it('should display medication name', () => {
      const delivery = createMockDelivery({
        packages: [{
          ...createMockDelivery().packages[0],
          medications: [
            {
              id: 'med-1',
              name: 'Ibuprofen 200mg',
              quantity: 2,
              dosage: '200mg',
              requiresColdChain: false,
              isControlledSubstance: false,
            },
          ],
        }],
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('Ibuprofen 200mg')).toBeTruthy();
    });

    it('should display medication quantity and dosage', () => {
      const delivery = createMockDelivery({
        packages: [{
          ...createMockDelivery().packages[0],
          medications: [
            {
              id: 'med-1',
              name: 'Aspirin',
              quantity: 10,
              dosage: '500mg',
              requiresColdChain: false,
              isControlledSubstance: false,
            },
          ],
        }],
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText(/10x - 500mg/)).toBeTruthy();
    });

    it('should show controlled substance warning', () => {
      const delivery = createMockDelivery({
        packages: [{
          ...createMockDelivery().packages[0],
          medications: [
            {
              id: 'med-1',
              name: 'Morphine',
              quantity: 1,
              dosage: '10mg',
              requiresColdChain: false,
              isControlledSubstance: true,
            },
          ],
        }],
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText(/Controlled Substance/)).toBeTruthy();
    });

    it('should show cold chain warning', () => {
      const delivery = createMockDelivery({
        packages: [{
          ...createMockDelivery().packages[0],
          medications: [
            {
              id: 'med-1',
              name: 'Insulin',
              quantity: 1,
              dosage: '100 IU',
              requiresColdChain: true,
              isControlledSubstance: false,
            },
          ],
        }],
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText(/Requires Cold Chain/)).toBeTruthy();
    });
  });

  describe('Display - Special Handling', () => {
    it('should display special handling badge', () => {
      const delivery = createMockDelivery({
        packages: [{
          ...createMockDelivery().packages[0],
          specialHandling: ['cold_chain'],
        }],
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText(/cold chain/)).toBeTruthy();
    });

    it('should display multiple special handling requirements', () => {
      const delivery = createMockDelivery({
        packages: [{
          ...createMockDelivery().packages[0],
          specialHandling: ['cold_chain', 'narcotics', 'signature_required'],
        }],
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText(/cold chain/)).toBeTruthy();
      expect(screen.getByText(/narcotics/)).toBeTruthy();
      expect(screen.getByText(/signature required/)).toBeTruthy();
    });

    it('should not display special handling section when empty', () => {
      const delivery = createMockDelivery({
        packages: [{
          ...createMockDelivery().packages[0],
          specialHandling: [],
        }],
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      // Special handling section should not exist if array is empty
      const specialHandlingText = screen.queryAllByText(/cold chain|narcotics|signature/);
      expect(specialHandlingText.length).toBe(0);
    });
  });

  describe('Display - Special Instructions', () => {
    it('should display special instructions when present', () => {
      const delivery = createMockDelivery({
        specialInstructions: 'Call before arrival, use side entrance',
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('Special Instructions')).toBeTruthy();
      expect(screen.getByText('Call before arrival, use side entrance')).toBeTruthy();
    });

    it('should not display special instructions section when not present', () => {
      const delivery = createMockDelivery({
        specialInstructions: undefined,
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.queryByText('Special Instructions')).toBeFalsy();
    });
  });

  describe('Actions - Accept Delivery', () => {
    it('should show accept button for pending delivery', () => {
      const delivery = createMockDelivery({ status: 'pending' as DeliveryStatus });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('Accept Delivery')).toBeTruthy();
    });

    it('should show accept button for assigned delivery', () => {
      const delivery = createMockDelivery({ status: 'assigned' as DeliveryStatus });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('Accept Delivery')).toBeTruthy();
    });

    it('should not show accept button for accepted delivery', () => {
      const delivery = createMockDelivery({ status: 'accepted' as DeliveryStatus });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.queryByText('Accept Delivery')).toBeFalsy();
    });

    it('should not show accept button for delivered delivery', () => {
      const delivery = createMockDelivery({ status: 'delivered' as DeliveryStatus });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.queryByText('Accept Delivery')).toBeFalsy();
    });

    it('should show view on map button for accepted delivery', () => {
      const delivery = createMockDelivery({ status: 'accepted' as DeliveryStatus });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('View on Map')).toBeTruthy();
    });

    it('should show view on map button for in_transit delivery', () => {
      const delivery = createMockDelivery({ status: 'in_transit' as DeliveryStatus });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('View on Map')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const delivery = createMockDelivery();
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      // Check for accessibility attributes on key elements
      const phoneElement = screen.getByText(delivery.patient.phone);
      expect(phoneElement.props.accessibilityLabel).toBeTruthy();
    });

    it('should have proper section headers with accessibility roles', () => {
      const delivery = createMockDelivery();
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      const patientInfoHeader = screen.getByText('Patient Information');
      expect(patientInfoHeader.props.accessibilityRole).toBe('header');
    });
  });

  describe('Component Structure', () => {
    it('should render as scrollable view', () => {
      const delivery = createMockDelivery();
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      // Check that all sections are rendered
      expect(screen.getByText('Patient Information')).toBeTruthy();
      expect(screen.getByText('Delivery Information')).toBeTruthy();
      expect(screen.getByText(/Package 1/)).toBeTruthy();
    });

    it('should display all required information for a complex delivery', () => {
      const delivery = createMockDelivery({
        packages: [
          {
            id: 'pkg-1',
            qrCode: 'QR111',
            medications: [
              {
                id: 'med-1',
                name: 'Insulin',
                quantity: 1,
                dosage: '100 IU',
                requiresColdChain: true,
                isControlledSubstance: false,
              },
              {
                id: 'med-2',
                name: 'Morphine',
                quantity: 1,
                dosage: '10mg',
                requiresColdChain: false,
                isControlledSubstance: true,
              },
            ],
            specialHandling: ['cold_chain', 'narcotics', 'signature_required'],
          },
        ],
        specialInstructions: 'Requires ID verification',
      });
      renderWithRedux(
        <DeliveryDetailScreen navigation={mockNavigation} route={mockRoute} />,
        [delivery]
      );

      expect(screen.getByText('Insulin')).toBeTruthy();
      expect(screen.getByText('Morphine')).toBeTruthy();
      expect(screen.getByText(/Requires Cold Chain/)).toBeTruthy();
      expect(screen.getByText(/Controlled Substance/)).toBeTruthy();
      expect(screen.getByText('Requires ID verification')).toBeTruthy();
    });
  });
});
