/**
 * Validate Routes
 * POST /prescriptions/:id/validate - Validate prescription safety
 * T084 - User Story 1: Prescription Processing & Validation
 */

import { Router } from 'express';
import { validatePrescription } from '../controllers/validateController';
import { validateParams } from '../middleware/validation.middleware';
import { PrescriptionIdDto } from '../dto/PrescriptionIdDto';

const router = Router();

/**
 * POST /prescriptions/:id/validate
 * Perform comprehensive safety validation:
 * - Drug-drug interactions (FDB MedKnowledge API)
 * - Patient allergy checking
 * - Medical condition contraindications
 *
 * Returns validation results with severity-sorted warnings
 */
router.post('/:id/validate', validateParams(PrescriptionIdDto), validatePrescription);

export default router;
