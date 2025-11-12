/**
 * Health Check Endpoints (T252)
 * Implements liveness, readiness, and metrics endpoints
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Endpoints:
 * - GET /health: Liveness check (is the service running?)
 * - GET /health/ready: Readiness check (are all dependencies healthy?)
 * - GET /health/metrics: Prometheus metrics endpoint
 *
 * Dependencies checked:
 * - PostgreSQL database connectivity
 * - Redis cache connectivity
 * - System memory and CPU
 *
 * Usage:
 * import { healthRouter } from '@shared/routes/health';
 * app.use('/health', healthRouter);
 */

import { Router, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { logger } from '../utils/logger';
import { getMetrics } from '../utils/metrics';

// ============================================================================
// Types
// ============================================================================

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database?: {
    status: 'connected' | 'disconnected';
    latency?: number;
    error?: string;
  };
  redis?: {
    status: 'connected' | 'disconnected';
    latency?: number;
    error?: string;
  };
  memory?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

interface MetricsResponse {
  timestamp: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  cpu?: {
    user: number;
    system: number;
  };
}

// Redis client type (flexible for different versions)
type RedisClientType = any; // Support both redis v3 and v4+

// ============================================================================
// Configuration
// ============================================================================

let appDataSource: DataSource | null = null;
let redisClient: RedisClientType | null = null;
const startTime = Date.now();

/**
 * Initialize health check service with dependencies
 */
export function initializeHealthCheck(
  dataSource: DataSource,
  redis?: RedisClientType
): void {
  appDataSource = dataSource;
  redisClient = redis || null;
  logger.info('Health check service initialized');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheckResult['database']> {
  if (!appDataSource) {
    return { status: 'disconnected', error: 'DataSource not initialized' };
  }

  const startCheck = Date.now();
  try {
    // Execute a simple query to verify connectivity
    const query = appDataSource.createQueryRunner();
    await query.connect();
    await query.query('SELECT NOW()');
    await query.release();

    const latency = Date.now() - startCheck;
    return { status: 'connected', latency };
  } catch (error) {
    const latency = Date.now() - startCheck;
    logger.error('Database health check failed', error as Error);
    return {
      status: 'disconnected',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<HealthCheckResult['redis']> {
  if (!redisClient) {
    return { status: 'disconnected', error: 'Redis not initialized' };
  }

  const startCheck = Date.now();
  try {
    // Execute PING command
    const pong = await redisClient.ping();
    const latency = Date.now() - startCheck;

    if (pong === 'PONG') {
      return { status: 'connected', latency };
    } else {
      return {
        status: 'disconnected',
        latency,
        error: `Unexpected PING response: ${pong}`,
      };
    }
  } catch (error) {
    const latency = Date.now() - startCheck;
    logger.error('Redis health check failed', error as Error);
    return {
      status: 'disconnected',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current memory usage
 */
function getMemoryUsage(): HealthCheckResult['memory'] {
  const mem = process.memoryUsage();
  return {
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024), // MB
    external: Math.round(mem.external / 1024 / 1024), // MB
    rss: Math.round(mem.rss / 1024 / 1024), // MB
  };
}

/**
 * Determine overall health status
 */
function determineHealthStatus(
  dbStatus: 'connected' | 'disconnected',
  redisStatus: 'connected' | 'disconnected'
): 'healthy' | 'degraded' | 'unhealthy' {
  if (dbStatus === 'disconnected') {
    return 'unhealthy'; // Critical - cannot serve requests without DB
  }
  if (redisStatus === 'disconnected') {
    return 'degraded'; // Warning - can function with reduced cache performance
  }
  return 'healthy';
}

// ============================================================================
// Routes
// ============================================================================

export const healthRouter: import('express').Router = Router();

/**
 * GET /health
 * Liveness check - is the service running?
 * Returns 200 OK immediately if the process is alive
 */
healthRouter.get('/', (req: Request, res: Response): void => {
  const uptime = Math.round((Date.now() - startTime) / 1000);
  res.status(200).json({
    status: 'alive',
    uptime,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/ready
 * Readiness check - are all dependencies healthy?
 * Checks database and Redis connectivity
 * Returns 200 if ready, 503 if degraded or unhealthy
 */
healthRouter.get('/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    const uptime = Math.round((Date.now() - startTime) / 1000);
    const dbResult = await checkDatabase();
    const redisResult = await checkRedis();
    const memory = getMemoryUsage();

    const status = determineHealthStatus(
      dbResult.status,
      redisResult.status
    );

    const result: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      database: dbResult,
      redis: redisResult,
      memory,
    };

    const statusCode = status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Readiness check failed', error as Error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /health/metrics
 * Prometheus metrics endpoint
 * Returns metrics in Prometheus text format
 */
healthRouter.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const uptime = Math.round((Date.now() - startTime) / 1000);
    const memory = process.memoryUsage();
    const metrics = getMetrics();

    const metricsResponse: MetricsResponse = {
      timestamp: new Date().toISOString(),
      uptime,
      memory,
    };

    // Try to get CPU metrics
    if (process.cpuUsage) {
      const cpuUsage = process.cpuUsage();
      metricsResponse.cpu = {
        user: cpuUsage.user,
        system: cpuUsage.system,
      };
    }

    res.type('application/json').json({
      ...metricsResponse,
      prometheus: metrics, // Will contain Prometheus registry metrics
    });
  } catch (error) {
    logger.error('Metrics collection failed', error as Error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to collect metrics',
    });
  }
});

export default healthRouter;
