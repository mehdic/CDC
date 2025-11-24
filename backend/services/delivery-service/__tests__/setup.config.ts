/**
 * Test Setup
 * Mocks authentication middleware for integration testing
 */

import { Request, Response, NextFunction } from 'express';

// Mock authentication middleware
jest.mock('../../../shared/middleware/auth', () => ({
  authenticateJWT: (req: Request, res: Response, next: NextFunction) => {
    // In test mode, attach a mock user to all authenticated requests
    (req as any).user = {
      userId: 'test-user-001',
      email: 'test@example.com',
      role: 'patient',
      pharmacyId: null,
      tokenPayload: {
        userId: 'test-user-001',
        email: 'test@example.com',
        role: 'patient',
        pharmacyId: null,
      },
    };
    next();
  },
}));
