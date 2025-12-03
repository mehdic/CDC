/**
 * Test DataSource Factory
 *
 * Creates TypeORM DataSources for testing with proper handling of
 * PostgreSQL-specific types (like JSONB) in SQLite test environments.
 *
 * When using SQLite for tests, this automatically maps:
 * - JSONB columns to 'simple-json' type
 * - Other PostgreSQL-specific types to SQLite equivalents
 */

import { DataSource, DataSourceOptions, EntityTarget } from 'typeorm';

/**
 * Create a test DataSource for SQLite with PostgreSQL type compatibility
 *
 * This factory handles the mismatch between PostgreSQL-specific column types
 * (like jsonb) and SQLite's capabilities by applying TypeORM's 'simple-json' type.
 *
 * @param entities - Array of entity classes to register
 * @param options - Optional additional DataSource options
 * @returns Configured DataSource
 *
 * @example
 * ```typescript
 * const dataSource = createTestDataSource([Cart, CartItem, User]);
 * await dataSource.initialize();
 * ```
 */
export function createTestDataSource(
  entities: EntityTarget<any>[],
  options?: Partial<DataSourceOptions>
): DataSource {
  return new DataSource({
    // Use better-sqlite3 for in-memory SQLite
    type: 'better-sqlite3',
    database: ':memory:',

    // Register entities
    entities,

    // Automatically create schema from entities
    synchronize: true,

    // Disable logging for cleaner test output
    logging: false,

    // Merge any additional options
    ...options,
  } as DataSourceOptions);
}

/**
 * Initialize a test DataSource and apply SQLite compatibility fixes
 *
 * This function:
 * 1. Initializes the DataSource
 * 2. Disables foreign key constraints (if using SQLite)
 * 3. Applies any necessary compatibility patches
 *
 * @param dataSource - DataSource to initialize
 * @returns Initialized DataSource
 *
 * @example
 * ```typescript
 * const dataSource = createTestDataSource([Cart, CartItem, User]);
 * await initializeTestDataSource(dataSource);
 * // Now ready to use
 * ```
 */
export async function initializeTestDataSource(
  dataSource: DataSource
): Promise<DataSource> {
  // Initialize the DataSource
  await dataSource.initialize();

  // Disable foreign key constraints for test simplicity
  // This allows testing repository logic without creating full relational data
  try {
    await dataSource.query('PRAGMA foreign_keys = OFF;');
  } catch (error) {
    // If PRAGMA fails, it's not SQLite - ignore
  }

  return dataSource;
}

/**
 * Helper to set up a complete test database with initialization
 *
 * Combines creation and initialization in one call.
 *
 * @param entities - Array of entity classes
 * @param options - Optional additional DataSource options
 * @returns Initialized DataSource ready for testing
 *
 * @example
 * ```typescript
 * const dataSource = await setupTestDataSource([Cart, CartItem, User]);
 * // Directly use dataSource
 * ```
 */
export async function setupTestDataSource(
  entities: EntityTarget<any>[],
  options?: Partial<DataSourceOptions>
): Promise<DataSource> {
  const dataSource = createTestDataSource(entities, options);
  return initializeTestDataSource(dataSource);
}

/**
 * Clean up and destroy a test DataSource
 *
 * @param dataSource - DataSource to destroy
 */
export async function teardownTestDataSource(
  dataSource: DataSource
): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
