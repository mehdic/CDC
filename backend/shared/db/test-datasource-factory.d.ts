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
export declare function createTestDataSource(entities: EntityTarget<any>[], options?: Partial<DataSourceOptions>): DataSource;
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
export declare function initializeTestDataSource(dataSource: DataSource): Promise<DataSource>;
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
export declare function setupTestDataSource(entities: EntityTarget<any>[], options?: Partial<DataSourceOptions>): Promise<DataSource>;
/**
 * Clean up and destroy a test DataSource
 *
 * @param dataSource - DataSource to destroy
 */
export declare function teardownTestDataSource(dataSource: DataSource): Promise<void>;
