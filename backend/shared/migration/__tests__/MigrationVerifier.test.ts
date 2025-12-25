/**
 * MigrationVerifier Tests
 * T8-067: Data Migration and Validation
 */

import {
  MigrationVerifier,
  createRowCountCheck,
  createNonEmptyCheck,
  createNoNullCheck,
} from '../MigrationVerifier';
import {
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
  overrides: Record<string, unknown> = {}
): DatabaseTransaction => {
  const defaultResults: Record<string, unknown[]> = {
    'COUNT(*) as count': [{ count: '100' }],
    'indisprimary': [{ attname: 'id' }],
    'MD5(STRING_AGG': [{ checksum: 'abc123def456' }],
    'information_schema.columns': [
      { column_name: 'id' },
      { column_name: 'email' },
      { column_name: 'name' },
    ],
    "constraint_type = 'FOREIGN KEY'": [],
    'ORDER BY RANDOM()': [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ],
    'WHERE "id" =': [{ count: '1' }],
    ...overrides,
  };

  // Helper to find matching pattern - check overrides first (more specific patterns)
  const findMatch = (sql: string): unknown[] | null => {
    // Check overrides first (they should take priority)
    for (const [pattern, results] of Object.entries(overrides)) {
      if (sql.includes(pattern)) {
        return results as unknown[];
      }
    }
    // Then check defaults
    for (const [pattern, results] of Object.entries(defaultResults)) {
      if (sql.includes(pattern)) {
        return results;
      }
    }
    return null;
  };

  return {
    query: jest.fn().mockImplementation(async (sql: string) => {
      const match = findMatch(sql);
      return match || [];
    }),
    queryOne: jest.fn().mockImplementation(async (sql: string) => {
      const match = findMatch(sql);
      return match ? match[0] || null : null;
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

describe('MigrationVerifier', () => {
  let verifier: MigrationVerifier;
  let logger: MigrationLogger;

  beforeEach(() => {
    logger = createMockLogger();
    verifier = new MigrationVerifier(logger);
  });

  describe('Pre-Migration State Capture', () => {
    test('should capture pre-migration fingerprints', async () => {
      const transaction = createMockTransaction();

      const fingerprints = await verifier.capturePreMigrationState(
        transaction,
        ['users', 'orders']
      );

      expect(fingerprints.size).toBe(2);
      expect(fingerprints.has('users')).toBe(true);
      expect(fingerprints.has('orders')).toBe(true);
    });

    test('should store fingerprints for later verification', async () => {
      const transaction = createMockTransaction();

      await verifier.capturePreMigrationState(transaction, ['users']);

      const storedFingerprints = verifier.getPreMigrationFingerprints();
      expect(storedFingerprints.has('users')).toBe(true);
    });

    test('should include row count in fingerprint', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '250' }],
      });

      const fingerprints = await verifier.capturePreMigrationState(
        transaction,
        ['users']
      );

      expect(fingerprints.get('users')?.rowCount).toBe(250);
    });

    test('should include checksum in fingerprint', async () => {
      const transaction = createMockTransaction({
        'MD5(STRING_AGG': [{ checksum: 'test-checksum' }],
      });

      const fingerprints = await verifier.capturePreMigrationState(
        transaction,
        ['users']
      );

      expect(fingerprints.get('users')?.checksum).toBe('test-checksum');
    });
  });

  describe('Post-Migration Verification', () => {
    test('should verify all checks pass', async () => {
      const transaction = createMockTransaction();

      await verifier.capturePreMigrationState(transaction, ['users']);

      const result = await verifier.verify(transaction);

      expect(result.passed).toBe(true);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('should log verification progress', async () => {
      const transaction = createMockTransaction();

      await verifier.capturePreMigrationState(transaction, ['users']);
      await verifier.verify(transaction);

      expect(logger.info).toHaveBeenCalledWith(
        'Starting post-migration verification'
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Post-migration verification completed',
        expect.any(Object)
      );
    });
  });

  describe('Row Count Verification', () => {
    test('should pass when row counts match', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '100' }],
      });

      await verifier.capturePreMigrationState(transaction, ['users']);

      const result = await verifier.verify(transaction);

      const rowCountCheck = result.checks.find(c => c.name.includes('Row count'));
      expect(rowCountCheck?.passed).toBe(true);
    });

    test('should fail when row counts differ', async () => {
      const transaction1 = createMockTransaction({
        'COUNT(*) as count': [{ count: '100' }],
      });

      await verifier.capturePreMigrationState(transaction1, ['users']);

      // Change row count for verification
      const transaction2 = createMockTransaction({
        'COUNT(*) as count': [{ count: '80' }],
      });

      const result = await verifier.verify(transaction2);

      const rowCountCheck = result.checks.find(c => c.name.includes('Row count'));
      expect(rowCountCheck?.passed).toBe(false);
    });

    test('should pass within tolerance', async () => {
      const transaction1 = createMockTransaction({
        'COUNT(*) as count': [{ count: '100' }],
      });

      await verifier.capturePreMigrationState(transaction1, ['users']);

      const transaction2 = createMockTransaction({
        'COUNT(*) as count': [{ count: '95' }],
      });

      const result = await verifier.verify(transaction2, { rowCountTolerance: 10 });

      const rowCountCheck = result.checks.find(c => c.name.includes('Row count'));
      expect(rowCountCheck?.passed).toBe(true);
    });
  });

  describe('Checksum Verification', () => {
    test('should pass when checksums match', async () => {
      const transaction = createMockTransaction({
        'MD5(STRING_AGG': [{ checksum: 'same-checksum' }],
      });

      await verifier.capturePreMigrationState(transaction, ['users']);

      const result = await verifier.verify(transaction);

      const checksumCheck = result.checks.find(c => c.name.includes('Checksum'));
      expect(checksumCheck?.passed).toBe(true);
    });

    test('should fail when checksums differ', async () => {
      const transaction1 = createMockTransaction({
        'MD5(STRING_AGG': [{ checksum: 'original-checksum' }],
      });

      await verifier.capturePreMigrationState(transaction1, ['users']);

      const transaction2 = createMockTransaction({
        'MD5(STRING_AGG': [{ checksum: 'different-checksum' }],
      });

      const result = await verifier.verify(transaction2);

      const checksumCheck = result.checks.find(c => c.name.includes('Checksum'));
      expect(checksumCheck?.passed).toBe(false);
    });

    test('should skip checksum verification when disabled', async () => {
      const transaction = createMockTransaction();

      await verifier.capturePreMigrationState(transaction, ['users']);

      const result = await verifier.verify(transaction, { validateChecksums: false });

      const checksumCheck = result.checks.find(c => c.name.includes('Checksum'));
      expect(checksumCheck).toBeUndefined();
    });
  });

  describe('Foreign Key Verification', () => {
    test('should pass when no orphan records', async () => {
      const transaction = createMockTransaction({
        "constraint_type = 'FOREIGN KEY'": [
          {
            constraint_name: 'fk_user_pharmacy',
            column_name: 'pharmacy_id',
            foreign_table_name: 'pharmacies',
            foreign_column_name: 'id',
          },
        ],
        'LEFT JOIN': [{ count: '0' }], // The FK check uses LEFT JOIN to find orphans
      });

      await verifier.capturePreMigrationState(transaction, ['users']);

      const result = await verifier.verify(transaction);

      const fkCheck = result.checks.find(c => c.name.includes('FK integrity'));
      expect(fkCheck?.passed).toBe(true);
    });

    test('should fail when orphan records exist', async () => {
      const transaction = createMockTransaction({
        "constraint_type = 'FOREIGN KEY'": [
          {
            constraint_name: 'fk_user_pharmacy',
            column_name: 'pharmacy_id',
            foreign_table_name: 'pharmacies',
            foreign_column_name: 'id',
          },
        ],
        'LEFT JOIN': [{ count: '5' }], // The FK check uses LEFT JOIN to find orphans
      });

      await verifier.capturePreMigrationState(transaction, ['users']);

      const result = await verifier.verify(transaction);

      const fkCheck = result.checks.find(c => c.name.includes('FK integrity'));
      expect(fkCheck?.passed).toBe(false);
    });

    test('should skip FK verification when disabled', async () => {
      const transaction = createMockTransaction({
        "constraint_type = 'FOREIGN KEY'": [
          {
            constraint_name: 'fk_user_pharmacy',
            column_name: 'pharmacy_id',
            foreign_table_name: 'pharmacies',
            foreign_column_name: 'id',
          },
        ],
      });

      await verifier.capturePreMigrationState(transaction, ['users']);

      const result = await verifier.verify(transaction, { validateForeignKeys: false });

      const fkCheck = result.checks.find(c => c.name.includes('FK integrity'));
      expect(fkCheck).toBeUndefined();
    });
  });

  describe('Data Sampling Verification', () => {
    test('should verify sampled rows exist', async () => {
      const transaction = createMockTransaction({
        'ORDER BY RANDOM()': [{ id: '1' }, { id: '2' }, { id: '3' }],
        'WHERE "id" =': [{ count: '1' }],
      });

      await verifier.capturePreMigrationState(transaction, ['users']);

      const result = await verifier.verify(transaction);

      const samplingCheck = result.checks.find(c => c.name.includes('Data sampling'));
      expect(samplingCheck?.passed).toBe(true);
    });

    test('should fail when sampled rows are missing', async () => {
      const transaction = createMockTransaction({
        'ORDER BY RANDOM()': [{ id: '1' }, { id: '2' }, { id: '3' }],
        'WHERE "id" =': [{ count: '0' }], // Rows don't exist
      });

      await verifier.capturePreMigrationState(transaction, ['users']);

      const result = await verifier.verify(transaction);

      const samplingCheck = result.checks.find(c => c.name.includes('Data sampling'));
      expect(samplingCheck?.passed).toBe(false);
    });

    test('should skip sampling when disabled', async () => {
      const transaction = createMockTransaction();

      await verifier.capturePreMigrationState(transaction, ['users']);

      const result = await verifier.verify(transaction, { enableSampling: false });

      const samplingCheck = result.checks.find(c => c.name.includes('Data sampling'));
      expect(samplingCheck).toBeUndefined();
    });
  });

  describe('Custom Verification Checks', () => {
    test('should run custom verification checks', async () => {
      const transaction = createMockTransaction();
      const customCheck = jest.fn().mockResolvedValue(true);

      const result = await verifier.verify(transaction, {
        customChecks: [
          {
            name: 'Custom check',
            description: 'Verify custom condition',
            check: customCheck,
          },
        ],
      });

      expect(customCheck).toHaveBeenCalled();
      const check = result.checks.find(c => c.name === 'Custom check');
      expect(check?.passed).toBe(true);
    });

    test('should handle custom check failures', async () => {
      const transaction = createMockTransaction();
      const customCheck = jest.fn().mockResolvedValue(false);

      const result = await verifier.verify(transaction, {
        customChecks: [
          {
            name: 'Custom check',
            description: 'Verify custom condition',
            check: customCheck,
          },
        ],
      });

      const check = result.checks.find(c => c.name === 'Custom check');
      expect(check?.passed).toBe(false);
    });

    test('should handle custom check errors', async () => {
      const transaction = createMockTransaction();
      const customCheck = jest.fn().mockRejectedValue(new Error('Check failed'));

      const result = await verifier.verify(transaction, {
        customChecks: [
          {
            name: 'Custom check',
            description: 'Verify custom condition',
            check: customCheck,
          },
        ],
      });

      const check = result.checks.find(c => c.name === 'Custom check');
      expect(check?.passed).toBe(false);
      expect(check?.message).toContain('error');
    });
  });

  describe('State Management', () => {
    test('should clear fingerprints', async () => {
      const transaction = createMockTransaction();

      await verifier.capturePreMigrationState(transaction, ['users']);
      verifier.clearFingerprints();

      expect(verifier.getPreMigrationFingerprints().size).toBe(0);
    });

    test('should allow manual fingerprint setting', () => {
      verifier.setPreMigrationFingerprint('users', {
        tableName: 'users',
        rowCount: 100,
        checksum: 'manual-checksum',
        timestamp: new Date(),
      });

      const fingerprints = verifier.getPreMigrationFingerprints();
      expect(fingerprints.get('users')?.checksum).toBe('manual-checksum');
    });
  });
});

