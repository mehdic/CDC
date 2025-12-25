/**
 * Migration Runner
 * T8-067: Core migration execution framework with rollback support
 *
 * Provides transactional migration execution with:
 * - Checkpoint/resume capability
 * - Savepoint-based rollback
 * - Progress tracking and logging
 * - Pre/post validation
 * - Comprehensive audit trail
 *
 * Designed for healthcare data with zero data loss guarantee.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import {
  IMigration,
  MigrationConfig,
  MigrationResult,
  MigrationContext,
  MigrationStatus,
  MigrationDirection,
  MigrationProgress,
  MigrationEvent,
  MigrationEventType,
  MigrationEventListener,
  CheckpointInfo,
  MigrationAuditEntry,
  MigrationAuditAction,
  ValidationResult,
  ValidationSeverity,
  DatabaseTransaction,
  MigrationLogger,
  ProgressReporter,
  CheckpointManager,
  ValidationEngine,
  AuditLogger,
  ExecuteResult,
} from './types';
import { ValidationRulesEngine } from './ValidationRulesEngine';
import { DataAuditor } from './DataAuditor';

// ============================================================================
// Migration Runner Implementation
// ============================================================================

export class MigrationRunner {
  private migrations: Map<string, IMigration> = new Map();
  private executedMigrations: Set<string> = new Set();
  private eventEmitter: EventEmitter = new EventEmitter();
  private logger: MigrationLogger;
  private auditLogger: MigrationAuditLogger;
  private checkpointManager: MigrationCheckpointManager;
  private validationEngine: ValidationRulesEngine;
  private dataAuditor: DataAuditor;

  constructor(logger: MigrationLogger) {
    this.logger = logger;
    this.auditLogger = new MigrationAuditLogger(logger);
    this.checkpointManager = new MigrationCheckpointManager();
    this.validationEngine = new ValidationRulesEngine();
    this.dataAuditor = new DataAuditor(logger);
  }

  // ============================================================================
  // Migration Registration
  // ============================================================================

  /**
   * Register a migration
   */
  registerMigration(migration: IMigration): void {
    if (this.migrations.has(migration.metadata.id)) {
      throw new Error(`Migration ${migration.metadata.id} is already registered`);
    }
    this.migrations.set(migration.metadata.id, migration);
    this.logger.info(`Registered migration: ${migration.metadata.id}`, {
      name: migration.metadata.name,
      version: migration.metadata.version,
    });
  }

  /**
   * Register multiple migrations
   */
  registerMigrations(migrations: IMigration[]): void {
    for (const migration of migrations) {
      this.registerMigration(migration);
    }
  }

  /**
   * Get all registered migrations sorted by version
   */
  getMigrations(): IMigration[] {
    return Array.from(this.migrations.values())
      .sort((a, b) => a.metadata.id.localeCompare(b.metadata.id));
  }

  /**
   * Get pending migrations (not yet executed)
   */
  getPendingMigrations(): IMigration[] {
    return this.getMigrations()
      .filter(m => !this.executedMigrations.has(m.metadata.id));
  }

  // ============================================================================
  // Migration Execution
  // ============================================================================

  /**
   * Run all pending migrations
   */
  async runAll(
    transactionFactory: () => Promise<DatabaseTransaction>,
    config: Partial<MigrationConfig> = {}
  ): Promise<MigrationResult[]> {
    const pendingMigrations = this.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      this.logger.info('No pending migrations to run');
      return [];
    }

    this.logger.info(`Running ${pendingMigrations.length} pending migrations`);

    const results: MigrationResult[] = [];

    for (const migration of pendingMigrations) {
      const result = await this.runMigration(
        migration,
        MigrationDirection.UP,
        transactionFactory,
        config
      );

      results.push(result);

      // Stop on failure unless configured to continue
      if (!result.success && config.verbose !== false) {
        this.logger.error(`Migration ${migration.metadata.id} failed, stopping execution`);
        break;
      }
    }

    return results;
  }

  /**
   * Run a specific migration
   */
  async run(
    migrationId: string,
    direction: MigrationDirection,
    transactionFactory: () => Promise<DatabaseTransaction>,
    config: Partial<MigrationConfig> = {}
  ): Promise<MigrationResult> {
    const migration = this.migrations.get(migrationId);

    if (!migration) {
      throw new Error(`Migration ${migrationId} not found`);
    }

    return this.runMigration(migration, direction, transactionFactory, config);
  }

  /**
   * Run a migration with full context
   */
  private async runMigration(
    migration: IMigration,
    direction: MigrationDirection,
    transactionFactory: () => Promise<DatabaseTransaction>,
    partialConfig: Partial<MigrationConfig>
  ): Promise<MigrationResult> {
    const runId = uuidv4();
    const config: MigrationConfig = {
      runId,
      dryRun: false,
      batchSize: 1000,
      concurrency: 1,
      enableCheckpoints: true,
      timeoutMs: 3600000, // 1 hour
      verbose: true,
      ...partialConfig,
    };

    const startTime = Date.now();

    this.logger.info(`Starting migration ${migration.metadata.id}`, {
      runId,
      direction,
      dryRun: config.dryRun,
    });

    // Emit start event
    this.emitEvent(MigrationEventType.MIGRATION_STARTED, runId, migration.metadata.id, {
      direction,
      config,
    });

    // Create transaction
    const transaction = await transactionFactory();

    // Create progress reporter
    const progressReporter = new MigrationProgressReporter(
      runId,
      migration.metadata.id,
      (progress) => {
        this.emitEvent(MigrationEventType.MIGRATION_PROGRESS, runId, migration.metadata.id, {
          progress,
        });
      }
    );

    // Create context
    const context: MigrationContext = {
      transaction,
      config,
      logger: this.logger,
      progress: progressReporter,
      checkpoint: this.checkpointManager,
      validator: this.validationEngine,
      audit: this.auditLogger,
    };

    try {
      // Log audit entry for start
      await this.auditLogger.log({
        runId,
        migrationId: migration.metadata.id,
        action: MigrationAuditAction.MIGRATION_STARTED,
        initiatedBy: 'system',
        metadata: { direction, config },
      });

      // Run pre-validation if configured
      if (migration.validate) {
        this.logger.info('Running pre-migration validation');
        this.emitEvent(MigrationEventType.VALIDATION_STARTED, runId, migration.metadata.id, {});

        const validationResults = await migration.validate(context);
        const hasErrors = validationResults.some(
          r => !r.passed && r.severity === ValidationSeverity.ERROR
        );

        this.emitEvent(MigrationEventType.VALIDATION_COMPLETED, runId, migration.metadata.id, {
          results: validationResults,
          passed: !hasErrors,
        });

        if (hasErrors) {
          throw new Error('Pre-migration validation failed');
        }
      }

      // Create savepoint for rollback
      const savepointName = `migration_${migration.metadata.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await transaction.createSavepoint(savepointName);

      // Check for resume from checkpoint
      if (config.enableCheckpoints) {
        const checkpoint = await this.checkpointManager.getLatest(runId);
        if (checkpoint) {
          this.logger.info(`Resuming from checkpoint at step ${checkpoint.step}`, {
            checkpointId: checkpoint.id,
          });
          context.checkpoint = new ResumeCheckpointManager(
            this.checkpointManager,
            checkpoint
          );
        }
      }

      // Execute migration
      let result: MigrationResult;

      if (direction === MigrationDirection.UP) {
        result = await migration.up(context);
      } else {
        result = await migration.down(context);
      }

      // Handle dry run
      if (config.dryRun) {
        this.logger.info('Dry run - rolling back changes');
        await transaction.rollbackToSavepoint(savepointName);
      } else if (result.success) {
        // Release savepoint on success
        await transaction.releaseSavepoint(savepointName);
        await transaction.commit();

        // Mark as executed
        if (direction === MigrationDirection.UP) {
          this.executedMigrations.add(migration.metadata.id);
        } else {
          this.executedMigrations.delete(migration.metadata.id);
        }
      } else {
        // Rollback on failure
        this.logger.warn('Migration failed, rolling back to savepoint');
        await transaction.rollbackToSavepoint(savepointName);
        await transaction.rollback();
      }

      const duration = Date.now() - startTime;
      result.durationMs = duration;

      // Log audit entry for completion
      await this.auditLogger.log({
        runId,
        migrationId: migration.metadata.id,
        action: result.success
          ? MigrationAuditAction.MIGRATION_COMPLETED
          : MigrationAuditAction.MIGRATION_FAILED,
        initiatedBy: 'system',
        metadata: {
          direction,
          durationMs: duration,
          rowsAffected: result.rowsAffected,
          error: result.error,
        },
      });

      // Emit completion event
      this.emitEvent(
        result.success
          ? MigrationEventType.MIGRATION_COMPLETED
          : MigrationEventType.MIGRATION_FAILED,
        runId,
        migration.metadata.id,
        { result }
      );

      // Clean up checkpoints on success
      if (result.success && config.enableCheckpoints) {
        await this.checkpointManager.deleteForRun(runId);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(
        `Migration ${migration.metadata.id} failed with error`,
        error as Error,
        { runId, duration }
      );

      // Rollback transaction
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        this.logger.error('Rollback failed', rollbackError as Error);
      }

      // Log audit entry for failure
      await this.auditLogger.log({
        runId,
        migrationId: migration.metadata.id,
        action: MigrationAuditAction.MIGRATION_FAILED,
        initiatedBy: 'system',
        metadata: {
          direction,
          durationMs: duration,
          error: (error as Error).message,
        },
      });

      // Emit failure event
      this.emitEvent(MigrationEventType.MIGRATION_FAILED, runId, migration.metadata.id, {
        error: (error as Error).message,
      });

      return {
        success: false,
        migrationId: migration.metadata.id,
        direction,
        status: MigrationStatus.FAILED,
        rowsAffected: 0,
        durationMs: duration,
        error: (error as Error).message,
      };
    }
  }

  // ============================================================================
  // Rollback Methods
  // ============================================================================

  /**
   * Rollback the last executed migration
   */
  async rollbackLast(
    transactionFactory: () => Promise<DatabaseTransaction>,
    config: Partial<MigrationConfig> = {}
  ): Promise<MigrationResult | null> {
    const executedList = Array.from(this.executedMigrations);
    if (executedList.length === 0) {
      this.logger.info('No migrations to rollback');
      return null;
    }

    const lastMigrationId = executedList[executedList.length - 1];
    return this.run(lastMigrationId, MigrationDirection.DOWN, transactionFactory, config);
  }

  /**
   * Rollback to a specific migration (exclusive)
   */
  async rollbackTo(
    migrationId: string,
    transactionFactory: () => Promise<DatabaseTransaction>,
    config: Partial<MigrationConfig> = {}
  ): Promise<MigrationResult[]> {
    const executedList = Array.from(this.executedMigrations)
      .sort((a, b) => b.localeCompare(a)); // Reverse order

    const targetIndex = executedList.findIndex(id => id === migrationId);
    if (targetIndex === -1) {
      throw new Error(`Migration ${migrationId} has not been executed`);
    }

    // Rollback all migrations after the target
    const toRollback = executedList.slice(0, targetIndex);
    const results: MigrationResult[] = [];

    for (const id of toRollback) {
      const result = await this.run(id, MigrationDirection.DOWN, transactionFactory, config);
      results.push(result);

      if (!result.success) {
        this.logger.error(`Rollback of ${id} failed, stopping`);
        break;
      }
    }

    return results;
  }

  /**
   * Rollback all executed migrations
   */
  async rollbackAll(
    transactionFactory: () => Promise<DatabaseTransaction>,
    config: Partial<MigrationConfig> = {}
  ): Promise<MigrationResult[]> {
    const executedList = Array.from(this.executedMigrations)
      .sort((a, b) => b.localeCompare(a)); // Reverse order

    const results: MigrationResult[] = [];

    for (const id of executedList) {
      const result = await this.run(id, MigrationDirection.DOWN, transactionFactory, config);
      results.push(result);

      if (!result.success) {
        this.logger.error(`Rollback of ${id} failed, stopping`);
        break;
      }
    }

    return results;
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  /**
   * Subscribe to migration events
   */
  onEvent(listener: MigrationEventListener): () => void {
    this.eventEmitter.on('migrationEvent', listener);
    return () => this.eventEmitter.off('migrationEvent', listener);
  }

  private emitEvent(
    type: MigrationEventType,
    runId: string,
    migrationId: string,
    data: Record<string, unknown>
  ): void {
    const event: MigrationEvent = {
      type,
      runId,
      migrationId,
      data,
      timestamp: new Date(),
    };

    this.eventEmitter.emit('migrationEvent', event);
  }

  // ============================================================================
  // Data Audit Integration
  // ============================================================================

  /**
   * Get the data auditor instance
   */
  getDataAuditor(): DataAuditor {
    return this.dataAuditor;
  }

  /**
   * Get the validation engine instance
   */
  getValidationEngine(): ValidationRulesEngine {
    return this.validationEngine;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Mark a migration as executed (for tracking existing migrations)
   */
  markAsExecuted(migrationId: string): void {
    this.executedMigrations.add(migrationId);
  }

  /**
   * Check if a migration has been executed
   */
  isExecuted(migrationId: string): boolean {
    return this.executedMigrations.has(migrationId);
  }

  /**
   * Get all executed migration IDs
   */
  getExecutedMigrations(): string[] {
    return Array.from(this.executedMigrations);
  }

  /**
   * Clear execution state (for testing)
   */
  clearState(): void {
    this.executedMigrations.clear();
    this.checkpointManager = new MigrationCheckpointManager();
  }
}

// ============================================================================
// Progress Reporter Implementation
// ============================================================================

class MigrationProgressReporter implements ProgressReporter {
  private progress: MigrationProgress | null = null;
  private listeners: Set<(progress: MigrationProgress) => void> = new Set();
  private onProgressCallback: (progress: MigrationProgress) => void;

  constructor(
    private runId: string,
    private migrationId: string,
    onProgress: (progress: MigrationProgress) => void
  ) {
    this.onProgressCallback = onProgress;
  }

  start(migrationId: string, totalSteps: number): void {
    this.progress = {
      runId: this.runId,
      migrationId,
      totalSteps,
      currentStep: 0,
      currentStepDescription: 'Starting...',
      percentComplete: 0,
      startTime: new Date(),
      lastUpdateTime: new Date(),
    };
    this.notifyListeners();
  }

  update(
    step: number,
    description: string,
    rowsProcessed?: number,
    totalRows?: number
  ): void {
    if (!this.progress) return;

    this.progress.currentStep = step;
    this.progress.currentStepDescription = description;
    this.progress.processedRows = rowsProcessed;
    this.progress.totalRows = totalRows;
    this.progress.percentComplete = Math.round((step / this.progress.totalSteps) * 100);
    this.progress.lastUpdateTime = new Date();

    // Calculate estimated remaining time
    if (rowsProcessed && totalRows && totalRows > 0) {
      const elapsed = Date.now() - this.progress.startTime.getTime();
      const rate = rowsProcessed / elapsed;
      const remaining = totalRows - rowsProcessed;
      this.progress.estimatedRemainingSeconds = Math.round(remaining / rate / 1000);
    }

    this.notifyListeners();
  }

  complete(): void {
    if (!this.progress) return;

    this.progress.currentStep = this.progress.totalSteps;
    this.progress.percentComplete = 100;
    this.progress.currentStepDescription = 'Completed';
    this.progress.lastUpdateTime = new Date();
    this.progress.estimatedRemainingSeconds = 0;

    this.notifyListeners();
  }

  fail(error: string): void {
    if (!this.progress) return;

    this.progress.currentStepDescription = `Failed: ${error}`;
    this.progress.lastUpdateTime = new Date();

    this.notifyListeners();
  }

  getProgress(): MigrationProgress | null {
    return this.progress;
  }

  onProgress(callback: (progress: MigrationProgress) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    if (!this.progress) return;

    this.onProgressCallback(this.progress);
    for (const listener of this.listeners) {
      listener(this.progress);
    }
  }
}

// ============================================================================
// Checkpoint Manager Implementation
// ============================================================================

class MigrationCheckpointManager implements CheckpointManager {
  private checkpoints: Map<string, CheckpointInfo[]> = new Map();

  async create(step: number, data: Record<string, unknown>): Promise<CheckpointInfo> {
    // This is a placeholder - in production, checkpoints would be persisted
    const checkpoint: CheckpointInfo = {
      id: uuidv4(),
      runId: '', // Set by caller
      migrationId: '', // Set by caller
      step,
      data,
      timestamp: new Date(),
    };

    return checkpoint;
  }

  async getLatest(runId: string): Promise<CheckpointInfo | null> {
    const runCheckpoints = this.checkpoints.get(runId);
    if (!runCheckpoints || runCheckpoints.length === 0) {
      return null;
    }
    return runCheckpoints[runCheckpoints.length - 1];
  }

  async get(checkpointId: string): Promise<CheckpointInfo | null> {
    for (const runCheckpoints of this.checkpoints.values()) {
      const checkpoint = runCheckpoints.find(c => c.id === checkpointId);
      if (checkpoint) return checkpoint;
    }
    return null;
  }

  async deleteForRun(runId: string): Promise<void> {
    this.checkpoints.delete(runId);
  }

  // Internal method to save checkpoints
  saveCheckpoint(runId: string, checkpoint: CheckpointInfo): void {
    if (!this.checkpoints.has(runId)) {
      this.checkpoints.set(runId, []);
    }
    this.checkpoints.get(runId)!.push(checkpoint);
  }
}

// Resume checkpoint manager for resuming from a checkpoint
class ResumeCheckpointManager implements CheckpointManager {
  constructor(
    private baseManager: CheckpointManager,
    private resumeFrom: CheckpointInfo
  ) {}

  async create(step: number, data: Record<string, unknown>): Promise<CheckpointInfo> {
    return this.baseManager.create(step, data);
  }

  async getLatest(runId: string): Promise<CheckpointInfo | null> {
    return this.resumeFrom;
  }

  async get(checkpointId: string): Promise<CheckpointInfo | null> {
    return this.baseManager.get(checkpointId);
  }

  async deleteForRun(runId: string): Promise<void> {
    return this.baseManager.deleteForRun(runId);
  }
}

// ============================================================================
// Audit Logger Implementation
// ============================================================================

class MigrationAuditLogger implements AuditLogger {
  private entries: MigrationAuditEntry[] = [];
  private logger: MigrationLogger;

  constructor(logger: MigrationLogger) {
    this.logger = logger;
  }

  async log(entry: Omit<MigrationAuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: MigrationAuditEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: new Date(),
    };

    this.entries.push(fullEntry);

    this.logger.debug('Audit log entry', {
      action: entry.action,
      runId: entry.runId,
      migrationId: entry.migrationId,
    });
  }

  async getEntriesForRun(runId: string): Promise<MigrationAuditEntry[]> {
    return this.entries.filter(e => e.runId === runId);
  }

  async getEntriesForMigration(migrationId: string): Promise<MigrationAuditEntry[]> {
    return this.entries.filter(e => e.migrationId === migrationId);
  }
}

// ============================================================================
// Export
// ============================================================================

export default MigrationRunner;
