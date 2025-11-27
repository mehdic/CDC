/**
 * Transcript Storage Service
 * Handles secure storage and retrieval of transcripts with encryption
 * Task: T3-016
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { EncryptionService } from './encryption-service';
import {
  Transcript,
  TranscriptRecord,
  EditHistoryEntry,
  TranscriptSearchQuery,
  TranscriptSearchResult,
} from './types';

/**
 * Storage service for transcripts
 * Stores encrypted transcripts in SQLite database with audit trail
 */
export class TranscriptStorageService {
  private db: Database.Database;
  private encryption: EncryptionService;

  constructor(dbPath?: string, encryptionKey?: string) {
    // Initialize database
    const finalDbPath = dbPath || path.join(process.cwd(), 'data', 'transcripts.db');
    this.db = new Database(finalDbPath);

    // Initialize encryption service
    this.encryption = new EncryptionService(encryptionKey);

    // Create tables
    this.initializeTables();

    console.log(`[TranscriptStorageService] Initialized with db: ${finalDbPath}`);
  }

  /**
   * Create database tables
   */
  private initializeTables(): void {
    // Transcripts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id TEXT PRIMARY KEY,
        consultation_id TEXT NOT NULL,
        encrypted_content TEXT NOT NULL,
        encryption_key_id TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'fr',
        total_segments INTEGER NOT NULL,
        duration_seconds REAL NOT NULL,
        speakers_count INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_edited INTEGER NOT NULL DEFAULT 0,
        UNIQUE(consultation_id)
      );

      CREATE INDEX IF NOT EXISTS idx_transcripts_consultation_id
        ON transcripts(consultation_id);

