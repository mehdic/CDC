/**
 * PDF Export Routes
 * Endpoints for exporting care plans as PDF documents
 * Task: NURSE-PDF - Nurse Care Plan PDF Export
 */

import { Router, Request, Response } from 'express';
import { PDFController } from '../controllers/pdfController';
import { authenticateJWT, AuthenticatedRequest } from '@shared/middleware/auth';
import { requireRole } from '@shared/middleware/rbac';
import { UserRole } from '@shared/models/User';
import { CarePlanData, PDFExportOptions } from '../services/pdf-export.service';

// FIX #3: Add rate limiting to prevent abuse and DoS attacks
// Using a simple middleware approach: 10 PDF exports per minute per user
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (windowMs: number = 60000, maxRequests: number = 10) => {
  return (req: AuthenticatedRequest, res: Response, next: Function) => {
    const userId = req.user?.userId || req.ip || 'unknown';
    const now = Date.now();

    let userRecord = requestCounts.get(userId);

    // Initialize or reset if window expired
    if (!userRecord || userRecord.resetTime < now) {
      userRecord = { count: 0, resetTime: now + windowMs };
      requestCounts.set(userId, userRecord);
    }

    // Check if limit exceeded
    if (userRecord.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit for PDF exports. Please try again later.',
      });
    }

    // Increment counter
    userRecord.count++;
    next();
  };
};

const router = Router();

// Apply rate limiting to PDF export endpoints
router.use('/export-care-plan', rateLimit(60000, 10)); // 10 requests per 60 seconds
router.use('/validate-care-plan', rateLimit(60000, 20)); // 20 requests per 60 seconds for validation

/**
 * @route   POST /api/nurse/pdf/export-care-plan
 * @desc    Export a care plan as PDF
 * @access  Private - Nurse only
 * @body    {
 *   patientName: string (required),
 *   patientId: string (required),
 *   dateOfBirth?: string,
 *   medicalRecordNumber?: string,
 *   nurseId: string (required),
 *   nurseName: string (required),
 *   carePlanTitle: string (required),
 *   startDate: string (ISO date, required),
 *   endDate?: string (ISO date),
 *   goals: string[] (required),
 *   interventions: Array (required),
 *   medications?: Array,
 *   precautions?: string[],
 *   notes?: string
 * }
 * @returns PDF file attachment
 */
router.post(
  '/export-care-plan',
  authenticateJWT,
  requireRole(UserRole.NURSE),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const carePlanData: CarePlanData = req.body;

      // Validate care plan data
      const validation = PDFController.validateCarePlanData(carePlanData);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid care plan data',
          errors: validation.errors,
        });
      }

      // Verify nurse authorization: can only export own care plans or pharmacist can export any
      if (
        carePlanData.nurseId !== req.user!.userId &&
        req.user!.role !== UserRole.PHARMACIST
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          message:
            'You can only export care plans you created',
        });
      }

      // Parse dates
      carePlanData.startDate = new Date(carePlanData.startDate);
      if (carePlanData.endDate) {
        carePlanData.endDate = new Date(carePlanData.endDate);
      }

      // PDF export options
      const options: PDFExportOptions = {
        hospitalName: 'MetaPharm Connect',
        hospitalAddress: 'Healthcare Partner Network',
        includeSignature: true,
      };

      // Export care plan as PDF
      PDFController.exportCarePlanPDF(carePlanData, options, res);
    } catch (error) {
      console.error('Error exporting care plan PDF:', error);
      // FIX #5: Use generic error messages to prevent information leakage
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to export care plan. Please try again.',
      });
    }
  }
);

/**
 * @route   POST /api/nurse/pdf/validate-care-plan
 * @desc    Validate care plan data without generating PDF
 * @access  Private - Nurse only
 * @body    Same as export-care-plan endpoint
 * @returns Validation result
 */
router.post(
  '/validate-care-plan',
  authenticateJWT,
  requireRole(UserRole.NURSE),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const carePlanData = req.body;

      // Validate care plan data
      const validation = PDFController.validateCarePlanData(carePlanData);

      res.status(200).json({
        valid: validation.valid,
        errors: validation.errors,
        message: validation.valid
          ? 'Care plan data is valid'
          : 'Care plan data has validation errors',
      });
    } catch (error) {
      console.error('Error validating care plan:', error);
      // FIX #5: Use generic error messages to prevent information leakage
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to validate care plan. Please try again.',
      });
    }
  }
);

export default router;
