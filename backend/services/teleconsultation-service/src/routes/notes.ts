/**
 * Consultation Notes Route
 * POST /teleconsultations/:id/notes
 * GET /teleconsultations/:id/notes
 * PUT /teleconsultations/:id/notes
 * Manages consultation notes with AI transcription and pharmacist edits
 * Tasks: T145, T147
 */

import { Router, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Teleconsultation, TeleconsultationStatus } from '../../../../shared/models/Teleconsultation';
import { ConsultationNote, EditHistoryEntry } from '../../../../shared/models/ConsultationNote';
import { transcribeRecording, highlightMedicalTerms } from '../integrations/transcription';
import { getRoomRecordings } from '../integrations/twilio';
import { encryptField, decryptField } from '../../../../shared/utils/encryption';
import { v4 as uuidv4 } from 'uuid';

const router = Router({ mergeParams: true });

/**
 * POST /teleconsultations/:id/notes
 * Create consultation note with AI transcription
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const teleconsultationRepo = dataSource.getRepository(Teleconsultation);
    const noteRepo = dataSource.getRepository(ConsultationNote);

    const user = (req as any).user;
    const teleconsultationId = req.params.id;

    // Check teleconsultation exists and user is pharmacist
    const teleconsultation = await teleconsultationRepo.findOne({
      where: { id: teleconsultationId },
    });

    if (!teleconsultation) {
      return res.status(404).json({
        error: 'Teleconsultation not found',
        code: 'NOT_FOUND',
      });
    }

    if (user.id !== teleconsultation.pharmacist_id) {
      return res.status(403).json({
        error: 'Only assigned pharmacist can create notes',
        code: 'FORBIDDEN',
      });
    }

    // Get AI transcription if recording exists
    let aiTranscript = null;
    let aiSummary = null;
    let aiHighlightedTerms = null;

    if (
      teleconsultation.recording_consent &&
      teleconsultation.twilio_room_sid
    ) {
      try {
        const recordings = await getRoomRecordings(
          teleconsultation.twilio_room_sid
        );

        if (recordings.length > 0) {
          const transcription = await transcribeRecording(recordings[0]);
          aiTranscript = transcription.transcript;
          aiSummary = transcription.summary;
          aiHighlightedTerms = transcription.highlighted_terms;
        }
      } catch (error) {
        console.error('[Notes] Transcription failed:', error);
        // Continue without transcription
      }
    }

    // Encrypt AI transcript (PHI - HIPAA compliance)
    const aiTranscriptEncrypted = aiTranscript
      ? await encryptField(aiTranscript)
      : null;

    // Create consultation note
    const note = noteRepo.create({
      id: uuidv4(),
      teleconsultation_id: teleconsultation.id,
      ai_transcript_encrypted: aiTranscriptEncrypted,
      ai_summary: aiSummary,
      ai_highlighted_terms: aiHighlightedTerms,
      edited: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await noteRepo.save(note);

    res.status(201).json({
      message: 'Consultation note created',
      note: {
        id: note.id,
        teleconsultation_id: note.teleconsultation_id,
        ai_summary: note.ai_summary,
        ai_highlighted_terms: note.ai_highlighted_terms,
        edited: note.edited,
      },
    });
  } catch (error: any) {
    console.error('[Notes] Error creating note:', error);
    res.status(500).json({
      error: 'Failed to create consultation note',
      code: 'NOTE_CREATE_ERROR',
      message: error.message,
    });
  }
});

/**
 * GET /teleconsultations/:id/notes
 * Retrieve consultation note (decrypted)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const teleconsultationRepo = dataSource.getRepository(Teleconsultation);
    const noteRepo = dataSource.getRepository(ConsultationNote);

    const user = (req as any).user;
    const teleconsultationId = req.params.id;

    // Check teleconsultation exists and user has access
    const teleconsultation = await teleconsultationRepo.findOne({
      where: { id: teleconsultationId },
    });

    if (!teleconsultation) {
      return res.status(404).json({
        error: 'Teleconsultation not found',
        code: 'NOT_FOUND',
      });
    }

    // Only patient or pharmacist can view notes
    const hasAccess =
      user.id === teleconsultation.patient_id ||
      user.id === teleconsultation.pharmacist_id;

    if (!hasAccess) {
      return res.status(403).json({
        error: 'You do not have access to these notes',
        code: 'FORBIDDEN',
      });
    }

    // Fetch note
    const note = await noteRepo.findOne({
      where: { teleconsultation_id: teleconsultationId },
    });

    if (!note) {
      return res.status(404).json({
        error: 'Consultation note not found',
        code: 'NOTE_NOT_FOUND',
      });
    }

    // Decrypt transcripts
    const aiTranscript = note.ai_transcript_encrypted
      ? await decryptField(note.ai_transcript_encrypted)
      : null;

    const pharmacistNotes = note.pharmacist_notes_encrypted
      ? await decryptField(note.pharmacist_notes_encrypted)
      : null;

    res.json({
      note: {
        id: note.id,
        teleconsultation_id: note.teleconsultation_id,
        ai_transcript: aiTranscript,
        ai_summary: note.ai_summary,
        ai_highlighted_terms: note.ai_highlighted_terms,
        pharmacist_notes: pharmacistNotes,
        edited: note.edited,
        edit_history: note.edit_history,
        created_at: note.created_at,
        updated_at: note.updated_at,
      },
    });
  } catch (error: any) {
    console.error('[Notes] Error fetching note:', error);
    res.status(500).json({
      error: 'Failed to fetch consultation note',
      code: 'NOTE_FETCH_ERROR',
      message: error.message,
    });
  }
});

/**
 * PUT /teleconsultations/:id/notes
 * Edit consultation note with audit trail (FR-025a)
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const teleconsultationRepo = dataSource.getRepository(Teleconsultation);
    const noteRepo = dataSource.getRepository(ConsultationNote);

    const user = (req as any).user;
    const teleconsultationId = req.params.id;
    const { pharmacist_notes } = req.body;

    if (!pharmacist_notes) {
      return res.status(400).json({
        error: 'pharmacist_notes is required',
        code: 'VALIDATION_ERROR',
      });
    }

    // Check teleconsultation and authorization
    const teleconsultation = await teleconsultationRepo.findOne({
      where: { id: teleconsultationId },
    });

    if (!teleconsultation) {
      return res.status(404).json({
        error: 'Teleconsultation not found',
        code: 'NOT_FOUND',
      });
    }

    if (user.id !== teleconsultation.pharmacist_id) {
      return res.status(403).json({
        error: 'Only assigned pharmacist can edit notes',
        code: 'FORBIDDEN',
      });
    }

    // Fetch existing note
    const note = await noteRepo.findOne({
      where: { teleconsultation_id: teleconsultationId },
    });

    if (!note) {
      return res.status(404).json({
        error: 'Consultation note not found',
        code: 'NOTE_NOT_FOUND',
      });
    }

    // ========================================================================
    // FR-025a: Audit Trail
    // ========================================================================
    // Preserve original AI version and track all edits

    const editHistory: EditHistoryEntry[] = note.edit_history || [];

    // On first edit, save original AI version
    if (!note.edited && note.ai_transcript_encrypted) {
      const originalAiTranscript = await decryptField(
        note.ai_transcript_encrypted
      );

      editHistory.push({
        timestamp: new Date(),
        user_id: user.id,
        changes: [
          {
            field: 'pharmacist_notes',
            old_value: '',
            new_value: pharmacist_notes,
          },
        ],
        original_ai_version: originalAiTranscript,
      });
    } else {
      // Subsequent edits
      const oldNotes = note.pharmacist_notes_encrypted
        ? await decryptField(note.pharmacist_notes_encrypted)
        : '';

      editHistory.push({
        timestamp: new Date(),
        user_id: user.id,
        changes: [
          {
            field: 'pharmacist_notes',
            old_value: oldNotes,
            new_value: pharmacist_notes,
          },
        ],
      });
    }

    // Encrypt new pharmacist notes
    const pharmacistNotesEncrypted = await encryptField(pharmacist_notes);

    // Update note
    note.pharmacist_notes_encrypted = pharmacistNotesEncrypted;
    note.edited = true;
    note.edit_history = editHistory;
    note.updated_at = new Date();

    await noteRepo.save(note);

    res.json({
      message: 'Consultation note updated',
      note: {
        id: note.id,
        edited: note.edited,
        edit_history_count: editHistory.length,
        updated_at: note.updated_at,
      },
    });
  } catch (error: any) {
    console.error('[Notes] Error updating note:', error);
    res.status(500).json({
      error: 'Failed to update consultation note',
      code: 'NOTE_UPDATE_ERROR',
      message: error.message,
    });
  }
});

export default router;
