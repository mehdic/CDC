/**
 * Patient Search Utilities
 * Helper functions for searching and filtering patients
 */

import { Patient } from '../types/nurse';
import { SearchFilters } from '../store/patientSlice';

/**
 * Search patients by multiple criteria
 * Supports searching by name, ID, date of birth, and room/bed number
 */
export const searchPatients = (
  patients: Patient[],
  query: string,
  filters: SearchFilters
): Patient[] => {
  let results = patients;

  // Filter by search query (name, ID, DOB, room)
  if (query.trim()) {
    const lowerQuery = query.trim().toLowerCase();
    results = results.filter((patient) => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const matchesName = fullName.includes(lowerQuery);
      const matchesId = patient.id.toLowerCase().includes(lowerQuery);
      const matchesDob = patient.dateOfBirth?.toLowerCase().includes(lowerQuery);
      const matchesRoom = patient.roomNumber?.toLowerCase().includes(lowerQuery);

      return matchesName || matchesId || matchesDob || matchesRoom;
    });
  }

  // Filter by unit/ward
  if (filters.unit) {
    // Assuming unit is derived from room number (e.g., "101" -> unit "1")
    results = results.filter((patient) => {
      if (!patient.roomNumber) return false;
      const patientUnit = patient.roomNumber.charAt(0);
      return patientUnit === filters.unit;
    });
  }

  // Filter by medication status
  if (filters.medicationStatus && filters.medicationStatus !== 'all') {
    results = results.filter((patient) => {
      const hasActiveMeds =
        patient.currentMedications && patient.currentMedications.length > 0;
      if (filters.medicationStatus === 'active') {
        return hasActiveMeds;
      } else if (filters.medicationStatus === 'inactive') {
        return !hasActiveMeds;
      }
      return true;
    });
  }

  // Sort results
  if (filters.sortBy) {
    results = sortPatients(results, filters.sortBy);
  }

  return results;
};

/**
 * Sort patients by the specified criteria
 */
const sortPatients = (patients: Patient[], sortBy: 'name' | 'room' | 'recent'): Patient[] => {
  const sorted = [...patients];

  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      break;
    case 'room':
      sorted.sort((a, b) => {
        const roomA = a.roomNumber || '';
        const roomB = b.roomNumber || '';
        return roomA.localeCompare(roomB);
      });
      break;
    case 'recent':
      // Maintain original order for recent (typically already sorted by API)
      break;
  }

  return sorted;
};

/**
 * Get active medications count for a patient
 */
export const getActiveMedicationsCount = (patient: Patient): number => {
  if (!patient.currentMedications) return 0;
  return patient.currentMedications.filter((med) => !med.endDate).length;
};

/**
 * Format date of birth for display
 */
export const formatDOB = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Get last visit date (placeholder - would come from API in real app)
 */
export const getLastVisitDate = (patient: Patient): string => {
  // In a real app, this would come from the patient record
  // For now, using admission date as placeholder
  if (patient.admissionDate) {
    return formatDOB(patient.admissionDate);
  }
  return 'N/A';
};

/**
 * Get unit/ward number from room number
 */
export const getUnitFromRoom = (roomNumber?: string): string => {
  if (!roomNumber) return '';
  return `Unit ${roomNumber.charAt(0)}`;
};
