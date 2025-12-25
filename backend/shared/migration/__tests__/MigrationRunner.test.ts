/**
 * MigrationRunner Tests
 * T8-067: Data Migration and Validation
 */

import { MigrationRunner } from '../MigrationRunner';
import {
  IMigration,
  MigrationMetadata,
  MigrationContext,
  MigrationResult,
  MigrationStatus,
  MigrationDirection,
  MigrationEventType,
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

const createMockTransaction = (): DatabaseTransaction => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
  execute: jest.fn().mockResolvedValue({ rowsAffected: 0 }),
  createSavepoint: jest.fn().mockResolvedValue(undefined),
  rollbackToSavepoint: jest.fn().mockResolvedValue(undefined),
  releaseSavepoint: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
});

// ============================================================================
// Mock Migration
// ============================================================================

const createMockMigration = (
  id: string,
  upResult: Partial<MigrationResult> = {},
  downResult: Partial<MigrationResult> = {}
): IMigration => ({
  metadata: {
    id,
    name: `Migration ${id}`,
    version: id,
    description: `Test migration ${id}`,
    affectedTables: ['users'],
    reversible: true,
    createdAt: new Date(),
  },
  up: jest.fn().mockResolvedValue({
    success: true,
    migrationId: id,
    direction: MigrationDirection.UP,
    status: MigrationStatus.COMPLETED,
    rowsAffected: 100,
    durationMs: 1000,
    ...upResult,
  }),
  down: jest.fn().mockResolvedValue({
    success: true,
    migrationId: id,
    direction: MigrationDirection.DOWN,
    status: MigrationStatus.COMPLETED,
    rowsAffected: 100,
    durationMs: 500,
    ...downResult,
  }),
});

// ============================================================================
// Tests
// ============================================================================

