/**
 * Express Type Augmentation
 * Extends Express Request interface to include AuthenticatedUser
 *
 * This resolves TypeScript errors when using authenticateJWT middleware
 * by merging our custom AuthenticatedUser type with Express's default Request type.
 */

import { AuthenticatedUser } from '../middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// This export is necessary to make this file a module
export {};
