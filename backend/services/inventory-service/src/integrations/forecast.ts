/**
 * AWS Forecast Integration
 * AI-powered demand forecasting for inventory management
 *
 * Features:
 * - Predict medication demand based on historical dispensing patterns
 * - Calculate optimal reorder quantities
 * - Identify seasonal trends
 *
 * INT-014: Full AWS Forecast integration with fallback to heuristic
 *
 * Production setup requires:
 * 1. Creating a forecast dataset in AWS Forecast
 * 2. Training a forecasting model
 * 3. Generating predictions via QueryForecast API
 */

import { AppDataSource } from '../index';
import { InventoryTransaction, TransactionType } from '../../../../shared/models/InventoryTransaction';
import { ForecastqueryClient, QueryForecastCommand } from '@aws-sdk/client-forecastquery';

export interface ForecastResult {
  medication_rxnorm_code: string;
  forecasted_demand: number; // Predicted quantity needed
  suggested_quantity: number; // Recommended reorder quantity
  confidence: number; // 0-100
  forecast_period_days: number;
  source: 'aws_forecast' | 'heuristic'; // INT-014: Track which method was used
}

// AWS Forecast configuration
const AWS_FORECAST_ENABLED = process.env.AWS_FORECAST_ENABLED === 'true';
const AWS_FORECAST_ARN = process.env.AWS_FORECAST_ARN || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS Forecast client if enabled
let forecastClient: ForecastqueryClient | null = null;
if (AWS_FORECAST_ENABLED && AWS_FORECAST_ARN) {
  forecastClient = new ForecastqueryClient({ region: AWS_REGION });
  console.log('[Forecast] AWS Forecast integration enabled');
} else {
  console.log('[Forecast] AWS Forecast disabled, using heuristic method');
}

/**
 * INT-014: Query AWS Forecast for demand prediction
 */
async function queryAWSForecast(
  medication_rxnorm_code: string,
  forecast_days: number
): Promise<{ forecasted_demand: number; confidence: number } | null> {
  if (!forecastClient || !AWS_FORECAST_ARN) {
    return null;
  }

  try {
    const command = new QueryForecastCommand({
      ForecastArn: AWS_FORECAST_ARN,
      Filters: {
        item_id: medication_rxnorm_code,
      },
    });

    const response = await forecastClient.send(command);

    // AWS Forecast returns predictions with p10, p50, p90 percentiles
    // Use p50 (median) as the forecasted demand
    const predictions = response.Forecast?.Predictions?.p50;

    if (!predictions || predictions.length === 0) {
      console.log(`[Forecast] No AWS predictions found for ${medication_rxnorm_code}`);
      return null;
    }

    // Sum predictions for the forecast period
    const forecastedDemand = predictions
      .slice(0, forecast_days)
      .reduce((sum, pred) => sum + (pred.Value || 0), 0);

    // Calculate confidence based on prediction spread (p90 - p10)
    const p10Values = response.Forecast?.Predictions?.p10 || [];
    const p90Values = response.Forecast?.Predictions?.p90 || [];

    let confidence = 90; // Default high confidence
    if (p10Values.length > 0 && p90Values.length > 0) {
      const spread = (p90Values[0].Value || 0) - (p10Values[0].Value || 0);
      const mean = predictions[0].Value || 1;
      const coefficientOfVariation = spread / mean;

      // Lower coefficient of variation = higher confidence
      confidence = Math.max(50, Math.min(99, Math.floor(100 - coefficientOfVariation * 50)));
    }

    console.log(`[Forecast] AWS prediction for ${medication_rxnorm_code}: ${Math.ceil(forecastedDemand)} units (${confidence}% confidence)`);

    return {
      forecasted_demand: Math.ceil(forecastedDemand),
      confidence,
    };
  } catch (error) {
    console.error('[Forecast] AWS Forecast API error:', error);
    return null;
  }
}

/**
 * Heuristic-based forecast using historical data
 * Fallback method when AWS Forecast is unavailable
 */
async function getHeuristicForecast(
  pharmacy_id: string,
  medication_rxnorm_code: string,
  forecast_days: number
): Promise<{ forecasted_demand: number; confidence: number; suggested_quantity: number } | null> {
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
      forecasted_demand: forecastedDemand,
      confidence,
      suggested_quantity: suggestedQuantity,
    };
  } catch (error) {
    console.error('[Forecast] Heuristic forecast error:', error);
    return null;
  }
}

/**
 * Get forecasted demand for a medication
 * INT-014: Uses AWS Forecast with fallback to heuristic
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
  // INT-014: Try AWS Forecast first
  if (AWS_FORECAST_ENABLED && forecastClient) {
    const awsForecast = await queryAWSForecast(medication_rxnorm_code, forecast_days);

    if (awsForecast) {
      // Calculate safety stock using AWS forecast
      const stdDev = awsForecast.forecasted_demand * 0.2; // Assume 20% standard deviation
      const safetyStock = Math.ceil(1.65 * stdDev * Math.sqrt(forecast_days));
      const suggestedQuantity = awsForecast.forecasted_demand + safetyStock;

      return {
        medication_rxnorm_code,
        forecasted_demand: awsForecast.forecasted_demand,
        suggested_quantity: suggestedQuantity,
        confidence: awsForecast.confidence,
        forecast_period_days: forecast_days,
        source: 'aws_forecast',
      };
    }

    console.log(`[Forecast] AWS Forecast unavailable, falling back to heuristic for ${medication_rxnorm_code}`);
  }

  // Fallback to heuristic method
  const heuristicForecast = await getHeuristicForecast(pharmacy_id, medication_rxnorm_code, forecast_days);

  if (!heuristicForecast) {
    return null;
  }

  return {
    medication_rxnorm_code,
    forecasted_demand: heuristicForecast.forecasted_demand,
    suggested_quantity: heuristicForecast.suggested_quantity,
    confidence: heuristicForecast.confidence,
    forecast_period_days: forecast_days,
    source: 'heuristic',
  };
}

/**
 * INT-014: AWS Forecast Setup Instructions
 *
 * To enable AWS Forecast predictions, complete the following setup:
 *
 * 1. Create Forecast Dataset:
 *    - Export historical transaction data to S3 (CSV format)
 *    - Create Forecast dataset with schema: timestamp, item_id, demand
 *    - Import historical data into dataset
 *
 * 2. Train Predictor:
 *    - Create Predictor with AutoML algorithm selection
 *    - Configure forecast horizon (30 days recommended)
 *    - Wait for training to complete (can take 1-3 hours)
 *
 * 3. Generate Forecast:
 *    - Create Forecast from trained Predictor
 *    - Wait for forecast generation to complete
 *    - Get Forecast ARN for querying
 *
 * 4. Configure Environment Variables:
 *    AWS_FORECAST_ENABLED=true
 *    AWS_FORECAST_ARN=arn:aws:forecast:us-east-1:ACCOUNT_ID:forecast/FORECAST_NAME
 *    AWS_REGION=us-east-1
 *    AWS_ACCESS_KEY_ID=your_access_key
 *    AWS_SECRET_ACCESS_KEY=your_secret_key
 *
 * 5. Service will automatically use AWS Forecast when available,
 *    falling back to heuristic method if AWS is unavailable.
 *
 * Cost estimate: ~$0.60 per 1000 forecasts (~$100/month for daily forecasts on all inventory)
 */
