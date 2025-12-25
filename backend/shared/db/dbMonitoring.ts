/**
 * Database Monitoring Module
 * Real-time monitoring of database performance and health
 * T8-061: Database Performance Optimization
 *
 * Features:
 * - Connection pool monitoring
 * - Query performance tracking
 * - Slow query detection
 * - Index usage analysis
 * - Table bloat detection
 * - Lock monitoring
 */

import { DataSource, QueryRunner } from 'typeorm';
import { logger } from '@shared/utils/logger';
import { updateConnectionPoolStatus } from '@shared/utils/metrics';

// ============================================================================
// Types
// ============================================================================

export interface DatabaseStats {
  connections: ConnectionStats;
  queries: QueryStats;
  tables: TableStats[];
  indexes: IndexStats[];
  locks: LockInfo[];
  replication?: ReplicationStats;
}

export interface ConnectionStats {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  maxConnections: number;
  utilizationPercent: number;
}

export interface QueryStats {
  totalQueries: number;
  queriesPerSecond: number;
  avgExecutionTimeMs: number;
  slowQueries: number;
  cacheHitRatio: number;
}

export interface TableStats {
  name: string;
  rowCount: number;
  sizeMB: number;
  deadTuples: number;
  lastVacuum: Date | null;
  lastAnalyze: Date | null;
  bloatRatio: number;
}

export interface IndexStats {
  name: string;
  table: string;
  sizeMB: number;
  scans: number;
  rowsRead: number;
  rowsFetched: number;
  unused: boolean;
}

export interface LockInfo {
  pid: number;
  lockType: string;
  mode: string;
  granted: boolean;
  waitingFor: number | null;
  query: string;
  duration: number;
}

export interface ReplicationStats {
  isReplica: boolean;
  primaryHost?: string;
  lagBytes?: number;
  lagSeconds?: number;
  state?: string;
}

// ============================================================================
// Raw Query Result Types
// ============================================================================

interface ConnectionStatsRow {
  total: string;
  active: string;
  idle: string;
  waiting: string;
  max_connections: string;
}

interface QueryStatsRow {
  total_queries: string;
  avg_exec_time: string;
  slow_queries: string;
}

interface CacheHitRow {
  cache_hit_ratio: string;
}

interface TableStatsRow {
  name: string;
  row_count: string;
  size_mb: string;
  dead_tuples: string;
  last_vacuum: Date | null;
  last_analyze: Date | null;
  bloat_ratio: string;
}

interface IndexStatsRow {
  name: string;
  table_name: string;
  size_mb: string;
  scans: string;
  rows_read: string;
  rows_fetched: string;
  unused: boolean;
}

interface LockInfoRow {
  pid: string;
  lock_type: string;
  mode: string;
  granted: boolean;
  wait_event_type: string | null;
  query: string | null;
  duration_ms: string;
}

interface IsReplicaRow {
  is_replica: boolean;
}

interface ReplicationLagRow {
  lag_seconds: string;
  lag_bytes: string;
}

interface ExtensionCheckRow {
  exists: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD || '500', 10);
const BLOAT_THRESHOLD_PERCENT = parseFloat(process.env.BLOAT_THRESHOLD || '20');
const UNUSED_INDEX_SCAN_THRESHOLD = parseInt(process.env.UNUSED_INDEX_SCANS || '50', 10);

// ============================================================================
// Database Statistics Collection
// ============================================================================

/**
 * Get comprehensive database statistics
 */
export async function getDatabaseStats(dataSource: DataSource): Promise<DatabaseStats> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    const [connections, queries, tables, indexes, locks, replication] = await Promise.all([
      getConnectionStats(queryRunner),
      getQueryStats(queryRunner),
      getTableStats(queryRunner),
      getIndexStats(queryRunner),
      getLockInfo(queryRunner),
      getReplicationStats(queryRunner),
    ]);

    return {
      connections,
      queries,
      tables,
      indexes,
      locks,
      replication,
    };
  } finally {
    await queryRunner.release();
  }
}

/**
 * Get connection pool statistics
 */
async function getConnectionStats(queryRunner: QueryRunner): Promise<ConnectionStats> {
  const result = (await queryRunner.query(`
    SELECT
      count(*) as total,
      count(*) FILTER (WHERE state = 'active') as active,
      count(*) FILTER (WHERE state = 'idle') as idle,
      count(*) FILTER (WHERE wait_event_type = 'Client') as waiting,
      (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
    FROM pg_stat_activity
    WHERE datname = current_database()
  `)) as ConnectionStatsRow[];

  const stats = result[0];
  const total = parseInt(stats.total, 10);
  const maxConnections = parseInt(stats.max_connections, 10);

  return {
    total,
    active: parseInt(stats.active, 10),
    idle: parseInt(stats.idle, 10),
    waiting: parseInt(stats.waiting, 10),
    maxConnections,
    utilizationPercent: Math.round((total / maxConnections) * 100),
  };
}

