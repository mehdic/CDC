import { Request, Response } from 'express';
import { AppDataSource } from '../index';
import { DeliveryZone } from '../models/DeliveryZone';

/**
 * Delivery Zones Controller
 * Handles pharmacy delivery zone configuration
 */

export const getDeliveryZones = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId || (req as any).user?.pharmacyId;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const zoneRepo = AppDataSource.getRepository(DeliveryZone);
    const zones = await zoneRepo.find({
      where: { pharmacyId },
      order: { createdAt: 'ASC' },
    });

    res.status(200).json({
      success: true,
      zones,
    });
  } catch (error) {
    console.error('Error fetching delivery zones:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery zones',
    });
  }
};

export const createDeliveryZone = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId || (req as any).user?.pharmacyId;
    const { zoneName, postalCodes, deliveryFee, minOrder, maxDistanceKm, polygonGeojson } = req.body;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const zoneRepo = AppDataSource.getRepository(DeliveryZone);

    const zone = zoneRepo.create({
      pharmacyId,
      zoneName: zoneName || null,
      postalCodes: postalCodes || null,
      deliveryFee: deliveryFee || null,
      minOrder: minOrder || null,
      maxDistanceKm: maxDistanceKm || null,
      polygonGeojson: polygonGeojson || null,
    });

    await zoneRepo.save(zone);

    res.status(200).json({
      success: true,
      zone,
    });
  } catch (error) {
    console.error('Error creating delivery zone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create delivery zone',
    });
  }
};

export const updateDeliveryZone = async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const pharmacyId = (req as any).user?.pharmacyId;
    const { zoneName, postalCodes, deliveryFee, minOrder, maxDistanceKm, polygonGeojson } = req.body;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const zoneRepo = AppDataSource.getRepository(DeliveryZone);
    const zone = await zoneRepo.findOne({
      where: { id: zoneId, pharmacyId },
    });

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Delivery zone not found',
      });
    }

    if (zoneName !== undefined) zone.zoneName = zoneName;
    if (postalCodes !== undefined) zone.postalCodes = postalCodes;
    if (deliveryFee !== undefined) zone.deliveryFee = deliveryFee;
    if (minOrder !== undefined) zone.minOrder = minOrder;
    if (maxDistanceKm !== undefined) zone.maxDistanceKm = maxDistanceKm;
    if (polygonGeojson !== undefined) zone.polygonGeojson = polygonGeojson;

    await zoneRepo.save(zone);

    res.status(200).json({
      success: true,
      zone,
    });
  } catch (error) {
    console.error('Error updating delivery zone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update delivery zone',
    });
  }
};

export const deleteDeliveryZone = async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const pharmacyId = (req as any).user?.pharmacyId;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const zoneRepo = AppDataSource.getRepository(DeliveryZone);
    const zone = await zoneRepo.findOne({
      where: { id: zoneId, pharmacyId },
    });

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Delivery zone not found',
      });
    }

    await zoneRepo.remove(zone);

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting delivery zone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete delivery zone',
    });
  }
};
