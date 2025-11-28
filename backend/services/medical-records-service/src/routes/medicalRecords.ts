/**
 * Medical Records Routes
 */

import { Router, Request, Response } from 'express';
import { MedicalRecordsController } from '../controllers/MedicalRecordsController';
import { authenticate, requireRole, requireHinAuth } from '../middleware/accessControl';
import { validateRequest } from '../middleware/validation';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto, SyncESanteDto } from '../dto/MedicalRecordDto';

export function createMedicalRecordsRoutes(controller: MedicalRecordsController): Router {
  const router = Router();

  /**
   * GET /medical-records/patient/:patientId
   * Get all medical records for a patient
   */
  router.get(
    '/patient/:patientId',
    authenticate,
    (req: Request, res: Response) => controller.getPatientRecords(req, res)
  );

  /**
   * GET /medical-records/patient/:patientId/type/:recordType
   * Get medical records by type
   */
  router.get(
    '/patient/:patientId/type/:recordType',
    authenticate,
    (req: Request, res: Response) => controller.getRecordsByType(req, res)
  );

  /**
   * POST /medical-records
   * Create a new medical record
   */
  router.post(
    '/',
    authenticate,
    validateRequest(CreateMedicalRecordDto),
    (req: Request, res: Response) => controller.createRecord(req, res)
  );

  /**
   * PATCH /medical-records/:id
   * Update medical record
   */
  router.patch(
    '/:id',
    authenticate,
    validateRequest(UpdateMedicalRecordDto),
    (req: Request, res: Response) => controller.updateRecord(req, res)
  );

  /**
   * POST /medical-records/sync-esante
   * Sync records from Swiss e-santé API
   */
  router.post(
    '/sync-esante',
    authenticate,
    requireRole('pharmacist', 'doctor', 'nurse'),
    requireHinAuth,
    validateRequest(SyncESanteDto),
    (req: Request, res: Response) => controller.syncESante(req, res)
  );

  /**
   * GET /medical-records/:id/access-logs
   * Get access logs for a medical record
   */
  router.get(
    '/:id/access-logs',
    authenticate,
    requireRole('patient', 'admin'),
    (req: Request, res: Response) => controller.getAccessLogs(req, res)
  );

  return router;
}
