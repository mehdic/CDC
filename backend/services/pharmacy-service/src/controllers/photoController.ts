import { Request, Response } from 'express';
// TODO: AppDataSource not available in in-memory implementation
// import { AppDataSource } from '../index';
// import { PharmacyPhoto } from '../models/PharmacyPhoto'; // TypeORM model - not used in in-memory service
// import fs from 'fs';
// import path from 'path';
// import sharp from 'sharp';

/**
 * Photo Controller
 * Handles pharmacy photo uploads and management
 * DEPRECATED: This controller requires TypeORM setup and file storage. Currently using in-memory Express service.
 */

// Ensure uploads directory exists
// const UPLOADS_DIR = path.join(__dirname, '../../uploads/photos');
// if (!fs.existsSync(UPLOADS_DIR)) {
//   fs.mkdirSync(UPLOADS_DIR, { recursive: true });
// }

export const uploadPhotos = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup and file storage
  res.status(501).json({
    success: false,
    error: 'Photo upload endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration and file storage',
  });
};

export const getPhotos = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup
  res.status(501).json({
    success: false,
    error: 'Photo endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration',
  });
};

export const deletePhoto = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup and file storage
  res.status(501).json({
    success: false,
    error: 'Photo deletion endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration',
  });
};

export const updatePhotoOrder = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup
  res.status(501).json({
    success: false,
    error: 'Photo order update endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration',
  });
};
