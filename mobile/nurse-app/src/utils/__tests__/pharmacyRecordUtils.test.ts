/**
 * Pharmacy Record Utilities Unit Tests
 * Tests for data transformation and formatting functions
 */

import {
  formatDate,
  formatDateTime,
  groupMedicationsByPharmacy,
  getAllergiesFromRecords,
  getInteractionsFromRecords,
  sortMedicationHistoryByDate,
  getRecentMedicationHistory,
  isRecentlyDispensed,
  formatMedicationQuantity,
  isValidPharmacyRecord,
  isValidMedicationHistoryEntry,
  getMedicationDispensingSummary,
  hasCriticalInteractions,
  checkAllergyConflicts,
} from '../pharmacyRecordUtils';
import type { PharmacyPatientRecord } from '../../types/nurse';

describe('pharmacyRecordUtils', () => {
  const mockRecords: PharmacyPatientRecord[] = [
    {
      id: 'PR001',
      patientId: 'P001',
      pharmacyId: 'PH001',
      pharmacyName: 'Main Pharmacy',
      medicationHistory: [
        {
          medicationId: 'M1',
          name: 'Lisinopril',
          dispensedDate: '2024-12-15',
          quantity: 30,
        },
        {
          medicationId: 'M2',
          name: 'Metformin',
          dispensedDate: '2024-12-10',
          quantity: 60,
        },
      ],
      allergies: ['Penicillin', 'Sulfonamides'],
      interactions: ['Lisinopril + NSAIDs: Use with caution', 'Critical: Warfarin + NSAIDs'],
      lastUpdated: '2024-12-15T10:30:00Z',
    },
    {
      id: 'PR002',
      patientId: 'P001',
      pharmacyId: 'PH002',
      pharmacyName: 'Secondary Pharmacy',
      medicationHistory: [
        {
          medicationId: 'M3',
          name: 'Atorvastatin',
          dispensedDate: '2024-12-12',
          quantity: 30,
        },
      ],
      allergies: ['Penicillin'],
      interactions: [],
      lastUpdated: '2024-12-12T14:15:00Z',
    },
  ];

  describe('formatDate', () => {
    it('should format ISO date to readable format', () => {
      const result = formatDate('2024-12-15T10:30:00Z');
      expect(result).toMatch(/Dec 15, 2024/);
    });

    it('should handle undefined date', () => {
      const result = formatDate(undefined);
      expect(result).toBe('N/A');
    });

    it('should handle invalid date', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('invalid-date');
    });
  });

  describe('formatDateTime', () => {
    it('should format ISO datetime with time', () => {
      const result = formatDateTime('2024-12-15T14:30:00Z');
      expect(result).toMatch(/Dec 15, 2024.*[0-9]:[0-9]/);
    });

    it('should handle undefined datetime', () => {
      const result = formatDateTime(undefined);
      expect(result).toBe('N/A');
    });
  });

  describe('groupMedicationsByPharmacy', () => {
    it('should group medications by pharmacy name', () => {
      const result = groupMedicationsByPharmacy(mockRecords);
      expect(result.size).toBe(2);
      expect(result.get('Main Pharmacy')).toHaveLength(2);
      expect(result.get('Secondary Pharmacy')).toHaveLength(1);
    });

    it('should handle empty records', () => {
      const result = groupMedicationsByPharmacy([]);
      expect(result.size).toBe(0);
    });

    it('should combine medications from same pharmacy', () => {
      const record1 = { ...mockRecords[0], id: 'PR001' };
      const record2 = { ...mockRecords[0], id: 'PR003', medicationHistory: [
        {
          medicationId: 'M4',
          name: 'Aspirin',
          dispensedDate: '2024-12-14',
          quantity: 100,
        },
      ]};
      const result = groupMedicationsByPharmacy([record1, record2]);
      const mainPharmacyMeds = result.get('Main Pharmacy');
      expect(mainPharmacyMeds).toHaveLength(3);
    });
  });

  describe('getAllergiesFromRecords', () => {
    it('should extract all unique allergies from records', () => {
      const result = getAllergiesFromRecords(mockRecords);
      expect(result).toContain('Penicillin');
      expect(result).toContain('Sulfonamides');
      expect(result).toHaveLength(2);
    });

    it('should return sorted allergies', () => {
      const result = getAllergiesFromRecords(mockRecords);
      expect(result).toEqual(['Penicillin', 'Sulfonamides']);
    });

    it('should handle empty records', () => {
      const result = getAllergiesFromRecords([]);
      expect(result).toEqual([]);
    });

    it('should handle records with no allergies', () => {
      const result = getAllergiesFromRecords([{ ...mockRecords[0], allergies: [] }]);
      expect(result).toEqual([]);
    });
  });

  describe('getInteractionsFromRecords', () => {
    it('should extract all unique interactions from records', () => {
      const result = getInteractionsFromRecords(mockRecords);
      expect(result).toContain('Lisinopril + NSAIDs: Use with caution');
      expect(result).toContain('Critical: Warfarin + NSAIDs');
      expect(result).toHaveLength(2);
    });

    it('should return sorted interactions', () => {
      const result = getInteractionsFromRecords(mockRecords);
      expect(result[0]).toBe('Critical: Warfarin + NSAIDs');
    });

    it('should handle empty interactions', () => {
      const result = getInteractionsFromRecords([{ ...mockRecords[1], interactions: [] }]);
      expect(result).toEqual([]);
    });
  });

  describe('sortMedicationHistoryByDate', () => {
    it('should sort by date newest first', () => {
      const history = mockRecords[0].medicationHistory;
      const result = sortMedicationHistoryByDate(history);
      expect(result[0].dispensedDate).toBe('2024-12-15');
      expect(result[1].dispensedDate).toBe('2024-12-10');
    });

    it('should not modify original array', () => {
      const history = mockRecords[0].medicationHistory;
      const originalOrder = history.map((m) => m.dispensedDate);
      sortMedicationHistoryByDate(history);
      expect(history.map((m) => m.dispensedDate)).toEqual(originalOrder);
    });
  });

  describe('getRecentMedicationHistory', () => {
    it('should return specified number of recent medications', () => {
      const history = [
        ...mockRecords[0].medicationHistory,
        ...mockRecords[1].medicationHistory,
      ];
      const result = getRecentMedicationHistory(history, 2);
      expect(result).toHaveLength(2);
    });

    it('should return fewer items if limit exceeds available', () => {
      const history = mockRecords[0].medicationHistory;
      const result = getRecentMedicationHistory(history, 10);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should default to 10 items if limit not specified', () => {
      const largeHistory = Array.from({ length: 15 }, (_, i) => ({
        medicationId: `M${i}`,
        name: `Med${i}`,
        dispensedDate: `2024-12-${20 - i}`,
        quantity: 30,
      }));
      const result = getRecentMedicationHistory(largeHistory);
      expect(result).toHaveLength(10);
    });
  });

  describe('isRecentlyDispensed', () => {
    it('should return true for medication within threshold', () => {
      const today = new Date();
      const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
      const result = isRecentlyDispensed(tenDaysAgo.toISOString(), 30);
      expect(result).toBe(true);
    });

    it('should return false for medication outside threshold', () => {
      const today = new Date();
      const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
      const result = isRecentlyDispensed(sixtyDaysAgo.toISOString(), 30);
      expect(result).toBe(false);
    });

    it('should handle invalid date gracefully', () => {
      const result = isRecentlyDispensed('invalid-date', 30);
      expect(result).toBe(false);
    });
  });

  describe('formatMedicationQuantity', () => {
    it('should format integer quantity', () => {
      expect(formatMedicationQuantity(30)).toBe('30');
      expect(formatMedicationQuantity(60)).toBe('60');
    });

    it('should format decimal quantity with 2 decimal places', () => {
      expect(formatMedicationQuantity(30.5)).toBe('30.50');
      expect(formatMedicationQuantity(15.123)).toBe('15.12');
    });

    it('should handle zero', () => {
      expect(formatMedicationQuantity(0)).toBe('0');
    });
  });

  describe('isValidPharmacyRecord', () => {
    it('should validate correct pharmacy record', () => {
      expect(isValidPharmacyRecord(mockRecords[0])).toBe(true);
    });

    it('should reject record with missing id', () => {
      const invalid = { ...mockRecords[0], id: '' };
      expect(isValidPharmacyRecord(invalid)).toBe(false);
    });

    it('should reject record with invalid arrays', () => {
      const invalid = { ...mockRecords[0], allergies: null } as any;
      expect(isValidPharmacyRecord(invalid)).toBe(false);
    });
  });

  describe('isValidMedicationHistoryEntry', () => {
    it('should validate correct medication entry', () => {
      const entry = mockRecords[0].medicationHistory[0];
      expect(isValidMedicationHistoryEntry(entry)).toBe(true);
    });

    it('should reject entry with missing fields', () => {
      const invalid = { medicationId: '', name: 'Med', dispensedDate: '2024-12-15', quantity: 30 };
      expect(isValidMedicationHistoryEntry(invalid)).toBe(false);
    });

    it('should reject entry with zero quantity', () => {
      const invalid = { medicationId: 'M1', name: 'Med', dispensedDate: '2024-12-15', quantity: 0 };
      expect(isValidMedicationHistoryEntry(invalid)).toBe(false);
    });
  });

  describe('getMedicationDispensingSummary', () => {
    it('should calculate correct summary', () => {
      // Create records with recent dates
      const today = new Date();
      const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
      const recentRecords = [
        {
          ...mockRecords[0],
          medicationHistory: [
            {
              medicationId: 'M1',
              name: 'Lisinopril',
              dispensedDate: tenDaysAgo.toISOString().split('T')[0],
              quantity: 30,
            },
          ],
        },
        {
          ...mockRecords[1],
          medicationHistory: [
            {
              medicationId: 'M3',
              name: 'Atorvastatin',
              dispensedDate: tenDaysAgo.toISOString().split('T')[0],
              quantity: 30,
            },
          ],
        },
      ];

      const result = getMedicationDispensingSummary(recentRecords);
      expect(result.totalMedicationsDispensed).toBe(2);
      expect(result.pharmacies).toBe(2);
      expect(result.recentMedications).toBeGreaterThan(0);
    });

    it('should return zeros for empty records', () => {
      const result = getMedicationDispensingSummary([]);
      expect(result.totalMedicationsDispensed).toBe(0);
      expect(result.pharmacies).toBe(0);
      expect(result.recentMedications).toBe(0);
      expect(result.lastDispensedDate).toBeNull();
    });

    it('should identify most recent dispensed date', () => {
      const result = getMedicationDispensingSummary(mockRecords);
      expect(result.lastDispensedDate).toBe('2024-12-15');
    });
  });

  describe('hasCriticalInteractions', () => {
    it('should identify critical interactions', () => {
      const interactions = ['Critical: Warfarin + NSAIDs', 'Caution: Drug X + Y'];
      expect(hasCriticalInteractions(interactions)).toBe(true);
    });

    it('should return false if no critical interactions', () => {
      const interactions = ['Use with caution: Drug X + Y', 'Monitor: Drug A + B'];
      expect(hasCriticalInteractions(interactions)).toBe(false);
    });

    it('should handle empty interactions', () => {
      expect(hasCriticalInteractions([])).toBe(false);
    });

    it('should be case insensitive', () => {
      const interactions = ['CRITICAL: Warfarin + NSAIDs'];
      expect(hasCriticalInteractions(interactions)).toBe(true);
    });
  });

  describe('checkAllergyConflicts', () => {
    it('should identify potential allergy conflicts', () => {
      const allergies = ['Penicillin'];
      const medications = [{ name: 'Penicillin V' }, { name: 'Amoxicillin' }];
      const result = checkAllergyConflicts(allergies, medications);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle no conflicts', () => {
      const allergies = ['Penicillin'];
      const medications = [{ name: 'Lisinopril' }, { name: 'Metformin' }];
      const result = checkAllergyConflicts(allergies, medications);
      expect(result).toEqual([]);
    });

    it('should be case insensitive in matching', () => {
      const allergies = ['penicillin'];
      const medications = [{ name: 'PENICILLIN V' }];
      const result = checkAllergyConflicts(allergies, medications);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
