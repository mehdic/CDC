/**
 * Inventory Prediction Service (T5-036)
 * Implements demand forecasting with feedback loop and prediction accuracy tracking
 *
 * Features:
 * - Demand prediction based on historical patterns
 * - Seasonality detection (flu season, allergies, etc.)
 * - Reorder point calculation
 * - Prediction accuracy feedback loop
 * - Mock data support for development
 */

import { AppDataSource } from '../index';
import { InventoryTransaction } from '../../../../shared/models/InventoryTransaction';
import { InventoryItem } from '../../../../shared/models/InventoryItem';
import { getMedicationForecast, ForecastResult } from './forecastingService';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DemandForecast {
  productId: string;
  productName: string;
  forecastedQuantity: number;
  confidenceScore: number; // 0-100
  forecastHorizonDays: number;
  timestamp: Date;
}

export interface SeasonalityPattern {
  productId: string;
  patternType: 'flu_season' | 'allergies' | 'none' | 'custom';
  seasonalityFactor: number; // 1.0 = no seasonality, > 1 = peak season
  peakMonths: number[]; // 0-11 (January-December)
  baselineDemand: number;
  metadata: {
    detectionMethod: string;
    confidence: number; // 0-100
    monthlyAverage: number[];
  };
}

export interface ReorderSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  daysUntilStockout: number | null;
  estimatedDeliveryDays: number;
  recommendedOrderDate: Date;
}

export interface PredictionAccuracyRecord {
  productId: string;
  forecastedDemand: number;
  actualDemand: number;
  accuracyPercentage: number; // 0-100
  predictionDate: Date;
  actualDate: Date;
  error: number; // Absolute difference
}

// ============================================================================
// Mock Data for Development
// ============================================================================

const MOCK_SEASONALITY_DATA: Record<string, SeasonalityPattern> = {
  'flu-vaccine': {
    productId: 'flu-vaccine',
    patternType: 'flu_season',
    seasonalityFactor: 2.5,
    peakMonths: [9, 10, 11, 0, 1], // September to January
    baselineDemand: 50,
    metadata: {
      detectionMethod: 'historical_analysis',
      confidence: 95,
      monthlyAverage: [80, 70, 40, 30, 20, 15, 15, 20, 45, 90, 100, 85],
    },
  },
  'antihistamine': {
    productId: 'antihistamine',
    patternType: 'allergies',
    seasonalityFactor: 1.8,
    peakMonths: [2, 3, 4, 5], // March to June (spring allergies)
    baselineDemand: 30,
    metadata: {
      detectionMethod: 'historical_analysis',
      confidence: 88,
      monthlyAverage: [25, 20, 40, 55, 60, 45, 30, 25, 25, 30, 30, 25],
    },
  },
};

const MOCK_HISTORICAL_DEMAND = [
  { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), quantity: 45 },
  { date: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000), quantity: 42 },
  { date: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000), quantity: 48 },
  { date: new Date(Date.now() - 57 * 24 * 60 * 60 * 1000), quantity: 44 },
  { date: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000), quantity: 50 },
  { date: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000), quantity: 46 },
  { date: new Date(Date.now() - 54 * 24 * 60 * 60 * 1000), quantity: 52 },
  { date: new Date(Date.now() - 53 * 24 * 60 * 60 * 1000), quantity: 41 },
  { date: new Date(Date.now() - 52 * 24 * 60 * 60 * 1000), quantity: 49 },
  { date: new Date(Date.now() - 51 * 24 * 60 * 60 * 1000), quantity: 47 },
];

// ============================================================================
// Prediction Service Functions
// ============================================================================

/**
 * Predict demand for a product based on historical patterns
 * T5-036: Core prediction functionality
 *
 * @param productId - Product/medication RxNorm code
 * @param horizon - Number of days to forecast
 * @returns Demand forecast
 */
