/**
 * Database Configuration for VIP Service
 * Uses TypeORM with PostgreSQL
 * T3-095: Design VIP program architecture
 */

import { DataSource } from 'typeorm';
import { VipMembership } from '../../../../shared/models/VipMembership';
import { PointsTransaction } from '../../../../shared/models/PointsTransaction';
import { User } from '../../../../shared/models/User';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [VipMembership, PointsTransaction, User],
  migrations: [],
  subscribers: [],
});

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.info('✓ Database connection established (VIP Service)');
  } catch (error) {
    console.error('✗ Database connection failed (VIP Service):', error);
    throw error;
  }
}
