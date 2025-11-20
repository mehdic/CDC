/**
 * Teleconsultation Service
 * Business logic layer for teleconsultation operations
 */

import teleconsultationRepository from '../repositories/teleconsultation.repository';
import {
  TeleconsultationSession,
  SessionStatus,
  ParticipantRole,
  Participant,
  Recording,
} from '../models/teleconsultation.model';

export class TeleconsultationService {
  /**
   * Create a new teleconsultation session
   */
  createSession(data: {
    pharmacyId: string;
    scheduledAt?: string;
    notes?: string;
  }): TeleconsultationSession {
    // Validate pharmacy ID
    if (!data.pharmacyId || data.pharmacyId.trim().length === 0) {
      throw new Error('Pharmacy ID is required');
    }

    // Validate scheduled time if provided
    if (data.scheduledAt) {
      const scheduledDate = new Date(data.scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        throw new Error('Invalid scheduledAt date format');
      }

      // Check if scheduled time is in the future
      const now = new Date();
      if (scheduledDate < now) {
        throw new Error('Scheduled time must be in the future');
      }
    }

    return teleconsultationRepository.create(data);
  }

  /**
   * Get session by ID
   */
  getSessionById(id: string): TeleconsultationSession | null {
    return teleconsultationRepository.findById(id);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): TeleconsultationSession[] {
    return teleconsultationRepository.findAll();
  }

  /**
   * Get sessions by pharmacy
   */
  getSessionsByPharmacy(pharmacyId: string): TeleconsultationSession[] {
    return teleconsultationRepository.findByPharmacy(pharmacyId);
  }

  /**
   * Update session status
   */
  updateSessionStatus(id: string, status: SessionStatus): TeleconsultationSession | null {
    const session = teleconsultationRepository.findById(id);

    if (!session) {
      return null;
    }

    // Validate status transitions
    const validTransitions: Record<SessionStatus, SessionStatus[]> = {
      'scheduled': ['active', 'cancelled'],
      'active': ['paused', 'completed', 'cancelled'],
      'paused': ['active', 'completed', 'cancelled'],
      'completed': [],
      'cancelled': [],
    };

    const allowedTransitions = validTransitions[session.status];
    if (!allowedTransitions.includes(status)) {
      throw new Error(
        `Invalid status transition from ${session.status} to ${status}. Allowed transitions: ${allowedTransitions.join(', ')}`
      );
    }

    return teleconsultationRepository.updateStatus(id, status);
  }

  /**
   * Update session notes
   */
  updateSessionNotes(id: string, notes: string): TeleconsultationSession | null {
    const session = teleconsultationRepository.findById(id);

    if (!session) {
      return null;
    }

    return teleconsultationRepository.updateNotes(id, notes);
  }

  /**
   * Add participant to session
   */
  addParticipant(sessionId: string, userId: string, role: ParticipantRole): Participant {
    const session = teleconsultationRepository.findById(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Validate session is not completed or cancelled
    if (session.status === 'completed' || session.status === 'cancelled') {
      throw new Error(`Cannot add participants to ${session.status} session`);
    }

    // Validate user ID
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    // Check if participant already exists in session (and hasn't left)
    const existingParticipant = session.participants.find(
      (p) => p.userId === userId && !p.leftAt
    );

    if (existingParticipant) {
      throw new Error(`User ${userId} is already a participant in this session`);
    }

    return teleconsultationRepository.addParticipant(sessionId, userId, role);
  }

  /**
   * Remove participant from session
   */
  removeParticipant(sessionId: string, participantId: string): boolean {
    const session = teleconsultationRepository.findById(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Find participant
    const participant = session.participants.find((p) => p.id === participantId);

    if (!participant) {
      throw new Error(`Participant ${participantId} not found in session`);
    }

    // Check if participant has already left
    if (participant.leftAt) {
      throw new Error(`Participant ${participantId} has already left the session`);
    }

    return teleconsultationRepository.removeParticipant(sessionId, participantId);
  }

  /**
   * Get participants for session
   */
  getParticipants(sessionId: string): Participant[] {
    const session = teleconsultationRepository.findById(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return teleconsultationRepository.getParticipants(sessionId);
  }

  /**
   * Start recording
   */
  startRecording(sessionId: string): Recording {
    const session = teleconsultationRepository.findById(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Validate session is active
    if (session.status !== 'active') {
      throw new Error(`Cannot start recording for ${session.status} session. Session must be active.`);
    }

    // Check if there's already an active recording
    const activeRecording = session.recordings.find((r) => !r.endedAt);
    if (activeRecording) {
      throw new Error(`Recording ${activeRecording.id} is already in progress`);
    }

    return teleconsultationRepository.startRecording(sessionId);
  }

  /**
   * Stop recording
   */
  stopRecording(sessionId: string, recordingId: string): Recording | null {
    const session = teleconsultationRepository.findById(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Find recording
    const recording = session.recordings.find((r) => r.id === recordingId);

    if (!recording) {
      throw new Error(`Recording ${recordingId} not found in session ${sessionId}`);
    }

    // Check if recording is already stopped
    if (recording.endedAt) {
      throw new Error(`Recording ${recordingId} has already been stopped`);
    }

    return teleconsultationRepository.stopRecording(recordingId);
  }

  /**
   * Get recordings for session
   */
  getRecordings(sessionId: string): Recording[] {
    const session = teleconsultationRepository.findById(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return teleconsultationRepository.getRecordings(sessionId);
  }
}

// Export singleton instance
export default new TeleconsultationService();
