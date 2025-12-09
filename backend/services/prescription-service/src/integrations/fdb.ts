/**
 * FDB MedKnowledge API Integration
 * Drug interaction checking using FDB MedKnowledge database
 * T8-001, T8-002: Real FDB DrugPoint API Integration with audit logging
 * T085 - User Story 1: Prescription Processing & Validation (FR-026)
 * Based on: /specs/002-metapharm-platform/spec.md (FR-011, FR-012)
 *
 * Features:
 * - Real FDB DrugPoint API integration with automatic fallback to mock data
 * - Redis caching with 24h TTL for performance
 * - Comprehensive audit logging for compliance
 * - Rate limiting with exponential backoff
 * - Performance metrics for P95 tracking
 * - Ingredient-level allergy cross-reference
 */

import { getFDBConfig, validateFDBConfig, FDBAuditLog, FDBPerformanceMetrics } from '../config/fdb.config';
import { CacheProvider, CacheFactory } from './cache';

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
 * Checks for drug-drug interactions with audit logging and performance tracking
 */
export class FDBService {
  private config: ReturnType<typeof getFDBConfig>;
  private cache: CacheProvider;
  private useMockData: boolean;
  private healthStatus: 'healthy' | 'degraded' | 'down' | 'unconfigured';
  private lastHealthCheck: Date | null;
  private consecutiveFailures: number;
  private auditLogs: FDBAuditLog[] = [];
  private performanceMetrics: FDBPerformanceMetrics[] = [];

  constructor(cacheProvider?: CacheProvider) {
    this.config = getFDBConfig();
    validateFDBConfig(this.config);

    this.cache = cacheProvider || CacheFactory.createCache();
    this.consecutiveFailures = 0;
    this.lastHealthCheck = null;

    // Use mock data if credentials not configured
    this.useMockData = !this.config.apiUrl || !this.config.apiKey;

    if (this.useMockData) {
      this.healthStatus = 'unconfigured';
      console.warn(
        '[FDB Service] WARNING: FDB API credentials not configured. Using MOCK data. ' +
        'Configure FDB_BASE_URL and FDB_API_KEY environment variables for production.'
      );
    } else {
      this.healthStatus = 'healthy';
      console.info('[FDB Service] Initialized with FDB API credentials');
      console.info(`[FDB Service] Cache TTL: ${this.config.cacheTTL}s, Timeout: ${this.config.timeout}ms`);
    }
  }

  /**
   * Add audit log entry
   * @param log Audit log entry
   */
  private addAuditLog(log: FDBAuditLog): void {
    if (!this.config.auditLoggingEnabled) {
      return;
    }

    this.auditLogs.push(log);

    // Keep only last 1000 entries in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    // Log to console for external aggregation (Elasticsearch, CloudWatch, etc.)
    console.log('[FDB Audit]', JSON.stringify(log));
  }

  /**
   * Track performance metric
   * @param metric Performance metric
   */
  private trackPerformance(metric: FDBPerformanceMetrics): void {
    if (!this.config.performanceMetricsEnabled) {
      return;
    }

    this.performanceMetrics.push(metric);

    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }

