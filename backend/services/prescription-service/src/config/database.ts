/**
 * Database Configuration
 * TypeORM DataSource setup
 */

import { DataSource } from 'typeorm';

// Import only entities needed for prescription service (explicit to avoid schema issues)
import { Prescription } from '../../../../shared/models/Prescription';
import { PrescriptionItem } from '../../../../shared/models/PrescriptionItem';
import { User } from '../../../../shared/models/User';
import { Pharmacy } from '../../../../shared/models/Pharmacy';
import { TreatmentPlan } from '../../../../shared/models/TreatmentPlan';
import { AuditTrailEntry } from '../../../../shared/models/AuditTrailEntry';
import { Cart } from '../../../../shared/models/Cart';
import { CartItem } from '../../../../shared/models/CartItem';

const isTest = process.env.NODE_ENV === 'test';
// Only use mock data when explicitly enabled (USE_MOCK_DATA=true), not by default in development
const useMock = process.env.USE_MOCK_DATA === 'true';

// DataSource with prescription-related entities only
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm',
  synchronize: false, // Never auto-sync in production
  logging: process.env.DB_LOGGING === 'true',
  entities: [
    Prescription,
    PrescriptionItem,
    User,
    Pharmacy,
    TreatmentPlan,
    AuditTrailEntry,
    Cart,
    CartItem,
  ],
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
