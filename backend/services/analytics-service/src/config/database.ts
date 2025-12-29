/**
 * Database Configuration for Analytics Service
 * Uses pg Pool for raw SQL queries
 */

import { Pool, PoolClient } from 'pg';

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DB_USER || process.env.DATABASE_USER || 'metapharm',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'metapharm_dev_password',
  database: process.env.DB_NAME || process.env.DATABASE_NAME || 'metapharm_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log connection status
pool.on('connect', () => {
  console.log('✅ Analytics Service connected to database');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
});

/**
 * Execute a query with parameters
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Execute a single-value query
 */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute a count query
 */
export async function count(text: string, params?: any[]): Promise<number> {
  const result = await queryOne<{ count: string }>(text, params);
  return result ? parseInt(result.count, 10) : 0;
}

/**
 * Get a client for transactions
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Close the pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('✅ Database pool closed');
}

export default pool;
