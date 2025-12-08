/**
 * Recycling Types and Interfaces (Patient App)
 * T5-052: Medication Return/Recycling Feature
 */

export type RecyclingRequestStatus = 'pending' | 'assigned' | 'collected' | 'processed' | 'cancelled';

export interface Medication {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  batchNumber?: string;
  storageConditions?: string;
}

export interface RecyclingRequest {
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
}

export interface RecyclingRequestFormData {
  medications: Medication[];
  notes?: string;
}
