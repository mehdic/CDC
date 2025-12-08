/**
 * GDPR Export Service
 * Collects all patient data for GDPR Article 20 compliance
 * Security: PII-safe logging, audit trail, encrypted storage
 */

import { DataSource, Repository } from 'typeorm';
import { User } from '@shared/models/User';
import { Prescription } from '@shared/models/Prescription';
import { Order } from '@shared/models/Order';
import { Teleconsultation } from '@shared/models/Teleconsultation';
import { AuditTrailEntry } from '@shared/models/AuditTrailEntry';
import { Payment } from '@shared/models/Payment';
import { VipMembership } from '@shared/models/VipMembership';
import { decryptUserPII } from '@shared/utils/userDecryption';
import { PatientExportData, ExportFormat } from '../interfaces/export.interface';
import { v4 as uuidv4 } from 'uuid';

export class ExportService {
  private userRepository: Repository<User>;
  private prescriptionRepository: Repository<Prescription>;
  private orderRepository: Repository<Order>;
  private teleconsultationRepository: Repository<Teleconsultation>;
  private auditRepository: Repository<AuditTrailEntry>;
  private paymentRepository: Repository<Payment>;
  private vipMembershipRepository: Repository<VipMembership>;

  constructor(private dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(User);
    this.prescriptionRepository = dataSource.getRepository(Prescription);
    this.orderRepository = dataSource.getRepository(Order);
    this.teleconsultationRepository = dataSource.getRepository(Teleconsultation);
    this.auditRepository = dataSource.getRepository(AuditTrailEntry);
    this.paymentRepository = dataSource.getRepository(Payment);
    this.vipMembershipRepository = dataSource.getRepository(VipMembership);
  }

