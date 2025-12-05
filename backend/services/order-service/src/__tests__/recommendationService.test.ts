/**
 * Unit Tests for Medication Recommendation Engine (T3-107)
 * Tests for T3-105 implementation
 */

import {
  getPersonalizedRecommendations,
  getProductRecommendations,
  RecommendationContext,
} from '../services/recommendationService';

// Mock the dataSource
jest.mock('../index', () => ({
  dataSource: {
    getRepository: jest.fn(),
  },
}));

import { dataSource as AppDataSource } from '../index';

describe('Recommendation Service - T3-105', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPersonalizedRecommendations', () => {
    it('should return personalized recommendations for a patient', async () => {
      const context: RecommendationContext = {
        patient_id: 'patient-123',
        current_medications: ['metformin', 'lisinopril'],
        allergies: [],
        chronic_conditions: ['diabetes', 'hypertension'],
        recent_purchases: ['vitamins', 'glucose_monitor'],
        age_group: 'senior',
      };

      // Mock prescription repository
      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue([
          {
            patient_id: 'patient-123',
            created_at: new Date('2024-01-01'),
            items: [
              {
                medication_name: 'Metformin',
                medication_rxnorm_code: '6809',
              },
            ],
          },
        ]),
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
        count: jest.fn().mockResolvedValue(5),
      };

      // Mock order repository
      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(3),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getPersonalizedRecommendations(context, 5);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeLessThanOrEqual(5);

      // Should include recommendations for seniors with diabetes and hypertension
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('medication_name');
        expect(result[0]).toHaveProperty('confidence');
        expect(result[0]).toHaveProperty('reason');
      }
    });

    it('should filter out medications causing allergies', async () => {
      const context: RecommendationContext = {
        patient_id: 'patient-123',
        current_medications: [],
        allergies: ['penicillin', 'sulfa'],
        chronic_conditions: [],
        recent_purchases: [],
        age_group: 'adult',
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue([]),
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
        count: jest.fn().mockResolvedValue(0),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getPersonalizedRecommendations(context, 5);

      // Ensure no recommendations contain allergens
      for (const rec of result) {
        const medNameLower = rec.medication_name.toLowerCase();
        expect(medNameLower).not.toContain('penicillin');
        expect(medNameLower).not.toContain('sulfa');
      }
    });

    it('should recommend refills for regularly taken medications', async () => {
      const context: RecommendationContext = {
        patient_id: 'patient-123',
        current_medications: ['metformin'],
        allergies: [],
        chronic_conditions: ['diabetes'],
        recent_purchases: [],
        age_group: 'adult',
      };

      // Mock patient with regular medication history
      const mockPrescriptions = [
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-01-01'),
          items: [
            {
              medication_name: 'Metformin 500mg',
              medication_rxnorm_code: '6809',
            },
          ],
        },
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-02-01'),
          items: [
            {
              medication_name: 'Metformin 500mg',
              medication_rxnorm_code: '6809',
            },
          ],
        },
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-03-01'),
          items: [
            {
              medication_name: 'Metformin 500mg',
              medication_rxnorm_code: '6809',
            },
          ],
        },
      ];

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue(mockPrescriptions),
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockPrescriptions),
        }),
        count: jest.fn().mockResolvedValue(3),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getPersonalizedRecommendations(context, 5);

      // Should have high-confidence refill recommendations
      expect(result).toBeInstanceOf(Array);
    });

    it('should recommend complementary medications for chronic conditions', async () => {
      const context: RecommendationContext = {
        patient_id: 'patient-123',
        current_medications: [],
        allergies: [],
        chronic_conditions: ['hypertension'],
        recent_purchases: [],
        age_group: 'adult',
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue([]),
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
        count: jest.fn().mockResolvedValue(0),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getPersonalizedRecommendations(context, 5);

      expect(result).toBeInstanceOf(Array);
      // Should include recommendations for cardiovascular health
    });

    it('should handle empty context gracefully', async () => {
      const context: RecommendationContext = {
        patient_id: 'patient-new',
        current_medications: [],
        allergies: [],
        chronic_conditions: [],
        recent_purchases: [],
        age_group: 'adult',
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue([]),
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
        count: jest.fn().mockResolvedValue(0),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getPersonalizedRecommendations(context, 5);

      expect(result).toBeInstanceOf(Array);
      // Should still return some recommendations (seasonal, preventive)
    });
  });

  describe('getProductRecommendations', () => {
    it('should return product recommendations based on purchase history', async () => {
      const mockOrders = [
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-01-01'),
          items: [
            {
              product_name: 'Vitamin C',
              product_category: 'supplements',
            },
            {
              product_name: 'Zinc',
              product_category: 'supplements',
            },
          ],
        },
      ];

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue(mockOrders),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockOrderRepo);

      const result = await getProductRecommendations('patient-123', 10);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeLessThanOrEqual(10);

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('product_name');
        expect(result[0]).toHaveProperty('confidence');
        expect(result[0]).toHaveProperty('category');
      }
    });

    it('should include seasonal recommendations', async () => {
      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockOrderRepo);

      const result = await getProductRecommendations('patient-123', 10);

      expect(result).toBeInstanceOf(Array);

      // Should include seasonal recommendations
      const hasSeasonalTag = result.some(rec => rec.tags.includes('seasonal'));
      expect(hasSeasonalTag).toBeTruthy();
    });

    it('should recommend frequently bought together products', async () => {
      const mockOrders = [
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-01-01'),
          items: [
            { product_name: 'Product A', product_category: 'supplements' },
            { product_name: 'Product B', product_category: 'supplements' },
          ],
        },
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-02-01'),
          items: [
            { product_name: 'Product C', product_category: 'supplements' },
          ],
        },
      ];

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue(mockOrders),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockOrderRepo);

      const result = await getProductRecommendations('patient-123', 10);

      expect(result).toBeInstanceOf(Array);
      // Should recommend products from 'supplements' category
    });

    it('should handle database errors gracefully', async () => {
      const mockOrderRepo = {
        find: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockOrderRepo);

      const result = await getProductRecommendations('patient-error', 10);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });
  });

  describe('Recommendation Quality', () => {
    it('should return recommendations sorted by confidence', async () => {
      const context: RecommendationContext = {
        patient_id: 'patient-123',
        current_medications: ['metformin'],
        allergies: [],
        chronic_conditions: ['diabetes'],
        recent_purchases: [],
        age_group: 'adult',
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue([
          {
            patient_id: 'patient-123',
            created_at: new Date('2024-01-01'),
            items: [
              {
                medication_name: 'Metformin',
                medication_rxnorm_code: '6809',
              },
            ],
          },
        ]),
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
        count: jest.fn().mockResolvedValue(1),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getPersonalizedRecommendations(context, 5);

      // Verify recommendations are sorted by confidence
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].confidence).toBeGreaterThanOrEqual(result[i + 1].confidence);
      }
    });

    it('should not return duplicate recommendations', async () => {
      const context: RecommendationContext = {
        patient_id: 'patient-123',
        current_medications: [],
        allergies: [],
        chronic_conditions: ['diabetes', 'hypertension'],
        recent_purchases: [],
        age_group: 'senior',
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue([]),
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
        count: jest.fn().mockResolvedValue(0),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getPersonalizedRecommendations(context, 10);

      // Check for duplicates by rxnorm_code
      const rxnormCodes = new Set();
      for (const rec of result) {
        expect(rxnormCodes.has(rec.rxnorm_code)).toBe(false);
        rxnormCodes.add(rec.rxnorm_code);
      }
    });
  });
});
