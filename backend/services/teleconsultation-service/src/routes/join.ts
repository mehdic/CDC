/**
 * Teleconsultation Join Route
 * GET /teleconsultations/:id/join
 * Generates Twilio access token for joining video call
 * Tasks: T143, T144
 */

import { Router, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Teleconsultation, TeleconsultationStatus } from '../../../../shared/models/Teleconsultation';
import { createVideoRoom, generateAccessToken } from '../integrations/twilio';

const router = Router({ mergeParams: true }); // mergeParams to access :id

/**
 * GET /teleconsultations/:id/join
 * Generates Twilio Video access token and creates room if needed
 *
 * Security (FR-112):
 * - Only patient or assigned pharmacist can join
 * - JWT authentication enforced (see index.ts)
 * - Role-based access control
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const teleconsultationRepo = dataSource.getRepository(Teleconsultation);

    const user = (req as any).user; // Set by authenticateJWT middleware
    const teleconsultationId = req.params.id;

    // ========================================================================
    // 1. Fetch teleconsultation
    // ========================================================================

    const teleconsultation = await teleconsultationRepo.findOne({
      where: { id: teleconsultationId },
      relations: ['patient', 'pharmacist'],
    });

    if (!teleconsultation) {
      return res.status(404).json({
        error: 'Teleconsultation not found',
        code: 'NOT_FOUND',
      });
    }

    // ========================================================================
    // 2. Authorization - Only patient or pharmacist can join
    // ========================================================================

    const isParticipant =
      user.id === teleconsultation.patient_id ||
      user.id === teleconsultation.pharmacist_id;

    if (!isParticipant) {
      return res.status(403).json({
        error: 'You are not authorized to join this teleconsultation',
        code: 'FORBIDDEN',
      });
    }

    // ========================================================================
    // 3. Validate consultation status
    // ========================================================================

    if (teleconsultation.status === TeleconsultationStatus.CANCELLED) {
      return res.status(400).json({
        error: 'Teleconsultation has been cancelled',
        code: 'CANCELLED',
      });
    }

    if (teleconsultation.status === TeleconsultationStatus.COMPLETED) {
      return res.status(400).json({
        error: 'Teleconsultation has already been completed',
        code: 'ALREADY_COMPLETED',
      });
    }

    // ========================================================================
    // 4. Create Twilio Video Room (if not created)
    // ========================================================================

    let roomSid = teleconsultation.twilio_room_sid;

    if (!roomSid) {
      const room = await createVideoRoom({
        uniqueName: teleconsultation.id,
        type: 'peer-to-peer', // End-to-end encryption (FR-023)
        maxParticipants: 2,
        recordParticipantsOnConnect: teleconsultation.recording_consent,
      });

      roomSid = room.roomSid;

      // Update teleconsultation with room SID
      teleconsultation.twilio_room_sid = roomSid;

      // Update status to in_progress if joining for the first time
      if (teleconsultation.status === TeleconsultationStatus.SCHEDULED) {
        teleconsultation.status = TeleconsultationStatus.IN_PROGRESS;
        teleconsultation.started_at = new Date();
      }

      await teleconsultationRepo.save(teleconsultation);

      console.log(`[Join] Created Twilio room ${roomSid} for teleconsultation ${teleconsultation.id}`);
    }

    // ========================================================================
    // 5. Generate Access Token
    // ========================================================================

    const userRole = user.id === teleconsultation.patient_id ? 'patient' : 'pharmacist';

    const accessToken = generateAccessToken({
      identity: user.id,
      roomName: teleconsultation.id,
      role: userRole,
    });

    // ========================================================================
    // 6. Return token and room info
    // ========================================================================

    res.json({
      access_token: accessToken,
      room_sid: roomSid,
      room_name: teleconsultation.id,
      participant_identity: user.id,
      participant_role: userRole,
      recording_consent: teleconsultation.recording_consent,
      consultation: {
        id: teleconsultation.id,
        scheduled_at: teleconsultation.scheduled_at,
        duration_minutes: teleconsultation.duration_minutes,
        status: teleconsultation.status,
      },
    });
  } catch (error: any) {
    console.error('[Join] Error:', error);
    res.status(500).json({
      error: 'Failed to join teleconsultation',
      code: 'JOIN_ERROR',
      message: error.message,
    });
  }
});

export default router;
