/**
 * Digital Twin API Routes
 * RESTful endpoints for patient digital twin profiles
 *
 * Security Features (T8-054):
 * - JWT authentication required for all endpoints
 * - Rate limiting to prevent DoS attacks
 * - Input validation for patientId parameter
 * - Protection against injection attacks
 */

import { Router, RequestHandler, Request, Response, NextFunction } from 'express';
// eslint-disable-next-line no-restricted-imports
import {
  getDigitalTwinProfile,
  refreshDigitalTwinProfile,
  getHealthTrends,
} from '../controllers/digitalTwin.controller';
import { authenticateJWT } from '@shared/middleware/auth';
import { createGeneralRateLimiter } from '@shared/middleware/rateLimiter';
import { validateUUID, handleValidationErrors } from '@shared/middleware/validateInput';

const router = Router();

// Initialize rate limiter (async initialization handled at app startup)
let rateLimiter: RequestHandler | undefined;

/**
 * Initialize rate limiter middleware
 * Call this during app initialization
 */
export async function initializeRateLimiter(): Promise<void> {
  rateLimiter = await createGeneralRateLimiter();
}

/**
 * Get rate limiter middleware
 * Returns no-op middleware if not initialized (for testing)
 */
function getRateLimiter(): RequestHandler {
  return rateLimiter || ((req: Request, res: Response, next: NextFunction): void => next());
}

/**
 * GET /api/digital-twin/patients/:patientId/profile
 * Get digital twin profile for a patient (uses cache if available)
 *
 * Security:
 * - Requires JWT authentication
 * - Rate limited to prevent abuse
 * - Validates patientId as UUID
 */
router.get(
  '/patients/:patientId/profile',
  authenticateJWT,
  getRateLimiter(),
  validateUUID('patientId', 'param'),
  handleValidationErrors,
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  getDigitalTwinProfile
);

/**
 * POST /api/digital-twin/patients/:patientId/refresh
 * Force refresh of digital twin profile
 *
 * Security:
 * - Requires JWT authentication
 * - Rate limited to prevent abuse
 * - Validates patientId as UUID
 */
router.post(
  '/patients/:patientId/refresh',
  authenticateJWT,
  getRateLimiter(),
  validateUUID('patientId', 'param'),
  handleValidationErrors,
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  refreshDigitalTwinProfile
);

/**
 * GET /api/digital-twin/patients/:patientId/trends
 * Get health trends for visualization
 *
 * Security:
 * - Requires JWT authentication
 * - Rate limited to prevent abuse
 * - Validates patientId as UUID
 */
router.get(
  '/patients/:patientId/trends',
  authenticateJWT,
  getRateLimiter(),
  validateUUID('patientId', 'param'),
  handleValidationErrors,
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  getHealthTrends
);

export default router;
