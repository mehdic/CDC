/**
 * Medical Records Controller
 * Handles HTTP requests for medical records
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { MedicalRecordRepository } from '../repository/MedicalRecordRepository';
import { RecordType } from '../models/MedicalRecord';
import { AccessAction } from '../models/AccessLog';
import { AuthenticatedRequest } from '../middleware/accessControl';
import {
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  MedicalRecordResponse,
  AccessLogResponse,
} from '../dto/MedicalRecordDto';

export class MedicalRecordsController {
  private repository: MedicalRecordRepository;

  constructor(dataSource: DataSource) {
    this.repository = new MedicalRecordRepository(dataSource);
  }

  /**
   * Get all medical records for a patient
   */
  getRecordsByPatientId = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { patientId } = req.params;
      const { recordType, activeOnly, consentedOnly, pharmacistFiltered } = req.query;

      let records;

      // Handle pharmacist filtering
      if (pharmacistFiltered === 'true') {
        // Pharmacist can only see allergies, medications, and conditions
        const allowedTypes = [
          RecordType.ALLERGY,
          RecordType.MEDICATION,
          RecordType.CONDITION,
        ];

        const allRecords = await this.repository.findByPatientId(
          patientId,
          activeOnly === 'false' ? false : true
        );

        records = allRecords.filter((r) => allowedTypes.includes(r.recordType));
      } else if (consentedOnly === 'true') {
        records = await this.repository.findConsented(
          patientId,
          recordType as RecordType | undefined
        );
      } else if (recordType) {
        records = await this.repository.findByPatientIdAndType(
          patientId,
          recordType as RecordType,
          activeOnly === 'false' ? false : true
        );
      } else {
        records = await this.repository.findByPatientId(
          patientId,
          activeOnly === 'false' ? false : true
        );
      }

      // Log access
      if (req.user && records.length > 0) {
        await this.repository.logAccess({
          recordId: 'bulk_access',
          patientId,
          userId: req.user.id,
          userRole: req.user.role,
          action: AccessAction.VIEW,
          ipAddress: req.ip,
          reason: `Accessed ${records.length} records`,
        });
      }

      const response: MedicalRecordResponse[] = records.map((r) => ({
        id: r.id,
        patientId: r.patientId,
        recordType: r.recordType,
        title: r.title,
        description: r.description,
        data: r.data,
        source: r.source,
        sourceId: r.sourceId,
        recordedBy: r.recordedBy,
        recordedAt: r.recordedAt?.toISOString(),
        consentGiven: r.consentGiven,
        active: r.active,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));

      res.json(response);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch medical records',
        statusCode: 500,
      });
    }
  };

  /**
   * Get a single medical record by ID
   */
  getRecordById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const record = await this.repository.findById(id);

      if (!record) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Medical record not found',
          statusCode: 404,
        });
      }

      // Log access
      if (req.user) {
        await this.repository.logAccess({
          recordId: record.id,
          patientId: record.patientId,
          userId: req.user.id,
          userRole: req.user.role,
          action: AccessAction.VIEW,
          ipAddress: req.ip,
        });
      }

      const response: MedicalRecordResponse = {
        id: record.id,
        patientId: record.patientId,
        recordType: record.recordType,
        title: record.title,
        description: record.description,
        data: record.data,
        source: record.source,
        sourceId: record.sourceId,
        recordedBy: record.recordedBy,
        recordedAt: record.recordedAt?.toISOString(),
        consentGiven: record.consentGiven,
        active: record.active,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching medical record:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch medical record',
        statusCode: 500,
      });
    }
  };

  /**
   * Create a new medical record
   */
  createRecord = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data: CreateMedicalRecordRequest = req.body;

      // Parse recordedAt if provided as string
      const recordData = {
        ...data,
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : undefined,
      };

      const record = await this.repository.create(recordData);

      // Log creation
      if (req.user) {
        await this.repository.logAccess({
          recordId: record.id,
          patientId: record.patientId,
          userId: req.user.id,
          userRole: req.user.role,
          action: AccessAction.CREATE,
          ipAddress: req.ip,
        });
      }

      const response: MedicalRecordResponse = {
        id: record.id,
        patientId: record.patientId,
        recordType: record.recordType,
        title: record.title,
        description: record.description,
        data: record.data,
        source: record.source,
        sourceId: record.sourceId,
        recordedBy: record.recordedBy,
        recordedAt: record.recordedAt?.toISOString(),
        consentGiven: record.consentGiven,
        active: record.active,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating medical record:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create medical record',
        statusCode: 500,
      });
    }
  };

  /**
   * Update a medical record
   */
  updateRecord = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updates: UpdateMedicalRecordRequest = req.body;

      const existingRecord = await this.repository.findById(id);

      if (!existingRecord) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Medical record not found',
          statusCode: 404,
        });
      }

      const record = await this.repository.update(id, updates);

      if (!record) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to update medical record',
          statusCode: 500,
        });
      }

      // Log update
      if (req.user) {
        await this.repository.logAccess({
          recordId: record.id,
          patientId: record.patientId,
          userId: req.user.id,
          userRole: req.user.role,
          action: AccessAction.UPDATE,
          ipAddress: req.ip,
        });
      }

      const response: MedicalRecordResponse = {
        id: record.id,
        patientId: record.patientId,
        recordType: record.recordType,
        title: record.title,
        description: record.description,
        data: record.data,
        source: record.source,
        sourceId: record.sourceId,
        recordedBy: record.recordedBy,
        recordedAt: record.recordedAt?.toISOString(),
        consentGiven: record.consentGiven,
        active: record.active,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating medical record:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update medical record',
        statusCode: 500,
      });
    }
  };

  /**
   * Deactivate a medical record (soft delete)
   */
  deleteRecord = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const existingRecord = await this.repository.findById(id);

      if (!existingRecord) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Medical record not found',
          statusCode: 404,
        });
      }

      const success = await this.repository.deactivate(id);

      if (!success) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to delete medical record',
          statusCode: 500,
        });
      }

      // Log deletion
      if (req.user) {
        await this.repository.logAccess({
          recordId: id,
          patientId: existingRecord.patientId,
          userId: req.user.id,
          userRole: req.user.role,
          action: AccessAction.DELETE,
          ipAddress: req.ip,
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting medical record:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete medical record',
        statusCode: 500,
      });
    }
  };

  /**
   * Get access logs for a patient
   */
  getAccessLogs = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;

      const logs = await this.repository.getPatientAccessLogs(patientId);

      const response: AccessLogResponse[] = logs.map((log) => ({
        id: log.id,
        recordId: log.recordId,
        patientId: log.patientId,
        userId: log.userId,
        userRole: log.userRole,
        action: log.action,
        ipAddress: log.ipAddress,
        reason: log.reason,
        accessedAt: log.accessedAt.toISOString(),
      }));

      res.json(response);
    } catch (error) {
      console.error('Error fetching access logs:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch access logs',
        statusCode: 500,
      });
    }
  };

  /**
   * Get record counts by type for a patient
   */
  getRecordCounts = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;

      const counts = await this.repository.countByType(patientId);

      res.json(counts);
    } catch (error) {
      console.error('Error fetching record counts:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch record counts',
        statusCode: 500,
      });
    }
  };
}
