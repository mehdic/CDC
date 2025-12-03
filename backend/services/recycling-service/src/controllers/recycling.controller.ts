/**
 * Recycling Controller
 * HTTP request handlers for recycling endpoints
 * T5-052: Medication Return/Recycling Feature
 */

import { Request, Response } from 'express';
import recyclingService from '../services/recycling.service';
import { Medication } from '../types/recycling';

/**
 * POST /api/recycling/request
 * Patient creates a new medication recycling request
 */
export async function createRecyclingRequest(req: Request, res: Response): Promise<void> {
  try {
    const { patientId, pharmacyId, medications, notes } = req.body;

    // Validate required fields
    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    if (!pharmacyId) {
      res.status(400).json({ error: 'pharmacyId is required' });
      return;
    }

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      res.status(400).json({ error: 'medications array is required and must not be empty' });
      return;
    }

    // Validate medication objects
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      if (!med.name || !med.unit || med.quantity === undefined || !med.expiryDate) {
        res.status(400).json({
          error: `Medication ${i} must have name, unit, quantity, and expiryDate`,
        });
        return;
      }
    }

    const result = recyclingService.createRecyclingRequest({
      patientId,
      pharmacyId,
      medications,
      notes,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Recycling request created successfully',
    });
  } catch (error: any) {
    console.error('[Recycling Controller] Create request error:', error);
    res.status(500).json({
      error: 'Failed to create recycling request',
      message: error.message,
    });
  }
}

/**
 * GET /api/recycling/:id
 * Get recycling request details
 */
export async function getRecyclingRequest(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Request ID is required' });
      return;
    }

    const request = recyclingService.getRecyclingRequest(id);

    if (!request) {
      res.status(404).json({ error: 'Recycling request not found' });
      return;
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error: any) {
    console.error('[Recycling Controller] Get request error:', error);
    res.status(500).json({
      error: 'Failed to retrieve recycling request',
      message: error.message,
    });
  }
}

/**
 * GET /api/recycling/patient/:patientId
 * Get all recycling requests for a patient
 */
export async function getPatientRequests(req: Request, res: Response): Promise<void> {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      res.status(400).json({ error: 'Patient ID is required' });
      return;
    }

    const requests = recyclingService.getPatientRequests(patientId);

    res.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error: any) {
    console.error('[Recycling Controller] Get patient requests error:', error);
    res.status(500).json({
      error: 'Failed to retrieve patient recycling requests',
      message: error.message,
    });
  }
}

/**
 * GET /api/recycling/pharmacy/:pharmacyId
 * Get all recycling requests for a pharmacy
 */
export async function getPharmacyRequests(req: Request, res: Response): Promise<void> {
  try {
    const { pharmacyId } = req.params;

    if (!pharmacyId) {
      res.status(400).json({ error: 'Pharmacy ID is required' });
      return;
    }

    const requests = recyclingService.getPharmacyRequests(pharmacyId);

    res.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error: any) {
    console.error('[Recycling Controller] Get pharmacy requests error:', error);
    res.status(500).json({
      error: 'Failed to retrieve pharmacy recycling requests',
      message: error.message,
    });
  }
}

/**
 * GET /api/recycling/driver/:driverId/pending
 * Get pending recycling pickups for a driver
 */
export async function getDriverPendingPickups(req: Request, res: Response): Promise<void> {
  try {
    const { driverId } = req.params;

    if (!driverId) {
      res.status(400).json({ error: 'Driver ID is required' });
      return;
    }

    const requests = recyclingService.getDriverPendingPickups(driverId);

    res.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error: any) {
    console.error('[Recycling Controller] Get driver pickups error:', error);
    res.status(500).json({
      error: 'Failed to retrieve driver pending pickups',
      message: error.message,
    });
  }
}

/**
 * PATCH /api/recycling/:id/assign-driver
 * Assign a driver to a recycling request
 */
export async function assignDriver(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Request ID is required' });
      return;
    }

    if (!driverId) {
      res.status(400).json({ error: 'Driver ID is required' });
      return;
    }

    const result = recyclingService.assignDriverToRequest(id, driverId);

    if (!result.success) {
      res.status(400).json({
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Driver assigned successfully',
    });
  } catch (error: any) {
    console.error('[Recycling Controller] Assign driver error:', error);
    res.status(500).json({
      error: 'Failed to assign driver',
      message: error.message,
    });
  }
}

/**
 * PATCH /api/recycling/:id/collect
 * Record medication collection by driver
 */
export async function recordCollection(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Request ID is required' });
      return;
    }

    if (!driverId) {
      res.status(400).json({ error: 'Driver ID is required' });
      return;
    }

    const result = recyclingService.recordCollection(id, driverId);

    if (!result.success) {
      res.status(400).json({
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Collection recorded successfully',
    });
  } catch (error: any) {
    console.error('[Recycling Controller] Record collection error:', error);
    res.status(500).json({
      error: 'Failed to record collection',
      message: error.message,
    });
  }
}

/**
 * PATCH /api/recycling/:id/process
 * Process collected medications
 */
export async function processCollection(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Request ID is required' });
      return;
    }

    const result = recyclingService.processCollection(id);

    if (!result.success) {
      res.status(400).json({
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Collection processed successfully',
    });
  } catch (error: any) {
    console.error('[Recycling Controller] Process collection error:', error);
    res.status(500).json({
      error: 'Failed to process collection',
      message: error.message,
    });
  }
}

/**
 * PATCH /api/recycling/:id/cancel
 * Cancel a recycling request
 */
export async function cancelRequest(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Request ID is required' });
      return;
    }

    const result = recyclingService.cancelRequest(id);

    if (!result.success) {
      res.status(400).json({
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Request cancelled successfully',
    });
  } catch (error: any) {
    console.error('[Recycling Controller] Cancel request error:', error);
    res.status(500).json({
      error: 'Failed to cancel request',
      message: error.message,
    });
  }
}

/**
 * GET /api/recycling/report/pharmacy/:pharmacyId
 * Get recycling reports for a pharmacy
 */
export async function getPharmacyReports(req: Request, res: Response): Promise<void> {
  try {
    const { pharmacyId } = req.params;
    const { month, year } = req.query;

    if (!pharmacyId) {
      res.status(400).json({ error: 'Pharmacy ID is required' });
      return;
    }

    let reports;

    if (month && year) {
      // Get specific month report
      const monthStr = String(month).padStart(2, '0');
      const report = recyclingService.getPharmacyReport(pharmacyId, monthStr, Number(year));
      reports = [report];
    } else {
      // Get all reports for pharmacy
      reports = recyclingService.getPharmacyReports(pharmacyId);
    }

    res.json({
      success: true,
      data: reports,
      count: reports.length,
    });
  } catch (error: any) {
    console.error('[Recycling Controller] Get reports error:', error);
    res.status(500).json({
      error: 'Failed to retrieve recycling reports',
      message: error.message,
    });
  }
}

/**
 * Sanitize recycling request for API response
 */
function sanitizeRequest(request: any): any {
  return {
    id: request.id,
    patientId: request.patientId,
    pharmacyId: request.pharmacyId,
    medications: request.medications,
    status: request.status,
    driverId: request.driverId,
    requestedAt: request.requestedAt,
    collectedAt: request.collectedAt,
    processedAt: request.processedAt,
    notes: request.notes,
    totalQuantity: request.getTotalQuantity?.() || 0,
    hasExpiredMeds: request.hasExpiredMedications?.() || false,
    ageInDays: request.getAgeInDays?.() || 0,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}