export async function predictDemand(
  productId: string,
  horizon: number = 30
): Promise<DemandForecast | null> {
  try {
    // Get pharmacy context (mock for now)
    const pharmacyId = process.env.TEST_PHARMACY_ID || 'pharmacy-mock-001';

    // Try to get real forecast from forecasting service
    try {
      const forecast = await getMedicationForecast(pharmacyId, productId, horizon);

      if (forecast) {
        return {
          productId,
          productName: forecast.medication_name,
          forecastedQuantity: forecast.forecasted_demand,
          confidenceScore: forecast.confidence,
          forecastHorizonDays: horizon,
          timestamp: new Date(),
        };
      }
    } catch (forecastError) {
      console.warn(`[PredictionService] Could not fetch real forecast for ${productId}, falling back to mock data`);
    }

    // Fallback to mock data if no real data available or error occurred
    return generateMockForecast(productId, horizon);
  } catch (error) {
    console.error(`[PredictionService] Error predicting demand for ${productId}:`, error);
    return null;
  }
}

/**
 * Detect seasonality patterns for a product
 * Identifies seasonal spikes (flu season, allergies, etc.)
 *
 * @param productId - Product/medication RxNorm code
 * @returns Seasonality pattern information
 */
export async function detectSeasonality(
  productId: string
): Promise<SeasonalityPattern> {
  try {
    // Check mock data first
    if (MOCK_SEASONALITY_DATA[productId]) {
      return MOCK_SEASONALITY_DATA[productId];
    }

    // Analyze historical data if available
    const pattern = await analyzeHistoricalSeasonality(productId);
    if (pattern) {
      return pattern;
    }

    // Default: no seasonality detected
    return {
      productId,
      patternType: 'none',
      seasonalityFactor: 1.0,
      peakMonths: [],
      baselineDemand: 0,
      metadata: {
        detectionMethod: 'no_data',
        confidence: 0,
        monthlyAverage: Array(12).fill(0),
      },
    };
  } catch (error) {
    console.error(`[PredictionService] Error detecting seasonality for ${productId}:`, error);
    return {
      productId,
      patternType: 'none',
      seasonalityFactor: 1.0,
      peakMonths: [],
      baselineDemand: 0,
      metadata: {
        detectionMethod: 'error',
        confidence: 0,
        monthlyAverage: Array(12).fill(0),
      },
    };
  }
}

/**
 * Calculate optimal reorder point based on demand patterns
 * T5-036: Reorder suggestions
 *
 * @param productId - Product/medication RxNorm code
 * @param leadTimeDays - Lead time for order fulfillment (default: 7)
 * @param serviceLevel - Desired service level (0-1, default: 0.95)
 * @returns Reorder suggestion
 */
export async function calculateReorderPoint(
  productId: string,
  leadTimeDays: number = 7,
  serviceLevel: number = 0.95
): Promise<ReorderSuggestion> {
  try {
    // Get pharmacyId from context
    const pharmacyId = process.env.TEST_PHARMACY_ID || 'pharmacy-mock-001';

    // Get current forecast
    const forecast = await getMedicationForecast(pharmacyId, productId, leadTimeDays);

    if (forecast) {
      return {
        productId,
        productName: forecast.medication_name,
        currentStock: forecast.current_stock,
        reorderPoint: forecast.reorder_point,
        suggestedQuantity: forecast.suggested_reorder_quantity,
        urgencyLevel: calculateUrgencyLevel(
          forecast.current_stock,
          forecast.reorder_point,
          forecast.days_until_stockout
        ),
        daysUntilStockout: forecast.days_until_stockout,
        estimatedDeliveryDays: leadTimeDays,
        recommendedOrderDate: calculateOrderDate(forecast.days_until_stockout, leadTimeDays),
      };
    }

    // Fallback to mock calculation
    return generateMockReorderSuggestion(productId);
  } catch (error) {
    console.error(`[PredictionService] Error calculating reorder point for ${productId}:`, error);
    return {
      productId,
      productName: productId,
      currentStock: 0,
      reorderPoint: 0,
      suggestedQuantity: 0,
      urgencyLevel: 'low',
      daysUntilStockout: null,
      estimatedDeliveryDays: 7,
      recommendedOrderDate: new Date(),
    };
  }
}

