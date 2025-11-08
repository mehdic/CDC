/**
 * Transcribe Controller
 * Handles AI-powered prescription transcription using AWS Textract OCR
 * FR-077: OCR with confidence scoring
 * FR-013a: Low-confidence field highlighting
 */

import { Request, Response } from 'express';
import { Prescription, PrescriptionStatus } from '../../../../shared/models/Prescription';
import { PrescriptionItem } from '../../../../shared/models/PrescriptionItem';
import { extractTextFromPrescription } from '../integrations/textract';
import { parseMedications } from '../utils/medicationParser';
import {
  calculatePrescriptionConfidence,
  identifyLowConfidenceFields,
  determinePrescriptionStatus,
  confidenceToPercentage,
} from '../utils/aiConfidence';

// ============================================================================
// Transcribe Prescription Handler
// ============================================================================

/**
 * POST /prescriptions/:id/transcribe
 * Transcribe prescription using AWS Textract and create prescription items
 */
export async function transcribePrescription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const dataSource = req.app.locals.dataSource;
    const prescriptionRepo = dataSource.getRepository(Prescription);
    const itemRepo = dataSource.getRepository(PrescriptionItem);

    // ========================================================================
    // Find Prescription
    // ========================================================================

    const prescription = await prescriptionRepo.findOne({ where: { id } });

    if (!prescription) {
      res.status(404).json({ error: 'Prescription not found' });
      return;
    }

    // ========================================================================
    // Validate Prescription State
    // ========================================================================

    if (!prescription.image_url) {
      res.status(400).json({ error: 'Prescription has no image to transcribe' });
      return;
    }

    if (prescription.status !== PrescriptionStatus.PENDING) {
      res.status(400).json({
        error: 'Prescription already transcribed or in invalid state',
        current_status: prescription.status,
      });
      return;
    }

    // ========================================================================
    // Update Status to Processing
    // ========================================================================

    prescription.status = PrescriptionStatus.IN_REVIEW;
    await prescriptionRepo.save(prescription);

    console.log('[Transcribe Controller] Processing prescription:', id);

    // ========================================================================
    // Extract Text Using AWS Textract
    // ========================================================================

    let textractResult;
    try {
      textractResult = await extractTextFromPrescription(prescription.image_url);
    } catch (textractError: any) {
      console.error('[Transcribe Controller] Textract failed:', textractError.message);

      // Revert status on failure
      prescription.status = PrescriptionStatus.PENDING;
      await prescriptionRepo.save(prescription);

      res.status(500).json({
        error: 'Failed to extract text from prescription',
        message: textractError.message,
      });
      return;
    }

    // ========================================================================
    // Parse Medications from OCR Results
    // ========================================================================

    const medications = parseMedications(textractResult);

    if (medications.length === 0) {
      console.warn('[Transcribe Controller] No medications detected');

      // Mark as needs review
      prescription.status = PrescriptionStatus.PENDING;
      prescription.ai_transcription_data = {
        fullText: textractResult.fullText,
        lines: textractResult.lines.length,
        error: 'No medications detected',
      };
      prescription.ai_confidence_score = 0;
      await prescriptionRepo.save(prescription);

      res.status(200).json({
        id: prescription.id,
        status: prescription.status,
        ai_confidence: 0,
        items: [],
        warning: 'No medications detected in prescription image',
      });
      return;
    }

    // ========================================================================
    // Create Prescription Items
    // ========================================================================

    const items = await Promise.all(
      medications.map(async (med) => {
        const item = itemRepo.create({
          prescription_id: prescription.id,
          medication_name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration !== null ? `${med.duration} days` : null,
          quantity: null, // Will be determined during fulfillment
          medication_confidence: med.name_confidence,
          dosage_confidence: med.dosage_confidence,
          frequency_confidence: med.frequency_confidence,
          // Note: duration_confidence not in schema yet
          pharmacist_corrected: false,
          original_ai_value: null,
        });

        return await itemRepo.save(item);
      })
    );

    console.log('[Transcribe Controller] ✓ Created', items.length, 'prescription items');

    // ========================================================================
    // Calculate Overall Confidence
    // ========================================================================

    const overallConfidence = calculatePrescriptionConfidence(items);
    const status = determinePrescriptionStatus(overallConfidence);

    // ========================================================================
    // Update Prescription with Results
    // ========================================================================

    prescription.ai_transcription_data = {
      fullText: textractResult.fullText,
      lines: textractResult.lines.length,
      medications_detected: medications.length,
      timestamp: new Date().toISOString(),
    };
    prescription.ai_confidence_score = overallConfidence;
    prescription.status = status === 'transcribed' ? PrescriptionStatus.PENDING : PrescriptionStatus.PENDING;
    // Note: Using PENDING for both cases - pharmacist will review regardless

    await prescriptionRepo.save(prescription);

    console.log('[Transcribe Controller] ✓ Prescription transcribed:', {
      id: prescription.id,
      medications: items.length,
      confidence: confidenceToPercentage(overallConfidence) + '%',
      status,
    });

    // ========================================================================
    // Response
    // ========================================================================

    res.status(200).json({
      id: prescription.id,
      status: prescription.status,
      ai_confidence: confidenceToPercentage(overallConfidence),
      items: items.map((item) => ({
        id: item.id,
        medication_name: item.medication_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        confidence_scores: {
          name: confidenceToPercentage(item.medication_confidence || 0),
          dosage: confidenceToPercentage(item.dosage_confidence || 0),
          frequency: confidenceToPercentage(item.frequency_confidence || 0),
        },
        low_confidence_fields: identifyLowConfidenceFields(item), // FR-013a
        requires_review: identifyLowConfidenceFields(item).length > 0,
      })),
      transcription_completed_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Transcribe Controller] Error:', error);

    res.status(500).json({
      error: 'Failed to transcribe prescription',
      message: error.message,
    });
  }
}
