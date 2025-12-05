/**
 * Medical Records Routes
 * Express router for medical records API endpoints
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { MedicalRecordsController } from '../controllers/MedicalRecordsController';
import {
  mockAuth,
  requireAuth,
  filterRecordsByRole,
  requireOwnPatientAccess,
  UserRole,
} from '../middleware/accessControl';
import {
  validateCreateMedicalRecord,
  validateUpdateMedicalRecord,
  validateRecordId,
  validatePatientId,
  validateListQuery,
} from '../middleware/validation';

export const createMedicalRecordsRouter = (dataSource: DataSource): Router => {
  const router = Router();
  const controller = new MedicalRecordsController(dataSource);

  // Apply mock authentication to all routes
  router.use(mockAuth);

  /**
   * GET /records/patient/:patientId
   * Get all medical records for a patient
   */
  router.get(
    '/records/patient/:patientId',
    validatePatientId,
    validateListQuery,
    requireAuth([
      UserRole.PATIENT,
      UserRole.PHARMACIST,
      UserRole.DOCTOR,
      UserRole.NURSE,
    ]),
    requireOwnPatientAccess,
    filterRecordsByRole,
    controller.getRecordsByPatientId
  );

  /**
   * GET /records/:id
   * Get a specific medical record by ID
   */
  router.get(
    '/records/:id',
    validateRecordId,
    requireAuth([
      UserRole.PATIENT,
      UserRole.PHARMACIST,
      UserRole.DOCTOR,
      UserRole.NURSE,
    ]),
    controller.getRecordById
  );

  /**
   * POST /records
   * Create a new medical record
   */
  router.post(
    '/records',
    validateCreateMedicalRecord,
    requireAuth([UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST]),
    controller.createRecord
  );

  /**
   * PATCH /records/:id
   * Update a medical record
   */
  router.patch(
    '/records/:id',
    validateRecordId,
    validateUpdateMedicalRecord,
    requireAuth([UserRole.DOCTOR, UserRole.NURSE]),
    controller.updateRecord
  );

  /**
   * DELETE /records/:id
   * Deactivate a medical record (soft delete)
   */
  router.delete(
    '/records/:id',
    validateRecordId,
    requireAuth([UserRole.DOCTOR]),
    controller.deleteRecord
  );

  /**
   * GET /records/patient/:patientId/access-logs
   * Get access logs for a patient's records (GDPR compliance)
   */
  router.get(
    '/records/patient/:patientId/access-logs',
    validatePatientId,
    requireAuth([UserRole.PATIENT]),
    requireOwnPatientAccess,
    controller.getAccessLogs
  );

  /**
   * GET /records/patient/:patientId/counts
   * Get count of records by type for a patient
   */
  router.get(
    '/records/patient/:patientId/counts',
    validatePatientId,
    requireAuth([
      UserRole.PATIENT,
      UserRole.PHARMACIST,
      UserRole.DOCTOR,
      UserRole.NURSE,
    ]),
    requireOwnPatientAccess,
    controller.getRecordCounts
  );

  return router;
};
