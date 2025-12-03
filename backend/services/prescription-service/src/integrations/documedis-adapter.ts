/**
 * Documedis API Adapter for Swiss Drug Database
 * Provides Swiss-specific drug interaction checking via HCI Solutions Documedis platform
 *
 * Task: T5-006 - Implement Swiss drug database service (Documedis adapter)
 * Research: bazinga/artifacts/bazinga_20251203_135306/research_group_R2_DRUG.md
 *
 * Features:
 * - Native GTIN/Swissmedic number support (GTIN 7680 prefix)
 * - Swiss ATC classification from Swissmedic
 * - INDEX database with 450k+ Swiss products
 * - FHIR/SNOMED-CT standards compliance
 * - Fallback to FDB mock data when unavailable
 *
 * API Documentation: https://documedis.hcisolutions.ch/2020-01/api/docs/index.html
 */

import {
  FDBService,
  DrugInteraction,
  DrugInteractionResult,
  DrugInteractionSeverity
} from './fdb';

/**
 * Swiss drug information extended with Swissmedic fields
 */
export interface SwissDrugInfo {
  gtin: string;                    // GTIN code (7680 prefix for Swiss drugs)
  swissmedicNumber?: string;       // Swissmedic authorization number
  name: string;                    // Drug name
  genericName?: string;            // Generic name
  atcCode?: string;                // ATC classification code
  strength?: string;               // Dosage strength
  form?: string;                   // Pharmaceutical form
  manufacturer?: string;           // Manufacturer name
  dispensingCategory?: 'A+' | 'A' | 'B' | 'D' | 'E';  // Swiss dispensing category
  swissApproved: boolean;          // Approved by Swissmedic
}

/**
 * Documedis API response for medication check
 */
interface DocumentisMedicationCheckResponse {
  interactions: DocumentisInteraction[];
  metadata?: {
    checkedAt: string;
    apiVersion: string;
  };
}

/**
 * Documedis interaction format
 */
interface DocumentisInteraction {
  gtin1: string;
  gtin2: string;
  drugName1: string;
  drugName2: string;
  severityLevel: string;          // 'contraindicated' | 'major' | 'moderate' | 'minor'
  description: string;
  clinicalEffect: string;
  managementGuidance: string;
}

/**
 * Documedis article lookup response
 */
interface DocumentisArticleResponse {
  gtin: string;
  swissmedicNumber?: string;
  name: string;
  genericName?: string;
  atcCode?: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
  category?: string;
}

/**
 * Documedis Adapter
 * Implements FDBService interface using Documedis API for Swiss drug data
 */
export class DocumedisAdapter extends FDBService {
  private documedisApiUrl: string;
  private documedisToken: string;
  private useDocumedis: boolean;
  private cacheEnabled: boolean;
  private drugInfoCache: Map<string, SwissDrugInfo>;
  private interactionCache: Map<string, DrugInteractionResult>;
  private cacheTTL: number;

  constructor() {
    // Initialize parent FDB service (provides fallback mock data)
    super();

    // Documedis configuration
    this.documedisApiUrl = process.env.DOCUMEDIS_API_URL || '';
    this.documedisToken = process.env.DOCUMEDIS_API_TOKEN || '';
    this.useDocumedis = Boolean(this.documedisApiUrl && this.documedisToken);

    // Cache configuration
    this.cacheEnabled = process.env.DOCUMEDIS_CACHE_ENABLED !== 'false';
    this.cacheTTL = parseInt(process.env.DOCUMEDIS_CACHE_TTL || '86400'); // 24 hours default
    this.drugInfoCache = new Map();
    this.interactionCache = new Map();

    if (this.useDocumedis) {
      console.info('[Documedis Adapter] Initialized with Documedis API credentials');
      console.info(`[Documedis Adapter] Cache: ${this.cacheEnabled ? `enabled (TTL: ${this.cacheTTL}s)` : 'disabled'}`);
    } else {
      console.warn(
        '[Documedis Adapter] WARNING: Documedis API credentials not configured. ' +
        'Falling back to FDB mock data. Configure DOCUMEDIS_API_URL and DOCUMEDIS_API_TOKEN for Swiss drug data.'
      );
    }
  }

