/**
 * Voice Controller
 * HTTP endpoints for voice recording and transcription
 */

import { Request, Response, NextFunction } from 'express';
import { VoiceService } from '../services/voice.service';
import { VoiceRecordingFilter, TranscriptionFilter } from '../types/voice.types';

export class VoiceController {
  constructor(private voiceService: VoiceService) {}

  /**
   * POST /api/voice/recordings
   * Create a new voice recording
   */
  async createRecording(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, userRole, conversationId, appointmentId, consultationType, language } = req.body;

      if (!userId || !userRole || !consultationType || !language) {
        res.status(400).json({
          error: 'Missing required fields: userId, userRole, consultationType, language',
        });
        return;
      }

      // Get file URL from file upload or request body
      let fileUrl = req.body.fileUrl;
      let fileName = req.body.fileName;

      if (req.file) {
        fileUrl = `/uploads/voice/${req.file.filename}`;
        fileName = req.file.originalname;
      }

      if (!fileUrl) {
        res.status(400).json({ error: 'No audio file provided' });
        return;
      }

      const metadata = req.body.metadata || {};

      const recording = await this.voiceService.createRecording(
        {
          userId,
          userRole,
          conversationId,
          appointmentId,
          consultationType,
          language,
          metadata,
        },
        fileUrl,
        fileName || 'recording.wav',
      );

      res.status(201).json({
        success: true,
        data: recording,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/voice/recordings/:id
   * Get recording by ID
   */
  async getRecording(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const recording = await this.voiceService.getRecordingById(id);

      if (!recording) {
        res.status(404).json({ error: 'Recording not found' });
        return;
      }

      res.json({
        success: true,
        data: recording,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/voice/recordings
   * List recordings with filters
   */
  async listRecordings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: VoiceRecordingFilter = {
        userId: req.query.userId as string,
        userRole: req.query.userRole as string,
        conversationId: req.query.conversationId as string,
        appointmentId: req.query.appointmentId as string,
        status: req.query.status as any,
        language: req.query.language as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const { data, total } = await this.voiceService.listRecordings(filter);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          limit: filter.limit,
          offset: filter.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/voice/transcribe
   * Process recording and generate transcription
   */
  async transcribeRecording(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recordingId } = req.body;

      if (!recordingId) {
        res.status(400).json({ error: 'Missing recordingId' });
        return;
      }

      const transcription = await this.voiceService.processRecording(recordingId);

      res.json({
        success: true,
        data: transcription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/voice/transcriptions/:id
   * Get transcription by ID
   */
  async getTranscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const transcription = await this.voiceService.getTranscriptionById(id);

      if (!transcription) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }

      res.json({
        success: true,
        data: transcription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/voice/transcriptions
   * List transcriptions with filters
   */
  async listTranscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: TranscriptionFilter = {
        recordingId: req.query.recordingId as string,
        userId: req.query.userId as string,
        status: req.query.status as any,
        language: req.query.language as any,
        minConfidence: req.query.minConfidence ? parseFloat(req.query.minConfidence as string) : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const { data, total } = await this.voiceService.listTranscriptions(filter);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          limit: filter.limit,
          offset: filter.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/voice/transcriptions/recording/:recordingId
   * Get transcription for a specific recording
   */
  async getTranscriptionByRecordingId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recordingId } = req.params;

      const transcription = await this.voiceService.getTranscriptionByRecordingId(recordingId);

      if (!transcription) {
        res.status(404).json({ error: 'Transcription not found for this recording' });
        return;
      }

      res.json({
        success: true,
        data: transcription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/voice/recordings/:id
   * Delete recording and associated transcription
   */
  async deleteRecording(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await this.voiceService.deleteRecording(id);

      res.json({
        success: true,
        message: 'Recording deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/voice/statistics
   * Get service statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.voiceService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
