/**
 * GDPR Routes
 * API endpoints for GDPR data export
 */

import { Router } from 'express';
import { GDPRController } from '../controllers/gdpr.controller';

let controller: GDPRController;

export function initializeRoutes(gdprController: GDPRController) {
  controller = gdprController;
}

const router = Router();

/**
 * POST /gdpr/export
 * Request GDPR data export
 * Authentication required (patient role only)
 * Rate limited: 1 request per 24 hours
 *
 * Body: { format: 'json' | 'pdf' }
 * Returns: Export data (JSON) or PDF stream
 */
router.post('/export', (req, res) => controller.requestExport(req, res));

/**
 * GET /gdpr/export/status
 * Check if user can request an export (rate limit status)
 * Authentication required
 *
 * Returns: { canExport: boolean, message: string }
 */
router.get('/export/status', (req, res) => controller.checkExportStatus(req, res));

export default router;
