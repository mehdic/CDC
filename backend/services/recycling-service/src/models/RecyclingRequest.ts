/**
 * Recycling Request Model
 * Represents a medication recycling/return request
 */

import { RecyclingRequest, RecyclingRequestStatus, Medication } from '../types/recycling';
import { v4 as uuidv4 } from 'uuid';

export class RecyclingRequestModel implements RecyclingRequest {
  id: string;
  patientId: string;
  pharmacyId: string;
  medications: Medication[];
  status: RecyclingRequestStatus;
  driverId?: string;
  requestedAt: string;
  collectedAt?: string;
  processedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  constructor(data: {
    patientId: string;
    pharmacyId: string;
    medications: Medication[];
    notes?: string;
  }) {
    this.id = uuidv4();
    this.patientId = data.patientId;
    this.pharmacyId = data.pharmacyId;
    this.medications = data.medications;
    this.status = 'pending';
    this.notes = data.notes;
    this.requestedAt = new Date().toISOString();
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Assign a driver to this recycling request
   */
  assignDriver(driverId: string): void {
    this.driverId = driverId;
    this.status = 'assigned';
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark as collected by driver
   */
  markAsCollected(): void {
    if (this.status !== 'assigned') {
      throw new Error('Request must be assigned to driver before collection');
    }
    this.status = 'collected';
    this.collectedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark as processed by pharmacy
   */
  markAsProcessed(): void {
    if (this.status !== 'collected') {
      throw new Error('Request must be collected before processing');
    }
    this.status = 'processed';
    this.processedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Cancel the recycling request
   */
  cancel(): void {
    if (this.status === 'processed' || this.status === 'collected') {
      throw new Error('Cannot cancel a request that has been collected or processed');
    }
    this.status = 'cancelled';
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get total quantity of medications
   */
  getTotalQuantity(): number {
    return this.medications.reduce((sum, med) => sum + med.quantity, 0);
  }

  /**
   * Get request age in days
   */
  getAgeInDays(): number {
    const createdDate = new Date(this.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if request has expired medications
   */
  hasExpiredMedications(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.medications.some(med => med.expiryDate < today);
  }

  /**
   * Validate request data
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.patientId) {
      errors.push('Patient ID is required');
    }

    if (!this.pharmacyId) {
      errors.push('Pharmacy ID is required');
    }

    if (!this.medications || this.medications.length === 0) {
      errors.push('At least one medication is required');
    }

    this.medications.forEach((med, index) => {
      if (!med.name) {
        errors.push(`Medication ${index} name is required`);
      }
      if (med.quantity <= 0) {
        errors.push(`Medication ${index} quantity must be positive`);
      }
      if (!med.unit) {
        errors.push(`Medication ${index} unit is required`);
      }
      if (!med.expiryDate) {
        errors.push(`Medication ${index} expiry date is required`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
