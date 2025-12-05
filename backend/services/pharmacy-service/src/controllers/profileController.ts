import { Request, Response } from 'express';
// TODO: AppDataSource not available in in-memory implementation
// import { AppDataSource } from '../index';
// import { PharmacyProfile } from '../models/PharmacyProfile'; // TypeORM model - not used in in-memory service

/**
 * Profile Controller
 * Handles pharmacy profile CRUD operations
 * DEPRECATED: This controller requires TypeORM setup. Currently using in-memory Express service.
 */

export const getPharmacyProfile = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup
  res.status(501).json({
    success: false,
    error: 'Profile endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration',
  });
};

export const updatePharmacyProfile = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup
  res.status(501).json({
    success: false,
    error: 'Profile update endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration',
  });
};

export const publishPharmacyProfile = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup
  res.status(501).json({
    success: false,
    error: 'Profile publish endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration',
  });
};

export const unpublishPharmacyProfile = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup
  res.status(501).json({
    success: false,
    error: 'Profile unpublish endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration',
  });
};
