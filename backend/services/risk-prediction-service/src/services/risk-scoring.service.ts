/**
 * Risk Scoring Service
 * Core algorithms for health risk assessment
 */

import type {
  PatientData,
  RiskScore,
  RiskFactor,
  RiskLevel,
  RiskCategory,
  Medication,
  ChronicCondition,
} from '../types/risk.types';

/**
 * Known dangerous drug interactions (simplified for MVP)
 * In production, this would be a comprehensive database
 */
const KNOWN_INTERACTIONS: ReadonlyArray<{
  readonly drugs: ReadonlyArray<string>;
  readonly severity: number;
  readonly description: string;
}> = [
  {
    drugs: ['warfarin', 'aspirin'],
    severity: 85,
    description: 'Increased bleeding risk',
  },
  {
    drugs: ['metformin', 'insulin'],
    severity: 70,
    description: 'Risk of hypoglycemia',
  },
  {
    drugs: ['lisinopril', 'spironolactone'],
    severity: 75,
    description: 'Risk of hyperkalemia',
  },
  {
    drugs: ['simvastatin', 'amiodarone'],
    severity: 80,
    description: 'Increased risk of myopathy',
  },
];

export class RiskScoringService {
  /**
   * Calculate comprehensive risk score for a patient
   */
  public assessRisk(patientData: PatientData): RiskScore {
    const factors: RiskFactor[] = [];

    // 1. Medication interaction risks
    const interactionFactors = this.assessMedicationInteractions(
      patientData.medications
    );
    factors.push(...interactionFactors);

    // 2. Polypharmacy risk
    if (patientData.medications.length >= 5) {
      factors.push(this.assessPolypharmacy(patientData.medications.length));
    }

    // 3. Chronic disease progression risk
    const diseaseFactors = this.assessChronicDiseaseProgression(
      patientData.chronicConditions
    );
    factors.push(...diseaseFactors);

    // 4. Age-related risks
    if (patientData.age >= 65) {
      factors.push(this.assessAgeRelatedRisk(patientData.age));
    }

    // 5. Comorbidity risk
    if (patientData.chronicConditions.length >= 2) {
      factors.push(
        this.assessComorbidity(patientData.chronicConditions.length)
      );
    }

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore(factors);
    const level = this.determineRiskLevel(overallScore);
    const confidence = this.calculateConfidence(patientData);

    return {
      overall: overallScore,
      level,
      factors,
      confidence,
    };
  }

  /**
   * Assess medication interaction risks
   */
  private assessMedicationInteractions(
    medications: ReadonlyArray<Medication>
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];
    const activeIngredients = medications.map((m) =>
      m.activeIngredient.toLowerCase()
    );

    for (const interaction of KNOWN_INTERACTIONS) {
      const matches = interaction.drugs.filter((drug) =>
        activeIngredients.includes(drug)
      );

      if (matches.length >= 2) {
        factors.push({
          category: 'medication_interaction',
          description: `Drug interaction: ${matches.join(' + ')}`,
          severity: interaction.severity,
          details: interaction.description,
          recommendations: [
            'Consult with pharmacist immediately',
            'Monitor for adverse effects',
            'Consider alternative medications',
          ],
        });
      }
    }

