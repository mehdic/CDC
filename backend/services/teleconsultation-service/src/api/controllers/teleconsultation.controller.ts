/**
 * Teleconsultation Controller
 * Handles HTTP requests for teleconsultation operations
 */

import { Request, Response } from 'express';
import teleconsultationService from '../../services/teleconsultation.service';
import { SessionStatus, ParticipantRole } from '../../models/teleconsultation.model';

/**
 * POST /api/teleconsultation/sessions
 * Create new teleconsultation session
 */
export async function createSession(req: Request, res: Response): Promise<void> {
  try {
    const { pharmacyId, scheduledAt, notes } = req.body;

    // Validate required fields
    if (!pharmacyId) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required field: pharmacyId',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const session = teleconsultationService.createSession({
      pharmacyId,
      scheduledAt,
      notes,
    });

    res.status(201).json({
      message: 'Teleconsultation session created successfully',
      session,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error creating session:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: error.message || 'Failed to create session',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/teleconsultation/sessions/:id
 * Get session by ID
 */
export async function getSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const session = teleconsultationService.getSessionById(id);

    if (!session) {
      res.status(404).json({
        error: 'Not Found',
        message: `Session with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      session,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch session',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/teleconsultation/sessions
 * List all sessions (with optional pharmacy filter)
 */
export async function listSessions(req: Request, res: Response): Promise<void> {
  try {
    const { pharmacyId } = req.query;

    const sessions = pharmacyId
      ? teleconsultationService.getSessionsByPharmacy(pharmacyId as string)
      : teleconsultationService.getAllSessions();

    res.status(200).json({
      count: sessions.length,
      sessions,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error listing sessions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list sessions',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * PATCH /api/teleconsultation/sessions/:id
 * Update session status or notes
 */
export async function updateSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Must provide either status or notes
    if (!status && !notes) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Must provide either status or notes to update',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate status if provided
    if (status) {
      const validStatuses: SessionStatus[] = ['scheduled', 'active', 'paused', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    let updatedSession;

    if (status) {
      updatedSession = teleconsultationService.updateSessionStatus(id, status);
    } else if (notes) {
      updatedSession = teleconsultationService.updateSessionNotes(id, notes);
    }

    if (!updatedSession) {
      res.status(404).json({
        error: 'Not Found',
        message: `Session with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      message: 'Session updated successfully',
      session: updatedSession,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating session:', error);

    // Handle business logic errors (like invalid transitions)
    if (error.message.includes('Invalid status transition')) {
      res.status(409).json({
        error: 'Conflict',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to update session',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/teleconsultation/sessions/:id/participants
 * Add participant to session
 */
export async function addParticipant(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    // Validate required fields
    if (!userId || !role) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: userId, role',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate role
    const validRoles: ParticipantRole[] = ['pharmacist', 'doctor', 'patient', 'nurse'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        error: 'Validation Error',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const participant = teleconsultationService.addParticipant(id, userId, role);

    res.status(201).json({
      message: 'Participant added successfully',
      participant,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error adding participant:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message.includes('already a participant') || error.message.includes('Cannot add participants')) {
      res.status(409).json({
        error: 'Conflict',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(400).json({
      error: 'Bad Request',
      message: error.message || 'Failed to add participant',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * DELETE /api/teleconsultation/sessions/:id/participants/:participantId
 * Remove participant from session
 */
export async function removeParticipant(req: Request, res: Response): Promise<void> {
  try {
    const { id, participantId } = req.params;

    const success = teleconsultationService.removeParticipant(id, participantId);

    if (!success) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove participant',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      message: 'Participant removed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error removing participant:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message.includes('already left')) {
      res.status(409).json({
        error: 'Conflict',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to remove participant',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/teleconsultation/sessions/:id/participants
 * Get participants for session
 */
export async function getParticipants(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const participants = teleconsultationService.getParticipants(id);

    res.status(200).json({
      count: participants.length,
      participants,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching participants:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch participants',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/teleconsultation/sessions/:id/recordings
 * Start recording
 */
export async function startRecording(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const recording = teleconsultationService.startRecording(id);

    res.status(201).json({
      message: 'Recording started successfully',
      recording,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error starting recording:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message.includes('Cannot start recording') || error.message.includes('already in progress')) {
      res.status(409).json({
        error: 'Conflict',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(400).json({
      error: 'Bad Request',
      message: error.message || 'Failed to start recording',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * DELETE /api/teleconsultation/sessions/:id/recordings/:recordingId
 * Stop recording
 */
export async function stopRecording(req: Request, res: Response): Promise<void> {
  try {
    const { id, recordingId } = req.params;

    const recording = teleconsultationService.stopRecording(id, recordingId);

    if (!recording) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to stop recording',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      message: 'Recording stopped successfully',
      recording,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error stopping recording:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message.includes('already been stopped')) {
      res.status(409).json({
        error: 'Conflict',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to stop recording',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/teleconsultation/sessions/:id/recordings
 * Get recordings for session
 */
export async function getRecordings(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const recordings = teleconsultationService.getRecordings(id);

    res.status(200).json({
      count: recordings.length,
      recordings,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching recordings:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch recordings',
      timestamp: new Date().toISOString(),
    });
  }
}
