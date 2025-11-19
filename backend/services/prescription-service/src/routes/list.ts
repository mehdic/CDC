/**
 * List Routes
 * GET /prescriptions - List prescriptions with filtering and pagination
 * T092 - User Story 1: Prescription Processing & Validation
 */

import { Router } from 'express';
import { listPrescriptions } from '../controllers/listController';
import { validateQuery } from '../middleware/validation.middleware';
import { ListPrescriptionsDto } from '../dto/ListPrescriptionsDto';

const router = Router();

/**
 * GET /prescriptions
 * List prescriptions with filtering and pagination
 *
 * Query parameters:
 * - status: Filter by status (single or comma-separated list)
 *   Example: ?status=pending or ?status=pending,in_review
 * - patient_id: Filter by patient UUID
 * - pharmacy_id: Filter by pharmacy UUID
 * - pharmacist_id: Filter by pharmacist UUID
 * - prescribing_doctor_id: Filter by doctor UUID
 * - has_safety_warnings: Filter by presence of safety warnings (true/false)
 * - has_low_confidence: Filter by low AI confidence (true/false)
 * - date_from: Filter by created date (ISO format)
 * - date_to: Filter by created date (ISO format)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sort_by: Sort field (created_at, updated_at, approved_at)
 * - sort_order: Sort order (asc, desc)
 *
 * Example:
 * GET /prescriptions?status=pending,in_review&pharmacy_id=123&page=1&limit=20&sort_by=created_at&sort_order=desc
 *
 * Response:
 * {
 *   "prescriptions": [...],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total_items": 150,
 *     "total_pages": 8,
 *     "has_next_page": true,
 *     "has_prev_page": false
 *   },
 *   "filters_applied": {...}
 * }
 */
router.get('/', validateQuery(ListPrescriptionsDto), listPrescriptions);

export default router;
