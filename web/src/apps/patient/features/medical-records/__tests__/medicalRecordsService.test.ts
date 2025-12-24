/**
 * Medical Records Service Tests
 * Unit tests for medical records API service
 * Task: T8-041 - Patient Medical Records Dashboard
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as medicalRecordsService from '../services/medicalRecordsService';
import { apiClient } from '@/shared/api/client';
import { RecordType } from '../types';

jest.mock('@/shared/api/client');

describe('MedicalRecordsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'patient_id') return 'test-patient-123';
      return null;
    });
  });

  describe('getMyMedicalRecords', () => {
    it('should fetch medical records with no filters', async () => {
      const mockRecords = [
        {
          id: '1',
          patientId: 'test-patient-123',
          recordType: RecordType.PRESCRIPTION,
          title: 'Test Prescription',
          active: true,
        },
      ];

      (apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValueOnce({
        data: mockRecords,
      } as never);

      const result =
        await medicalRecordsService.getMyMedicalRecords();

      expect(apiClient.get).toHaveBeenCalledWith(
        '/medical-records/records/patient/test-patient-123'
      );
      expect(result).toEqual(mockRecords);
    });

    it('should fetch medical records with filters', async () => {
      const mockRecords = [
        {
          id: '1',
          patientId: 'test-patient-123',
          recordType: RecordType.LAB_RESULT,
          title: 'Blood Test',
          active: true,
        },
      ];

      (apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValueOnce({
        data: mockRecords,
      } as never);

      const result = await medicalRecordsService.getMyMedicalRecords({
        recordType: RecordType.LAB_RESULT,
        activeOnly: true,
        startDate: '2025-01-01',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('recordType=lab_result')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('activeOnly=true')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2025-01-01')
      );
      expect(result).toEqual(mockRecords);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      (apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockRejectedValueOnce(error);

      await expect(
        medicalRecordsService.getMyMedicalRecords()
      ).rejects.toThrow('API Error');
    });
  });

  describe('getMedicalRecordById', () => {
    it('should fetch a single medical record', async () => {
      const mockRecord = {
        id: '1',
        patientId: 'test-patient-123',
        recordType: RecordType.ALLERGY,
        title: 'Penicillin Allergy',
        active: true,
      };

      (apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValueOnce({
        data: mockRecord,
      } as never);

      const result =
        await medicalRecordsService.getMedicalRecordById('1');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/medical-records/records/1'
      );
      expect(result).toEqual(mockRecord);
    });
  });

  describe('getRecordCounts', () => {
    it('should fetch record counts', async () => {
      const mockCounts = {
        allergy: 2,
        medication: 3,
        condition: 1,
        prescription: 5,
        lab_result: 4,
        total: 15,
      };

      (apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValueOnce({
        data: mockCounts,
      } as never);

      const result = await medicalRecordsService.getRecordCounts();

      expect(apiClient.get).toHaveBeenCalledWith(
        '/medical-records/records/patient/test-patient-123/counts'
      );
      expect(result).toEqual(mockCounts);
    });
  });

  describe('shareRecords', () => {
    it('should share medical records', async () => {
      const shareRequest = {
        recordIds: ['1', '2', '3'],
        recipientId: 'doctor-123',
        recipientType: 'doctor' as const,
        expiresAt: '2025-12-31',
        message: 'For consultation',
      };

      const mockResponse = {
        shareId: 'share-123',
        accessToken: 'token-abc',
        expiresAt: '2025-12-31',
        recordIds: ['1', '2', '3'],
        recipientId: 'doctor-123',
      };

      (apiClient.post as jest.MockedFunction<typeof apiClient.post>).mockResolvedValueOnce({
        data: mockResponse,
      } as never);

      const result =
        await medicalRecordsService.shareRecords(shareRequest);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/medical-records/records/share',
        shareRequest
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('uploadDocument', () => {
    it('should upload a document', async () => {
      const file = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });

      const uploadRequest = {
        file,
        recordType: RecordType.LAB_RESULT,
        title: 'Blood Test Results',
        description: 'Annual checkup',
      };

      const mockResponse = {
        recordId: 'record-123',
        documentUrl: 'https://example.com/doc.pdf',
        uploadedAt: '2025-12-23T00:00:00Z',
      };

      (apiClient.post as jest.MockedFunction<typeof apiClient.post>).mockResolvedValueOnce({
        data: mockResponse,
      } as never);

      const result =
        await medicalRecordsService.uploadDocument(uploadRequest);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/medical-records/records/documents',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('downloadDocument', () => {
    it('should download a document as blob', async () => {
      const mockBlob = new Blob(['document content'], {
        type: 'application/pdf',
      });

      (apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValueOnce({
        data: mockBlob,
      } as never);

      const result =
        await medicalRecordsService.downloadDocument('record-123');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/medical-records/records/record-123/download',
        { responseType: 'blob' }
      );
      expect(result).toEqual(mockBlob);
    });
  });

  describe('searchMedicalRecords', () => {
    it('should search medical records', async () => {
      const mockRecords = [
        {
          id: '1',
          patientId: 'test-patient-123',
          recordType: RecordType.PRESCRIPTION,
          title: 'Aspirin Prescription',
          active: true,
        },
      ];

      (apiClient.get as jest.MockedFunction<typeof apiClient.get>).mockResolvedValueOnce({
        data: mockRecords,
      } as never);

      const result =
        await medicalRecordsService.searchMedicalRecords('aspirin');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('search=aspirin')
      );
      expect(result).toEqual(mockRecords);
    });
  });
});