/**
 * Get query performance statistics
 */
async function getQueryStats(queryRunner: QueryRunner): Promise<QueryStats> {
  // Check if pg_stat_statements is available
  const extensionExists = (await queryRunner.query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
    ) as exists
  `)) as ExtensionCheckRow[];

  if (!extensionExists[0]?.exists) {
    return {
      totalQueries: 0,
      queriesPerSecond: 0,
      avgExecutionTimeMs: 0,
      slowQueries: 0,
      cacheHitRatio: 0,
    };
  }

  const result = (await queryRunner.query(`
    SELECT
      sum(calls) as total_queries,
      avg(mean_exec_time) as avg_exec_time,
      count(*) FILTER (WHERE mean_exec_time > $1) as slow_queries
    FROM pg_stat_statements
    WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  `, [SLOW_QUERY_THRESHOLD_MS])) as QueryStatsRow[];

  // Get cache hit ratio
  const cacheResult = (await queryRunner.query(`
    SELECT
      CASE WHEN (blks_hit + blks_read) > 0
        THEN round(blks_hit * 100.0 / (blks_hit + blks_read), 2)
        ELSE 0
      END as cache_hit_ratio
    FROM pg_stat_database
    WHERE datname = current_database()
  `)) as CacheHitRow[];

  const stats = result[0] || { total_queries: '0', avg_exec_time: '0', slow_queries: '0' };

  return {
    totalQueries: parseInt(stats.total_queries, 10) || 0,
    queriesPerSecond: 0, // Would need time-series data
    avgExecutionTimeMs: parseFloat(stats.avg_exec_time) || 0,
    slowQueries: parseInt(stats.slow_queries, 10) || 0,
    cacheHitRatio: parseFloat(cacheResult[0]?.cache_hit_ratio) || 0,
  };
}

/**
 * Get table statistics including bloat
 */
async function getTableStats(queryRunner: QueryRunner): Promise<TableStats[]> {
  const result = (await queryRunner.query(`
    SELECT
      schemaname || '.' || relname as name,
      n_live_tup as row_count,
      pg_relation_size(relid) / 1024 / 1024.0 as size_mb,
      n_dead_tup as dead_tuples,
      last_vacuum,
      last_analyze,
      CASE
        WHEN n_live_tup > 0
        THEN round(n_dead_tup * 100.0 / (n_live_tup + n_dead_tup), 2)
        ELSE 0
      END as bloat_ratio
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_relation_size(relid) DESC
    LIMIT 20
  `)) as TableStatsRow[];

  return result.map((row: TableStatsRow): TableStats => ({
    name: row.name,
    rowCount: parseInt(row.row_count, 10),
    sizeMB: parseFloat(row.size_mb),
    deadTuples: parseInt(row.dead_tuples, 10),
    lastVacuum: row.last_vacuum,
    lastAnalyze: row.last_analyze,
    bloatRatio: parseFloat(row.bloat_ratio),
  }));
}

/**
 * Get index usage statistics
 */
async function getIndexStats(queryRunner: QueryRunner): Promise<IndexStats[]> {
  const result = (await queryRunner.query(`
    SELECT
      indexrelname as name,
      relname as table_name,
      pg_relation_size(indexrelid) / 1024 / 1024.0 as size_mb,
      idx_scan as scans,
      idx_tup_read as rows_read,
      idx_tup_fetch as rows_fetched,
      idx_scan < $1 as unused
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan ASC
    LIMIT 50
  `, [UNUSED_INDEX_SCAN_THRESHOLD])) as IndexStatsRow[];

  return result.map((row: IndexStatsRow): IndexStats => ({
    name: row.name,
    table: row.table_name,
    sizeMB: parseFloat(row.size_mb),
    scans: parseInt(row.scans, 10),
    rowsRead: parseInt(row.rows_read, 10),
    rowsFetched: parseInt(row.rows_fetched, 10),
    unused: row.unused,
  }));
}

/**
 * Get current lock information
 */
async function getLockInfo(queryRunner: QueryRunner): Promise<LockInfo[]> {
  const result = (await queryRunner.query(`
    SELECT
      l.pid,
      l.locktype as lock_type,
      l.mode,
      l.granted,
      a.wait_event_type,
      a.query,
      EXTRACT(EPOCH FROM (now() - a.query_start)) * 1000 as duration_ms
    FROM pg_locks l
    JOIN pg_stat_activity a ON l.pid = a.pid
    WHERE a.datname = current_database()
      AND l.granted = false
    ORDER BY duration_ms DESC
    LIMIT 10
  `)) as LockInfoRow[];

  return result.map((row: LockInfoRow): LockInfo => ({
    pid: parseInt(row.pid, 10),
    lockType: row.lock_type,
    mode: row.mode,
    granted: row.granted,
    waitingFor: null,
    query: row.query?.substring(0, 200) ?? '',
    duration: parseFloat(row.duration_ms) || 0,
  }));
}

/**
 * Get replication statistics (if replica)
 */
async function getReplicationStats(queryRunner: QueryRunner): Promise<ReplicationStats | undefined> {
  try {
    const isReplicaResult = (await queryRunner.query(`
      SELECT pg_is_in_recovery() as is_replica
    `)) as IsReplicaRow[];

    const isReplica = isReplicaResult[0]?.is_replica;

    if (isReplica) {
      const lagResult = (await queryRunner.query(`
        SELECT
          EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag_seconds,
          pg_wal_lsn_diff(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn()) as lag_bytes
      `)) as ReplicationLagRow[];

      return {
        isReplica: true,
        lagSeconds: parseFloat(lagResult[0]?.lag_seconds) || 0,
        lagBytes: parseInt(lagResult[0]?.lag_bytes, 10) || 0,
        state: 'streaming',
      };
    }

    return { isReplica: false };
  } catch {
    return undefined;
  }
}

// ============================================================================
// Health Checks
// ============================================================================

export interface HealthCheckResult {
  healthy: boolean;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    value?: number | string;
  }[];
}

/**
 * Run comprehensive health checks
 */
export async function runHealthChecks(dataSource: DataSource): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = [];
  let healthy = true;

  const queryRunner = dataSource.createQueryRunner();

  try {
    // Check 1: Connection availability
    try {
      await queryRunner.query('SELECT 1');
      checks.push({ name: 'connection', status: 'pass', message: 'Database is reachable' });
    } catch (_error) {
      healthy = false;
      checks.push({ name: 'connection', status: 'fail', message: 'Database connection failed' });
    }

    // Check 2: Connection pool utilization
    const connStats = await getConnectionStats(queryRunner);
    if (connStats.utilizationPercent > 90) {
      healthy = false;
      checks.push({
        name: 'connection_pool',
        status: 'fail',
        message: `Connection pool at ${connStats.utilizationPercent}% utilization`,
        value: connStats.utilizationPercent,
      });
    } else if (connStats.utilizationPercent > 70) {
      checks.push({
        name: 'connection_pool',
        status: 'warn',
        message: `Connection pool at ${connStats.utilizationPercent}% utilization`,
        value: connStats.utilizationPercent,
      });
    } else {
      checks.push({
        name: 'connection_pool',
        status: 'pass',
        message: `Connection pool at ${connStats.utilizationPercent}% utilization`,
        value: connStats.utilizationPercent,
      });
    }

    // Update metrics
    updateConnectionPoolStatus(connStats.total, connStats.active);

    // Check 3: Table bloat
    const tableStats = await getTableStats(queryRunner);
    const bloatedTables = tableStats.filter((t) => t.bloatRatio > BLOAT_THRESHOLD_PERCENT);
    if (bloatedTables.length > 0) {
      checks.push({
        name: 'table_bloat',
        status: 'warn',
        message: `${bloatedTables.length} tables have >20% bloat`,
        value: bloatedTables.map((t) => t.name).join(', '),
      });
    } else {
      checks.push({
        name: 'table_bloat',
        status: 'pass',
        message: 'No significant table bloat detected',
      });
    }

    // Check 4: Cache hit ratio
    const queryStats = await getQueryStats(queryRunner);
    if (queryStats.cacheHitRatio < 90) {
      checks.push({
        name: 'cache_hit_ratio',
        status: 'warn',
        message: `Cache hit ratio is ${queryStats.cacheHitRatio}%`,
        value: queryStats.cacheHitRatio,
      });
    } else {
      checks.push({
        name: 'cache_hit_ratio',
        status: 'pass',
        message: `Cache hit ratio is ${queryStats.cacheHitRatio}%`,
        value: queryStats.cacheHitRatio,
      });
    }

    // Check 5: Waiting locks
    const locks = await getLockInfo(queryRunner);
    if (locks.length > 5) {
      checks.push({
        name: 'locks',
        status: 'warn',
        message: `${locks.length} queries waiting for locks`,
        value: locks.length,
      });
    } else {
      checks.push({
        name: 'locks',
        status: 'pass',
        message: 'No significant lock contention',
      });
    }

    // Check 6: Replication lag (if replica)
    const replication = await getReplicationStats(queryRunner);
    if (replication?.isReplica) {
      if (replication.lagSeconds && replication.lagSeconds > 60) {
        healthy = false;
        checks.push({
          name: 'replication_lag',
          status: 'fail',
          message: `Replication lag is ${replication.lagSeconds}s`,
          value: replication.lagSeconds,
        });
      } else if (replication.lagSeconds && replication.lagSeconds > 10) {
        checks.push({
          name: 'replication_lag',
          status: 'warn',
          message: `Replication lag is ${replication.lagSeconds}s`,
          value: replication.lagSeconds,
        });
      } else {
        checks.push({
          name: 'replication_lag',
          status: 'pass',
          message: 'Replication is healthy',
        });
      }
    }

    return { healthy, checks };
  } finally {
    await queryRunner.release();
  }
}

// ============================================================================
// Recommendations
// ============================================================================

export interface Recommendation {
  category: 'index' | 'vacuum' | 'config' | 'query' | 'connection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
}

/**
 * Generate performance recommendations
 */
export async function getRecommendations(dataSource: DataSource): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const queryRunner = dataSource.createQueryRunner();

  try {
    // Check for unused indexes
    const indexStats = await getIndexStats(queryRunner);
    const unusedIndexes = indexStats.filter((i) => i.unused && i.sizeMB > 1);
    if (unusedIndexes.length > 0) {
      recommendations.push({
        category: 'index',
        severity: 'medium',
        title: 'Unused indexes detected',
        description: `${unusedIndexes.length} indexes have very low usage and consume ${unusedIndexes.reduce((sum, i) => sum + i.sizeMB, 0).toFixed(1)}MB`,
        action: `Consider removing unused indexes: ${unusedIndexes.map((i) => i.name).slice(0, 3).join(', ')}`,
      });
    }

    // Check for tables needing vacuum
    const tableStats = await getTableStats(queryRunner);
    const needsVacuum = tableStats.filter((t) => t.bloatRatio > BLOAT_THRESHOLD_PERCENT);
    if (needsVacuum.length > 0) {
      recommendations.push({
        category: 'vacuum',
        severity: 'medium',
        title: 'Tables need vacuuming',
        description: `${needsVacuum.length} tables have significant bloat`,
        action: `Run VACUUM ANALYZE on: ${needsVacuum.map((t) => t.name).slice(0, 3).join(', ')}`,
      });
    }

    // Check connection pool
    const connStats = await getConnectionStats(queryRunner);
    if (connStats.utilizationPercent > 80) {
      recommendations.push({
        category: 'connection',
        severity: 'high',
        title: 'Connection pool near capacity',
        description: `Pool utilization is at ${connStats.utilizationPercent}%`,
        action: 'Consider increasing max_connections or adding connection pooling (PgBouncer)',
      });
    }

    // Check for missing statistics
    const noAnalyze = tableStats.filter((t) => !t.lastAnalyze);
    if (noAnalyze.length > 0) {
      recommendations.push({
        category: 'query',
        severity: 'medium',
        title: 'Missing table statistics',
        description: `${noAnalyze.length} tables have never been analyzed`,
        action: `Run ANALYZE on: ${noAnalyze.map((t) => t.name).slice(0, 3).join(', ')}`,
      });
    }

    return recommendations;
  } finally {
    await queryRunner.release();
  }
}

// ============================================================================
// Monitoring Interval
// ============================================================================

let monitoringInterval: NodeJS.Timeout | null = null;

/**
 * Start periodic monitoring
 */
export function startMonitoring(dataSource: DataSource, intervalMs: number = 60000): void {
  if (monitoringInterval) {
    stopMonitoring();
  }

  const monitorFn = async (): Promise<void> => {
    try {
      const healthCheck = await runHealthChecks(dataSource);

      if (!healthCheck.healthy) {
        logger.warn('Database health check failed', {
          checks: healthCheck.checks.filter((c) => c.status !== 'pass'),
        });
      }

      // Log recommendations periodically
      const recommendations = await getRecommendations(dataSource);
      const highPriority = recommendations.filter((r) => r.severity === 'high' || r.severity === 'critical');

      if (highPriority.length > 0) {
        logger.warn('High priority database recommendations', { recommendations: highPriority });
      }
    } catch (error) {
      logger.error('Database monitoring error', error as Error);
    }
  };

  monitoringInterval = setInterval(() => {
    void monitorFn();
  }, intervalMs);

  logger.info('Database monitoring started', { intervalMs });
}

/**
 * Stop periodic monitoring
 */
export function stopMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    logger.info('Database monitoring stopped');
  }
}

export default {
  getDatabaseStats,
  runHealthChecks,
  getRecommendations,
  startMonitoring,
  stopMonitoring,
};
