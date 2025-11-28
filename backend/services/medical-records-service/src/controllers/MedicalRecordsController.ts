/**
 * Medical Records Controller
 * Handles HTTP requests for medical records management
 */

import { Request, Response } from 'express';
import { MedicalRecordRepository } from '../repository/MedicalRecordRepository';
import { eSanteApiClient } from '../integrations/ESanteApiClient';
import { canAccessPatientRecords, filterRecordsByRole } from '../middleware/accessControl';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from '../dto/MedicalRecordDto';
import { RecordType } from '../models/MedicalRecord';

export class MedicalRecordsController {
  constructor(private repository: MedicalRecordRepository) {}

  /**
   * GET /medical-records/patient/:patientId
   * Get all medical records for a patient
   */
  async getPatientRecords(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const user = req.user!;

      // Check access permissions
      if (!canAccessPatientRecords(user.id, user.role, patientId)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access these records',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Fetch records
      let records = await this.repository.findByPatientId(patientId);

      // For healthcare professionals, only return records with consent
      if (user.role !== 'patient' && user.role !== 'admin') {
        records = records.filter(r => r.consentGiven);
      }

      // Filter by role permissions
      records = filterRecordsByRole(records, user.role);

      // Log access
      for (const record of records) {
        await this.repository.logAccess({
          recordId: record.id,
          patientId,
          userId: user.id,
          userRole: user.role,
          action: 'view',
          ipAddress: req.ip,
        });
      }

      res.status(200).json({
        patientId,
        recordCount: records.length,
        records: records.map(r => ({
          id: r.id,
          recordType: r.recordType,
          title: r.title,
          description: r.description,
          data: r.data,
          source: r.source,
          recordedAt: r.recordedAt?.toISOString(),
          createdAt: r.createdAt.toISOString(),
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching patient records:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch medical records',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /medical-records/patient/:patientId/type/:recordType
   * Get medical records by type
   */
  async getRecordsByType(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, recordType } = req.params;
      const user = req.user!;

      // Check access permissions
      if (!canAccessPatientRecords(user.id, user.role, patientId)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access these records',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Fetch records by type
      let records = await this.repository.findByPatientIdAndType(
        patientId,
        recordType as RecordType
      );

      // For healthcare professionals, only return records with consent
      if (user.role !== 'patient' && user.role !== 'admin') {
        records = records.filter(r => r.consentGiven);
      }

      // Filter by role permissions
      records = filterRecordsByRole(records, user.role);

      res.status(200).json({
        patientId,
        recordType,
        recordCount: records.length,
        records: records.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          data: r.data,
          source: r.source,
          recordedAt: r.recordedAt?.toISOString(),
          createdAt: r.createdAt.toISOString(),
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching records by type:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch medical records',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /medical-records
   * Create a new medical record
   */
  async createRecord(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateMedicalRecordDto = req.body;
      const user = req.user!;

      // Only healthcare professionals and patients can create records
      if (!['patient', 'pharmacist', 'doctor', 'nurse', 'admin'].includes(user.role)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to create medical records',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check if user can create records for this patient
      if (user.role === 'patient' && user.id !== dto.patientId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You can only create records for yourself',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create record
      const record = await this.repository.create({
        ...dto,
        recordedBy: user.id,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      });

      // Log creation
      await this.repository.logAccess({
        recordId: record.id,
        patientId: dto.patientId,
        userId: user.id,
        userRole: user.role,
        action: 'create',
        ipAddress: req.ip,
      });

      res.status(201).json({
        message: 'Medical record created successfully',
        record: {
          id: record.id,
          patientId: record.patientId,
          recordType: record.recordType,
          title: record.title,
          description: record.description,
          source: record.source,
          createdAt: record.createdAt.toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating medical record:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create medical record',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /medical-records/:id
   * Update medical record
   */
  async updateRecord(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateMedicalRecordDto = req.body;
      const user = req.user!;

      // Find existing record
      const existingRecord = await this.repository.findById(id);
      if (!existingRecord) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Medical record not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check permissions
      if (!canAccessPatientRecords(user.id, user.role, existingRecord.patientId)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to update this record',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Update record
      const updated = await this.repository.update(id, dto);

      // Log update
      await this.repository.logAccess({
        recordId: id,
        patientId: existingRecord.patientId,
        userId: user.id,
        userRole: user.role,
        action: 'update',
        ipAddress: req.ip,
      });

      res.status(200).json({
        message: 'Medical record updated successfully',
        record: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating medical record:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update medical record',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /medical-records/sync-esante
   * Sync records from Swiss e-santé API
   */
  async syncESante(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.body;
      const user = req.user!;

      // Only healthcare professionals with HIN can sync
      if (!['pharmacist', 'doctor', 'nurse'].includes(user.role) || !user.hinToken) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'HIN e-ID authentication required for e-santé sync',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Sync records from e-santé
      const eSanteRecords = await eSanteApiClient.syncRecords(patientId, user.hinToken);

      // Save to database
      const savedRecords = [];
      for (const recordData of eSanteRecords) {
        // Check if record already exists by sourceId
        const existing = await this.repository.findByPatientId(patientId);
        const alreadyExists = existing.some(r => r.sourceId === recordData.sourceId);

        if (!alreadyExists) {
          const saved = await this.repository.create({
            patientId: recordData.patientId,
            recordType: recordData.recordType,
            title: recordData.title,
            description: recordData.description,
            data: recordData.data,
            source: 'e-sante',
            sourceId: recordData.sourceId,
            recordedAt: recordData.recordedAt,
            consentGiven: true,
          });
          savedRecords.push(saved);
        }
      }

      res.status(200).json({
        message: 'e-santé records synced successfully',
        syncedCount: savedRecords.length,
        totalCount: eSanteRecords.length,
        records: savedRecords.map(r => ({
          id: r.id,
          recordType: r.recordType,
          title: r.title,
          source: r.source,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error syncing e-santé records:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to sync e-santé records',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /medical-records/:id/access-logs
   * Get access logs for a medical record
   */
  async getAccessLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      // Find record
      const record = await this.repository.findById(id);
      if (!record) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Medical record not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Only patient and admin can view access logs
      if (user.role !== 'admin' && (user.role !== 'patient' || user.id !== record.patientId)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to view access logs',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const logs = await this.repository.getAccessLogs(id);

      res.status(200).json({
        recordId: id,
        logCount: logs.length,
        logs: logs.map(log => ({
          id: log.id,
          userId: log.userId,
          userRole: log.userRole,
          action: log.action,
          accessedAt: log.accessedAt.toISOString(),
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching access logs:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch access logs',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
