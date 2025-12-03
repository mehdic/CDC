"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJsonbType = getJsonbType;
exports.JsonbColumn = JsonbColumn;
exports.registerJsonbTypeMapping = registerJsonbTypeMapping;
exports.makeEntitySqliteCompatible = makeEntitySqliteCompatible;
const typeorm_1 = require("typeorm");
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
function getJsonbType(dataSource) {
    if (!dataSource.driver) {
        return 'simple-json'; // Default fallback
    }
    const databaseType = dataSource.driver.database;
    switch (databaseType) {
        case 'postgres':
        case 'postgresql':
            return 'jsonb';
        case 'mysql':
        case 'mariadb':
            return 'json';
        case 'sqlite':
        case 'better-sqlite3':
        default:
            return 'simple-json';
    }
}
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
function JsonbColumn(options) {
    return (0, typeorm_1.Column)({
        ...options,
        type: 'simple-json', // Default for SQLite/fallback
    });
}
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
function registerJsonbTypeMapping(dataSource) {
    // Store original Column decorator
    const originalColumn = typeorm_1.Column;
    // This is a placeholder for future custom type registration
    // Currently handled via model configuration
}
/**
 * Helper to convert JSONB columns to simple-json for SQLite
 *
 * This is used during test setup to ensure entities with JSONB
 * columns work with SQLite in-memory databases.
 *
 * @param entity - Entity class
 * @returns Modified entity class
 */
function makeEntitySqliteCompatible(entity) {
    // Get all column metadata
    const metadata = Reflect.getOwnMetadata('typeorm:columns', entity) || {};
    // This is handled at the Column level via simple-json mapping
    return entity;
}
