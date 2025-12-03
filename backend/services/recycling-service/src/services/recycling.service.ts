/**
 * Recycling Service
 * Business logic for medication recycling workflow
 */

import { RecyclingRequest, RecyclingRequestStatus, Medication, RecyclingReport } from '../types/recycling';
import { RecyclingRequestModel } from '../models/RecyclingRequest';
import recyclingRepository from '../repositories/RecyclingRepository';

export class RecyclingService {
  /**
   * Create a new recycling request from patient
   */
  createRecyclingRequest(data: {
    patientId: string;
    pharmacyId: string;
    medications: Medication[];
    notes?: string;
  }): { success: boolean; data?: RecyclingRequest; error?: string } {
    try {
      // Validate input
      if (!data.patientId) {
        return { success: false, error: 'Patient ID is required' };
      }
      if (!data.pharmacyId) {
        return { success: false, error: 'Pharmacy ID is required' };
      }
      if (!data.medications || data.medications.length === 0) {
        return { success: false, error: 'At least one medication is required' };
      }

      // Create request model
      const request = new RecyclingRequestModel(data);

      // Validate the request
      const validation = request.validate();
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      // Save to repository
      const savedRequest = recyclingRepository.create(request);

      return { success: true, data: savedRequest };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recycling request by ID
   */
  getRecyclingRequest(requestId: string): RecyclingRequest | null {
    return recyclingRepository.findById(requestId);
  }

  /**
   * Get all requests for a patient
   */
  getPatientRequests(patientId: string): RecyclingRequest[] {
    return recyclingRepository.findByPatientId(patientId);
  }

  /**
   * Get all requests for a pharmacy
   */
  getPharmacyRequests(pharmacyId: string): RecyclingRequest[] {
    return recyclingRepository.findByPharmacyId(pharmacyId);
  }

  /**
   * Get pending requests for a driver
   */
  getDriverPendingPickups(driverId: string): RecyclingRequest[] {
    return recyclingRepository.findPendingByDriverId(driverId);
  }

  /**
   * Assign a driver to a recycling request
   */
  assignDriverToRequest(requestId: string, driverId: string): { success: boolean; data?: RecyclingRequest; error?: string } {
    try {
      if (!requestId) {
        return { success: false, error: 'Request ID is required' };
      }
      if (!driverId) {
        return { success: false, error: 'Driver ID is required' };
      }

      const request = recyclingRepository.findById(requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }

      if (request.status !== 'pending') {
        return { success: false, error: `Cannot assign driver to ${request.status} request` };
      }

      const updatedRequest = recyclingRepository.assignDriver(requestId, driverId);
      return { success: true, data: updatedRequest || undefined };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Record medication collection by driver
   */
  recordCollection(requestId: string, driverId: string): { success: boolean; data?: RecyclingRequest; error?: string } {
    try {
      if (!requestId) {
        return { success: false, error: 'Request ID is required' };
      }
      if (!driverId) {
        return { success: false, error: 'Driver ID is required' };
      }

      const request = recyclingRepository.findById(requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }

      if (request.status !== 'assigned') {
        return { success: false, error: `Cannot collect from ${request.status} request, must be assigned first` };
      }

      if (request.driverId !== driverId) {
        return { success: false, error: 'Only assigned driver can confirm collection' };
      }

      const updatedRequest = recyclingRepository.markAsCollected(requestId);
      return { success: true, data: updatedRequest || undefined };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Process collected medications (pharmacy operation)
   */
  processCollection(requestId: string): { success: boolean; data?: RecyclingRequest; error?: string } {
    try {
      if (!requestId) {
        return { success: false, error: 'Request ID is required' };
      }

      const request = recyclingRepository.findById(requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }

      if (request.status !== 'collected') {
        return { success: false, error: `Cannot process ${request.status} request, must be collected first` };
      }

      const updatedRequest = recyclingRepository.markAsProcessed(requestId);

      // Update inventory with returned medications
      this.updateInventoryWithReturnedMeds(request);

      return { success: true, data: updatedRequest || undefined };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel a recycling request
   */
  cancelRequest(requestId: string): { success: boolean; data?: RecyclingRequest; error?: string } {
    try {
      if (!requestId) {
        return { success: false, error: 'Request ID is required' };
      }

      const request = recyclingRepository.findById(requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }

      if (request.status === 'processed' || request.status === 'collected') {
        return { success: false, error: 'Cannot cancel processed or collected requests' };
      }

      const updatedRequest = recyclingRepository.updateStatus(requestId, 'cancelled');
      return { success: true, data: updatedRequest || undefined };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recycling report for pharmacy
   */
  getPharmacyReport(pharmacyId: string, month: string, year: number): RecyclingReport {
    return recyclingRepository.generateMonthlyReport(pharmacyId, month, year);
  }

  /**
   * Get all reports for a pharmacy
   */
  getPharmacyReports(pharmacyId: string): RecyclingReport[] {
    return Array.from(
      new Map(
        recyclingRepository.findAll()
          .filter(r => r.pharmacyId === pharmacyId && r.status === 'processed')
          .map(r => {
            const date = new Date(r.processedAt || r.createdAt);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return [`${pharmacyId}-${month}-${year}`, { month, year, pharmacyId }];
          })
      ).values()
    ).map(({ month, year, pharmacyId }) =>
      recyclingRepository.generateMonthlyReport(pharmacyId, month, year)
    );
  }

  /**
   * Update inventory with returned medications
   * In production, this would integrate with the inventory service
   */
  private updateInventoryWithReturnedMeds(request: RecyclingRequest): void {
    // Log the update
    console.log(
      `[Recycling Service] Updating inventory for pharmacy ${request.pharmacyId} with ${request.medications.length} medications`
    );

    // In production, this would call the inventory service API
    // For now, we just log the action
    request.medications.forEach(med => {
      console.log(
        `[Recycling Service] Returning ${med.quantity} ${med.unit} of ${med.name} (Expired: ${med.expiryDate})`
      );
    });
  }
}

// Export singleton instance
export default new RecyclingService();
