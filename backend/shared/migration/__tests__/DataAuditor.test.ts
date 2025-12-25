/**
 * DataAuditor Tests
 * T8-067: Data Migration and Validation
 */

import { DataAuditor } from '../DataAuditor';
import {
  ValidationSeverity,
  DataAuditIssueType,
  MigrationLogger,
  DatabaseTransaction,
} from '../types';

// ============================================================================
// Mock Logger
// ============================================================================

const createMockLogger = (): MigrationLogger => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

// ============================================================================
// Mock Database Transaction
// ============================================================================

const createMockTransaction = (
  tableMetadata: Record<string, Record<string, unknown>> = {}
): DatabaseTransaction => {
  const defaultMetadata: Record<string, unknown[]> = {
    // Tables
    'information_schema.tables': [
      { table_name: 'users' },
      { table_name: 'orders' },
    ],
    // Columns for users
    "table_name = 'users'": [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
      { column_name: 'email', data_type: 'varchar', is_nullable: 'NO' },
      { column_name: 'name', data_type: 'varchar', is_nullable: 'YES' },
      { column_name: 'phone', data_type: 'varchar', is_nullable: 'YES' },
    ],
    // Count for users
    'COUNT(*) as count': [{ count: '100' }],
    // Column stats
    'COUNT(DISTINCT': [{ total_count: '100', non_null_count: '95', distinct_count: '95' }],
    // Sample values
    'DISTINCT': [{ value: 'test@example.com' }, { value: 'user@domain.com' }],
    // Primary key
    'indisprimary': [{ attname: 'id' }],
    // Checksum
    'MD5(STRING_AGG': [{ checksum: 'abc123def456' }],
    // Foreign keys
    "constraint_type = 'FOREIGN KEY'": [],
    // Indexes
    'pg_index': [
      { index_name: 'users_pkey', column_name: 'id', is_unique: true, index_type: 'btree' },
      { index_name: 'users_email_idx', column_name: 'email', is_unique: true, index_type: 'btree' },
    ],
  };

  return {
    query: jest.fn().mockImplementation(async (sql: string, params?: unknown[]) => {
      for (const [pattern, results] of Object.entries(tableMetadata)) {
        if (sql.includes(pattern)) {
          return results;
        }
      }
      for (const [pattern, results] of Object.entries(defaultMetadata)) {
        if (sql.includes(pattern)) {
          return results;
        }
      }
      return [];
    }),
    queryOne: jest.fn().mockImplementation(async (sql: string, params?: unknown[]) => {
      for (const [pattern, results] of Object.entries(tableMetadata)) {
        if (sql.includes(pattern)) {
          return (results as unknown[])[0] || null;
        }
      }
      for (const [pattern, results] of Object.entries(defaultMetadata)) {
        if (sql.includes(pattern)) {
          return results[0] || null;
        }
      }
      return null;
    }),
    execute: jest.fn().mockResolvedValue({ rowsAffected: 0 }),
    createSavepoint: jest.fn().mockResolvedValue(undefined),
    rollbackToSavepoint: jest.fn().mockResolvedValue(undefined),
    releaseSavepoint: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };
};

// ============================================================================
// Tests
// ============================================================================