      CREATE INDEX IF NOT EXISTS idx_transcripts_created_at
        ON transcripts(created_at);
    `);

    // Edit history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transcript_edit_history (
        id TEXT PRIMARY KEY,
        transcript_id TEXT NOT NULL,
        segment_id TEXT NOT NULL,
        edited_at TEXT NOT NULL,
        edited_by_user_id TEXT NOT NULL,
        edited_by_name TEXT NOT NULL,
        previous_text TEXT NOT NULL,
        new_text TEXT NOT NULL,
        reason TEXT,
        FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_edit_history_transcript_id
        ON transcript_edit_history(transcript_id);
    `);

    // Audit log table for HIPAA compliance
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transcript_audit_log (
        id TEXT PRIMARY KEY,
        transcript_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_audit_log_transcript_id
        ON transcript_audit_log(transcript_id);

      CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
        ON transcript_audit_log(timestamp);
    `);
  }

  /**
   * Save transcript to database
   */
  async saveTranscript(transcript: Transcript, userId: string, userName: string): Promise<void> {
    try {
      // Encrypt transcript
      const encryptedData = this.encryption.encryptTranscript(transcript);
      const encryptedString = JSON.stringify(encryptedData);

      // Calculate metadata
      const duration = transcript.segments.length > 0
        ? transcript.segments[transcript.segments.length - 1].end_time
        : 0;

      const speakersCount = transcript.speakers?.length || 0;

      // Insert into database
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO transcripts (
          id, consultation_id, encrypted_content, encryption_key_id,
          language, total_segments, duration_seconds, speakers_count,
          created_at, updated_at, is_edited
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        transcript.id,
        transcript.consultation_id,
        encryptedString,
        encryptedData.keyId,
        transcript.language,
        transcript.segments.length,
        duration,
        speakersCount,
        transcript.created_at,
        transcript.updated_at,
        0
      );

      // Log access
      this.logAccess(transcript.id, userId, userName, 'CREATE');

      console.log(`[TranscriptStorageService] Saved transcript ${transcript.id} for consultation ${transcript.consultation_id}`);
    } catch (error) {
      console.error('[TranscriptStorageService] Failed to save transcript:', error);
      throw new Error('Failed to save transcript');
    }
  }

  /**
   * Retrieve transcript by consultation ID
   */
  async getByConsultationId(consultationId: string, userId: string, userName: string): Promise<Transcript | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM transcripts WHERE consultation_id = ?
      `);

      const row = stmt.get(consultationId) as any;

      if (!row) {
        return null;
      }

      // Decrypt transcript
      const encryptedData = JSON.parse(row.encrypted_content);
      const transcript = this.encryption.decryptTranscript<Transcript>(encryptedData);

      // Load edit history
      transcript.segments.forEach(segment => {
        const history = this.getEditHistory(row.id, segment.id);
        if (history.length > 0) {
          (segment as any).edit_history = history;
        }
      });

      // Log access
      this.logAccess(row.id, userId, userName, 'READ');

      return transcript;
    } catch (error) {
      console.error('[TranscriptStorageService] Failed to retrieve transcript:', error);
      throw new Error('Failed to retrieve transcript');
    }
  }

  /**
   * Search transcripts
   */
  async search(query: TranscriptSearchQuery, userId: string, userName: string): Promise<TranscriptSearchResult[]> {
    try {
      let sql = 'SELECT * FROM transcripts WHERE 1=1';
      const params: any[] = [];

      if (query.consultation_id) {
        sql += ' AND consultation_id = ?';
        params.push(query.consultation_id);
      }

      if (query.date_from) {
        sql += ' AND created_at >= ?';
        params.push(query.date_from);
      }

      if (query.date_to) {
        sql += ' AND created_at <= ?';
        params.push(query.date_to);
      }

      sql += ' ORDER BY created_at DESC';

      if (query.limit) {
        sql += ' LIMIT ?';
        params.push(query.limit);
      }

      if (query.offset) {
        sql += ' OFFSET ?';
        params.push(query.offset);
      }

      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params) as any[];

      const results: TranscriptSearchResult[] = [];

      for (const row of rows) {
        // Decrypt transcript
        const encryptedData = JSON.parse(row.encrypted_content);
        const transcript = this.encryption.decryptTranscript<Transcript>(encryptedData);

        // Search within transcript if search_text provided
        const matches = [];
        if (query.search_text) {
          for (const segment of transcript.segments) {
            if (segment.text.toLowerCase().includes(query.search_text.toLowerCase())) {
              matches.push({
                segment_id: segment.id,
                text: segment.text,
                context: this.getSegmentContext(transcript, segment.id),
                timestamp: segment.start_time,
              });
            }
          }

          // Only include if matches found
          if (matches.length === 0) {
            continue;
          }
        }

        // Search for medical term if provided
        if (query.medical_term) {
          const termMatches = transcript.segments.filter(segment =>
            segment.highlighted_terms?.some(term =>
              term.term.toLowerCase().includes(query.medical_term!.toLowerCase())
            )
          );

          if (termMatches.length === 0) {
            continue;
          }

          termMatches.forEach(segment => {
            matches.push({
              segment_id: segment.id,
              text: segment.text,
              context: this.getSegmentContext(transcript, segment.id),
              timestamp: segment.start_time,
            });
          });
        }

        results.push({
          transcript,
          consultation_id: transcript.consultation_id,
          matches,
          relevance_score: matches.length > 0 ? matches.length / transcript.segments.length : 1.0,
        });

        // Log access
        this.logAccess(row.id, userId, userName, 'SEARCH');
      }

      return results;
    } catch (error) {
      console.error('[TranscriptStorageService] Search failed:', error);
      throw new Error('Failed to search transcripts');
    }
  }

  /**
   * Update transcript segment (pharmacist correction)
   */
  async updateSegment(
    consultationId: string,
    segmentId: string,
    newText: string,
    userId: string,
    userName: string,
    reason?: string
  ): Promise<void> {
    try {
      // Get current transcript
      const transcript = await this.getByConsultationId(consultationId, userId, userName);

      if (!transcript) {
        throw new Error('Transcript not found');
      }

      // Find segment
      const segment = transcript.segments.find(s => s.id === segmentId);
      if (!segment) {
        throw new Error('Segment not found');
      }

      // Record edit history
      const historyEntry: EditHistoryEntry = {
        id: uuidv4(),
        edited_at: new Date().toISOString(),
        edited_by_user_id: userId,
        edited_by_name: userName,
        segment_id: segmentId,
        previous_text: segment.text,
        new_text: newText,
        reason,
      };

      // Update segment
      segment.text = newText;
      transcript.updated_at = new Date().toISOString();

      // Save updated transcript
      const encryptedData = this.encryption.encryptTranscript(transcript);
      const encryptedString = JSON.stringify(encryptedData);

      const updateStmt = this.db.prepare(`
        UPDATE transcripts
        SET encrypted_content = ?, updated_at = ?, is_edited = 1
        WHERE consultation_id = ?
      `);

      updateStmt.run(encryptedString, transcript.updated_at, consultationId);

      // Save edit history
      const historyStmt = this.db.prepare(`
        INSERT INTO transcript_edit_history (
          id, transcript_id, segment_id, edited_at,
          edited_by_user_id, edited_by_name, previous_text, new_text, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      historyStmt.run(
        historyEntry.id,
        transcript.id,
        segmentId,
        historyEntry.edited_at,
        userId,
        userName,
        historyEntry.previous_text,
        newText,
        reason
      );

      // Log access
      this.logAccess(transcript.id, userId, userName, 'UPDATE');

      console.log(`[TranscriptStorageService] Updated segment ${segmentId} in consultation ${consultationId}`);
    } catch (error) {
      console.error('[TranscriptStorageService] Failed to update segment:', error);
      throw new Error('Failed to update transcript segment');
    }
  }

  /**
   * Get edit history for a segment
   */
  private getEditHistory(transcriptId: string, segmentId: string): EditHistoryEntry[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transcript_edit_history
      WHERE transcript_id = ? AND segment_id = ?
      ORDER BY edited_at DESC
    `);

    const rows = stmt.all(transcriptId, segmentId) as any[];

    return rows.map(row => ({
      id: row.id,
      edited_at: row.edited_at,
      edited_by_user_id: row.edited_by_user_id,
      edited_by_name: row.edited_by_name,
      segment_id: row.segment_id,
      previous_text: row.previous_text,
      new_text: row.new_text,
      reason: row.reason,
    }));
  }

  /**
   * Get context around a segment (previous and next segments)
   */
  private getSegmentContext(transcript: Transcript, segmentId: string): string {
    const index = transcript.segments.findIndex(s => s.id === segmentId);
    if (index === -1) {
      return '';
    }

    const contextSegments = [];

    if (index > 0) {
      contextSegments.push(transcript.segments[index - 1].text);
    }

    contextSegments.push(transcript.segments[index].text);

    if (index < transcript.segments.length - 1) {
      contextSegments.push(transcript.segments[index + 1].text);
    }

    return contextSegments.join(' ... ');
  }

  /**
   * Log access for HIPAA compliance
   */
  private logAccess(
    transcriptId: string,
    userId: string,
    userName: string,
    action: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO transcript_audit_log (
        id, transcript_id, user_id, user_name, action, timestamp, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uuidv4(),
      transcriptId,
      userId,
      userName,
      action,
      new Date().toISOString(),
      ipAddress || null,
      userAgent || null
    );
  }

  /**
   * Get audit log for transcript
   */
  async getAuditLog(consultationId: string): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT al.*
      FROM transcript_audit_log al
      JOIN transcripts t ON al.transcript_id = t.id
      WHERE t.consultation_id = ?
      ORDER BY al.timestamp DESC
    `);

    return stmt.all(consultationId) as any[];
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
