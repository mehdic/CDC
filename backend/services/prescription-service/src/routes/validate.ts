/**
 * Validate Routes
 * POST /prescriptions/:id/validate - Validate prescription safety
 * T084 - User Story 1: Prescription Processing & Validation
 */

import { Router } from 'express';
import { validatePrescription } from '../controllers/validateController';

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
router.post('/:id/validate', validatePrescription);

export default router;
