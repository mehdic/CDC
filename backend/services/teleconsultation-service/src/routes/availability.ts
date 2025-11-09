/**
 * Teleconsultation Availability Route
 * GET /teleconsultations/availability
 * Returns available time slots for pharmacist teleconsultations
 * Task: T138
 */

import { Router, Request, Response } from 'express';
import { DataSource, Between } from 'typeorm';
import { Teleconsultation, TeleconsultationStatus } from '../../../../shared/models/Teleconsultation';
import { User } from '../../../../shared/models/User';
import { addDays, startOfDay, endOfDay, addMinutes, format } from 'date-fns';

const router = Router();

/**
 * GET /teleconsultations/availability
 * Query params:
 * - pharmacist_id (optional): Filter by specific pharmacist
 * - start_date (optional): Start date for availability (default: today)
 * - days (optional): Number of days to check (default: 7)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const teleconsultationRepo = dataSource.getRepository(Teleconsultation);
    const userRepo = dataSource.getRepository(User);

    // Parse query parameters
    const pharmacistId = req.query.pharmacist_id as string | undefined;
    const startDate = req.query.start_date
      ? new Date(req.query.start_date as string)
      : new Date();
    const days = parseInt(req.query.days as string) || 7;

    // Get pharmacists (filter by ID if provided)
    const pharmacistQuery = userRepo
      .createQueryBuilder('user')
      .where("user.role = 'pharmacist'")
      .andWhere("user.status = 'active'");

    if (pharmacistId) {
      pharmacistQuery.andWhere('user.id = :pharmacistId', { pharmacistId });
    }

    const pharmacists = await pharmacistQuery.getMany();

    if (pharmacists.length === 0) {
      return res.status(404).json({
        error: 'No pharmacists found',
        code: 'NO_PHARMACISTS',
      });
    }

    // Get booked consultations for date range
    const endDate = addDays(startDate, days);
    const bookedConsultations = await teleconsultationRepo.find({
      where: {
        scheduled_at: Between(startOfDay(startDate), endOfDay(endDate)),
        status: TeleconsultationStatus.SCHEDULED,
      },
      select: ['pharmacist_id', 'scheduled_at', 'duration_minutes'],
    });

    // Generate availability slots for each pharmacist
    const availability = pharmacists.map((pharmacist) => {
      const slots = generateTimeSlots(
        startDate,
        days,
        bookedConsultations.filter((c) => c.pharmacist_id === pharmacist.id)
      );

      return {
        pharmacist_id: pharmacist.id,
        pharmacist_name: `Pharmacist (ID: ${pharmacist.id.substring(0, 8)})`, // Encrypted fields - use placeholder
        available_slots: slots,
      };
    });

    res.json({
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      pharmacists: availability,
    });
  } catch (error: any) {
    console.error('[Availability] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch availability',
      code: 'AVAILABILITY_ERROR',
      message: error.message,
    });
  }
});

/**
 * Generate available time slots for a pharmacist
 * Assumes 9 AM - 6 PM working hours with 15-minute slots
 */
function generateTimeSlots(
  startDate: Date,
  days: number,
  bookedSlots: Teleconsultation[]
): string[] {
  const slots: string[] = [];
  const WORKING_HOURS_START = 9; // 9 AM
  const WORKING_HOURS_END = 18; // 6 PM
  const SLOT_DURATION = 15; // minutes

  for (let day = 0; day < days; day++) {
    const currentDate = addDays(startOfDay(startDate), day);

    // Skip weekends (optional business logic)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Generate slots for working hours
    for (let hour = WORKING_HOURS_START; hour < WORKING_HOURS_END; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_DURATION) {
        const slotTime = new Date(currentDate);
        slotTime.setHours(hour, minute, 0, 0);

        // Check if slot is already booked
        const isBooked = bookedSlots.some((booked) => {
          const bookedStart = new Date(booked.scheduled_at);
          const bookedEnd = addMinutes(bookedStart, booked.duration_minutes);
          return slotTime >= bookedStart && slotTime < bookedEnd;
        });

        if (!isBooked) {
          slots.push(slotTime.toISOString());
        }
      }
    }
  }

  return slots;
}

export default router;
