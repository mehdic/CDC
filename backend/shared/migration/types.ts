/**
 * Data Migration Framework - Type Definitions
 * T8-067: Healthcare data migration with zero data loss guarantee
 *
 * This module defines the core types and interfaces for the migration framework.
 * Designed for HIPAA/GDPR compliance with comprehensive audit trails.
 */

// ============================================================================
// Migration Core Types
// ============================================================================

/**
 * Migration status values
 */
export enum MigrationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
  PARTIALLY_COMPLETED = 'partially_completed',
}

/**
 * Migration direction for up/down operations
 */
export enum MigrationDirection {
  UP = 'up',
  DOWN = 'down',
}

/**
 * Validation rule severity levels
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Data type definitions for validation
 */
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  UUID = 'uuid',
  EMAIL = 'email',
  JSON = 'json',
  ARRAY = 'array',
}

// ============================================================================
// Migration Interfaces
// ============================================================================

/**
 * Configuration for a migration run
 */
export interface MigrationConfig {
  /** Unique identifier for this migration run */
  runId: string;
  /** Target version to migrate to (optional) */
  targetVersion?: string;
  /** Enable dry run mode (no actual changes) */
  dryRun?: boolean;
  /** Batch size for data operations */
  batchSize?: number;
  /** Maximum concurrent operations */
  concurrency?: number;
  /** Enable checkpoint/resume capability */
  enableCheckpoints?: boolean;
  /** Timeout in milliseconds for the entire migration */
  timeoutMs?: number;
  /** Tables to include (empty = all) */
  includeTables?: string[];
  /** Tables to exclude */
  excludeTables?: string[];
  /** Enable detailed logging */
  verbose?: boolean;
}

/**
 * Metadata about a migration
 */
export interface MigrationMetadata {
  /** Unique migration identifier (timestamp-based) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Version string */
  version: string;
  /** Description of what this migration does */
  description: string;
  /** Tables affected by this migration */
  affectedTables: string[];
  /** Estimated duration in seconds */
  estimatedDurationSeconds?: number;
  /** Dependencies on other migrations */
  dependencies?: string[];
  /** Whether this migration is reversible */
  reversible: boolean;
  /** Author of the migration */
  author?: string;
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Interface that all migrations must implement
 */
export interface IMigration {
  /** Migration metadata */
  metadata: MigrationMetadata;

  /**
   * Run the migration (forward)
   * @param context - Migration context with transaction and utilities
   */
  up(context: MigrationContext): Promise<MigrationResult>;

  /**
   * Rollback the migration
   * @param context - Migration context with transaction and utilities
   */
  down(context: MigrationContext): Promise<MigrationResult>;