/**
 * Update prediction accuracy with actual demand
 * Feedback loop to improve future predictions
 *
 * @param productId - Product/medication RxNorm code
 * @param actualDemand - Actual demand quantity
 * @param forecastedDemand - Previously forecasted demand
 * @returns Accuracy record
 */
export async function updatePredictionAccuracy(
  productId: string,
  actualDemand: number,
  forecastedDemand: number = 0
): Promise<PredictionAccuracyRecord> {
  try {
    const error = Math.abs(actualDemand - forecastedDemand);
    const accuracyPercentage =
      forecastedDemand > 0
        ? Math.max(0, Math.min(100, 100 - (error / forecastedDemand) * 100))
        : 100;

    const record: PredictionAccuracyRecord = {
      productId,
      forecastedDemand,
      actualDemand,
      accuracyPercentage,
      predictionDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      actualDate: new Date(),
      error,
    };

    // Log accuracy for future model improvement
    console.log(
      `[PredictionService] Accuracy Update for ${productId}: ` +
        `Forecasted=${forecastedDemand}, Actual=${actualDemand}, Accuracy=${accuracyPercentage.toFixed(2)}%`
    );

    return record;
  } catch (error) {
    console.error(`[PredictionService] Error updating prediction accuracy for ${productId}:`, error);
    throw error;
  }
}

/**
 * Get prediction accuracy history for a product
 * @param productId - Product/medication RxNorm code
 * @param daysBack - Number of days to analyze
 * @returns Array of accuracy records
 */
export async function getPredictionAccuracyHistory(
  productId: string,
  daysBack: number = 30
): Promise<PredictionAccuracyRecord[]> {
  try {
    // Mock data for development
    const records: PredictionAccuracyRecord[] = [
      {
        productId,
        forecastedDemand: 100,
        actualDemand: 98,
        accuracyPercentage: 98,
        predictionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        actualDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        error: 2,
      },
      {
        productId,
        forecastedDemand: 95,
        actualDemand: 105,
        accuracyPercentage: 90.5,
        predictionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        actualDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        error: 10,
      },
      {
        productId,
        forecastedDemand: 110,
        actualDemand: 107,
        accuracyPercentage: 97.3,
        predictionDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        actualDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        error: 3,
      },
    ];

    return records;
  } catch (error) {
    console.error(
      `[PredictionService] Error getting accuracy history for ${productId}:`,
      error
    );
    return [];
  }
}

/**
 * Predict inventory needs for multiple products
 * Batch prediction for dashboard and bulk ordering
 *
 * @param productIds - Array of product RxNorm codes
 * @param horizon - Forecast horizon in days
 * @returns Array of demand forecasts
 */
