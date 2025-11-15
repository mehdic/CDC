/**
 * Database Configuration for Payment Service
 * TypeORM Data Source
 */

import { DataSource } from 'typeorm';
import { Payment } from '../../../../shared/models/Payment';
import { User } from '../../../../shared/models/User';
import { AuditLog } from '../../../../shared/models/AuditLog';
import { Pharmacy } from '../../../../shared/models/Pharmacy';

export const AppDataSource = new DataSource(
  process.env.NODE_ENV === 'test'
    ? {
        // Use SQLite in-memory database for testing
        type: 'better-sqlite3',
        database: ':memory:',
        entities: [Payment, User, AuditLog, Pharmacy],
        synchronize: true, // Auto-create tables in test mode
        logging: false,
        dropSchema: true, // Clean database for each test run
        migrations: [],
        subscribers: [],
      }
    : {
        // Use PostgreSQL for development/production
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'metapharm_payments',
        synchronize: process.env.NODE_ENV === 'development', // Auto-sync in dev only
        logging: process.env.NODE_ENV === 'development',
        entities: [Payment, User, AuditLog, Pharmacy],
        migrations: [],
        subscribers: [],
      }
);

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('[Database] Connection initialized successfully');
    }
  } catch (error) {
    console.error('[Database] Connection error:', error);
    throw error;
  }
}
