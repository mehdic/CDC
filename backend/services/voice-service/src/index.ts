import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { VoiceRecording } from './entities/VoiceRecording';
import { Transcription } from './entities/Transcription';
import { createVoiceRoutes } from './routes/voice.routes';
import { VoiceController } from './controllers/voice.controller';
import { VoiceService } from './services/voice.service';
import { AITranscriptionService } from './services/ai-transcription.service';
import { LanguageDetectionService } from './services/language-detection.service';
import { MedicalTerminologyService } from './services/medical-terminology.service';
import { SupportedLanguage } from './types/voice.types';

dotenv.config();

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database configuration
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm_voice',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [VoiceRecording, Transcription],
});

let voiceService: VoiceService;
let voiceController: VoiceController;

export { voiceService, voiceController };

async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Get repositories
    const recordingRepository = AppDataSource.getRepository(VoiceRecording);
    const transcriptionRepository = AppDataSource.getRepository(Transcription);

    // Initialize Azure Speech Service
    const aiService = new AITranscriptionService({
      apiKey: process.env.AZURE_SPEECH_KEY || 'your-azure-key',
      region: process.env.AZURE_SPEECH_REGION || 'switzerlandnorth',
      maxRetries: 3,
      timeout: 60000, // 60 seconds for transcription
    });

    // Initialize Language Detection Service
    const languageService = new LanguageDetectionService({
      supportedLanguages: [
        SupportedLanguage.FRENCH,
        SupportedLanguage.GERMAN,
        SupportedLanguage.ITALIAN,
        SupportedLanguage.ROMANSH,
      ],
      defaultLanguage: SupportedLanguage.FRENCH,
    });

    // Initialize Medical Terminology Service
    const medicalService = new MedicalTerminologyService();

    // Initialize Voice Service
    voiceService = new VoiceService(
      recordingRepository,
      transcriptionRepository,
      aiService,
      languageService,
      medicalService,
    );

    // Initialize Voice Controller
    voiceController = new VoiceController(voiceService);

    // Register routes
    app.use('/api/voice', createVoiceRoutes(voiceController));

    // Health check endpoint
    app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        service: 'voice-service',
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        path: req.path,
      });
    });

    // Global error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    });

    // Start server
    const port = parseInt(process.env.PORT || '3009');
    app.listen(port, () => {
      console.log(`Voice Service running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app };
