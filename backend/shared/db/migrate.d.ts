/**
 * Database Migration Tool
 * Uses node-pg-migrate for PostgreSQL migrations
 *
 * Usage:
 *   npm run migrate up   - Run pending migrations
 *   npm run migrate down - Rollback last migration
 */
/**
 * Run migrations
 * @param direction - 'up' to apply migrations, 'down' to rollback
 * @param count - Number of migrations to run (optional)
 */
export declare function runMigrations(direction?: 'up' | 'down', count?: number): Promise<void>;
//# sourceMappingURL=migrate.d.ts.map