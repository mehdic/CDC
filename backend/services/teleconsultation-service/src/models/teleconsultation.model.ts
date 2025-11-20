/**
 * Teleconsultation Model Types and Interfaces
 */

export type SessionStatus = 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';

export type ParticipantRole = 'pharmacist' | 'doctor' | 'patient' | 'nurse';

export interface Participant {
  id: string;
  userId: string;
  role: ParticipantRole;
  joinedAt?: string;
  leftAt?: string;
}

export interface Recording {
  id: string;
  sessionId: string;
  startedAt: string;
  endedAt?: string;
  fileUrl?: string;
  duration?: number; // in seconds
}

export interface TeleconsultationSession {
  id: string;
  pharmacyId: string;
  status: SessionStatus;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  participants: Participant[];
  recordings: Recording[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Database row representation
 */
export interface SessionRow {
  id: number;
  pharmacyId: string;
  status: SessionStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantRow {
  id: number;
  sessionId: number;
  userId: string;
  role: ParticipantRole;
  joinedAt: string | null;
  leftAt: string | null;
}

export interface RecordingRow {
  id: number;
  sessionId: number;
  startedAt: string;
  endedAt: string | null;
  fileUrl: string | null;
  duration: number | null;
}

/**
 * Convert database row to TeleconsultationSession model
 */
export function rowToSession(
  row: SessionRow,
  participants: ParticipantRow[] = [],
  recordings: RecordingRow[] = []
): TeleconsultationSession {
  const session: TeleconsultationSession = {
    id: String(row.id),
    pharmacyId: row.pharmacyId,
    status: row.status,
    participants: participants.map(rowToParticipant),
    recordings: recordings.map(rowToRecording),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  // Optional fields
  if (row.scheduledAt) {
    session.scheduledAt = row.scheduledAt;
  }

  if (row.startedAt) {
    session.startedAt = row.startedAt;
  }

  if (row.endedAt) {
    session.endedAt = row.endedAt;
  }

  if (row.notes) {
    session.notes = row.notes;
  }

  return session;
}

/**
 * Convert database row to Participant model
 */
export function rowToParticipant(row: ParticipantRow): Participant {
  const participant: Participant = {
    id: String(row.id),
    userId: row.userId,
    role: row.role,
  };

  if (row.joinedAt) {
    participant.joinedAt = row.joinedAt;
  }

  if (row.leftAt) {
    participant.leftAt = row.leftAt;
  }

  return participant;
}

/**
 * Convert database row to Recording model
 */
export function rowToRecording(row: RecordingRow): Recording {
  const recording: Recording = {
    id: String(row.id),
    sessionId: String(row.sessionId),
    startedAt: row.startedAt,
  };

  if (row.endedAt) {
    recording.endedAt = row.endedAt;
  }

  if (row.fileUrl) {
    recording.fileUrl = row.fileUrl;
  }

  if (row.duration !== null) {
    recording.duration = row.duration;
  }

  return recording;
}
