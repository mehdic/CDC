/**
 * Risk Prediction Service
 * Main service coordinating risk assessment, alerts, and trends
 */

import type {
  PatientData,
  RiskAssessment,
  RiskAlert,
  RiskTrend,
  AssessRiskRequest,
  AssessRiskResponse,
  RiskCategory,
} from '../types/risk.types';
import { RiskScoringService } from './risk-scoring.service';
import { AlertService } from './alert.service';
import { TrendAnalysisService } from './trend-analysis.service';

export class RiskPredictionService {
  private readonly scoringService: RiskScoringService;
  private readonly alertService: AlertService;
  private readonly trendService: TrendAnalysisService;

  // In-memory storage for MVP (would be database in production)
  private assessments: Map<string, RiskAssessment[]> = new Map();
  private assessmentCounter = 1;

  constructor() {
    this.scoringService = new RiskScoringService();
    this.alertService = new AlertService();
    this.trendService = new TrendAnalysisService();
  }

  /**
   * Perform comprehensive risk assessment for a patient
   */
  public async assessPatientRisk(
    request: AssessRiskRequest,
    patientData: PatientData,
    patientName: string
  ): Promise<AssessRiskResponse> {
    // 1. Calculate risk score
    const riskScore = this.scoringService.assessRisk(patientData);

    // 2. Create assessment record
    const assessment: RiskAssessment = {
      assessmentId: `ASSESS-${this.assessmentCounter++}`,
      patientId: request.patientId,
      timestamp: new Date(),
      riskScore,
      assessedBy: 'system',
    };

    // 3. Store assessment
    const patientAssessments = this.assessments.get(request.patientId) ?? [];
    patientAssessments.push(assessment);
    this.assessments.set(request.patientId, patientAssessments);

    // 4. Create alert if high risk
    const alerts: RiskAlert[] = [];
    const alert = this.alertService.createAlert(
      request.patientId,
      patientName,
      riskScore
    );
    if (alert) alerts.push(alert);

    // 5. Analyze trends if requested and sufficient history
    let trends: RiskTrend[] | undefined;
    if (request.includeProjection && patientAssessments.length >= 3) {
      const categories = this.getAvailableCategories(patientAssessments);
      trends = categories.map((category) =>
        this.trendService.analyzeTrends(
          request.patientId,
          patientAssessments,
          category
        )
      );
    }

    return {
      assessment,
      alerts,
      trends,
    };
  }

  /**
   * Get risk assessment history for a patient
   */
  public getPatientHistory(
    patientId: string
  ): ReadonlyArray<RiskAssessment> {
    return this.assessments.get(patientId) ?? [];
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): ReadonlyArray<RiskAlert> {
    return this.alertService.getActiveAlerts();
  }

  /**
   * Get alerts for a specific patient
   */
  public getPatientAlerts(patientId: string): ReadonlyArray<RiskAlert> {
    return this.alertService.getPatientAlerts(patientId);
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(
    alertId: string,
    userId: string
  ): RiskAlert | null {
    return this.alertService.acknowledgeAlert(alertId, userId);
  }

  /**
   * Get risk trends for a patient
   */
  public getPatientTrends(patientId: string): ReadonlyArray<RiskTrend> {
    const assessments = this.getPatientHistory(patientId);
    if (assessments.length < 3) return [];

    const categories = this.getAvailableCategories(assessments);
    return categories.map((category) =>
      this.trendService.analyzeTrends(patientId, assessments, category)
    );
  }

  /**
   * Get all available risk categories from assessments
   */
  private getAvailableCategories(
    assessments: ReadonlyArray<RiskAssessment>
  ): ReadonlyArray<RiskCategory> {
    const categories = new Set<RiskCategory>();

    for (const assessment of assessments) {
      for (const factor of assessment.riskScore.factors) {
        categories.add(factor.category);
      }
    }

    return Array.from(categories);
  }

  /**
   * Clear all data (for testing)
   */
  public clearAllData(): void {
    this.assessments.clear();
    this.assessmentCounter = 1;
    this.alertService.clearAllAlerts();
  }
}
