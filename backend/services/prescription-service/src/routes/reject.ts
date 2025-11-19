/**
 * Reject Routes
 * PUT /prescriptions/:id/reject - Reject prescription with mandatory reason
 * T090 - User Story 1: Prescription Processing & Validation
 */

import { Router } from 'express';
import { rejectPrescription } from '../controllers/rejectController';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { RejectPrescriptionDto } from '../dto/RejectPrescriptionDto';
import { PrescriptionIdDto } from '../dto/PrescriptionIdDto';

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
router.put('/:id/reject', validateParams(PrescriptionIdDto), validateBody(RejectPrescriptionDto), rejectPrescription);

export default router;
