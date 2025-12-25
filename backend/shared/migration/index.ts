/**
 * Data Migration Framework
 * T8-067: Healthcare data migration with zero data loss guarantee
 *
 * This module provides a comprehensive migration framework for the MetaPharm
 * Connect platform, designed for HIPAA/GDPR compliant healthcare data.
 *
 * Features:
 * - Migration scripts framework with rollback support
 * - Data validation rules engine
 * - Pre-migration data audit tools
 * - Post-migration verification scripts
 * - Data integrity checks
 * - Migration progress tracking and logging
 *
 * Usage:
 * ```typescript
 * import {
 *   MigrationRunner,
 *   ValidationRulesEngine,
 *   DataAuditor,
 *   MigrationVerifier,
 *   createNotNullRule,
 *   createForeignKeyRule,
 * } from '@metapharm/backend/shared/migration';
 *
 * // Create logger
 * const logger = createWinstonLogger();
 *
 * // Initialize runner
 * const runner = new MigrationRunner(logger);
 *
 * // Register migrations
 * runner.registerMigration(new MyMigration());
 *
 * // Configure validation rules
 * const validator = runner.getValidationEngine();
 * validator.addRule(createNotNullRule('rule-1', 'users', 'email'));
 *
 * // Run pre-migration audit
 * const auditor = runner.getDataAuditor();
 * const auditReport = await auditor.generateAuditReport(transaction, ['users']);
 *
 * // Run migrations
 * const results = await runner.runAll(transactionFactory);
 *
 * // Verify migration success
 * const verifier = new MigrationVerifier(logger);
 * const verification = await verifier.verify(transaction);
 * ```
 */

// ============================================================================
// Type Exports
// ============================================================================

export * from './types';

// ============================================================================
// Core Classes
// ============================================================================

export { MigrationRunner } from './MigrationRunner';
export { default as MigrationRunnerDefault } from './MigrationRunner';

export {
  ValidationRulesEngine,
  createNotNullRule,
  createForeignKeyRule,
  createPatternRule,
  createRowCountRule,
} from './ValidationRulesEngine';
export { default as ValidationRulesEngineDefault } from './ValidationRulesEngine';
export type { CustomValidatorFn } from './ValidationRulesEngine';

export { DataAuditor } from './DataAuditor';
export { default as DataAuditorDefault } from './DataAuditor';

export {
  MigrationVerifier,
  createRowCountCheck,
  createNonEmptyCheck,
  createNoNullCheck,
} from './MigrationVerifier';
export { default as MigrationVerifierDefault } from './MigrationVerifier';
export type {
  VerificationConfig,
  CustomVerificationCheck,
  TableFingerprint,
} from './MigrationVerifier';

// ============================================================================
// Convenience Re-exports
// ============================================================================

// Common types for quick access
export {
  MigrationStatus,
  MigrationDirection,
  ValidationSeverity,
  ValidationRuleType,
  DataType,
  MigrationAuditAction,
  DataAuditIssueType,
  MigrationEventType,
} from './types';

// ============================================================================
// Factory Functions
// ============================================================================

import { MigrationRunner } from './MigrationRunner';
import { MigrationVerifier } from './MigrationVerifier';
import { MigrationLogger } from './types';

/**
 * Create a fully configured migration runner with all components
 */
export function createMigrationRunner(logger: MigrationLogger): {
  runner: MigrationRunner;
  verifier: MigrationVerifier;
} {
  const runner = new MigrationRunner(logger);
  const verifier = new MigrationVerifier(logger);

  return { runner, verifier };
}

// ============================================================================
// Winston Logger Adapter
// ============================================================================

import winston from 'winston';

/**
 * Create a Winston-based migration logger
 */
export function createWinstonMigrationLogger(
  winstonLogger?: winston.Logger
): MigrationLogger {
  const logger = winstonLogger || winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'migration' },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });

  return {
    debug: (message: string, meta?: Record<string, unknown>) => {
      logger.debug(message, meta);
    },
    info: (message: string, meta?: Record<string, unknown>) => {
      logger.info(message, meta);
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      logger.warn(message, meta);
    },
    error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
      logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
    },
  };
}

// ============================================================================
// Console Logger (for testing)
// ============================================================================

/**
 * Create a simple console-based migration logger (for testing)
 */
export function createConsoleMigrationLogger(): MigrationLogger {
  const formatMeta = (meta?: Record<string, unknown>): string => {
    return meta ? ` ${JSON.stringify(meta)}` : '';
  };

  return {
    debug: (message: string, meta?: Record<string, unknown>) => {
      console.debug(`[DEBUG] ${message}${formatMeta(meta)}`);
    },
    info: (message: string, meta?: Record<string, unknown>) => {
      console.info(`[INFO] ${message}${formatMeta(meta)}`);
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      console.warn(`[WARN] ${message}${formatMeta(meta)}`);
    },
    error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
      console.error(`[ERROR] ${message}`, error, formatMeta(meta));
    },
  };
}
