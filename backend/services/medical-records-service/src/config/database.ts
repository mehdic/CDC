/**
 * Database Configuration
 * TypeORM DataSource setup for Medical Records Service
 */

import { DataSource } from 'typeorm';
import { MedicalRecord } from '../models/MedicalRecord';
import { AccessLog } from '../models/AccessLog';

const isTest = process.env.NODE_ENV === 'test';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'medical_records_service',
  synchronize: isTest || process.env.DB_SYNCHRONIZE === 'true', // Auto-create schema in test/dev
  logging: process.env.DB_LOGGING === 'true',
  entities: [MedicalRecord, AccessLog],
  migrations: [],
  subscribers: [],
});

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('✅ Medical Records Database connection established');
  }
  return AppDataSource;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✅ Medical Records Database connection closed');
  }
}
