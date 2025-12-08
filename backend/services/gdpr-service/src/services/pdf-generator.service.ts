/**
 * GDPR PDF Generator Service
 * Generates professional PDF for patient data exports
 * GDPR Article 20 compliant format
 */

import PDFDocument from 'pdfkit';
import { PatientExportData } from '../interfaces/export.interface';

export class PDFGeneratorService {
  /**
   * Generate GDPR data export PDF
   * @param data Complete patient export data
   * @returns PDFDocument stream
   */
  static generateGDPRExportPDF(data: PatientExportData): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
      info: {
        Title: `GDPR Data Export - ${data.personalInformation.firstName} ${data.personalInformation.lastName}`,
        Author: 'MetaPharm Connect',
        Subject: 'GDPR Article 20 - Right to Data Portability',
        Creator: 'MetaPharm Connect GDPR Service',
      },
    });

    // Add title page
    this.addTitlePage(doc, data);

    // Add sections
    this.addPersonalInformation(doc, data);
    this.addPrescriptions(doc, data);
    this.addOrders(doc, data);
    this.addTeleconsultations(doc, data);
    this.addAuditTrail(doc, data);
    this.addPayments(doc, data);

    if (data.vipMembership) {
      this.addVipMembership(doc, data);
    }

    // Add footer with page numbers
    this.addFooter(doc);

    // Finalize
    doc.end();

    return doc;
  }

  /**
   * Add title page with GDPR notice
   */
  private static addTitlePage(doc: PDFKit.PDFDocument, data: PatientExportData): void {
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('GDPR Data Export', { align: 'center' });

    doc.moveDown(2);

    doc
      .fontSize(14)
      .font('Helvetica')
      .text('Right to Data Portability (Article 20)', { align: 'center' });

    doc.moveDown(3);

    doc
      .fontSize(12)
      .text(`Export ID: ${data.exportMetadata.exportId}`, { align: 'center' });

    doc.text(`Export Date: ${new Date(data.exportMetadata.exportDate).toLocaleString()}`, {
      align: 'center',
    });

    doc.moveDown(2);

    doc
      .fontSize(10)
      .text(
        'This document contains all personal data we hold about you. ' +
        'It is provided in compliance with the General Data Protection Regulation (GDPR) ' +
        'Article 20, which grants you the right to receive your personal data in a structured, ' +
        'commonly used, and machine-readable format.',
        { align: 'justify' }
      );

    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor('red')
      .text('CONFIDENTIAL - This document contains sensitive personal health information', {
        align: 'center',
      })
      .fillColor('black');

    doc.addPage();
  }

  /**
   * Add personal information section
   */
  private static addPersonalInformation(
    doc: PDFKit.PDFDocument,
    data: PatientExportData
  ): void {
    this.addSectionHeader(doc, 'Personal Information');

    const info = data.personalInformation;

    doc.fontSize(10).font('Helvetica');

    this.addField(doc, 'User ID', info.userId);
    this.addField(doc, 'Name', `${info.firstName} ${info.lastName}`);
    this.addField(doc, 'Email', info.email);
    if (info.phone) this.addField(doc, 'Phone', info.phone);
    this.addField(doc, 'Role', info.role);
    this.addField(doc, 'Status', info.status);
    this.addField(doc, 'Email Verified', info.emailVerified ? 'Yes' : 'No');
    this.addField(doc, 'MFA Enabled', info.mfaEnabled ? 'Yes' : 'No');
    this.addField(doc, 'Account Created', new Date(info.createdAt).toLocaleString());
    this.addField(doc, 'Last Updated', new Date(info.updatedAt).toLocaleString());
    if (info.lastLoginAt) {
      this.addField(doc, 'Last Login', new Date(info.lastLoginAt).toLocaleString());
    }

    doc.moveDown(2);
  }

  /**
   * Add prescriptions section
   */
  private static addPrescriptions(doc: PDFKit.PDFDocument, data: PatientExportData): void {
    this.addSectionHeader(doc, `Prescriptions (${data.prescriptions.length})`);

    if (data.prescriptions.length === 0) {
      doc.fontSize(10).text('No prescriptions found.', { italics: true });
      doc.moveDown(2);
      return;
    }

    data.prescriptions.forEach((prescription, index) => {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Prescription #${index + 1}`, { underline: true });

      doc.fontSize(9).font('Helvetica');
      this.addField(doc, '  ID', prescription.id, 9);
      this.addField(doc, '  Status', prescription.status, 9);
      this.addField(doc, '  Source', prescription.source, 9);
      if (prescription.prescribedDate) {
        this.addField(
          doc,
          '  Prescribed',
          new Date(prescription.prescribedDate).toLocaleDateString(),
          9
        );
      }
      if (prescription.approvedAt) {
        this.addField(
          doc,
          '  Approved',
          new Date(prescription.approvedAt).toLocaleString(),
          9
        );
      }

      doc.text('  Medications:', { continued: false });
      prescription.items.forEach((item) => {
        doc.text(`    • ${item.medicationName} - Qty: ${item.quantity}`, { indent: 20 });
        if (item.dosage) doc.text(`      Dosage: ${item.dosage}`, { indent: 20 });
        if (item.instructions) doc.text(`      Instructions: ${item.instructions}`, { indent: 20 });
      });

      doc.moveDown(1);
    });

    doc.moveDown(1);
  }

  /**
   * Add orders section
   */
  private static addOrders(doc: PDFKit.PDFDocument, data: PatientExportData): void {
    this.addSectionHeader(doc, `Orders (${data.orders.length})`);

    if (data.orders.length === 0) {
      doc.fontSize(10).text('No orders found.', { italics: true });
      doc.moveDown(2);
      return;
    }

    data.orders.forEach((order, index) => {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Order #${index + 1}`, { underline: true });

      doc.fontSize(9).font('Helvetica');
      this.addField(doc, '  ID', order.id, 9);
      this.addField(doc, '  Status', order.status, 9);
      this.addField(doc, '  Total', `CHF ${order.totalAmount}`, 9);
      this.addField(doc, '  Payment', order.paymentStatus, 9);
      this.addField(doc, '  Date', new Date(order.orderDate).toLocaleString(), 9);

      doc.text('  Items:', { continued: false });
      order.items.forEach((item) => {
        doc.text(`    • ${item.productName} - Qty: ${item.quantity} - CHF ${item.price}`, {
          indent: 20,
        });
      });

      doc.moveDown(1);
    });

    doc.moveDown(1);
  }

  /**
   * Add teleconsultations section
   */
  private static addTeleconsultations(
    doc: PDFKit.PDFDocument,
    data: PatientExportData
  ): void {
    this.addSectionHeader(doc, `Teleconsultations (${data.teleconsultations.length})`);

    if (data.teleconsultations.length === 0) {
      doc.fontSize(10).text('No teleconsultations found.', { italics: true });
      doc.moveDown(2);
      return;
    }

    data.teleconsultations.forEach((consultation, index) => {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Consultation #${index + 1}`, { underline: true });

      doc.fontSize(9).font('Helvetica');
      this.addField(doc, '  ID', consultation.id, 9);
      this.addField(doc, '  Status', consultation.status, 9);
      if (consultation.scheduledAt) {
        this.addField(
          doc,
          '  Scheduled',
          new Date(consultation.scheduledAt).toLocaleString(),
          9
        );
      }
      if (consultation.duration) {
        this.addField(doc, '  Duration', `${consultation.duration} minutes`, 9);
      }
      if (consultation.notes) {
        doc.text(`  Notes: ${consultation.notes}`, { width: 500 });
      }

      doc.moveDown(1);
    });

    doc.moveDown(1);
  }

  /**
   * Add audit trail section
   */
  private static addAuditTrail(doc: PDFKit.PDFDocument, data: PatientExportData): void {
    this.addSectionHeader(doc, `Audit Trail (${data.auditTrail.length} recent events)`);

    if (data.auditTrail.length === 0) {
      doc.fontSize(10).text('No audit events found.', { italics: true });
      doc.moveDown(2);
      return;
    }

    doc.fontSize(8).font('Helvetica');

    // Group by date
    const eventsByDate = this.groupAuditEventsByDate(data.auditTrail);

    Object.entries(eventsByDate).forEach(([date, events]) => {
      doc.fontSize(9).font('Helvetica-Bold').text(date, { underline: true });

      events.forEach((event: any) => {
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            `  ${new Date(event.timestamp).toLocaleTimeString()} - ${event.eventType} (${event.action}) - ${event.resourceType}`,
            { width: 500 }
          );
      });

      doc.moveDown(0.5);
    });

    doc.moveDown(1);
  }

  /**
   * Add payments section
   */
  private static addPayments(doc: PDFKit.PDFDocument, data: PatientExportData): void {
    this.addSectionHeader(doc, `Payments (${data.payments.length})`);

    if (data.payments.length === 0) {
      doc.fontSize(10).text('No payments found.', { italics: true });
      doc.moveDown(2);
      return;
    }

    data.payments.forEach((payment, index) => {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Payment #${index + 1}`, { underline: true });

      doc.fontSize(9).font('Helvetica');
      this.addField(doc, '  ID', payment.id, 9);
      this.addField(doc, '  Amount', `${payment.amount} ${payment.currency}`, 9);
      this.addField(doc, '  Method', payment.paymentMethod, 9);
      this.addField(doc, '  Status', payment.status, 9);
      this.addField(doc, '  Processed', new Date(payment.processedAt).toLocaleString(), 9);

      doc.moveDown(1);
    });

    doc.moveDown(1);
  }

  /**
   * Add VIP membership section
   */
  private static addVipMembership(doc: PDFKit.PDFDocument, data: PatientExportData): void {
    if (!data.vipMembership) return;

    this.addSectionHeader(doc, 'VIP Membership');

    doc.fontSize(10).font('Helvetica');
    this.addField(doc, 'Tier', data.vipMembership.tier);
    this.addField(doc, 'Points', data.vipMembership.points.toString());
    this.addField(doc, 'Joined', new Date(data.vipMembership.joinedAt).toLocaleString());
    if (data.vipMembership.expiresAt) {
      this.addField(
        doc,
        'Expires',
        new Date(data.vipMembership.expiresAt).toLocaleString()
      );
    }

    doc.moveDown(2);
  }

  /**
   * Utility: Add section header
   */
  private static addSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
    doc.fontSize(14).font('Helvetica-Bold').text(title, { underline: true });
    doc.moveDown(1);
  }

  /**
   * Utility: Add field with label and value
   */
  private static addField(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    fontSize: number = 10
  ): void {
    doc
      .fontSize(fontSize)
      .font('Helvetica-Bold')
      .text(`${label}: `, { continued: true })
      .font('Helvetica')
      .text(value);
  }

  /**
   * Utility: Group audit events by date
   */
  private static groupAuditEventsByDate(events: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    events.forEach((event) => {
      const date = new Date(event.timestamp).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    return grouped;
  }

  /**
   * Add footer with page numbers
   */
  private static addFooter(doc: PDFKit.PDFDocument): void {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Page ${i + 1} of ${pages.count} | Generated: ${new Date().toLocaleString()} | GDPR Export`,
          40,
          doc.page.height - 50,
          {
            align: 'center',
            width: doc.page.width - 80,
          }
        );
    }
  }
}
