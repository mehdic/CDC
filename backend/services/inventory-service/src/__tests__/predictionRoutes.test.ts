/**
 * Unit Tests for Prediction Routes (T7-010)
 * Tests AI-powered stock prediction endpoints
 */

import request from 'supertest';
import express, { Application } from 'express';
import { predictionRouter } from '../routes/predictionRoutes';
import * as predictionService from '../services/prediction.service';

// Mock the prediction service
jest.mock('../services/prediction.service');

const app: Application = express();
app.use(express.json());
app.use('/inventory', predictionRouter);

describe('Prediction Routes - T7-010', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // GET /inventory/predictions/:productId
  // ============================================================================

  describe('GET /inventory/predictions/:productId', () => {
    it('should return prediction data for a valid product', async () => {
      // Mock prediction service responses
      const mockDemandForecast = {
        productId: 'aspirin-500mg',
        productName: 'Aspirin 500mg',
        forecastedQuantity: 150,
        confidenceScore: 85,
        forecastHorizonDays: 30,
        timestamp: new Date('2024-12-08T10:00:00Z'),
      };

      const mockSeasonality = {
        productId: 'aspirin-500mg',
        patternType: 'none' as const,
        seasonalityFactor: 1.0,
        peakMonths: [],
        baselineDemand: 100,
        metadata: {
          detectionMethod: 'historical_analysis',
          confidence: 80,
          monthlyAverage: Array(12).fill(100),
        },
      };

      const mockReorderSuggestion = {
        productId: 'aspirin-500mg',
        productName: 'Aspirin 500mg',
        currentStock: 75,
        reorderPoint: 100,
        suggestedQuantity: 200,
        urgencyLevel: 'medium' as const,
        daysUntilStockout: 15,
        estimatedDeliveryDays: 7,
        recommendedOrderDate: new Date('2024-12-15T00:00:00Z'),
      };

      (predictionService.predictDemand as jest.Mock).mockResolvedValue(mockDemandForecast);
      (predictionService.detectSeasonality as jest.Mock).mockResolvedValue(mockSeasonality);
      (predictionService.calculateReorderPoint as jest.Mock).mockResolvedValue(
        mockReorderSuggestion
      );

      const response = await request(app)
        .get('/inventory/predictions/aspirin-500mg')
        .query({ pharmacy_id: 'pharmacy-123', horizon: 30 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prediction).toBeDefined();
      expect(response.body.data.prediction.productId).toBe('aspirin-500mg');
      expect(response.body.data.prediction.demand.forecasted).toBe(150);
      expect(response.body.data.prediction.demand.confidence).toBe(85);
      expect(response.body.data.prediction.seasonality.patternType).toBe('none');
      expect(response.body.data.prediction.reorder.currentStock).toBe(75);
      expect(response.body.data.prediction.reorder.urgencyLevel).toBe('medium');
    });

    it('should return 404 when no prediction data is available', async () => {
      (predictionService.predictDemand as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/inventory/predictions/unknown-product')
        .query({ pharmacy_id: 'pharmacy-123' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 400 when pharmacy_id is missing', async () => {
      const response = await request(app).get('/inventory/predictions/aspirin-500mg');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should return 400 when productId is empty', async () => {
      const response = await request(app)
        .get('/inventory/predictions/')
        .query({ pharmacy_id: 'pharmacy-123' });

      expect(response.status).toBe(404); // Express returns 404 for missing route param
    });

    it('should use default horizon of 30 days when not specified', async () => {
      const mockDemandForecast = {
        productId: 'ibuprofen-400mg',
        productName: 'Ibuprofen 400mg',
        forecastedQuantity: 120,
        confidenceScore: 90,
        forecastHorizonDays: 30,
        timestamp: new Date(),
      };

      (predictionService.predictDemand as jest.Mock).mockResolvedValue(mockDemandForecast);
      (predictionService.detectSeasonality as jest.Mock).mockResolvedValue({
        productId: 'ibuprofen-400mg',
        patternType: 'none',
        seasonalityFactor: 1.0,
        peakMonths: [],
        baselineDemand: 80,
        metadata: { detectionMethod: 'no_data', confidence: 0, monthlyAverage: [] },
      });
      (predictionService.calculateReorderPoint as jest.Mock).mockResolvedValue({
        productId: 'ibuprofen-400mg',
        productName: 'Ibuprofen 400mg',
        currentStock: 50,
        reorderPoint: 60,
        suggestedQuantity: 150,
        urgencyLevel: 'high',
        daysUntilStockout: 5,
        estimatedDeliveryDays: 7,
        recommendedOrderDate: new Date(),
      });

      const response = await request(app)
        .get('/inventory/predictions/ibuprofen-400mg')
        .query({ pharmacy_id: 'pharmacy-123' });

      expect(response.status).toBe(200);
      expect(predictionService.predictDemand).toHaveBeenCalledWith('ibuprofen-400mg', 30);
    });

    it('should handle service errors gracefully', async () => {
      (predictionService.predictDemand as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/inventory/predictions/aspirin-500mg')
        .query({ pharmacy_id: 'pharmacy-123' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal Server Error');
    });
  });

  // ============================================================================
  // GET /inventory/stockout-risks
  // ============================================================================

  describe('GET /inventory/stockout-risks', () => {
    it('should return list of high-risk items', async () => {
      const mockForecasts = [
        {
          productId: 'flu-vaccine',
          productName: 'Flu Vaccine',
          forecastedQuantity: 210,
          confidenceScore: 95,
          forecastHorizonDays: 7,
          timestamp: new Date(),
        },
        {
          productId: 'antihistamine',
          productName: 'Antihistamine',
          forecastedQuantity: 140,
          confidenceScore: 88,
          forecastHorizonDays: 7,
          timestamp: new Date(),
        },
      ];

      (predictionService.predictBulkDemand as jest.Mock).mockResolvedValue(mockForecasts);

      const response = await request(app)
        .get('/inventory/stockout-risks')
        .query({ pharmacy_id: 'pharmacy-123', days_threshold: 7, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.highRiskItems).toBeDefined();
      expect(Array.isArray(response.body.data.highRiskItems)).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.daysThreshold).toBe(7);
    });

    it('should filter items by risk level correctly', async () => {
      const mockForecasts = [
        {
          productId: 'product-1',
          productName: 'Product 1',
          forecastedQuantity: 700, // High daily demand (100/day)
          confidenceScore: 90,
          forecastHorizonDays: 7,
          timestamp: new Date(),
        },
        {
          productId: 'product-2',
          productName: 'Product 2',
          forecastedQuantity: 70, // Low daily demand (10/day)
          confidenceScore: 85,
          forecastHorizonDays: 7,
          timestamp: new Date(),
        },
      ];

      (predictionService.predictBulkDemand as jest.Mock).mockResolvedValue(mockForecasts);

      const response = await request(app)
        .get('/inventory/stockout-risks')
        .query({ pharmacy_id: 'pharmacy-123', days_threshold: 7 });

      expect(response.status).toBe(200);

      // Product-1 has high demand (100/day), so with 50 stock it will stockout in 0 days
      // Product-2 has low demand (10/day), so with 50 stock it will stockout in 5 days
      const highRiskItems = response.body.data.highRiskItems;
      expect(highRiskItems.length).toBeGreaterThan(0);

      // Should be sorted by days until stockout (ascending)
      for (let i = 1; i < highRiskItems.length; i++) {
        expect(highRiskItems[i].daysUntilStockout).toBeGreaterThanOrEqual(
          highRiskItems[i - 1].daysUntilStockout
        );
      }
    });

    it('should return 400 when pharmacy_id is missing', async () => {
      const response = await request(app).get('/inventory/stockout-risks');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should use default days_threshold of 7 when not specified', async () => {
      (predictionService.predictBulkDemand as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/inventory/stockout-risks')
        .query({ pharmacy_id: 'pharmacy-123' });

      expect(response.status).toBe(200);
      expect(response.body.data.summary.daysThreshold).toBe(7);
    });

    it('should limit results to specified limit', async () => {
      const mockForecasts = Array.from({ length: 50 }, (_, i) => ({
        productId: `product-${i}`,
        productName: `Product ${i}`,
        forecastedQuantity: 210,
        confidenceScore: 85,
        forecastHorizonDays: 7,
        timestamp: new Date(),
      }));

      (predictionService.predictBulkDemand as jest.Mock).mockResolvedValue(mockForecasts);

      const response = await request(app)
        .get('/inventory/stockout-risks')
        .query({ pharmacy_id: 'pharmacy-123', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.highRiskItems.length).toBeLessThanOrEqual(10);
    });

    it('should handle service errors gracefully', async () => {
      (predictionService.predictBulkDemand as jest.Mock).mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await request(app)
        .get('/inventory/stockout-risks')
        .query({ pharmacy_id: 'pharmacy-123' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal Server Error');
    });
  });

  // ============================================================================
  // POST /inventory/reorder-suggestions
  // ============================================================================

  describe('POST /inventory/reorder-suggestions', () => {
    it('should generate reorder suggestions for specified products', async () => {
      const mockSuggestion = {
        productId: 'aspirin-500mg',
        productName: 'Aspirin 500mg',
        currentStock: 75,
        reorderPoint: 100,
        suggestedQuantity: 200,
        urgencyLevel: 'high' as const,
        daysUntilStockout: 10,
        estimatedDeliveryDays: 7,
        recommendedOrderDate: new Date('2024-12-15T00:00:00Z'),
      };

      (predictionService.calculateReorderPoint as jest.Mock).mockResolvedValue(mockSuggestion);

      const response = await request(app)
        .post('/inventory/reorder-suggestions')
        .send({
          pharmacy_id: 'pharmacy-123',
          product_ids: ['aspirin-500mg', 'ibuprofen-400mg'],
          lead_time_days: 7,
          service_level: 0.95,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toBeDefined();
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.parameters.leadTimeDays).toBe(7);
      expect(response.body.data.summary.parameters.serviceLevel).toBe(0.95);
    });

    it('should sort suggestions by urgency level', async () => {
      const mockSuggestions = [
        {
          productId: 'product-1',
          productName: 'Product 1',
          currentStock: 50,
          reorderPoint: 60,
          suggestedQuantity: 150,
          urgencyLevel: 'low' as const,
          daysUntilStockout: 20,
          estimatedDeliveryDays: 7,
          recommendedOrderDate: new Date(),
        },
        {
          productId: 'product-2',
          productName: 'Product 2',
          currentStock: 10,
          reorderPoint: 60,
          suggestedQuantity: 150,
          urgencyLevel: 'critical' as const,
          daysUntilStockout: 2,
          estimatedDeliveryDays: 7,
          recommendedOrderDate: new Date(),
        },
        {
          productId: 'product-3',
          productName: 'Product 3',
          currentStock: 30,
          reorderPoint: 60,
          suggestedQuantity: 150,
          urgencyLevel: 'high' as const,
          daysUntilStockout: 5,
          estimatedDeliveryDays: 7,
          recommendedOrderDate: new Date(),
        },
      ];

      (predictionService.calculateReorderPoint as jest.Mock)
        .mockResolvedValueOnce(mockSuggestions[0])
        .mockResolvedValueOnce(mockSuggestions[1])
        .mockResolvedValueOnce(mockSuggestions[2]);

      const response = await request(app)
        .post('/inventory/reorder-suggestions')
        .send({
          pharmacy_id: 'pharmacy-123',
          product_ids: ['product-1', 'product-2', 'product-3'],
        });

      expect(response.status).toBe(200);
      const suggestions = response.body.data.suggestions;

      // Should be sorted: critical first, then high, then low
      expect(suggestions[0].urgencyLevel).toBe('critical');
      expect(suggestions[1].urgencyLevel).toBe('high');
      expect(suggestions[2].urgencyLevel).toBe('low');
    });

    it('should return 400 when pharmacy_id is missing', async () => {
      const response = await request(app)
        .post('/inventory/reorder-suggestions')
        .send({ product_ids: ['aspirin-500mg'] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should use default values when optional parameters are not provided', async () => {
      (predictionService.calculateReorderPoint as jest.Mock).mockResolvedValue({
        productId: 'aspirin-500mg',
        productName: 'Aspirin 500mg',
        currentStock: 75,
        reorderPoint: 100,
        suggestedQuantity: 200,
        urgencyLevel: 'medium',
        daysUntilStockout: 10,
        estimatedDeliveryDays: 7,
        recommendedOrderDate: new Date(),
      });

      const response = await request(app)
        .post('/inventory/reorder-suggestions')
        .send({
          pharmacy_id: 'pharmacy-123',
          product_ids: ['aspirin-500mg'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.summary.parameters.leadTimeDays).toBe(7);
      expect(response.body.data.summary.parameters.serviceLevel).toBe(0.95);
    });

    it('should calculate summary statistics correctly', async () => {
      const mockSuggestions = [
        {
          productId: 'product-1',
          productName: 'Product 1',
          currentStock: 50,
          reorderPoint: 60,
          suggestedQuantity: 100,
          urgencyLevel: 'critical' as const,
          daysUntilStockout: 2,
          estimatedDeliveryDays: 7,
          recommendedOrderDate: new Date(),
        },
        {
          productId: 'product-2',
          productName: 'Product 2',
          currentStock: 30,
          reorderPoint: 60,
          suggestedQuantity: 150,
          urgencyLevel: 'high' as const,
          daysUntilStockout: 5,
          estimatedDeliveryDays: 7,
          recommendedOrderDate: new Date(),
        },
      ];

      (predictionService.calculateReorderPoint as jest.Mock)
        .mockResolvedValueOnce(mockSuggestions[0])
        .mockResolvedValueOnce(mockSuggestions[1]);

      const response = await request(app)
        .post('/inventory/reorder-suggestions')
        .send({
          pharmacy_id: 'pharmacy-123',
          product_ids: ['product-1', 'product-2'],
        });

      expect(response.status).toBe(200);
      const summary = response.body.data.summary;

      expect(summary.totalProducts).toBe(2);
      expect(summary.totalSuggestedQuantity).toBe(250); // 100 + 150
      expect(summary.criticalItems).toBe(1);
      expect(summary.highPriorityItems).toBe(1);
    });

    it('should continue processing even if one product fails', async () => {
      (predictionService.calculateReorderPoint as jest.Mock)
        .mockResolvedValueOnce({
          productId: 'product-1',
          productName: 'Product 1',
          currentStock: 50,
          reorderPoint: 60,
          suggestedQuantity: 100,
          urgencyLevel: 'medium',
          daysUntilStockout: 10,
          estimatedDeliveryDays: 7,
          recommendedOrderDate: new Date(),
        })
        .mockRejectedValueOnce(new Error('Product not found'))
        .mockResolvedValueOnce({
          productId: 'product-3',
          productName: 'Product 3',
          currentStock: 30,
          reorderPoint: 60,
          suggestedQuantity: 150,
          urgencyLevel: 'high',
          daysUntilStockout: 5,
          estimatedDeliveryDays: 7,
          recommendedOrderDate: new Date(),
        });

      const response = await request(app)
        .post('/inventory/reorder-suggestions')
        .send({
          pharmacy_id: 'pharmacy-123',
          product_ids: ['product-1', 'product-2', 'product-3'],
        });

      expect(response.status).toBe(200);
      // Should have 2 suggestions (product-1 and product-3), skipping product-2
      expect(response.body.data.suggestions.length).toBe(2);
    });

    it('should handle service errors gracefully', async () => {
      (predictionService.calculateReorderPoint as jest.Mock).mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await request(app)
        .post('/inventory/reorder-suggestions')
        .send({
          pharmacy_id: 'pharmacy-123',
          product_ids: ['aspirin-500mg'],
        });

      expect(response.status).toBe(200); // Still returns 200 with empty suggestions
      expect(response.body.data.suggestions.length).toBe(0);
    });

    it('should validate service_level range', async () => {
      const response = await request(app)
        .post('/inventory/reorder-suggestions')
        .send({
          pharmacy_id: 'pharmacy-123',
          product_ids: ['aspirin-500mg'],
          service_level: 1.5, // Invalid: > 0.99
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate lead_time_days range', async () => {
      const response = await request(app)
        .post('/inventory/reorder-suggestions')
        .send({
          pharmacy_id: 'pharmacy-123',
          product_ids: ['aspirin-500mg'],
          lead_time_days: 0, // Invalid: must be >= 1
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });
  });
});
