/**
 * Medical Records Service
 * API calls for patient medical records management
 * Task: T8-041 - Patient Medical Records Dashboard
 */

import { apiClient } from '@/shared/api/client';
import {
  MedicalRecord,
  AccessLog,
  RecordCounts,
  MedicalRecordsFilters,
  ShareRecordRequest,
  ShareRecordResponse,
  DocumentUploadRequest,
  DocumentUploadResponse,
  RecordType,
} from '../types';

const RECORDS_ENDPOINT = '/medical-records/records';

/**
 * Get all medical records for the authenticated patient
 */
export async function getMyMedicalRecords(
  filters: MedicalRecordsFilters = {}
): Promise<MedicalRecord[]> {
  try {
    const params = new URLSearchParams();

    if (filters.recordType !== undefined) {
      params.append('recordType', filters.recordType);
    }
    if (filters.activeOnly !== undefined) {
      params.append('activeOnly', filters.activeOnly.toString());
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }

    // Get patient ID from auth context (stored in token)
    const patientId = localStorage.getItem('patient_id') || 'current';

    const queryString = params.toString();
    const url = queryString
      ? `${RECORDS_ENDPOINT}/patient/${patientId}?${queryString}`
      : `${RECORDS_ENDPOINT}/patient/${patientId}`;

    const response = await apiClient.get<MedicalRecord[]>(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching medical records:', error);
    throw error;
  }
}

/**
 * Get medical records by type
 */
export async function getMedicalRecordsByType(
  recordType: RecordType,
  activeOnly: boolean = true
): Promise<MedicalRecord[]> {
  return getMyMedicalRecords({ recordType, activeOnly });
}

/**
 * Get a specific medical record by ID
 */
export async function getMedicalRecordById(
  recordId: string
): Promise<MedicalRecord> {
  try {
    const response = await apiClient.get<MedicalRecord>(
      `${RECORDS_ENDPOINT}/${recordId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching medical record:', error);
    throw error;
  }
}

/**
 * Get record counts by type
 */
export async function getRecordCounts(): Promise<RecordCounts> {
  try {
    const patientId = localStorage.getItem('patient_id') || 'current';
    const response = await apiClient.get<RecordCounts>(
      `${RECORDS_ENDPOINT}/patient/${patientId}/counts`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching record counts:', error);
    throw error;
  }
}

/**
 * Get access logs for patient's medical records (GDPR compliance)
 */
export async function getAccessLogs(): Promise<AccessLog[]> {
  try {
    const patientId = localStorage.getItem('patient_id') || 'current';
    const response = await apiClient.get<AccessLog[]>(
      `${RECORDS_ENDPOINT}/patient/${patientId}/access-logs`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching access logs:', error);
    throw error;
  }
}

/**
 * Share medical records with healthcare provider
 */
export async function shareRecords(
  request: ShareRecordRequest
): Promise<ShareRecordResponse> {
  try {
    const response = await apiClient.post<ShareRecordResponse>(
      `${RECORDS_ENDPOINT}/share`,
      request
    );
    return response.data;
  } catch (error) {
    console.error('Error sharing records:', error);
    throw error;
  }
}

/**
 * Upload medical document
 */
export async function uploadDocument(
  request: DocumentUploadRequest
): Promise<DocumentUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('recordType', request.recordType);
    formData.append('title', request.title);
    if (request.description) {
      formData.append('description', request.description);
    }

    const response = await apiClient.post<DocumentUploadResponse>(
      `${RECORDS_ENDPOINT}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

/**
 * Download medical document
 */
export async function downloadDocument(recordId: string): Promise<Blob> {
  try {
    const response = await apiClient.get<Blob>(
      `${RECORDS_ENDPOINT}/${recordId}/download`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
}

/**
 * Search medical records
 */
export async function searchMedicalRecords(
  query: string
): Promise<MedicalRecord[]> {
  return getMyMedicalRecords({ search: query });
}
