/**
 * Recycling Types and Interfaces
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

export interface RecyclingReport {
  id: string;
  pharmacyId: string;
  month: string;
  year: number;
  totalRequests: number;
  totalMedicationsCollected: number;
  totalQuantityCollected: number;
  environmentalImpact: {
    wastePreventedKg: number;
    carbonFootprintReduction: number;
  };
  createdAt: string;
}

export interface RecyclingRequestRow {
  id: string;
  patientId: string;
  pharmacyId: string;
  medications: string;
  status: RecyclingRequestStatus;
  driverId?: string;
  requestedAt: string;
  collectedAt?: string;
  processedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecyclingReportRow {
  id: string;
  pharmacyId: string;
  month: string;
  year: number;
  totalRequests: number;
  totalMedicationsCollected: number;
  totalQuantityCollected: number;
  wastePreventedKg: number;
  carbonFootprintReduction: number;
  createdAt: string;
}

/**
 * Convert database row to RecyclingRequest model
 */
export function rowToRecyclingRequest(row: RecyclingRequestRow): RecyclingRequest {
  return {
    id: row.id,
    patientId: row.patientId,
    pharmacyId: row.pharmacyId,
    medications: JSON.parse(row.medications || '[]'),
    status: row.status,
    driverId: row.driverId,
    requestedAt: row.requestedAt,
    collectedAt: row.collectedAt,
    processedAt: row.processedAt,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Convert database row to RecyclingReport model
 */
export function rowToRecyclingReport(row: RecyclingReportRow): RecyclingReport {
  return {
    id: row.id,
    pharmacyId: row.pharmacyId,
    month: row.month,
    year: row.year,
    totalRequests: row.totalRequests,
    totalMedicationsCollected: row.totalMedicationsCollected,
    totalQuantityCollected: row.totalQuantityCollected,
    environmentalImpact: {
      wastePreventedKg: row.wastePreventedKg,
      carbonFootprintReduction: row.carbonFootprintReduction,
    },
    createdAt: row.createdAt,
  };
}
