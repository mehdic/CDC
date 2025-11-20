/**
 * Clarification Routes
 * POST /prescriptions/:id/request-clarification - Request clarification from doctor
 * T091 - User Story 1: Prescription Processing & Validation
 */

import { Router } from 'express';
import { requestClarification } from '../controllers/clarificationController';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { ClarificationRequestDto } from '../dto/ClarificationRequestDto';
import { PrescriptionIdDto } from '../dto/PrescriptionIdDto';

const router = Router();

/**
 * POST /prescriptions/:id/request-clarification
 * Request clarification from doctor about unclear prescription
 *
 * Request body:
 * {
 *   "pharmacist_id": "uuid",
 *   "question": "What is the correct dosage for this medication?",
 *   "category": "dosage" // optional: dosage, drug_name, instructions, interaction
 * }
 *
 * Response:
 * {
 *   "clarification_id": "uuid",
 *   "prescription_id": "uuid",
 *   "status": "clarification_needed",
 *   "question": "What is the correct dosage for this medication?",
 *   "created_at": "timestamp",
 *   "doctor_id": "uuid",
 *   "notification_sent": true
 * }
 */
router.post(
  '/:id/request-clarification',
  validateParams(PrescriptionIdDto),
  validateBody(ClarificationRequestDto),
  requestClarification
);

export default router;
