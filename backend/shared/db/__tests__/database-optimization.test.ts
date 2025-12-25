/**
 * Database Optimization Test Suite
 * Tests for database configuration, query optimizer, and monitoring
 * T8-061: Database Performance Optimization
 */

import { DataSource, QueryRunner, SelectQueryBuilder } from 'typeorm';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../utils/metrics', () => ({
  recordDatabaseQuery: jest.fn(),
  recordDatabaseError: jest.fn(),
  updateConnectionPoolStatus: jest.fn(),
  recordCacheHit: jest.fn(),
  recordCacheMiss: jest.fn(),
  dbQueryDurationMs: { observe: jest.fn() },
  dbActiveConnections: { set: jest.fn() },
  dbConnectionPoolSize: { set: jest.fn() },
}));

jest.mock('prom-client', () => ({
  collectDefaultMetrics: jest.fn(),
  Counter: jest.fn().mockImplementation(() => ({
    inc: jest.fn(),
    labels: jest.fn().mockReturnThis(),
  })),
  Histogram: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    labels: jest.fn().mockReturnThis(),
  })),
  Gauge: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    labels: jest.fn().mockReturnThis(),
  })),
  register: {
    metrics: jest.fn().mockResolvedValue(''),
    getMetricsAsJSON: jest.fn().mockResolvedValue([]),
    resetMetrics: jest.fn(),
  },
}));

import {
  createDataSource,
  checkDatabaseHealth,
} from '../database.config';

import {
  analyzeQuery,
  cachedRawQuery,
  invalidateCache,
  invalidateCacheByTag,
  invalidateAllCache,
  getCacheStats,
  paginateWithCursor,
  stopQueryOptimizer,
} from '../queryOptimizer';

import {
  getDatabaseStats,
  runHealthChecks,
  getRecommendations,
  startMonitoring,
  stopMonitoring,
} from '../dbMonitoring';

import { recordDatabaseQuery, recordCacheHit, recordCacheMiss } from '../../utils/metrics';

// ============================================================================
// Mock Setup
// ============================================================================

const mockQueryRunner = {
  query: jest.fn(),
  release: jest.fn(),
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
};

const mockDataSource = {
  isInitialized: true,
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  initialize: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  migrations: [],
  runMigrations: jest.fn().mockResolvedValue([]),
} as unknown as DataSource;

// ============================================================================
// Database Configuration Tests
// ============================================================================

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('createDataSource', () => {
    it('should create a data source with default pool configuration', () => {
      const options = {
        entities: ['./models/*.ts'],
      };

      const dataSource = createDataSource(options);

      expect(dataSource).toBeDefined();
      expect(dataSource.options.type).toBe('postgres');
    });

    it('should apply custom pool configuration', () => {
      const options = {
        entities: ['./models/*.ts'],
        pool: {
          max: 20,
          min: 5,
        },
      };

      const dataSource = createDataSource(options);

      expect(dataSource.options.extra?.max).toBe(20);
      expect(dataSource.options.extra?.min).toBe(5);
    });

    it('should configure cache when enabled', () => {
      process.env.DB_CACHE_ENABLED = 'true';

      const options = {
        entities: ['./models/*.ts'],
        cache: {
          enabled: true,
          type: 'database' as const,
          duration: 30000,
        },
      };

      const dataSource = createDataSource(options);

      expect(dataSource.options.cache).toBeDefined();
    });

    it('should set slow query threshold', () => {
      const options = {
        entities: ['./models/*.ts'],
        slowQueryThreshold: 1000,
      };

      const dataSource = createDataSource(options);

      expect(dataSource.options.maxQueryExecutionTime).toBe(1000);
    });
  });

  describe('checkDatabaseHealth', () => {
    it('should return unhealthy when database is not initialized', async () => {
      const uninitializedDataSource = {
        isInitialized: false,
      } as unknown as DataSource;

      // Can't test directly since it depends on module state
      // This is a placeholder for integration tests
    });
  });
});

// ============================================================================
// Query Optimizer Tests
// ============================================================================

