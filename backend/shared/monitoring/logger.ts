import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

interface LogMetadata {
  requestId?: string;
  userId?: string;
  timestamp?: string;
  service?: string;
  environment?: string;
  [key: string]: any;
}

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const SERVICE_NAME = process.env.SERVICE_NAME || 'metapharm-api';

// Create Winston logger with structured JSON logging
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
      const log = {
        timestamp,
        level,
        message,
        service: SERVICE_NAME,
        environment: ENVIRONMENT,
        ...metadata,
      };
      return JSON.stringify(log);
    })
  ),
  defaultMeta: {
    service: SERVICE_NAME,
    environment: ENVIRONMENT,
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${meta}`;
        })
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// CloudWatch integration
export const configureCloudWatchLogging = () => {
  const isProduction = ENVIRONMENT === 'production';

  if (isProduction) {
    try {
      const WinstonCloudWatch = require('winston-cloudwatch');
      logger.add(
        new WinstonCloudWatch({
          logGroupName: `/metapharm/${SERVICE_NAME}`,
          logStreamName: `${SERVICE_NAME}-${new Date().toISOString().split('T')[0]}`,
          awsRegion: process.env.AWS_REGION || 'us-east-1',
          messageFormatter: (logEvent: any) => {
            return JSON.stringify({
              timestamp: new Date(logEvent.timestamp).toISOString(),
              level: logEvent.level,
              message: logEvent.message,
              ...logEvent.meta,
            });
          },
          retentionInDays: parseInt(process.env.LOG_RETENTION_DAYS || '30'),
        })
      );
      logger.info('CloudWatch logging configured');
    } catch (error) {
      logger.warn('CloudWatch logging not configured', { error: (error as Error).message });
    }
  }
};

/**
 * Request logging middleware
 * Attaches request ID and logs request/response
 */
export const requestLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  (req as any).id = requestId;

  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger.log(level, 'Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
    });
  });

  next();
};

/**
 * Log with request context
 */
export const logWithContext = (
  level: string,
  message: string,
  requestId?: string,
  metadata?: LogMetadata
) => {
  const logData = {
    ...(metadata || {}),
    ...(requestId && { requestId }),
  };

  logger.log(level, message, logData);
};

// Convenience functions
export const logInfo = (message: string, metadata?: LogMetadata, requestId?: string) =>
  logWithContext('info', message, requestId, metadata);

export const logWarn = (message: string, metadata?: LogMetadata, requestId?: string) =>
  logWithContext('warn', message, requestId, metadata);

export const logError = (message: string, error?: Error, metadata?: LogMetadata, requestId?: string) =>
  logWithContext('error', message, requestId, { ...metadata, error: error?.message, stack: error?.stack });

export const logDebug = (message: string, metadata?: LogMetadata, requestId?: string) =>
  logWithContext('debug', message, requestId, metadata);
