/**
 * Pharmacy Record Utilities
 * Helper functions for formatting and processing pharmacy patient records
 */

import { format, parseISO } from 'date-fns';
import type { PharmacyPatientRecord } from '../types/nurse';

/**
 * Format date for display
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  } catch {
    return dateString;
  }
}

/**
 * Get medication history grouped by pharmacy
 */
export function groupMedicationsByPharmacy(
  records: PharmacyPatientRecord[]
): Map<string, PharmacyPatientRecord['medicationHistory']> {
  const grouped = new Map<string, PharmacyPatientRecord['medicationHistory']>();

  records.forEach((record) => {
    const existing = grouped.get(record.pharmacyName) || [];
    grouped.set(record.pharmacyName, [...existing, ...record.medicationHistory]);
  });

  return grouped;
}

/**
 * Get all unique allergies from pharmacy records
 */
export function getAllergiesFromRecords(records: PharmacyPatientRecord[]): string[] {
  const allergies = new Set<string>();
  records.forEach((record) => {
    record.allergies.forEach((allergy) => allergies.add(allergy));
  });
  return Array.from(allergies).sort();
}

/**
 * Get all unique interactions from pharmacy records
 */
export function getInteractionsFromRecords(records: PharmacyPatientRecord[]): string[] {
  const interactions = new Set<string>();
  records.forEach((record) => {
    record.interactions.forEach((interaction) => interactions.add(interaction));
  });
  return Array.from(interactions).sort();
}

/**
 * Sort medication history by date (newest first)
 */
export function sortMedicationHistoryByDate(
  history: PharmacyPatientRecord['medicationHistory']
): PharmacyPatientRecord['medicationHistory'] {
  return [...history].sort((a, b) => {
    return new Date(b.dispensedDate).getTime() - new Date(a.dispensedDate).getTime();
  });
}

/**
 * Get recent medication history (last N entries)
 */
export function getRecentMedicationHistory(
  history: PharmacyPatientRecord['medicationHistory'],
  limit: number = 10
): PharmacyPatientRecord['medicationHistory'] {
  return sortMedicationHistoryByDate(history).slice(0, limit);
}

/**
 * Check if medication was recently dispensed (within X days)
 */
export function isRecentlyDispensed(dispensedDate: string, daysThreshold: number = 30): boolean {
  try {
    const date = parseISO(dispensedDate);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= daysThreshold;
  } catch {
    return false;
  }
}

/**
 * Format medication quantity with unit
 */
export function formatMedicationQuantity(quantity: number): string {
  if (Number.isInteger(quantity)) {
    return quantity.toString();
  }
  return quantity.toFixed(2);
}

/**
 * Validate pharmacy record data
 */
export function isValidPharmacyRecord(record: PharmacyPatientRecord): boolean {
  return !!(
    record.id &&
    record.patientId &&
    record.pharmacyId &&
    record.pharmacyName &&
    Array.isArray(record.medicationHistory) &&
    Array.isArray(record.allergies) &&
    Array.isArray(record.interactions) &&
    record.lastUpdated
  );
}

/**
 * Validate medication history entry
 */
export function isValidMedicationHistoryEntry(entry: {
  medicationId: string;
  name: string;
  dispensedDate: string;
  quantity: number;
}): boolean {
  return !!(entry.medicationId && entry.name && entry.dispensedDate && entry.quantity > 0);
}

/**
 * Get medication dispensing summary
 */
export interface MedicationDispensingSummary {
  totalMedicationsDispensed: number;
  recentMedications: number;
  pharmacies: number;
  lastDispensedDate: string | null;
}

export function getMedicationDispensingSummary(
  records: PharmacyPatientRecord[]
): MedicationDispensingSummary {
  if (records.length === 0) {
    return {
      totalMedicationsDispensed: 0,
      recentMedications: 0,
      pharmacies: 0,
      lastDispensedDate: null,
    };
  }

  const allMedications = records.flatMap((r) => r.medicationHistory);
  const allDates = allMedications.map((m) => m.dispensedDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const recentCount = allMedications.filter((m) => isRecentlyDispensed(m.dispensedDate, 30))
    .length;

  return {
    totalMedicationsDispensed: allMedications.length,
    recentMedications: recentCount,
    pharmacies: new Set(records.map((r) => r.pharmacyId)).size,
    lastDispensedDate: allDates[0] || null,
  };
}

/**
 * Check for critical interactions
 */
export function hasCriticalInteractions(interactions: string[]): boolean {
  const criticalKeywords = ['contraindicated', 'severe', 'critical', 'dangerous'];
  return interactions.some((interaction) =>
    criticalKeywords.some((keyword) => interaction.toLowerCase().includes(keyword))
  );
}

/**
 * Check for allergy conflicts with current medications
 */
export function checkAllergyConflicts(
  allergies: string[],
  medications: { name: string }[]
): string[] {
  const conflicts: string[] = [];

  allergies.forEach((allergy) => {
    medications.forEach((medication) => {
      // Simple check - in production, use proper drug interaction database
      if (medication.name.toLowerCase().includes(allergy.toLowerCase())) {
        conflicts.push(`${medication.name} may contain ${allergy}`);
      }
    });
  });

  return conflicts;
}
