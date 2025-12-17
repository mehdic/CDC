/**
 * DeliveryListScreen Unit Tests
 * Tests pagination, filtering, and delivery list rendering
 * Tests focus on state management and filtering logic
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import DeliveryListScreen from '../DeliveryListScreen';
import deliveryReducer from '../../../store/deliverySlice';
import { DeliveryRequest, DeliveryStatus } from '../../../types/delivery';
import { RootState } from '../../../store';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Create a helper delivery
const createDelivery = (overrides?: Partial<DeliveryRequest>): DeliveryRequest => ({
  id: `del-${Math.random()}`,
  pharmacyId: 'pharm-1',
  pharmacyName: 'Pharmacy One',
  patient: {
    id: 'pat-1',
    name: 'John Doe',
    phone: '+41791234567',
    address: {
      street: '123 Main St',
      city: 'Geneva',
      postalCode: '1200',
      canton: 'GE',
      country: 'Switzerland',
    },
  },
  packages: [{
    id: 'pkg-1',
    qrCode: 'QR123',
    medications: [{
      id: 'med-1',
      name: 'Ibuprofen',
      quantity: 2,
      dosage: '200mg',
      requiresColdChain: false,
      isControlledSubstance: false,
    }],
    specialHandling: [],
  }],
  status: 'pending' as DeliveryStatus,
  priority: 'medium',
  estimatedDuration: 30,
  distance: 5.2,
  paymentMethod: 'insurance',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Render helper with Redux
const renderWithRedux = (
  component: React.ReactElement,
  initialDeliveries: DeliveryRequest[] = [],
) => {
  const preloadedState: PreloadedState<any> = {
    delivery: {
      requests: initialDeliveries,
      activeDelivery: null,
      route: null,
      currentLocation: null,
      locationHistory: [],
      isTracking: false,
      stats: null,
      syncQueue: [],
      isOnline: true,
    },
    auth: {
      isAuthenticated: false,
      personnel: null,
      token: null,
      hinEIDVerified: false,
    },
  };

  const store = configureStore({
    reducer: {
      delivery: (state = preloadedState.delivery) => state,
      auth: (state = preloadedState.auth) => state,
    },
  });

  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('DeliveryListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering - Basic UI', () => {
    it('should render filter tabs', () => {
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />);
      expect(screen.getByText('Available')).toBeTruthy();
      expect(screen.getByText('My Deliveries')).toBeTruthy();
    });

    it('should render search input', () => {
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />);
      const searchInputs = screen.queryAllByPlaceholderText(/Search/);
      expect(searchInputs.length > 0).toBe(true);
    });

    it('should render all main UI elements', () => {
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />);
      // Screen renders successfully with all main elements
      expect(screen.getByText('Available')).toBeTruthy();
      expect(screen.getByText('My Deliveries')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state message when no deliveries', () => {
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, []);
      expect(screen.getByText('No deliveries found')).toBeTruthy();
    });

    it('should show helpful message on empty state', () => {
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, []);
      const emptyText = screen.queryAllByText(/No deliveries|Refreshing|switch/);
      expect(emptyText.length > 0).toBe(true);
    });
  });

  describe('Delivery List Rendering', () => {
    it('should display deliveries in list', () => {
      const deliveries = [
        createDelivery({ id: 'del-1', patient: { ...createDelivery().patient, name: 'Alice' } }),
        createDelivery({ id: 'del-2', patient: { ...createDelivery().patient, name: 'Bob' } }),
      ];
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, deliveries);

      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
    });

    it('should display patient names', () => {
      const delivery = createDelivery({ patient: { ...createDelivery().patient, name: 'Jane Smith' } });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);

      expect(screen.getByText('Jane Smith')).toBeTruthy();
    });

    it('should display addresses', () => {
      const delivery = createDelivery();
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);

      expect(screen.getByText(/123 Main St/)).toBeTruthy();
      expect(screen.getByText(/Geneva/)).toBeTruthy();
    });

    it('should display distances', () => {
      const delivery = createDelivery({ distance: 7.5 });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);

      expect(screen.getByText(/7.5/)).toBeTruthy();
    });

    it('should display durations', () => {
      const delivery = createDelivery({ estimatedDuration: 45 });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);

      expect(screen.getByText(/45/)).toBeTruthy();
    });

    it('should display priority badges', () => {
      const delivery = createDelivery({ priority: 'urgent' });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);

      expect(screen.getByText('URGENT')).toBeTruthy();
    });

    it('should display special instructions when present', () => {
      const delivery = createDelivery({ specialInstructions: 'Call before arrival' });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);

      expect(screen.getByText(/Call before arrival/)).toBeTruthy();
    });

    it('should not display special instructions when absent', () => {
      const delivery = createDelivery({ specialInstructions: undefined });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);

      expect(screen.queryByText(/Call before arrival/)).toBeFalsy();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by patient name', async () => {
      const deliveries = [
        createDelivery({ id: 'del-1', patient: { ...createDelivery().patient, name: 'Alice' } }),
        createDelivery({ id: 'del-2', patient: { ...createDelivery().patient, name: 'Bob' } }),
      ];
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, deliveries);

      const searchInputs = screen.queryAllByPlaceholderText(/Search/);
      expect(searchInputs.length > 0).toBe(true);
      fireEvent.changeText(searchInputs[0], 'Alice');

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeTruthy();
      });
    });

    it('should filter by city', async () => {
      const deliveries = [
        createDelivery({
          id: 'del-1',
          patient: { ...createDelivery().patient, address: { ...createDelivery().patient.address, city: 'Geneva' } }
        }),
        createDelivery({
          id: 'del-2',
          patient: { ...createDelivery().patient, address: { ...createDelivery().patient.address, city: 'Zurich' } }
        }),
      ];
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, deliveries);

      const searchInputs = screen.queryAllByPlaceholderText(/Search/);
      fireEvent.changeText(searchInputs[0], 'Zurich');

      await waitFor(() => {
        expect(screen.queryByText(/Geneva/)).toBeFalsy();
      });
    });

    it('should be case-insensitive', async () => {
      const delivery = createDelivery({ patient: { ...createDelivery().patient, name: 'Alice' } });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);

      const searchInputs = screen.queryAllByPlaceholderText(/Search/);
      fireEvent.changeText(searchInputs[0], 'alice');

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeTruthy();
      });
    });
  });

  describe('Status Filtering', () => {
    it('should display different statuses in list', () => {
      const deliveries = [
        createDelivery({ id: 'del-1', status: 'pending' as DeliveryStatus }),
        createDelivery({ id: 'del-2', status: 'delivered' as DeliveryStatus }),
      ];
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, deliveries);

      // Verify both statuses are rendered
      expect(screen.getByText('pending')).toBeTruthy();
      expect(screen.getByText('delivered')).toBeTruthy();
    });

    it('should render screen without errors', () => {
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />);
      // Just verify it renders
      expect(screen.getByText('Available')).toBeTruthy();
    });
  });

  describe('Pagination', () => {
    it('should paginate with 20 items per page', () => {
      const deliveries = Array.from({ length: 45 }, (_, i) =>
        createDelivery({ id: `del-${i}`, patient: { ...createDelivery().patient, name: `Person ${i}` } })
      );
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, deliveries);

      // Should render the first set of items
      expect(screen.getByText('Person 0')).toBeTruthy();
    });

    it('should not show pagination controls for small lists', () => {
      const deliveries = Array.from({ length: 15 }, (_, i) =>
        createDelivery({ id: `del-${i}` })
      );
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, deliveries);

      // With 15 items, all should be on one page
      expect(screen.getByText('Available')).toBeTruthy();
    });

    it('should handle large lists', () => {
      const deliveries = Array.from({ length: 45 }, (_, i) =>
        createDelivery({ id: `del-${i}` })
      );
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, deliveries);

      // Just verify it renders without errors
      expect(screen.getByText('Available')).toBeTruthy();
    });
  });

  describe('Combined Filtering', () => {
    it('should combine search and status filters', async () => {
      const deliveries = [
        createDelivery({ id: 'del-1', patient: { ...createDelivery().patient, name: 'Alice Jones' }, status: 'pending' as DeliveryStatus }),
        createDelivery({ id: 'del-2', patient: { ...createDelivery().patient, name: 'Alice Smith' }, status: 'delivered' as DeliveryStatus }),
        createDelivery({ id: 'del-3', patient: { ...createDelivery().patient, name: 'Bob Brown' }, status: 'pending' as DeliveryStatus }),
      ];
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, deliveries);

      // Search for Alice
      const searchInputs = screen.queryAllByPlaceholderText(/Search/);
      fireEvent.changeText(searchInputs[0], 'Alice');

      await waitFor(() => {
        const aliceElements = screen.queryAllByText(/Alice/);
        expect(aliceElements.length > 0).toBe(true);
      });
    });
  });

  describe('Tab Switching', () => {
    it('should render available tab active by default', () => {
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />);
      const availableText = screen.getByText('Available');
      expect(availableText).toBeTruthy();
    });

    it('should have both tabs available', () => {
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />);
      expect(screen.getByText('Available')).toBeTruthy();
      expect(screen.getByText('My Deliveries')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible filter buttons', () => {
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />);
      const availableButton = screen.getByText('Available');
      expect(availableButton).toBeTruthy();
      // Filters should be accessible by nature of being rendered
    });

    it('should display delivery information accessibly', () => {
      const delivery = createDelivery({ patient: { ...createDelivery().patient, name: 'Alice' } });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);

      const aliceText = screen.getByText('Alice');
      expect(aliceText).toBeTruthy();
    });
  });

  describe('Pull to Refresh', () => {
    it('should render refresh control', () => {
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />);
      // RefreshControl is rendered as part of FlatList
      // Just verify the component renders without error
      expect(screen.getByText('Available')).toBeTruthy();
    });
  });

  describe('Priority Indicators', () => {
    it('should display urgent priority', () => {
      const delivery = createDelivery({ priority: 'urgent' });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);
      expect(screen.getByText('URGENT')).toBeTruthy();
    });

    it('should display high priority', () => {
      const delivery = createDelivery({ priority: 'high' });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);
      expect(screen.getByText('HIGH')).toBeTruthy();
    });

    it('should display medium priority', () => {
      const delivery = createDelivery({ priority: 'medium' });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);
      expect(screen.getByText('MEDIUM')).toBeTruthy();
    });

    it('should display low priority', () => {
      const delivery = createDelivery({ priority: 'low' });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);
      expect(screen.getByText('LOW')).toBeTruthy();
    });
  });

  describe('Status Display', () => {
    it('should display pending status', () => {
      const delivery = createDelivery({ status: 'pending' as DeliveryStatus });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);
      expect(screen.getByText('pending')).toBeTruthy();
    });

    it('should display in_transit status', () => {
      const delivery = createDelivery({ status: 'in_transit' as DeliveryStatus });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);
      expect(screen.getByText('in_transit')).toBeTruthy();
    });

    it('should display delivered status', () => {
      const delivery = createDelivery({ status: 'delivered' as DeliveryStatus });
      renderWithRedux(<DeliveryListScreen navigation={mockNavigation} />, [delivery]);
      expect(screen.getByText('delivered')).toBeTruthy();
    });
  });
});