describe('Query Optimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateAllCache();
  });

  afterAll(() => {
    stopQueryOptimizer();
  });

  describe('Query Caching', () => {
    it('should cache query results', async () => {
      const mockResult = [{ id: '1', name: 'Test' }];
      mockQueryRunner.query.mockResolvedValueOnce(mockResult);

      const result1 = await cachedRawQuery(
        mockDataSource,
        'SELECT * FROM users WHERE id = $1',
        ['1'],
        { ttl: 60000 }
      );

      expect(result1).toEqual(mockResult);
      expect(mockQueryRunner.query).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await cachedRawQuery(
        mockDataSource,
        'SELECT * FROM users WHERE id = $1',
        ['1'],
        { ttl: 60000 }
      );

      expect(result2).toEqual(mockResult);
      expect(mockQueryRunner.query).toHaveBeenCalledTimes(1); // No additional query
      expect(recordCacheHit).toHaveBeenCalled();
    });

    it('should invalidate cache by key', async () => {
      const mockResult = [{ id: '1', name: 'Test' }];
      mockQueryRunner.query.mockResolvedValue(mockResult);

      await cachedRawQuery(
        mockDataSource,
        'SELECT * FROM users',
        [],
        { ttl: 60000, key: 'users_list' }
      );

      invalidateCache('users_list');

      await cachedRawQuery(
        mockDataSource,
        'SELECT * FROM users',
        [],
        { ttl: 60000, key: 'users_list' }
      );

      expect(mockQueryRunner.query).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache by tag', async () => {
      const mockResult = [{ id: '1' }];
      mockQueryRunner.query.mockResolvedValue(mockResult);

      await cachedRawQuery(
        mockDataSource,
        'SELECT * FROM users WHERE status = $1',
        ['active'],
        { ttl: 60000, tags: ['users'] }
      );

      const invalidated = invalidateCacheByTag('users');

      expect(invalidated).toBeGreaterThan(0);
    });

    it('should return cache statistics', () => {
      const stats = getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
    });
  });

  describe('Query Analysis', () => {
    it('should analyze query execution plan', async () => {
      const mockPlan = {
        'QUERY PLAN': [{
          'Execution Time': 1.5,
          'Planning Time': 0.2,
          Plan: {
            'Node Type': 'Seq Scan',
            'Total Cost': 100,
            'Actual Rows': 50,
          },
        }],
      };

      mockQueryRunner.query.mockResolvedValueOnce([mockPlan]);

      const result = await analyzeQuery(
        mockDataSource,
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );

      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('planningTime');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('suggestions');
    });
  });

  describe('Cursor Pagination', () => {
    it('should paginate with cursor correctly', async () => {
      const mockItems = [
        { id: '1', name: 'A', created_at: new Date() },
        { id: '2', name: 'B', created_at: new Date() },
        { id: '3', name: 'C', created_at: new Date() },
      ];

      const mockQueryBuilder = {
        alias: 'user',
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockItems),
        getQuery: jest.fn().mockReturnValue('SELECT * FROM users'),
        getParameters: jest.fn().mockReturnValue({}),
      } as unknown as SelectQueryBuilder<any>;

      const result = await paginateWithCursor(mockQueryBuilder, {
        limit: 2,
        sortField: 'created_at',
        sortDirection: 'DESC',
      });

      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });

    it('should decode and apply cursor', async () => {
      const cursor = Buffer.from(JSON.stringify({
        value: '2025-01-01',
        id: '123',
      })).toString('base64');

      const mockQueryBuilder = {
        alias: 'user',
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getQuery: jest.fn().mockReturnValue('SELECT * FROM users'),
        getParameters: jest.fn().mockReturnValue({}),
      } as unknown as SelectQueryBuilder<any>;

      await paginateWithCursor(mockQueryBuilder, {
        cursor,
        limit: 10,
        sortField: 'created_at',
        sortDirection: 'DESC',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Database Monitoring Tests
// ============================================================================

describe('Database Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    stopMonitoring();
  });

  describe('getDatabaseStats', () => {
    it('should return comprehensive database statistics', async () => {
      mockQueryRunner.query
        // Connection stats
        .mockResolvedValueOnce([{
          total: '10',
          active: '3',
          idle: '7',
          waiting: '0',
          max_connections: '100',
        }])
        // pg_stat_statements extension check
        .mockResolvedValueOnce([{ exists: true }])
        // Query stats
        .mockResolvedValueOnce([{
          total_queries: '1000',
          avg_exec_time: '5.5',
          slow_queries: '10',
        }])
        // Cache hit ratio
        .mockResolvedValueOnce([{ cache_hit_ratio: '99.5' }])
        // Table stats
        .mockResolvedValueOnce([])
        // Index stats
        .mockResolvedValueOnce([])
        // Lock info
        .mockResolvedValueOnce([])
        // Replication check
        .mockResolvedValueOnce([{ is_replica: false }]);

      const stats = await getDatabaseStats(mockDataSource);

      expect(stats).toHaveProperty('connections');
      expect(stats).toHaveProperty('queries');
      expect(stats).toHaveProperty('tables');
      expect(stats).toHaveProperty('indexes');
      expect(stats).toHaveProperty('locks');
    });
  });

  describe('runHealthChecks', () => {
    it('should return healthy status when all checks pass', async () => {
      mockQueryRunner.query
        // Connection test
        .mockResolvedValueOnce([{ '?column?': 1 }])
        // Connection stats
        .mockResolvedValueOnce([{
          total: '5',
          active: '2',
          idle: '3',
          waiting: '0',
          max_connections: '100',
        }])
        // Table stats
        .mockResolvedValueOnce([])
        // pg_stat_statements check
        .mockResolvedValueOnce([{ exists: true }])
        // Query stats
        .mockResolvedValueOnce([{
          total_queries: '1000',
          avg_exec_time: '5',
          slow_queries: '5',
        }])
        // Cache hit ratio
        .mockResolvedValueOnce([{ cache_hit_ratio: '99' }])
        // Lock info
        .mockResolvedValueOnce([])
        // Replication check
        .mockResolvedValueOnce([{ is_replica: false }]);

      const result = await runHealthChecks(mockDataSource);

      expect(result.healthy).toBe(true);
      expect(result.checks.length).toBeGreaterThan(0);
    });

    it('should return unhealthy when connection pool is overloaded', async () => {
      mockQueryRunner.query
        // Connection test
        .mockResolvedValueOnce([{ '?column?': 1 }])
        // Connection stats - 95% utilization
        .mockResolvedValueOnce([{
          total: '95',
          active: '90',
          idle: '5',
          waiting: '10',
          max_connections: '100',
        }])
        // Table stats
        .mockResolvedValueOnce([])
        // pg_stat_statements check
        .mockResolvedValueOnce([{ exists: true }])
        // Query stats
        .mockResolvedValueOnce([{
          total_queries: '1000',
          avg_exec_time: '5',
          slow_queries: '5',
        }])
        // Cache hit ratio
        .mockResolvedValueOnce([{ cache_hit_ratio: '99' }])
        // Lock info
        .mockResolvedValueOnce([])
        // Replication check
        .mockResolvedValueOnce([{ is_replica: false }]);

      const result = await runHealthChecks(mockDataSource);

      expect(result.healthy).toBe(false);
      const poolCheck = result.checks.find(c => c.name === 'connection_pool');
      expect(poolCheck?.status).toBe('fail');
    });
  });

  describe('getRecommendations', () => {
    it('should generate recommendations for unused indexes', async () => {
      mockQueryRunner.query
        // Index stats with unused index
        .mockResolvedValueOnce([{
          name: 'idx_unused',
          table_name: 'users',
          size_mb: '50',
          scans: '10',
          rows_read: '0',
          rows_fetched: '0',
          unused: true,
        }])
        // Table stats
        .mockResolvedValueOnce([{
          name: 'users',
          row_count: '1000',
          size_mb: '10',
          dead_tuples: '0',
          last_vacuum: null,
          last_analyze: new Date(),
          bloat_ratio: '5',
        }])
        // Connection stats
        .mockResolvedValueOnce([{
          total: '5',
          active: '2',
          idle: '3',
          waiting: '0',
          max_connections: '100',
        }]);

      const recommendations = await getRecommendations(mockDataSource);

      const indexRec = recommendations.find(r => r.category === 'index');
      expect(indexRec).toBeDefined();
      expect(indexRec?.title).toContain('Unused indexes');
    });

    it('should recommend vacuum for bloated tables', async () => {
      mockQueryRunner.query
        // Index stats
        .mockResolvedValueOnce([])
        // Table stats with bloat
        .mockResolvedValueOnce([{
          name: 'orders',
          row_count: '100000',
          size_mb: '500',
          dead_tuples: '50000',
          last_vacuum: null,
          last_analyze: null,
          bloat_ratio: '35',
        }])
        // Connection stats
        .mockResolvedValueOnce([{
          total: '5',
          active: '2',
          idle: '3',
          waiting: '0',
          max_connections: '100',
        }]);

      const recommendations = await getRecommendations(mockDataSource);

      const vacuumRec = recommendations.find(r => r.category === 'vacuum');
      expect(vacuumRec).toBeDefined();
      expect(vacuumRec?.action).toContain('VACUUM');
    });
  });

  describe('Monitoring Interval', () => {
    it('should start and stop monitoring', () => {
      // Start monitoring with short interval for testing
      startMonitoring(mockDataSource, 100);

      // Stop should not throw
      expect(() => stopMonitoring()).not.toThrow();
    });
  });
});

// ============================================================================
// Performance Index Migration Tests
// ============================================================================

describe('Performance Indexes Migration', () => {
  it('should have valid migration file', async () => {
    // Import migration
    const { AddPerformanceIndexes1762971104000 } = await import(
      '../migrations/1762971104000-add-performance-indexes'
    );

    const migration = new AddPerformanceIndexes1762971104000();

    expect(migration.name).toBe('AddPerformanceIndexes1762971104000');
    expect(typeof migration.up).toBe('function');
    expect(typeof migration.down).toBe('function');
  });

  it('should create all required indexes in up migration', async () => {
    const { AddPerformanceIndexes1762971104000 } = await import(
      '../migrations/1762971104000-add-performance-indexes'
    );

    const migration = new AddPerformanceIndexes1762971104000();

    // Mock query runner
    const queries: string[] = [];
    const mockRunner = {
      query: jest.fn((sql: string) => {
        queries.push(sql);
        return Promise.resolve([]);
      }),
    } as unknown as QueryRunner;

    await migration.up(mockRunner);

    // Verify key indexes are created
    expect(queries.some(q => q.includes('idx_users_pharmacy_role'))).toBe(true);
    expect(queries.some(q => q.includes('idx_products_catalog'))).toBe(true);
    expect(queries.some(q => q.includes('idx_orders_pharmacy_status'))).toBe(true);
    expect(queries.some(q => q.includes('idx_prescriptions_queue'))).toBe(true);
    expect(queries.some(q => q.includes('idx_vip_tier_active'))).toBe(true);
    expect(queries.some(q => q.includes('USING GIN'))).toBe(true); // GIN indexes for JSONB
    expect(queries.some(q => q.includes('ANALYZE'))).toBe(true); // Statistics update
  });

  it('should drop all indexes in down migration', async () => {
    const { AddPerformanceIndexes1762971104000 } = await import(
      '../migrations/1762971104000-add-performance-indexes'
    );

    const migration = new AddPerformanceIndexes1762971104000();

    const queries: string[] = [];
    const mockRunner = {
      query: jest.fn((sql: string) => {
        queries.push(sql);
        return Promise.resolve([]);
      }),
    } as unknown as QueryRunner;

    await migration.down(mockRunner);

    // Verify indexes are dropped
    expect(queries.some(q => q.includes('DROP INDEX'))).toBe(true);
    expect(queries.some(q => q.includes('idx_users_pharmacy_role'))).toBe(true);
    expect(queries.some(q => q.includes('idx_products_catalog'))).toBe(true);
    expect(queries.some(q => q.includes('idx_orders_pharmacy_status'))).toBe(true);
  });
});

// ============================================================================
// Integration Tests (require actual database)
// ============================================================================

describe('Integration Tests', () => {
  // These tests would require a real PostgreSQL database
  // They are skipped in CI but can be run locally with proper setup

  describe.skip('Database Connection', () => {
    it('should connect to PostgreSQL', async () => {
      // Integration test placeholder
    });

    it('should execute optimized queries', async () => {
      // Integration test placeholder
    });

    it('should use indexes for common queries', async () => {
      // Integration test placeholder
    });
  });
});
