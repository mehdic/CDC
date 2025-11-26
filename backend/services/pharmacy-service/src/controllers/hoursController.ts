import { Request, Response } from 'express';
import { AppDataSource } from '../index';
import { OperatingHours } from '../models/OperatingHours';

/**
 * Operating Hours Controller
 * Handles pharmacy operating hours configuration
 */

export const getOperatingHours = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId || (req as any).user?.pharmacyId;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const hoursRepo = AppDataSource.getRepository(OperatingHours);
    const hours = await hoursRepo.find({
      where: { pharmacyId },
      order: { dayOfWeek: 'ASC' },
    });

    res.status(200).json({
      success: true,
      hours,
    });
  } catch (error) {
    console.error('Error fetching operating hours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch operating hours',
    });
  }
};

export const setOperatingHours = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId || (req as any).user?.pharmacyId;
    const { hours } = req.body; // Array of { dayOfWeek, openTime, closeTime, isClosed, notes }

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    if (!Array.isArray(hours)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hours format',
      });
    }

    const hoursRepo = AppDataSource.getRepository(OperatingHours);

    // Delete existing hours for this pharmacy
    await hoursRepo.delete({ pharmacyId });

    // Create new hours
    const hourEntities = hours.map((h) =>
      hoursRepo.create({
        pharmacyId,
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime || null,
        closeTime: h.closeTime || null,
        isClosed: h.isClosed || false,
        notes: h.notes || null,
      })
    );

    await hoursRepo.save(hourEntities);

    res.status(200).json({
      success: true,
      hours: hourEntities,
    });
  } catch (error) {
    console.error('Error setting operating hours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set operating hours',
    });
  }
};

export const updateOperatingHoursForDay = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId || (req as any).user?.pharmacyId;
    const { dayOfWeek, openTime, closeTime, isClosed, notes } = req.body;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid day of week',
      });
    }

    const hoursRepo = AppDataSource.getRepository(OperatingHours);

    let dayHours = await hoursRepo.findOne({
      where: { pharmacyId, dayOfWeek },
    });

    if (!dayHours) {
      dayHours = hoursRepo.create({
        pharmacyId,
        dayOfWeek,
      });
    }

    if (openTime !== undefined) dayHours.openTime = openTime;
    if (closeTime !== undefined) dayHours.closeTime = closeTime;
    if (isClosed !== undefined) dayHours.isClosed = isClosed;
    if (notes !== undefined) dayHours.notes = notes;

    await hoursRepo.save(dayHours);

    res.status(200).json({
      success: true,
      hours: dayHours,
    });
  } catch (error) {
    console.error('Error updating operating hours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update operating hours',
    });
  }
};
