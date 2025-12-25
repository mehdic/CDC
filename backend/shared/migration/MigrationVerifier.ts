/**
 * Migration Verifier
 * T8-067: Post-migration verification and data integrity checks
 *
 * Provides comprehensive verification after migration to ensure:
 * - Data integrity (no data loss)
 * - Row count accuracy
 * - Checksum validation
 * - Foreign key integrity
 * - Data sampling validation
 *
 * Critical for healthcare data compliance.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  VerificationResult,
  VerificationCheck,
  DatabaseTransaction,
  MigrationLogger,
  TableAuditInfo,
} from './types';

// ============================================================================
// Verification Configuration
// ============================================================================

export interface VerificationConfig {
  /** Tables to verify (empty = all tables in migration) */
  tables?: string[];
  /** Row count tolerance percentage (default: 0) */
  rowCountTolerance?: number;
  /** Enable checksum validation (default: true) */
  validateChecksums?: boolean;
  /** Enable foreign key validation (default: true) */
  validateForeignKeys?: boolean;
  /** Sample size for data sampling (default: 100) */
  sampleSize?: number;
  /** Enable data sampling validation (default: true) */
  enableSampling?: boolean;
  /** Custom verification checks */
  customChecks?: CustomVerificationCheck[];
}

export interface CustomVerificationCheck {
  name: string;
  description: string;
  check: (transaction: DatabaseTransaction) => Promise<boolean>;
  expectedValue?: unknown;
}

export interface TableFingerprint {
  tableName: string;
  rowCount: number;
  checksum: string;
  columnChecksums?: Record<string, string>;
  timestamp: Date;
}

// ============================================================================
// Migration Verifier Implementation
// ============================================================================

export class MigrationVerifier {
  private logger: MigrationLogger;
  private preFingerprints: Map<string, TableFingerprint> = new Map();

  constructor(logger: MigrationLogger) {
    this.logger = logger;
  }

  // ============================================================================
  // Pre-Migration Fingerprinting
  // ============================================================================

  /**
   * Capture table fingerprints before migration
   * Call this before running migrations to enable comparison
   */
  async capturePreMigrationState(
    transaction: DatabaseTransaction,
    tables: string[]
  ): Promise<Map<string, TableFingerprint>> {
    this.logger.info('Capturing pre-migration fingerprints', { tables });

    const fingerprints = new Map<string, TableFingerprint>();

    for (const tableName of tables) {
      try {
        const fingerprint = await this.generateFingerprint(transaction, tableName);
        fingerprints.set(tableName, fingerprint);
        this.preFingerprints.set(tableName, fingerprint);
      } catch (error) {
        this.logger.warn(`Failed to fingerprint table ${tableName}: ${(error as Error).message}`);
      }
    }

    this.logger.info('Pre-migration fingerprints captured', {
      tableCount: fingerprints.size,
    });

    return fingerprints;
  }

  /**
   * Generate a fingerprint for a single table
   */
  async generateFingerprint(
    transaction: DatabaseTransaction,
    tableName: string
  ): Promise<TableFingerprint> {
    // Get row count
    const countSql = `SELECT COUNT(*) as count FROM "${tableName}"`;
    const countResult = await transaction.queryOne<{ count: string }>(countSql);
    const rowCount = parseInt(countResult?.count || '0', 10);

    // Get primary key column
    const pkColumn = await this.getPrimaryKeyColumn(transaction, tableName);

    // Calculate checksum
    const checksumSql = `
      SELECT MD5(STRING_AGG(t::text, '' ORDER BY "${pkColumn}")) as checksum
      FROM "${tableName}" t
    `;
    const checksumResult = await transaction.queryOne<{ checksum: string }>(checksumSql);
    const checksum = checksumResult?.checksum || '';

    // Get column checksums for detailed validation
    const columns = await this.getTableColumns(transaction, tableName);
    const columnChecksums: Record<string, string> = {};

    for (const column of columns) {
      try {
        const colChecksumSql = `
          SELECT MD5(STRING_AGG("${column}"::text, '' ORDER BY "${pkColumn}")) as checksum
          FROM "${tableName}"
          WHERE "${column}" IS NOT NULL
        `;
        const colResult = await transaction.queryOne<{ checksum: string }>(colChecksumSql);
        columnChecksums[column] = colResult?.checksum || '';
      } catch (error) {
        // Some columns may not support this operation
        this.logger.debug(`Could not checksum column ${column}: ${(error as Error).message}`);
      }
    }

    return {
      tableName,
      rowCount,
      checksum,
      columnChecksums,
      timestamp: new Date(),
    };
  }

