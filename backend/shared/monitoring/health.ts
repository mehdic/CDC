import { Request, Response } from 'express';
import { logger } from './logger';

// Note: Database and RedisClient should be imported from actual database/cache modules
// These are placeholder references that should be updated based on actual implementation
const Database = {
  query: async (sql: string) => {
    return true;
  },
};

const RedisClient = {
  ping: async () => {
    return 'PONG';
  },
};

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      duration: number;
      error?: string;
    };
  };
}

export interface ReadinessCheckResult {
  ready: boolean;
  timestamp: string;
  checks: {
    [key: string]: {
      ready: boolean;
      error?: string;
    };
  };
}

const startTime = Date.now();

/**
 * Deep health check
 * Checks health of all critical services
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check database
  checks.database = await checkDatabase();
  if (checks.database.status === 'fail') {
    overallStatus = 'unhealthy';
  } else if (checks.database.status === 'warn') {
    overallStatus = 'degraded';
  }

  // Check Redis
  checks.redis = await checkRedis();
  if (checks.redis.status === 'fail') {
    overallStatus = 'unhealthy';
  } else if (checks.redis.status === 'warn') {
    overallStatus = 'degraded';
  }

  // Check memory usage
  checks.memory = checkMemory();
  if (checks.memory.status === 'fail') {
    overallStatus = 'degraded';
  }

  // Check uptime
  checks.uptime = checkUptime();

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    checks,
  };
}

/**
 * Readiness check
 * Checks if service is ready to accept traffic
 */
export async function performReadinessCheck(): Promise<ReadinessCheckResult> {
  const checks: ReadinessCheckResult['checks'] = {};
  let ready = true;

  // Check database connection
  const dbReady = await checkDatabaseReady();
  checks.database = dbReady;
  if (!dbReady.ready) ready = false;

  // Check Redis connection
  const redisReady = await checkRedisReady();
  checks.redis = redisReady;
  if (!redisReady.ready) ready = false;

  return {
    ready,
    timestamp: new Date().toISOString(),
    checks,
  };
}

// Helper functions

async function checkDatabase(): Promise<{
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  error?: string;
}> {
  const startCheck = Date.now();
  try {
    // Perform a simple query to verify connection
    await Database.query('SELECT 1');
    const duration = Date.now() - startCheck;

    if (duration > 1000) {
      return {
        status: 'warn',
        duration,
        error: 'Database response slow',
      };
    }

    return { status: 'pass', duration };
  } catch (error) {
    return {
      status: 'fail',
      duration: Date.now() - startCheck,
      error: (error as Error).message,
    };
  }
}

async function checkDatabaseReady(): Promise<{
  ready: boolean;
  error?: string;
}> {
  try {
    await Database.query('SELECT 1');
    return { ready: true };
  } catch (error) {
    return {
      ready: false,
      error: (error as Error).message,
    };
  }
}

async function checkRedis(): Promise<{
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  error?: string;
}> {
  const startCheck = Date.now();
  try {
    if (!RedisClient) {
      return {
        status: 'fail',
        duration: Date.now() - startCheck,
        error: 'Redis client not initialized',
      };
    }

    await RedisClient.ping();
    const duration = Date.now() - startCheck;

    if (duration > 500) {
      return {
        status: 'warn',
        duration,
        error: 'Redis response slow',
      };
    }

    return { status: 'pass', duration };
  } catch (error) {
    return {
      status: 'fail',
      duration: Date.now() - startCheck,
      error: (error as Error).message,
    };
  }
}

async function checkRedisReady(): Promise<{
  ready: boolean;
  error?: string;
}> {
  try {
    if (!RedisClient) {
      return {
        ready: false,
        error: 'Redis client not initialized',
      };
    }

    await RedisClient.ping();
    return { ready: true };
  } catch (error) {
    return {
      ready: false,
      error: (error as Error).message,
    };
  }
}

function checkMemory(): {
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  error?: string;
} {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  if (heapUsedPercent > 90) {
    return {
      status: 'fail',
      duration: 0,
      error: `Heap memory usage critical: ${heapUsedPercent.toFixed(2)}%`,
    };
  }

  if (heapUsedPercent > 75) {
    return {
      status: 'warn',
      duration: 0,
      error: `Heap memory usage high: ${heapUsedPercent.toFixed(2)}%`,
    };
  }

  return {
    status: 'pass',
    duration: 0,
  };
}

function checkUptime(): {
  status: 'pass' | 'fail' | 'warn';
  duration: number;
} {
  return {
    status: 'pass',
    duration: Date.now() - startTime,
  };
}

/**
 * Health check endpoint handler
 */
export async function healthCheckEndpoint(req: Request, res: Response) {
  try {
    const healthCheck = await performHealthCheck();
    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed', { error: (error as Error).message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
}

/**
 * Readiness check endpoint handler
 */
export async function readinessCheckEndpoint(req: Request, res: Response) {
  try {
    const readinessCheck = await performReadinessCheck();
    const statusCode = readinessCheck.ready ? 200 : 503;
    res.status(statusCode).json(readinessCheck);
  } catch (error) {
    logger.error('Readiness check failed', { error: (error as Error).message });
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
}

/**
 * Liveness check endpoint handler
 * Simple check that service process is running
 */
export function livenessCheckEndpoint(req: Request, res: Response) {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
}
