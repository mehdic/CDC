/**
 * Database Configuration
 * TypeORM setup for Patient Service
 */

import { DataSource } from 'typeorm';
import path from 'path';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'metapharm',
  password: process.env.DB_PASSWORD || 'metapharm',
  database: process.env.DB_NAME || 'metapharm_db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.DB_LOGGING === 'true',
  entities: [
    path.join(__dirname, '../../shared/models/*.ts'),
    path.join(__dirname, '../../shared/models/*.js'),
  ],
  migrations: [path.join(__dirname, '../migrations/*.ts')],
  subscribers: [],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.info('Database connection established');

    // Run migrations if any
    if (AppDataSource.migrations.length > 0) {
      await AppDataSource.runMigrations();
      console.info('Migrations executed');
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export default AppDataSource;
