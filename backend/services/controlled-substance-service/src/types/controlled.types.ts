/**
 * Controlled Substance Types
 * Swiss Swissmedic drug schedules and regulations
 */

export enum DrugSchedule {
  LISTE_A = 'A', // Narcotic substances (morphine, fentanyl, heroin)
  LISTE_B = 'B', // Strong psychotropics (benzodiazepines, stimulants)
  LISTE_C = 'C', // Other prescription drugs with abuse potential
  LISTE_D = 'D', // OTC with pharmacist advice required
  LISTE_E = 'E'  // Free sale OTC
}

export enum DispensationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DISPENSED = 'DISPENSED',
  PARTIALLY_DISPENSED = 'PARTIALLY_DISPENSED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AlertType {
  FREQUENCY_ABUSE = 'FREQUENCY_ABUSE',           // Too frequent dispensations
  MULTI_PHARMACY = 'MULTI_PHARMACY',             // Doctor shopping
  DOSAGE_ABUSE = 'DOSAGE_ABUSE',                 // Exceeds recommended dosage
  SUPPLY_LIMIT = 'SUPPLY_LIMIT',                 // Exceeds max supply limit
  INTERACTION = 'INTERACTION',                   // Drug interaction detected
  PATIENT_RESTRICTION = 'PATIENT_RESTRICTION',   // Patient on restriction list
  PRESCRIBER_ISSUE = 'PRESCRIBER_ISSUE'          // Prescriber validation issue
}

export interface ControlledSubstanceData {
  id: string;
  name: string;
  scientificName: string;
  schedule: DrugSchedule;
  maxSupplyDays: number; // e.g., 30 days for Liste A
  requiresSpecialForm: boolean; // Special prescription form requirement
  crossPharmacyCheck: boolean; // Check across all pharmacies
  description?: string;
  swissmedic: {
    number?: string; // Swissmedic registration number
    atc?: string;    // ATC classification
  };
}

export interface PrescriptionValidationRequest {
  prescriptionId: string;
  patientId: string;
  prescriberId: string;
  pharmacyId: string;
  substanceId: string;
  quantity: number;
  dosagePerUnit: number; // mg or other unit
  unit: string; // mg, ml, etc.
  daysSupply: number;
  prescriptionDate: Date;
  specialFormNumber?: string; // For Liste A/B
}

export interface PrescriptionValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  requiresPharmacistReview: boolean;
  alerts: Alert[];
}

export interface DispensationLogEntry {
  id: string;
  prescriptionId: string;
  patientId: string;
  pharmacyId: string;
  pharmacistId: string;
  substanceId: string;
  quantityDispensed: number;
  unit: string;
  dosagePerUnit: number;
  daysSupply: number;
  dispensedDate: Date;
  status: DispensationStatus;
  notes?: string;
  batchNumber?: string; // For traceability
  expirationDate?: Date;
  specialFormNumber?: string; // Recorded form number for Liste A/B
}

export interface PatientControlledHistory {
  patientId: string;
  substance: ControlledSubstanceData;
  totalQuantityDispensed: number;
  lastDispensedDate?: Date;
  dispensationCount: number;
  frequencyPerMonth: number;
  averageSupplyDays: number;
  flags: Alert[];
  restrictions?: PatientRestriction[];
}

export interface PatientRestriction {
  id: string;
  patientId: string;
  substanceId: string;
  reason: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  createdBy: string; // Admin/pharmacist ID
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  patientId: string;
  substanceId?: string;
  pharmacyId?: string;
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ComplianceReport {
  id: string;
  pharmacyId: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  totalDispensations: number;
  substanceBreakdown: {
    [substanceId: string]: {
      name: string;
      schedule: DrugSchedule;
      count: number;
      totalQuantity: number;
    };
  };
  flaggedPatients: Array<{
    patientId: string;
    alertCount: number;
    alerts: Alert[];
  }>;
  complianceIssues: string[];
  generatedAt: Date;
}

export interface SwissmedecReportingData {
  pharmacyId: string;
  pharmacyName: string;
  reportingPeriod: {
    year: number;
    quarter: number;
  };
  dispensations: DispensationLogEntry[];
  totalDispensations: number;
  substancesSummary: Array<{
    substanceId: string;
    substanceName: string;
    schedule: DrugSchedule;
    dispensationCount: number;
    totalQuantity: number;
  }>;
  flags: Alert[];
  submissionDate?: Date;
}

export interface ValidationRule {
  schedule: DrugSchedule;
  maxSupplyDays: number;
  requiresSpecialForm: boolean;
  maxDailyDosage?: number;
  warningDailyDosage?: number;
}
