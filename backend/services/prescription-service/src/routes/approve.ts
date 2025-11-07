/**
 * Approve Routes
 * PUT /prescriptions/:id/approve - Approve prescription
 * T088 - User Story 1: Prescription Processing & Validation
 */

import { Router } from 'express';
import { approvePrescription } from '../controllers/approveController';

const router = Router();

/**
 * PUT /prescriptions/:id/approve
 * Approve a prescription after pharmacist validation
 *
 * Request body:
 * {
 *   "pharmacist_id": "uuid",
 *   "digital_signature": "optional_signature",
 *   "notes": "optional_pharmacist_notes"
 * }
 *
 * Response:
 * {
 *   "prescription_id": "uuid",
 *   "status": "approved",
 *   "approved_at": "timestamp",
 *   "approved_by": "pharmacist_id",
 *   "treatment_plan_created": true,
 *   "treatment_plan_id": "uuid"
 * }
 */
router.put('/:id/approve', approvePrescription);

export default router;
