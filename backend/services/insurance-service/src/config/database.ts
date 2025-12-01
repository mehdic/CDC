/**
 * Database Configuration
 * PostgreSQL database setup for insurance service
 */

import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { InsuranceProvider } from '../entities/InsuranceProvider';
import { PatientInsurance } from '../entities/PatientInsurance';
import { CoverageDetails } from '../entities/CoverageDetails';
import { InsuranceClaim } from '../entities/InsuranceClaim';
import { ThirdPartyPayment } from '../entities/ThirdPartyPayment';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm_insurance',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    InsuranceProvider,
    PatientInsurance,
    CoverageDetails,
    InsuranceClaim,
    ThirdPartyPayment,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('[insurance-service] Database connection initialized successfully');
    }
  } catch (error) {
    console.error('[insurance-service] Database initialization failed:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('[insurance-service] Database connection closed');
  }
}

/**
 * Get database connection
 */
export function getDatabase(): DataSource {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database is not initialized. Call initializeDatabase() first.');
  }
  return AppDataSource;
}
