/**
 * Patient Search Utilities Unit Tests
 * Tests for search, filter, and formatting utilities
 */

import {
  searchPatients,
  getActiveMedicationsCount,
  formatDOB,
  getLastVisitDate,
  getUnitFromRoom,
} from '../patientSearchUtils';
import { Patient } from '../../types/nurse';

describe('patientSearchUtils', () => {
  const mockPatient1: Patient = {
    id: 'P001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1960-05-15',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension'],
    currentMedications: [
      {
        id: 'M1',
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'daily',
        route: 'oral',
        startDate: '2024-01-01',
        prescribedBy: 'Dr. Smith',
      },
    ],
    roomNumber: '101',
    admissionDate: '2024-12-01',
  };

  const mockPatient2: Patient = {
    id: 'P002',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1970-08-22',
    allergies: [],
    chronicConditions: ['Diabetes'],
    currentMedications: [
      {
        id: 'M2',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice daily',
        route: 'oral',
        startDate: '2024-06-15',
        prescribedBy: 'Dr. Johnson',
      },
    ],
    roomNumber: '102',
  };

  const mockPatient3: Patient = {
    id: 'P003',
    firstName: 'Robert',
    lastName: 'Brown',
    dateOfBirth: '1945-03-10',
    allergies: [],
    chronicConditions: [],
    currentMedications: [],
    roomNumber: '201',
  };

  describe('searchPatients', () => {
    const patients = [mockPatient1, mockPatient2, mockPatient3];

    describe('search by query', () => {
      it('should search by patient first name', () => {
        const results = searchPatients(patients, 'John', {});
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(mockPatient1);
      });

      it('should search by patient last name', () => {
        const results = searchPatients(patients, 'Smith', {});
        expect(results).toHaveLength(1);
        expect(results).toContainEqual(mockPatient2);
      });

      it('should search by full name', () => {
        const results = searchPatients(patients, 'Jane Smith', {});
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(mockPatient2);
      });

      it('should search by patient ID', () => {
        const results = searchPatients(patients, 'P001', {});
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(mockPatient1);
      });

      it('should search by date of birth', () => {
        const results = searchPatients(patients, '1960-05-15', {});
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(mockPatient1);
      });

      it('should search by room number', () => {
        const results = searchPatients(patients, '101', {});
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(mockPatient1);
      });

      it('should be case insensitive', () => {
        const results = searchPatients(patients, 'john doe', {});
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(mockPatient1);
      });

      it('should return empty results for non-matching query', () => {
        const results = searchPatients(patients, 'NonExistent', {});
        expect(results).toHaveLength(0);
      });

      it('should ignore whitespace in query', () => {
        const results = searchPatients(patients, '  Jane  ', {});
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(mockPatient2);
      });
    });

    describe('filter by unit', () => {
      it('should filter by unit 1', () => {
        const results = searchPatients(patients, '', { unit: '1' });
        expect(results).toHaveLength(2);
        expect(results).toContainEqual(mockPatient1);
        expect(results).toContainEqual(mockPatient2);
      });

      it('should filter by unit 2', () => {
        const results = searchPatients(patients, '', { unit: '2' });
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(mockPatient3);
      });

      it('should return empty results for non-matching unit', () => {
        const results = searchPatients(patients, '', { unit: '9' });
        expect(results).toHaveLength(0);
      });
    });

    describe('filter by medication status', () => {
      it('should filter by active medications', () => {
        const results = searchPatients(patients, '', { medicationStatus: 'active' });
        expect(results).toHaveLength(2);
        expect(results).toContainEqual(mockPatient1);
        expect(results).toContainEqual(mockPatient2);
      });

      it('should filter by inactive medications', () => {
        const results = searchPatients(patients, '', { medicationStatus: 'inactive' });
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(mockPatient3);
      });

      it('should return all patients for all status', () => {
        const results = searchPatients(patients, '', { medicationStatus: 'all' });
        expect(results).toHaveLength(3);
      });
    });

    describe('sort results', () => {
      it('should sort by name', () => {
        const results = searchPatients(patients, '', { sortBy: 'name' });
        expect(results[0].firstName).toBe('Jane');
        expect(results[1].firstName).toBe('John');
        expect(results[2].firstName).toBe('Robert');
      });

      it('should sort by room number', () => {
        const results = searchPatients(patients, '', { sortBy: 'room' });
        expect(results[0].roomNumber).toBe('101');
        expect(results[1].roomNumber).toBe('102');
        expect(results[2].roomNumber).toBe('201');
      });

      it('should preserve order for recent sort', () => {
        const results = searchPatients(patients, '', { sortBy: 'recent' });
        expect(results).toEqual(patients);
      });
    });

    describe('combined filters', () => {
      it('should filter by unit and medication status', () => {
        const results = searchPatients(patients, '', {
          unit: '1',
          medicationStatus: 'active',
        });
        expect(results).toHaveLength(2);
        expect(results).toContainEqual(mockPatient1);
        expect(results).toContainEqual(mockPatient2);
      });

      it('should search and filter by unit', () => {
        const results = searchPatients(patients, 'Smith', {
          unit: '1',
        });
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(mockPatient2);
      });

      it('should apply all filters together', () => {
        const results = searchPatients(patients, 'Smith', {
          unit: '1',
          medicationStatus: 'active',
          sortBy: 'name',
        });
        expect(results).toHaveLength(1);
        expect(results[0].firstName).toBe('Jane');
      });
    });
  });

  describe('getActiveMedicationsCount', () => {
    it('should count active medications', () => {
      const count = getActiveMedicationsCount(mockPatient1);
      expect(count).toBe(1);
    });

    it('should return 0 for patient with no medications', () => {
      const count = getActiveMedicationsCount(mockPatient3);
      expect(count).toBe(0);
    });

    it('should exclude medications with endDate', () => {
      const patientWithEndedMed: Patient = {
        ...mockPatient1,
        currentMedications: [
          {
            id: 'M1',
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'daily',
            route: 'oral',
            startDate: '2024-01-01',
            endDate: '2024-12-01',
            prescribedBy: 'Dr. Smith',
          },
        ],
      };
      const count = getActiveMedicationsCount(patientWithEndedMed);
      expect(count).toBe(0);
    });

    it('should count multiple active medications', () => {
      const patientWithMultipleMeds: Patient = {
        ...mockPatient1,
        currentMedications: [
          {
            id: 'M1',
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'daily',
            route: 'oral',
            startDate: '2024-01-01',
            prescribedBy: 'Dr. Smith',
          },
          {
            id: 'M2',
            name: 'Aspirin',
            dosage: '81mg',
            frequency: 'daily',
            route: 'oral',
            startDate: '2024-06-01',
            prescribedBy: 'Dr. Smith',
          },
        ],
      };
      const count = getActiveMedicationsCount(patientWithMultipleMeds);
      expect(count).toBe(2);
    });
  });

  describe('formatDOB', () => {
    it('should format date of birth correctly', () => {
      const formatted = formatDOB('1960-05-15');
      expect(formatted).toContain('May');
      expect(formatted).toContain('15');
      expect(formatted).toContain('1960');
    });

    it('should handle invalid dates gracefully', () => {
      const formatted = formatDOB('invalid-date');
      expect(formatted).toBe('invalid-date');
    });

    it('should handle ISO date format', () => {
      const formatted = formatDOB('1970-08-22');
      expect(formatted).toContain('Aug');
      expect(formatted).toContain('22');
    });
  });

  describe('getLastVisitDate', () => {
    it('should return formatted admission date', () => {
      const lastVisit = getLastVisitDate(mockPatient1);
      expect(lastVisit).toContain('Dec');
      expect(lastVisit).toContain('2024');
    });

    it('should return N/A if no admission date', () => {
      const lastVisit = getLastVisitDate(mockPatient3);
      expect(lastVisit).toBe('N/A');
    });
  });

  describe('getUnitFromRoom', () => {
    it('should extract unit number from room number', () => {
      const unit = getUnitFromRoom('101');
      expect(unit).toBe('Unit 1');
    });

    it('should handle different unit numbers', () => {
      const unit2 = getUnitFromRoom('201');
      expect(unit2).toBe('Unit 2');

      const unit3 = getUnitFromRoom('305');
      expect(unit3).toBe('Unit 3');
    });

    it('should return empty string for undefined room', () => {
      const unit = getUnitFromRoom(undefined);
      expect(unit).toBe('');
    });

    it('should return empty string for empty room number', () => {
      const unit = getUnitFromRoom('');
      expect(unit).toBe('');
    });
  });
});
