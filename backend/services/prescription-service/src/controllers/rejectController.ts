/**
 * Reject Controller
 * Handles pharmacist rejection workflow with mandatory reason
 * T090 - User Story 1: Prescription Processing & Validation (FR-029)
 * Based on: /specs/002-metapharm-platform/spec.md (FR-014, FR-029)
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Prescription } from '../../../../shared/models/Prescription';
import { PrescriptionStateMachine } from '../utils/stateMachine';

export interface RejectionRequest {
  pharmacist_id: string;   // ID of pharmacist rejecting
  reason: string;          // MANDATORY reason for rejection (FR-029)
  category?: 'invalid' | 'safety_concern' | 'expired' | 'unclear' | 'other'; // Optional categorization
  notify_patient?: boolean; // Send notification to patient (default: true)
  notify_doctor?: boolean;  // Send notification to doctor (default: true)
}

export interface RejectionResponse {
  prescription_id: string;
  status: string;
  rejection_reason: string;
  rejected_at: Date;
  rejected_by: string;
  notifications_sent: {
    patient: boolean;
    doctor: boolean;
  };
}

/**
 * PUT /prescriptions/:id/reject
 * Reject a prescription with mandatory reason
 */
export async function rejectPrescription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const rejectionData: RejectionRequest = req.body;
    const dataSource: DataSource = req.app.locals.dataSource;

    // Validate request body
    if (!rejectionData.pharmacist_id) {
      res.status(400).json({
        error: 'pharmacist_id is required',
        code: 'MISSING_PHARMACIST_ID',
      });
      return;
    }

    if (!rejectionData.reason || rejectionData.reason.trim().length === 0) {
      res.status(400).json({
        error: 'Rejection reason is mandatory (FR-029)',
        code: 'MISSING_REJECTION_REASON',
      });
      return;
    }

    // Ensure reason is descriptive (minimum length)
    if (rejectionData.reason.trim().length < 10) {
      res.status(400).json({
        error: 'Rejection reason must be at least 10 characters',
        code: 'REASON_TOO_SHORT',
      });
      return;
    }

    // Find prescription
    const prescriptionRepo = dataSource.getRepository(Prescription);
    const prescription = await prescriptionRepo.findOne({
      where: { id },
      relations: ['patient', 'prescribing_doctor'],
    });

    if (!prescription) {
      res.status(404).json({
        error: 'Prescription not found',
        code: 'PRESCRIPTION_NOT_FOUND',
      });
      return;
    }

    // Check if prescription can be rejected using state machine
    const canRejectResult = PrescriptionStateMachine.canReject(prescription);
    if (!canRejectResult.canReject) {
      res.status(400).json({
        error: canRejectResult.reason,
        code: 'CANNOT_REJECT',
      });
      return;
    }

    // Transition to rejected state using state machine
    PrescriptionStateMachine.transitionToRejected(prescription, rejectionData.reason);

    // Save prescription with rejection data
    await prescriptionRepo.save(prescription);

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
    //     event_type: 'prescription.rejected',
    //     user_id: rejectionData.pharmacist_id,
    //     resource_type: 'prescription',
    //     resource_id: prescription.id,
    //     pharmacy_id: prescription.pharmacy_id,
    //     changes: {
    //       status: { old: 'in_review', new: 'rejected' },
    //       rejection_reason: { old: null, new: rejectionData.reason },
    //     },
    //     ip_address: req.ip,
    //     user_agent: req.headers['user-agent'],
    //   }),
    // });
    //
    // Error handling: Log failure but don't block rejection (audit is supplementary)

    // ========================================================================
    // TODO: Integrate Notification Service from Phase 2 (FR-029)
    // ========================================================================
    // Integration Point: POST http://localhost:4006/notifications/send
    // Service: Notification Service (T051-T054) - Completed in Phase 2

    // Send notifications (FR-029)
    const notifyPatient = rejectionData.notify_patient !== false; // Default: true
    const notifyDoctor = rejectionData.notify_doctor !== false;   // Default: true

    let patientNotified = false;
    let doctorNotified = false;

    if (notifyPatient) {
      try {
        // TODO: Implement actual notification call
        // await fetch('http://notification-service:4006/notifications/send', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     user_id: prescription.patient_id,
        //     type: 'prescription_rejected',
        //     channel: 'in_app', // Also support: email, sms
        //     priority: 'high',
        //     title: 'Prescription Rejected',
        //     message: `Your prescription has been rejected. Reason: ${rejectionData.reason}`,
        //     data: {
        //       prescription_id: prescription.id,
        //       rejection_reason: rejectionData.reason,
        //       pharmacy_id: prescription.pharmacy_id,
        //     },
        //   }),
        // });
        patientNotified = true;
      } catch (error) {
        console.error('[Reject Controller] Failed to notify patient:', error);
      }
    }

    if (notifyDoctor && prescription.prescribing_doctor_id) {
      try {
        // TODO: Implement actual notification call
        // await fetch('http://notification-service:4006/notifications/send', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     user_id: prescription.prescribing_doctor_id,
        //     type: 'prescription_rejected',
        //     channel: 'in_app', // Also support: email
        //     priority: 'high',
        //     title: 'Prescription Rejected by Pharmacy',
        //     message: `A prescription you issued has been rejected. Reason: ${rejectionData.reason}`,
        //     data: {
        //       prescription_id: prescription.id,
        //       rejection_reason: rejectionData.reason,
        //       pharmacy_id: prescription.pharmacy_id,
        //       patient_id: prescription.patient_id,
        //     },
        //   }),
        // });
        doctorNotified = true;
      } catch (error) {
        console.error('[Reject Controller] Failed to notify doctor:', error);
      }
    }

    // Build response
    const response: RejectionResponse = {
      prescription_id: prescription.id,
      status: prescription.status,
      rejection_reason: prescription.rejection_reason!,
      rejected_at: new Date(),
      rejected_by: rejectionData.pharmacist_id,
      notifications_sent: {
        patient: patientNotified,
        doctor: doctorNotified,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('[Reject Controller] Error:', error);
    res.status(500).json({
      error: 'Failed to reject prescription',
      code: 'REJECTION_ERROR',
      message: error.message,
    });
  }
}
