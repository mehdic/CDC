/**
 * Earnings Redux Slice
 * Manages earnings data, transactions, bonuses, and payout methods
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';

import type { RootState } from './index';

/**
 * Types
 */
export type TimePeriod = 'today' | 'week' | 'month' | 'year';

export interface EarningsSummary {
  totalEarnings: number;
  deliveryFees: number;
  bonuses: number;
  tips: number;
  pendingAmount: number;
  availableForPayout: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'delivery_fee' | 'bonus' | 'tip' | 'payout';
  amount: number;
  description: string;
  deliveryId?: string;
}

export interface BonusOpportunity {
  id: string;
  title: string;
  description: string;
  amount: number;
  progress: number;
  target: number;
  expiresAt: string;
  isActive: boolean;
}

export interface PayoutMethod {
  id: string;
  type: 'bank_account' | 'paypal' | 'stripe';
  details: string;
  isDefault: boolean;
  isVerified: boolean;
}

export interface PayoutHistory {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface EarningsState {
  summary: EarningsSummary | null;
  transactions: Transaction[];
  bonusOpportunities: BonusOpportunity[];
  payoutMethods: PayoutMethod[];
  payoutHistory: PayoutHistory[];
  selectedPeriod: TimePeriod;
  loading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
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

/**
 * Helper to calculate earnings summary from period data
 */
const calculateSummary = (periodData: any): EarningsSummary => {
  return {
    totalEarnings: periodData.earnings || 0,
    deliveryFees: periodData.deliveryFees || 0,
    bonuses: periodData.bonuses || 0,
    tips: periodData.tips || 0,
    pendingAmount: periodData.pending || 0,
    availableForPayout: periodData.available || 0,
    // FIXED: Division by zero risk - check denominator first
    averagePerDelivery: periodData.completed > 0
      ? periodData.earnings / periodData.completed
      : 0,
  } as EarningsSummary;
};

/**
 * Async Thunks
 */
export const fetchEarningsSummary = createAsyncThunk(
  'earnings/fetchSummary',
  async (period: TimePeriod, { rejectWithValue }) => {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await earningsApi.getSummary(period);
      const mockResponse = {
        earnings: 1250.50,
        deliveryFees: 1000,
        bonuses: 150,
        tips: 100.50,
        pending: 250,
        available: 1000.50,
        completed: 45,
      };
      return calculateSummary(mockResponse);
    } catch (error) {
      // FIXED: Removed 'any' type, use proper error handling
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return rejectWithValue(message);
    }
  }
);

export const fetchEarningsTransactions = createAsyncThunk(
  'earnings/fetchTransactions',
  async (period: TimePeriod, { rejectWithValue }) => {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await earningsApi.getTransactions(period);
      const mockTransactions: Transaction[] = [
        {
          id: 't1',
          date: new Date().toISOString(),
          type: 'delivery_fee',
          amount: 25.50,
          description: 'Delivery #1234',
          deliveryId: 'd1',
        },
        {
          id: 't2',
          date: new Date().toISOString(),
          type: 'tip',
          amount: 5.00,
          description: 'Tip from customer',
          deliveryId: 'd1',
        },
      ];
      return mockTransactions;
    } catch (error) {
      // FIXED: Removed 'any' type
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch bonus opportunities
 * @todo Replace mock data with real API call to /api/delivery/bonuses
 */
export const fetchBonusOpportunities = createAsyncThunk(
  'earnings/fetchBonuses',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await earningsApi.getBonuses();
      const mockBonuses: BonusOpportunity[] = [
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
      return mockBonuses;
    } catch (error) {
      // FIXED: Removed 'any' type
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch payout methods
 * @todo Replace mock data with real API call to /api/delivery/payout-methods
 */
export const fetchPayoutMethods = createAsyncThunk(
  'earnings/fetchPayoutMethods',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await earningsApi.getPayoutMethods();
      const mockMethods: PayoutMethod[] = [
        {
          id: 'pm1',
          type: 'bank_account',
          details: 'Bank ****1234',
          isDefault: true,
          isVerified: true,
        },
      ];
      return mockMethods;
    } catch (error) {
      // FIXED: Removed 'any' type
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch payout history
 * @todo Replace mock data with real API call to /api/delivery/payouts
 */
export const fetchPayoutHistory = createAsyncThunk(
  'earnings/fetchPayoutHistory',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await earningsApi.getPayoutHistory();
      const mockHistory: PayoutHistory[] = [
        {
          id: 'ph1',
          date: new Date().toISOString(),
          amount: 500,
          method: 'Bank ****1234',
          status: 'completed',
        },
      ];
      return mockHistory;
    } catch (error) {
      // FIXED: Removed 'any' type
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return rejectWithValue(message);
    }
  }
);

/**
 * Earnings Slice
 */
const earningsSlice = createSlice({
  name: 'earnings',
  initialState,
  reducers: {
    setSelectedPeriod: (state, action: PayloadAction<TimePeriod>) => {
      state.selectedPeriod = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Earnings Summary
    builder.addCase(fetchEarningsSummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchEarningsSummary.fulfilled, (state, action) => {
      state.loading = false;
      state.summary = action.payload;
    });
    builder.addCase(fetchEarningsSummary.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Transactions
    builder.addCase(fetchEarningsTransactions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchEarningsTransactions.fulfilled, (state, action) => {
      state.loading = false;
      state.transactions = action.payload;
    });
    builder.addCase(fetchEarningsTransactions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Bonus Opportunities
    builder.addCase(fetchBonusOpportunities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBonusOpportunities.fulfilled, (state, action) => {
      state.loading = false;
      state.bonusOpportunities = action.payload;
    });
    builder.addCase(fetchBonusOpportunities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Payout Methods
    // FIXED: Added missing error clearing in pending handler
    builder.addCase(fetchPayoutMethods.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPayoutMethods.fulfilled, (state, action) => {
      state.loading = false;
      state.payoutMethods = action.payload;
    });
    builder.addCase(fetchPayoutMethods.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Payout History
    // FIXED: Added missing error clearing in pending handler
    builder.addCase(fetchPayoutHistory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPayoutHistory.fulfilled, (state, action) => {
      state.loading = false;
      state.payoutHistory = action.payload;
    });
    builder.addCase(fetchPayoutHistory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setSelectedPeriod, clearError } = earningsSlice.actions;

export default earningsSlice.reducer;

/**
 * Selectors
 */

// Basic selectors
export const selectEarningsState = (state: RootState) => state.earnings;
export const selectEarningsSummary = (state: RootState) => state.earnings.summary;
export const selectTransactions = (state: RootState) => state.earnings.transactions;
export const selectSelectedPeriod = (state: RootState) => state.earnings.selectedPeriod;
export const selectEarningsLoading = (state: RootState) => state.earnings.loading;
export const selectEarningsError = (state: RootState) => state.earnings.error;
export const selectBonusOpportunities = (state: RootState) => state.earnings.bonusOpportunities;
export const selectPayoutMethods = (state: RootState) => state.earnings.payoutMethods;
export const selectPayoutHistory = (state: RootState) => state.earnings.payoutHistory;

// Memoized computed selectors
export const selectTotalEarningsForPeriod = createSelector(
  [selectEarningsSummary],
  (summary) => summary?.totalEarnings ?? 0
);

export const selectActiveBonuses = createSelector(
  [selectBonusOpportunities],
  (bonuses) => bonuses.filter((b) => b.isActive)
);

export const selectDefaultPayoutMethod = createSelector(
  [selectPayoutMethods],
  (methods) => methods.find((m) => m.isDefault)
);

export const selectRecentTransactions = createSelector(
  [selectTransactions],
  (transactions) => transactions.slice(0, 10)
);

export const selectTotalBonusProgress = createSelector(
  [selectActiveBonuses],
  (bonuses) => bonuses.reduce((total, bonus) => total + (bonus.progress / bonus.target) * bonus.amount, 0)
);
