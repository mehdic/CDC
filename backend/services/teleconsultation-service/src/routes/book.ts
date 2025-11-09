/**
 * Teleconsultation Booking Route
 * POST /teleconsultations
 * Books a new teleconsultation appointment with conflict detection
 * Tasks: T140, T141
 */

import { Router, Request, Response } from 'express';
import { DataSource, Between } from 'typeorm';
import { Teleconsultation, TeleconsultationStatus } from '../../../../shared/models/Teleconsultation';
import { User } from '../../../../shared/models/User';
import { Pharmacy } from '../../../../shared/models/Pharmacy';
import { addMinutes, subMinutes } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface BookingRequest {
  pharmacist_id: string;
  scheduled_at: string; // ISO 8601 datetime
  duration_minutes?: number; // Optional, default 15
  recording_consent?: boolean; // Optional, default false
}

/**
 * POST /teleconsultations
 * Creates a new teleconsultation booking with validation
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const teleconsultationRepo = dataSource.getRepository(Teleconsultation);
    const userRepo = dataSource.getRepository(User);
    const pharmacyRepo = dataSource.getRepository(Pharmacy);

    const user = (req as any).user; // Set by authenticateJWT middleware
    const body: BookingRequest = req.body;

    // ========================================================================
    // 1. Validation
    // ========================================================================

    if (!body.pharmacist_id || !body.scheduled_at) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        required: ['pharmacist_id', 'scheduled_at'],
      });
    }

    const scheduledAt = new Date(body.scheduled_at);
    const durationMinutes = body.duration_minutes || 15;

    // Check scheduled time is in the future
    if (scheduledAt <= new Date()) {
      return res.status(400).json({
        error: 'Scheduled time must be in the future',
        code: 'INVALID_TIME',
      });
    }

    // ========================================================================
    // 2. Check pharmacist exists and is active
    // ========================================================================

    const pharmacist = await userRepo.findOne({
      where: {
        id: body.pharmacist_id,
        role: 'pharmacist',
        status: 'active',
      },
    });

    if (!pharmacist) {
      return res.status(404).json({
        error: 'Pharmacist not found or inactive',
        code: 'PHARMACIST_NOT_FOUND',
      });
    }

    // Get pharmacist's pharmacy for multi-tenant isolation
    const pharmacy = await pharmacyRepo.findOne({
      where: { id: pharmacist.primary_pharmacy_id },
    });

    if (!pharmacy) {
      return res.status(404).json({
        error: 'Pharmacist pharmacy not found',
        code: 'PHARMACY_NOT_FOUND',
      });
    }

    // ========================================================================
    // 3. Conflict Detection
    // ========================================================================

    const conflictStart = subMinutes(scheduledAt, durationMinutes);
    const conflictEnd = addMinutes(scheduledAt, durationMinutes);

    const conflictingBooking = await teleconsultationRepo
      .createQueryBuilder('tc')
      .where('tc.pharmacist_id = :pharmacistId', {
        pharmacistId: body.pharmacist_id,
      })
      .andWhere('tc.status = :status', {
        status: TeleconsultationStatus.SCHEDULED,
      })
      .andWhere(
        '(tc.scheduled_at BETWEEN :conflictStart AND :conflictEnd OR :scheduledAt BETWEEN tc.scheduled_at AND (tc.scheduled_at + (tc.duration_minutes || \' minutes\')::INTERVAL))',
        {
          conflictStart,
          conflictEnd,
          scheduledAt,
        }
      )
      .getOne();

    if (conflictingBooking) {
      return res.status(409).json({
        error: 'Time slot not available (conflict detected)',
        code: 'TIME_CONFLICT',
        conflicting_booking_id: conflictingBooking.id,
        conflicting_time: conflictingBooking.scheduled_at,
      });
    }

    // ========================================================================
    // 4. Create Teleconsultation
    // ========================================================================

    const teleconsultation = teleconsultationRepo.create({
      id: uuidv4(),
      pharmacy_id: pharmacy.id,
      patient_id: user.id,
      pharmacist_id: body.pharmacist_id,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      status: TeleconsultationStatus.SCHEDULED,
      recording_consent: body.recording_consent || false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await teleconsultationRepo.save(teleconsultation);

    // ========================================================================
    // 5. TODO: Trigger reminder notifications (T150)
    // ========================================================================
    // In production, this would:
    // - Enqueue reminder job for 24 hours before
    // - Enqueue reminder job for 15 minutes before
    // For now, we'll skip this

    res.status(201).json({
      message: 'Teleconsultation booked successfully',
      teleconsultation: {
        id: teleconsultation.id,
        pharmacist_id: teleconsultation.pharmacist_id,
        scheduled_at: teleconsultation.scheduled_at,
        duration_minutes: teleconsultation.duration_minutes,
        status: teleconsultation.status,
        recording_consent: teleconsultation.recording_consent,
      },
    });
  } catch (error: any) {
    console.error('[Book] Error:', error);
    res.status(500).json({
      error: 'Failed to book teleconsultation',
      code: 'BOOKING_ERROR',
      message: error.message,
    });
  }
});

export default router;
