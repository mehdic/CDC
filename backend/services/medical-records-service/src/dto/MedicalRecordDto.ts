/**
 * Data Transfer Objects for Medical Records API
 */

import { RecordType, RecordSource } from '../models/MedicalRecord';
import { AccessAction } from '../models/AccessLog';

export interface CreateMedicalRecordRequest {
  patientId: string;
  recordType: RecordType;
  title: string;
  description?: string;
  data?: Record<string, any>;
  source?: RecordSource;
  sourceId?: string;
  recordedBy?: string;
  recordedAt?: string;
  consentGiven?: boolean;
}

export interface UpdateMedicalRecordRequest {
  title?: string;
  description?: string;
  data?: Record<string, any>;
  consentGiven?: boolean;
  active?: boolean;
}

export interface MedicalRecordResponse {
  id: string;
  patientId: string;
  recordType: RecordType;
  title: string;
  description?: string;
  data?: Record<string, any>;
  source: RecordSource;
  sourceId?: string;
  recordedBy?: string;
  recordedAt?: string;
  consentGiven: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccessLogResponse {
  id: string;
  recordId: string;
  patientId: string;
  userId: string;
  userRole: string;
  action: AccessAction;
  ipAddress?: string;
  reason?: string;
  accessedAt: string;
}

export interface GetMedicalRecordsQuery {
  patientId: string;
  recordType?: RecordType;
  activeOnly?: boolean;
  consentedOnly?: boolean;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
