/**
 * Audit Logging Middleware
 * Automatically logs all API requests for audit trail
 */

import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../index';
import { AuditLog } from '@models/AuditLog';

/**
 * Audit middleware - logs all requests
 * Runs after authentication, so req.user is available
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Capture original response methods
  const originalSend = res.send;
  const originalJson = res.json;

  // Track response data
  let responseBody: any;
  let statusCode: number;

  // Intercept res.send
  res.send = function (data: any) {
    responseBody = data;
    statusCode = res.statusCode;
    return originalSend.call(this, data);
  };

  // Intercept res.json
  res.json = function (data: any) {
    responseBody = data;
    statusCode = res.statusCode;
    return originalJson.call(this, data);
  };

  // Log audit entry after response is sent
  res.on('finish', async () => {
    try {
      const user = (req as any).user;

      if (!user) {
        // Skip audit logging for unauthenticated requests
        return;
      }

      // Determine action from method and path
      const action = getActionFromRequest(req);

      // Skip logging for read-only operations (optional - can be configured)
      if (req.method === 'GET') {
        return;
      }

      // Extract resource info
      const resource = getResourceFromPath(req.path);
      const resourceId = extractResourceId(req);

      // Create audit log entry
      const auditRepository = AppDataSource.getRepository(AuditLog);
      const auditEntry = auditRepository.create({
        user_id: user.userId,
        action,
        resource,
        resource_id: resourceId,
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: sanitizeBody(req.body),
          statusCode,
          success: statusCode >= 200 && statusCode < 300,
        },
        ip_address: req.ip || (req.socket as any).remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
      });

      await auditRepository.save(auditEntry);
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't fail the request if audit logging fails
    }
  });

  next();
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine action name from HTTP method and path
 */
function getActionFromRequest(req: Request): string {
  const method = req.method;
  const path = req.path;

  // Map common patterns to actions
  if (method === 'POST' && path.includes('/create')) {
    return `${getResourceFromPath(path)}.created`;
  }

  if (method === 'PUT' && path.includes('/permissions')) {
    return 'permission.updated';
  }

  if (method === 'PUT' && path.includes('/settings')) {
    return 'settings.updated';
  }

  if (method === 'DELETE') {
    return `${getResourceFromPath(path)}.deleted`;
  }

  if (method === 'PATCH' || method === 'PUT') {
    return `${getResourceFromPath(path)}.updated`;
  }

  return `${method.toLowerCase()}.${getResourceFromPath(path)}`;
}

/**
 * Extract resource name from URL path
 */
function getResourceFromPath(path: string): string {
  // Extract resource name from path (e.g., /account/users -> user)
  const match = path.match(/\/account\/([^\/]+)/);

  if (match) {
    return match[1].replace(/s$/, ''); // Remove trailing 's' (users -> user)
  }

  return 'unknown';
}

/**
 * Extract resource ID from request params
 */
function extractResourceId(req: Request): string | null {
  // Check common param names
  return req.params.id || req.params.userId || req.params.resourceId || null;
}

/**
 * Sanitize request body for audit log (remove sensitive fields)
 */
function sanitizeBody(body: any): any {
  if (!body) return {};

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}
