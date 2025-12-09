/**
 * FDB DrugPoint API Configuration
 * T8-001: FDB Drug Interactions API Integration
 * Centralized configuration for FDB MedKnowledge API
 */

export interface FDBConfig {
  apiUrl: string;
  apiKey: string;
  timeout: number;
  cacheTTL: number;
  maxRetries: number;
  baseDelayMs: number;
  auditLoggingEnabled: boolean;
  performanceMetricsEnabled: boolean;
}

/**
 * Get FDB configuration from environment variables with defaults
 * @returns FDB configuration object
 */
export function getFDBConfig(): FDBConfig {
  return {
    // FDB API endpoint
    apiUrl: process.env.FDB_BASE_URL || process.env.FDB_API_URL || '',

    // FDB API authentication key
    apiKey: process.env.FDB_API_KEY || '',

    // Request timeout in milliseconds (default: 5 seconds)
    timeout: parseInt(process.env.FDB_TIMEOUT_MS || '5000', 10),

    // Cache TTL in seconds (default: 24 hours = 86400 seconds)
    cacheTTL: parseInt(process.env.FDB_CACHE_TTL || '86400', 10),

    // Maximum retry attempts for failed API calls
    maxRetries: parseInt(process.env.FDB_MAX_RETRIES || '3', 10),

    // Base delay for exponential backoff in milliseconds
    baseDelayMs: parseInt(process.env.FDB_BASE_DELAY_MS || '1000', 10),

    // Enable audit logging for compliance (default: enabled in production)
    auditLoggingEnabled: process.env.FDB_AUDIT_LOGGING !== 'false',

    // Enable performance metrics for P95 tracking (default: enabled)
    performanceMetricsEnabled: process.env.FDB_METRICS !== 'false',
  };
}

/**
 * Validate FDB configuration
 * @param config FDB configuration
 * @returns true if valid, throws error if invalid
 */
export function validateFDBConfig(config: FDBConfig): boolean {
  // Allow unconfigured API for mock mode
  if (!config.apiUrl || !config.apiKey) {
    console.warn(
      '[FDB Config] API credentials not configured. Running in MOCK mode. ' +
      'Set FDB_BASE_URL and FDB_API_KEY environment variables for production.'
    );
    return true;
  }

  // Validate URL format
  try {
    new URL(config.apiUrl);
  } catch (error) {
    throw new Error(`Invalid FDB_BASE_URL: ${config.apiUrl}`);
  }

  // Validate timeout
  if (config.timeout < 1000 || config.timeout > 30000) {
    throw new Error(`FDB_TIMEOUT_MS must be between 1000 and 30000 ms, got ${config.timeout}`);
  }

  // Validate cache TTL
  if (config.cacheTTL < 0) {
    throw new Error(`FDB_CACHE_TTL must be non-negative, got ${config.cacheTTL}`);
  }

  // Validate retry settings
  if (config.maxRetries < 0 || config.maxRetries > 10) {
    throw new Error(`FDB_MAX_RETRIES must be between 0 and 10, got ${config.maxRetries}`);
  }

  if (config.baseDelayMs < 100 || config.baseDelayMs > 10000) {
    throw new Error(`FDB_BASE_DELAY_MS must be between 100 and 10000 ms, got ${config.baseDelayMs}`);
  }

  return true;
}

/**
 * FDB Audit Log Entry
 * Structured audit log for compliance tracking
 */
export interface FDBAuditLog {
  timestamp: Date;
  action: 'INTERACTION_CHECK' | 'ALLERGY_CHECK' | 'DRUG_LOOKUP' | 'HEALTH_CHECK';
  medications?: string[];
  patientId?: string;
  result: 'SUCCESS' | 'ERROR' | 'CACHE_HIT' | 'FALLBACK_MOCK';
  durationMs: number;
  interactionCount?: number;
  allergyWarningCount?: number;
  errorMessage?: string;
  apiResponseCode?: number;
  cacheHit?: boolean;
}

/**
 * Performance Metrics for P95 tracking
 */
export interface FDBPerformanceMetrics {
  operation: string;
  durationMs: number;
  timestamp: Date;
  success: boolean;
  cacheHit: boolean;
}
