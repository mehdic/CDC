/**
 * Request Validation Middleware
 * Validates incoming requests for medical records
 */

import { Request, Response, NextFunction } from 'express';
import { RecordType, RecordSource } from '../models/MedicalRecord';

/**
 * Validate UUID format
 */
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate create medical record request
 */
export const validateCreateMedicalRecord = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { patientId, recordType, title } = req.body;

  // Required fields
  if (!patientId) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'patientId is required',
      statusCode: 400,
    });
  }

  if (!recordType) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'recordType is required',
      statusCode: 400,
    });
  }

  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'title is required and cannot be empty',
      statusCode: 400,
    });
  }

  // Validate recordType is valid enum value
  if (!Object.values(RecordType).includes(recordType)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Invalid recordType. Must be one of: ${Object.values(RecordType).join(', ')}`,
      statusCode: 400,
    });
  }

  // Validate source if provided
  if (req.body.source && !Object.values(RecordSource).includes(req.body.source)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Invalid source. Must be one of: ${Object.values(RecordSource).join(', ')}`,
      statusCode: 400,
    });
  }

  // Validate title length
  if (title.length > 500) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'title cannot exceed 500 characters',
      statusCode: 400,
    });
  }

  next();
};

/**
 * Validate update medical record request
 */
export const validateUpdateMedicalRecord = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { title, consentGiven, active } = req.body;

  // At least one field must be provided
  if (
    title === undefined &&
    req.body.description === undefined &&
    req.body.data === undefined &&
    consentGiven === undefined &&
    active === undefined
  ) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'At least one field must be provided for update',
      statusCode: 400,
    });
  }

  // Validate title length if provided
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'title must be a non-empty string',
        statusCode: 400,
      });
    }

    if (title.length > 500) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'title cannot exceed 500 characters',
        statusCode: 400,
      });
    }
  }

  // Validate boolean fields
  if (consentGiven !== undefined && typeof consentGiven !== 'boolean') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'consentGiven must be a boolean',
      statusCode: 400,
    });
  }

  if (active !== undefined && typeof active !== 'boolean') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'active must be a boolean',
      statusCode: 400,
    });
  }

  next();
};

/**
 * Validate record ID parameter
 */
export const validateRecordId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  if (!id || !isValidUUID(id)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid record ID format',
      statusCode: 400,
    });
  }

  next();
};

/**
 * Validate patient ID parameter
 */
export const validatePatientId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { patientId } = req.params;

  if (!patientId || patientId.trim().length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'patientId is required',
      statusCode: 400,
    });
  }

  next();
};

/**
 * Validate query parameters for listing records
 */
export const validateListQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { recordType, activeOnly, consentedOnly } = req.query;

  // Validate recordType if provided
  if (recordType && !Object.values(RecordType).includes(recordType as RecordType)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Invalid recordType. Must be one of: ${Object.values(RecordType).join(', ')}`,
      statusCode: 400,
    });
  }

  // Validate boolean query params
  if (activeOnly !== undefined && activeOnly !== 'true' && activeOnly !== 'false') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'activeOnly must be "true" or "false"',
      statusCode: 400,
    });
  }

  if (consentedOnly !== undefined && consentedOnly !== 'true' && consentedOnly !== 'false') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'consentedOnly must be "true" or "false"',
      statusCode: 400,
    });
  }

  next();
};
