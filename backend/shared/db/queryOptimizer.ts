/**
 * Query Optimizer Service
 * Advanced query optimization, caching, and performance analysis
 * T8-061: Database Performance Optimization
 *
 * Features:
 * - Query plan analysis (EXPLAIN ANALYZE)
 * - Query result caching with TTL
 * - Slow query detection and logging
 * - Query optimization suggestions
 * - Cursor-based pagination utilities
 */

import { DataSource, SelectQueryBuilder } from 'typeorm';
import { logger } from '@shared/utils/logger';
import { recordDatabaseQuery, recordCacheHit, recordCacheMiss } from '@shared/utils/metrics';

// ============================================================================
// Types
// ============================================================================

export interface QueryPlan {
  query: string;
  executionTime: number;
  planningTime: number;
  totalCost: number;
  actualRows: number;
  warnings: string[];
  suggestions: string[];
  plan: PlanNode | null;
}

export interface CacheOptions {
  ttl: number; // milliseconds
  key?: string;
  tags?: string[];
}

export interface PaginationOptions {
  cursor?: string;
  limit: number;
  sortField: string;
  sortDirection: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

// ============================================================================
// Query Plan Types
// ============================================================================

interface PlanNode {
  'Node Type'?: string;
  'Relation Name'?: string;
  'Actual Rows'?: number;
  'Plan Rows'?: number;
  'Total Cost'?: number;
  Plans?: PlanNode[];
}

interface ExplainResult {
  'QUERY PLAN': Array<{
    'Execution Time'?: number;
    'Planning Time'?: number;
    Plan?: PlanNode;
  }>;
}

interface CursorData {
  value: unknown;
  id: string;
}

interface SlowQueryRow {
  query: string;
  calls: number;
  avg_duration_ms: number;
  max_duration_ms: number;
  total_duration_ms: number;
  rows: number;
}

interface ExtensionCheckRow {
  exists: boolean;
}

// ============================================================================
// In-Memory Query Cache
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags: string[];
}

class QueryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.startCleanup();
  }

  private startCleanup(): void {
    // Clean expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanExpired();
    }, 60000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      recordCacheMiss('query_cache');
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      recordCacheMiss('query_cache');
      return null;
    }

    recordCacheHit('query_cache');
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number, tags: string[] = []): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      tags,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  private cleanExpired(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need additional tracking
    };
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Global cache instance
const queryCache = new QueryCache(parseInt(process.env.QUERY_CACHE_SIZE || '1000', 10));

// ============================================================================
// Query Plan Analysis
// ============================================================================

/**
 * Analyze query execution plan
 */
export async function analyzeQuery(
  dataSource: DataSource,
  query: string,
  parameters?: unknown[]
): Promise<QueryPlan> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    // Get execution plan with timing
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
    const result = (await queryRunner.query(explainQuery, parameters)) as ExplainResult[];

    const planData = result[0]?.['QUERY PLAN']?.[0];
    const executionTime = planData?.['Execution Time'] ?? 0;
    const planningTime = planData?.['Planning Time'] ?? 0;
    const planNode = planData?.Plan ?? null;
    const totalCost = planNode?.['Total Cost'] ?? 0;
    const actualRows = planNode?.['Actual Rows'] ?? 0;

    // Analyze plan for warnings and suggestions
    const { warnings, suggestions } = analyzeExecutionPlan(planNode);

    return {
      query,
      executionTime,
      planningTime,
      totalCost,
      actualRows,
      warnings,
      suggestions,
      plan: planNode,
    };
  } finally {
    await queryRunner.release();
  }
}

/**
 * Analyze execution plan for potential issues
 */