    return factors;
  }

  /**
   * Assess polypharmacy risk
   */
  private assessPolypharmacy(medicationCount: number): RiskFactor {
    const severity = Math.min(40 + medicationCount * 5, 100);

    return {
      category: 'polypharmacy',
      description: `Polypharmacy: ${medicationCount} concurrent medications`,
      severity,
      details: `Patient is taking ${medicationCount} medications simultaneously, increasing risk of adverse drug events`,
      recommendations: [
        'Review medication list for duplicates',
        'Assess necessity of each medication',
        'Consider deprescribing non-essential medications',
        'Monitor for drug-drug interactions',
      ],
    };
  }

  /**
   * Assess chronic disease progression risk
   */
  private assessChronicDiseaseProgression(
    conditions: ReadonlyArray<ChronicCondition>
  ): RiskFactor[] {
    return conditions
      .filter((c) => c.controlStatus !== 'well-controlled')
      .map((condition) => {
        const severityMap = {
          mild: 40,
          moderate: 60,
          severe: 85,
        };

        const controlStatusMultiplier = {
          'well-controlled': 0.5,
          'partially-controlled': 1.0,
          uncontrolled: 1.5,
        };

        const baseSeverity = severityMap[condition.severity];
        const severity = Math.min(
          baseSeverity * controlStatusMultiplier[condition.controlStatus],
          100
        );

        return {
          category: 'chronic_disease_progression' as RiskCategory,
          description: `${condition.name} - ${condition.controlStatus}`,
          severity,
          details: `Patient has ${condition.severity} ${condition.name} that is ${condition.controlStatus}`,
          recommendations: [
            'Increase monitoring frequency',
            'Review treatment plan effectiveness',
            'Consider treatment escalation',
            'Patient education on disease management',
          ],
        };
      });
  }

  /**
   * Assess age-related risk
   */
  private assessAgeRelatedRisk(age: number): RiskFactor {
    const severity = Math.min(30 + (age - 65) * 2, 70);

    return {
      category: 'age_related',
      description: `Age-related risk: ${age} years old`,
      severity,
      details: 'Elderly patients have increased risk of adverse drug reactions and medication-related problems',
      recommendations: [
        'Review medications for age-appropriateness',
        'Check for anticholinergic burden',
        'Monitor renal and hepatic function',
        'Consider Beers Criteria for medication safety',
      ],
    };
  }

  /**
   * Assess comorbidity risk
   */
  private assessComorbidity(conditionCount: number): RiskFactor {
    const severity = Math.min(35 + conditionCount * 10, 80);

    return {
      category: 'comorbidity',
      description: `Multiple chronic conditions: ${conditionCount}`,
      severity,
      details: `Patient has ${conditionCount} chronic conditions requiring coordinated care`,
      recommendations: [
        'Ensure care coordination between providers',
        'Regular comprehensive medication reviews',
        'Monitor for treatment conflicts',
        'Assess overall treatment burden',
      ],
    };
  }

  /**
   * Calculate overall risk score from individual factors
   */
  private calculateOverallScore(factors: ReadonlyArray<RiskFactor>): number {
    if (factors.length === 0) return 0;

    // Weight factors by category importance
    const categoryWeights: Record<RiskCategory, number> = {
      medication_interaction: 1.5,
      adverse_drug_reaction: 1.4,
      chronic_disease_progression: 1.2,
      polypharmacy: 1.0,
      age_related: 0.8,
      comorbidity: 1.1,
    };

    const weightedSum = factors.reduce((sum, factor) => {
      const weight = categoryWeights[factor.category] ?? 1.0;
      return sum + factor.severity * weight;
    }, 0);

    const totalWeight = factors.reduce((sum, factor) => {
      const weight = categoryWeights[factor.category] ?? 1.0;
      return sum + weight;
    }, 0);

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    return 'low';
  }

  /**
   * Calculate confidence in the assessment
   */
  private calculateConfidence(patientData: PatientData): number {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    if (patientData.medications.length > 0) confidence += 0.15;
    if (patientData.chronicConditions.length > 0) confidence += 0.15;
    if (patientData.recentLabs && patientData.recentLabs.length > 0)
      confidence += 0.1;
    if (patientData.allergies.length > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Project future risk based on trends (simplified)
   */
  public projectRisk(
    currentScore: number,
    historicalScores: ReadonlyArray<number>
  ): number {
    if (historicalScores.length < 2) return currentScore;

    // Simple linear projection
    const recentScores = historicalScores.slice(-3);
    const avgChange =
      recentScores.reduce(
        (sum, score, idx) =>
          idx > 0 ? sum + (score - recentScores[idx - 1]!) : sum,
        0
      ) /
      (recentScores.length - 1);

    return Math.max(0, Math.min(100, currentScore + avgChange));
  }
}
