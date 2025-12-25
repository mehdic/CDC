/**
 * Centralized Database Configuration
 * PostgreSQL connection with connection pooling, read replicas, and query caching
 * T8-061: Database Performance Optimization
 *
 * Features:
 * - Connection pooling with optimal pool size
 * - Read replica support for read-heavy workloads
 * - Query caching configuration
 * - Performance monitoring integration
 * - Automatic slow query logging
 */

import { DataSource, DataSourceOptions, Logger, QueryRunner } from 'typeorm';
import { logger } from '@shared/utils/logger';
import {
  recordDatabaseQuery,
  recordDatabaseError,
  updateConnectionPoolStatus,
} from '@shared/utils/metrics';

// ============================================================================
// Types
// ============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

export interface ReplicaConfig extends DatabaseConfig {
  name: string;
}

export interface PoolConfig {
  max: number;
  min: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  acquireTimeoutMillis: number;
}

export interface CacheConfig {
  enabled: boolean;
  type: 'database' | 'redis' | 'ioredis';
  duration: number; // milliseconds
  options?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
}

export interface DatabaseOptions {
  entities: string[];
  migrations?: string[];
  subscribers?: string[];
  replicas?: ReplicaConfig[];
  pool?: Partial<PoolConfig>;
  cache?: Partial<CacheConfig>;
  logging?: boolean | 'all' | ('query' | 'error' | 'schema' | 'warn' | 'info' | 'log')[];
  slowQueryThreshold?: number; // milliseconds
}

// ============================================================================
// Query Event Types
// ============================================================================

interface QueryEvent {
  queryId?: string;
  query: string;
}

// ============================================================================
// Connection Pool Stats Types
// ============================================================================

interface PoolStatsRow {
  total: string;
  active: string;
  idle: string;
  waiting: string;
}

// ============================================================================
// Health Check Details
// ============================================================================

interface HealthDetails {
  connected?: boolean;
  latencyMs?: number;
  error?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_POOL_CONFIG: PoolConfig = {
  // Optimal pool size: (cores * 2) + 1
  // Assuming 4 cores: 9 connections per service
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10), // 5 seconds
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10), // 60 seconds
};

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: process.env.DB_CACHE_ENABLED === 'true',
  type: (process.env.DB_CACHE_TYPE as CacheConfig['type']) || 'database',
  duration: parseInt(process.env.DB_CACHE_DURATION || '60000', 10), // 1 minute default
  options: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
};

const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD || '500', 10); // 500ms

// ============================================================================
// Custom Logger for TypeORM
// ============================================================================

class DatabaseLogger implements Logger {
  private slowQueryThreshold: number;

  constructor(slowQueryThreshold: number = SLOW_QUERY_THRESHOLD) {
    this.slowQueryThreshold = slowQueryThreshold;
  }

  logQuery(query: string, parameters?: unknown[], _queryRunner?: QueryRunner): void {
    logger.debug('Database query', { query: this.truncateQuery(query), parameters });
  }

  logQueryError(error: string | Error, query: string, parameters?: unknown[], _queryRunner?: QueryRunner): void {
    const errorMessage = error instanceof Error ? error.message : error;
    logger.error('Database query error', {
      error: errorMessage,
      query: this.truncateQuery(query),
      parameters,
    });
  }

  logQuerySlow(time: number, query: string, parameters?: unknown[], _queryRunner?: QueryRunner): void {
    logger.warn('Slow database query detected', {
      duration: time,
      threshold: this.slowQueryThreshold,
      query: this.truncateQuery(query),
      parameters,
    });
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner): void {
    logger.info('Database schema', { message });
  }

  logMigration(message: string, _queryRunner?: QueryRunner): void {
    logger.info('Database migration', { message });
  }

  log(level: 'log' | 'info' | 'warn', message: unknown, _queryRunner?: QueryRunner): void {
    switch (level) {
      case 'log':
      case 'info':
        logger.info(String(message));
        break;
      case 'warn':
        logger.warn(String(message));
        break;
    }
  }

  private truncateQuery(query: string, maxLength: number = 200): string {
    return query.length > maxLength ? query.substring(0, maxLength) + '...' : query;
  }
}

// ============================================================================
// Query Performance Tracker
// ============================================================================

interface QueryTracker {
  beforeQuery(event: QueryEvent): void;
  afterQuery(event: QueryEvent): void;
  onQueryError(event: QueryEvent): void;
}

