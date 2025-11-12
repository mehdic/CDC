/**
 * Pharmacy Routes
 * API endpoints for pharmacy management
 */

import { Router } from 'express';
import * as pharmacyController from '../controllers/pharmacyController';
import { authenticateJWT } from '../../../../shared/middleware/auth';
import { requireRole } from '../../../../shared/middleware/rbac';
import { UserRole } from '../../../../shared/models/User';
import { writeLimiter } from '../index';

const router = Router();

// ============================================================================
// Pharmacy Page Management (for E2E tests)
// ============================================================================
// IMPORTANT: These routes must come BEFORE /:id to avoid route collision

/**
 * GET /api/pharmacy/page
 * Get pharmacy page information
 * Accessible by: PHARMACIST
 */
router.get(
  '/page',
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  pharmacyController.getPharmacyPage
);

// ============================================================================
// Pharmacy CRUD Operations
// ============================================================================

/**
 * GET /api/pharmacy
 * Get all pharmacies (with filters)
 * Accessible by: PHARMACIST, DOCTOR, NURSE, PATIENT (for search)
 */
router.get(
  '/',
  authenticateJWT,
  requireRole([UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT]),
  pharmacyController.getAllPharmacies
);

/**
 * GET /api/pharmacy/:id
 * Get pharmacy by ID
 * Accessible by: PHARMACIST, DOCTOR, NURSE, PATIENT
 */
router.get(
  '/:id',
  authenticateJWT,
  requireRole([UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT]),
  pharmacyController.getPharmacyById
);

/**
 * POST /api/pharmacy
 * Create new pharmacy
 * Accessible by: PHARMACIST (master account creation)
 */
router.post(
  '/',
  writeLimiter,
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  pharmacyController.createPharmacy
);

/**
 * PUT /api/pharmacy/:id
 * Update pharmacy
 * Accessible by: PHARMACIST (own pharmacy only)
 */
router.put(
  '/:id',
  writeLimiter,
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  pharmacyController.updatePharmacy
);

/**
 * DELETE /api/pharmacy/:id
 * Soft delete pharmacy
 * Accessible by: PHARMACIST (master account only)
 */
router.delete(
  '/:id',
  writeLimiter,
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  pharmacyController.deletePharmacy
);

/**
 * POST /api/pharmacy/page/update
 * Update pharmacy information
 * Accessible by: PHARMACIST
 */
router.post(
  '/page/update',
  writeLimiter,
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  pharmacyController.updatePharmacyInfo
);

/**
 * POST /api/pharmacy/photos/upload
 * Upload pharmacy photos
 * Accessible by: PHARMACIST
 */
router.post(
  '/photos/upload',
  writeLimiter,
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  pharmacyController.uploadPharmacyPhotos
);

/**
 * POST /api/pharmacy/page/hours
 * Set operating hours
 * Accessible by: PHARMACIST
 */
router.post(
  '/page/hours',
  writeLimiter,
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  pharmacyController.setOperatingHours
);

/**
 * POST /api/pharmacy/page/delivery-zones
 * Configure delivery zones
 * Accessible by: PHARMACIST
 */
router.post(
  '/page/delivery-zones',
  writeLimiter,
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  pharmacyController.configureDeliveryZones
);

/**
 * POST /api/pharmacy/page/catalog
 * Manage product catalog
 * Accessible by: PHARMACIST
 */
router.post(
  '/page/catalog',
  writeLimiter,
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  pharmacyController.manageProductCatalog
);

/**
 * POST /api/pharmacy/page/publish
 * Publish pharmacy page
 * Accessible by: PHARMACIST
 */
router.post(
  '/page/publish',
  writeLimiter,
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  pharmacyController.publishPharmacyPage
);

/**
 * POST /api/pharmacy/page/unpublish
 * Unpublish pharmacy page
 * Accessible by: PHARMACIST
 */
router.post(
  '/page/unpublish',
  writeLimiter,
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  pharmacyController.unpublishPharmacyPage
);

export default router;
