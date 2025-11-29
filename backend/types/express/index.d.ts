/**
 * Express Type Augmentation
 * Extends Express Request interface with our custom user property
 * This resolves TypeScript conflicts between our AuthenticatedRequest and Express's default Request
 */

import { AuthenticatedUser } from '../../shared/middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