describe('DataAuditor', () => {
  let auditor: DataAuditor;
  let logger: MigrationLogger;

  beforeEach(() => {
    logger = createMockLogger();
    auditor = new DataAuditor(logger);
  });

  describe('generateAuditReport', () => {
    test('should generate audit report for specified tables', async () => {
      const transaction = createMockTransaction();

      const report = await auditor.generateAuditReport(transaction, ['users']);

      expect(report.id).toBeDefined();
      expect(report.tables).toHaveLength(1);
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.qualityScore).toBeGreaterThanOrEqual(0);
      expect(report.qualityScore).toBeLessThanOrEqual(100);
    });

    test('should include recommendations in report', async () => {
      const transaction = createMockTransaction();

      const report = await auditor.generateAuditReport(transaction, ['users']);

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('should log audit progress', async () => {
      const transaction = createMockTransaction();

      await auditor.generateAuditReport(transaction, ['users']);

      expect(logger.info).toHaveBeenCalledWith(
        'Starting data audit',
        expect.objectContaining({ tables: ['users'] })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Data audit completed',
        expect.any(Object)
      );
    });
  });

  describe('auditTable', () => {
    test('should return table audit info with row count', async () => {
      const transaction = createMockTransaction();

      const tableInfo = await auditor.auditTable(transaction, 'users');

      expect(tableInfo.name).toBe('users');
      expect(tableInfo.rowCount).toBe(100);
    });

    test('should include column information', async () => {
      // Need to provide explicit column metadata in the mock
      const transaction = createMockTransaction({
        "table_name = $1": [
          { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
          { column_name: 'email', data_type: 'varchar', is_nullable: 'NO' },
        ],
      });

      const tableInfo = await auditor.auditTable(transaction, 'users');

      expect(tableInfo.columns).toBeDefined();
      expect(tableInfo.columns.length).toBeGreaterThan(0);
      expect(tableInfo.columns[0]).toHaveProperty('name');
      expect(tableInfo.columns[0]).toHaveProperty('dataType');
      expect(tableInfo.columns[0]).toHaveProperty('nullable');
    });

    test('should calculate table checksum', async () => {
      const transaction = createMockTransaction();

      const tableInfo = await auditor.auditTable(transaction, 'users');

      expect(tableInfo.checksum).toBe('abc123def456');
    });

    test('should include foreign key information', async () => {
      const transaction = createMockTransaction({
        "constraint_type = 'FOREIGN KEY'": [
          {
            constraint_name: 'fk_user_pharmacy',
            column_name: 'pharmacy_id',
            foreign_table_name: 'pharmacies',
            foreign_column_name: 'id',
          },
        ],
        'LEFT JOIN': [{ count: '5' }],
      });

      const tableInfo = await auditor.auditTable(transaction, 'users');

      expect(tableInfo.foreignKeys).toHaveLength(1);
      expect(tableInfo.foreignKeys[0].name).toBe('fk_user_pharmacy');
    });

    test('should include index information', async () => {
      const transaction = createMockTransaction();

      const tableInfo = await auditor.auditTable(transaction, 'users');

      expect(tableInfo.indexes).toBeDefined();
      expect(tableInfo.indexes.length).toBeGreaterThan(0);
    });
  });

  describe('Issue Detection', () => {
    test('should detect orphan records', async () => {
      const transaction = createMockTransaction({
        "constraint_type = 'FOREIGN KEY'": [
          {
            constraint_name: 'fk_user_pharmacy',
            column_name: 'pharmacy_id',
            foreign_table_name: 'pharmacies',
            foreign_column_name: 'id',
          },
        ],
        'IS NULL': [{ count: '10' }], // 10 orphan records
      });

      const report = await auditor.generateAuditReport(transaction, ['users']);

      const orphanIssue = report.issues.find(
        i => i.type === DataAuditIssueType.ORPHAN_RECORDS
      );
      expect(orphanIssue).toBeDefined();
      expect(orphanIssue?.severity).toBe(ValidationSeverity.ERROR);
    });

    test('should detect missing indexes on foreign keys', async () => {
      const transaction = createMockTransaction({
        "constraint_type = 'FOREIGN KEY'": [
          {
            constraint_name: 'fk_user_pharmacy',
            column_name: 'pharmacy_id',
            foreign_table_name: 'pharmacies',
            foreign_column_name: 'id',
          },
        ],
        'IS NULL': [{ count: '0' }],
        'pg_index': [], // No indexes
      });

      const report = await auditor.generateAuditReport(transaction, ['users']);

      const indexIssue = report.issues.find(
        i => i.type === DataAuditIssueType.MISSING_INDEX
      );
      expect(indexIssue).toBeDefined();
      expect(indexIssue?.severity).toBe(ValidationSeverity.WARNING);
    });
  });

  describe('Quality Score', () => {
    test('should calculate quality score based on issues', async () => {
      const transaction = createMockTransaction();

      const report = await auditor.generateAuditReport(transaction, ['users']);

      expect(report.qualityScore).toBeGreaterThanOrEqual(0);
      expect(report.qualityScore).toBeLessThanOrEqual(100);
    });

    test('should reduce score for errors', async () => {
      const transaction = createMockTransaction({
        "constraint_type = 'FOREIGN KEY'": [
          {
            constraint_name: 'fk_user_pharmacy',
            column_name: 'pharmacy_id',
            foreign_table_name: 'pharmacies',
            foreign_column_name: 'id',
          },
        ],
        'IS NULL': [{ count: '50' }], // Many orphan records
      });

      const report = await auditor.generateAuditReport(transaction, ['users']);

      expect(report.qualityScore).toBeLessThan(100);
    });
  });

  describe('Fingerprinting', () => {
    test('should generate table fingerprint', async () => {
      const transaction = createMockTransaction();

      const fingerprint = await auditor.generateFingerprint(transaction, 'users');

      expect(fingerprint.tableName).toBe('users');
      expect(fingerprint.rowCount).toBe(100);
      expect(fingerprint.checksum).toBe('abc123def456');
      expect(fingerprint.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Data Comparison', () => {
    test('should compare data between source and target', async () => {
      const sourceTransaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '100' }],
        'MD5(STRING_AGG': [{ checksum: 'abc123' }],
      });

      const targetTransaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '100' }],
        'MD5(STRING_AGG': [{ checksum: 'abc123' }],
      });

      const comparison = await auditor.compareData(
        sourceTransaction,
        targetTransaction,
        'users'
      );

      expect(comparison.match).toBe(true);
      expect(comparison.sourceCount).toBe(100);
      expect(comparison.targetCount).toBe(100);
      expect(comparison.checksumMatch).toBe(true);
    });

    test('should detect row count mismatch', async () => {
      const sourceTransaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '100' }],
        'MD5(STRING_AGG': [{ checksum: 'abc123' }],
      });

      const targetTransaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '90' }],
        'MD5(STRING_AGG': [{ checksum: 'abc123' }],
      });

      const comparison = await auditor.compareData(
        sourceTransaction,
        targetTransaction,
        'users'
      );

      expect(comparison.match).toBe(false);
      expect(comparison.differences.some(d => d.includes('Row count mismatch'))).toBe(true);
    });

    test('should detect checksum mismatch', async () => {
      const sourceTransaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '100' }],
        'MD5(STRING_AGG': [{ checksum: 'abc123' }],
      });

      const targetTransaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '100' }],
        'MD5(STRING_AGG': [{ checksum: 'xyz789' }],
      });

      const comparison = await auditor.compareData(
        sourceTransaction,
        targetTransaction,
        'users'
      );

      expect(comparison.match).toBe(false);
      expect(comparison.checksumMatch).toBe(false);
      expect(comparison.differences.some(d => d.includes('Checksum mismatch'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle query errors gracefully', async () => {
      const transaction = createMockTransaction();
      (transaction.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const report = await auditor.generateAuditReport(transaction, ['users']);

      expect(report.issues).toContainEqual(
        expect.objectContaining({
          type: DataAuditIssueType.DATA_INCONSISTENCY,
          severity: ValidationSeverity.ERROR,
        })
      );
    });

    test('should log warnings for failed table audits', async () => {
      const transaction = createMockTransaction();
      (transaction.query as jest.Mock).mockRejectedValue(new Error('Query failed'));

      await auditor.generateAuditReport(transaction, ['users']);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to audit table'),
        expect.any(Error)
      );
    });
  });
});
