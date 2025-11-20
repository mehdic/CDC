/**
 * Teleconsultation Repository
 * Data access layer for teleconsultation operations
 */

import db from '../database';
import {
  TeleconsultationSession,
  SessionRow,
  ParticipantRow,
  RecordingRow,
  SessionStatus,
  ParticipantRole,
  Participant,
  Recording,
  rowToSession,
  rowToParticipant,
  rowToRecording,
} from '../models/teleconsultation.model';

export class TeleconsultationRepository {
  /**
   * Create a new teleconsultation session
   */
  create(sessionData: {
    pharmacyId: string;
    scheduledAt?: string;
    notes?: string;
  }): TeleconsultationSession {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO sessions (
        pharmacyId, status, scheduledAt, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      sessionData.pharmacyId,
      'scheduled',
      sessionData.scheduledAt || null,
      sessionData.notes || null,
      now,
      now
    );

    const newSession = this.findById(String(result.lastInsertRowid));
    if (!newSession) {
      throw new Error('Failed to create teleconsultation session');
    }

    return newSession;
  }

  /**
   * Find session by ID
   */
  findById(id: string): TeleconsultationSession | null {
    const sessionStmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
    const sessionRow = sessionStmt.get(id) as SessionRow | undefined;

    if (!sessionRow) {
      return null;
    }

    // Get participants
    const participantsStmt = db.prepare('SELECT * FROM participants WHERE sessionId = ?');
    const participantRows = participantsStmt.all(id) as ParticipantRow[];

    // Get recordings
    const recordingsStmt = db.prepare('SELECT * FROM recordings WHERE sessionId = ?');
    const recordingRows = recordingsStmt.all(id) as RecordingRow[];

    return rowToSession(sessionRow, participantRows, recordingRows);
  }

  /**
   * Find all sessions
   */
  findAll(): TeleconsultationSession[] {
    const sessionStmt = db.prepare('SELECT * FROM sessions ORDER BY createdAt DESC');
    const sessionRows = sessionStmt.all() as SessionRow[];

    return sessionRows.map((sessionRow) => {
      const participantsStmt = db.prepare('SELECT * FROM participants WHERE sessionId = ?');
      const participantRows = participantsStmt.all(sessionRow.id) as ParticipantRow[];

      const recordingsStmt = db.prepare('SELECT * FROM recordings WHERE sessionId = ?');
      const recordingRows = recordingsStmt.all(sessionRow.id) as RecordingRow[];

      return rowToSession(sessionRow, participantRows, recordingRows);
    });
  }

  /**
   * Find sessions by pharmacy
   */
  findByPharmacy(pharmacyId: string): TeleconsultationSession[] {
    const sessionStmt = db.prepare('SELECT * FROM sessions WHERE pharmacyId = ? ORDER BY createdAt DESC');
    const sessionRows = sessionStmt.all(pharmacyId) as SessionRow[];

    return sessionRows.map((sessionRow) => {
      const participantsStmt = db.prepare('SELECT * FROM participants WHERE sessionId = ?');
      const participantRows = participantsStmt.all(sessionRow.id) as ParticipantRow[];

      const recordingsStmt = db.prepare('SELECT * FROM recordings WHERE sessionId = ?');
      const recordingRows = recordingsStmt.all(sessionRow.id) as RecordingRow[];

      return rowToSession(sessionRow, participantRows, recordingRows);
    });
  }

  /**
   * Update session status
   */
  updateStatus(id: string, status: SessionStatus): TeleconsultationSession | null {
    const now = new Date().toISOString();

    // Build update based on status
    const updates: string[] = ['status = ?', 'updatedAt = ?'];
    const params: any[] = [status, now];

    // Update timestamps based on status transitions
    if (status === 'active') {
      updates.push('startedAt = ?');
      params.push(now);
    } else if (status === 'completed' || status === 'cancelled') {
      updates.push('endedAt = ?');
      params.push(now);
    }

    params.push(id);

    const stmt = db.prepare(`
      UPDATE sessions
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    return this.findById(id);
  }

  /**
   * Update session notes
   */
  updateNotes(id: string, notes: string): TeleconsultationSession | null {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE sessions
      SET notes = ?, updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(notes, now, id);

    return this.findById(id);
  }

  /**
   * Add participant to session
   */
  addParticipant(sessionId: string, userId: string, role: ParticipantRole): Participant {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO participants (sessionId, userId, role, joinedAt)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(sessionId, userId, role, now);

    const participantStmt = db.prepare('SELECT * FROM participants WHERE id = ?');
    const participantRow = participantStmt.get(result.lastInsertRowid) as ParticipantRow;

    return rowToParticipant(participantRow);
  }

  /**
   * Remove participant from session
   */
  removeParticipant(sessionId: string, participantId: string): boolean {
    const now = new Date().toISOString();

    // Mark participant as left instead of deleting
    const stmt = db.prepare(`
      UPDATE participants
      SET leftAt = ?
      WHERE id = ? AND sessionId = ?
    `);

    const result = stmt.run(now, participantId, sessionId);

    return result.changes > 0;
  }

  /**
   * Get participants for session
   */
  getParticipants(sessionId: string): Participant[] {
    const stmt = db.prepare('SELECT * FROM participants WHERE sessionId = ?');
    const rows = stmt.all(sessionId) as ParticipantRow[];

    return rows.map(rowToParticipant);
  }

  /**
   * Start recording
   */
  startRecording(sessionId: string): Recording {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO recordings (sessionId, startedAt)
      VALUES (?, ?)
    `);

    const result = stmt.run(sessionId, now);

    const recordingStmt = db.prepare('SELECT * FROM recordings WHERE id = ?');
    const recordingRow = recordingStmt.get(result.lastInsertRowid) as RecordingRow;

    return rowToRecording(recordingRow);
  }

  /**
   * Stop recording
   */
  stopRecording(recordingId: string): Recording | null {
    const now = new Date().toISOString();

    // Get current recording to calculate duration
    const getStmt = db.prepare('SELECT * FROM recordings WHERE id = ?');
    const recordingRow = getStmt.get(recordingId) as RecordingRow | undefined;

    if (!recordingRow) {
      return null;
    }

    const startedAt = new Date(recordingRow.startedAt);
    const endedAt = new Date(now);
    const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000); // duration in seconds

    const updateStmt = db.prepare(`
      UPDATE recordings
      SET endedAt = ?, duration = ?
      WHERE id = ?
    `);

    updateStmt.run(now, duration, recordingId);

    const updatedRow = getStmt.get(recordingId) as RecordingRow;
    return rowToRecording(updatedRow);
  }

  /**
   * Get recordings for session
   */
  getRecordings(sessionId: string): Recording[] {
    const stmt = db.prepare('SELECT * FROM recordings WHERE sessionId = ? ORDER BY startedAt DESC');
    const rows = stmt.all(sessionId) as RecordingRow[];

    return rows.map(rowToRecording);
  }

  /**
   * Delete all sessions (for testing)
   */
  deleteAll(): void {
    db.exec('DELETE FROM recordings');
    db.exec('DELETE FROM participants');
    db.exec('DELETE FROM sessions');
  }
}

// Export singleton instance
export default new TeleconsultationRepository();
