/**
 * Custom JSONB Column Type for TypeORM
 *
 * Provides database-agnostic JSONB support:
 * - PostgreSQL: Uses native jsonb type
 * - SQLite: Uses json type (simple-json in TypeORM)
 * - MySQL: Uses json type
 *
 * This allows models to use 'jsonb' column type across all databases
 * and automatically maps to the appropriate type for each database.
 */
import { ColumnOptions, DataSource } from 'typeorm';
/**
 * Get database-appropriate column type for JSONB
 *
 * Maps PostgreSQL's jsonb to compatible types in other databases:
 * - PostgreSQL: jsonb
 * - SQLite: simple-json
 * - MySQL/MariaDB: json
 * - Others: simple-json (fallback)
 *
 * @param dataSource - TypeORM DataSource instance
 * @returns Appropriate column type for the database
 */
export declare function getJsonbType(dataSource: DataSource): string;
/**
 * Create a database-aware JSONB column decorator
 *
 * This decorator automatically adjusts the column type based on
 * the active database connection.
 *
 * Usage in models:
 * ```typescript
 * @JsonbColumn({ nullable: true })
 * metadata: Record<string, any>;
 * ```
 *
 * @param options - Column options (excluding 'type')
 * @returns Decorator function
 */
export declare function JsonbColumn(options?: Omit<ColumnOptions, 'type'>): PropertyDecorator;
/**
 * Register JSONB type mapping for a DataSource
 *
 * This function should be called in test setup or before
 * initializing the DataSource to ensure JSONB columns work
 * correctly across different databases.
 *
 * Usage:
 * ```typescript
 * const dataSource = new DataSource({ ... });
 * registerJsonbTypeMapping(dataSource);
 * await dataSource.initialize();
 * ```
 *
 * @param dataSource - TypeORM DataSource instance
 */
export declare function registerJsonbTypeMapping(dataSource: DataSource): void;
/**
 * Helper to convert JSONB columns to simple-json for SQLite
 *
 * This is used during test setup to ensure entities with JSONB
 * columns work with SQLite in-memory databases.
 *
 * @param entity - Entity class
 * @returns Modified entity class
 */
export declare function makeEntitySqliteCompatible(entity: any): any;
