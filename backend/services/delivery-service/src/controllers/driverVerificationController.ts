/**
 * Driver Verification Controller
 * API endpoints for driver identity verification and authorization
 */

import { Request, Response } from 'express';
import { DriverVerificationService } from '../services/driver-verification/driver-verification.service';
import { DriverVerificationRepository } from '../repository/driver-verification.repository';
import {
  DriverVerificationRequest,
  AuthorizationRequest,
  AtDeliveryVerificationRequest,
  AuthorizationLevel
} from '../types/driver-verification.types';

// Mock database connection - replace with actual implementation
const mockDB: any = {
  query: async (sql: string, params: any[]) => [],
  execute: async (sql: string, params: any[]) => ({ affectedRows: 1 })
};

const repository = new DriverVerificationRepository(mockDB);
const service = new DriverVerificationService(repository);

/**
 * POST /api/v1/drivers/:id/verify
 * Verify driver's government-issued ID
 */
export async function verifyDriverID(req: Request, res: Response): Promise<void> {
  try {
    const { id: driverId } = req.params;
    const verificationData: DriverVerificationRequest = {
      ...req.body,
      driverId
    };

    // Validate request
    if (!verificationData.idType || !verificationData.idNumber) {
      res.status(400).json({
        success: false,
        errors: ['idType and idNumber are required']
      });
      return;
    }

    // Get authenticated user from request (mock)
    const performedBy = (req as any).user?.id || 'system';

    const result = await service.verifyDriverID(verificationData, performedBy);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.governmentID,
        message: 'Driver ID verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in verifyDriverID:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error during ID verification']
    });
  }
}

/**
 * POST /api/v1/drivers/:id/verify-license
 * Verify driver's license
 */
export async function verifyDriverLicense(req: Request, res: Response): Promise<void> {
  try {
    const { id: driverId } = req.params;
    const {
      licenseNumber,
      categories,
      issuingAuthority,
      issueDate,
      expiryDate
    } = req.body;

    if (!licenseNumber || !categories || !issuingAuthority) {
      res.status(400).json({
        success: false,
        errors: ['licenseNumber, categories, and issuingAuthority are required']
      });
      return;
    }

    const performedBy = (req as any).user?.id || 'system';

    const result = await service.verifyDriverLicense(
      driverId,
      licenseNumber,
      categories,
      issuingAuthority,
      new Date(issueDate),
      new Date(expiryDate),
      performedBy
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.driverLicense,
        message: 'Driver license verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in verifyDriverLicense:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error during license verification']
    });
  }
}

/**
 * GET /api/v1/drivers/:id/authorizations
 * Get driver's active authorizations
 */
export async function getDriverAuthorizations(req: Request, res: Response): Promise<void> {
  try {
    const { id: driverId } = req.params;
    const { pharmacyId } = req.query;

    if (!pharmacyId) {
      res.status(400).json({
        success: false,
        errors: ['pharmacyId query parameter is required']
      });
      return;
    }

    const authorizations = await repository.getActiveAuthorizations(
      driverId,
      pharmacyId as string,
      AuthorizationLevel.STANDARD
    );

    res.status(200).json({
      success: true,
      data: authorizations
    });
  } catch (error) {
    console.error('Error in getDriverAuthorizations:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error fetching authorizations']
    });
  }
}

/**
 * POST /api/v1/drivers/:id/authorizations
 * Grant controlled substance authorization to driver
 */
export async function grantAuthorization(req: Request, res: Response): Promise<void> {
  try {
    const { id: driverId } = req.params;
    const authorizationData: AuthorizationRequest = {
      ...req.body,
      driverId
    };

    // Validate request
    if (!authorizationData.authorizationLevel || !authorizationData.pharmacyId) {
      res.status(400).json({
        success: false,
        errors: ['authorizationLevel and pharmacyId are required']
      });
      return;
    }

    const issuedBy = (req as any).user?.id || 'system';

    const result = await service.grantAuthorization(authorizationData, issuedBy);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.authorization,
        message: 'Authorization granted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in grantAuthorization:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error granting authorization']
    });
  }
}