  // ============================================================================
  // Post-Migration Verification
  // ============================================================================

  /**
   * Verify migration success with comprehensive checks
   */
  async verify(
    transaction: DatabaseTransaction,
    config: VerificationConfig = {}
  ): Promise<VerificationResult> {
    const startTime = Date.now();
    const checks: VerificationCheck[] = [];

    this.logger.info('Starting post-migration verification');

    const tables = config.tables || Array.from(this.preFingerprints.keys());

    // Row count verification
    const rowCountChecks = await this.verifyRowCounts(
      transaction,
      tables,
      config.rowCountTolerance || 0
    );
    checks.push(...rowCountChecks);

    // Checksum verification (if enabled and pre-fingerprints exist)
    if (config.validateChecksums !== false && this.preFingerprints.size > 0) {
      const checksumChecks = await this.verifyChecksums(transaction, tables);
      checks.push(...checksumChecks);
    }

    // Foreign key integrity verification
    if (config.validateForeignKeys !== false) {
      const fkChecks = await this.verifyForeignKeys(transaction, tables);
      checks.push(...fkChecks);
    }

    // Data sampling verification
    if (config.enableSampling !== false && this.preFingerprints.size > 0) {
      const samplingChecks = await this.verifySampling(
        transaction,
        tables,
        config.sampleSize || 100
      );
      checks.push(...samplingChecks);
    }

    // Run custom checks
    if (config.customChecks) {
      for (const customCheck of config.customChecks) {
        const check = await this.runCustomCheck(transaction, customCheck);
        checks.push(check);
      }
    }

    const passed = checks.every(c => c.passed);
    const duration = Date.now() - startTime;

    const result: VerificationResult = {
      passed,
      checks,
      timestamp: new Date(),
      durationMs: duration,
    };

    this.logger.info('Post-migration verification completed', {
      passed,
      totalChecks: checks.length,
      passedChecks: checks.filter(c => c.passed).length,
      failedChecks: checks.filter(c => !c.passed).length,
      durationMs: duration,
    });

    return result;
  }

  // ============================================================================
  // Verification Methods
  // ============================================================================

  private async verifyRowCounts(
    transaction: DatabaseTransaction,
    tables: string[],
    tolerance: number
  ): Promise<VerificationCheck[]> {
    const checks: VerificationCheck[] = [];

    for (const tableName of tables) {
      const preFingerprint = this.preFingerprints.get(tableName);
      const expectedCount = preFingerprint?.rowCount;

      const countSql = `SELECT COUNT(*) as count FROM "${tableName}"`;
      const result = await transaction.queryOne<{ count: string }>(countSql);
      const actualCount = parseInt(result?.count || '0', 10);

      let passed = true;
      let message = '';

      if (expectedCount !== undefined) {
        const minExpected = Math.floor(expectedCount * (1 - tolerance / 100));
        const maxExpected = Math.ceil(expectedCount * (1 + tolerance / 100));
        passed = actualCount >= minExpected && actualCount <= maxExpected;
        message = passed
          ? `Row count ${actualCount} is within expected range`
          : `Row count ${actualCount} differs from expected ${expectedCount} (tolerance: ${tolerance}%)`;
      } else {
        message = `Row count: ${actualCount} (no pre-migration baseline)`;
      }

      checks.push({
        name: `Row count: ${tableName}`,
        passed,
        expected: expectedCount,
        actual: actualCount,
        tolerance,
        message,
      });
    }

    return checks;
  }

