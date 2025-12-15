/**
 * Earnings Slice Tests
 * Comprehensive tests for all reducers, actions, and async thunks
 */

import earningsReducer, {
  setSelectedPeriod,
  clearError,
  fetchEarningsSummary,
  fetchEarningsTransactions,
  fetchBonusOpportunities,
  fetchPayoutMethods,
  fetchPayoutHistory,
  selectEarningsSummary,
  selectActiveBonuses,
  selectTotalEarningsForPeriod,
  selectDefaultPayoutMethod,
  type EarningsState,
  type TimePeriod,
} from '../../src/store/earningsSlice';
import { configureStore } from '@reduxjs/toolkit';

describe('earningsSlice', () => {
  const initialState: EarningsState = {
    summary: null,
    transactions: [],
    bonusOpportunities: [],
    payoutMethods: [],
    payoutHistory: [],
    selectedPeriod: 'week',
    loading: false,
    error: null,
  };

  describe('reducers', () => {
    it('should return initial state', () => {
      const state = earningsReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });

    it('should handle setSelectedPeriod', () => {
      const period: TimePeriod = 'month';
      const state = earningsReducer(initialState, setSelectedPeriod(period));
      expect(state.selectedPeriod).toBe('month');
    });

    it('should handle clearError', () => {
      const stateWithError: EarningsState = {
        ...initialState,
        error: 'Some error',
      };
      const state = earningsReducer(stateWithError, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('async thunks - fetchEarningsSummary', () => {
    it('should handle fetchEarningsSummary.pending', () => {
      const action = { type: fetchEarningsSummary.pending.type };
      const state = earningsReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fetchEarningsSummary.fulfilled', () => {
      const mockSummary = {
        totalEarnings: 1250.50,
        deliveryFees: 1000,
        bonuses: 150,
        tips: 100.50,
        pendingAmount: 250,
        availableForPayout: 1000.50,
      };
      const action = {
        type: fetchEarningsSummary.fulfilled.type,
        payload: mockSummary,
      };
      const state = earningsReducer(initialState, action);
      expect(state.summary).toEqual(mockSummary);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetchEarningsSummary.rejected', () => {
      const action = {
        type: fetchEarningsSummary.rejected.type,
        payload: 'Network error',
      };
      const state = earningsReducer(initialState, action);
      expect(state.error).toBe('Network error');
      expect(state.loading).toBe(false);
      expect(state.summary).toBeNull();
    });
  });

  describe('async thunks - fetchEarningsTransactions', () => {
    it('should handle fetchEarningsTransactions.pending', () => {
      const action = { type: fetchEarningsTransactions.pending.type };
      const state = earningsReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fetchEarningsTransactions.fulfilled', () => {
      const mockTransactions = [
        {
          id: 't1',
          date: new Date().toISOString(),
          type: 'delivery_fee' as const,
          amount: 25.50,
          description: 'Delivery #1234',
          deliveryId: 'd1',
        },
        {
          id: 't2',
          date: new Date().toISOString(),
          type: 'tip' as const,
          amount: 5.00,
          description: 'Tip from customer',
          deliveryId: 'd1',
        },
      ];
      const action = {
        type: fetchEarningsTransactions.fulfilled.type,
        payload: mockTransactions,
      };
      const state = earningsReducer(initialState, action);
      expect(state.transactions).toEqual(mockTransactions);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetchEarningsTransactions.rejected', () => {
      const action = {
        type: fetchEarningsTransactions.rejected.type,
        payload: 'Failed to fetch transactions',
      };
      const state = earningsReducer(initialState, action);
      expect(state.error).toBe('Failed to fetch transactions');
      expect(state.loading).toBe(false);
      expect(state.transactions).toEqual([]);
    });
  });

  describe('async thunks - fetchBonusOpportunities', () => {
    it('should handle fetchBonusOpportunities.pending', () => {
      const action = { type: fetchBonusOpportunities.pending.type };
      const state = earningsReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fetchBonusOpportunities.fulfilled', () => {
      const mockBonuses = [
        {
          id: 'b1',
          title: 'Weekend Warrior',
          description: 'Complete 20 deliveries this weekend',
          amount: 50,
          progress: 12,
          target: 20,
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
        },
      ];
      const action = {
        type: fetchBonusOpportunities.fulfilled.type,
        payload: mockBonuses,
      };
      const state = earningsReducer(initialState, action);
      expect(state.bonusOpportunities).toEqual(mockBonuses);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetchBonusOpportunities.rejected', () => {
      const action = {
        type: fetchBonusOpportunities.rejected.type,
        payload: 'Failed to fetch bonuses',
      };
      const state = earningsReducer(initialState, action);
      expect(state.error).toBe('Failed to fetch bonuses');
      expect(state.loading).toBe(false);
      expect(state.bonusOpportunities).toEqual([]);
    });
  });

  describe('async thunks - fetchPayoutMethods', () => {
    it('should handle fetchPayoutMethods.pending', () => {
      const action = { type: fetchPayoutMethods.pending.type };
      const state = earningsReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fetchPayoutMethods.fulfilled', () => {
      const mockMethods = [
        {
          id: 'pm1',
          type: 'bank_account' as const,
          details: 'Bank ****1234',
          isDefault: true,
          isVerified: true,
        },
      ];
      const action = {
        type: fetchPayoutMethods.fulfilled.type,
        payload: mockMethods,
      };
      const state = earningsReducer(initialState, action);
      expect(state.payoutMethods).toEqual(mockMethods);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetchPayoutMethods.rejected', () => {
      const action = {
        type: fetchPayoutMethods.rejected.type,
        payload: 'Failed to fetch payout methods',
      };
      const state = earningsReducer(initialState, action);
      expect(state.error).toBe('Failed to fetch payout methods');
      expect(state.loading).toBe(false);
      expect(state.payoutMethods).toEqual([]);
    });
  });

  describe('async thunks - fetchPayoutHistory', () => {
    it('should handle fetchPayoutHistory.pending', () => {
      const action = { type: fetchPayoutHistory.pending.type };
      const state = earningsReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fetchPayoutHistory.fulfilled', () => {
      const mockHistory = [
        {
          id: 'ph1',
          date: new Date().toISOString(),
          amount: 500,
          method: 'Bank ****1234',
          status: 'completed' as const,
        },
      ];
      const action = {
        type: fetchPayoutHistory.fulfilled.type,
        payload: mockHistory,
      };
      const state = earningsReducer(initialState, action);
      expect(state.payoutHistory).toEqual(mockHistory);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetchPayoutHistory.rejected', () => {
      const action = {
        type: fetchPayoutHistory.rejected.type,
        payload: 'Failed to fetch payout history',
      };
      const state = earningsReducer(initialState, action);
      expect(state.error).toBe('Failed to fetch payout history');
      expect(state.loading).toBe(false);
      expect(state.payoutHistory).toEqual([]);
    });
  });

  describe('selectors', () => {
    const mockStore = configureStore({
      reducer: {
        earnings: earningsReducer,
      },
      preloadedState: {
        earnings: {
          ...initialState,
          summary: {
            totalEarnings: 1250.50,
            deliveryFees: 1000,
            bonuses: 150,
            tips: 100.50,
            pendingAmount: 250,
            availableForPayout: 1000.50,
          },
          bonusOpportunities: [
            {
              id: 'b1',
              title: 'Weekend Warrior',
              description: 'Complete 20 deliveries',
              amount: 50,
              progress: 10,
              target: 20,
              expiresAt: new Date().toISOString(),
              isActive: true,
            },
            {
              id: 'b2',
              title: 'Inactive Bonus',
              description: 'Expired',
              amount: 30,
              progress: 0,
              target: 10,
              expiresAt: new Date().toISOString(),
              isActive: false,
            },
          ],
          payoutMethods: [
            {
              id: 'pm1',
              type: 'bank_account' as const,
              details: 'Bank ****1234',
              isDefault: true,
              isVerified: true,
            },
            {
              id: 'pm2',
              type: 'paypal' as const,
              details: 'PayPal test@example.com',
              isDefault: false,
              isVerified: true,
            },
          ],
        },
      },
    });

    const state = mockStore.getState();

    it('should select earnings summary', () => {
      const summary = selectEarningsSummary(state);
      expect(summary).toEqual({
        totalEarnings: 1250.50,
        deliveryFees: 1000,
        bonuses: 150,
        tips: 100.50,
        pendingAmount: 250,
        availableForPayout: 1000.50,
      });
    });

    it('should select total earnings for period (memoized)', () => {
      const total = selectTotalEarningsForPeriod(state);
      expect(total).toBe(1250.50);
    });

    it('should select active bonuses only (memoized)', () => {
      const activeBonuses = selectActiveBonuses(state);
      expect(activeBonuses).toHaveLength(1);
      expect(activeBonuses[0].id).toBe('b1');
      expect(activeBonuses[0].isActive).toBe(true);
    });

    it('should select default payout method (memoized)', () => {
      const defaultMethod = selectDefaultPayoutMethod(state);
      expect(defaultMethod).toBeDefined();
      expect(defaultMethod?.id).toBe('pm1');
      expect(defaultMethod?.isDefault).toBe(true);
    });

    it('should return 0 for total earnings when summary is null', () => {
      const emptyStore = configureStore({
        reducer: {
          earnings: earningsReducer,
        },
      });
      const emptyState = emptyStore.getState();
      const total = selectTotalEarningsForPeriod(emptyState);
      expect(total).toBe(0);
    });
  });

  describe('error state management', () => {
    it('should clear error on successful fetch after error', () => {
      const stateWithError: EarningsState = {
        ...initialState,
        error: 'Previous error',
        loading: false,
      };

      // Trigger pending (should clear error)
      const pendingState = earningsReducer(stateWithError, {
        type: fetchEarningsSummary.pending.type,
      });
      expect(pendingState.error).toBeNull();
      expect(pendingState.loading).toBe(true);

      // Trigger fulfilled
      const fulfilledState = earningsReducer(pendingState, {
        type: fetchEarningsSummary.fulfilled.type,
        payload: {
          totalEarnings: 1000,
          deliveryFees: 800,
          bonuses: 100,
          tips: 100,
          pendingAmount: 200,
          availableForPayout: 800,
        },
      });
      expect(fulfilledState.error).toBeNull();
      expect(fulfilledState.loading).toBe(false);
    });
  });

  describe('loading state management', () => {
    it('should set loading to true on any pending action', () => {
      const thunks = [
        fetchEarningsSummary.pending.type,
        fetchEarningsTransactions.pending.type,
        fetchBonusOpportunities.pending.type,
        fetchPayoutMethods.pending.type,
        fetchPayoutHistory.pending.type,
      ];

      thunks.forEach((type) => {
        const state = earningsReducer(initialState, { type });
        expect(state.loading).toBe(true);
      });
    });

    it('should set loading to false on any fulfilled action', () => {
      const thunks = [
        { type: fetchEarningsSummary.fulfilled.type, payload: {} },
        { type: fetchEarningsTransactions.fulfilled.type, payload: [] },
        { type: fetchBonusOpportunities.fulfilled.type, payload: [] },
        { type: fetchPayoutMethods.fulfilled.type, payload: [] },
        { type: fetchPayoutHistory.fulfilled.type, payload: [] },
      ];

      thunks.forEach((action) => {
        const state = earningsReducer({ ...initialState, loading: true }, action);
        expect(state.loading).toBe(false);
      });
    });

    it('should set loading to false on any rejected action', () => {
      const thunks = [
        { type: fetchEarningsSummary.rejected.type, payload: 'error' },
        { type: fetchEarningsTransactions.rejected.type, payload: 'error' },
        { type: fetchBonusOpportunities.rejected.type, payload: 'error' },
        { type: fetchPayoutMethods.rejected.type, payload: 'error' },
        { type: fetchPayoutHistory.rejected.type, payload: 'error' },
      ];

      thunks.forEach((action) => {
        const state = earningsReducer({ ...initialState, loading: true }, action);
        expect(state.loading).toBe(false);
      });
    });
  });
});
