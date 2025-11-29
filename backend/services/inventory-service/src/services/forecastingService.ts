/**
 * ML-Based Inventory Forecasting Service (T3-104)
 * Advanced demand forecasting with seasonality, trends, and day-of-week patterns
 *
 * Features:
 * - Historical sales data analysis
 * - Seasonality detection (monthly patterns)
 * - Day-of-week patterns (weekday vs weekend)
 * - Trend analysis (growing vs declining demand)
 * - Safety stock calculation
 * - Reorder point recommendations
 *
 * Based on: /specs/003-production-readiness/tasks3.md
 */

import { AppDataSource } from '../index';
import { InventoryTransaction } from '../../../../shared/models/InventoryTransaction';
import { InventoryItem } from '../../../../shared/models/InventoryItem';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ForecastResult {
  medication_rxnorm_code: string;
  medication_name: string;
  forecasted_demand: number; // Predicted quantity for forecast period
  suggested_reorder_quantity: number; // Recommended quantity to order
  reorder_point: number; // Stock level to trigger reorder
  safety_stock: number; // Buffer stock to prevent stockouts
  confidence: number; // 0-100 (higher = more reliable forecast)
  forecast_period_days: number;
  current_stock: number;
  days_until_stockout: number | null; // Estimated days until stockout
  seasonality_factor: number; // 1.0 = no seasonality, > 1 = peak season
  trend: 'growing' | 'stable' | 'declining';
  metadata: {
    historical_days_analyzed: number;
    avg_daily_demand: number;
    demand_variability: number; // Coefficient of variation
    last_restock_date: Date | null;
  };
}

export interface DemandPattern {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  avgDemand: number;
  factor: number; // Multiplier relative to overall average
}

// ============================================================================
// ML-Based Forecasting Service
// ============================================================================

/**
 * Get ML-based demand forecast for a medication
 * T3-104: Implements comprehensive forecasting with seasonality and trends
 *
 * @param pharmacy_id - Pharmacy UUID
 * @param medication_rxnorm_code - RxNorm code for medication
 * @param forecast_days - Number of days to forecast (default: 30)
 * @returns Comprehensive forecast result with recommendations
 */
export async function getMedicationForecast(
  pharmacy_id: string,
  medication_rxnorm_code: string,
  forecast_days: number = 30
): Promise<ForecastResult | null> {
  try {
    // Get historical data (180 days for better seasonality detection)
    const historicalData = await getHistoricalDemand(pharmacy_id, medication_rxnorm_code, 180);

    if (historicalData.length === 0) {
      console.log(`[Forecast] No historical data for ${medication_rxnorm_code}`);
      return null;
    }

    // Get current inventory
    const currentStock = await getCurrentStock(pharmacy_id, medication_rxnorm_code);

    // Calculate base statistics
    const baseStats = calculateBaseStatistics(historicalData);

    // Detect day-of-week patterns
    const dayOfWeekPatterns = analyzeDayOfWeekPatterns(historicalData);

    // Detect seasonality (monthly patterns)
    const seasonalityFactor = calculateSeasonalityFactor(historicalData);

    // Detect trend
    const trend = detectTrend(historicalData);

    // Calculate forecasted demand with all factors
    const forecastedDemand = calculateForecastedDemand(
      baseStats.avgDailyDemand,
      forecast_days,
      seasonalityFactor,
      trend,
      dayOfWeekPatterns
    );

    // Calculate safety stock (95% service level)
    const safetyStock = calculateSafetyStock(
      baseStats.stdDev,
      forecast_days,
      0.95 // 95% service level
    );

    // Calculate reorder point
    const reorderPoint = Math.ceil(forecastedDemand * 0.3 + safetyStock);

    // Suggested reorder quantity: forecasted demand + safety stock
    const suggestedReorderQuantity = Math.ceil(forecastedDemand + safetyStock);

    // Calculate days until stockout
    const daysUntilStockout = baseStats.avgDailyDemand > 0
      ? Math.floor(currentStock / baseStats.avgDailyDemand)
      : null;

    // Calculate confidence score
    const confidence = calculateConfidence(
      historicalData.length,
      baseStats.coefficientOfVariation,
      baseStats.daysOfData
    );

    // Get medication name
    const medicationName = await getMedicationName(pharmacy_id, medication_rxnorm_code);

    return {
      medication_rxnorm_code,
      medication_name: medicationName || medication_rxnorm_code,
      forecasted_demand: Math.ceil(forecastedDemand),
      suggested_reorder_quantity: suggestedReorderQuantity,
      reorder_point: reorderPoint,
      safety_stock: Math.ceil(safetyStock),
      confidence,
      forecast_period_days: forecast_days,
      current_stock: currentStock,
      days_until_stockout: daysUntilStockout,
      seasonality_factor: seasonalityFactor,
      trend,
      metadata: {
        historical_days_analyzed: baseStats.daysOfData,
        avg_daily_demand: parseFloat(baseStats.avgDailyDemand.toFixed(2)),
        demand_variability: parseFloat(baseStats.coefficientOfVariation.toFixed(2)),
        last_restock_date: baseStats.lastRestockDate,
      },
    };
  } catch (error) {
    console.error('[ForecastService] Error generating forecast:', error);
    return null;
  }
}

