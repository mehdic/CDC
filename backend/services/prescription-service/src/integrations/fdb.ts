/**
 * FDB MedKnowledge API Integration
 * Drug interaction checking using FDB MedKnowledge database
 * T085 - User Story 1: Prescription Processing & Validation (FR-026)
 * Based on: /specs/002-metapharm-platform/spec.md (FR-011, FR-012)
 *
 * **PRODUCTION TODO**:
 * - Obtain FDB MedKnowledge API credentials
 * - Configure API endpoint in environment variables (FDB_API_URL, FDB_API_KEY)
 * - Replace mock implementation with actual API calls
 * - Add retry logic and error handling for production
 * - Implement rate limiting as per FDB API terms
 */

export enum DrugInteractionSeverity {
  MINOR = 'minor',           // Minimal clinical significance
  MODERATE = 'moderate',     // May require monitoring
  MAJOR = 'major',           // Serious interaction - may require alternative therapy
  CONTRAINDICATED = 'contraindicated',  // Should not be used together
}

export interface DrugInteraction {
  drug1: string;            // First medication name
  drug2: string;            // Second medication name
  severity: DrugInteractionSeverity;
  description: string;      // Clinical description of interaction
  recommendation: string;   // Clinical recommendation for pharmacist
}

export interface DrugInteractionResult {
  hasInteractions: boolean;
  interactions: DrugInteraction[];
  checkedAt: Date;
}

/**
 * FDB MedKnowledge API Client
 * Checks for drug-drug interactions
 */
export class FDBService {
  private apiUrl: string;
  private apiKey: string;
  private useMockData: boolean;

  constructor() {
    this.apiUrl = process.env.FDB_API_URL || '';
    this.apiKey = process.env.FDB_API_KEY || '';

    // Use mock data if credentials not configured
    this.useMockData = !this.apiUrl || !this.apiKey;

    if (this.useMockData) {
      console.warn(
        '[FDB Service] WARNING: FDB API credentials not configured. Using MOCK data. ' +
        'Configure FDB_API_URL and FDB_API_KEY environment variables for production.'
      );
    }
  }

  /**
   * Check drug interactions for a list of medications
   * @param medications Array of medication names
   * @returns DrugInteractionResult with all detected interactions
   */
  async checkDrugInteractions(medications: string[]): Promise<DrugInteractionResult> {
    if (this.useMockData) {
      return this.mockCheckDrugInteractions(medications);
    }

    // TODO: Production implementation
    try {
      const response = await this.callFDBAPI(medications);
      return this.parseFDBResponse(response);
    } catch (error) {
      console.error('[FDB Service] API call failed:', error);
      // Fallback to mock data in case of API failure
      console.warn('[FDB Service] Falling back to MOCK data due to API error');
      return this.mockCheckDrugInteractions(medications);
    }
  }

  /**
   * Call FDB MedKnowledge API (production implementation)
   * TODO: Implement actual API call when credentials are available
   * @param medications Array of medication names
   * @returns Raw API response
   */
  private async callFDBAPI(medications: string[]): Promise<any> {
    // TODO: Production implementation
    // Example structure:
    // const response = await fetch(`${this.apiUrl}/interactions`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${this.apiKey}`,
    //   },
    //   body: JSON.stringify({ medications }),
    // });
    // return await response.json();

    throw new Error('FDB API not configured - using mock data');
  }

  /**
   * Parse FDB API response into DrugInteractionResult
   * TODO: Implement actual parsing logic based on FDB API schema
   * @param response Raw API response
   * @returns Parsed DrugInteractionResult
   */
  private parseFDBResponse(response: any): DrugInteractionResult {
    // TODO: Production implementation based on FDB API response schema
    // Example structure:
    // return {
    //   hasInteractions: response.interactions.length > 0,
    //   interactions: response.interactions.map(parseInteraction),
    //   checkedAt: new Date(),
    // };

    throw new Error('FDB API response parsing not implemented');
  }

