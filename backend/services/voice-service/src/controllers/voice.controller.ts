import { Request, Response, NextFunction } from 'express';
import { VoiceService } from '../services/voice.service';
import { RecordingFilter, TranscriptionFilter } from '../types/voice.types';

export class VoiceController {
  constructor(private voiceService: VoiceService) {}

  async createRecording(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        userId,
        userRole,
        conversationId,
        appointmentId,
        consultationType,
        language,
      } = req.body;

      if (!userId || !userRole || !consultationType || !language) {
        res.status(400).json({
          error:
            'Missing required fields: userId, userRole, consultationType, language',
        });
        return;
      }

      let fileUrl = req.body.fileUrl;
      let fileName = req.body.fileName;

      if ((req as any).file) {
        fileUrl = `/uploads/voice/${(req as any).file.filename}`;
        fileName = (req as any).file.originalname;
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

  async getRecording(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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

  async listRecordings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filter: RecordingFilter = {
        userId: (req.query.userId as string) || undefined,
        userRole: (req.query.userRole as string) || undefined,
        conversationId: (req.query.conversationId as string) || undefined,
        appointmentId: (req.query.appointmentId as string) || undefined,
        status: (req.query.status as any) || undefined,
        language: (req.query.language as any) || undefined,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
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

  async transcribeRecording(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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

  async getTranscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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

  async listTranscriptions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filter: TranscriptionFilter = {
        recordingId: (req.query.recordingId as string) || undefined,
        userId: (req.query.userId as string) || undefined,
        status: (req.query.status as any) || undefined,
        language: (req.query.language as any) || undefined,
        minConfidence: req.query.minConfidence
          ? parseFloat(req.query.minConfidence as string)
          : undefined,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const { data, total } =
        await this.voiceService.listTranscriptions(filter);

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

  async getTranscriptionByRecordingId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { recordingId } = req.params;

      const transcription =
        await this.voiceService.getTranscriptionByRecordingId(recordingId);

      if (!transcription) {
        res.status(404).json({
          error: 'Transcription not found for this recording',
        });
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

  async deleteRecording(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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

  async getStatistics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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
