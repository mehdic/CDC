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

import { EntityTarget, getMetadataArgsStorage } from 'typeorm';

/**
 * Adapts PostgreSQL-specific column types for SQLite test compatibility
 *
 * This function modifies TypeORM metadata at runtime to replace PostgreSQL-specific
 * column types with SQLite-compatible alternatives:
 * - 'jsonb' → 'simple-json' (TypeORM's JSON serialization)
 * - 'timestamp' → 'datetime' (SQLite's timestamp representation)
 * - 'uuid' (as type) → handled by SQLite as TEXT
 *
 * The modification is done at the metadata level, so the original entity
 * definitions remain unchanged.
 *
 * @param entities - Array of entity classes to adapt (unused but kept for API compatibility)
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
export function adaptJsonbColumnsForSqlite(
  entities: EntityTarget<any>[]
): void {
  // Get TypeORM's metadata storage
  const metadataArgsStorage = getMetadataArgsStorage();

  // Iterate through column metadata
  for (const columnMetadata of metadataArgsStorage.columns) {
    const type = columnMetadata.options?.type;

    // Replace PostgreSQL-specific types with SQLite equivalents
    if (type === 'jsonb') {
      // Replace with simple-json for SQLite compatibility
      // simple-json: TypeORM will serialize/deserialize JSON automatically
      columnMetadata.options.type = 'simple-json' as any;
    } else if (type === 'timestamp') {
      // Replace with datetime for SQLite compatibility
      // SQLite stores timestamps as TEXT in ISO 8601 format or as integers
      columnMetadata.options.type = 'datetime' as any;
    }
  }

  // Also iterate through view column metadata (for database views)
  if ((metadataArgsStorage as any).viewColumns) {
    for (const viewColumnMetadata of (metadataArgsStorage as any).viewColumns) {
      const type = viewColumnMetadata.options?.type;

      if (type === 'jsonb') {
        viewColumnMetadata.options.type = 'simple-json' as any;
      } else if (type === 'timestamp') {
        viewColumnMetadata.options.type = 'datetime' as any;
      }
    }
  }
}

/**
 * Get list of all entities with PostgreSQL-specific columns
 *
 * Useful for debugging and understanding which entities need adaptation.
 *
 * @returns Set of entity classes that have JSONB or timestamp columns
 */
export function getEntitiesWithJsonbColumns(): Set<any> {
  const metadataArgsStorage = getMetadataArgsStorage();
  const entitiesNeedingAdaptation = new Set<any>();

  for (const columnMetadata of metadataArgsStorage.columns) {
    const type = columnMetadata.options?.type;
    if (type === 'jsonb' || type === 'timestamp') {
      entitiesNeedingAdaptation.add(columnMetadata.target);
    }
  }

  return entitiesNeedingAdaptation;
}

/**
 * Check if a specific entity has JSONB columns
 *
 * @param entity - Entity class to check
 * @returns true if entity has any JSONB columns
 */
export function hasJsonbColumns(entity: EntityTarget<any>): boolean {
  const metadataArgsStorage = getMetadataArgsStorage();

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
export function getJsonbColumnNames(entity: EntityTarget<any>): string[] {
  const metadataArgsStorage = getMetadataArgsStorage();
  const columnNames: string[] = [];

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
export function reportJsonbAdaptation(): {
  totalJsonbColumns: number;
  affectedEntities: string[];
  columnsByEntity: Record<string, string[]>;
} {
  const metadataArgsStorage = getMetadataArgsStorage();
  const summary = {
    totalJsonbColumns: 0,
    affectedEntities: [] as string[],
    columnsByEntity: {} as Record<string, string[]>,
  };

  const entityNames = new Set<string>();

  for (const columnMetadata of metadataArgsStorage.columns) {
    // Check both original 'jsonb' and adapted 'simple-json'
    if (
      columnMetadata.options?.type === 'jsonb' ||
      columnMetadata.options?.type === 'simple-json'
    ) {
      const entityName = (columnMetadata.target as any).name || 'Unknown';
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
