/**
 * AWS Forecast Integration
 * AI-powered demand forecasting for inventory management
 *
 * Features:
 * - Predict medication demand based on historical dispensing patterns
 * - Calculate optimal reorder quantities
 * - Identify seasonal trends
 *
 * Note: This is a simplified implementation. Production use requires:
 * 1. Creating a forecast dataset in AWS Forecast
 * 2. Training a forecasting model
 * 3. Generating predictions via QueryForecast API
 *
 * For MVP, we'll use a simple heuristic based on historical data.
 * Full AWS Forecast integration can be added in Phase 2.
 */

import { AppDataSource } from '../index';
import { InventoryTransaction, TransactionType } from '../../../../shared/models/InventoryTransaction';

export interface ForecastResult {
  medication_rxnorm_code: string;
  forecasted_demand: number; // Predicted quantity needed
  suggested_quantity: number; // Recommended reorder quantity
  confidence: number; // 0-100
  forecast_period_days: number;
}

/**
 * Get forecasted demand for a medication
 *
 * MVP Implementation: Uses historical average with safety stock calculation
 *
 * Future Enhancement: Replace with AWS Forecast QueryForecast API
 *
 * @param pharmacy_id - Pharmacy UUID
 * @param medication_rxnorm_code - RxNorm code for medication
 * @param forecast_days - Number of days to forecast (default: 30)
 */
export async function getForecastedDemand(
  pharmacy_id: string,
  medication_rxnorm_code: string,
  forecast_days: number = 30
): Promise<ForecastResult | null> {
  try {
    const transactionRepository = AppDataSource.getRepository(InventoryTransaction);

    // Get historical dispensing data for last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const historicalTransactions = await transactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.inventory_item', 'item')
      .select('transaction.quantity_change', 'quantity_change')
      .addSelect('transaction.created_at', 'created_at')
      .where('transaction.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere('item.medication_rxnorm_code = :medication_rxnorm_code', { medication_rxnorm_code })
      .andWhere("transaction.transaction_type = 'dispense'")
      .andWhere('transaction.created_at >= :ninetyDaysAgo', { ninetyDaysAgo })
      .getRawMany();

    if (historicalTransactions.length === 0) {
      // No historical data, cannot forecast
      return null;
    }

    // Calculate average daily demand
    const totalDispensed = historicalTransactions.reduce(
      (sum, t) => sum + Math.abs(t.quantity_change),
      0
    );
    const daysOfData = 90;
    const avgDailyDemand = totalDispensed / daysOfData;

    // Forecast demand for the specified period
    const forecastedDemand = Math.ceil(avgDailyDemand * forecast_days);

    // Calculate standard deviation for safety stock
    const dailyDemands: number[] = [];

    // Group transactions by day
    const demandByDay = new Map<string, number>();
    for (const transaction of historicalTransactions) {
      const dayKey = new Date(transaction.created_at).toISOString().split('T')[0];
      const currentDemand = demandByDay.get(dayKey) || 0;
      demandByDay.set(dayKey, currentDemand + Math.abs(transaction.quantity_change));
    }

    dailyDemands.push(...demandByDay.values());

    const variance = dailyDemands.reduce((sum, demand) => {
      return sum + Math.pow(demand - avgDailyDemand, 2);
    }, 0) / (dailyDemands.length - 1);

    const stdDev = Math.sqrt(variance);

    // Safety stock: 1.65 * stdDev * sqrt(forecast_days) for 95% service level
    const safetyStock = Math.ceil(1.65 * stdDev * Math.sqrt(forecast_days));

    // Suggested reorder quantity: forecasted demand + safety stock
    const suggestedQuantity = forecastedDemand + safetyStock;

    // Confidence: Higher with more data points
    const confidence = Math.min(100, Math.floor((historicalTransactions.length / 30) * 100));

    return {
      medication_rxnorm_code,
      forecasted_demand: forecastedDemand,
      suggested_quantity: suggestedQuantity,
      confidence,
      forecast_period_days: forecast_days,
    };
  } catch (error) {
    console.error('[Forecast] Error:', error);
    return null;
  }
}

/**
 * TODO: AWS Forecast Integration (Phase 2)
 *
 * Full AWS Forecast implementation would include:
 *
 * 1. Create Dataset:
 *    - Export historical transaction data to S3
 *    - Create Forecast dataset with schema
 *
 * 2. Train Model:
 *    - Create Predictor with AutoML
 *    - Wait for training to complete
 *
 * 3. Generate Forecasts:
 *    - Create Forecast export
 *    - Query forecasts via QueryForecast API
 *
 * Example AWS Forecast API usage:
 *
 * ```typescript
 * import { ForecastQueryClient, QueryForecastCommand } from '@aws-sdk/client-forecastquery';
 *
 * const client = new ForecastQueryClient({ region: 'us-east-1' });
 *
 * const command = new QueryForecastCommand({
 *   ForecastArn: 'arn:aws:forecast:us-east-1:...',
 *   Filters: {
 *     item_id: medication_rxnorm_code,
 *   },
 * });
 *
 * const response = await client.send(command);
 * const forecastedDemand = response.Forecast?.Predictions?.p50?.[0]?.Value || 0;
 * ```
 */
