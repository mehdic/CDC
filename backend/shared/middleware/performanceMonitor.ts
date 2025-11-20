/**
 * Performance Monitoring Middleware (T255)
 * Application Performance Monitoring (APM) and metrics collection
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Features:
 * - Track request duration (latency)
 * - Identify slow endpoints (>1s)
 * - Database query duration tracking
 * - Memory usage monitoring
 * - Database connection pool statistics
 * - Response time percentiles (p50, p95, p99)
 * - Slow query detection and logging
 *
 * Usage:
 * app.use(performanceMonitor);
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { recordRequestDuration, recordSlowRequest } from '../utils/metrics';

// ============================================================================
// Types
// ============================================================================

export interface PerformanceMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  isSlowRequest: boolean;
  memory?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  timestamp: string;
}

export interface QueryMetrics {
  query: string;
  duration: number;
  isSlowQuery: boolean;
  timestamp: string;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  availableConnections: number;
  waitingRequests: number;
  averageConnectionTime: number;
}

// ============================================================================
// Configuration
// ============================================================================

const SLOW_REQUEST_THRESHOLD = process.env.SLOW_REQUEST_THRESHOLD || 1000; // ms
const SLOW_QUERY_THRESHOLD = process.env.SLOW_QUERY_THRESHOLD || 500; // ms
const ENABLE_MEMORY_TRACKING = process.env.ENABLE_MEMORY_TRACKING !== 'false';

// Request duration samples for percentile calculation
const requestDurations: number[] = [];
const MAX_SAMPLES = 1000;

// ============================================================================
// Performance Metrics Collection
// ============================================================================

/**
 * Reset performance metrics (for testing)
 */
export function resetPerformanceMetrics(): void {
  requestDurations.length = 0;
}

/**
 * Record request duration and calculate percentiles
 */
export function recordDuration(duration: number): void {
  requestDurations.push(duration);

  // Keep only last MAX_SAMPLES to prevent memory bloat
  if (requestDurations.length > MAX_SAMPLES) {
    requestDurations.shift();
  }
}

/**
 * Calculate percentile from samples
 */
function calculatePercentile(samples: number[], percentile: number): number {
  if (samples.length === 0) return 0;

  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Get current performance statistics
 */
export function getPerformanceStats(): {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  max: number;
  min: number;
} {
  if (requestDurations.length === 0) {
    return { p50: 0, p95: 0, p99: 0, avg: 0, max: 0, min: 0 };
  }

  const sum = requestDurations.reduce((a, b) => a + b, 0);

  return {
    p50: calculatePercentile(requestDurations, 50),
    p95: calculatePercentile(requestDurations, 95),
    p99: calculatePercentile(requestDurations, 99),
    avg: Math.round(sum / requestDurations.length),
    max: Math.max(...requestDurations),
    min: Math.min(...requestDurations),
  };
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(query: string, duration: number): void {
  const isSlowQuery = duration > (SLOW_QUERY_THRESHOLD as number);

  const queryMetrics: QueryMetrics = {
    query: query.substring(0, 100), // Truncate for logging
    duration,
    isSlowQuery,
    timestamp: new Date().toISOString(),
  };

  if (isSlowQuery) {
    logger.warn('Slow database query detected', {
      query: queryMetrics.query,
      duration,
      threshold: SLOW_QUERY_THRESHOLD,
    });
  } else {
    logger.debug('Database query executed', {
      duration,
    });
  }
}

/**
 * Get memory statistics
 */
export function getMemoryStats(): {
  heapUsed: number;
  heapTotal: number;
  external: number;
  heapUsedPercent: number;
  rss: number;
} {
  const mem = process.memoryUsage();

  return {
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    external: Math.round(mem.external / 1024 / 1024),
    heapUsedPercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
    rss: Math.round(mem.rss / 1024 / 1024),
  };
}

/**
 * Detect memory leaks (heap growing consistently)
 */
const heapHistory: { timestamp: number; heapUsed: number }[] = [];
const HEAP_HISTORY_SIZE = 60; // Keep last 60 measurements

export function checkForMemoryLeak(): {
  isLeaking: boolean;
  growth: number;
  growthPercent: number;
} {
  const currentHeap = process.memoryUsage().heapUsed;
  const now = Date.now();

  heapHistory.push({ timestamp: now, heapUsed: currentHeap });

  // Keep only last HEAP_HISTORY_SIZE measurements
  while (heapHistory.length > HEAP_HISTORY_SIZE) {
    heapHistory.shift();
  }

  if (heapHistory.length < 10) {
    return { isLeaking: false, growth: 0, growthPercent: 0 };
  }

  // Calculate trend from last 10 measurements
  const recent10 = heapHistory.slice(-10);
  const oldest = recent10[0].heapUsed;
  const newest = recent10[recent10.length - 1].heapUsed;
  const growth = newest - oldest;
  const growthPercent = (growth / oldest) * 100;

  // If heap grew more than 10% in recent history, possible leak
  const isLeaking = growthPercent > 10;

  return {
    isLeaking,
    growth: Math.round(growth / 1024 / 1024), // Convert to MB
    growthPercent: Math.round(growthPercent),
  };
}

// ============================================================================
// Performance Monitoring Middleware
// ============================================================================

/**
 * Performance monitoring middleware
 * Tracks request duration and identifies slow requests
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = req.requestId || 'unknown';

  // Capture original json method
  const originalJson = res.json;

  res.json = function (data: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Record metrics
    recordDuration(duration);
    recordRequestDuration(req.method, req.path, duration, statusCode);

    const isSlowRequest = duration > (SLOW_REQUEST_THRESHOLD as number);

    const metrics: PerformanceMetrics = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      duration,
      isSlowRequest,
      timestamp: new Date().toISOString(),
    };

    // Include memory stats if enabled
    if (ENABLE_MEMORY_TRACKING) {
      const memStats = getMemoryStats();
      metrics.memory = {
        heapUsed: memStats.heapUsed,
        heapTotal: memStats.heapTotal,
        external: memStats.external,
      };

      // Check for memory leaks
      const leakCheck = checkForMemoryLeak();
      if (leakCheck.isLeaking) {
        logger.warn('Potential memory leak detected', {
          growth: leakCheck.growth,
          growthPercent: leakCheck.growthPercent,
          currentHeap: memStats.heapUsed,
        });
      }
    }

    // Log slow requests
    if (isSlowRequest) {
      recordSlowRequest(req.method, req.path, duration);
      logger.warn('Slow request detected', {
        ...metrics,
        threshold: SLOW_REQUEST_THRESHOLD,
      });
    } else {
      logger.debug('Request performance', {
        method: req.method,
        path: req.path,
        duration,
      });
    }

    return originalJson.call(this, data);
  };

  // Also capture send for non-JSON responses
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    recordDuration(duration);
    recordRequestDuration(req.method, req.path, duration, res.statusCode);

    const isSlowRequest = duration > (SLOW_REQUEST_THRESHOLD as number);
    if (isSlowRequest) {
      recordSlowRequest(req.method, req.path, duration);
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        threshold: SLOW_REQUEST_THRESHOLD,
      });
    }

    return originalSend.call(this, data);
  };

  next();
}

export default performanceMonitor;