  /**
   * Validate that the migration can be run
   * @param context - Migration context
   */
  validate?(context: MigrationContext): Promise<ValidationResult[]>;
}

/**
 * Context passed to migrations during execution
 */
export interface MigrationContext {
  /** Database transaction (for transactional migrations) */
  transaction: DatabaseTransaction;
  /** Configuration for this run */
  config: MigrationConfig;
  /** Logger instance */
  logger: MigrationLogger;
  /** Progress reporter */
  progress: ProgressReporter;
  /** Checkpoint manager */
  checkpoint: CheckpointManager;
  /** Validation engine */
  validator: ValidationEngine;
  /** Audit logger */
  audit: AuditLogger;
}

/**
 * Result of a migration operation
 */
export interface MigrationResult {
  /** Whether the migration succeeded */
  success: boolean;
  /** Migration that was run */
  migrationId: string;
  /** Direction (up or down) */
  direction: MigrationDirection;
  /** Final status */
  status: MigrationStatus;
  /** Number of rows affected */
  rowsAffected: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Error message if failed */
  error?: string;
  /** Detailed error information */
  errorDetails?: Record<string, unknown>;
  /** Validation results */
  validationResults?: ValidationResult[];
  /** Checkpoints created during migration */
  checkpoints?: CheckpointInfo[];
}

// ============================================================================
// Validation Interfaces
// ============================================================================

/**
 * Validation rule definition
 */
export interface ValidationRule {
  /** Unique rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Table this rule applies to */
  table: string;
  /** Column this rule applies to (optional for table-level rules) */
  column?: string;
  /** Rule type */
  type: ValidationRuleType;
  /** Rule configuration */
  config: ValidationRuleConfig;
  /** Severity of violations */
  severity: ValidationSeverity;
  /** Whether to fail migration on violation */
  failOnViolation: boolean;
  /** Human-readable message for violations */
  message: string;
}

/**
 * Types of validation rules
 */
export enum ValidationRuleType {
  NOT_NULL = 'not_null',
  DATA_TYPE = 'data_type',
  RANGE = 'range',
  PATTERN = 'pattern',
  UNIQUE = 'unique',
  FOREIGN_KEY = 'foreign_key',
  CUSTOM = 'custom',
  CHECKSUM = 'checksum',
  ROW_COUNT = 'row_count',
  ENUM = 'enum',
  LENGTH = 'length',
}

/**
 * Configuration for validation rules
 */
export interface ValidationRuleConfig {
  /** Expected data type */
  dataType?: DataType;
  /** Minimum value (for range checks) */
  min?: number | Date;
  /** Maximum value (for range checks) */
  max?: number | Date;
  /** Regex pattern (for pattern checks) */
  pattern?: string;
  /** Reference table (for foreign key checks) */
  referenceTable?: string;
  /** Reference column (for foreign key checks) */
  referenceColumn?: string;
  /** Allowed values (for enum checks) */
  allowedValues?: (string | number | boolean)[];
  /** Minimum length (for length checks) */
  minLength?: number;
  /** Maximum length (for length checks) */
  maxLength?: number;
  /** Custom validation function name */
  customValidator?: string;
  /** Expected checksum value */
  expectedChecksum?: string;
  /** Expected row count */
  expectedRowCount?: number;
  /** Row count tolerance (percentage) */
  rowCountTolerance?: number;
}

/**
 * Result of a validation check
 */
export interface ValidationResult {
  /** Rule that was checked */
  ruleId: string;
  /** Whether validation passed */
  passed: boolean;
  /** Severity level */
  severity: ValidationSeverity;
  /** Affected table */
  table: string;
  /** Affected column (if applicable) */
  column?: string;
  /** Number of violations found */
  violationCount: number;
  /** Sample of violating rows (limited) */
  sampleViolations?: ValidationViolation[];
  /** Human-readable message */
  message: string;
  /** Timestamp of validation */
  timestamp: Date;
}

/**
 * Details of a single validation violation
 */
export interface ValidationViolation {
  /** Row identifier (primary key value) */
  rowId: string | number;
  /** Actual value that violated the rule */
  actualValue: unknown;
  /** Expected value or constraint */
  expectedValue?: unknown;
  /** Additional context */
  context?: Record<string, unknown>;
}

// ============================================================================
// Audit and Logging Interfaces
// ============================================================================

/**
 * Audit log entry for migration operations
 */
export interface MigrationAuditEntry {
  /** Unique entry ID */
  id: string;
  /** Migration run ID */
  runId: string;
  /** Migration ID */
  migrationId: string;
  /** Action performed */
  action: MigrationAuditAction;
  /** Affected table */
  table?: string;
  /** Number of rows affected */
  rowsAffected?: number;
  /** Before state snapshot (for rollback) */
  beforeState?: Record<string, unknown>;
  /** After state snapshot */
  afterState?: Record<string, unknown>;
  /** User or system that initiated */
  initiatedBy: string;
  /** Timestamp */
  timestamp: Date;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Types of audit actions
 */
export enum MigrationAuditAction {
  MIGRATION_STARTED = 'migration_started',
  MIGRATION_COMPLETED = 'migration_completed',
  MIGRATION_FAILED = 'migration_failed',
  MIGRATION_ROLLED_BACK = 'migration_rolled_back',
  CHECKPOINT_CREATED = 'checkpoint_created',
  CHECKPOINT_RESTORED = 'checkpoint_restored',
  VALIDATION_STARTED = 'validation_started',
  VALIDATION_COMPLETED = 'validation_completed',
  VALIDATION_FAILED = 'validation_failed',
  DATA_MODIFIED = 'data_modified',
  DATA_DELETED = 'data_deleted',
  SCHEMA_CHANGED = 'schema_changed',
}

/**
 * Progress information during migration
 */
export interface MigrationProgress {
  /** Migration run ID */
  runId: string;
  /** Current migration ID */
  migrationId: string;
  /** Total number of steps */
  totalSteps: number;
  /** Current step number */
  currentStep: number;
  /** Current step description */
  currentStepDescription: string;
  /** Total rows to process (if known) */
  totalRows?: number;
  /** Rows processed so far */
  processedRows?: number;
  /** Percentage complete (0-100) */
  percentComplete: number;
  /** Estimated time remaining in seconds */
  estimatedRemainingSeconds?: number;
  /** Start time */
  startTime: Date;
  /** Last update time */
  lastUpdateTime: Date;
}

// ============================================================================
// Checkpoint Interfaces
// ============================================================================

/**
 * Checkpoint information for resume capability
 */
export interface CheckpointInfo {
  /** Unique checkpoint ID */
  id: string;
  /** Migration run ID */
  runId: string;
  /** Migration ID */
  migrationId: string;
  /** Step number at checkpoint */
  step: number;
  /** Last processed row ID */
  lastProcessedRowId?: string | number;
  /** Checkpoint data */
  data: Record<string, unknown>;
  /** Timestamp */
  timestamp: Date;
}

// ============================================================================
// Database Interfaces (Abstraction Layer)
// ============================================================================

/**
 * Database transaction interface
 */
export interface DatabaseTransaction {
  /** Execute a query within the transaction */
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Execute a query that returns a single result */
  queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  /** Execute a query that modifies data */
  execute(sql: string, params?: unknown[]): Promise<ExecuteResult>;
  /** Create a savepoint */
  createSavepoint(name: string): Promise<void>;
  /** Rollback to a savepoint */
  rollbackToSavepoint(name: string): Promise<void>;
  /** Release a savepoint */
  releaseSavepoint(name: string): Promise<void>;
  /** Commit the transaction */
  commit(): Promise<void>;
  /** Rollback the entire transaction */
  rollback(): Promise<void>;
}

/**
 * Result of an execute operation
 */
export interface ExecuteResult {
  /** Number of rows affected */
  rowsAffected: number;
  /** Last inserted ID (if applicable) */
  lastInsertId?: string | number;
}

// ============================================================================
// Service Interfaces
// ============================================================================

/**
 * Logger interface for migrations
 */
export interface MigrationLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

/**
 * Progress reporter interface
 */
export interface ProgressReporter {
  /** Start tracking a migration */
  start(migrationId: string, totalSteps: number): void;
  /** Update progress */
  update(step: number, description: string, rowsProcessed?: number, totalRows?: number): void;
  /** Complete tracking */
  complete(): void;
  /** Report failure */
  fail(error: string): void;
  /** Get current progress */
  getProgress(): MigrationProgress | null;
  /** Subscribe to progress updates */
  onProgress(callback: (progress: MigrationProgress) => void): () => void;
}

/**
 * Checkpoint manager interface
 */
export interface CheckpointManager {
  /** Create a checkpoint */
  create(step: number, data: Record<string, unknown>): Promise<CheckpointInfo>;
  /** Get the latest checkpoint for a run */
  getLatest(runId: string): Promise<CheckpointInfo | null>;
  /** Get a specific checkpoint */
  get(checkpointId: string): Promise<CheckpointInfo | null>;
  /** Delete checkpoints for a run */
  deleteForRun(runId: string): Promise<void>;
}

/**
 * Validation engine interface
 */
export interface ValidationEngine {
  /** Add a validation rule */
  addRule(rule: ValidationRule): void;
  /** Remove a validation rule */
  removeRule(ruleId: string): void;
  /** Get all rules */
  getRules(): ValidationRule[];
  /** Get rules for a specific table */
  getRulesForTable(table: string): ValidationRule[];
  /** Validate a table against all applicable rules */
  validateTable(table: string, transaction: DatabaseTransaction): Promise<ValidationResult[]>;
  /** Validate all registered tables */
  validateAll(transaction: DatabaseTransaction): Promise<ValidationResult[]>;
}

/**
 * Audit logger interface
 */
export interface AuditLogger {
  /** Log an audit entry */
  log(entry: Omit<MigrationAuditEntry, 'id' | 'timestamp'>): Promise<void>;
  /** Get audit entries for a run */
  getEntriesForRun(runId: string): Promise<MigrationAuditEntry[]>;
  /** Get audit entries for a migration */
  getEntriesForMigration(migrationId: string): Promise<MigrationAuditEntry[]>;
}

// ============================================================================
// Pre/Post Migration Interfaces
// ============================================================================

/**
 * Data audit report generated before migration
 */
export interface DataAuditReport {
  /** Report ID */
  id: string;
  /** Tables audited */
  tables: TableAuditInfo[];
  /** Overall data quality score (0-100) */
  qualityScore: number;
  /** Issues found */
  issues: DataAuditIssue[];
  /** Recommendations */
  recommendations: string[];
  /** Generated at */
  generatedAt: Date;
}

/**
 * Audit information for a single table
 */
export interface TableAuditInfo {
  /** Table name */
  name: string;
  /** Row count */
  rowCount: number;
  /** Column information */
  columns: ColumnAuditInfo[];
  /** Checksum of table data */
  checksum: string;
  /** Foreign key relationships */
  foreignKeys: ForeignKeyInfo[];
  /** Indexes on the table */
  indexes: IndexInfo[];
}

/**
 * Audit information for a column
 */
export interface ColumnAuditInfo {
  /** Column name */
  name: string;
  /** Data type */
  dataType: string;
  /** Whether nullable */
  nullable: boolean;
  /** Null count */
  nullCount: number;
  /** Distinct value count */
  distinctCount: number;
  /** Sample values */
  sampleValues: unknown[];
  /** Min value (for numeric/date) */
  minValue?: unknown;
  /** Max value (for numeric/date) */
  maxValue?: unknown;
  /** Average value (for numeric) */
  avgValue?: number;
}

/**
 * Foreign key information
 */
export interface ForeignKeyInfo {
  /** Constraint name */
  name: string;
  /** Source column */
  column: string;
  /** Reference table */
  referenceTable: string;
  /** Reference column */
  referenceColumn: string;
  /** Orphan count (rows without matching reference) */
  orphanCount: number;
}

/**
 * Index information
 */
export interface IndexInfo {
  /** Index name */
  name: string;
  /** Columns in the index */
  columns: string[];
  /** Whether unique */
  unique: boolean;
  /** Index type (btree, hash, gin, etc.) */
  type: string;
}

/**
 * Issue found during data audit
 */
export interface DataAuditIssue {
  /** Issue severity */
  severity: ValidationSeverity;
  /** Affected table */
  table: string;
  /** Affected column (if applicable) */
  column?: string;
  /** Issue type */
  type: DataAuditIssueType;
  /** Description */
  description: string;
  /** Affected row count */
  affectedRows: number;
  /** Sample of affected rows */
  sampleRows?: unknown[];
}

/**
 * Types of data audit issues
 */
export enum DataAuditIssueType {
  ORPHAN_RECORDS = 'orphan_records',
  NULL_IN_REQUIRED = 'null_in_required',
  INVALID_DATA_TYPE = 'invalid_data_type',
  DUPLICATE_VALUES = 'duplicate_values',
  OUT_OF_RANGE = 'out_of_range',
  INVALID_FORMAT = 'invalid_format',
  MISSING_INDEX = 'missing_index',
  DATA_INCONSISTENCY = 'data_inconsistency',
}

/**
 * Post-migration verification result
 */
export interface VerificationResult {
  /** Overall verification passed */
  passed: boolean;
  /** Verification checks performed */
  checks: VerificationCheck[];
  /** Verification timestamp */
  timestamp: Date;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Single verification check
 */
export interface VerificationCheck {
  /** Check name */
  name: string;
  /** Whether check passed */
  passed: boolean;
  /** Expected value */
  expected: unknown;
  /** Actual value */
  actual: unknown;
  /** Tolerance (if applicable) */
  tolerance?: number;
  /** Message */
  message: string;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Migration event types
 */
export enum MigrationEventType {
  MIGRATION_STARTED = 'migration:started',
  MIGRATION_PROGRESS = 'migration:progress',
  MIGRATION_COMPLETED = 'migration:completed',
  MIGRATION_FAILED = 'migration:failed',
  VALIDATION_STARTED = 'validation:started',
  VALIDATION_COMPLETED = 'validation:completed',
  CHECKPOINT_CREATED = 'checkpoint:created',
  ROLLBACK_STARTED = 'rollback:started',
  ROLLBACK_COMPLETED = 'rollback:completed',
}

/**
 * Migration event payload
 */
export interface MigrationEvent {
  /** Event type */
  type: MigrationEventType;
  /** Migration run ID */
  runId: string;
  /** Migration ID */
  migrationId: string;
  /** Event data */
  data: Record<string, unknown>;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Event listener function type
 */
export type MigrationEventListener = (event: MigrationEvent) => void;
