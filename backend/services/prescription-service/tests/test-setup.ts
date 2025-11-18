/**
 * Test Setup Utilities
 * Mocking for TypeORM entities in tests
 */

import { Prescription } from '../src/models/Prescription';
import { Medication } from '../src/models/Medication';

// In-memory storage for tests
const prescriptions = new Map<string, Prescription>();
const medications = new Map<string, Medication>();

let idCounter = 1;

/**
 * Generate a unique ID for test entities
 */
export function generateTestId(): string {
  return `test-id-${idCounter++}`;
}

/**
 * Create a mock Prescription entity
 */
export function createMockPrescription(data: Partial<Prescription>): Prescription {
  const prescription = new Prescription();
  prescription.id = data.id || generateTestId();
  prescription.patientId = data.patientId || '';
  prescription.doctorId = data.doctorId || '';
  prescription.pharmacyId = data.pharmacyId || '';
  prescription.medications = data.medications || [];
  prescription.status = data.status || 'pending';
  prescription.createdAt = data.createdAt || new Date();
  prescription.updatedAt = data.updatedAt || new Date();
  prescription.dispensedAt = data.dispensedAt;
  return prescription;
}

/**
 * Create a mock Medication entity
 */
export function createMockMedication(data: Partial<Medication>): Medication {
  const medication = new Medication();
  medication.id = data.id || generateTestId();
  medication.name = data.name || '';
  medication.dosage = data.dosage || '';
  medication.quantity = data.quantity || 0;
  medication.instructions = data.instructions || '';
  medication.prescriptionId = data.prescriptionId || '';
  return medication;
}

/**
 * Clear all test data
 */
export function clearTestData(): void {
  prescriptions.clear();
  medications.clear();
  idCounter = 1;
}

/**
 * Get in-memory prescriptions store
 */
export function getTestPrescriptions(): Map<string, Prescription> {
  return prescriptions;
}

/**
 * Get in-memory medications store
 */
export function getTestMedications(): Map<string, Medication> {
  return medications;
}
