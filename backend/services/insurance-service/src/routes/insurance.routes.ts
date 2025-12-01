/**
 * Insurance Routes
 * API routes for insurance endpoints
 */

import { Router, Request, Response } from 'express';
import { InsuranceController } from '../controllers/insurance.controller';

const router = Router();

/**
 * Insurance Provider Routes
 */

// List all active insurance providers
router.get('/providers', InsuranceController.listProviders);

// Get specific insurance provider
router.get('/providers/:id', InsuranceController.getProvider);

/**
 * Coverage Verification Routes
 */

// Verify patient insurance coverage
router.post('/verify', InsuranceController.verifyCoverage);

/**
 * Insurance Claim Routes
 */

// Submit a new insurance claim
router.post('/claims', InsuranceController.submitClaim);

// Get claim status
router.get('/claims/:id', InsuranceController.getClaimStatus);

// List patient's claims
router.get('/claims', InsuranceController.listClaims);

/**
 * Statistics Routes
 */

// Get insurance statistics
router.get('/statistics', InsuranceController.getStatistics);

/**
 * Health check
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    service: 'insurance-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
