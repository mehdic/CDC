/**
 * Enhanced Audit Service
 * Comprehensive audit logging for HIPAA compliance
 * Task T3-024: Implement audit logging service
 *
 * This service provides typed audit logging functions for all critical operations:
 * - Prescription approvals/rejections
 * - Drug interaction overrides
 * - Patient data access
 * - Teleconsultation sessions
 * - Authentication events
 *
 * All audit logs are immutable (append-only) and stored in the audit_trail_entries table.
 */

import { DataSource } from 'typeorm';
import { Request } from 'express';
import { logAuditEvent, logAuditEventFromRequest, createChangesObject } from '../utils/audit';
import { AuditAction } from '../models/AuditTrailEntry';

/**
 * Comprehensive audit event types for MetaPharm Connect
 * Based on HIPAA requirements and Swiss healthcare regulations
 */
export enum AuditEventType {
  // ==================== Prescription Events ====================
  PRESCRIPTION_CREATED = 'prescription.created',
  PRESCRIPTION_APPROVED = 'prescription.approved',
  PRESCRIPTION_REJECTED = 'prescription.rejected',
  PRESCRIPTION_DISPENSED = 'prescription.dispensed',
  PRESCRIPTION_CANCELLED = 'prescription.cancelled',
  PRESCRIPTION_VIEWED = 'prescription.viewed',
  PRESCRIPTION_UPDATED = 'prescription.updated',

  // ==================== Drug Interaction Events ====================
  DRUG_INTERACTION_CHECKED = 'drug_interaction.checked',
  DRUG_INTERACTION_OVERRIDE = 'drug_interaction.override',
  DRUG_INTERACTION_WARNING = 'drug_interaction.warning',

  // ==================== Patient Data Events ====================
  PATIENT_RECORD_ACCESSED = 'patient_record.accessed',
  PATIENT_RECORD_CREATED = 'patient_record.created',
  PATIENT_RECORD_UPDATED = 'patient_record.updated',
  PATIENT_RECORD_EXPORTED = 'patient_record.exported',
  MEDICAL_HISTORY_ACCESSED = 'medical_history.accessed',
  MEDICAL_HISTORY_UPDATED = 'medical_history.updated',
  ALLERGY_RECORD_CREATED = 'allergy_record.created',
  ALLERGY_RECORD_UPDATED = 'allergy_record.updated',

  // ==================== Teleconsultation Events ====================
  TELECONSULTATION_SCHEDULED = 'teleconsultation.scheduled',
  TELECONSULTATION_STARTED = 'teleconsultation.started',
  TELECONSULTATION_ENDED = 'teleconsultation.ended',
  TELECONSULTATION_CANCELLED = 'teleconsultation.cancelled',
  TELECONSULTATION_NO_SHOW = 'teleconsultation.no_show',
  CONSULTATION_NOTE_CREATED = 'consultation_note.created',
  CONSULTATION_NOTE_UPDATED = 'consultation_note.updated',

  // ==================== Authentication Events ====================
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_LOGIN_FAILED = 'user.login_failed',
  MFA_ENABLED = 'user.mfa_enabled',
  MFA_DISABLED = 'user.mfa_disabled',
  MFA_VERIFIED = 'user.mfa_verified',
  PASSWORD_CHANGED = 'user.password_changed',
  PASSWORD_RESET = 'user.password_reset',

  // ==================== Delivery Events ====================
  DELIVERY_CREATED = 'delivery.created',
  DELIVERY_ASSIGNED = 'delivery.assigned',
  DELIVERY_STARTED = 'delivery.started',
  DELIVERY_COMPLETED = 'delivery.completed',
  DELIVERY_CANCELLED = 'delivery.cancelled',

  // ==================== Inventory Events ====================
  INVENTORY_UPDATED = 'inventory.updated',
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  INVENTORY_RESTOCKED = 'inventory.restocked',
  INVENTORY_EXPIRED = 'inventory.expired',
}

/**
 * Resource types for audit logging
 */
export enum AuditResourceType {
  PRESCRIPTION = 'prescription',
  PRESCRIPTION_ITEM = 'prescription_item',
  PATIENT_RECORD = 'patient_medical_record',
  PATIENT_PROFILE = 'patient_profile',
  MEDICAL_HISTORY = 'medical_history',
  ALLERGY_RECORD = 'allergy_record',
  TELECONSULTATION = 'teleconsultation',
  CONSULTATION_NOTE = 'consultation_note',
  DELIVERY = 'delivery',
  INVENTORY_ITEM = 'inventory_item',
  USER = 'user',
  DRUG_INTERACTION = 'drug_interaction',
}

/**
 * Enhanced Audit Service
 * Provides typed, domain-specific audit logging functions
 */
export class AuditService {
  constructor(private dataSource: DataSource) {}

  // ==================== Prescription Audit Logging ====================

