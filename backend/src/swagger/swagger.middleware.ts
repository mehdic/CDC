/**
 * Swagger Middleware
 * Sets up Swagger UI and API documentation endpoints
 */

import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Initialize Swagger documentation in Express app
 * @param app Express application instance
 */
export function initializeSwagger(app: Express): void {
  try {
    // Load OpenAPI spec from YAML file
    const openapiPath = resolve(__dirname, '../../docs/api/openapi.yaml');
    const openapiContent = readFileSync(openapiPath, 'utf8');
    const openapiSpec = yaml.load(openapiContent) as Record<string, any>;

    // Serve OpenAPI spec as JSON
    app.get('/api-docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(openapiSpec);
    });

    // Serve OpenAPI spec as YAML
    app.get('/api-docs.yaml', (_req, res) => {
      res.setHeader('Content-Type', 'application/yaml');
      res.send(openapiContent);
    });

    // Swagger UI with custom options
    const swaggerUiOptions = {
      swaggerOptions: {
        url: '/api-docs.json',
        deepLinking: true,
        presets: [
          'swagger-ui/dist/swagger-ui.js',
          'swagger-ui/dist/swagger-ui-standalone-preset.js',
        ],
        layout: 'StandaloneLayout',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
      },
      customCss: `
        .swagger-ui {
          --spacing-1: 4px;
          --spacing-2: 8px;
          --spacing-3: 12px;
          --spacing-4: 16px;
        }
        .swagger-ui .topbar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .swagger-ui .info .title {
          color: #667eea;
        }
        .swagger-ui .scheme-container {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
        }
        .swagger-ui .btn {
          border-radius: 4px;
        }
        .swagger-ui .btn.authorize {
          background-color: #667eea;
        }
        .swagger-ui table tbody tr:hover {
          background-color: #f8f9fa;
        }
      `,
      customSiteTitle: 'MetaPharm Connect API Documentation',
      customfavIcon:
        'https://metapharm.ch/favicon.ico',
    };

    // Mount Swagger UI
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(openapiSpec, swaggerUiOptions)
    );

    // Mount Swagger UI at root path for convenience
    app.use(
      '/swagger',
      swaggerUi.serve,
      swaggerUi.setup(openapiSpec, swaggerUiOptions)
    );

    console.log('✓ Swagger documentation initialized');
    console.log('  - Interactive UI: http://localhost:4000/api-docs');
    console.log('  - Alternative UI: http://localhost:4000/swagger');
    console.log('  - OpenAPI JSON: http://localhost:4000/api-docs.json');
    console.log('  - OpenAPI YAML: http://localhost:4000/api-docs.yaml');
  } catch (error) {
    console.error('Failed to initialize Swagger:', error);
    throw error;
  }
}

/**
 * Middleware to validate requests against OpenAPI spec
 * This is optional but useful for development
 */
export function validateAgainstOpenAPI(_req: any, _res: any, next: any) {
  // This would require additional validation libraries like ajv
  // Implementation depends on specific requirements
  next();
}

/**
 * Add JSDoc comments to your route handlers for automatic documentation:
 *
 * Example:
 * ```typescript
 * /**
 *  * Get user by ID
 *  * @route GET /users/:id
 *  * @param {string} id - User ID
 *  * @returns {object} 200 - User object
 *  * @returns {Error} 404 - User not found
 *  * @security BearerAuth
 *  * /
 * ```
 */

/**
 * Common response documentation patterns:
 *
 * 200 OK:
 * ```typescript
 * res.json({ success: true, data: {...} })
 * ```
 *
 * 400 Bad Request:
 * ```typescript
 * res.status(400).json({
 *   error: 'Bad Request',
 *   message: 'Validation failed',
 *   code: 'VALIDATION_ERROR'
 * })
 * ```
 *
 * 401 Unauthorized:
 * ```typescript
 * res.status(401).json({
 *   error: 'Unauthorized',
 *   message: 'Invalid or missing authentication token',
 *   code: 'INVALID_TOKEN'
 * })
 * ```
 *
 * 403 Forbidden:
 * ```typescript
 * res.status(403).json({
 *   error: 'Forbidden',
 *   message: 'Insufficient permissions',
 *   code: 'INSUFFICIENT_PERMISSIONS'
 * })
 * ```
 *
 * 404 Not Found:
 * ```typescript
 * res.status(404).json({
 *   error: 'Not Found',
 *   message: 'Resource not found',
 *   code: 'NOT_FOUND'
 * })
 * ```
 *
 * 429 Too Many Requests:
 * ```typescript
 * res.status(429).json({
 *   error: 'Too Many Requests',
 *   message: 'Rate limit exceeded',
 *   code: 'RATE_LIMIT_EXCEEDED'
 * })
 * ```
 */
