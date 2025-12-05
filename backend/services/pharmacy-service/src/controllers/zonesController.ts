import { Request, Response } from 'express';
// TODO: AppDataSource not available in in-memory implementation
// import { AppDataSource } from '../index';
// import { DeliveryZone } from '../models/DeliveryZone'; // TypeORM model - not used in in-memory service

/**
 * Delivery Zones Controller
 * Handles pharmacy delivery zone configuration
 * DEPRECATED: This controller requires TypeORM setup. Currently using in-memory Express service.
 */

export const getDeliveryZones = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup
  res.status(501).json({
    success: false,
    error: 'Delivery zones endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration',
  });
};

export const createDeliveryZone = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup
  res.status(501).json({
    success: false,
    error: 'Delivery zones endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration',
  });
};

export const updateDeliveryZone = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup
  res.status(501).json({
    success: false,
    error: 'Delivery zones endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration',
  });
};

export const deleteDeliveryZone = async (req: Request, res: Response) => {
  // DEPRECATED: Requires TypeORM setup
  res.status(501).json({
    success: false,
    error: 'Delivery zones endpoint not yet implemented in in-memory service',
    note: 'TODO: Requires database integration',
  });
};