  /**
   * Collect all patient data for GDPR export
   * SECURITY: Decrypts PII only for export, never logs decrypted data
   */
  async collectPatientData(
    patientId: string,
    format: ExportFormat
  ): Promise<PatientExportData> {
    // Verify patient exists and is actually a patient role
    const patient = await this.userRepository.findOne({
      where: { id: patientId },
      relations: ['primary_pharmacy'],
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    if (patient.role !== 'patient') {
      throw new Error('User is not a patient');
    }

    // Decrypt PII for export
    const decryptedPII = await decryptUserPII(patient);

    const exportId = uuidv4();
    const exportDate = new Date().toISOString();

    // Collect all data in parallel for performance
    const [
      prescriptions,
      orders,
      teleconsultations,
      auditTrail,
      payments,
      vipMembership,
    ] = await Promise.all([
      this.collectPrescriptions(patientId),
      this.collectOrders(patientId),
      this.collectTeleconsultations(patientId),
      this.collectAuditTrail(patientId),
      this.collectPayments(patientId),
      this.collectVipMembership(patientId),
    ]);

    const exportData: PatientExportData = {
      exportMetadata: {
        exportId,
        exportDate,
        patientId,
        format,
        dataSubject: "Patient's rights under GDPR Article 20 - Right to Data Portability",
      },

      personalInformation: {
        userId: patient.id,
        email: patient.email,
        firstName: decryptedPII.first_name,
        lastName: decryptedPII.last_name,
        phone: decryptedPII.phone || undefined,
        role: patient.role,
        status: patient.status,
        emailVerified: patient.email_verified,
        mfaEnabled: patient.mfa_enabled,
        createdAt: patient.created_at.toISOString(),
        updatedAt: patient.updated_at.toISOString(),
        lastLoginAt: patient.last_login_at?.toISOString(),
      },

      prescriptions,
      orders,
      teleconsultations,
      appointments: [], // TODO: Implement when Appointment model is available
      auditTrail,
      communications: [], // TODO: Implement when Message model is available
      consents: [], // TODO: Implement when Consent model is available
      payments,
      vipMembership,
    };

    return exportData;
  }

  /**
   * Collect prescription history
   */
  private async collectPrescriptions(patientId: string) {
    const prescriptions = await this.prescriptionRepository.find({
      where: { patient_id: patientId },
      relations: ['items'],
      order: { created_at: 'DESC' },
    });

    return prescriptions.map((prescription) => ({
      id: prescription.id,
      pharmacyId: prescription.pharmacy_id,
      source: prescription.source,
      status: prescription.status,
      prescribedDate: prescription.prescribed_date?.toISOString(),
      expiryDate: prescription.expiry_date?.toISOString(),
      approvedAt: prescription.approved_at?.toISOString(),
      createdAt: prescription.created_at.toISOString(),
      items: prescription.items.map((item) => ({
        medicationName: item.medication_name || 'Unknown',
        dosage: item.dosage || undefined,
        quantity: item.quantity,
        instructions: item.instructions || undefined,
      })),
    }));
  }

  /**
   * Collect order history
   */
  private async collectOrders(patientId: string) {
    const orders = await this.orderRepository.find({
      where: { user_id: patientId },
      relations: ['order_items'],
      order: { order_date: 'DESC' },
    });

    return orders.map((order) => ({
      id: order.id,
      pharmacyId: order.pharmacy_id,
      status: order.order_status,
      totalAmount: order.total_amount.toString(),
      paymentStatus: order.payment_status,
      orderDate: order.order_date.toISOString(),
      items: order.order_items?.map((item: any) => ({
        productName: item.product_name || 'Unknown',
        quantity: item.quantity,
        price: item.price.toString(),
      })) || [],
    }));
  }

  /**
   * Collect teleconsultation history
   */
  private async collectTeleconsultations(patientId: string) {
    const consultations = await this.teleconsultationRepository.find({
      where: { patient_id: patientId },
      order: { scheduled_at: 'DESC' },
    });

    return consultations.map((consultation) => ({
      id: consultation.id,
      pharmacyId: consultation.pharmacy_id,
      pharmacistId: consultation.pharmacist_id || undefined,
      status: consultation.status,
      scheduledAt: consultation.scheduled_at?.toISOString(),
      startedAt: consultation.started_at?.toISOString(),
      endedAt: consultation.ended_at?.toISOString(),
      duration: consultation.duration_minutes || undefined,
      notes: consultation.notes || undefined,
    }));
  }

  /**
   * Collect audit trail (data access log)
   * GDPR requirement: Patients must know who accessed their data and when
   */
  private async collectAuditTrail(patientId: string) {
    const auditEntries = await this.auditRepository.find({
      where: { user_id: patientId },
      order: { created_at: 'DESC' },
      take: 1000, // Limit to last 1000 entries for performance
    });

    return auditEntries.map((entry) => ({
      id: entry.id,
      eventType: entry.event_type,
      action: entry.action,
      resourceType: entry.resource_type,
      resourceId: entry.resource_id,
      timestamp: entry.created_at.toISOString(),
      ipAddress: entry.ip_address || undefined,
    }));
  }

  /**
   * Collect payment history (with PII anonymization)
   */
  private async collectPayments(patientId: string) {
    const payments = await this.paymentRepository.find({
      where: { user_id: patientId },
      order: { processed_at: 'DESC' },
    });

    return payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount.toString(),
      currency: payment.currency,
      paymentMethod: this.anonymizePaymentMethod(payment.payment_method),
      status: payment.payment_status,
      processedAt: payment.processed_at.toISOString(),
    }));
  }

  /**
   * Anonymize payment method (show only last 4 digits)
   * GDPR: Don't expose full card numbers
   */
  private anonymizePaymentMethod(method: string): string {
    if (!method) return 'Unknown';

    // If it looks like a card number (contains digits), show last 4 only
    if (/\d{4,}/.test(method)) {
      const digits = method.replace(/\D/g, '');
      return `**** **** **** ${digits.slice(-4)}`;
    }

    return method; // Return as-is for non-card methods (e.g., "PayPal", "Cash on Delivery")
  }

  /**
   * Collect VIP membership data
   */
  private async collectVipMembership(patientId: string) {
    const membership = await this.vipMembershipRepository.findOne({
      where: { user_id: patientId },
    });

    if (!membership) {
      return undefined;
    }

    return {
      tier: membership.tier,
      points: membership.points,
      joinedAt: membership.joined_at.toISOString(),
      expiresAt: membership.expires_at?.toISOString(),
    };
  }

  /**
   * Verify patient can request export (rate limiting check)
   * GDPR: Limit to 1 export per 24 hours to prevent abuse
   */
  async canRequestExport(patientId: string): Promise<{ allowed: boolean; reason?: string }> {
    const lastExport = await this.auditRepository.findOne({
      where: {
        user_id: patientId,
        event_type: 'gdpr.export.requested',
      },
      order: { created_at: 'DESC' },
    });

    if (!lastExport) {
      return { allowed: true };
    }

    const hoursSinceLastExport =
      (Date.now() - lastExport.created_at.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastExport < 24) {
      const hoursRemaining = Math.ceil(24 - hoursSinceLastExport);
      return {
        allowed: false,
        reason: `Please wait ${hoursRemaining} hours before requesting another export`,
      };
    }

    return { allowed: true };
  }
}