describe('Convenience Check Functions', () => {
  describe('createRowCountCheck', () => {
    test('should create row count check', async () => {
      const check = createRowCountCheck('users', 100);

      expect(check.name).toContain('users');
      expect(check.expectedValue).toBe(100);

      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '100' }],
      });

      const result = await check.check(transaction);
      expect(result).toBe(true);
    });

    test('should respect tolerance', async () => {
      const check = createRowCountCheck('users', 100, 10);

      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '95' }],
      });

      const result = await check.check(transaction);
      expect(result).toBe(true);
    });
  });

  describe('createNonEmptyCheck', () => {
    test('should pass for non-empty table', async () => {
      const check = createNonEmptyCheck('users');

      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '1' }],
      });

      const result = await check.check(transaction);
      expect(result).toBe(true);
    });

    test('should fail for empty table', async () => {
      const check = createNonEmptyCheck('users');

      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '0' }],
      });

      const result = await check.check(transaction);
      expect(result).toBe(false);
    });
  });

  describe('createNoNullCheck', () => {
    test('should pass when no NULLs', async () => {
      const check = createNoNullCheck('users', 'email');

      const transaction = createMockTransaction({
        'IS NULL': [{ count: '0' }],
      });

      const result = await check.check(transaction);
      expect(result).toBe(true);
    });

    test('should fail when NULLs exist', async () => {
      const check = createNoNullCheck('users', 'email');

      const transaction = createMockTransaction({
        'IS NULL': [{ count: '5' }],
      });

      const result = await check.check(transaction);
      expect(result).toBe(false);
    });
  });
});