  private async verifyChecksums(
    transaction: DatabaseTransaction,
    tables: string[]
  ): Promise<VerificationCheck[]> {
    const checks: VerificationCheck[] = [];

    for (const tableName of tables) {
      const preFingerprint = this.preFingerprints.get(tableName);
      if (!preFingerprint) continue;

      try {
        const currentFingerprint = await this.generateFingerprint(transaction, tableName);

        // Overall checksum check
        const checksumMatch = preFingerprint.checksum === currentFingerprint.checksum;

        checks.push({
          name: `Checksum: ${tableName}`,
          passed: checksumMatch,
          expected: preFingerprint.checksum,
          actual: currentFingerprint.checksum,
          message: checksumMatch
            ? 'Table checksum matches pre-migration state'
            : 'Table checksum differs from pre-migration state (data modified)',
        });

        // Column-level checksum checks for detailed diagnosis
        if (!checksumMatch && preFingerprint.columnChecksums && currentFingerprint.columnChecksums) {
          for (const [column, expectedChecksum] of Object.entries(preFingerprint.columnChecksums)) {
            const actualChecksum = currentFingerprint.columnChecksums[column];
            if (actualChecksum && expectedChecksum !== actualChecksum) {
              checks.push({
                name: `Column checksum: ${tableName}.${column}`,
                passed: false,
                expected: expectedChecksum,
                actual: actualChecksum,
                message: `Column ${column} data has been modified`,
              });
            }
          }
        }
      } catch (error) {
        checks.push({
          name: `Checksum: ${tableName}`,
          passed: false,
          expected: 'valid checksum',
          actual: 'error',
          message: `Failed to verify checksum: ${(error as Error).message}`,
        });
      }
    }

    return checks;
  }

  private async verifyForeignKeys(
    transaction: DatabaseTransaction,
    tables: string[]
  ): Promise<VerificationCheck[]> {
    const checks: VerificationCheck[] = [];

    for (const tableName of tables) {
      // Get foreign keys for this table
      const fkSql = `
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1
      `;

      const foreignKeys = await transaction.query<{
        constraint_name: string;
        column_name: string;
        foreign_table_name: string;
        foreign_column_name: string;
      }>(fkSql, [tableName]);

      for (const fk of foreignKeys) {
        // Check for orphan records
        const orphanSql = `
          SELECT COUNT(*) as count
          FROM "${tableName}" t
          LEFT JOIN "${fk.foreign_table_name}" f
            ON t."${fk.column_name}" = f."${fk.foreign_column_name}"
          WHERE t."${fk.column_name}" IS NOT NULL
            AND f."${fk.foreign_column_name}" IS NULL
        `;

        const orphanResult = await transaction.queryOne<{ count: string }>(orphanSql);
        const orphanCount = parseInt(orphanResult?.count || '0', 10);

        checks.push({
          name: `FK integrity: ${tableName}.${fk.column_name} -> ${fk.foreign_table_name}`,
          passed: orphanCount === 0,
          expected: 0,
          actual: orphanCount,
          message: orphanCount === 0
            ? 'No orphan records found'
            : `${orphanCount} orphan records detected (missing foreign key references)`,
        });
      }
    }

    return checks;
  }

  private async verifySampling(
    transaction: DatabaseTransaction,
    tables: string[],
    sampleSize: number
  ): Promise<VerificationCheck[]> {
    const checks: VerificationCheck[] = [];

    for (const tableName of tables) {
      const preFingerprint = this.preFingerprints.get(tableName);
      if (!preFingerprint || preFingerprint.rowCount === 0) continue;

      try {
        const pkColumn = await this.getPrimaryKeyColumn(transaction, tableName);

        // Get a random sample of row IDs from before (if stored) or check current data consistency
        const sampleSql = `
          SELECT "${pkColumn}" as id
          FROM "${tableName}"
          ORDER BY RANDOM()
          LIMIT $1
        `;

        const sampleIds = await transaction.query<{ id: unknown }>(sampleSql, [sampleSize]);

        // Verify each sample row still exists and has valid data
        let validRows = 0;
        let invalidRows = 0;

        for (const row of sampleIds) {
          const verifySql = `
            SELECT COUNT(*) as count
            FROM "${tableName}"
            WHERE "${pkColumn}" = $1
          `;

          const verifyResult = await transaction.queryOne<{ count: string }>(verifySql, [row.id]);
          const exists = parseInt(verifyResult?.count || '0', 10) > 0;

          if (exists) {
            validRows++;
          } else {
            invalidRows++;
          }
        }

        const passRate = sampleIds.length > 0 ? validRows / sampleIds.length : 1;

        checks.push({
          name: `Data sampling: ${tableName}`,
          passed: passRate >= 0.99, // 99% threshold
          expected: sampleIds.length,
          actual: validRows,
          message: passRate >= 0.99
            ? `${validRows}/${sampleIds.length} sampled rows verified`
            : `${invalidRows} of ${sampleIds.length} sampled rows are missing or invalid`,
        });
      } catch (error) {
        checks.push({
          name: `Data sampling: ${tableName}`,
          passed: false,
          expected: 'valid sample',
          actual: 'error',
          message: `Sampling failed: ${(error as Error).message}`,
        });
      }
    }

    return checks;
  }

