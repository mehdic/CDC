/**
 * PDF Export Controller
 * Handles PDF generation requests for nurse care plans
 * Task: NURSE-PDF - Nurse Care Plan PDF Export
 */

import { Response } from 'express';
import { PDFExportService, CarePlanData, PDFExportOptions } from '../services/pdf-export.service';

export class PDFController {
  /**
   * Sanitize filename by removing dangerous characters
   * Only allows alphanumeric, dash, and underscore characters
   * @param filename Raw filename
   * @returns Sanitized filename
   */
  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
      .toLowerCase();
  }

  /**
   * Export care plan as PDF
   * @param carePlanData Care plan information
   * @param options PDF configuration options
   * @param res Express response object
   */
  static exportCarePlanPDF(
    carePlanData: CarePlanData,
    options: PDFExportOptions,
    res: Response
  ): void {
    try {
      // Validate required fields
      if (!carePlanData.patientName || !carePlanData.nurseId) {
        throw new Error('Missing required fields: patientName and nurseId');
      }

      // Generate PDF
      const pdfDoc = PDFExportService.generateCarePlanPDF(carePlanData, options);

      // Set response headers with sanitized filename (FIX #1 & #2)
      // Use patientId instead of patient name to avoid PII in filename (HIPAA/GDPR)
      const sanitizedPatientId = this.sanitizeFilename(carePlanData.patientId || 'unknown');
      const filename = `care-plan-${sanitizedPatientId}-${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Pipe PDF to response
      pdfDoc.pipe(res);

      // Handle errors during streaming
      pdfDoc.on('error', (error: Error) => {
        console.error('PDF generation error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to export care plan. Please try again.',
          });
        }
      });

      res.on('error', (error: Error) => {
        console.error('Response error:', error);
        pdfDoc.destroy();
      });
    } catch (error) {
      console.error('PDF export error:', error);

      res.status(400).json({
        error: 'Invalid Request',
        message: 'Failed to export care plan. Please check your input and try again.',
      });
    }
  }

  /**
   * Validate care plan data before PDF generation
   * @param carePlanData Care plan information to validate
   * @returns Validation result with errors if any
   */
  static validateCarePlanData(carePlanData: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required fields
    if (!carePlanData.patientName) {
      errors.push('patientName is required');
    }
    if (!carePlanData.nurseId) {
      errors.push('nurseId is required');
    }
    if (!carePlanData.nurseName) {
      errors.push('nurseName is required');
    }
    if (!carePlanData.carePlanTitle) {
      errors.push('carePlanTitle is required');
    }
    if (!carePlanData.startDate) {
      errors.push('startDate is required');
    }

    // FIX #4: Add input length validation to prevent DoS
    if (carePlanData.patientName && carePlanData.patientName.length > 255) {
      errors.push('patientName must not exceed 255 characters');
    }
    if (carePlanData.nurseName && carePlanData.nurseName.length > 255) {
      errors.push('nurseName must not exceed 255 characters');
    }
    if (carePlanData.carePlanTitle && carePlanData.carePlanTitle.length > 500) {
      errors.push('carePlanTitle must not exceed 500 characters');
    }
    if (carePlanData.notes && carePlanData.notes.length > 10000) {
      errors.push('notes must not exceed 10,000 characters');
    }

    // Goals validation
    if (!Array.isArray(carePlanData.goals)) {
      errors.push('goals must be an array');
    }

    // Interventions validation
    if (!Array.isArray(carePlanData.interventions)) {
      errors.push('interventions must be an array');
    } else {
      carePlanData.interventions.forEach((intervention: any, index: number) => {
        if (!intervention.description) {
          errors.push(`interventions[${index}].description is required`);
        }
        if (!intervention.frequency) {
          errors.push(`interventions[${index}].frequency is required`);
        }
        // FIX #4: Validate intervention description length
        if (intervention.description && intervention.description.length > 2000) {
          errors.push(`interventions[${index}].description must not exceed 2,000 characters`);
        }
      });
    }

    // Medications validation (optional but if provided, validate structure)
    if (
      carePlanData.medications &&
      Array.isArray(carePlanData.medications)
    ) {
      carePlanData.medications.forEach((med: any, index: number) => {
        if (!med.name) {
          errors.push(`medications[${index}].name is required`);
        }
        if (!med.dosage) {
          errors.push(`medications[${index}].dosage is required`);
        }
        if (!med.frequency) {
          errors.push(`medications[${index}].frequency is required`);
        }
        if (!med.route) {
          errors.push(`medications[${index}].route is required`);
        }
        // FIX #4: Validate medication field lengths
        if (med.name && med.name.length > 255) {
          errors.push(`medications[${index}].name must not exceed 255 characters`);
        }
        if (med.dosage && med.dosage.length > 100) {
          errors.push(`medications[${index}].dosage must not exceed 100 characters`);
        }
        if (med.indication && med.indication.length > 500) {
          errors.push(`medications[${index}].indication must not exceed 500 characters`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