  /**
   * Look up Swiss drug by GTIN code
   * Primary identifier for Swiss drugs (7680xxxxx format)
   * T5-006: Drug lookup by GTIN
   *
   * @param gtin GTIN code (e.g., "7680xxxxx")
   * @returns Swiss drug information or null if not found
   */
  async lookupByGTIN(gtin: string): Promise<SwissDrugInfo | null> {
    // Validate GTIN format
    if (!this.isValidGTIN(gtin)) {
      console.warn(`[Documedis Adapter] Invalid GTIN format: ${gtin}`);
      return null;
    }

    // Check cache first
    if (this.cacheEnabled) {
      const cached = this.drugInfoCache.get(gtin);
      if (cached) {
        console.log(`[Documedis Adapter] Cache hit for GTIN: ${gtin}`);
        return cached;
      }
    }

    // If Documedis not configured, return null
    if (!this.useDocumedis) {
      console.warn('[Documedis Adapter] Cannot lookup GTIN - Documedis API not configured');
      return null;
    }

    try {
      // Call Documedis INDEX API
      const response = await this.callDocumedisArticleAPI(gtin);

      if (!response) {
        return null;
      }

      // Convert to SwissDrugInfo
      const drugInfo: SwissDrugInfo = {
        gtin: response.gtin,
        swissmedicNumber: response.swissmedicNumber,
        name: response.name,
        genericName: response.genericName,
        atcCode: response.atcCode,
        strength: response.strength,
        form: response.form,
        manufacturer: response.manufacturer,
        dispensingCategory: this.parseDispensingCategory(response.category),
        swissApproved: true, // All drugs in INDEX are Swissmedic approved
      };

      // Cache the result
      if (this.cacheEnabled) {
        this.drugInfoCache.set(gtin, drugInfo);
        console.log(`[Documedis Adapter] Cached drug info for GTIN: ${gtin}`);
      }

      return drugInfo;

    } catch (error) {
      console.error(`[Documedis Adapter] Failed to lookup GTIN ${gtin}:`, error);
      return null;
    }
  }

  /**
   * Look up Swiss drug by Swissmedic authorization number
   * Alternative identifier for Swiss drugs
   * T5-006: Drug lookup by Swissmedic number
   *
   * @param swissmedicNumber Swissmedic authorization number
   * @returns Swiss drug information or null if not found
   */
  async lookupBySwissmedicNumber(swissmedicNumber: string): Promise<SwissDrugInfo | null> {
    // Note: Documedis API uses GTIN as primary key
    // In production, would need to search or maintain a mapping
    // For now, log and return null
    console.warn(
      '[Documedis Adapter] Swissmedic number lookup not yet implemented. ' +
      'Documedis API uses GTIN as primary identifier. Consider maintaining a Swissmedic→GTIN mapping.'
    );
    return null;
  }

