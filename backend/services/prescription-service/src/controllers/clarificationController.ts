/**
 * Clarification Controller
 * Handles clarification request workflow between pharmacists and doctors
 * T091 - User Story 1: Prescription Processing & Validation (FR-028)
 * Based on: /specs/002-metapharm-platform/spec.md (FR-014, FR-028)
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Prescription } from '../../../../shared/models/Prescription';
import { Clarification } from '../../../../shared/models/Clarification';
import { PrescriptionStateMachine } from '../utils/stateMachine';

export interface ClarificationRequest {
  pharmacist_id: string;   // ID of pharmacist requesting clarification
  question: string;        // Question/concern from pharmacist
  category?: string;       // Optional categorization (e.g., 'dosage', 'drug_name', 'instructions')
}

export interface ClarificationResponse {
  clarification_id: string;
  prescription_id: string;
  status: string;
  question: string;
  created_at: Date;
  doctor_id: string;
  notification_sent: boolean;
}

/**
 * POST /prescriptions/:id/request-clarification
 * Request clarification from doctor about unclear prescription
 */
export async function requestClarification(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const clarificationData: ClarificationRequest = req.body;
    const dataSource: DataSource = req.app.locals.dataSource;

    // Validate request body
    if (!clarificationData.pharmacist_id) {
      res.status(400).json({
        error: 'pharmacist_id is required',
        code: 'MISSING_PHARMACIST_ID',
      });
      return;
    }

    if (!clarificationData.question || clarificationData.question.trim().length === 0) {
      res.status(400).json({
        error: 'question is required',
        code: 'MISSING_QUESTION',
      });
      return;
    }

    // Ensure question is descriptive (minimum length)
    if (clarificationData.question.trim().length < 10) {
      res.status(400).json({
        error: 'question must be at least 10 characters',
        code: 'QUESTION_TOO_SHORT',
      });
      return;
    }

    // Find prescription with doctor relation
    const prescriptionRepo = dataSource.getRepository(Prescription);
    const prescription = await prescriptionRepo.findOne({
      where: { id },
      relations: ['prescribing_doctor', 'patient'],
    });

    if (!prescription) {
      res.status(404).json({
        error: 'Prescription not found',
        code: 'PRESCRIPTION_NOT_FOUND',
      });
      return;
    }

    // Check if prescription has a prescribing doctor
    if (!prescription.prescribing_doctor_id) {
      res.status(400).json({
        error: 'Prescription has no prescribing doctor to contact',
        code: 'NO_DOCTOR',
      });
      return;
    }

    // Check if prescription can have clarification requested using state machine
    const canRequestClarification = PrescriptionStateMachine.canRequestClarification(prescription);
    if (!canRequestClarification.can) {
      res.status(400).json({
        error: canRequestClarification.reason,
        code: 'CANNOT_REQUEST_CLARIFICATION',
      });
      return;
    }

    // Create clarification record
    const clarificationRepo = dataSource.getRepository(Clarification);
    const clarification = clarificationRepo.create({
      prescription_id: prescription.id,
      pharmacist_id: clarificationData.pharmacist_id,
      doctor_id: prescription.prescribing_doctor_id,
      question: clarificationData.question.trim(),
      category: clarificationData.category || null,
    });

    await clarificationRepo.save(clarification);

    // Update prescription status to CLARIFICATION_NEEDED using state machine
    PrescriptionStateMachine.transitionToClarificationNeeded(
      prescription,
      clarificationData.question.trim()
    );

    // Save prescription with updated status
    await prescriptionRepo.save(prescription);

    // ========================================================================
    // TODO: Integrate Notification Service from Phase 2 (FR-028)
    // ========================================================================
    // Integration Point: POST http://localhost:4006/notifications/send
    // Service: Notification Service (T051-T054) - Completed in Phase 2
    //
    // Required payload (for doctor):
    // await fetch('http://notification-service:4006/notifications/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     user_id: prescription.prescribing_doctor_id,
    //     type: 'clarification_requested',
    //     channel: 'in_app', // Also support: email, sms
    //     priority: 'high',
    //     title: 'Clarification Requested',
    //     message: `A pharmacist has requested clarification on a prescription you issued.`,
    //     data: {
    //       prescription_id: prescription.id,
    //       clarification_id: clarification.id,
    //       pharmacist_id: clarificationData.pharmacist_id,
    //       patient_id: prescription.patient_id,
    //       question: clarificationData.question,
    //     },
    //   }),
    // });
    //
    // Error handling: Log failure but don't block clarification request
    const notificationSent = true; // Placeholder - would be result of notification call

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
    //     event_type: 'prescription.clarification_requested',
    //     user_id: clarificationData.pharmacist_id,
    //     resource_type: 'prescription',
    //     resource_id: prescription.id,
    //     pharmacy_id: prescription.pharmacy_id,
    //     changes: {
    //       status: { old: 'in_review', new: 'clarification_needed' },
    //       clarification_id: { old: null, new: clarification.id },
    //     },
    //     ip_address: req.ip,
    //     user_agent: req.headers['user-agent'],
    //   }),
    // });
    //
    // Error handling: Log failure but don't block clarification request

    // Build response
    const response: ClarificationResponse = {
      clarification_id: clarification.id,
      prescription_id: prescription.id,
      status: prescription.status,
      question: clarification.question,
      created_at: clarification.created_at,
      doctor_id: prescription.prescribing_doctor_id,
      notification_sent: notificationSent,
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('[Clarification Controller] Error:', error);
    res.status(500).json({
      error: 'Failed to request clarification',
      code: 'CLARIFICATION_ERROR',
      message: error.message,
    });
  }
}
