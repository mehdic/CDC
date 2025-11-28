/**
 * Medical Record Repository
 * Data access layer for medical records
 */

import { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { MedicalRecord, RecordType, RecordSource } from '../models/MedicalRecord';
import { AccessLog, AccessAction } from '../models/AccessLog';

export interface CreateMedicalRecordDTO {
  patientId: string;
  recordType: RecordType;
  title: string;
  description?: string;
  data?: Record<string, any>;
  source?: RecordSource;
  sourceId?: string;
  recordedBy?: string;
  recordedAt?: Date;
  consentGiven?: boolean;
}

export interface AccessLogDTO {
  recordId: string;
  patientId: string;
  userId: string;
  userRole: string;
  action: AccessAction;
  ipAddress?: string;
  reason?: string;
}

export class MedicalRecordRepository {
  private repository: Repository<MedicalRecord>;
  private accessLogRepository: Repository<AccessLog>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(MedicalRecord);
    this.accessLogRepository = dataSource.getRepository(AccessLog);
  }

  /**
   * Create a new medical record
   */
  async create(data: CreateMedicalRecordDTO): Promise<MedicalRecord> {
    const record = this.repository.create({
      ...data,
      active: true,
      consentGiven: data.consentGiven ?? false,
    });
    return await this.repository.save(record);
  }

  /**
   * Find medical record by ID
   */
  async findById(id: string): Promise<MedicalRecord | null> {
    return await this.repository.findOne({ where: { id } });
  }

  /**
   * Find all medical records for a patient
   */
  async findByPatientId(patientId: string, activeOnly: boolean = true): Promise<MedicalRecord[]> {
    const where: FindOptionsWhere<MedicalRecord> = { patientId };
    if (activeOnly) {
      where.active = true;
    }
    return await this.repository.find({
      where,
      order: { recordedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Find medical records by patient ID and type
   */
  async findByPatientIdAndType(
    patientId: string,
    recordType: RecordType,
    activeOnly: boolean = true
  ): Promise<MedicalRecord[]> {
    const where: FindOptionsWhere<MedicalRecord> = { patientId, recordType };
    if (activeOnly) {
      where.active = true;
    }
    return await this.repository.find({
      where,
      order: { recordedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Find records with patient consent for sharing
   */
  async findConsented(patientId: string, recordType?: RecordType): Promise<MedicalRecord[]> {
    const where: FindOptionsWhere<MedicalRecord> = {
      patientId,
      active: true,
      consentGiven: true,
    };
    if (recordType) {
      where.recordType = recordType;
    }
    return await this.repository.find({
      where,
      order: { recordedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Update medical record
   */
  async update(
    id: string,
    updates: Partial<CreateMedicalRecordDTO>
  ): Promise<MedicalRecord | null> {
    await this.repository.update(id, updates);
    return await this.findById(id);
  }

  /**
   * Deactivate medical record (soft delete)
   */
  async deactivate(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { active: false });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Log access to medical record (GDPR compliance)
   */
  async logAccess(accessData: AccessLogDTO): Promise<AccessLog> {
    const log = this.accessLogRepository.create(accessData);
    return await this.accessLogRepository.save(log);
  }

  /**
   * Get access logs for a medical record
   */
  async getAccessLogs(recordId: string): Promise<AccessLog[]> {
    return await this.accessLogRepository.find({
      where: { recordId },
      order: { accessedAt: 'DESC' },
    });
  }

  /**
   * Get access logs for a patient (all their records)
   */
  async getPatientAccessLogs(patientId: string): Promise<AccessLog[]> {
    return await this.accessLogRepository.find({
      where: { patientId },
      order: { accessedAt: 'DESC' },
    });
  }

  /**
   * Count records by type for a patient
   */
  async countByType(patientId: string): Promise<Record<string, number>> {
    const records = await this.findByPatientId(patientId, true);
    const counts: Record<string, number> = {};

    records.forEach(record => {
      counts[record.recordType] = (counts[record.recordType] || 0) + 1;
    });

    return counts;
  }
}
