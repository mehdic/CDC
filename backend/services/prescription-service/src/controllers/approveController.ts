/**
 * Approve Controller
 * Handles pharmacist approval workflow with treatment plan generation
 * T089 - User Story 1: Prescription Processing & Validation (FR-028)
 * Based on: /specs/002-metapharm-platform/spec.md (FR-014, FR-017, FR-018)
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Prescription } from '../../../../shared/models/Prescription';
import { TreatmentPlan } from '../../../../shared/models/TreatmentPlan';
import { FieldCorrection } from '../../../../shared/models/FieldCorrection';
import { PrescriptionStateMachine } from '../utils/stateMachine';
import { generateTreatmentPlan } from '../utils/treatmentPlan';

export interface FieldCorrectionInput {
  item_id: string;          // Prescription item ID
  field_name: string;       // Field name (medication_name, dosage, frequency)
  original_value: string;   // AI-extracted value
  corrected_value: string;  // Pharmacist-verified/corrected value
  original_confidence: number; // AI confidence score
  was_corrected: boolean;   // true if value changed, false if just verified
  notes?: string;           // Optional pharmacist notes
}

export interface ApprovalRequest {
  pharmacist_id: string;   // ID of pharmacist approving
  digital_signature?: string; // Optional digital signature (FR-028)
  notes?: string;           // Optional pharmacist notes
  field_corrections?: FieldCorrectionInput[]; // Low-confidence field verifications
  low_confidence_verified?: boolean; // Flag indicating all low-confidence fields were reviewed
}

export interface ApprovalResponse {
  prescription_id: string;
  status: string;
  approved_at: Date;
  approved_by: string;
  treatment_plan_created: boolean;
  treatment_plan_id?: string;
}

/**
 * PUT /prescriptions/:id/approve
 * Approve a prescription after pharmacist validation
 */
