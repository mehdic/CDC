/**
 * PDF Export Service for Nurse Care Plans
 * Generates professional PDF documents for patient care plans
 * Includes patient info, care plan details, medication schedule, and nurse notes
 * Task: NURSE-PDF - Nurse Care Plan PDF Export
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface CarePlanData {
  patientId: string;
  patientName: string;
  dateOfBirth?: string;
  medicalRecordNumber?: string;
  nurseId: string;
  nurseName: string;
  carePlanTitle: string;
  startDate: Date;
  endDate?: Date;
  goals: string[];
  interventions: Array<{
    description: string;
    frequency: string;
    timeOfDay?: string;
  }>;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    indication: string;
  }>;
  precautions?: string[];
  notes?: string;
  signOffDate?: Date;
}

export interface PDFExportOptions {
  hospitalName?: string;
  hospitalAddress?: string;
  logoPath?: string;
  includeSignature?: boolean;
}

export class PDFExportService {
  /**
   * Generate a PDF stream for care plan
   * @param carePlanData Care plan information to include in PDF
   * @param options PDF configuration options
   * @returns Stream readable PDF document
   */
  static generateCarePlanPDF(
    carePlanData: CarePlanData,
    options: PDFExportOptions = {}
  ): any {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
    });

    // Add header
    this.addHeader(doc, options);

    // Add patient information section
    this.addPatientInfo(doc, carePlanData);

    // Add care plan goals
    this.addGoalsSection(doc, carePlanData);

    // Add interventions
    this.addInterventionsSection(doc, carePlanData);

    // Add medications if provided
    if (carePlanData.medications && carePlanData.medications.length > 0) {
      this.addMedicationsSection(doc, carePlanData);
    }

    // Add precautions if provided
    if (carePlanData.precautions && carePlanData.precautions.length > 0) {
      this.addPrecautionsSection(doc, carePlanData);
    }

    // Add notes if provided
    if (carePlanData.notes) {
      this.addNotesSection(doc, carePlanData);
    }

    // Add footer with page numbers and compliance notice
    this.addFooter(doc, carePlanData.nurseName);

    // Finalize document
    doc.end();

    return doc;
  }

  /**
   * Add professional header with hospital branding
   */
  private static addHeader(doc: any, options: PDFExportOptions): void {
    const pageWidth = doc.page.width - 80;

    // Hospital branding
    if (options.hospitalName) {
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(options.hospitalName, {
          align: 'left',
        });

      if (options.hospitalAddress) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(options.hospitalAddress, {
            align: 'left',
          });
      }
    }

    // Document title on right side
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Care Plan Export', {
        align: 'right',
        y: doc.y - 30,
      });

    // Separator line
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(40, doc.y + 10)
      .lineTo(doc.page.width - 40, doc.y + 10)
      .stroke();

    doc.moveDown(1);
  }

  /**
   * Add patient information section
   */
  private static addPatientInfo(doc: any, carePlanData: CarePlanData): void {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333');
    doc.text('Patient Information', { underline: true });

    doc.fontSize(10).font('Helvetica').fillColor('#000000');

    const infoItems = [
      { label: 'Patient Name:', value: carePlanData.patientName },
      {
        label: 'Date of Birth:',
        value: carePlanData.dateOfBirth
          ? new Date(carePlanData.dateOfBirth).toLocaleDateString('en-US')
          : 'Not provided',
      },
      {
        label: 'Medical Record Number:',
        value: carePlanData.medicalRecordNumber || 'Not provided',
      },
      { label: 'Care Plan Title:', value: carePlanData.carePlanTitle },
      {
        label: 'Start Date:',
        value: new Date(carePlanData.startDate).toLocaleDateString('en-US'),
      },
      {
        label: 'End Date:',
        value: carePlanData.endDate
          ? new Date(carePlanData.endDate).toLocaleDateString('en-US')
          : 'Ongoing',
      },
      { label: 'Nurse:', value: carePlanData.nurseName },
    ];

    infoItems.forEach((item) => {
      doc.text(`${item.label} ${item.value}`);
    });

    doc.moveDown(0.5);

    // Separator
    doc
      .strokeColor('#eeeeee')
      .lineWidth(0.5)
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .stroke();

    doc.moveDown(0.5);
  }

  /**
   * Add care plan goals section
   */
  private static addGoalsSection(doc: any, carePlanData: CarePlanData): void {
    // Check if we need a new page
    if (doc.y > doc.page.height - 150) {
      doc.addPage();
    }

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333');
    doc.text('Care Plan Goals', { underline: true });

    doc.fontSize(10).font('Helvetica').fillColor('#000000');

    if (carePlanData.goals.length === 0) {
      doc.text('No goals specified', { color: '#999999' });
    } else {
      carePlanData.goals.forEach((goal, index) => {
        doc.text(`${index + 1}. ${goal}`);
      });
    }

    doc.moveDown(0.5);

    // Separator
    doc
      .strokeColor('#eeeeee')
      .lineWidth(0.5)
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .stroke();

    doc.moveDown(0.5);
  }

  /**
   * Add interventions section with timing information
   */
  private static addInterventionsSection(
    doc: any,
    carePlanData: CarePlanData
  ): void {
    // Check if we need a new page
    if (doc.y > doc.page.height - 150) {
      doc.addPage();
    }

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333');
    doc.text('Nursing Interventions', { underline: true });

    doc.fontSize(10).font('Helvetica').fillColor('#000000');

    if (carePlanData.interventions.length === 0) {
      doc.text('No interventions specified', { color: '#999999' });
    } else {
      carePlanData.interventions.forEach((intervention, index) => {
        const timeInfo = intervention.timeOfDay
          ? ` (${intervention.timeOfDay})`
          : '';
        doc.text(
          `${index + 1}. ${intervention.description}`,
          { continued: false }
        );
        doc
          .fontSize(9)
          .text(`   Frequency: ${intervention.frequency}${timeInfo}`, {
            color: '#666666',
          });
        doc.fontSize(10);
      });
    }

    doc.moveDown(0.5);

    // Separator
    doc
      .strokeColor('#eeeeee')
      .lineWidth(0.5)
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .stroke();

    doc.moveDown(0.5);
  }

  /**
   * Add medications section
   */
  private static addMedicationsSection(
    doc: any,
    carePlanData: CarePlanData
  ): void {
    // Check if we need a new page
    if (doc.y > doc.page.height - 180) {
      doc.addPage();
    }

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333');
    doc.text('Medication Schedule', { underline: true });

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333');

    const colWidths = {
      medication: 100,
      dosage: 70,
      frequency: 80,
      route: 60,
      indication: 80,
    };

    // Table header
    const headerY = doc.y;
    doc.text('Medication', 40, headerY);
    doc.text('Dosage', 40 + colWidths.medication, headerY);
    doc.text('Frequency', 40 + colWidths.medication + colWidths.dosage, headerY);
    doc.text(
      'Route',
      40 + colWidths.medication + colWidths.dosage + colWidths.frequency,
      headerY
    );
    doc.text(
      'Indication',
      40 +
        colWidths.medication +
        colWidths.dosage +
        colWidths.frequency +
        colWidths.route,
      headerY
    );

    doc.moveDown();

    // Header separator
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .stroke();

    doc.moveDown(0.3);

    // Table rows
    doc.fontSize(9).font('Helvetica').fillColor('#000000');

    carePlanData.medications!.forEach((med, index) => {
      const y = doc.y;
      const rowHeight = 30;

      // Check if we need a new page
      if (doc.y + rowHeight > doc.page.height - 60) {
        doc.addPage();
        doc.moveDown();
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc
          .rect(40, doc.y - 2, doc.page.width - 80, rowHeight)
          .fillAndStroke('#f9f9f9', '#f9f9f9');
        doc.fillColor('#000000');
      }

      doc.text(med.name, 40, y, { width: colWidths.medication - 5 });
      doc.text(med.dosage, 40 + colWidths.medication, y, {
        width: colWidths.dosage - 5,
      });
      doc.text(
        med.frequency,
        40 + colWidths.medication + colWidths.dosage,
        y,
        { width: colWidths.frequency - 5 }
      );
      doc.text(
        med.route,
        40 + colWidths.medication + colWidths.dosage + colWidths.frequency,
        y,
        { width: colWidths.route - 5 }
      );
      doc.text(
        med.indication,
        40 +
          colWidths.medication +
          colWidths.dosage +
          colWidths.frequency +
          colWidths.route,
        y,
        { width: colWidths.indication - 5 }
      );

      doc.moveDown(2.5);
    });

    // Footer separator
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .stroke();

    doc.moveDown(0.5);
  }

  /**
   * Add precautions section
   */
  private static addPrecautionsSection(
    doc: any,
    carePlanData: CarePlanData
  ): void {
    // Check if we need a new page
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333');
    doc.text('Special Precautions', { underline: true });

    doc.fontSize(10).font('Helvetica').fillColor('#000000');

    carePlanData.precautions!.forEach((precaution, index) => {
      doc.text(`• ${precaution}`);
    });

    doc.moveDown(0.5);

    // Separator
    doc
      .strokeColor('#eeeeee')
      .lineWidth(0.5)
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .stroke();

    doc.moveDown(0.5);
  }

  /**
   * Add notes section
   */
  private static addNotesSection(doc: any, carePlanData: CarePlanData): void {
    // Check if we need a new page
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333');
    doc.text('Nurse Notes', { underline: true });

    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text(carePlanData.notes || '', {
      align: 'left',
      width: doc.page.width - 80,
    });

    doc.moveDown(0.5);
  }

  /**
   * Add footer with page numbers and compliance notice
   */
  private static addFooter(doc: any, nurseName: string): void {
    const pages = doc.bufferedPageRange().count;

    for (let i = 0; i < pages; i++) {
      doc.switchToPage(i);

      // Page number
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#999999')
        .text(
          `Page ${i + 1} of ${pages}`,
          40,
          doc.page.height - 30,
          { align: 'center' }
        );

      // Nurse signature area (last page only)
      if (i === pages - 1 && pages > 0) {
        doc
          .fontSize(8)
          .text('Prepared by: ' + nurseName, 40, doc.page.height - 50, {
            align: 'left',
          });
        doc.text(
          `Date: ${new Date().toLocaleDateString('en-US')}`,
          40,
          doc.page.height - 35,
          { align: 'left' }
        );
      }

      // Compliance notice
      doc
        .fontSize(7)
        .text(
          'This document contains sensitive healthcare information. Please keep it confidential.',
          40,
          doc.page.height - 20,
          { align: 'center' }
        );
    }
  }
}