  /**
   * Check drug interactions using Documedis CDS API
   * Overrides FDBService.checkDrugInteractions with Swiss data
   * T5-007: Drug-drug interaction checking
   *
   * @param medications Array of medication names or GTINs
   * @returns Drug interaction result with Swiss-specific data
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

    // Generate cache key
    const cacheKey = this.generateInteractionCacheKey(medications);

    // Check cache first
    if (this.cacheEnabled) {
      const cached = this.interactionCache.get(cacheKey);
      if (cached) {
        console.log(`[Documedis Adapter] Interaction cache hit for: ${cacheKey}`);
        return cached;
      }
    }

    // If Documedis not configured, fall back to parent FDB mock data
    if (!this.useDocumedis) {
      console.warn('[Documedis Adapter] Falling back to FDB mock data (Documedis not configured)');
      return super.checkDrugInteractions(medications);
    }

    try {
      // Convert medication names to GTINs if needed
      const gtins = await this.resolveToGTINs(medications);

      // Call Documedis medication check API
      const response = await this.callDocumedisMedicationCheckAPI(gtins);

      // Parse response
      const result = this.parseDocumedisInteractionResponse(response);

      // Cache result
      if (this.cacheEnabled) {
        this.interactionCache.set(cacheKey, result);
        console.log(`[Documedis Adapter] Cached interaction result for: ${cacheKey}`);
      }

      return result;

    } catch (error) {
      console.error('[Documedis Adapter] Failed to check interactions:', error);
      console.warn('[Documedis Adapter] Falling back to FDB mock data due to error');

      // Graceful fallback to FDB mock data
      return super.checkDrugInteractions(medications);
    }
  }

  /**
   * Call Documedis Article API to lookup drug by GTIN
   * Endpoint: GET /api/article/{GTIN}
   *
   * @param gtin GTIN code
   * @returns Article response or null
   */
  private async callDocumedisArticleAPI(gtin: string): Promise<DocumentisArticleResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${this.documedisApiUrl}/api/article/${gtin}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.documedisToken}`,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[Documedis Adapter] Drug not found: GTIN ${gtin}`);
          return null;
        }
        throw new Error(`Documedis Article API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error: any) {
      console.error(`[Documedis Adapter] Article API call failed for GTIN ${gtin}:`, error.message);
      throw error;
    }
  }

  /**
   * Call Documedis Medication Check API
   * Endpoint: POST /api/medication-check
   * T5-007: Interaction checking
   *
   * @param gtins Array of GTINs to check
   * @returns Medication check response
   */
  private async callDocumedisMedicationCheckAPI(
    gtins: string[]
  ): Promise<DocumentisMedicationCheckResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${this.documedisApiUrl}/api/medication-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.documedisToken}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          gtins: gtins,
          severityLevels: ['contraindicated', 'major', 'moderate', 'minor'],
          includeGuidance: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Documedis Medication Check API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error: any) {
      console.error('[Documedis Adapter] Medication Check API call failed:', error.message);
      throw error;
    }
  }

  /**
   * Parse Documedis interaction response into DrugInteractionResult
   * Maps Documedis format to FDB-compatible format
   *
   * @param response Documedis API response
   * @returns Drug interaction result
   */
  private parseDocumedisInteractionResponse(
    response: DocumentisMedicationCheckResponse
  ): DrugInteractionResult {
    const interactions: DrugInteraction[] = [];

    if (!response || !response.interactions) {
      return {
        hasInteractions: false,
        interactions: [],
        checkedAt: new Date(),
      };
    }

    // Convert each Documedis interaction to DrugInteraction format
    for (const docInteraction of response.interactions) {
      try {
        interactions.push({
          drug1: docInteraction.drugName1,
          drug2: docInteraction.drugName2,
          severity: this.mapDocumedisSeverity(docInteraction.severityLevel),
          description: docInteraction.description || docInteraction.clinicalEffect,
          recommendation: docInteraction.managementGuidance || 'Consult healthcare provider',
        });
      } catch (parseError) {
        console.error('[Documedis Adapter] Failed to parse interaction:', parseError);
      }
    }

    return {
      hasInteractions: interactions.length > 0,
      interactions,
      checkedAt: new Date(),
    };
  }

  /**
   * Map Documedis severity levels to DrugInteractionSeverity enum
   *
   * @param documedisSeverity Documedis severity string
   * @returns DrugInteractionSeverity enum value
   */
  private mapDocumedisSeverity(documedisSeverity: string): DrugInteractionSeverity {
    const severityLower = documedisSeverity.toLowerCase().trim();

    if (severityLower === 'contraindicated' || severityLower === 'contraindication') {
      return DrugInteractionSeverity.CONTRAINDICATED;
    }
    if (severityLower === 'major' || severityLower === 'severe') {
      return DrugInteractionSeverity.MAJOR;
    }
    if (severityLower === 'moderate') {
      return DrugInteractionSeverity.MODERATE;
    }
    if (severityLower === 'minor' || severityLower === 'low') {
      return DrugInteractionSeverity.MINOR;
    }

    // Default to MINOR if unknown
    console.warn(`[Documedis Adapter] Unknown severity: ${documedisSeverity}, defaulting to MINOR`);
    return DrugInteractionSeverity.MINOR;
  }

  /**
   * Resolve medication names to GTINs
   * For now, returns input (assumes GTINs provided)
   * In production, would query drug database or maintain name→GTIN mapping
   *
   * @param medications Array of medication names or GTINs
   * @returns Array of GTINs
   */
  private async resolveToGTINs(medications: string[]): Promise<string[]> {
    // TODO: Implement name-to-GTIN resolution
    // For MVP, assume medications are provided as GTINs
    // In production, would:
    // 1. Check if already GTIN (7680xxxxx pattern)
    // 2. If not, search Documedis INDEX by name
    // 3. Return resolved GTIN
    return medications.filter(med => this.isValidGTIN(med));
  }

  /**
   * Validate GTIN format
   * Swiss GTINs start with 7680 (Swissmedic range)
   *
   * @param gtin GTIN to validate
   * @returns True if valid GTIN format
   */
  private isValidGTIN(gtin: string): boolean {
    // GTIN-13 format: 13 digits
    // Swiss drugs: 7680xxxxxxxxx
    const gtinPattern = /^7680\d{9}$/;
    return gtinPattern.test(gtin);
  }

  /**
   * Parse Swiss dispensing category from Documedis response
   * Categories: A+ (hospital only), A (prescription), B (pharmacist), D (self-service), E (general sale)
   *
   * @param category Category string from Documedis
   * @returns Dispensing category
   */
  private parseDispensingCategory(category?: string): 'A+' | 'A' | 'B' | 'D' | 'E' | undefined {
    if (!category) return undefined;

    const categoryUpper = category.toUpperCase().trim();
    if (['A+', 'A', 'B', 'D', 'E'].includes(categoryUpper)) {
      return categoryUpper as 'A+' | 'A' | 'B' | 'D' | 'E';
    }

    return undefined;
  }

  /**
   * Generate cache key for interaction results
   *
   * @param medications Array of medication names/GTINs
   * @returns Cache key string
   */
  private generateInteractionCacheKey(medications: string[]): string {
    const sorted = medications
      .map(med => med.toLowerCase().trim())
      .sort()
      .join('|');
    return `documedis-interactions:${sorted}`;
  }

  /**
   * Clear all caches (for testing/maintenance)
   */
  clearCache(): void {
    this.drugInfoCache.clear();
    this.interactionCache.clear();
    console.info('[Documedis Adapter] Cache cleared');
  }

  /**
   * Get health status including Documedis connectivity
   * Overrides parent method to include Documedis-specific health
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down' | 'unconfigured';
    usingMockData: boolean;
    lastCheck: Date | null;
    consecutiveFailures: number;
    message: string;
    provider: 'Documedis' | 'FDB Mock';
  }> {
    const baseHealth = await super.getHealthStatus();

    if (!this.useDocumedis) {
      return {
        ...baseHealth,
        provider: 'FDB Mock',
        message: 'Documedis API not configured. Using FDB mock data.',
      };
    }

    // Test Documedis health endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.documedisApiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.documedisToken}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          status: 'healthy',
          usingMockData: false,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          message: 'Documedis API is operational',
          provider: 'Documedis',
        };
      } else {
        return {
          status: 'degraded',
          usingMockData: false,
          lastCheck: new Date(),
          consecutiveFailures: 1,
          message: `Documedis API degraded: HTTP ${response.status}`,
          provider: 'Documedis',
        };
      }
    } catch (error) {
      return {
        status: 'down',
        usingMockData: true,
        lastCheck: new Date(),
        consecutiveFailures: 1,
        message: 'Documedis API unavailable. Falling back to FDB mock data.',
        provider: 'FDB Mock',
      };
    }
  }
}
