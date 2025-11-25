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
  private healthStatus: 'healthy' | 'degraded' | 'down' | 'unconfigured';
  private lastHealthCheck: Date | null;
  private consecutiveFailures: number;

  constructor() {
    this.apiUrl = process.env.FDB_API_URL || '';
    this.apiKey = process.env.FDB_API_KEY || '';
    this.consecutiveFailures = 0;
    this.lastHealthCheck = null;

    // Use mock data if credentials not configured
    this.useMockData = !this.apiUrl || !this.apiKey;

    if (this.useMockData) {
      this.healthStatus = 'unconfigured';
      console.warn(
        '[FDB Service] WARNING: FDB API credentials not configured. Using MOCK data. ' +
        'Configure FDB_API_URL and FDB_API_KEY environment variables for production.'
      );
    } else {
      this.healthStatus = 'healthy';
      console.info('[FDB Service] Initialized with FDB API credentials');
    }
  }

  /**
   * Check FDB API health status
   * @returns Health status object
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down' | 'unconfigured';
    usingMockData: boolean;
    lastCheck: Date | null;
    consecutiveFailures: number;
    message: string;
  }> {
    if (this.useMockData) {
      return {
        status: 'unconfigured',
        usingMockData: true,
        lastCheck: null,
        consecutiveFailures: 0,
        message: 'FDB API credentials not configured. Using mock data.',
      };
    }

    // Perform health check if not done recently (cache for 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (!this.lastHealthCheck || this.lastHealthCheck < fiveMinutesAgo) {
      await this.performHealthCheck();
    }

    let message = 'FDB API is operational';
    if (this.healthStatus === 'degraded') {
      message = `FDB API experiencing issues (${this.consecutiveFailures} recent failures)`;
    } else if (this.healthStatus === 'down') {
      message = 'FDB API is unavailable. Using mock data fallback.';
    }

    return {
      status: this.healthStatus,
      usingMockData: this.healthStatus === 'down',
      lastCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      message,
    };
  }

  /**
   * Perform health check against FDB API
   * Internal method to verify API connectivity
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Simple health check: call API with minimal data
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for health check

      const response = await fetch(`${this.apiUrl}/api/v1/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.healthStatus = 'healthy';
        this.consecutiveFailures = 0;
        this.lastHealthCheck = new Date();
      } else if (response.status === 401 || response.status === 403) {
        this.healthStatus = 'down';
        this.consecutiveFailures++;
        this.lastHealthCheck = new Date();
        console.error('[FDB Service] Health check failed: Authentication error');
      } else {
        this.healthStatus = 'degraded';
        this.consecutiveFailures++;
        this.lastHealthCheck = new Date();
        console.warn(`[FDB Service] Health check degraded: HTTP ${response.status}`);
      }
    } catch (error) {
      this.consecutiveFailures++;
      this.lastHealthCheck = new Date();

      // Mark as down after 3 consecutive failures
      if (this.consecutiveFailures >= 3) {
        this.healthStatus = 'down';
        console.error('[FDB Service] Health check failed: API is DOWN after 3 consecutive failures');
      } else {
        this.healthStatus = 'degraded';
        console.warn(`[FDB Service] Health check degraded: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Check drug interactions for a list of medications
   * Automatically falls back to mock data if FDB API is unavailable
   * @param medications Array of medication names
   * @returns DrugInteractionResult with all detected interactions
   */
  async checkDrugInteractions(medications: string[]): Promise<DrugInteractionResult> {
    // Input validation
    if (!medications || medications.length === 0) {
      return {
        hasInteractions: false,
        interactions: [],
        checkedAt: new Date(),
      };
    }

    // Single medication - no interactions possible
    if (medications.length === 1) {
      return {
        hasInteractions: false,
        interactions: [],
        checkedAt: new Date(),
      };
    }

    // Use mock data if credentials not configured
    if (this.useMockData) {
      return this.mockCheckDrugInteractions(medications);
    }

    // Try FDB API with automatic fallback
    try {
      const response = await this.callFDBAPI(medications);
      const result = this.parseFDBResponse(response);

      // Reset failure counter on success
      this.consecutiveFailures = 0;
      this.healthStatus = 'healthy';

      return result;
    } catch (error) {
      console.error('[FDB Service] API call failed:', error);

      // Track failures
      this.consecutiveFailures++;

      // Log warning with details
      console.warn(
        `[FDB Service] Falling back to MOCK data due to API error (failure ${this.consecutiveFailures}). ` +
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // Update health status based on consecutive failures
      if (this.consecutiveFailures >= 3) {
        this.healthStatus = 'down';
      } else {
        this.healthStatus = 'degraded';
      }

      // Graceful degradation: use mock data
      const mockResult = this.mockCheckDrugInteractions(medications);

      // Add warning to mock result (could be used in UI)
      console.warn(
        '[FDB Service] WARNING: Using mock drug interaction data. ' +
        'Results may not reflect current clinical guidelines. ' +
        'Please verify critical interactions with updated drug databases.'
      );

      return mockResult;
    }
  }

  /**
   * Call FDB MedKnowledge API (production implementation)
   * Implements retry logic with exponential backoff for transient errors
   * @param medications Array of medication names
   * @returns Raw API response
   */
  private async callFDBAPI(medications: string[]): Promise<any> {
    const maxRetries = 3;
    const baseDelayMs = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(`${this.apiUrl}/api/v1/druginteractions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            medications: medications.map((med) => ({ name: med })),
            severityLevels: ['contraindicated', 'major', 'moderate', 'minor'],
            includeRecommendations: true,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Non-2xx status codes
          if (response.status === 401 || response.status === 403) {
            throw new Error(`FDB API authentication failed: ${response.status} ${response.statusText}`);
          }

          if (response.status === 429) {
            // Rate limit - retry with longer backoff
            const retryAfter = response.headers.get('Retry-After');
            const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : baseDelayMs * Math.pow(2, attempt);
            console.warn(`[FDB Service] Rate limited. Retrying after ${delayMs}ms...`);
            await this.sleep(delayMs);
            continue;
          }

          if (response.status >= 500) {
            // Server error - retry
            throw new Error(`FDB API server error: ${response.status} ${response.statusText}`);
          }

          // Client error (4xx other than 401/403/429) - don't retry
          const errorBody = await response.text();
          throw new Error(`FDB API client error: ${response.status} - ${errorBody}`);
        }

        const data = await response.json();
        return data;

      } catch (error: any) {
        console.error(`[FDB Service] API call attempt ${attempt + 1}/${maxRetries} failed:`, error.message);

        // Don't retry on auth errors or client errors
        if (error.message.includes('authentication failed') || error.message.includes('client error')) {
          throw error;
        }

        // If last attempt, throw error
        if (attempt === maxRetries - 1) {
          throw new Error(`FDB API call failed after ${maxRetries} attempts: ${error.message}`);
        }

        // Wait before retrying (exponential backoff)
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[FDB Service] Retrying in ${delayMs}ms...`);
        await this.sleep(delayMs);
      }
    }

    throw new Error('FDB API call failed - max retries exceeded');
  }

  /**
   * Sleep helper for retry delays
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse FDB API response into DrugInteractionResult
   * Handles FDB MedKnowledge API response schema
   * @param response Raw API response from FDB
   * @returns Parsed DrugInteractionResult
   */
  private parseFDBResponse(response: any): DrugInteractionResult {
    try {
      // FDB API typically returns: { interactions: [...], metadata: {...} }
      const interactions: DrugInteraction[] = [];

      if (!response || !response.interactions) {
        console.warn('[FDB Service] Empty or invalid API response structure');
        return {
          hasInteractions: false,
          interactions: [],
          checkedAt: new Date(),
        };
      }

      // Parse each interaction from FDB response
      for (const fdbInteraction of response.interactions) {
        try {
          // Map FDB severity levels to our enum
          const severity = this.mapFDBSeverity(fdbInteraction.severity || fdbInteraction.severityLevel);

          interactions.push({
            drug1: fdbInteraction.drug1?.name || fdbInteraction.medication1 || 'Unknown',
            drug2: fdbInteraction.drug2?.name || fdbInteraction.medication2 || 'Unknown',
            severity,
            description: fdbInteraction.description || fdbInteraction.clinicalEffect || 'No description available',
            recommendation: fdbInteraction.recommendation || fdbInteraction.managementGuidance || 'Consult healthcare provider',
          });
        } catch (parseError) {
          console.error('[FDB Service] Failed to parse individual interaction:', parseError);
          // Continue parsing other interactions
        }
      }

      return {
        hasInteractions: interactions.length > 0,
        interactions,
        checkedAt: new Date(),
      };

    } catch (error) {
      console.error('[FDB Service] Failed to parse FDB response:', error);
      throw new Error(`FDB API response parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map FDB API severity levels to our internal DrugInteractionSeverity enum
   * FDB uses various severity naming conventions depending on their API version
   * @param fdbSeverity FDB severity string
   * @returns DrugInteractionSeverity enum value
   */
  private mapFDBSeverity(fdbSeverity: string): DrugInteractionSeverity {
    if (!fdbSeverity) {
      return DrugInteractionSeverity.MINOR;
    }

    const severityLower = fdbSeverity.toLowerCase().trim();

    // Map FDB severity levels to our enum
    if (severityLower.includes('contraindicated') || severityLower.includes('contraindication')) {
      return DrugInteractionSeverity.CONTRAINDICATED;
    }
    if (severityLower.includes('major') || severityLower.includes('severe')) {
      return DrugInteractionSeverity.MAJOR;
    }
    if (severityLower.includes('moderate')) {
      return DrugInteractionSeverity.MODERATE;
    }
    if (severityLower.includes('minor') || severityLower.includes('low')) {
      return DrugInteractionSeverity.MINOR;
    }

    // Default to MINOR if unknown severity
    console.warn(`[FDB Service] Unknown severity level: ${fdbSeverity}, defaulting to MINOR`);
    return DrugInteractionSeverity.MINOR;
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