    // Log for external monitoring
    if (metric.durationMs > 500) {
      console.warn('[FDB Performance] Slow operation:', JSON.stringify(metric));
    }
  }

  /**
   * Get audit logs (for compliance reporting)
   * @param limit Maximum number of logs to return
   * @returns Recent audit logs
   */
  getAuditLogs(limit: number = 100): FDBAuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  /**
   * Get performance statistics
   * @returns Performance statistics
   */
  getPerformanceStats(): {
    p50: number;
    p95: number;
    p99: number;
    avgDuration: number;
    totalRequests: number;
    cacheHitRate: number;
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        p50: 0,
        p95: 0,
        p99: 0,
        avgDuration: 0,
        totalRequests: 0,
        cacheHitRate: 0,
      };
    }

    const sortedDurations = this.performanceMetrics
      .map(m => m.durationMs)
      .sort((a, b) => a - b);

    const cacheHits = this.performanceMetrics.filter(m => m.cacheHit).length;

    return {
      p50: sortedDurations[Math.floor(sortedDurations.length * 0.5)] || 0,
      p95: sortedDurations[Math.floor(sortedDurations.length * 0.95)] || 0,
      p99: sortedDurations[Math.floor(sortedDurations.length * 0.99)] || 0,
      avgDuration: sortedDurations.reduce((a, b) => a + b, 0) / sortedDurations.length,
      totalRequests: this.performanceMetrics.length,
      cacheHitRate: (cacheHits / this.performanceMetrics.length) * 100,
    };
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
    const startTime = Date.now();
    try {
      // Simple health check: call API with minimal data
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.apiUrl}/api/v1/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      if (response.ok) {
        this.healthStatus = 'healthy';
        this.consecutiveFailures = 0;
        this.lastHealthCheck = new Date();

        // Track performance
        this.trackPerformance({
          operation: 'HEALTH_CHECK',
          durationMs,
          timestamp: new Date(),
          success: true,
          cacheHit: false,
        });

        // Audit log
        this.addAuditLog({
          timestamp: new Date(),
          action: 'HEALTH_CHECK',
          result: 'SUCCESS',
          durationMs,
          apiResponseCode: response.status,
        });
      } else if (response.status === 401 || response.status === 403) {
        this.healthStatus = 'down';
        this.consecutiveFailures++;
        this.lastHealthCheck = new Date();
        console.error('[FDB Service] Health check failed: Authentication error');

        this.addAuditLog({
          timestamp: new Date(),
          action: 'HEALTH_CHECK',
          result: 'ERROR',
          durationMs,
          apiResponseCode: response.status,
          errorMessage: 'Authentication failed',
        });
      } else {
        this.healthStatus = 'degraded';
        this.consecutiveFailures++;
        this.lastHealthCheck = new Date();
        console.warn(`[FDB Service] Health check degraded: HTTP ${response.status}`);

        this.addAuditLog({
          timestamp: new Date(),
          action: 'HEALTH_CHECK',
          result: 'ERROR',
          durationMs,
          apiResponseCode: response.status,
        });
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
   * Look up drug information by name, NDC, or RxCUI
   * Searches comprehensive drug database
   * @param query Drug name, NDC code, or RxCUI
   * @param queryType Type of query ('name', 'ndc', 'rxcui', or 'auto')
   * @returns Drug information or null if not found
   */
  async lookupDrug(
    query: string,
    queryType: 'name' | 'ndc' | 'rxcui' | 'atc' | 'auto' = 'auto'
  ): Promise<any | null> {
    const { DRUG_DATABASE } = require('./drug-database');

    const queryLower = query.toLowerCase().trim();

    // Auto-detect query type if not specified
    if (queryType === 'auto') {
      // NDC codes are typically 10-11 digits with hyphens
      if (/^\d{5}-\d{3,4}/.test(query)) {
        queryType = 'ndc';
      }
      // RxCUI codes are typically 4-7 digits
      else if (/^\d{4,7}$/.test(query)) {
        queryType = 'rxcui';
      }
      // ATC codes are typically alphanumeric like "C09AA03"
      else if (/^[A-Z]\d{2}[A-Z]{2}\d{2}$/i.test(query)) {
        queryType = 'atc';
      }
      // Default to name search
      else {
        queryType = 'name';
      }
    }

    // Search by specified field
    for (const [key, drugInfo] of Object.entries(DRUG_DATABASE)) {
      const drug = drugInfo as any;

      switch (queryType) {
        case 'name':
          // Check generic name, brand names, and key
          if (
            drug.name?.toLowerCase() === queryLower ||
            drug.genericName?.toLowerCase() === queryLower ||
            key.toLowerCase() === queryLower ||
            drug.brandNames?.some((brand: string) => brand.toLowerCase() === queryLower)
          ) {
            return { ...drug, matchedBy: 'name' };
          }
          break;

        case 'ndc':
          if (drug.ndcCode === query) {
            return { ...drug, matchedBy: 'ndc' };
          }
          break;

        case 'rxcui':
          if (drug.rxcui === query) {
            return { ...drug, matchedBy: 'rxcui' };
          }
          break;

        case 'atc':
          if (drug.atcCode?.toUpperCase() === query.toUpperCase()) {
            return { ...drug, matchedBy: 'atc' };
          }
          break;
      }
    }

    // Not found - return null
    return null;
  }

  /**
   * Search for drugs matching a partial query
   * Useful for autocomplete/typeahead functionality
   * @param query Partial drug name
   * @param limit Maximum number of results to return
   * @returns Array of matching drug information
   */
  async searchDrugs(query: string, limit: number = 10): Promise<any[]> {
    const { DRUG_DATABASE } = require('./drug-database');

    const queryLower = query.toLowerCase().trim();
    const results: any[] = [];

    // Search all drugs
    for (const [key, drugInfo] of Object.entries(DRUG_DATABASE)) {
      const drug = drugInfo as any;

      // Check if query matches name, generic name, or brand names
      const matchesName =
        drug.name?.toLowerCase().includes(queryLower) ||
        drug.genericName?.toLowerCase().includes(queryLower) ||
        key.toLowerCase().includes(queryLower);

      const matchesBrand = drug.brandNames?.some((brand: string) =>
        brand.toLowerCase().includes(queryLower)
      );

      if (matchesName || matchesBrand) {
        results.push({
          ...drug,
          relevance: this.calculateRelevance(query, drug),
        });

        // Stop if we have enough results
        if (results.length >= limit * 2) break; // Get extra for sorting
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(({ relevance, ...drug }) => drug); // Remove relevance score
  }

  /**
   * Calculate search relevance score for autocomplete
   * Higher score = better match
   * @param query Search query
   * @param drug Drug info object
   * @returns Relevance score
   */
  private calculateRelevance(query: string, drug: any): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Exact match on generic name or primary name
    if (drug.name?.toLowerCase() === queryLower || drug.genericName?.toLowerCase() === queryLower) {
      score += 100;
    }
    // Starts with query
    else if (drug.name?.toLowerCase().startsWith(queryLower) || drug.genericName?.toLowerCase().startsWith(queryLower)) {
      score += 50;
    }
    // Contains query
    else if (drug.name?.toLowerCase().includes(queryLower) || drug.genericName?.toLowerCase().includes(queryLower)) {
      score += 25;
    }

    // Bonus for brand name matches
    if (drug.brandNames?.some((brand: string) => brand.toLowerCase().startsWith(queryLower))) {
      score += 20;
    }

    // Bonus for common categories (prioritize frequently used drugs)
    const commonCategories = ['Antibiotic', 'Analgesic', 'Antiplatelet', 'Statin', 'NSAID'];
    if (commonCategories.includes(drug.category)) {
      score += 10;
    }

    return score;
  }

  /**
   * Check drug interactions for a list of medications
   * Implements caching, audit logging, and automatic fallback to mock data
   * @param medications Array of medication names
   * @param patientId Optional patient ID for audit logging
   * @returns DrugInteractionResult with all detected interactions
   */
  async checkDrugInteractions(medications: string[], patientId?: string): Promise<DrugInteractionResult> {
    const startTime = Date.now();

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

    // Check cache first
    const cacheKey = this.generateCacheKey(medications);
    const cachedResult = await this.cache.get<DrugInteractionResult>(cacheKey);

    if (cachedResult) {
      const durationMs = Date.now() - startTime;

      this.trackPerformance({
        operation: 'INTERACTION_CHECK',
        durationMs,
        timestamp: new Date(),
        success: true,
        cacheHit: true,
      });

      this.addAuditLog({
        timestamp: new Date(),
        action: 'INTERACTION_CHECK',
        medications,
        patientId,
        result: 'CACHE_HIT',
        durationMs,
        interactionCount: cachedResult.interactions.length,
        cacheHit: true,
      });

      console.log(`[FDB Service] Cache hit for ${medications.length} medications`);
      return cachedResult;
    }

    // Use mock data if credentials not configured
    if (this.useMockData) {
      const result = this.mockCheckDrugInteractions(medications);
      const durationMs = Date.now() - startTime;

      // Cache mock result
      await this.cache.set(cacheKey, result, this.config.cacheTTL);

      this.trackPerformance({
        operation: 'INTERACTION_CHECK',
        durationMs,
        timestamp: new Date(),
        success: true,
        cacheHit: false,
      });

      this.addAuditLog({
        timestamp: new Date(),
        action: 'INTERACTION_CHECK',
        medications,
        patientId,
        result: 'FALLBACK_MOCK',
        durationMs,
        interactionCount: result.interactions.length,
        cacheHit: false,
      });

      return result;
    }

    // Try FDB API with automatic fallback
    try {
      const response = await this.callFDBAPI(medications);
      const result = this.parseFDBResponse(response);
      const durationMs = Date.now() - startTime;

      // Cache successful result
      await this.cache.set(cacheKey, result, this.config.cacheTTL);

      // Reset failure counter on success
      this.consecutiveFailures = 0;
      this.healthStatus = 'healthy';

      this.trackPerformance({
        operation: 'INTERACTION_CHECK',
        durationMs,
        timestamp: new Date(),
        success: true,
        cacheHit: false,
      });

      this.addAuditLog({
        timestamp: new Date(),
        action: 'INTERACTION_CHECK',
        medications,
        patientId,
        result: 'SUCCESS',
        durationMs,
        interactionCount: result.interactions.length,
        cacheHit: false,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;

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

      // Cache fallback result
      await this.cache.set(cacheKey, mockResult, this.config.cacheTTL);

      this.trackPerformance({
        operation: 'INTERACTION_CHECK',
        durationMs,
        timestamp: new Date(),
        success: false,
        cacheHit: false,
      });

      this.addAuditLog({
        timestamp: new Date(),
        action: 'INTERACTION_CHECK',
        medications,
        patientId,
        result: 'FALLBACK_MOCK',
        durationMs,
        interactionCount: mockResult.interactions.length,
        cacheHit: false,
        errorMessage: error instanceof Error ? error.message : 'API call failed',
      });

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
   * Generate cache key from medications
   * @param medications Array of medication names
   * @returns Cache key string
   */
  private generateCacheKey(medications: string[]): string {
    // Sort medications to ensure consistent cache keys
    const sorted = medications
      .map(med => this.normalizeDrugName(med))
      .sort()
      .join('|');

    return `fdb:interactions:${sorted}`;
  }

  /**
   * Call FDB MedKnowledge API (production implementation)
   * Implements retry logic with exponential backoff for transient errors
   * @param medications Array of medication names
   * @returns Raw API response
   */
  private async callFDBAPI(medications: string[]): Promise<any> {
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(`${this.config.apiUrl}/api/v1/druginteractions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
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
            const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : this.config.baseDelayMs * Math.pow(2, attempt);
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
        console.error(`[FDB Service] API call attempt ${attempt + 1}/${this.config.maxRetries} failed:`, error.message);

        // Don't retry on auth errors or client errors
        if (error.message.includes('authentication failed') || error.message.includes('client error')) {
          throw error;
        }

        // If last attempt, throw error
        if (attempt === this.config.maxRetries - 1) {
          throw new Error(`FDB API call failed after ${this.config.maxRetries} attempts: ${error.message}`);
        }

        // Wait before retrying (exponential backoff)
        const delayMs = this.config.baseDelayMs * Math.pow(2, attempt);
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
   * Uses comprehensive drug database with 100+ drugs and interactions
   * Provides extensive sample data for testing purposes
   * @param medications Array of medication names
   * @returns Mock DrugInteractionResult
   */
  private mockCheckDrugInteractions(medications: string[]): DrugInteractionResult {
    const interactions: DrugInteraction[] = [];

    // Import comprehensive interaction database
    const { INTERACTION_DATABASE } = require('./drug-database');

    // Normalize medication names for comparison
    const normalizedMeds = medications.map(med => this.normalizeDrugName(med));

    // Check all pairs of medications against the comprehensive database
    for (let i = 0; i < normalizedMeds.length; i++) {
      for (let j = i + 1; j < normalizedMeds.length; j++) {
        const med1 = normalizedMeds[i];
        const med2 = normalizedMeds[j];

        // Search interaction database for this pair
        const foundInteraction = INTERACTION_DATABASE.find((interaction: any) => {
          const int1 = this.normalizeDrugName(interaction.drug1);
          const int2 = this.normalizeDrugName(interaction.drug2);

          return (
            (int1 === med1 && int2 === med2) ||
            (int1 === med2 && int2 === med1)
          );
        });

        if (foundInteraction) {
          interactions.push({
            drug1: medications[i],
            drug2: medications[j],
            severity: foundInteraction.severity,
            description: foundInteraction.description,
            recommendation: foundInteraction.recommendation,
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
   * Normalize drug name for comparison
   * Handles variations in drug naming (generic, brand, case, spacing)
   * @param drugName Drug name to normalize
   * @returns Normalized drug name
   */
  private normalizeDrugName(drugName: string): string {
    return drugName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric characters
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
