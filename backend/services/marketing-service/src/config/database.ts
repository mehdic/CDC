/**
 * Database Configuration for Marketing Service
 * Uses TypeORM with PostgreSQL
 */

import { DataSource } from 'typeorm';
import { Campaign } from '../entities/Campaign';
import { Promotion } from '../entities/Promotion';
import { CampaignTemplate } from '../entities/CampaignTemplate';
import { CampaignAnalytics } from '../entities/CampaignAnalytics';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Campaign, Promotion, CampaignTemplate, CampaignAnalytics],
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
