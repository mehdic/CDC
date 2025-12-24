/**
 * useMedicalRecords Hook Tests
 * Unit tests for medical records custom hooks
 * Task: T8-041 - Patient Medical Records Dashboard
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useMedicalRecords,
  useRecordsByType,
  useRecordCounts,
} from '../hooks/useMedicalRecords';
import * as medicalRecordsService from '../services/medicalRecordsService';
import { RecordType } from '../types';

jest.mock('../services/medicalRecordsService');

describe('useMedicalRecords hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useMedicalRecords', () => {
    it('should fetch and return medical records', async () => {
      const mockRecords = [
        {
          id: '1',
          patientId: 'test-patient',
          recordType: RecordType.PRESCRIPTION,
          title: 'Test Record',
          active: true,
          createdAt: '2025-12-23',
          updatedAt: '2025-12-23',
          description: null,
          data: null,
          source: 'doctor_entered' as const,
          sourceId: null,
          recordedBy: null,
          recordedAt: null,
          consentGiven: true,
        },
      ];

      (
        medicalRecordsService.getMyMedicalRecords as jest.MockedFunction<
          typeof medicalRecordsService.getMyMedicalRecords
        >
      ).mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useMedicalRecords());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.records).toEqual(mockRecords);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors', async () => {
      const error = new Error('Fetch failed');

      (
        medicalRecordsService.getMyMedicalRecords as jest.MockedFunction<
          typeof medicalRecordsService.getMyMedicalRecords
        >
      ).mockRejectedValue(error);

      const { result } = renderHook(() => useMedicalRecords());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.records).toEqual([]);
    });
  });

  describe('useRecordsByType', () => {
    it('should fetch records by type', async () => {
      const mockRecords = [
        {
          id: '1',
          patientId: 'test-patient',
          recordType: RecordType.LAB_RESULT,
          title: 'Blood Test',
          active: true,
          createdAt: '2025-12-23',
          updatedAt: '2025-12-23',
          description: null,
          data: null,
          source: 'e_sante_api' as const,
          sourceId: null,
          recordedBy: null,
          recordedAt: null,
          consentGiven: true,
        },
      ];

      (
        medicalRecordsService.getMedicalRecordsByType as jest.MockedFunction<
          typeof medicalRecordsService.getMedicalRecordsByType
        >
      ).mockResolvedValue(mockRecords);

      const { result } = renderHook(() =>
        useRecordsByType(RecordType.LAB_RESULT, true)
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.records).toEqual(mockRecords);
      expect(medicalRecordsService.getMedicalRecordsByType).toHaveBeenCalledWith(
        RecordType.LAB_RESULT,
        true
      );
    });
  });

  describe('useRecordCounts', () => {
    it('should fetch record counts', async () => {
      const mockCounts = {
        allergy: 2,
        medication: 3,
        condition: 1,
        procedure: 0,
        immunization: 1,
        lab_result: 4,
        vital_signs: 0,
        diagnosis: 0,
        prescription: 5,
        consultation: 2,
        hospitalization: 0,
        imaging: 1,
        other: 0,
        total: 19,
      };

      (
        medicalRecordsService.getRecordCounts as jest.MockedFunction<
          typeof medicalRecordsService.getRecordCounts
        >
      ).mockResolvedValue(mockCounts);

      const { result } = renderHook(() => useRecordCounts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.counts).toEqual(mockCounts);
      expect(medicalRecordsService.getRecordCounts).toHaveBeenCalled();
    });

    it('should handle errors when fetching counts', async () => {
      const error = new Error('Failed to fetch counts');

      (
        medicalRecordsService.getRecordCounts as jest.MockedFunction<
          typeof medicalRecordsService.getRecordCounts
        >
      ).mockRejectedValue(error);

      const { result } = renderHook(() => useRecordCounts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.counts).toBeNull();
    });
  });
});
