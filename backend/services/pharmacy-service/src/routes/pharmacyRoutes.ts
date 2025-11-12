/**
 * Pharmacy Routes
 * API endpoints for pharmacy management
 */

import { Router } from 'express';
import * as pharmacyController from '../controllers/pharmacyController';

const router = Router();

// ============================================================================
// Pharmacy CRUD Operations
// ============================================================================

/**
 * GET /api/pharmacy/:id
 * Get pharmacy by ID
 */
router.get('/:id', pharmacyController.getPharmacyById);

/**
 * GET /api/pharmacy
 * Get all pharmacies (with filters)
 */
router.get('/', pharmacyController.getAllPharmacies);

/**
 * POST /api/pharmacy
 * Create new pharmacy
 */
router.post('/', pharmacyController.createPharmacy);

/**
 * PUT /api/pharmacy/:id
 * Update pharmacy
 */
router.put('/:id', pharmacyController.updatePharmacy);

/**
 * DELETE /api/pharmacy/:id
 * Soft delete pharmacy
 */
router.delete('/:id', pharmacyController.deletePharmacy);

// ============================================================================
// Pharmacy Page Management (for E2E tests)
// ============================================================================

/**
 * GET /api/pharmacy/page
 * Get pharmacy page information
 */
router.get('/page', pharmacyController.getPharmacyPage);

/**
 * POST /api/pharmacy/page/update
 * Update pharmacy information
 */
router.post('/page/update', pharmacyController.updatePharmacyInfo);

/**
 * POST /api/pharmacy/photos/upload
 * Upload pharmacy photos
 */
router.post('/photos/upload', pharmacyController.uploadPharmacyPhotos);

/**
 * POST /api/pharmacy/page/hours
 * Set operating hours
 */
router.post('/page/hours', pharmacyController.setOperatingHours);

/**
 * POST /api/pharmacy/page/delivery-zones
 * Configure delivery zones
 */
router.post('/page/delivery-zones', pharmacyController.configureDeliveryZones);

/**
 * POST /api/pharmacy/page/catalog
 * Manage product catalog
 */
router.post('/page/catalog', pharmacyController.manageProductCatalog);

/**
 * POST /api/pharmacy/page/publish
 * Publish pharmacy page
 */
router.post('/page/publish', pharmacyController.publishPharmacyPage);

/**
 * POST /api/pharmacy/page/unpublish
 * Unpublish pharmacy page
 */
router.post('/page/unpublish', pharmacyController.unpublishPharmacyPage);

export default router;