function analyzeExecutionPlan(plan: PlanNode | null): { warnings: string[]; suggestions: string[] } {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!plan) {
    return { warnings, suggestions };
  }

  const analyzePlanNode = (node: PlanNode | null, _depth: number = 0): void => {
    if (!node) {
      return;
    }

    // Check for sequential scans on large tables
    if (node['Node Type'] === 'Seq Scan' && (node['Actual Rows'] ?? 0) > 1000) {
      warnings.push(`Sequential scan on large table: ${node['Relation Name'] ?? 'unknown'} (${node['Actual Rows'] ?? 0} rows)`);
      suggestions.push(`Consider adding an index on ${node['Relation Name'] ?? 'unknown'} for the filtered columns`);
    }

    // Check for high cost operations
    if ((node['Total Cost'] ?? 0) > 10000) {
      warnings.push(`High cost operation: ${node['Node Type'] ?? 'unknown'} (cost: ${node['Total Cost'] ?? 0})`);
    }

    // Check for poor row estimates
    if (node['Plan Rows'] !== undefined && node['Actual Rows'] !== undefined) {
      const estimateRatio = (node['Plan Rows'] ?? 0) / Math.max(node['Actual Rows'] ?? 1, 1);
      if (estimateRatio > 10 || estimateRatio < 0.1) {
        warnings.push(`Poor row estimate for ${node['Node Type'] ?? 'unknown'}: estimated ${node['Plan Rows'] ?? 0}, actual ${node['Actual Rows'] ?? 0}`);
        suggestions.push('Run ANALYZE on the table to update statistics');
      }
    }

    // Check for nested loops with high row counts
    if (node['Node Type'] === 'Nested Loop' && (node['Actual Rows'] ?? 0) > 10000) {
      warnings.push(`Nested loop with high row count: ${node['Actual Rows'] ?? 0} rows`);
      suggestions.push('Consider using a hash join or merge join by adding appropriate indexes');
    }

    // Check for sort operations on large datasets
    if (node['Node Type'] === 'Sort' && (node['Actual Rows'] ?? 0) > 10000) {
      warnings.push(`Sorting large dataset: ${node['Actual Rows'] ?? 0} rows`);
      suggestions.push('Add an index that matches the ORDER BY clause');
    }

    // Recursively analyze child plans
    if (node.Plans) {
      for (const childPlan of node.Plans) {
        analyzePlanNode(childPlan, _depth + 1);
      }
    }
  };

  analyzePlanNode(plan);

  return { warnings, suggestions };
}

// ============================================================================
// Cached Query Execution
// ============================================================================

/**
 * Execute a query with caching
 */
export async function cachedQuery<T>(
  _dataSource: DataSource,
  queryBuilder: SelectQueryBuilder<T>,
  options: CacheOptions
): Promise<T[]> {
  const cacheKey = options.key || generateCacheKey(queryBuilder.getQuery(), queryBuilder.getParameters());

  // Check cache first
  const cached = queryCache.get<T[]>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Execute query
  const startTime = Date.now();
  const result = await queryBuilder.getMany();
  const duration = Date.now() - startTime;

  // Record metrics
  const { operation, table } = extractQueryInfo(queryBuilder.getQuery());
  recordDatabaseQuery(operation, table, duration);

  // Cache result
  queryCache.set(cacheKey, result, options.ttl, options.tags || []);

  return result;
}

/**
 * Execute a raw query with caching
 */
export async function cachedRawQuery<T>(
  dataSource: DataSource,
  query: string,
  parameters: unknown[] = [],
  options: CacheOptions
): Promise<T[]> {
  const cacheKey = options.key || generateCacheKey(query, parameters);

  // Check cache first
  const cached = queryCache.get<T[]>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Execute query
  const startTime = Date.now();
  const queryRunner = dataSource.createQueryRunner();
  let result: T[];

  try {
    result = (await queryRunner.query(query, parameters)) as T[];
    const duration = Date.now() - startTime;

    // Record metrics
    const { operation, table } = extractQueryInfo(query);
    recordDatabaseQuery(operation, table, duration);
  } finally {
    await queryRunner.release();
  }

  // Cache result
  queryCache.set(cacheKey, result, options.ttl, options.tags || []);

  return result;
}

/**
 * Generate cache key from query and parameters
 */