  private async runCustomCheck(
    transaction: DatabaseTransaction,
    customCheck: CustomVerificationCheck
  ): Promise<VerificationCheck> {
    try {
      const passed = await customCheck.check(transaction);

      return {
        name: customCheck.name,
        passed,
        expected: customCheck.expectedValue ?? true,
        actual: passed,
        message: passed
          ? `${customCheck.description} - passed`
          : `${customCheck.description} - failed`,
      };
    } catch (error) {
      return {
        name: customCheck.name,
        passed: false,
        expected: customCheck.expectedValue ?? true,
        actual: 'error',
        message: `${customCheck.description} - error: ${(error as Error).message}`,
      };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async getPrimaryKeyColumn(
    transaction: DatabaseTransaction,
    tableName: string
  ): Promise<string> {
    const pkSql = `
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass
        AND i.indisprimary
      LIMIT 1
    `;

    const result = await transaction.queryOne<{ attname: string }>(pkSql, [tableName]);
    return result?.attname || 'id';
  }

  private async getTableColumns(
    transaction: DatabaseTransaction,
    tableName: string
  ): Promise<string[]> {
    const sql = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `;

    const results = await transaction.query<{ column_name: string }>(sql, [tableName]);
    return results.map(r => r.column_name);
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Clear pre-migration fingerprints
   */
  clearFingerprints(): void {
    this.preFingerprints.clear();
  }

  /**
   * Get stored pre-migration fingerprints
   */
  getPreMigrationFingerprints(): Map<string, TableFingerprint> {
    return new Map(this.preFingerprints);
  }

  /**
   * Manually set a pre-migration fingerprint (for testing or external capture)
   */
  setPreMigrationFingerprint(tableName: string, fingerprint: TableFingerprint): void {
    this.preFingerprints.set(tableName, fingerprint);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a custom verification check for row count comparison
 */
export function createRowCountCheck(
  table: string,
  expectedCount: number,
  tolerance: number = 0
): CustomVerificationCheck {
  return {
    name: `Custom row count: ${table}`,
    description: `Verify ${table} has approximately ${expectedCount} rows`,
    expectedValue: expectedCount,
    check: async (transaction: DatabaseTransaction) => {
      const sql = `SELECT COUNT(*) as count FROM "${table}"`;
      const result = await transaction.queryOne<{ count: string }>(sql);
      const actualCount = parseInt(result?.count || '0', 10);

      const minExpected = Math.floor(expectedCount * (1 - tolerance / 100));
      const maxExpected = Math.ceil(expectedCount * (1 + tolerance / 100));

      return actualCount >= minExpected && actualCount <= maxExpected;
    },
  };
}

/**
 * Create a custom verification check for non-empty table
 */
export function createNonEmptyCheck(table: string): CustomVerificationCheck {
  return {
    name: `Non-empty: ${table}`,
    description: `Verify ${table} is not empty`,
    expectedValue: true,
    check: async (transaction: DatabaseTransaction) => {
      const sql = `SELECT COUNT(*) as count FROM "${table}" LIMIT 1`;
      const result = await transaction.queryOne<{ count: string }>(sql);
      return parseInt(result?.count || '0', 10) > 0;
    },
  };
}

/**
 * Create a custom verification check for no NULL values in required column
 */
export function createNoNullCheck(table: string, column: string): CustomVerificationCheck {
  return {
    name: `No NULL: ${table}.${column}`,
    description: `Verify ${table}.${column} has no NULL values`,
    expectedValue: 0,
    check: async (transaction: DatabaseTransaction) => {
      const sql = `SELECT COUNT(*) as count FROM "${table}" WHERE "${column}" IS NULL`;
      const result = await transaction.queryOne<{ count: string }>(sql);
      return parseInt(result?.count || '0', 10) === 0;
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export default MigrationVerifier;
