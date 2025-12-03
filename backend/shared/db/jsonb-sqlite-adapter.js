"use strict";
/**
 * JSONB SQLite Adapter
 *
 * Patches TypeORM entity metadata to replace PostgreSQL's jsonb type
 * with SQLite-compatible 'simple-json' type at runtime.
 *
 * This allows PostgreSQL-optimized models to work seamlessly in
 * SQLite test environments without modifying the models themselves.
 *
 * Usage:
 * ```typescript
 * // In test setup, BEFORE creating DataSource:
 * adaptJsonbColumnsForSqlite([Cart, CartItem, User, ...]);
 *
 * // Then create DataSource normally
 * const dataSource = new DataSource({ type: 'better-sqlite3', ... });
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptJsonbColumnsForSqlite = adaptJsonbColumnsForSqlite;
exports.getEntitiesWithJsonbColumns = getEntitiesWithJsonbColumns;
exports.hasJsonbColumns = hasJsonbColumns;
exports.getJsonbColumnNames = getJsonbColumnNames;
exports.reportJsonbAdaptation = reportJsonbAdaptation;
const typeorm_1 = require("typeorm");
/**
 * Adapts JSONB columns in entities to use simple-json for SQLite compatibility
 *
 * This function modifies TypeORM metadata at runtime to replace 'jsonb'
 * column type with 'simple-json', which SQLite can understand.
 *
 * The modification is done at the metadata level, so the original entity
 * definitions remain unchanged.
 *
 * @param entities - Array of entity classes to adapt
 *
 * @example
 * ```typescript
 * // Before creating DataSource
 * adaptJsonbColumnsForSqlite([
 *   Cart, CartItem, User, Prescription,
 *   Order, Payment, AuditLog, ConsultationNote,
 *   DriverSettlement, CODTransaction, TreatmentPlan, RolePermission
 * ]);
 *
 * // Now safe to create SQLite DataSource
 * const dataSource = new DataSource({
 *   type: 'better-sqlite3',
 *   database: ':memory:',
 *   entities: [Cart, CartItem, User, ...],
 *   synchronize: true
 * });
 * ```
 */
function adaptJsonbColumnsForSqlite(entities) {
    // Get TypeORM's metadata storage
    const metadataArgsStorage = (0, typeorm_1.getMetadataArgsStorage)();
    // Iterate through column metadata
    for (const columnMetadata of metadataArgsStorage.columns) {
        // Check if this column has 'jsonb' type
        if (columnMetadata.options?.type === 'jsonb') {
            // Replace with simple-json for SQLite compatibility
            // simple-json: TypeORM will serialize/deserialize JSON automatically
            columnMetadata.options.type = 'simple-json';
        }
    }
    // Also iterate through view column metadata (for database views)
    for (const viewColumnMetadata of metadataArgsStorage.viewColumns) {
        if (viewColumnMetadata.options?.type === 'jsonb') {
            viewColumnMetadata.options.type = 'simple-json';
        }
    }
}
/**
 * Get list of all entities with JSONB columns
 *
 * Useful for debugging and understanding which entities need adaptation.
 *
 * @returns Array of entity classes that have JSONB columns
 */
function getEntitiesWithJsonbColumns() {
    const metadataArgsStorage = (0, typeorm_1.getMetadataArgsStorage)();
    const entitiesWithJsonb = new Set();
    for (const columnMetadata of metadataArgsStorage.columns) {
        if (columnMetadata.options?.type === 'jsonb') {
            entitiesWithJsonb.add(columnMetadata.target);
        }
    }
    return entitiesWithJsonb;
}
/**
 * Check if a specific entity has JSONB columns
 *
 * @param entity - Entity class to check
 * @returns true if entity has any JSONB columns
 */
function hasJsonbColumns(entity) {
    const metadataArgsStorage = (0, typeorm_1.getMetadataArgsStorage)();
    for (const columnMetadata of metadataArgsStorage.columns) {
        if (columnMetadata.target === entity && columnMetadata.options?.type === 'jsonb') {
            return true;
        }
    }
    return false;
}
/**
 * Get all JSONB columns in an entity
 *
 * @param entity - Entity class
 * @returns Array of column property names that use jsonb
 */
function getJsonbColumnNames(entity) {
    const metadataArgsStorage = (0, typeorm_1.getMetadataArgsStorage)();
    const columnNames = [];
    for (const columnMetadata of metadataArgsStorage.columns) {
        if (columnMetadata.target === entity && columnMetadata.options?.type === 'jsonb') {
            columnNames.push(columnMetadata.propertyName);
        }
    }
    return columnNames;
}
/**
 * Report on JSONB column adaptation (for debugging)
 *
 * Prints information about which entities have JSONB columns
 * and their current adaptation status.
 *
 * @returns Summary object
 */
function reportJsonbAdaptation() {
    const metadataArgsStorage = (0, typeorm_1.getMetadataArgsStorage)();
    const summary = {
        totalJsonbColumns: 0,
        affectedEntities: [],
        columnsByEntity: {},
    };
    const entityNames = new Set();
    for (const columnMetadata of metadataArgsStorage.columns) {
        // Check both original 'jsonb' and adapted 'simple-json'
        if (columnMetadata.options?.type === 'jsonb' ||
            columnMetadata.options?.type === 'simple-json') {
            const entityName = columnMetadata.target.name || 'Unknown';
            entityNames.add(entityName);
            if (!summary.columnsByEntity[entityName]) {
                summary.columnsByEntity[entityName] = [];
            }
            summary.columnsByEntity[entityName].push(columnMetadata.propertyName);
            summary.totalJsonbColumns++;
        }
    }
    summary.affectedEntities = Array.from(entityNames).sort();
    return summary;
}
