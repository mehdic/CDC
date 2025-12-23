/**
 * Messaging Service
 * Multi-channel messaging backend for MetaPharm Connect
 *
 * Features:
 * - Multi-channel support (In-App, WhatsApp, Email, Fax)
 * - Conversation threading
 * - Read receipts
 * - Message status tracking
 * - Channel routing with fallback
 * - Rate limiting
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DataSource } from 'typeorm';

// Models
import { Message } from './models/Message';
import { Conversation } from './models/Conversation';

// Services
import { MessageService } from './services/messageService';
import { ConversationService } from './services/conversationService';
import { RouterService } from './services/routerService';
import { UnifiedInboxService } from './services/unifiedInboxService';
import { EmailPollingService } from './services/emailPollingService';
import { VoiceTranscriptionService } from './services/voiceTranscriptionService';

// Channels
import { InAppChannel } from './channels/inAppChannel';
import { WhatsAppChannel } from './channels/whatsappChannel';
import { EmailChannel } from './channels/emailChannel';
import { FaxChannel } from './channels/faxChannel';
import { MessageChannel } from './models/Message';

// Routes
import { createMessageRoutes } from './routes/messages';
import { createConversationRoutes } from './routes/conversations';
import { createWebhookRoutes } from './routes/webhooks';
import { createUnifiedInboxRoutes } from './routes/unifiedInbox';

// Config
import { config } from './config';

// ============================================================================
// Database Connection
// ============================================================================

const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  entities: [Message, Conversation],
  synchronize: false, // Use migrations in production
  logging: config.nodeEnv === 'development',
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

// ============================================================================
// Express App Setup
// ============================================================================

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development)
if (config.nodeEnv === 'development') {
  app.use((req: Request, res: Response, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', async (req: Request, res: Response) => {
  try {
    const isConnected = AppDataSource.isInitialized;

    return res.json({
      status: 'ok',
      service: 'messaging-service',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      service: 'messaging-service',
      error: (error as Error).message,
    });
  }
});

// ============================================================================
// Initialize Services and Routes
// ============================================================================

async function initializeApp() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✓ Database connected');

    // Get repositories
    const messageRepository = AppDataSource.getRepository(Message);
    const conversationRepository = AppDataSource.getRepository(Conversation);

    // Initialize services
    const messageService = new MessageService(messageRepository, conversationRepository);
    const conversationService = new ConversationService(
      conversationRepository,
      messageRepository
    );
    const routerService = new RouterService(config.router, messageService);
    const unifiedInboxService = new UnifiedInboxService(
      messageRepository,
      conversationRepository
    );

    // Initialize email polling service (if configured)
    let emailPollingService: EmailPollingService | undefined;
    if (config.emailPolling?.enabled) {
      emailPollingService = new EmailPollingService(
        config.emailPolling,
        messageRepository,
        conversationRepository
      );
      await emailPollingService.initialize();
    }

    // Initialize voice transcription service (if configured)
    let voiceTranscriptionService: VoiceTranscriptionService | undefined;
    if (config.voiceTranscription?.enabled) {
      voiceTranscriptionService = new VoiceTranscriptionService(
        config.voiceTranscription
      );
    }

    // Initialize channels
    const inAppChannel = new InAppChannel(config.channels.inApp);
    routerService.registerChannel(inAppChannel, MessageChannel.IN_APP);
    console.log('✓ In-App channel registered');

    let whatsappChannel: WhatsAppChannel | undefined;
    if (config.channels.whatsapp.enabled) {
      whatsappChannel = new WhatsAppChannel(config.channels.whatsapp);
      routerService.registerChannel(whatsappChannel, MessageChannel.WHATSAPP);
      console.log('✓ WhatsApp channel registered');
    }

    let emailChannel: EmailChannel | undefined;
    if (config.channels.email.enabled) {
      emailChannel = new EmailChannel(config.channels.email);
      routerService.registerChannel(emailChannel, MessageChannel.EMAIL);
      console.log('✓ Email channel registered');
    }

    let faxChannel: FaxChannel | undefined;
    if (config.channels.fax.enabled) {
      faxChannel = new FaxChannel(config.channels.fax);
      routerService.registerChannel(faxChannel, MessageChannel.FAX);
      console.log('✓ Fax channel registered');
    }

    // Setup routes
    app.use('/api/messages', createMessageRoutes(messageService, routerService));
    app.use('/api/conversations', createConversationRoutes(conversationService));
    app.use('/api/webhooks', createWebhookRoutes(whatsappChannel, emailChannel, faxChannel));
    app.use('/api/unified-inbox', createUnifiedInboxRoutes(unifiedInboxService));

    console.log('✓ Routes configured');

    // Cleanup rate limits periodically
    setInterval(() => {
      routerService.cleanupRateLimits();
    }, 60000); // Every minute

    // Start server
    app.listen(config.port, () => {
      console.log(`
🚀 Messaging Service running on port ${config.port}
📱 Environment: ${config.nodeEnv}
📡 Channels enabled:
   - In-App: ✓
   - WhatsApp: ${config.channels.whatsapp.enabled ? '✓' : '✗'}
   - Email: ${config.channels.email.enabled ? '✓' : '✗'}
   - Fax: ${config.channels.fax.enabled ? '✓' : '✗'}
      `);
    });
  } catch (error) {
    console.error('Failed to initialize messaging service:', error);
    process.exit(1);
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');

  // Note: emailPollingService and voiceTranscriptionService are in closure scope
  // In a real implementation, they would need to be exposed for cleanup

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');

  // Note: emailPollingService and voiceTranscriptionService are in closure scope
  // In a real implementation, they would need to be exposed for cleanup

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  process.exit(0);
});

// ============================================================================
// Start Application
// ============================================================================

initializeApp();

// Export for testing
export { app, AppDataSource };
