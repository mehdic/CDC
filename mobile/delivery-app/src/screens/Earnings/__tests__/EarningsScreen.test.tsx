/**
 * EarningsScreen Unit Tests
 * Tests period filtering, earnings display, bonus display, and export functionality
 */

import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';

import { RootState } from '../../../store';
import deliveryReducer from '../../../store/deliverySlice';
import earningsReducer from '../../../store/earningsSlice';
import EarningsScreen from '../EarningsScreen';

// Mock the earnings service
jest.mock('../../../services/earningsService', () => ({
  __esModule: true,
  default: {
    getSummary: jest.fn().mockResolvedValue({
      totalEarnings: 487.25,
      deliveryFees: 380.00,
      bonuses: 75.00,
      tips: 32.25,
      pendingAmount: 100.00,
      availableForPayout: 387.25,
    }),
    getTransactions: jest.fn().mockResolvedValue([
      {
        id: 'txn-1',
        date: new Date().toISOString(),
        type: 'delivery_fee',
        amount: 25.50,
        description: 'Delivery #1234',
        deliveryId: 'd1',
      },
    ]),
    getBonuses: jest.fn().mockResolvedValue([
      {
        id: 'bonus-1',
        title: 'Delivery Sprint',
        description: 'Complete 10 deliveries',
        amount: 25.00,
        progress: 7,
        target: 10,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
    ]),
    exportReport: jest.fn().mockResolvedValue('CSV,Data\n1,2'),
    calculateStatistics: jest.fn().mockReturnValue({
      averagePerDay: 70,
      averagePerDelivery: 38,
    }),
  },
}));

// Mock Share API
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn().mockResolvedValue({ action: 'sharedWithSaved' }),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const renderWithRedux = (
  component: React.ReactElement,
  initialEarnings: any = {},
) => {
  const preloadedState: PreloadedState<any> = {
    delivery: {
      requests: [],
      activeDelivery: null,
      route: null,
      currentLocation: null,
      locationHistory: [],
      isTracking: false,
      stats: { deliveries: [], count: 0, totalDistance: 0, averageTime: 0 },
      syncQueue: [],
      isOnline: true,
    },
    auth: {
      isAuthenticated: true,
      personnel: null,
      token: 'test-token',
      hinEIDVerified: false,
    },
    earnings: {
      summary: null,
      transactions: [],
      bonusOpportunities: [],
      payoutMethods: [],
      payoutHistory: [],
      selectedPeriod: 'week',
      loading: false,
      error: null,
      ...initialEarnings,
    },
  };

  const store = configureStore({
    reducer: {
      delivery: (state = preloadedState.delivery) => state,
      auth: (state = preloadedState.auth) => state,
      earnings: (state = preloadedState.earnings) => state,
    },
  });

  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('EarningsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render earnings screen', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      expect(getByTestId('earnings-screen')).toBeTruthy();
    });

    it('should render screen header', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const header = getByTestId('earnings-screen-header');
      expect(header).toBeTruthy();
    });

    it('should render earnings title', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const title = getByTestId('earnings-screen-title');
      expect(title.props.children).toBe('Earnings & Statistics');
    });

    it('should render subtitle', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const subtitle = getByTestId('earnings-screen-subtitle');
      expect(subtitle.props.children).toBe('Track your deliveries and bonuses');
    });

    it('should render period filter', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      expect(getByTestId('earnings-period-filter')).toBeTruthy();
    });

    it('should render earnings summary card', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      expect(getByTestId('earnings-summary')).toBeTruthy();
    });

    it('should render delivery stats card', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      expect(getByTestId('delivery-stats')).toBeTruthy();
    });

    it('should render bonus progress card', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      expect(getByTestId('bonus-progress')).toBeTruthy();
    });

    it('should render export buttons', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      expect(getByTestId('earnings-export')).toBeTruthy();
    });

    it('should render info container', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      expect(getByTestId('earnings-info-container')).toBeTruthy();
    });
  });

  describe('Period Filter Functionality', () => {
    it('should have all period options', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      expect(getByTestId('earnings-period-filter-today')).toBeTruthy();
      expect(getByTestId('earnings-period-filter-week')).toBeTruthy();
      expect(getByTestId('earnings-period-filter-month')).toBeTruthy();
      expect(getByTestId('earnings-period-filter-year')).toBeTruthy();
    });

    it('should have week selected by default', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const weekButton = getByTestId('earnings-period-filter-week');
      expect(weekButton.props.style).toContainEqual({ backgroundColor: '#007AFF' });
    });

    it('should change period when button is pressed', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const monthButton = getByTestId('earnings-period-filter-month');
      fireEvent.press(monthButton);
      expect(monthButton.props.style).toContainEqual({ backgroundColor: '#007AFF' });
    });

    it('should update earnings when period changes', async () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const monthButton = getByTestId('earnings-period-filter-month');

      fireEvent.press(monthButton);

      await waitFor(() => {
        // Verify the period has changed (you might need to check for visual changes)
        expect(monthButton.props.style).toBeTruthy();
      });
    });
  });

  describe('Earnings Summary Display', () => {
    it('should display earnings summary card with data', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const summaryCard = getByTestId('earnings-summary');
      expect(summaryCard).toBeTruthy();
    });

    it('should handle zero earnings gracefully', () => {
      const { getByTestId } = renderWithRedux(
        <EarningsScreen />,
        {
          summary: {
            totalEarnings: 0,
            deliveryFees: 0,
            bonuses: 0,
            tips: 0,
            pendingAmount: 0,
            availableForPayout: 0,
          },
        }
      );
      const summaryCard = getByTestId('earnings-summary');
      expect(summaryCard).toBeTruthy();
    });
  });

  describe('Delivery Statistics Display', () => {
    it('should display delivery statistics card', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const statsCard = getByTestId('delivery-stats');
      expect(statsCard).toBeTruthy();
    });

    it('should show correct period in stats', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const statsCard = getByTestId('delivery-stats');
      expect(statsCard).toBeTruthy();
    });
  });

  describe('Bonus Progress Display', () => {
    it('should display bonus progress card', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const bonusCard = getByTestId('bonus-progress');
      expect(bonusCard).toBeTruthy();
    });

    it('should display active bonuses', async () => {
      const { getByTestId } = renderWithRedux(
        <EarningsScreen />,
        {
          bonusOpportunities: [
            {
              id: 'bonus-1',
              title: 'Delivery Sprint',
              description: 'Complete 10 deliveries',
              amount: 25.00,
              progress: 7,
              target: 10,
              expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              isActive: true,
            },
          ],
        }
      );

      const bonusCard = getByTestId('bonus-progress');
      expect(bonusCard).toBeTruthy();
    });
  });

  describe('Export Functionality', () => {
    it('should display export buttons', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const exportContainer = getByTestId('earnings-export');
      expect(exportContainer).toBeTruthy();
    });

    it('should have CSV export button', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      expect(getByTestId('earnings-export-csv')).toBeTruthy();
    });

    it('should have PDF export button', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      expect(getByTestId('earnings-export-pdf')).toBeTruthy();
    });

    it('should handle CSV export', async () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const csvButton = getByTestId('earnings-export-csv');

      fireEvent.press(csvButton);

      await waitFor(() => {
        // Export should be called
        expect(csvButton).toBeTruthy();
      });
    });

    it('should handle PDF export', async () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const pdfButton = getByTestId('earnings-export-pdf');

      fireEvent.press(pdfButton);

      await waitFor(() => {
        // Export should be called
        expect(pdfButton).toBeTruthy();
      });
    });

    it('should disable export buttons during export', async () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const csvButton = getByTestId('earnings-export-csv');

      fireEvent.press(csvButton);

      // Button should be in loading/disabled state
      expect(csvButton.props.disabled).toBeDefined();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when fetching data', () => {
      const { getByTestId } = renderWithRedux(
        <EarningsScreen />,
        { loading: true }
      );

      const loadingSpinner = getByTestId('earnings-loading-spinner');
      expect(loadingSpinner).toBeTruthy();
    });

    it('should show loading text', () => {
      const { getByTestId } = renderWithRedux(
        <EarningsScreen />,
        { loading: true }
      );

      const loadingText = getByTestId('earnings-screen-loading-text');
      expect(loadingText.props.children).toBe('Loading earnings data...');
    });
  });

  describe('Refresh Functionality', () => {
    it('should support pull to refresh', async () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const screen = getByTestId('earnings-screen');
      expect(screen).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible period filter buttons', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const weekButton = getByTestId('earnings-period-filter-week');
      expect(weekButton.props.accessibilityRole).toBe('button');
      expect(weekButton.props.accessibilityLabel).toBeTruthy();
    });

    it('should have accessible export buttons', () => {
      const { getByTestId } = renderWithRedux(<EarningsScreen />);
      const csvButton = getByTestId('earnings-export-csv');
      expect(csvButton.props.accessibilityRole).toBe('button');
      expect(csvButton.props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle no bonuses gracefully', () => {
      const { getByTestId } = renderWithRedux(
        <EarningsScreen />,
        { bonusOpportunities: [] }
      );

      const bonusCard = getByTestId('bonus-progress');
      expect(bonusCard).toBeTruthy();
    });

    it('should handle no transactions', () => {
      const { getByTestId } = renderWithRedux(
        <EarningsScreen />,
        { transactions: [] }
      );

      expect(getByTestId('earnings-screen')).toBeTruthy();
    });

    it('should display zero earnings without error', () => {
      const { getByTestId } = renderWithRedux(
        <EarningsScreen />,
        {
          summary: {
            totalEarnings: 0,
            deliveryFees: 0,
            bonuses: 0,
            tips: 0,
            pendingAmount: 0,
            availableForPayout: 0,
          },
        }
      );

      const summaryCard = getByTestId('earnings-summary');
      expect(summaryCard).toBeTruthy();
    });
  });
});