export async function approvePrescription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const approvalData: ApprovalRequest = req.body;
    const dataSource: DataSource = req.app.locals.dataSource;

    // Validate request body
    if (!approvalData.pharmacist_id) {
      res.status(400).json({
        error: 'pharmacist_id is required',
        code: 'MISSING_PHARMACIST_ID',
      });
      return;
    }

    // Find prescription with items
    const prescriptionRepo = dataSource.getRepository(Prescription);
    const prescription = await prescriptionRepo.findOne({
      where: { id },
      relations: ['items', 'patient'],
    });

    if (!prescription) {
      res.status(404).json({
        error: 'Prescription not found',
        code: 'PRESCRIPTION_NOT_FOUND',
      });
      return;
    }

    // Check if prescription can be approved using state machine
    const canApproveResult = PrescriptionStateMachine.canApprove(prescription);
    if (!canApproveResult.canApprove) {
      res.status(400).json({
        error: canApproveResult.reason,
        code: 'CANNOT_APPROVE',
      });
      return;
    }

    // Check if prescription has items
    if (!prescription.items || prescription.items.length === 0) {
      res.status(400).json({
        error: 'Prescription has no items',
        code: 'NO_ITEMS',
      });
      return;
    }

    // ========================================================================
    // GROUP_API_3: Low-Confidence Field Verification
    // ========================================================================
    // Check if any prescription items have low-confidence fields (< 80%)
    const lowConfidenceItems = prescription.items.filter(item => item.hasAnyLowConfidence());

    if (lowConfidenceItems.length > 0) {
      // If there are low-confidence fields, pharmacist MUST verify them
      if (!approvalData.low_confidence_verified) {
        // Collect all low-confidence fields for error response
        const lowConfidenceDetails = lowConfidenceItems.map(item => ({
          item_id: item.id,
          medication_name: item.medication_name,
          low_confidence_fields: item.getLowConfidenceFields(),
          confidence_scores: {
            medication: item.medication_confidence,
            dosage: item.dosage_confidence,
            frequency: item.frequency_confidence,
          },
        }));

        res.status(400).json({
          error: 'Prescription has low-confidence fields requiring manual verification',
          code: 'LOW_CONFIDENCE_VERIFICATION_REQUIRED',
          details: {
            items_requiring_verification: lowConfidenceItems.length,
            low_confidence_fields: lowConfidenceDetails,
          },
        });
        return;
      }

      // If verified flag is set, validate that corrections were provided
      if (!approvalData.field_corrections || approvalData.field_corrections.length === 0) {
        res.status(400).json({
          error: 'Field corrections must be provided for low-confidence fields',
          code: 'FIELD_CORRECTIONS_REQUIRED',
          details: {
            items_requiring_verification: lowConfidenceItems.length,
          },
        });
        return;
      }

      // Validate that all low-confidence fields have corrections
      const correctedItemIds = new Set(approvalData.field_corrections.map(c => c.item_id));
      const uncorrectedItems = lowConfidenceItems.filter(item => !correctedItemIds.has(item.id));

      if (uncorrectedItems.length > 0) {
        res.status(400).json({
          error: 'Not all low-confidence items have been verified',
          code: 'INCOMPLETE_VERIFICATION',
          details: {
            uncorrected_items: uncorrectedItems.map(item => ({
              item_id: item.id,
              medication_name: item.medication_name,
              low_confidence_fields: item.getLowConfidenceFields(),
            })),
          },
        });
        return;
      }
    }

    // Check for critical safety issues
    const hasCriticalIssues = prescription.hasSafetyWarnings();
    if (hasCriticalIssues) {
      // Check for life-threatening issues that should block approval
      const allergyWarnings = prescription.allergy_warnings || [];
      const contraindications = prescription.contraindications || [];
      const drugInteractions = prescription.drug_interactions || [];

      const hasLifeThreatening = allergyWarnings.some(
        (w: any) => w.severity === 'life_threatening'
      );
      const hasAbsoluteContraindications = contraindications.some(
        (c: any) => c.severity === 'absolute'
      );
      const hasContraindicatedInteractions = drugInteractions.some(
        (i: any) => i.severity === 'contraindicated'
      );

      if (hasLifeThreatening || hasAbsoluteContraindications || hasContraindicatedInteractions) {
        res.status(400).json({
          error: 'Prescription has critical safety issues that block approval',
          code: 'CRITICAL_SAFETY_ISSUES',
          details: {
            life_threatening_allergies: hasLifeThreatening,
            absolute_contraindications: hasAbsoluteContraindications,
            contraindicated_interactions: hasContraindicatedInteractions,
          },
        });
        return;
      }
    }

    // Transition to approved state using state machine
    PrescriptionStateMachine.transitionToApproved(prescription, approvalData.pharmacist_id);

    // Save prescription with approval data
    await prescriptionRepo.save(prescription);

    // ========================================================================
    // GROUP_API_3: Save Field Corrections to Audit Trail
    // ========================================================================
    if (approvalData.field_corrections && approvalData.field_corrections.length > 0) {
      const fieldCorrectionRepo = dataSource.getRepository(FieldCorrection);

      // Create field correction records for audit trail
      const fieldCorrections = approvalData.field_corrections.map(correction => {
        const fieldCorrection = new FieldCorrection();
        fieldCorrection.prescription_id = prescription.id;
        fieldCorrection.prescription_item_id = correction.item_id;
        fieldCorrection.pharmacist_id = approvalData.pharmacist_id;
        fieldCorrection.field_name = correction.field_name;
        fieldCorrection.original_value = correction.original_value;
        fieldCorrection.corrected_value = correction.corrected_value;
        fieldCorrection.original_confidence = correction.original_confidence;
        fieldCorrection.was_corrected = correction.was_corrected;
        fieldCorrection.correction_notes = correction.notes || null;
        fieldCorrection.correction_type = correction.was_corrected ? 'correction' : 'verification';

        return fieldCorrection;
      });

      // Save all corrections in batch
      await fieldCorrectionRepo.save(fieldCorrections);

      // Update prescription items with corrected values
      const itemRepo = dataSource.getRepository('PrescriptionItem');
      for (const correction of approvalData.field_corrections) {
        const item = prescription.items.find(i => i.id === correction.item_id);
        if (item && correction.was_corrected) {
          // Update the item field with corrected value
          if (correction.field_name === 'medication_name') {
            item.medication_name = correction.corrected_value;
          } else if (correction.field_name === 'dosage') {
            item.dosage = correction.corrected_value;
          } else if (correction.field_name === 'frequency') {
            item.frequency = correction.corrected_value;
          }

          // Mark as corrected and store original value
          item.markAsCorrected({
            [correction.field_name]: correction.original_value,
            confidence: correction.original_confidence,
          });

          await itemRepo.save(item);
        }
      }
    }

    // Generate treatment plan (FR-017)
    let treatmentPlan: TreatmentPlan | null = null;
    try {
      treatmentPlan = await generateTreatmentPlan(prescription, dataSource);
    } catch (error) {
      console.error('[Approve Controller] Failed to generate treatment plan:', error);
      // Don't fail the approval if treatment plan generation fails
      // Pharmacist can create manually if needed
    }

    // ========================================================================
    // TODO: Integrate Audit Service from Phase 2 (FR-018)
    // ========================================================================
    // Integration Point: POST http://localhost:4003/audit/events
    // Service: Audit Service (T043-T045) - Completed in Phase 2
    //
    // Required payload:
    // await fetch('http://audit-service:4003/audit/events', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${JWT_TOKEN}`, // Pass through from request
    //   },
    //   body: JSON.stringify({
    //     event_type: 'prescription.approved',
    //     user_id: approvalData.pharmacist_id,
    //     resource_type: 'prescription',
    //     resource_id: prescription.id,
    //     pharmacy_id: prescription.pharmacy_id,
    //     changes: {
    //       status: { old: 'in_review', new: 'approved' },
    //       approved_by_pharmacist_id: { old: null, new: approvalData.pharmacist_id },
    //       approved_at: { old: null, new: new Date().toISOString() },
    //     },
    //     ip_address: req.ip,
    //     user_agent: req.headers['user-agent'],
    //   }),
    // });
    //
    // Error handling: Log failure but don't block approval (audit is supplementary)

    // ========================================================================
    // TODO: Integrate Notification Service from Phase 2 (FR-028)
    // ========================================================================
    // Integration Point: POST http://localhost:4006/notifications/send
    // Service: Notification Service (T051-T054) - Completed in Phase 2
    //
    // Required payload (for patient):
    // await fetch('http://notification-service:4006/notifications/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     user_id: prescription.patient_id,
    //     type: 'prescription_approved',
    //     channel: 'in_app', // Also support: email, sms, push
    //     priority: 'high',
    //     title: 'Prescription Approved',
    //     message: `Your prescription has been approved and is ready for pickup.`,
    //     data: {
    //       prescription_id: prescription.id,
    //       pharmacy_id: prescription.pharmacy_id,
    //       treatment_plan_id: treatmentPlan?.id,
    //     },
    //   }),
    // });
    //
    // Required payload (for doctor):
    // Same as above, but with doctor_id and appropriate message
    //
    // Error handling: Log failure but don't block approval

    // Build response
    const response: ApprovalResponse = {
      prescription_id: prescription.id,
      status: prescription.status,
      approved_at: prescription.approved_at!,
      approved_by: approvalData.pharmacist_id,
      treatment_plan_created: !!treatmentPlan,
      treatment_plan_id: treatmentPlan?.id,
    };

    res.json(response);
  } catch (error: any) {
    console.error('[Approve Controller] Error:', error);
    res.status(500).json({
      error: 'Failed to approve prescription',
      code: 'APPROVAL_ERROR',
      message: error.message,
    });
  }
}