/**
 * DELETE /api/v1/drivers/:id/authorizations/:authId
 * Revoke driver authorization
 */
export async function revokeAuthorization(req: Request, res: Response): Promise<void> {
  try {
    const { authId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        errors: ['reason is required for revocation']
      });
      return;
    }

    const revokedBy = (req as any).user?.id || 'system';

    const result = await service.revokeAuthorization(authId, revokedBy, reason);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Authorization revoked successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in revokeAuthorization:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error revoking authorization']
    });
  }
}

/**
 * POST /api/v1/deliveries/:id/verify-driver
 * Verify driver identity at time of delivery
 */
export async function verifyAtDelivery(req: Request, res: Response): Promise<void> {
  try {
    const { id: deliveryId } = req.params;
    const verificationData: AtDeliveryVerificationRequest = {
      ...req.body,
      deliveryId
    };

    // Validate request
    if (!verificationData.driverId || !verificationData.photoBase64 || !verificationData.signatureBase64) {
      res.status(400).json({
        success: false,
        errors: ['driverId, photoBase64, and signatureBase64 are required']
      });
      return;
    }

    const result = await service.verifyAtDelivery(verificationData);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          matchScore: result.matchScore
        },
        message: 'Driver verification successful'
      });
    } else {
      res.status(403).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in verifyAtDelivery:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error during at-delivery verification']
    });
  }
}

/**
 * POST /api/v1/deliveries/:id/check-authorization
 * Pre-delivery authorization check
 */
export async function checkPreDeliveryAuthorization(req: Request, res: Response): Promise<void> {
  try {
    const { id: deliveryId } = req.params;
    const { driverId, pharmacyId, requiredLevel } = req.body;

    if (!driverId || !pharmacyId || !requiredLevel) {
      res.status(400).json({
        success: false,
        errors: ['driverId, pharmacyId, and requiredLevel are required']
      });
      return;
    }

    const result = await service.checkPreDeliveryAuthorization(
      driverId,
      deliveryId,
      pharmacyId,
      requiredLevel as AuthorizationLevel
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in checkPreDeliveryAuthorization:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error during pre-delivery check']
    });
  }
}

/**
 * POST /api/v1/deliveries/:id/emergency-override
 * Create emergency override for blocked delivery
 */
export async function createEmergencyOverride(req: Request, res: Response): Promise<void> {
  try {
    const { id: deliveryId } = req.params;
    const { driverId, reason, justification, approvedBy } = req.body;

    if (!driverId || !reason || !justification || !approvedBy) {
      res.status(400).json({
        success: false,
        errors: ['driverId, reason, justification, and approvedBy are required']
      });
      return;
    }

    const requestedBy = (req as any).user?.id || 'system';

    const result = await service.createEmergencyOverride(
      deliveryId,
      driverId,
      requestedBy,
      approvedBy,
      reason,
      justification
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        data: { overrideId: result.overrideId },
        message: 'Emergency override created successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in createEmergencyOverride:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error creating emergency override']
    });
  }
}

/**
 * GET /api/v1/audit/driver-verifications
 * Get verification audit logs
 */
export async function getVerificationAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const { driverId, startDate, endDate } = req.query;

    if (!driverId) {
      res.status(400).json({
        success: false,
        errors: ['driverId query parameter is required']
      });
      return;
    }

    const logs = await repository.getAuditLogsByDriver(
      driverId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error in getVerificationAuditLogs:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error fetching audit logs']
    });
  }
}

/**
 * GET /api/v1/reports/regulatory
 * Generate regulatory compliance report
 */
export async function generateRegulatoryReport(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        errors: ['startDate and endDate query parameters are required']
      });
      return;
    }

    const generatedBy = (req as any).user?.id || 'system';

    const report = await service.generateRegulatoryReport(
      new Date(startDate as string),
      new Date(endDate as string),
      generatedBy
    );

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error in generateRegulatoryReport:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error generating report']
    });
  }
}