/**
 * Get forecasts for all medications in a pharmacy
 * Useful for dashboard and bulk reordering
 */
export async function getAllMedicationForecasts(
  pharmacy_id: string,
  forecast_days: number = 30,
  minStockOnly: boolean = false
): Promise<ForecastResult[]> {
  try {
    // Get all medications with inventory
    const inventoryRepo = AppDataSource.getRepository(InventoryItem);
    const items = await inventoryRepo.find({
      where: { pharmacy_id },
      select: ['medication_rxnorm_code'],
    });

    const forecasts: ForecastResult[] = [];

    for (const item of items) {
      const forecast = await getMedicationForecast(
        pharmacy_id,
        item.medication_rxnorm_code,
        forecast_days
      );

      if (forecast) {
        // Filter: only include items below reorder point if requested
        if (minStockOnly && forecast.current_stock > forecast.reorder_point) {
          continue;
        }
        forecasts.push(forecast);
      }
    }

    // Sort by urgency (days until stockout)
    forecasts.sort((a, b) => {
      if (a.days_until_stockout === null) return 1;
      if (b.days_until_stockout === null) return -1;
      return a.days_until_stockout - b.days_until_stockout;
    });

    return forecasts;
  } catch (error) {
    console.error('[ForecastService] Error generating bulk forecasts:', error);
    return [];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get historical demand data from transaction log
 */
async function getHistoricalDemand(
  pharmacy_id: string,
  medication_rxnorm_code: string,
  days: number
): Promise<InventoryTransaction[]> {
  const transactionRepo = AppDataSource.getRepository(InventoryTransaction);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return transactionRepo
    .createQueryBuilder('transaction')
    .leftJoin('transaction.inventory_item', 'item')
    .where('transaction.pharmacy_id = :pharmacy_id', { pharmacy_id })
    .andWhere('item.medication_rxnorm_code = :medication_rxnorm_code', { medication_rxnorm_code })
    .andWhere("transaction.transaction_type = 'dispense'")
    .andWhere('transaction.created_at >= :startDate', { startDate })
    .orderBy('transaction.created_at', 'ASC')
    .getMany();
}

/**
 * Get current stock level
 */
async function getCurrentStock(
  pharmacy_id: string,
  medication_rxnorm_code: string
): Promise<number> {
  const inventoryRepo = AppDataSource.getRepository(InventoryItem);

  const item = await inventoryRepo.findOne({
    where: { pharmacy_id, medication_rxnorm_code },
  });

  return item?.quantity_in_stock || 0;
}

/**
 * Get medication name from inventory
 */
async function getMedicationName(
  pharmacy_id: string,
  medication_rxnorm_code: string
): Promise<string | null> {
  const inventoryRepo = AppDataSource.getRepository(InventoryItem);

  const item = await inventoryRepo.findOne({
    where: { pharmacy_id, medication_rxnorm_code },
    select: ['medication_name'],
  });

  return item?.medication_name || null;
}

/**
 * Calculate base statistics from historical data
 */
function calculateBaseStatistics(transactions: InventoryTransaction[]): {
  avgDailyDemand: number;
  stdDev: number;
  coefficientOfVariation: number;
  daysOfData: number;
  totalDemand: number;
  lastRestockDate: Date | null;
} {
  // Group transactions by day
  const demandByDay = new Map<string, number>();

  for (const transaction of transactions) {
    const dayKey = new Date(transaction.created_at).toISOString().split('T')[0];
    const currentDemand = demandByDay.get(dayKey) || 0;
    demandByDay.set(dayKey, currentDemand + Math.abs(transaction.quantity_change));
  }

  const dailyDemands = Array.from(demandByDay.values());
  const daysOfData = dailyDemands.length;

  if (daysOfData === 0) {
    return {
      avgDailyDemand: 0,
      stdDev: 0,
      coefficientOfVariation: 0,
      daysOfData: 0,
      totalDemand: 0,
      lastRestockDate: null,
    };
  }

  // Calculate average
  const totalDemand = dailyDemands.reduce((sum, demand) => sum + demand, 0);
  const avgDailyDemand = totalDemand / daysOfData;

  // Calculate standard deviation
  const variance = dailyDemands.reduce((sum, demand) => {
    return sum + Math.pow(demand - avgDailyDemand, 2);
  }, 0) / daysOfData;

  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (CV = std dev / mean)
  const coefficientOfVariation = avgDailyDemand > 0 ? stdDev / avgDailyDemand : 0;

  // Get last restock date
  const restockTransactions = transactions.filter(t => t.transaction_type === 'restock');
  const lastRestockDate = restockTransactions.length > 0
    ? restockTransactions[restockTransactions.length - 1].created_at
    : null;

  return {
    avgDailyDemand,
    stdDev,
    coefficientOfVariation,
    daysOfData,
    totalDemand,
    lastRestockDate,
  };
}

/**
 * Analyze day-of-week demand patterns
 * Returns demand multipliers for each day of the week
 */
function analyzeDayOfWeekPatterns(transactions: InventoryTransaction[]): DemandPattern[] {
  const demandByDayOfWeek = new Map<number, number[]>();

  // Initialize all days
  for (let i = 0; i < 7; i++) {
    demandByDayOfWeek.set(i, []);
  }

  // Group transactions by day of week
  for (const transaction of transactions) {
    const date = new Date(transaction.created_at);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const demand = Math.abs(transaction.quantity_change);

    demandByDayOfWeek.get(dayOfWeek)!.push(demand);
  }

  // Calculate average demand for each day
  const patterns: DemandPattern[] = [];
  let overallAvg = 0;
  let totalDays = 0;

  for (let i = 0; i < 7; i++) {
    const demands = demandByDayOfWeek.get(i)!;
    const avgDemand = demands.length > 0
      ? demands.reduce((sum, d) => sum + d, 0) / demands.length
      : 0;

    patterns.push({
      dayOfWeek: i,
      avgDemand,
      factor: 1.0, // Will be calculated after overall average
    });

    overallAvg += avgDemand * demands.length;
    totalDays += demands.length;
  }

  overallAvg = totalDays > 0 ? overallAvg / totalDays : 0;

  // Calculate multiplier factors
  for (const pattern of patterns) {
    pattern.factor = overallAvg > 0 ? pattern.avgDemand / overallAvg : 1.0;
  }

  return patterns;
}

/**
 * Calculate seasonality factor for current month
 * Compares current month's demand to overall average
 */
function calculateSeasonalityFactor(transactions: InventoryTransaction[]): number {
  const demandByMonth = new Map<number, number>();

  // Group transactions by month
  for (const transaction of transactions) {
    const month = new Date(transaction.created_at).getMonth(); // 0-11
    const demand = Math.abs(transaction.quantity_change);

    demandByMonth.set(month, (demandByMonth.get(month) || 0) + demand);
  }

  if (demandByMonth.size === 0) {
    return 1.0; // No seasonality detected
  }

  // Calculate overall average demand per month
  const totalDemand = Array.from(demandByMonth.values()).reduce((sum, d) => sum + d, 0);
  const avgMonthlyDemand = totalDemand / demandByMonth.size;

  // Get current month's demand
  const currentMonth = new Date().getMonth();
  const currentMonthDemand = demandByMonth.get(currentMonth) || avgMonthlyDemand;

  // Calculate seasonality factor (current month vs average)
  const seasonalityFactor = avgMonthlyDemand > 0
    ? currentMonthDemand / avgMonthlyDemand
    : 1.0;

  // Cap seasonality factor between 0.5 and 2.0
  return Math.max(0.5, Math.min(2.0, seasonalityFactor));
}

/**
 * Detect demand trend over time
 */
function detectTrend(transactions: InventoryTransaction[]): 'growing' | 'stable' | 'declining' {
  if (transactions.length < 30) {
    return 'stable'; // Not enough data for trend detection
  }

  // Split data into two halves
  const midpoint = Math.floor(transactions.length / 2);
  const firstHalf = transactions.slice(0, midpoint);
  const secondHalf = transactions.slice(midpoint);

  const firstHalfDemand = firstHalf.reduce((sum, t) => sum + Math.abs(t.quantity_change), 0);
  const secondHalfDemand = secondHalf.reduce((sum, t) => sum + Math.abs(t.quantity_change), 0);

  const firstHalfAvg = firstHalfDemand / firstHalf.length;
  const secondHalfAvg = secondHalfDemand / secondHalf.length;

  // Calculate percentage change
  const percentChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  // Threshold: ±15% for trend detection
  if (percentChange > 15) {
    return 'growing';
  } else if (percentChange < -15) {
    return 'declining';
  } else {
    return 'stable';
  }
}

/**
 * Calculate forecasted demand with all factors
 */
function calculateForecastedDemand(
  avgDailyDemand: number,
  forecastDays: number,
  seasonalityFactor: number,
  trend: 'growing' | 'stable' | 'declining',
  dayOfWeekPatterns: DemandPattern[]
): number {
  // Base forecast
  let baseForecast = avgDailyDemand * forecastDays;

  // Apply seasonality
  baseForecast *= seasonalityFactor;

  // Apply trend adjustment
  const trendMultipliers = {
    growing: 1.1, // 10% increase for growing trend
    stable: 1.0,
    declining: 0.9, // 10% decrease for declining trend
  };
  baseForecast *= trendMultipliers[trend];

  // Apply day-of-week pattern (average factor for forecast period)
  const avgDayFactor = dayOfWeekPatterns.reduce((sum, p) => sum + p.factor, 0) / 7;
  baseForecast *= avgDayFactor;

  return baseForecast;
}

/**
 * Calculate safety stock using statistical approach
 * Safety Stock = Z-score × σ × √(Lead Time)
 *
 * @param stdDev - Standard deviation of daily demand
 * @param leadTimeDays - Lead time in days (forecast period)
 * @param serviceLevel - Target service level (e.g., 0.95 for 95%)
 * @returns Safety stock quantity
 */
function calculateSafetyStock(
  stdDev: number,
  leadTimeDays: number,
  serviceLevel: number
): number {
  // Z-scores for common service levels
  const zScores: Record<number, number> = {
    0.90: 1.28,
    0.95: 1.65,
    0.99: 2.33,
  };

  const zScore = zScores[serviceLevel] || 1.65; // Default to 95%

  // Safety stock formula
  const safetyStock = zScore * stdDev * Math.sqrt(leadTimeDays);

  return safetyStock;
}

/**
 * Calculate confidence score based on data quality
 *
 * @param transactionCount - Number of historical transactions
 * @param coefficientOfVariation - Demand variability (std dev / mean)
 * @param daysOfData - Number of days in historical data
 * @returns Confidence score (0-100)
 */
function calculateConfidence(
  transactionCount: number,
  coefficientOfVariation: number,
  daysOfData: number
): number {
  // Factor 1: Data quantity (more transactions = higher confidence)
  const transactionScore = Math.min(100, (transactionCount / 50) * 100);

  // Factor 2: Data coverage (more days = higher confidence)
  const coverageScore = Math.min(100, (daysOfData / 90) * 100);

  // Factor 3: Demand stability (lower CV = higher confidence)
  // CV < 0.3 = very stable (100%), CV > 1.0 = very variable (0%)
  const stabilityScore = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));

  // Weighted average
  const confidence = (transactionScore * 0.3) + (coverageScore * 0.4) + (stabilityScore * 0.3);

  return Math.round(confidence);
}
