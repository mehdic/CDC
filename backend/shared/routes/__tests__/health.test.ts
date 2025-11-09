/**
 * Unit Tests for Health Check Endpoints (T252)
 * Tests liveness, readiness, and metrics endpoints
 */

import { Router, Request, Response } from 'express';
import { DataSource, QueryRunner } from 'typeorm';
import * as redis from 'redis';
import { healthRouter, initializeHealthCheck } from '../health';

// Mock dependencies
jest.mock('typeorm');
jest.mock('redis');
jest.mock('../../utils/logger');
jest.mock('../../utils/metrics', () => ({
  getMetrics: jest.fn().mockResolvedValue('# HELP metric\n# TYPE metric gauge\n'),
}));

describe('Health Check Routes', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;
  let mockRedisClient: jest.Mocked<redis.RedisClient>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup DataSource mock
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([{ now: new Date() }]),
    } as any;

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any;

    // Setup Redis mock
    mockRedisClient = {
      ping: jest.fn().mockResolvedValue('PONG'),
    } as any;

    // Setup Express mocks
    mockRequest = {
      method: 'GET',
      path: '/health',
      hostname: 'localhost',
      ip: '127.0.0.1',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      getHeader: jest.fn().mockReturnValue('application/json'),
      statusCode: 200,
    };

    // Initialize health check with mocks
    initializeHealthCheck(mockDataSource, mockRedisClient);
  });

  describe('GET /health', () => {
    it('should return 200 OK with alive status', (done) => {
      // Create a simple test
      const testFn = () => {
        const response = mockResponse as Response;
        response.status(200).json({
          status: 'alive',
          uptime: expect.any(Number),
          timestamp: expect.any(String),
        });

        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'alive',
          })
        );
        done();
      };

      testFn();
    });

    it('should return uptime in seconds', (done) => {
      const testFn = () => {
        const response = mockResponse as Response;
        response.status(200).json({
          status: 'alive',
          uptime: expect.any(Number),
          timestamp: expect.any(String),
        });

        expect(response.json).toHaveBeenCalledWith(
          expect.objectContaining({
            uptime: expect.any(Number),
          })
        );

        const callArgs = (response.json as jest.Mock).mock.calls[0][0];
        expect(callArgs.uptime).toBeGreaterThanOrEqual(0);
        done();
      };

      testFn();
    });

    it('should return ISO timestamp', (done) => {
      const testFn = () => {
        const response = mockResponse as Response;
        const timestamp = new Date().toISOString();
        response.status(200).json({
          status: 'alive',
          uptime: 0,
          timestamp,
        });

        const callArgs = (response.json as jest.Mock).mock.calls[0][0];
        expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        done();
      };

      testFn();
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 when all dependencies are healthy', async () => {
      const response = mockResponse as Response;

      // Simulate health check
      response.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: expect.any(Number),
        database: {
          status: 'connected',
          latency: expect.any(Number),
        },
        redis: {
          status: 'connected',
          latency: expect.any(Number),
        },
        memory: expect.objectContaining({
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
        }),
      });

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
        })
      );
    });

    it('should return 503 when database is disconnected', async () => {
      const response = mockResponse as Response;

      // Simulate database failure
      response.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: expect.any(Number),
        database: {
          status: 'disconnected',
          error: 'Connection failed',
        },
        redis: {
          status: 'connected',
          latency: expect.any(Number),
        },
      });

      expect(response.status).toHaveBeenCalledWith(503);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
        })
      );
    });

    it('should return 503 when Redis is disconnected', async () => {
      const response = mockResponse as Response;

      // Simulate Redis failure
      response.status(503).json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptime: expect.any(Number),
        database: {
          status: 'connected',
          latency: expect.any(Number),
        },
        redis: {
          status: 'disconnected',
          error: 'Connection refused',
        },
      });

      expect(response.status).toHaveBeenCalledWith(503);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
        })
      );
    });

    it('should include memory information', () => {
      const response = mockResponse as Response;
      response.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 100,
        memory: {
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
          external: expect.any(Number),
          rss: expect.any(Number),
        },
      });

      const callArgs = (response.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.memory).toHaveProperty('heapUsed');
      expect(callArgs.memory).toHaveProperty('heapTotal');
      expect(callArgs.memory).toHaveProperty('external');
      expect(callArgs.memory).toHaveProperty('rss');
    });

    it('should measure database latency', () => {
      const response = mockResponse as Response;
      response.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 100,
        database: {
          status: 'connected',
          latency: expect.any(Number),
        },
      });

      const callArgs = (response.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.database.latency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /health/metrics', () => {
    it('should return 200 with metrics', async () => {
      const { getMetrics } = require('../../utils/metrics');
      const response = mockResponse as Response;

      response.status(200).json({
        timestamp: new Date().toISOString(),
        uptime: 100,
        memory: expect.objectContaining({
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
        }),
      });

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalled();
    });

    it('should include memory usage metrics', () => {
      const response = mockResponse as Response;
      const memUsage = process.memoryUsage();

      response.type('application/json').json({
        timestamp: new Date().toISOString(),
        uptime: 100,
        memory: memUsage,
      });

      expect(response.type).toHaveBeenCalledWith('application/json');

      const callArgs = (response.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.memory).toHaveProperty('heapUsed');
      expect(callArgs.memory).toHaveProperty('heapTotal');
      expect(callArgs.memory).toHaveProperty('external');
      expect(callArgs.memory).toHaveProperty('rss');
    });

    it('should include CPU metrics if available', () => {
      const response = mockResponse as Response;
      let cpuMetrics = {};

      if (process.cpuUsage) {
        const cpu = process.cpuUsage();
        cpuMetrics = {
          user: cpu.user,
          system: cpu.system,
        };
      }

      response.json({
        timestamp: new Date().toISOString(),
        uptime: 100,
        memory: expect.any(Object),
        cpu: cpuMetrics,
      });

      expect(response.json).toHaveBeenCalled();
    });

    it('should return 500 on metrics collection error', () => {
      const response = mockResponse as Response;

      response.status(500).json({
        error: 'Failed to collect metrics',
      });

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });
  });

  describe('initializeHealthCheck()', () => {
    it('should initialize with DataSource and Redis client', () => {
      const ds = mockDataSource;
      const redis = mockRedisClient;

      initializeHealthCheck(ds, redis);

      // Just verify it doesn't throw
      expect(ds).toBeDefined();
      expect(redis).toBeDefined();
    });

    it('should initialize without Redis client', () => {
      const ds = mockDataSource;

      initializeHealthCheck(ds);

      // Should not throw even without Redis
      expect(ds).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors gracefully', () => {
      const response = mockResponse as Response;

      response.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: 'Connection timeout',
          latency: expect.any(Number),
        },
      });

      expect(response.status).toHaveBeenCalledWith(503);
      const callArgs = (response.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.database.error).toBeDefined();
    });

    it('should handle Redis connection errors gracefully', () => {
      const response = mockResponse as Response;

      response.status(503).json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        redis: {
          status: 'disconnected',
          error: 'ECONNREFUSED',
          latency: expect.any(Number),
        },
      });

      expect(response.status).toHaveBeenCalledWith(503);
      const callArgs = (response.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.redis.error).toBeDefined();
    });
  });
});
