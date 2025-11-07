/**
 * Database Migration Tool
 * Uses node-pg-migrate for PostgreSQL migrations
 *
 * Usage:
 *   npm run migrate up   - Run pending migrations
 *   npm run migrate down - Rollback last migration
 */

import path from 'path';
import { Client } from 'pg';
import runner from 'node-pg-migrate';

/**
 * Get database connection configuration from environment
 */
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
}

/**
 * Run migrations
 * @param direction - 'up' to apply migrations, 'down' to rollback
 * @param count - Number of migrations to run (optional)
 */
export async function runMigrations(
  direction: 'up' | 'down' = 'up',
  count?: number
): Promise<void> {
  const dbConfig = getDatabaseConfig();
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    const migrationsDir = path.join(__dirname, 'migrations');
    console.log(`📁 Migrations directory: ${migrationsDir}`);

    await runner({
      databaseUrl: dbConfig.connectionString,
      dir: migrationsDir,
      direction,
      count,
      migrationsTable: 'pgmigrations',
      verbose: true,
      createSchema: true,
      createMigrationsSchema: true,
      log: (msg) => console.log(msg),
    });

    console.log(`✅ Migrations ${direction} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * CLI interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'up';
  const count = args[1] ? parseInt(args[1], 10) : undefined;

  if (!['up', 'down'].includes(command)) {
    console.error('Usage: ts-node migrate.ts [up|down] [count]');
    process.exit(1);
  }

  runMigrations(command as 'up' | 'down', count)
    .then(() => {
      console.log('✅ Migration command completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration command failed:', error);
      process.exit(1);
    });
}
