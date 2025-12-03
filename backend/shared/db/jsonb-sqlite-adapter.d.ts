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
import { EntityTarget } from 'typeorm';
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
export declare function adaptJsonbColumnsForSqlite(entities: EntityTarget<any>[]): void;
/**
 * Get list of all entities with JSONB columns
 *
 * Useful for debugging and understanding which entities need adaptation.
 *
 * @returns Array of entity classes that have JSONB columns
 */
export declare function getEntitiesWithJsonbColumns(): Set<any>;
/**
 * Check if a specific entity has JSONB columns
 *
 * @param entity - Entity class to check
 * @returns true if entity has any JSONB columns
 */
export declare function hasJsonbColumns(entity: EntityTarget<any>): boolean;
/**
 * Get all JSONB columns in an entity
 *
 * @param entity - Entity class
 * @returns Array of column property names that use jsonb
 */
export declare function getJsonbColumnNames(entity: EntityTarget<any>): string[];
/**
 * Report on JSONB column adaptation (for debugging)
 *
 * Prints information about which entities have JSONB columns
 * and their current adaptation status.
 *
 * @returns Summary object
 */
export declare function reportJsonbAdaptation(): {
    totalJsonbColumns: number;
    affectedEntities: string[];
    columnsByEntity: Record<string, string[]>;
};
