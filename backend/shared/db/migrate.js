"use strict";
/**
 * Database Migration Tool
 * Uses node-pg-migrate for PostgreSQL migrations
 *
 * Usage:
 *   npm run migrate up   - Run pending migrations
 *   npm run migrate down - Rollback last migration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const node_pg_migrate_1 = __importDefault(require("node-pg-migrate"));
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
async function runMigrations(direction = 'up', count) {
    const dbConfig = getDatabaseConfig();
    const client = new pg_1.Client(dbConfig);
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL database');
        const migrationsDir = path_1.default.join(__dirname, 'migrations');
        console.log(`📁 Migrations directory: ${migrationsDir}`);
        await (0, node_pg_migrate_1.default)({
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
    }
    catch (error) {
        console.error(`❌ Migration failed:`, error);
        throw error;
    }
    finally {
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
    runMigrations(command, count)
        .then(() => {
        console.log('✅ Migration command completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Migration command failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrate.js.map