function generateCacheKey(query: string, parameters?: unknown): string {
  const normalizedQuery = query.replace(/\s+/g, ' ').trim();
  const paramsStr = parameters ? JSON.stringify(parameters) : '';
  return `query:${Buffer.from(normalizedQuery + paramsStr).toString('base64').substring(0, 64)}`;
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
// Cache Management
// ============================================================================

/**
 * Invalidate cache by key
 */
export function invalidateCache(key: string): void {
  queryCache.invalidate(key);
}

/**
 * Invalidate cache by tag (e.g., after entity update)
 */
export function invalidateCacheByTag(tag: string): number {
  return queryCache.invalidateByTag(tag);
}

/**
 * Invalidate all cached queries
 */
export function invalidateAllCache(): void {
  queryCache.invalidateAll();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number; hitRate: number } {
  return queryCache.getStats();
}

// ============================================================================
// Cursor-Based Pagination
// ============================================================================

interface EntityWithId {
  id: string;
  [key: string]: unknown;
}

/**
 * Cursor-based pagination for efficient pagination of large datasets
 * Uses keyset pagination instead of OFFSET for better performance
 */
export async function paginateWithCursor<T extends EntityWithId>(
  queryBuilder: SelectQueryBuilder<T>,
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { cursor, limit, sortField, sortDirection } = options;

  // Decode cursor if provided
  let cursorValue: unknown = null;
  let cursorId: string | null = null;

  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as CursorData;
      cursorValue = decoded.value;
      cursorId = decoded.id;
    } catch {
      // Invalid cursor, start from beginning
    }
  }

  // Apply cursor filter
  if (cursorValue !== null && cursorId) {
    const operator = sortDirection === 'ASC' ? '>' : '<';
    queryBuilder.andWhere(
      `(${queryBuilder.alias}.${sortField} ${operator} :cursorValue OR (${queryBuilder.alias}.${sortField} = :cursorValue AND ${queryBuilder.alias}.id ${operator} :cursorId))`,
      { cursorValue, cursorId }
    );
  }

  // Order by sort field and id for consistent ordering
  queryBuilder
    .orderBy(`${queryBuilder.alias}.${sortField}`, sortDirection)
    .addOrderBy(`${queryBuilder.alias}.id`, sortDirection);

  // Fetch one extra to determine if there are more results
  queryBuilder.take(limit + 1);

  const startTime = Date.now();
  const results = await queryBuilder.getMany();
  const duration = Date.now() - startTime;

  // Record metrics
  recordDatabaseQuery('SELECT', queryBuilder.alias, duration);

  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;

  // Generate next cursor
  let nextCursor: string | null = null;
  if (hasMore && data.length > 0) {
    const lastItem = data[data.length - 1];
    const cursorData: CursorData = {
      value: lastItem[sortField],
      id: lastItem.id,
    };
    nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  return {
    data,
    nextCursor,
    hasMore,
  };
}

// ============================================================================
// Query Optimization Utilities
// ============================================================================

/**
 * Add common performance hints to a query builder
 */
export function optimizeQuery<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: {
    selectOnly?: string[];
    useIndex?: string;
    noLogging?: boolean;
  } = {}
): SelectQueryBuilder<T> {
  // Select only required columns if specified
  if (options.selectOnly && options.selectOnly.length > 0) {
    queryBuilder.select(options.selectOnly.map((col) => `${queryBuilder.alias}.${col}`));
  }

  // Add index hint if supported (PostgreSQL doesn't have USE INDEX, but we can log recommendation)
  if (options.useIndex && process.env.NODE_ENV === 'development') {
    logger.debug('Query optimization suggestion', {
      query: queryBuilder.getQuery(),
      recommendedIndex: options.useIndex,
    });
  }

  return queryBuilder;
}

/**
 * Batch multiple queries for efficient execution
 */
export async function batchQueries<T>(
  dataSource: DataSource,
  queries: { query: string; parameters?: unknown[] }[]
): Promise<T[][]> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const results: T[][] = [];
    const startTime = Date.now();

    for (const { query, parameters } of queries) {
      const result = (await queryRunner.query(query, parameters)) as T[];
      results.push(result);
    }

    await queryRunner.commitTransaction();

    const duration = Date.now() - startTime;
    recordDatabaseQuery('BATCH', 'multiple', duration);

    return results;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// ============================================================================
// Slow Query Detection
// ============================================================================

/**
 * Get slow queries from pg_stat_statements (requires extension)
 */
export async function getSlowQueries(
  dataSource: DataSource,
  options: { minDuration?: number; limit?: number } = {}
): Promise<SlowQueryRow[]> {
  const minDuration = options.minDuration || 100; // 100ms default
  const limit = options.limit || 20;

  const queryRunner = dataSource.createQueryRunner();

  try {
    // Check if pg_stat_statements is available
    const extensionCheck = (await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
      ) as exists
    `)) as ExtensionCheckRow[];

    if (!extensionCheck[0]?.exists) {
      logger.warn('pg_stat_statements extension not installed');
      return [];
    }

    const result = (await queryRunner.query(
      `
      SELECT
        query,
        calls,
        mean_exec_time as avg_duration_ms,
        max_exec_time as max_duration_ms,
        total_exec_time as total_duration_ms,
        rows
      FROM pg_stat_statements
      WHERE mean_exec_time > $1
        AND query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_exec_time DESC
      LIMIT $2
    `,
      [minDuration, limit]
    )) as SlowQueryRow[];

    return result;
  } finally {
    await queryRunner.release();
  }
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Stop query cache cleanup interval
 */
export function stopQueryOptimizer(): void {
  queryCache.stop();
}

export default {
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
};
