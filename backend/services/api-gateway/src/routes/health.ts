/**
 * Health Check Endpoint (T058)
 * Implements health check for API Gateway and downstream services
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Returns:
 * - Gateway health status
 * - All microservices health status
 * - Timestamp
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { serviceEndpoints } from './proxy';

const router = Router();

const HEALTH_CHECK_TIMEOUT = parseInt(
  process.env['HEALTH_CHECK_TIMEOUT_MS'] || '2000',
  10
);

/**
 * Health check result for a single service
 */
interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
}

/**
 * Overall health check response
 */
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  gateway: {
    status: 'healthy';
    uptime: number;
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
  };
  services: Record<string, ServiceHealth>;
}

/**
 * Check health of a single microservice
 */
async function checkServiceHealth(
  serviceName: string,
  serviceUrl: string
): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    // Try to hit the service's health endpoint
    await axios.get(`${serviceUrl}/health`, {
      timeout: HEALTH_CHECK_TIMEOUT,
      validateStatus: (status) => status === 200,
    });

    const responseTime = Date.now() - startTime;

    return {
      name: serviceName,
      status: 'healthy',
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      name: serviceName,
      status: 'unhealthy',
      responseTime,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * GET /health
 * Returns health status of API Gateway and all microservices
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check all microservices in parallel
    const serviceHealthChecks = await Promise.all(
      serviceEndpoints.map((service) =>
        checkServiceHealth(service.name, service.url)
      )
    );

    // Build services health object
    const services: Record<string, ServiceHealth> = {};
    let unhealthyCount = 0;

    for (const check of serviceHealthChecks) {
      services[check.name] = {
        name: check.name,
        status: check.status,
        responseTime: check.responseTime,
        error: check.error,
      };

      if (check.status === 'unhealthy') {
        unhealthyCount++;
      }
    }

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount === 0) {
      overallStatus = 'healthy';
    } else if (unhealthyCount < serviceEndpoints.length) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    // Gateway health
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      gateway: {
        status: 'healthy',
        uptime: Math.floor(uptime),
        memoryUsage: {
          heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024), // MB
          rss: Math.floor(memoryUsage.rss / 1024 / 1024), // MB
        },
      },
      services,
    };

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json(healthResponse);
  } catch (error: any) {
    console.error('Health check failed:', error);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message,
    });
  }
});

/**
 * GET /health/live
 * Kubernetes liveness probe - checks if gateway is running
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/ready
 * Kubernetes readiness probe - checks if gateway can serve traffic
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    // Check at least one critical service (auth) is healthy
    const authService = serviceEndpoints.find(s => s.name === 'auth');
    if (!authService) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: 'Auth service configuration not found',
      });
      return;
    }

    const authHealth = await checkServiceHealth('auth', authService.url);

    if (authHealth.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: 'Critical services unavailable',
      });
    }
  } catch (error: any) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

export default router;
