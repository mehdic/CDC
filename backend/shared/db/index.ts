/**
 * Database Module Index
 * Exports all database utilities for easy import
 * T8-061: Database Performance Optimization
 *
 * Usage:
 * import {
 *   initializeDatabase,
 *   getPrimaryDataSource,
 *   cachedQuery,
 *   paginateWithCursor,
 *   startMonitoring,
 * } from '@shared/db';
 */

// Database Configuration
export {
  createDataSource,
  initializeDatabase,
  getPrimaryDataSource,
  getReadDataSource,
  closeDatabase,
  checkDatabaseHealth,
  stopPoolMonitoring,
  type DatabaseConfig,
  type ReplicaConfig,
  type PoolConfig,
  type CacheConfig,
  type DatabaseOptions,
} from '@shared/db/database.config';

// Query Optimizer
export {
  analyzeQuery,
  cachedQuery,
  cachedRawQuery,
  invalidateCache,
  invalidateCacheByTag,
  invalidateAllCache,
  getCacheStats,
  paginateWithCursor,
  optimizeQuery,
  batchQueries,
  getSlowQueries,
  stopQueryOptimizer,
  type QueryPlan,
  type CacheOptions,
  type PaginationOptions,
  type PaginatedResult,
} from '@shared/db/queryOptimizer';

// Database Monitoring
export {
  getDatabaseStats,
  runHealthChecks,
  getRecommendations,
  startMonitoring,
  stopMonitoring,
  type DatabaseStats,
  type ConnectionStats,
  type QueryStats,
  type TableStats,
  type IndexStats,
  type LockInfo,
  type ReplicationStats,
  type HealthCheckResult,
  type Recommendation,
} from '@shared/db/dbMonitoring';

// Existing exports
export {
  getJsonbType,
  JsonbColumn,
  registerJsonbTypeMapping,
  makeEntitySqliteCompatible,
} from '@shared/db/JsonbColumnType';
