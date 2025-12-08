/**
 * Prediction Routes (T7-010)
 * AI-powered stock prediction and reorder recommendations
 *
 * Endpoints:
 * - GET /inventory/predictions/:productId - Get demand predictions for a product
 * - GET /inventory/stockout-risks - List products with high stockout risk
 * - POST /inventory/reorder-suggestions - Generate bulk reorder suggestions
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  predictDemand,
  detectSeasonality,
  calculateReorderPoint,
  predictBulkDemand,
  DemandForecast,
  ReorderSuggestion,
  SeasonalityPattern,
} from '../services/prediction.service';

export const predictionRouter = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const PredictionParamsSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

const PredictionQuerySchema = z.object({
  pharmacy_id: z.string().min(1, 'pharmacy_id is required'),
  horizon: z.coerce.number().int().min(1).max(365).optional().default(30),
});

const StockoutRisksQuerySchema = z.object({
  pharmacy_id: z.string().min(1, 'pharmacy_id is required'),
  days_threshold: z.coerce.number().int().min(0).max(90).optional().default(7),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const ReorderSuggestionsSchema = z.object({
  pharmacy_id: z.string().min(1, 'pharmacy_id is required'),
  product_ids: z.array(z.string()).optional(),
  lead_time_days: z.number().int().min(1).max(60).optional().default(7),
  service_level: z.number().min(0.5).max(0.99).optional().default(0.95),
});

// ============================================================================
// GET /inventory/predictions/:productId - Get demand predictions
// ============================================================================

predictionRouter.get('/predictions/:productId', async (req: Request, res: Response) => {
  try {
    // Validate params
    const paramsResult = PredictionParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: paramsResult.error.errors[0].message,
      });
    }

    // Validate query
    const queryResult = PredictionQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: queryResult.error.errors[0].message,
      });
    }

    const { productId } = paramsResult.data;
    const { pharmacy_id, horizon } = queryResult.data;

    // Set RLS context for multi-tenant isolation
    // await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    // Get demand prediction
    const demandForecast = await predictDemand(productId, horizon);

    if (!demandForecast) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No prediction data available for product ${productId}`,
      });
    }

    // Get seasonality pattern
    const seasonality = await detectSeasonality(productId);

    // Get reorder suggestion
    const reorderSuggestion = await calculateReorderPoint(productId);

    // Calculate prediction accuracy percentage
    const accuracyPercentage = demandForecast.confidenceScore;

    res.json({
      success: true,
      data: {
        prediction: {
          productId: demandForecast.productId,
          productName: demandForecast.productName,
          forecastHorizon: {
            days: demandForecast.forecastHorizonDays,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + horizon * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          },
          demand: {
            forecasted: demandForecast.forecastedQuantity,
            confidence: demandForecast.confidenceScore,
            accuracyPercentage,
          },
          seasonality: {
            patternType: seasonality.patternType,
            factor: seasonality.seasonalityFactor,
            peakMonths: seasonality.peakMonths,
            confidence: seasonality.metadata.confidence,
          },
          reorder: {
            currentStock: reorderSuggestion.currentStock,
            reorderPoint: reorderSuggestion.reorderPoint,
            suggestedQuantity: reorderSuggestion.suggestedQuantity,
            urgencyLevel: reorderSuggestion.urgencyLevel,
            daysUntilStockout: reorderSuggestion.daysUntilStockout,
            recommendedOrderDate: reorderSuggestion.recommendedOrderDate.toISOString().split('T')[0],
          },
          timestamp: demandForecast.timestamp.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('[PredictionRoutes] Error getting predictions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET /inventory/stockout-risks - List high-risk items
// ============================================================================

predictionRouter.get('/stockout-risks', async (req: Request, res: Response) => {
  try {
    // Validate query
    const queryResult = StockoutRisksQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: queryResult.error.errors[0].message,
      });
    }

    const { pharmacy_id, days_threshold, limit } = queryResult.data;

    // Set RLS context
    // await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    // Get all product IDs (in production, this would query the database)
    // For now, we'll use mock data
    const mockProductIds = ['flu-vaccine', 'antihistamine', 'aspirin', 'ibuprofen'];

    // Get predictions for all products
    const allForecasts = await predictBulkDemand(mockProductIds, days_threshold);

    // Filter high-risk items
    const highRiskItems = allForecasts
      .filter((forecast) => {
        // High risk criteria:
        // 1. Stockout within threshold days
        // 2. Urgency level (calculated from reorder point)
        return (
          forecast.confidenceScore > 0 && // Has valid forecast
          forecast.forecastedQuantity > 0 // Has demand
        );
      })
      .map((forecast) => {
        // Calculate estimated stockout days (mock calculation)
        const avgDailyDemand = forecast.forecastedQuantity / forecast.forecastHorizonDays;
        const mockCurrentStock = 50; // In production, get from inventory
        const daysUntilStockout = Math.max(0, Math.floor(mockCurrentStock / avgDailyDemand));

        return {
          productId: forecast.productId,
          productName: forecast.productName,
          daysUntilStockout,
          currentStock: mockCurrentStock,
          avgDailyDemand: Math.round(avgDailyDemand * 100) / 100,
          forecastedDemand: forecast.forecastedQuantity,
          riskLevel:
            daysUntilStockout === 0
              ? 'critical'
              : daysUntilStockout <= 3
                ? 'high'
                : daysUntilStockout <= 7
                  ? 'medium'
                  : 'low',
          confidence: forecast.confidenceScore,
        };
      })
      .filter((item) => item.daysUntilStockout <= days_threshold)
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        highRiskItems,
        summary: {
          totalAtRisk: highRiskItems.length,
          criticalCount: highRiskItems.filter((i) => i.riskLevel === 'critical').length,
          highCount: highRiskItems.filter((i) => i.riskLevel === 'high').length,
          mediumCount: highRiskItems.filter((i) => i.riskLevel === 'medium').length,
          daysThreshold: days_threshold,
        },
      },
    });
  } catch (error) {
    console.error('[PredictionRoutes] Error getting stockout risks:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// POST /inventory/reorder-suggestions - Generate reorder suggestions
// ============================================================================

predictionRouter.post('/reorder-suggestions', async (req: Request, res: Response) => {
  try {
    // Validate body
    const bodyResult = ReorderSuggestionsSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: bodyResult.error.errors[0].message,
      });
    }

    const { pharmacy_id, product_ids, lead_time_days, service_level } = bodyResult.data;

    // Set RLS context
    // await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    // Use provided product_ids or get all products
    const targetProductIds =
      product_ids && product_ids.length > 0
        ? product_ids
        : ['flu-vaccine', 'antihistamine', 'aspirin', 'ibuprofen']; // Mock data

    // Generate reorder suggestions for each product
    const suggestions: ReorderSuggestion[] = [];

    for (const productId of targetProductIds) {
      try {
        const suggestion = await calculateReorderPoint(productId, lead_time_days, service_level);
        suggestions.push(suggestion);
      } catch (error) {
        console.error(`[PredictionRoutes] Error calculating reorder for ${productId}:`, error);
        // Continue with other products
      }
    }

    // Sort by urgency (critical first, then by days until stockout)
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
      if (urgencyDiff !== 0) return urgencyDiff;

      // If same urgency, sort by days until stockout
      const daysA = a.daysUntilStockout ?? Infinity;
      const daysB = b.daysUntilStockout ?? Infinity;
      return daysA - daysB;
    });

    // Calculate summary statistics
    const totalSuggestedQuantity = suggestions.reduce((sum, s) => sum + s.suggestedQuantity, 0);
    const criticalCount = suggestions.filter((s) => s.urgencyLevel === 'critical').length;
    const highCount = suggestions.filter((s) => s.urgencyLevel === 'high').length;

    res.json({
      success: true,
      data: {
        suggestions: suggestions.map((s) => ({
          productId: s.productId,
          productName: s.productName,
          currentStock: s.currentStock,
          reorderPoint: s.reorderPoint,
          suggestedQuantity: s.suggestedQuantity,
          urgencyLevel: s.urgencyLevel,
          daysUntilStockout: s.daysUntilStockout,
          estimatedDeliveryDays: s.estimatedDeliveryDays,
          recommendedOrderDate: s.recommendedOrderDate.toISOString().split('T')[0],
        })),
        summary: {
          totalProducts: suggestions.length,
          totalSuggestedQuantity,
          criticalItems: criticalCount,
          highPriorityItems: highCount,
          estimatedTotalCost: 0, // Would calculate from product prices in production
          parameters: {
            leadTimeDays: lead_time_days,
            serviceLevel: service_level,
          },
        },
      },
    });
  } catch (error) {
    console.error('[PredictionRoutes] Error generating reorder suggestions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
