/**
 * Database Configuration for E-commerce Service
 * Uses TypeORM with PostgreSQL
 */

import { DataSource } from 'typeorm';
import { Product } from '../../../../shared/models/Product';
import { Category } from '../../../../shared/models/Category';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm',
  synchronize: process.env.NODE_ENV === 'development', // Auto-sync schema in dev
  logging: process.env.NODE_ENV === 'development',
  entities: [Product, Category],
  migrations: [],
  subscribers: [],
});

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.info('✓ Database connection established');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}
