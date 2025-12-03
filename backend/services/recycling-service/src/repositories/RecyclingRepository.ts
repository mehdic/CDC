/**
 * Recycling Repository
 * Data access layer for recycling request operations
 */

import { RecyclingRequest, RecyclingRequestStatus, RecyclingReport, rowToRecyclingRequest, rowToRecyclingReport, RecyclingRequestRow, RecyclingReportRow } from '../types/recycling';

export class RecyclingRepository {
  /**
   * Mock database implementation
   * In production, this would use a real database
   */
  private requests: Map<string, RecyclingRequest> = new Map();
  private reports: Map<string, RecyclingReport> = new Map();

  /**
   * Create a new recycling request
   */
  create(request: RecyclingRequest): RecyclingRequest {
    this.requests.set(request.id, { ...request });
    return request;
  }

  /**
   * Find recycling request by ID
   */
  findById(id: string): RecyclingRequest | null {
    return this.requests.get(id) || null;
  }

  /**
   * Find all recycling requests for a patient
   */
  findByPatientId(patientId: string): RecyclingRequest[] {
    return Array.from(this.requests.values()).filter(r => r.patientId === patientId);
  }

  /**
   * Find all recycling requests for a pharmacy
   */
  findByPharmacyId(pharmacyId: string): RecyclingRequest[] {
    return Array.from(this.requests.values()).filter(r => r.pharmacyId === pharmacyId);
  }

  /**
   * Find all pending recycling requests for a driver
   */
  findPendingByDriverId(driverId: string): RecyclingRequest[] {
    return Array.from(this.requests.values()).filter(
      r => r.driverId === driverId && r.status === 'assigned'
    );
  }

  /**
   * Find all requests by status
   */
  findByStatus(status: RecyclingRequestStatus): RecyclingRequest[] {
    return Array.from(this.requests.values()).filter(r => r.status === status);
  }

  /**
   * Find all recycling requests
   */
  findAll(): RecyclingRequest[] {
    return Array.from(this.requests.values());
  }

  /**
   * Update recycling request
   */
  update(id: string, updates: Partial<RecyclingRequest>): RecyclingRequest | null {
    const request = this.requests.get(id);
    if (!request) {
      return null;
    }

    const updatedRequest: RecyclingRequest = {
      ...request,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.requests.set(id, updatedRequest);
    return updatedRequest;
  }

  /**
   * Update request status
   */
  updateStatus(id: string, status: RecyclingRequestStatus): RecyclingRequest | null {
    return this.update(id, { status });
  }

  /**
   * Assign driver to request
   */
  assignDriver(id: string, driverId: string): RecyclingRequest | null {
    return this.update(id, { driverId, status: 'assigned' });
  }

  /**
   * Mark request as collected
   */
  markAsCollected(id: string): RecyclingRequest | null {
    return this.update(id, {
      status: 'collected',
      collectedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark request as processed
   */
  markAsProcessed(id: string): RecyclingRequest | null {
    return this.update(id, {
      status: 'processed',
      processedAt: new Date().toISOString(),
    });
  }

  /**
   * Delete recycling request
   */
  delete(id: string): boolean {
    return this.requests.delete(id);
  }

  /**
   * Create recycling report
   */
  createReport(report: RecyclingReport): RecyclingReport {
    this.reports.set(report.id, { ...report });
    return report;
  }

  /**
   * Find report by ID
   */
  findReportById(id: string): RecyclingReport | null {
    return this.reports.get(id) || null;
  }

  /**
   * Find reports by pharmacy and month
   */
  findReportsByPharmacyAndMonth(pharmacyId: string, month: string, year: number): RecyclingReport | null {
    return (
      Array.from(this.reports.values()).find(
        r => r.pharmacyId === pharmacyId && r.month === month && r.year === year
      ) || null
    );
  }

  /**
   * Generate or update monthly report for pharmacy
   */
  generateMonthlyReport(pharmacyId: string, month: string, year: number): RecyclingReport {
    const key = `${pharmacyId}-${month}-${year}`;
    const existingReport = this.findReportsByPharmacyAndMonth(pharmacyId, month, year);

    // Get all requests from this month
    const monthRequests = this.findByPharmacyId(pharmacyId).filter(req => {
      const reqDate = new Date(req.createdAt);
      return (
        reqDate.getMonth() === new Date(`${year}-${month}-01`).getMonth() &&
        reqDate.getFullYear() === year &&
        req.status === 'processed'
      );
    });

    const totalRequests = monthRequests.length;
    const totalMedicationsCollected = monthRequests.reduce(
      (sum, req) => sum + req.medications.length,
      0
    );
    const totalQuantityCollected = monthRequests.reduce(
      (sum, req) => sum + req.medications.reduce((q, m) => q + m.quantity, 0),
      0
    );

    // Calculate environmental impact
    // Assume: 1 medication unit = 0.005 kg of waste prevented
    const wastePreventedKg = totalQuantityCollected * 0.005;
    // Assume: 0.5 kg CO2 equivalent per kg of waste prevented
    const carbonFootprintReduction = wastePreventedKg * 0.5;

    const report: RecyclingReport = existingReport || {
      id: key,
      pharmacyId,
      month,
      year,
      totalRequests: 0,
      totalMedicationsCollected: 0,
      totalQuantityCollected: 0,
      environmentalImpact: {
        wastePreventedKg: 0,
        carbonFootprintReduction: 0,
      },
      createdAt: new Date().toISOString(),
    };

    report.totalRequests = totalRequests;
    report.totalMedicationsCollected = totalMedicationsCollected;
    report.totalQuantityCollected = totalQuantityCollected;
    report.environmentalImpact.wastePreventedKg = wastePreventedKg;
    report.environmentalImpact.carbonFootprintReduction = carbonFootprintReduction;

    this.createReport(report);
    return report;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.requests.clear();
    this.reports.clear();
  }
}

// Export singleton instance
export default new RecyclingRepository();
