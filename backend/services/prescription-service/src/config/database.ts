/**
 * Database Configuration
 * TypeORM DataSource setup
 *
 * Note: Using mock mode in development until full migrations are in place.
 * The shared models have complex interdependencies that require all entities
 * to be registered together.
 */

import { DataSource } from 'typeorm';

const isTest = process.env.NODE_ENV === 'test';
// Only use mock data when explicitly enabled (USE_MOCK_DATA=true), not by default in development
const useMock = process.env.USE_MOCK_DATA === 'true';

// Minimal DataSource for health checks (entities loaded dynamically when needed)
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm',
  synchronize: false, // Never auto-sync in production
  logging: process.env.DB_LOGGING === 'true',
  entities: [], // No entities - use mock data in development
  migrations: [],
  subscribers: [],
});

export const isMockMode = useMock;

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
  }
  return AppDataSource;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  }
}
