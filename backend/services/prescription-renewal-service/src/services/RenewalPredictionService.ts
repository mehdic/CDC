/**
 * Renewal Prediction Service
 * Business logic for AI-powered prescription renewal predictions
 * Task: T8-055
 */

import { DataSource, Repository, LessThan } from 'typeorm';
import { RenewalPrediction, PredictionStatus, ConfidenceLevel } from '../models/RenewalPrediction';

// ============================================================================
// DTOs
// ============================================================================

export interface CreatePredictionRequest {
  prescriptionId: string;
  patientId: string;
  pharmacyId: string;
  medicationData?: {
    medicationType: string;
    chronicCondition: boolean;
    dosage: string;
    quantity: number;
  };
}

export interface PredictionResult {
  predictedDate: Date;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  factors: {
    adherenceRate: number;
    refillHistory: number[];
    averageDaysBetweenRefills: number;
    medicationType: string;
    chronicCondition: boolean;
  };
}

export interface UpdatePredictionRequest {
  status?: PredictionStatus;
  approvedBy?: string;
  notes?: string;
}

// ============================================================================
// Service
// ============================================================================

export class RenewalPredictionService {
  private repository: Repository<RenewalPrediction>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(RenewalPrediction);
  }

  /**
   * Generate renewal prediction using ML model
   * For MVP: Uses rule-based prediction algorithm
   * Future: Replace with actual ML model (AWS Sagemaker)
   */
  async generatePrediction(request: CreatePredictionRequest): Promise<RenewalPrediction> {
    // Validate inputs
    if (!request.prescriptionId || !request.patientId || !request.pharmacyId) {
      throw new Error('Missing required fields: prescriptionId, patientId, pharmacyId');
    }

    // Get patient refill history (mock for MVP - would query actual database)
    const refillHistory = await this.getRefillHistory(request.patientId, request.prescriptionId);

    // Calculate prediction
    const predictionResult = this.calculatePrediction(refillHistory, request.medicationData);

    // Create prediction entity
    const prediction = this.repository.create({
      prescriptionId: request.prescriptionId,
      patientId: request.patientId,
      pharmacyId: request.pharmacyId,
      predictedDate: predictionResult.predictedDate,
      confidence: predictionResult.confidence,
      confidenceScore: predictionResult.confidenceScore,
      predictionFactors: predictionResult.factors,
      status: 'pending',
    });

    // Save and return
    return this.repository.save(prediction);
  }

  /**
   * Calculate prediction based on refill history and medication data
   * MVP: Rule-based algorithm
   * Future: Call ML model API
   */
  private calculatePrediction(
    refillHistory: number[],
    medicationData?: CreatePredictionRequest['medicationData']
  ): PredictionResult {
    // Calculate average days between refills
    const averageDays = refillHistory.length > 0
      ? refillHistory.reduce((a, b) => a + b, 0) / refillHistory.length
      : 30; // Default to 30 days

    // Calculate adherence rate (mock - would use actual adherence data)
    const adherenceRate = refillHistory.length > 0 ? 0.85 : 0.7;

    // Determine confidence level based on data quality
    let confidence: ConfidenceLevel = 'medium';
    let confidenceScore = 70;

    if (refillHistory.length >= 3) {
      confidence = 'high';
      confidenceScore = 90;
    } else if (refillHistory.length === 0) {
      confidence = 'low';
      confidenceScore = 50;
    }

    // Adjust for chronic conditions (higher confidence)
    if (medicationData?.chronicCondition) {
      confidenceScore = Math.min(100, confidenceScore + 10);
      if (confidenceScore >= 80) {
        confidence = 'high';
      }
    }

    // Calculate predicted renewal date
    const now = new Date();
    const predictedDate = new Date(now.getTime() + averageDays * 24 * 60 * 60 * 1000);

    return {
      predictedDate,
      confidence,
      confidenceScore,
      factors: {
        adherenceRate,
        refillHistory,
        averageDaysBetweenRefills: Math.round(averageDays),
        medicationType: medicationData?.medicationType || 'unknown',
        chronicCondition: medicationData?.chronicCondition || false,
      },
    };
  }

  /**
   * Get refill history for a patient's prescription
   * MVP: Returns mock data
   * Future: Query actual prescription refill database
   */
  private async getRefillHistory(patientId: string, _prescriptionId: string): Promise<number[]> {
    // Mock refill history (days between refills)
    // Future: Query actual database
    // SELECT EXTRACT(DAY FROM (dispensed_at - LAG(dispensed_at) OVER (ORDER BY dispensed_at)))
    // FROM prescriptions WHERE patient_id = ? AND prescription_id = ?

    // For MVP, return simulated data based on patient ID hash
    const hash = patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseInterval = 28 + (hash % 5); // 28-32 days

    return [baseInterval, baseInterval + 1, baseInterval - 1, baseInterval];
  }

  /**
   * Get prediction by ID
   */
  async getPredictionById(id: string): Promise<RenewalPrediction | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Get predictions for a patient
   */
  async getPredictionsForPatient(patientId: string): Promise<RenewalPrediction[]> {
    return this.repository.find({
      where: { patientId },
      order: { predictedDate: 'ASC' },
    });
  }

  /**
   * Get pending predictions for a pharmacy
   */
  async getPendingPredictionsForPharmacy(pharmacyId: string): Promise<RenewalPrediction[]> {
    return this.repository.find({
      where: {
        pharmacyId,
        status: 'pending',
      },
      order: { predictedDate: 'ASC' },
    });
  }

  /**
   * Update prediction status (approve/reject)
   */
  async updatePrediction(id: string, update: UpdatePredictionRequest): Promise<RenewalPrediction> {
    const prediction = await this.repository.findOne({ where: { id } });

    if (!prediction) {
      throw new Error(`Prediction not found: ${id}`);
    }

    if (update.status) {
      prediction.status = update.status;

      if (update.status === 'approved') {
        prediction.approvedBy = update.approvedBy;
        prediction.approvedAt = new Date();
      }
    }

    if (update.notes) {
      prediction.notes = update.notes;
    }

    return this.repository.save(prediction);
  }

  /**
   * Get predictions requiring attention (expiring soon)
   */
  async getPredictionsRequiringAttention(): Promise<RenewalPrediction[]> {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return this.repository.find({
      where: {
        status: 'pending',
        predictedDate: LessThan(threeDaysFromNow),
      },
      order: { predictedDate: 'ASC' },
    });
  }

  /**
   * Mark expired predictions
   */
  async markExpiredPredictions(): Promise<number> {
    const now = new Date();

    const result = await this.repository
      .createQueryBuilder()
      .update(RenewalPrediction)
      .set({ status: 'expired' })
      .where('status = :status', { status: 'pending' })
      .andWhere('predictedDate < :now', { now })
      .execute();

    return result.affected || 0;
  }
}