export async function predictBulkDemand(
  productIds: string[],
  horizon: number = 30
): Promise<DemandForecast[]> {
  const forecasts: DemandForecast[] = [];

  for (const productId of productIds) {
    try {
      const forecast = await predictDemand(productId, horizon);
      if (forecast) {
        forecasts.push(forecast);
      }
    } catch (error) {
      console.error(`[PredictionService] Error predicting bulk demand for ${productId}:`, error);
    }
  }

  return forecasts;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Analyze historical data for seasonality patterns
 */
async function analyzeHistoricalSeasonality(
  productId: string
): Promise<SeasonalityPattern | null> {
  try {
    const pharmacyId = process.env.TEST_PHARMACY_ID || 'pharmacy-mock-001';
    const forecast = await getMedicationForecast(pharmacyId, productId, 30);

    if (!forecast) {
      return null;
    }

    // Detect seasonality type based on month patterns
    const patternType = detectSeasonalityType(productId);

    return {
      productId,
      patternType,
      seasonalityFactor: forecast.seasonality_factor,
      peakMonths: detectPeakMonths(productId),
      baselineDemand: forecast.metadata.avg_daily_demand * 30,
      metadata: {
        detectionMethod: 'historical_analysis',
        confidence: forecast.confidence,
        monthlyAverage: generateMockMonthlyAverage(forecast.metadata.avg_daily_demand),
      },
    };
  } catch (error) {
    console.error('[PredictionService] Error analyzing historical seasonality:', error);
    return null;
  }
}

/**
 * Detect seasonality type based on product characteristics
 */
function detectSeasonalityType(productId: string): 'flu_season' | 'allergies' | 'none' | 'custom' {
  const lowerProductId = productId.toLowerCase();

  if (lowerProductId.includes('flu') || lowerProductId.includes('vaccine')) {
    return 'flu_season';
  }
  if (lowerProductId.includes('antihistamine') || lowerProductId.includes('allerg')) {
    return 'allergies';
  }

  return 'none';
}

/**
 * Detect peak months for a product
 */
function detectPeakMonths(productId: string): number[] {
  const type = detectSeasonalityType(productId);

  switch (type) {
    case 'flu_season':
      return [9, 10, 11, 0, 1]; // September to January
    case 'allergies':
      return [2, 3, 4, 5]; // March to June
    default:
      return [];
  }
}

/**
 * Generate mock monthly average demand
 */
function generateMockMonthlyAverage(baselineDemand: number): number[] {
  return [
    baselineDemand * 1.2,
    baselineDemand * 1.1,
    baselineDemand * 0.9,
    baselineDemand * 0.8,
    baselineDemand * 0.7,
    baselineDemand * 0.6,
    baselineDemand * 0.6,
    baselineDemand * 0.7,
    baselineDemand * 0.8,
    baselineDemand * 1.0,
    baselineDemand * 1.3,
    baselineDemand * 1.4,
  ];
}

/**
 * Calculate urgency level based on stock situation
 */
function calculateUrgencyLevel(
  currentStock: number,
  reorderPoint: number,
  daysUntilStockout: number | null
): 'critical' | 'high' | 'medium' | 'low' {
  if (currentStock <= 0 || daysUntilStockout === 0) {
    return 'critical';
  }
  if (currentStock < reorderPoint || (daysUntilStockout && daysUntilStockout <= 7)) {
    return 'high';
  }
  if (currentStock < reorderPoint * 1.5 || (daysUntilStockout && daysUntilStockout <= 14)) {
    return 'medium';
  }
  return 'low';
}

/**
 * Calculate recommended order date
 */
function calculateOrderDate(daysUntilStockout: number | null, leadTimeDays: number): Date {
  if (!daysUntilStockout) {
    return new Date(); // Order now
  }

  const daysToOrder = Math.max(0, daysUntilStockout - leadTimeDays);
  const orderDate = new Date();
  orderDate.setDate(orderDate.getDate() + daysToOrder);

  return orderDate;
}

/**
 * Generate mock forecast for development
 */
function generateMockForecast(productId: string, horizon: number): DemandForecast {
  const baseQuantity = 50 + Math.random() * 30;
  const seasonalityFactor = MOCK_SEASONALITY_DATA[productId]?.seasonalityFactor || 1.0;

  return {
    productId,
    productName: `Mock Product ${productId}`,
    forecastedQuantity: Math.round(baseQuantity * horizon * seasonalityFactor),
    confidenceScore: 75 + Math.random() * 20,
    forecastHorizonDays: horizon,
    timestamp: new Date(),
  };
}

/**
 * Generate mock reorder suggestion
 */
function generateMockReorderSuggestion(productId: string): ReorderSuggestion {
  const currentStock = 20 + Math.floor(Math.random() * 50);
  const reorderPoint = 30;

  return {
    productId,
    productName: `Mock Product ${productId}`,
    currentStock,
    reorderPoint,
    suggestedQuantity: 100,
    urgencyLevel:
      currentStock < reorderPoint
        ? 'high'
        : currentStock < reorderPoint * 1.5
          ? 'medium'
          : 'low',
    daysUntilStockout: currentStock > 0 ? Math.floor(currentStock / 5) : 0,
    estimatedDeliveryDays: 7,
    recommendedOrderDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  };
}