describe('MigrationRunner', () => {
  let runner: MigrationRunner;
  let logger: MigrationLogger;

  beforeEach(() => {
    logger = createMockLogger();
    runner = new MigrationRunner(logger);
  });

  describe('Migration Registration', () => {
    test('should register a migration', () => {
      const migration = createMockMigration('001');

      runner.registerMigration(migration);

      const migrations = runner.getMigrations();
      expect(migrations).toHaveLength(1);
      expect(migrations[0].metadata.id).toBe('001');
    });

    test('should throw error when registering duplicate migration', () => {
      const migration = createMockMigration('001');

      runner.registerMigration(migration);

      expect(() => runner.registerMigration(migration)).toThrow(
        'Migration 001 is already registered'
      );
    });

    test('should register multiple migrations', () => {
      const migration1 = createMockMigration('001');
      const migration2 = createMockMigration('002');
      const migration3 = createMockMigration('003');

      runner.registerMigrations([migration1, migration2, migration3]);

      expect(runner.getMigrations()).toHaveLength(3);
    });

    test('should return migrations sorted by ID', () => {
      runner.registerMigration(createMockMigration('003'));
      runner.registerMigration(createMockMigration('001'));
      runner.registerMigration(createMockMigration('002'));

      const migrations = runner.getMigrations();
      expect(migrations.map(m => m.metadata.id)).toEqual(['001', '002', '003']);
    });
  });

  describe('Pending Migrations', () => {
    test('should return all migrations as pending initially', () => {
      runner.registerMigration(createMockMigration('001'));
      runner.registerMigration(createMockMigration('002'));

      expect(runner.getPendingMigrations()).toHaveLength(2);
    });

    test('should not include executed migrations in pending', () => {
      runner.registerMigration(createMockMigration('001'));
      runner.registerMigration(createMockMigration('002'));

      runner.markAsExecuted('001');

      const pending = runner.getPendingMigrations();
      expect(pending).toHaveLength(1);
      expect(pending[0].metadata.id).toBe('002');
    });
  });

  describe('Running Migrations', () => {
    test('should run a single migration', async () => {
      const migration = createMockMigration('001');
      runner.registerMigration(migration);

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      const result = await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(result.success).toBe(true);
      expect(result.migrationId).toBe('001');
      expect(result.direction).toBe(MigrationDirection.UP);
      expect(migration.up).toHaveBeenCalled();
    });

    test('should run all pending migrations', async () => {
      const migration1 = createMockMigration('001');
      const migration2 = createMockMigration('002');

      runner.registerMigration(migration1);
      runner.registerMigration(migration2);

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      const results = await runner.runAll(transactionFactory);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
      expect(migration1.up).toHaveBeenCalled();
      expect(migration2.up).toHaveBeenCalled();
    });

    test('should stop on failure when running all', async () => {
      const migration1 = createMockMigration('001', { success: false, error: 'Failed' });
      const migration2 = createMockMigration('002');

      runner.registerMigration(migration1);
      runner.registerMigration(migration2);

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      const results = await runner.runAll(transactionFactory);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(migration2.up).not.toHaveBeenCalled();
    });

    test('should mark migration as executed on success', async () => {
      const migration = createMockMigration('001');
      runner.registerMigration(migration);

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(runner.isExecuted('001')).toBe(true);
    });

    test('should not mark migration as executed on failure', async () => {
      const migration = createMockMigration('001', { success: false, error: 'Failed' });
      runner.registerMigration(migration);

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(runner.isExecuted('001')).toBe(false);
    });

    test('should throw error for unknown migration', async () => {
      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      await expect(
        runner.run('unknown', MigrationDirection.UP, transactionFactory)
      ).rejects.toThrow('Migration unknown not found');
    });
  });

  describe('Rollback', () => {
    test('should rollback a migration', async () => {
      const migration = createMockMigration('001');
      runner.registerMigration(migration);
      runner.markAsExecuted('001');

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      const result = await runner.run('001', MigrationDirection.DOWN, transactionFactory);

      expect(result.success).toBe(true);
      expect(result.direction).toBe(MigrationDirection.DOWN);
      expect(migration.down).toHaveBeenCalled();
    });

    test('should rollback last executed migration', async () => {
      const migration1 = createMockMigration('001');
      const migration2 = createMockMigration('002');

      runner.registerMigration(migration1);
      runner.registerMigration(migration2);
      runner.markAsExecuted('001');
      runner.markAsExecuted('002');

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      const result = await runner.rollbackLast(transactionFactory);

      expect(result?.success).toBe(true);
      expect(result?.migrationId).toBe('002');
      expect(migration2.down).toHaveBeenCalled();
    });

    test('should return null when no migrations to rollback', async () => {
      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      const result = await runner.rollbackLast(transactionFactory);

      expect(result).toBeNull();
    });

    test('should rollback to specific migration', async () => {
      runner.registerMigration(createMockMigration('001'));
      runner.registerMigration(createMockMigration('002'));
      runner.registerMigration(createMockMigration('003'));

      runner.markAsExecuted('001');
      runner.markAsExecuted('002');
      runner.markAsExecuted('003');

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      const results = await runner.rollbackTo('001', transactionFactory);

      expect(results).toHaveLength(2); // Should rollback 003 and 002
      expect(runner.isExecuted('001')).toBe(true);
      expect(runner.isExecuted('002')).toBe(false);
      expect(runner.isExecuted('003')).toBe(false);
    });

    test('should rollback all migrations', async () => {
      runner.registerMigration(createMockMigration('001'));
      runner.registerMigration(createMockMigration('002'));

      runner.markAsExecuted('001');
      runner.markAsExecuted('002');

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      const results = await runner.rollbackAll(transactionFactory);

      expect(results).toHaveLength(2);
      expect(runner.getExecutedMigrations()).toHaveLength(0);
    });

    test('should unmark migration as executed after rollback', async () => {
      const migration = createMockMigration('001');
      runner.registerMigration(migration);
      runner.markAsExecuted('001');

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      await runner.run('001', MigrationDirection.DOWN, transactionFactory);

      expect(runner.isExecuted('001')).toBe(false);
    });
  });

  describe('Dry Run', () => {
    test('should not commit changes in dry run mode', async () => {
      const migration = createMockMigration('001');
      runner.registerMigration(migration);

      const transaction = createMockTransaction();
      const transactionFactory = jest.fn().mockResolvedValue(transaction);

      await runner.run('001', MigrationDirection.UP, transactionFactory, { dryRun: true });

      expect(transaction.rollbackToSavepoint).toHaveBeenCalled();
      expect(transaction.commit).not.toHaveBeenCalled();
    });

    test('should not mark as executed in dry run mode', async () => {
      const migration = createMockMigration('001');
      runner.registerMigration(migration);

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      await runner.run('001', MigrationDirection.UP, transactionFactory, { dryRun: true });

      expect(runner.isExecuted('001')).toBe(false);
    });
  });

  describe('Transaction Management', () => {
    test('should create savepoint before migration', async () => {
      const migration = createMockMigration('001');
      runner.registerMigration(migration);

      const transaction = createMockTransaction();
      const transactionFactory = jest.fn().mockResolvedValue(transaction);

      await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(transaction.createSavepoint).toHaveBeenCalled();
    });

    test('should commit transaction on success', async () => {
      const migration = createMockMigration('001');
      runner.registerMigration(migration);

      const transaction = createMockTransaction();
      const transactionFactory = jest.fn().mockResolvedValue(transaction);

      await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(transaction.commit).toHaveBeenCalled();
    });

    test('should rollback transaction on failure', async () => {
      const migration = createMockMigration('001', { success: false, error: 'Failed' });
      runner.registerMigration(migration);

      const transaction = createMockTransaction();
      const transactionFactory = jest.fn().mockResolvedValue(transaction);

      await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(transaction.rollbackToSavepoint).toHaveBeenCalled();
      expect(transaction.rollback).toHaveBeenCalled();
    });

    test('should handle exception during migration', async () => {
      const migration = createMockMigration('001');
      (migration.up as jest.Mock).mockRejectedValue(new Error('Unexpected error'));
      runner.registerMigration(migration);

      const transaction = createMockTransaction();
      const transactionFactory = jest.fn().mockResolvedValue(transaction);

      const result = await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    test('should emit events during migration', async () => {
      const migration = createMockMigration('001');
      runner.registerMigration(migration);

      const events: MigrationEventType[] = [];
      runner.onEvent((event) => {
        events.push(event.type);
      });

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(events).toContain(MigrationEventType.MIGRATION_STARTED);
      expect(events).toContain(MigrationEventType.MIGRATION_COMPLETED);
    });

    test('should emit failure event on error', async () => {
      const migration = createMockMigration('001', { success: false, error: 'Failed' });
      runner.registerMigration(migration);

      const events: MigrationEventType[] = [];
      runner.onEvent((event) => {
        events.push(event.type);
      });

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(events).toContain(MigrationEventType.MIGRATION_FAILED);
    });

    test('should allow unsubscribing from events', async () => {
      const migration = createMockMigration('001');
      runner.registerMigration(migration);

      let eventCount = 0;
      const unsubscribe = runner.onEvent(() => {
        eventCount++;
      });

      unsubscribe();

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());
      await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(eventCount).toBe(0);
    });
  });

  describe('State Management', () => {
    test('should track executed migrations', () => {
      runner.markAsExecuted('001');
      runner.markAsExecuted('002');

      expect(runner.getExecutedMigrations()).toEqual(['001', '002']);
    });

    test('should clear state', () => {
      runner.registerMigration(createMockMigration('001'));
      runner.markAsExecuted('001');

      runner.clearState();

      expect(runner.getExecutedMigrations()).toHaveLength(0);
    });
  });

  describe('Pre-Migration Validation', () => {
    test('should run validation if provided', async () => {
      const migration = createMockMigration('001');
      migration.validate = jest.fn().mockResolvedValue([
        {
          ruleId: 'test',
          passed: true,
          severity: 'error',
          table: 'users',
          violationCount: 0,
          message: 'Validation passed',
          timestamp: new Date(),
        },
      ]);
      runner.registerMigration(migration);

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(migration.validate).toHaveBeenCalled();
    });

    test('should abort migration on validation failure', async () => {
      const migration = createMockMigration('001');
      migration.validate = jest.fn().mockResolvedValue([
        {
          ruleId: 'test',
          passed: false,
          severity: 'error',
          table: 'users',
          violationCount: 5,
          message: 'Validation failed',
          timestamp: new Date(),
        },
      ]);
      runner.registerMigration(migration);

      const transactionFactory = jest.fn().mockResolvedValue(createMockTransaction());

      const result = await runner.run('001', MigrationDirection.UP, transactionFactory);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Pre-migration validation failed');
      expect(migration.up).not.toHaveBeenCalled();
    });
  });
});
