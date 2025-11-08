/**
 * Reject Routes
 * PUT /prescriptions/:id/reject - Reject prescription with mandatory reason
 * T090 - User Story 1: Prescription Processing & Validation
 */

import { Router } from 'express';
import { rejectPrescription } from '../controllers/rejectController';

const router = Router();

/**
 * PUT /prescriptions/:id/reject
 * Reject a prescription with mandatory reason (FR-029)
 *
 * Request body:
 * {
 *   "pharmacist_id": "uuid",
 *   "reason": "mandatory_rejection_reason",
 *   "category": "invalid|safety_concern|expired|unclear|other",
 *   "notify_patient": true,
 *   "notify_doctor": true
 * }
 *
 * Response:
 * {
 *   "prescription_id": "uuid",
 *   "status": "rejected",
 *   "rejection_reason": "reason_text",
 *   "rejected_at": "timestamp",
 *   "rejected_by": "pharmacist_id",
 *   "notifications_sent": {
 *     "patient": true,
 *     "doctor": true
 *   }
 * }
 */
router.put('/:id/reject', rejectPrescription);

export default router;
