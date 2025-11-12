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
import { DataSource } from 'typeorm';
type RedisClientType = any;
/**
 * Initialize health check service with dependencies
 */
export declare function initializeHealthCheck(dataSource: DataSource, redis?: RedisClientType): void;
export declare const healthRouter: import("node_modules/@types/express-serve-static-core").Router;
export default healthRouter;
//# sourceMappingURL=health.d.ts.map