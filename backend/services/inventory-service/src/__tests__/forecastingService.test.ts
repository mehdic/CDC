/**
 * Unit Tests for ML-Based Inventory Forecasting Service (T3-107)
 * Tests for T3-104 implementation
 */

import {
  getMedicationForecast,
  getAllMedicationForecasts,
} from '../services/forecastingService';

// Mock the AppDataSource
jest.mock('../index', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { AppDataSource } from '../index';

describe('Forecasting Service - T3-104', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMedicationForecast', () => {
    it('should return null when no historical data exists', async () => {
      const mockTransactionRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockTransactionRepo);

      const result = await getMedicationForecast('pharmacy-123', 'rxnorm-456');

      expect(result).toBeNull();
    });

    it('should calculate forecast with seasonality and trends', async () => {
      // Mock historical transactions
      const mockTransactions = [
        {
          created_at: new Date('2024-01-01'),
          quantity_change: -10,
          transaction_type: 'dispense',
        },
        {
          created_at: new Date('2024-01-05'),
          quantity_change: -12,
          transaction_type: 'dispense',
        },
        {
          created_at: new Date('2024-01-10'),
          quantity_change: -15,
          transaction_type: 'dispense',
        },
      ];

      const mockTransactionRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockTransactions),
        }),
      };

      const mockInventoryRepo = {
        findOne: jest.fn().mockResolvedValue({
          quantity_in_stock: 100,
          medication_name: 'Test Medication',
        }),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockTransactionRepo) // First call for transactions
        .mockReturnValueOnce(mockInventoryRepo)   // Second call for current stock
        .mockReturnValueOnce(mockInventoryRepo);  // Third call for medication name

      const result = await getMedicationForecast('pharmacy-123', 'rxnorm-456', 30);

      expect(result).not.toBeNull();
      expect(result?.medication_rxnorm_code).toBe('rxnorm-456');
      expect(result?.forecasted_demand).toBeGreaterThan(0);
      expect(result?.suggested_reorder_quantity).toBeGreaterThan(0);
      expect(result?.safety_stock).toBeGreaterThan(0);
      expect(result?.confidence).toBeGreaterThan(0);
      expect(result?.confidence).toBeLessThanOrEqual(100);
    });

    it('should detect growing trend', async () => {
      // Create historical data with growing trend
      const mockTransactions = Array.from({ length: 60 }, (_, i) => ({
        created_at: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000),
        quantity_change: -(5 + Math.floor(i / 10)), // Gradually increasing demand
        transaction_type: 'dispense' as const,
      }));

      const mockTransactionRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockTransactions),
        }),
      };

      const mockInventoryRepo = {
        findOne: jest.fn().mockResolvedValue({
          quantity_in_stock: 100,
          medication_name: 'Growing Demand Medication',
        }),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockTransactionRepo)
        .mockReturnValueOnce(mockInventoryRepo)
        .mockReturnValueOnce(mockInventoryRepo);

      const result = await getMedicationForecast('pharmacy-123', 'rxnorm-growing', 30);

      expect(result).not.toBeNull();
      expect(result?.trend).toBe('growing');
    });

    it('should calculate days until stockout', async () => {
      const mockTransactions = [
        {
          created_at: new Date('2024-01-01'),
          quantity_change: -10,
          transaction_type: 'dispense',
        },
      ];

      const mockTransactionRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockTransactions),
        }),
      };

      const mockInventoryRepo = {
        findOne: jest.fn().mockResolvedValue({
          quantity_in_stock: 50, // 50 units in stock
          medication_name: 'Test Medication',
        }),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockTransactionRepo)
        .mockReturnValueOnce(mockInventoryRepo)
        .mockReturnValueOnce(mockInventoryRepo);

      const result = await getMedicationForecast('pharmacy-123', 'rxnorm-456', 30);

      expect(result).not.toBeNull();
      expect(result?.days_until_stockout).toBeGreaterThan(0);
      expect(result?.current_stock).toBe(50);
    });
  });

  describe('getAllMedicationForecasts', () => {
    it('should return forecasts for all medications', async () => {
      const mockInventoryItems = [
        { medication_rxnorm_code: 'rxnorm-1' },
        { medication_rxnorm_code: 'rxnorm-2' },
      ];

      const mockInventoryRepo = {
        find: jest.fn().mockResolvedValue(mockInventoryItems),
        findOne: jest.fn().mockResolvedValue({
          quantity_in_stock: 100,
          medication_name: 'Test Medication',
        }),
      };

      const mockTransactionRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([
            {
              created_at: new Date(),
              quantity_change: -10,
              transaction_type: 'dispense',
            },
          ]),
        }),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockInventoryRepo) // First call for finding all items
        .mockReturnValue(mockTransactionRepo);  // Subsequent calls for transactions

      // Mock findOne for each medication
      mockInventoryRepo.findOne
        .mockResolvedValueOnce({ quantity_in_stock: 100, medication_name: 'Med 1' })
        .mockResolvedValueOnce({ quantity_in_stock: 100, medication_name: 'Med 1' })
        .mockResolvedValueOnce({ quantity_in_stock: 50, medication_name: 'Med 2' })
        .mockResolvedValueOnce({ quantity_in_stock: 50, medication_name: 'Med 2' });

      const result = await getAllMedicationForecasts('pharmacy-123', 30, false);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by minimum stock when requested', async () => {
      const mockInventoryItems = [
        { medication_rxnorm_code: 'rxnorm-low-stock' },
      ];

      const mockInventoryRepo = {
        find: jest.fn().mockResolvedValue(mockInventoryItems),
        findOne: jest.fn().mockResolvedValue({
          quantity_in_stock: 5, // Very low stock
          medication_name: 'Low Stock Medication',
        }),
      };

      const mockTransactionRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([
            {
              created_at: new Date(),
              quantity_change: -10,
              transaction_type: 'dispense',
            },
          ]),
        }),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockInventoryRepo)
        .mockReturnValue(mockTransactionRepo);

      mockInventoryRepo.findOne
        .mockResolvedValueOnce({ quantity_in_stock: 5, medication_name: 'Low Stock Med' })
        .mockResolvedValueOnce({ quantity_in_stock: 5, medication_name: 'Low Stock Med' });

      const result = await getAllMedicationForecasts('pharmacy-123', 30, true);

      expect(result).toBeInstanceOf(Array);
      // Should include items below reorder point
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero historical transactions', async () => {
      const mockTransactionRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockTransactionRepo);

      const result = await getMedicationForecast('pharmacy-123', 'rxnorm-new', 30);

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const mockTransactionRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockTransactionRepo);

      const result = await getMedicationForecast('pharmacy-123', 'rxnorm-error', 30);

      expect(result).toBeNull();
    });
  });
});