/**
 * TypeORM subscriber to track query performance
 */
export function createQueryTracker(): QueryTracker {
  const queryStartTimes = new Map<string, number>();

  return {
    beforeQuery(event: QueryEvent): void {
      const queryId = `${Date.now()}-${Math.random()}`;
      event.queryId = queryId;
      queryStartTimes.set(queryId, Date.now());
    },

    afterQuery(event: QueryEvent): void {
      const startTime = event.queryId ? queryStartTimes.get(event.queryId) : undefined;
      if (startTime && event.queryId) {
        const duration = Date.now() - startTime;
        queryStartTimes.delete(event.queryId);

        // Extract operation and table from query
        const { operation, table } = extractQueryInfo(event.query);
        recordDatabaseQuery(operation, table, duration);
      }
    },

    onQueryError(event: QueryEvent): void {
      if (event.queryId) {
        const startTime = queryStartTimes.get(event.queryId);
        if (startTime) {
          queryStartTimes.delete(event.queryId);
        }
      }

      const { operation, table } = extractQueryInfo(event.query);
      recordDatabaseError(operation, table);
    },
  };
}

function extractQueryInfo(query: string): { operation: string; table: string } {
  const normalizedQuery = query.trim().toUpperCase();

  let operation = 'UNKNOWN';
  let table = 'unknown';

  if (normalizedQuery.startsWith('SELECT')) {
    operation = 'SELECT';
    const fromMatch = normalizedQuery.match(/FROM\s+["']?(\w+)["']?/i);
    if (fromMatch) {
      table = fromMatch[1].toLowerCase();
    }
  } else if (normalizedQuery.startsWith('INSERT')) {
    operation = 'INSERT';
    const intoMatch = normalizedQuery.match(/INTO\s+["']?(\w+)["']?/i);
    if (intoMatch) {
      table = intoMatch[1].toLowerCase();
    }
  } else if (normalizedQuery.startsWith('UPDATE')) {
    operation = 'UPDATE';
    const updateMatch = normalizedQuery.match(/UPDATE\s+["']?(\w+)["']?/i);
    if (updateMatch) {
      table = updateMatch[1].toLowerCase();
    }
  } else if (normalizedQuery.startsWith('DELETE')) {
    operation = 'DELETE';
    const deleteMatch = normalizedQuery.match(/FROM\s+["']?(\w+)["']?/i);
    if (deleteMatch) {
      table = deleteMatch[1].toLowerCase();
    }
  }

  return { operation, table };
}

// ============================================================================
// Database Factory
// ============================================================================

/**
 * Create a configured DataSource with performance optimizations
 */
export function createDataSource(options: DatabaseOptions): DataSource {
  const primaryConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'metapharm',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };

  const poolConfig = { ...DEFAULT_POOL_CONFIG, ...options.pool };
  const cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...options.cache };

  // Build replication configuration if replicas are specified
  const replication = options.replicas?.length
    ? {
        master: primaryConfig,
        slaves: options.replicas.map((replica) => ({
          host: replica.host,
          port: replica.port,
          username: replica.username,
          password: replica.password,
          database: replica.database,
        })),
      }
    : undefined;

  // Build cache configuration
  let cacheOptions: DataSourceOptions['cache'];
  if (cacheConfig.enabled) {
    if (cacheConfig.type === 'redis' || cacheConfig.type === 'ioredis') {
      cacheOptions = {
        type: cacheConfig.type,
        duration: cacheConfig.duration,
        options: cacheConfig.options,
      };
    } else {
      cacheOptions = {
        type: 'database',
        duration: cacheConfig.duration,
        tableName: 'query_result_cache',
      };
    }
  }

  const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    ...(!replication && primaryConfig),
    replication,
    synchronize: process.env.NODE_ENV === 'development',
    logging: options.logging ?? (process.env.NODE_ENV === 'development'),
    logger: new DatabaseLogger(options.slowQueryThreshold || SLOW_QUERY_THRESHOLD),
    entities: options.entities,
    migrations: options.migrations || [],
    subscribers: options.subscribers || [],

    // Connection pool configuration
    extra: {
      max: poolConfig.max,
      min: poolConfig.min,
      idleTimeoutMillis: poolConfig.idleTimeoutMillis,
      connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
      statement_timeout: 30000, // 30 second query timeout
      idle_in_transaction_session_timeout: 60000, // 60 second idle in transaction timeout
    },

    // Query caching
    cache: cacheOptions,

    // Performance optimizations
    maxQueryExecutionTime: options.slowQueryThreshold || SLOW_QUERY_THRESHOLD, // Log slow queries
  };

  return new DataSource(dataSourceOptions);
}

// ============================================================================
// Database Initialization
// ============================================================================

let primaryDataSource: DataSource | null = null;
let readDataSource: DataSource | null = null;

/**
 * Initialize the primary database connection
 */
export async function initializeDatabase(options: DatabaseOptions): Promise<DataSource> {
  if (primaryDataSource?.isInitialized) {
    return primaryDataSource;
  }

  try {
    primaryDataSource = createDataSource(options);
    await primaryDataSource.initialize();

    logger.info('Database connection established', {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'metapharm',
      poolSize: options.pool?.max || DEFAULT_POOL_CONFIG.max,
      cacheEnabled: options.cache?.enabled || DEFAULT_CACHE_CONFIG.enabled,
    });

    // Run migrations if any
    if (primaryDataSource.migrations.length > 0) {
      await primaryDataSource.runMigrations();
      logger.info('Database migrations executed');
    }

    // Start connection pool monitoring
    startPoolMonitoring(primaryDataSource);

    return primaryDataSource;
  } catch (error) {
    logger.error('Database initialization failed', error as Error);
    throw error;
  }
}

/**
 * Get the primary data source (for writes and consistent reads)
 */
export function getPrimaryDataSource(): DataSource {
  if (!primaryDataSource?.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return primaryDataSource;
}

/**
 * Get read-only data source (routes to replicas if configured)
 */
export function getReadDataSource(): DataSource {
  if (!primaryDataSource?.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return readDataSource || primaryDataSource;
}

/**
 * Close all database connections
 */
export async function closeDatabase(): Promise<void> {
  if (primaryDataSource?.isInitialized) {
    await primaryDataSource.destroy();
    logger.info('Primary database connection closed');
  }
  if (readDataSource?.isInitialized) {
    await readDataSource.destroy();
    logger.info('Read database connection closed');
  }
  primaryDataSource = null;
  readDataSource = null;
}

// ============================================================================
// Connection Pool Monitoring
// ============================================================================

let poolMonitorInterval: NodeJS.Timeout | null = null;

/**
 * Start monitoring the connection pool
 */
function startPoolMonitoring(dataSource: DataSource): void {
  if (poolMonitorInterval) {
    clearInterval(poolMonitorInterval);
  }

  const monitorFn = async (): Promise<void> => {
    try {
      // Get pool statistics from pg driver
      const queryRunner = dataSource.createQueryRunner();
      try {
        const result = (await queryRunner.query(`
          SELECT
            count(*) as total,
            count(*) FILTER (WHERE state = 'active') as active,
            count(*) FILTER (WHERE state = 'idle') as idle,
            count(*) FILTER (WHERE wait_event_type = 'Client') as waiting
          FROM pg_stat_activity
          WHERE datname = current_database()
            AND pid != pg_backend_pid()
        `)) as PoolStatsRow[];

        if (result && result[0]) {
          const row = result[0];
          updateConnectionPoolStatus(parseInt(row.total, 10), parseInt(row.active, 10));
        }
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      // Silently fail - monitoring should not affect application
      logger.debug('Pool monitoring error', { error: (error as Error).message });
    }
  };

  poolMonitorInterval = setInterval(() => {
    void monitorFn();
  }, 30000); // Every 30 seconds
}

/**
 * Stop connection pool monitoring
 */
export function stopPoolMonitoring(): void {
  if (poolMonitorInterval) {
    clearInterval(poolMonitorInterval);
    poolMonitorInterval = null;
  }
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  details?: HealthDetails;
}> {
  const startTime = Date.now();

  try {
    if (!primaryDataSource?.isInitialized) {
      return { healthy: false, latency: 0, details: { error: 'Not initialized' } };
    }

    const queryRunner = primaryDataSource.createQueryRunner();
    try {
      await queryRunner.query('SELECT 1');
      const latency = Date.now() - startTime;

      return {
        healthy: true,
        latency,
        details: {
          connected: true,
          latencyMs: latency,
        },
      };
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
      details: { error: (error as Error).message },
    };
  }
}

export default {
  createDataSource,
  initializeDatabase,
  getPrimaryDataSource,
  getReadDataSource,
  closeDatabase,
  checkDatabaseHealth,
  stopPoolMonitoring,
};