  /**
   * Mock implementation for drug interaction checking
   * Provides sample data for testing purposes
   * @param medications Array of medication names
   * @returns Mock DrugInteractionResult
   */
  private mockCheckDrugInteractions(medications: string[]): DrugInteractionResult {
    const interactions: DrugInteraction[] = [];

    // Mock data: Common drug interactions
    const knownInteractions: Record<string, Record<string, Omit<DrugInteraction, 'drug1' | 'drug2'>>> = {
      warfarin: {
        aspirin: {
          severity: DrugInteractionSeverity.MAJOR,
          description: 'Increased risk of bleeding when warfarin is combined with aspirin',
          recommendation: 'Monitor INR closely. Consider alternative antiplatelet therapy or adjust warfarin dose.',
        },
        ibuprofen: {
          severity: DrugInteractionSeverity.MAJOR,
          description: 'NSAIDs may increase bleeding risk when combined with warfarin',
          recommendation: 'Avoid concomitant use if possible. If necessary, monitor INR and watch for signs of bleeding.',
        },
      },
      metformin: {
        contrast: {
          severity: DrugInteractionSeverity.MAJOR,
          description: 'Iodinated contrast media may increase risk of lactic acidosis with metformin',
          recommendation: 'Discontinue metformin before contrast administration and restart 48 hours after if renal function is normal.',
        },
      },
      lisinopril: {
        potassium: {
          severity: DrugInteractionSeverity.MODERATE,
          description: 'ACE inhibitors may increase serum potassium levels',
          recommendation: 'Monitor serum potassium levels. Avoid potassium supplements unless medically necessary.',
        },
      },
      simvastatin: {
        clarithromycin: {
          severity: DrugInteractionSeverity.CONTRAINDICATED,
          description: 'Macrolide antibiotics significantly increase simvastatin levels, increasing risk of rhabdomyolysis',
          recommendation: 'Do NOT use together. Temporarily discontinue simvastatin during clarithromycin therapy.',
        },
      },
      digoxin: {
        furosemide: {
          severity: DrugInteractionSeverity.MODERATE,
          description: 'Loop diuretics may cause hypokalemia, increasing digoxin toxicity risk',
          recommendation: 'Monitor serum potassium and digoxin levels. Supplement potassium if needed.',
        },
      },
    };

    // Check all pairs of medications
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const med1 = medications[i].toLowerCase().trim();
        const med2 = medications[j].toLowerCase().trim();

        // Check if interaction exists in mock database
        if (knownInteractions[med1]?.[med2]) {
          interactions.push({
            drug1: medications[i],
            drug2: medications[j],
            ...knownInteractions[med1][med2],
          });
        } else if (knownInteractions[med2]?.[med1]) {
          interactions.push({
            drug1: medications[j],
            drug2: medications[i],
            ...knownInteractions[med2][med1],
          });
        }
      }
    }

    return {
      hasInteractions: interactions.length > 0,
      interactions,
      checkedAt: new Date(),
    };
  }

  /**
   * Get severity level as numeric score for sorting
   * @param severity DrugInteractionSeverity enum value
   * @returns Numeric score (0-3, higher = more severe)
   */
  static getSeverityScore(severity: DrugInteractionSeverity): number {
    switch (severity) {
      case DrugInteractionSeverity.CONTRAINDICATED:
        return 3;
      case DrugInteractionSeverity.MAJOR:
        return 2;
      case DrugInteractionSeverity.MODERATE:
        return 1;
      case DrugInteractionSeverity.MINOR:
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Filter interactions by minimum severity level
   * @param interactions Array of drug interactions
   * @param minimumSeverity Minimum severity to include
   * @returns Filtered interactions
   */
  static filterBySeverity(
    interactions: DrugInteraction[],
    minimumSeverity: DrugInteractionSeverity
  ): DrugInteraction[] {
    const minScore = this.getSeverityScore(minimumSeverity);
    return interactions.filter(
      (interaction) => this.getSeverityScore(interaction.severity) >= minScore
    );
  }

  /**
   * Sort interactions by severity (most severe first)
   * @param interactions Array of drug interactions
   * @returns Sorted interactions
   */
  static sortBySeverity(interactions: DrugInteraction[]): DrugInteraction[] {
    return [...interactions].sort(
      (a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity)
    );
  }
}
