/**
 * Trend Analysis Service
 * Analyzes risk trends and disease progression
 */

import type {
  RiskTrend,
  TrendDataPoint,
  RiskCategory,
  RiskLevel,
  RiskAssessment,
} from '../types/risk.types';

export class TrendAnalysisService {
  /**
   * Analyze risk trends from historical assessments
   */
  public analyzeTrends(
    patientId: string,
    assessments: ReadonlyArray<RiskAssessment>,
    category: RiskCategory
  ): RiskTrend {
    const dataPoints = this.extractDataPoints(assessments, category);
    const trend = this.determineTrend(dataPoints);
    const projectedScore =
      dataPoints.length >= 3 ? this.projectScore(dataPoints) : undefined;

    return {
      patientId,
      category,
      dataPoints,
      trend,
      projectedScore,
    };
  }

  /**
   * Extract relevant data points for a specific risk category
   */
  private extractDataPoints(
    assessments: ReadonlyArray<RiskAssessment>,
    category: RiskCategory
  ): ReadonlyArray<TrendDataPoint> {
    return assessments
      .map((assessment) => {
        // Find the factor for this category
        const factor = assessment.riskScore.factors.find(
          (f) => f.category === category
        );

        if (!factor) return null;

        return {
          date: assessment.timestamp,
          score: factor.severity,
          level: this.scoreToLevel(factor.severity),
        };
      })
      .filter((point): point is TrendDataPoint => point !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Determine if trend is improving, stable, or worsening
   */
  private determineTrend(
    dataPoints: ReadonlyArray<TrendDataPoint>
  ): 'improving' | 'stable' | 'worsening' {
    if (dataPoints.length < 2) return 'stable';

    const recentPoints = dataPoints.slice(-5); // Last 5 data points
    let improvingCount = 0;
    let worseningCount = 0;

    for (let i = 1; i < recentPoints.length; i++) {
      const current = recentPoints[i]!;
      const previous = recentPoints[i - 1]!;
      const change = current.score - previous.score;

      if (change < -5) improvingCount++; // Significant improvement
      if (change > 5) worseningCount++; // Significant worsening
    }

    if (improvingCount > worseningCount) return 'improving';
    if (worseningCount > improvingCount) return 'worsening';
    return 'stable';
  }

  /**
   * Project future risk score using linear regression
   */
  private projectScore(
    dataPoints: ReadonlyArray<TrendDataPoint>
  ): number | undefined {
    if (dataPoints.length < 3) return undefined;

    const recentPoints = dataPoints.slice(-5);

    // Simple linear regression
    const n = recentPoints.length;
    const xValues = recentPoints.map((_, i) => i);
    const yValues = recentPoints.map((p) => p.score);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i]!, 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Project 30 days ahead (assuming roughly 1 week between assessments)
    const futureX = n + 4; // ~4 weeks ahead
    const projection = slope * futureX + intercept;

    return Math.max(0, Math.min(100, Math.round(projection)));
  }

  /**
   * Convert numeric score to risk level
   */
  private scoreToLevel(score: number): RiskLevel {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    return 'low';
  }
}
