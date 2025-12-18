/**
 * Earnings Service
 * Handles earnings data retrieval, period-based calculations, and export functionality
 */

import { TimePeriod, EarningsSummary, Transaction, BonusOpportunity } from '../store/earningsSlice';

/**
 * Helper function to generate CSV content for export
 */
function generateCSVContent(
  summary: EarningsSummary,
  transactions: Transaction[],
  period: TimePeriod
): string {
  let csv = 'Earnings Report\n';
  csv += `Period: ${period}\n`;
  csv += `Generated: ${new Date().toISOString()}\n\n`;

  csv += 'Summary\n';
  csv += 'Total Earnings,Delivery Fees,Bonuses,Tips,Pending,Available\n';
  csv += `${summary.totalEarnings},${summary.deliveryFees},${summary.bonuses},${summary.tips},${summary.pendingAmount},${summary.availableForPayout}\n\n`;

  csv += 'Transactions\n';
  csv += 'Date,Type,Amount,Description\n';
  transactions.forEach((txn) => {
    csv += `${txn.date},${txn.type},${txn.amount},${txn.description}\n`;
  });

  return csv;
}

/**
 * Helper function to generate PDF content for export (mock implementation)
 */
function generatePDFContent(
  summary: EarningsSummary,
  transactions: Transaction[],
  period: TimePeriod
): string {
  // In real implementation, this would generate proper PDF content
  // For now, return a placeholder
  const content = `Earnings Report - ${period}\nGenerated: ${new Date().toISOString()}\n\nTotal: CHF ${summary.totalEarnings.toFixed(2)}`;
  return btoa(content); // Base64 encode for mock
}

/**
 * Earnings API Service
 * Manages all earnings-related API calls and local data transformations
 */
export const earningsService = {
  /**
   * Fetch earnings summary for a given period
   * @param period - The time period (today, week, month, year)
   * @returns Promise with earnings summary
   */
  async getSummary(period: TimePeriod): Promise<EarningsSummary> {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await api.get(`/earnings/summary?period=${period}`);
      // return response.data;

      // Mock data based on period
      const mockData: Record<TimePeriod, EarningsSummary> = {
        today: {
          totalEarnings: 85.50,
          deliveryFees: 65.00,
          bonuses: 15.00,
          tips: 5.50,
          pendingAmount: 20.00,
          availableForPayout: 65.50,
        },
        week: {
          totalEarnings: 487.25,
          deliveryFees: 380.00,
          bonuses: 75.00,
          tips: 32.25,
          pendingAmount: 100.00,
          availableForPayout: 387.25,
        },
        month: {
          totalEarnings: 1950.00,
          deliveryFees: 1520.00,
          bonuses: 300.00,
          tips: 130.00,
          pendingAmount: 400.00,
          availableForPayout: 1550.00,
        },
        year: {
          totalEarnings: 24000.00,
          deliveryFees: 18600.00,
          bonuses: 3600.00,
          tips: 1800.00,
          pendingAmount: 2000.00,
          availableForPayout: 22000.00,
        },
      };

      return mockData[period];
    } catch (error) {
      throw new Error(
        `Failed to fetch earnings summary: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Fetch transactions for a given period
   * @param period - The time period
   * @returns Promise with transactions array
   */
  async getTransactions(period: TimePeriod): Promise<Transaction[]> {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await api.get(`/earnings/transactions?period=${period}`);
      // return response.data;

      // Mock transactions
      const mockTransactions: Transaction[] = [
        {
          id: 'txn-1',
          date: new Date().toISOString(),
          type: 'delivery_fee',
          amount: 25.50,
          description: 'Delivery #1234 to Geneva',
          deliveryId: 'd1',
        },
        {
          id: 'txn-2',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'tip',
          amount: 5.00,
          description: 'Tip from customer',
          deliveryId: 'd1',
        },
        {
          id: 'txn-3',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'delivery_fee',
          amount: 22.75,
          description: 'Delivery #1235 to Lausanne',
          deliveryId: 'd2',
        },
        {
          id: 'txn-4',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'bonus',
          amount: 15.00,
          description: 'Weekend Warrior Bonus',
        },
      ];

      return mockTransactions;
    } catch (error) {
      throw new Error(
        `Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Fetch bonus opportunities
   * @returns Promise with bonus opportunities array
   */
  async getBonuses(): Promise<BonusOpportunity[]> {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await api.get(`/earnings/bonuses`);
      // return response.data;

      const mockBonuses: BonusOpportunity[] = [
        {
          id: 'bonus-1',
          title: 'Delivery Sprint',
          description: 'Complete 10 deliveries in one day',
          amount: 25.00,
          progress: 7,
          target: 10,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
        },
        {
          id: 'bonus-2',
          title: 'Distance Challenge',
          description: 'Cover 50 km in a week',
          amount: 15.00,
          progress: 38,
          target: 50,
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
        },
        {
          id: 'bonus-3',
          title: 'Perfect Rating',
          description: 'Maintain 95% on-time delivery rate',
          amount: 50.00,
          progress: 92,
          target: 95,
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
        },
      ];

      return mockBonuses;
    } catch (error) {
      throw new Error(
        `Failed to fetch bonuses: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Export earnings report
   * @param period - The time period
   * @param format - Export format (pdf or csv)
   * @returns Promise with base64 encoded file content
   */
  async exportReport(period: TimePeriod, format: 'pdf' | 'csv'): Promise<string> {
    try {
      // TODO: Implement real API call when backend is ready
      // const response = await api.post(`/earnings/export`, { period, format }, {
      //   responseType: 'blob'
      // });
      // return response.data;

      // Mock export - in real implementation, backend would generate the file
      const summary = await earningsService.getSummary(period);
      const transactions = await earningsService.getTransactions(period);

      if (format === 'csv') {
        return generateCSVContent(summary, transactions, period);
      } else {
        // For PDF, would typically call backend to generate PDF
        return generatePDFContent(summary, transactions, period);
      }
    } catch (error) {
      throw new Error(
        `Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Calculate statistics for the selected period
   */
  calculateStatistics(summary: EarningsSummary): {
    averagePerDay: number;
    averagePerDelivery: number;
  } {
    return {
      averagePerDay: summary.totalEarnings / 7, // Simplified for demo
      averagePerDelivery: summary.deliveryFees / 10, // Simplified for demo
    };
  },
};

export default earningsService;
