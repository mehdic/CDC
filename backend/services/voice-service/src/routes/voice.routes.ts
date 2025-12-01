import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { VoiceController } from '../controllers/voice.controller';

export function createVoiceRoutes(controller: VoiceController): Router {
  const router = Router();

  const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      cb(null, 'uploads/voice/');
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `recording-${timestamp}${ext}`);
    },
  });

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    const allowedMimes = [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/mp4',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 100 * 1024 * 1024,
    },
  });

  // POST /api/voice/recordings - Create a new recording
  router.post(
    '/recordings',
    upload.single('audio'),
    (req: Request, res: Response, next: NextFunction) =>
      controller.createRecording(req, res, next),
  );

  // GET /api/voice/recordings/:id - Get a specific recording
  router.get(
    '/recordings/:id',
    (req: Request, res: Response, next: NextFunction) =>
      controller.getRecording(req, res, next),
  );

  // GET /api/voice/recordings - List recordings with filters
  router.get(
    '/recordings',
    (req: Request, res: Response, next: NextFunction) =>
      controller.listRecordings(req, res, next),
  );

  // DELETE /api/voice/recordings/:id - Delete a recording
  router.delete(
    '/recordings/:id',
    (req: Request, res: Response, next: NextFunction) =>
      controller.deleteRecording(req, res, next),
  );

  // POST /api/voice/transcribe - Process recording and create transcription
  router.post(
    '/transcribe',
    (req: Request, res: Response, next: NextFunction) =>
      controller.transcribeRecording(req, res, next),
  );

  // GET /api/voice/transcriptions/:id - Get a specific transcription
  router.get(
    '/transcriptions/:id',
    (req: Request, res: Response, next: NextFunction) =>
      controller.getTranscription(req, res, next),
  );

  // GET /api/voice/transcriptions/recording/:recordingId - Get transcription for recording
  router.get(
    '/transcriptions/recording/:recordingId',
    (req: Request, res: Response, next: NextFunction) =>
      controller.getTranscriptionByRecordingId(req, res, next),
  );

  // GET /api/voice/transcriptions - List transcriptions with filters
  router.get(
    '/transcriptions',
    (req: Request, res: Response, next: NextFunction) =>
      controller.listTranscriptions(req, res, next),
  );

  // GET /api/voice/statistics - Get voice service statistics
  router.get(
    '/statistics',
    (req: Request, res: Response, next: NextFunction) =>
      controller.getStatistics(req, res, next),
  );

  return router;
}
