/**
 * Transcription Routes
 * POST /prescriptions/:id/transcribe - Transcribe prescription using AWS Textract OCR
 * FR-077: AI-powered prescription transcription with confidence scoring
 */

import { Router } from 'express';
import { transcribePrescription } from '../controllers/transcribeController';
import { validateParams } from '../middleware/validation.middleware';
import { PrescriptionIdDto } from '../dto/PrescriptionIdDto';

const router = Router();

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /prescriptions/:id/transcribe
 * Trigger AI transcription of uploaded prescription image
 *
 * Params:
 * - id: Prescription UUID
 *
 * Response:
 * - Transcribed prescription with medications and confidence scores
 */
router.post('/:id/transcribe', validateParams(PrescriptionIdDto), transcribePrescription);

export default router;
