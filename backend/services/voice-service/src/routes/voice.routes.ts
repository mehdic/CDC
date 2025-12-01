/**
 * Voice Routes
 * Express routes for voice recording and transcription endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { VoiceController } from '../controllers/voice.controller';

/**
 * Factory function to create voice routes
 */
export function createVoiceRoutes(controller: VoiceController): Router {
  const router = Router();

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/voice/');
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `recording-${timestamp}${ext}`);
    },
  });

  const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`), false);
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  });

  /**
   * Recording endpoints
   */

  // Create recording
  router.post(
    '/recordings',
    upload.single('audio'),
    (req: Request, res: Response, next: NextFunction) => controller.createRecording(req, res, next),
  );

  // Get recording by ID
  router.get(
    '/recordings/:id',
    (req: Request, res: Response, next: NextFunction) => controller.getRecording(req, res, next),
  );

  // List recordings
  router.get(
    '/recordings',
    (req: Request, res: Response, next: NextFunction) => controller.listRecordings(req, res, next),
  );

  // Delete recording
  router.delete(
    '/recordings/:id',
    (req: Request, res: Response, next: NextFunction) => controller.deleteRecording(req, res, next),
  );

  /**
   * Transcription endpoints
   */

  // Transcribe recording
  router.post(
    '/transcribe',
    (req: Request, res: Response, next: NextFunction) => controller.transcribeRecording(req, res, next),
  );

  // Get transcription by ID
  router.get(
    '/transcriptions/:id',
    (req: Request, res: Response, next: NextFunction) => controller.getTranscription(req, res, next),
  );

  // Get transcription by recording ID
  router.get(
    '/transcriptions/recording/:recordingId',
    (req: Request, res: Response, next: NextFunction) => controller.getTranscriptionByRecordingId(req, res, next),
  );

  // List transcriptions
  router.get(
    '/transcriptions',
    (req: Request, res: Response, next: NextFunction) => controller.listTranscriptions(req, res, next),
  );

  /**
   * Statistics and health
   */

  // Get statistics
  router.get(
    '/statistics',
    (req: Request, res: Response, next: NextFunction) => controller.getStatistics(req, res, next),
  );

  return router;
}