  /**
   * Log prescription approval
   */
  async logPrescriptionApproval(
    req: Request,
    prescriptionId: string,
    userId: string,
    pharmacyId: string,
    oldStatus: string
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId,
      eventType: AuditEventType.PRESCRIPTION_APPROVED,
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.PRESCRIPTION,
      resourceId: prescriptionId,
      changes: {
        status: { old: oldStatus, new: 'approved' },
        approved_at: { old: null, new: new Date().toISOString() },
      },
    });
  }

  /**
   * Log prescription rejection
   */
  async logPrescriptionRejection(
    req: Request,
    prescriptionId: string,
    userId: string,
    pharmacyId: string,
    oldStatus: string,
    rejectionReason: string
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId,
      eventType: AuditEventType.PRESCRIPTION_REJECTED,
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.PRESCRIPTION,
      resourceId: prescriptionId,
      changes: {
        status: { old: oldStatus, new: 'rejected' },
        rejection_reason: { old: null, new: rejectionReason },
        rejected_at: { old: null, new: new Date().toISOString() },
      },
    });
  }

  /**
   * Log prescription dispensing
   */
  async logPrescriptionDispensed(
    req: Request,
    prescriptionId: string,
    userId: string,
    pharmacyId: string
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId,
      eventType: AuditEventType.PRESCRIPTION_DISPENSED,
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.PRESCRIPTION,
      resourceId: prescriptionId,
      changes: {
        status: { old: 'approved', new: 'dispensed' },
        dispensed_at: { old: null, new: new Date().toISOString() },
      },
    });
  }

  // ==================== Drug Interaction Audit Logging ====================

  /**
   * Log drug interaction check
   */
  async logDrugInteractionCheck(
    req: Request,
    prescriptionId: string,
    userId: string,
    pharmacyId: string,
    drugIds: string[],
    interactions: any[]
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId,
      eventType: AuditEventType.DRUG_INTERACTION_CHECKED,
      action: AuditAction.READ,
      resourceType: AuditResourceType.PRESCRIPTION,
      resourceId: prescriptionId,
      changes: {
        drugs_checked: { old: null, new: drugIds },
        interactions_found: { old: null, new: interactions.length },
      },
    });
  }

  /**
   * Log drug interaction override (CRITICAL - requires justification)
   */
  async logDrugInteractionOverride(
    req: Request,
    prescriptionId: string,
    userId: string,
    pharmacyId: string,
    interactionId: string,
    justification: string
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId,
      eventType: AuditEventType.DRUG_INTERACTION_OVERRIDE,
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.DRUG_INTERACTION,
      resourceId: interactionId,
      changes: {
        override_status: { old: null, new: 'overridden' },
        justification: { old: null, new: justification },
        overridden_at: { old: null, new: new Date().toISOString() },
        overridden_by: { old: null, new: userId },
      },
    });
  }

  // ==================== Patient Data Audit Logging ====================

  /**
   * Log patient record access (HIPAA requirement)
   */
  async logPatientRecordAccess(
    req: Request,
    patientId: string,
    userId: string,
    pharmacyId: string,
    accessReason?: string
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId,
      eventType: AuditEventType.PATIENT_RECORD_ACCESSED,
      action: AuditAction.READ,
      resourceType: AuditResourceType.PATIENT_RECORD,
      resourceId: patientId,
      changes: accessReason ? { access_reason: { old: null, new: accessReason } } : null,
    });
  }

  /**
   * Log patient record update
   */
  async logPatientRecordUpdate(
    req: Request,
    patientId: string,
    userId: string,
    pharmacyId: string,
    oldRecord: any,
    newRecord: any,
    fieldsChanged: string[]
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId,
      eventType: AuditEventType.PATIENT_RECORD_UPDATED,
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.PATIENT_RECORD,
      resourceId: patientId,
      changes: createChangesObject(oldRecord, newRecord, fieldsChanged),
    });
  }

  /**
   * Log patient record export (GDPR requirement)
   */
  async logPatientRecordExport(
    req: Request,
    patientId: string,
    userId: string,
    exportFormat: string
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId: null, // Global event
      eventType: AuditEventType.PATIENT_RECORD_EXPORTED,
      action: AuditAction.READ,
      resourceType: AuditResourceType.PATIENT_RECORD,
      resourceId: patientId,
      changes: {
        export_format: { old: null, new: exportFormat },
        exported_at: { old: null, new: new Date().toISOString() },
      },
    });
  }

  // ==================== Teleconsultation Audit Logging ====================

  /**
   * Log teleconsultation session start
   */
  async logTeleconsultationStarted(
    req: Request,
    teleconsultationId: string,
    userId: string,
    pharmacyId: string,
    patientId: string,
    pharmacistId: string
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId,
      eventType: AuditEventType.TELECONSULTATION_STARTED,
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.TELECONSULTATION,
      resourceId: teleconsultationId,
      changes: {
        status: { old: 'scheduled', new: 'in_progress' },
        started_at: { old: null, new: new Date().toISOString() },
        patient_id: { old: null, new: patientId },
        pharmacist_id: { old: null, new: pharmacistId },
      },
    });
  }

  /**
   * Log teleconsultation session end
   */
  async logTeleconsultationEnded(
    req: Request,
    teleconsultationId: string,
    userId: string,
    pharmacyId: string,
    durationMinutes: number
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId,
      eventType: AuditEventType.TELECONSULTATION_ENDED,
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.TELECONSULTATION,
      resourceId: teleconsultationId,
      changes: {
        status: { old: 'in_progress', new: 'completed' },
        ended_at: { old: null, new: new Date().toISOString() },
        duration_minutes: { old: null, new: durationMinutes },
      },
    });
  }

  // ==================== Authentication Audit Logging ====================

  /**
   * Log user login
   */
  async logUserLogin(
    req: Request,
    userId: string,
    email: string,
    success: boolean
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId: success ? userId : 'unknown',
      pharmacyId: null, // Global event
      eventType: success ? AuditEventType.USER_LOGIN : AuditEventType.USER_LOGIN_FAILED,
      action: AuditAction.READ,
      resourceType: AuditResourceType.USER,
      resourceId: userId,
      changes: {
        email: { old: null, new: email },
        success: { old: null, new: success },
        timestamp: { old: null, new: new Date().toISOString() },
      },
    });
  }

  /**
   * Log user logout
   */
  async logUserLogout(
    req: Request,
    userId: string
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId: null, // Global event
      eventType: AuditEventType.USER_LOGOUT,
      action: AuditAction.READ,
      resourceType: AuditResourceType.USER,
      resourceId: userId,
      changes: {
        timestamp: { old: null, new: new Date().toISOString() },
      },
    });
  }

  /**
   * Log MFA verification
   */
  async logMFAVerification(
    req: Request,
    userId: string,
    success: boolean,
    method: string
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId: null, // Global event
      eventType: AuditEventType.MFA_VERIFIED,
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.USER,
      resourceId: userId,
      changes: {
        mfa_method: { old: null, new: method },
        success: { old: null, new: success },
        timestamp: { old: null, new: new Date().toISOString() },
      },
    });
  }

  // ==================== Delivery Audit Logging ====================

  /**
   * Log delivery completion
   */
  async logDeliveryCompleted(
    req: Request,
    deliveryId: string,
    userId: string,
    pharmacyId: string,
    qrCode?: string
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId,
      eventType: AuditEventType.DELIVERY_COMPLETED,
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.DELIVERY,
      resourceId: deliveryId,
      changes: {
        status: { old: 'in_transit', new: 'completed' },
        completed_at: { old: null, new: new Date().toISOString() },
        qr_code: qrCode ? { old: null, new: qrCode } : undefined,
      },
    });
  }

  // ==================== Inventory Audit Logging ====================

  /**
   * Log inventory low stock alert
   */
  async logInventoryLowStock(
    userId: string,
    pharmacyId: string,
    inventoryItemId: string,
    currentQuantity: number,
    threshold: number
  ): Promise<void> {
    await logAuditEvent(this.dataSource, {
      userId,
      pharmacyId,
      eventType: AuditEventType.INVENTORY_LOW_STOCK,
      action: AuditAction.READ,
      resourceType: AuditResourceType.INVENTORY_ITEM,
      resourceId: inventoryItemId,
      changes: {
        current_quantity: { old: null, new: currentQuantity },
        threshold: { old: null, new: threshold },
        alert_generated_at: { old: null, new: new Date().toISOString() },
      },
    });
  }

  /**
   * Log inventory restock
   */
  async logInventoryRestock(
    req: Request,
    inventoryItemId: string,
    userId: string,
    pharmacyId: string,
    oldQuantity: number,
    newQuantity: number,
    supplierId?: string
  ): Promise<void> {
    await logAuditEventFromRequest(this.dataSource, req, {
      userId,
      pharmacyId,
      eventType: AuditEventType.INVENTORY_RESTOCKED,
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.INVENTORY_ITEM,
      resourceId: inventoryItemId,
      changes: {
        quantity: { old: oldQuantity, new: newQuantity },
        restocked_at: { old: null, new: new Date().toISOString() },
        supplier_id: supplierId ? { old: null, new: supplierId } : undefined,
      },
    });
  }
}

/**
 * Singleton instance (initialized with DataSource)
 */
let auditServiceInstance: AuditService | null = null;

/**
 * Initialize the audit service with database connection
 */
export function initializeAuditService(dataSource: DataSource): AuditService {
  auditServiceInstance = new AuditService(dataSource);
  return auditServiceInstance;
}

/**
 * Get the initialized audit service instance
 */
export function getAuditService(): AuditService {
  if (!auditServiceInstance) {
    throw new Error('AuditService not initialized. Call initializeAuditService first.');
  }
  return auditServiceInstance;
}
