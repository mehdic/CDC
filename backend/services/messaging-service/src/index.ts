/**
 * MetaPharm Connect - Messaging Service
 * Port: 4009
 *
 * Multi-Channel Communication Service:
 * - WhatsApp Business API
 * - Email (SMTP/IMAP)
 * - Fax gateway (Twilio)
 * - In-app messaging
 * - Unified inbox
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import controllers
import {
  sendMessage,
  getMessages,
  getConversations,
  getConversation,
  markMessageAsRead,
  markConversationAsRead,
  getMessageStats,
} from './controllers/messageController';

const app: Application = express();
const PORT = process.env.MESSAGING_SERVICE_PORT || 4009;
const SERVICE_NAME = 'messaging-service';

// ============================================================================
// Middleware
// ============================================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
};
app.use(cors(corsOptions));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Health & Info Endpoints
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  const health = {
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  res.status(200).json(health);
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    description: 'MetaPharm Connect Multi-Channel Messaging Service',
    channels: ['WhatsApp', 'Email', 'Fax', 'In-App'],
    endpoints: {
      health: 'GET /health',
      sendMessage: 'POST /messages/send',
      getMessages: 'GET /messages',
      getConversations: 'GET /conversations',
      getConversation: 'GET /conversations/:conversationId',
      markMessageAsRead: 'PUT /messages/:messageId/read',
      markConversationAsRead: 'PUT /conversations/:conversationId/read',
      getStats: 'GET /messages/stats',
    },
  });
});

// ============================================================================
// Message Routes
// ============================================================================

// Send message through any channel
app.post('/messages/send', sendMessage);

// Get messages with filtering
app.get('/messages', getMessages);

// Get message statistics
app.get('/messages/stats', getMessageStats);

// Mark message as read
app.put('/messages/:messageId/read', markMessageAsRead);

// ============================================================================
// Conversation Routes
// ============================================================================

// Get conversations
app.get('/conversations', getConversations);

// Get specific conversation
app.get('/conversations/:conversationId', getConversation);

// Mark conversation as read
app.put('/conversations/:conversationId/read', markConversationAsRead);

// ============================================================================
// Webhook Routes (for external providers)
// ============================================================================

// WhatsApp webhook (Twilio)
app.post('/webhooks/whatsapp', (req: Request, res: Response) => {
  console.log('[Webhook] WhatsApp message received');
  // STUB: In production, this would process incoming WhatsApp messages
  res.status(200).send('OK');
});

// Email webhook (SendGrid)
app.post('/webhooks/email', (req: Request, res: Response) => {
  console.log('[Webhook] Email received');
  // STUB: In production, this would process incoming emails
  res.status(200).send('OK');
});

// Fax webhook (Twilio)
app.post('/webhooks/fax', (req: Request, res: Response) => {
  console.log('[Webhook] Fax received');
  // STUB: In production, this would process incoming faxes
  res.status(200).send('OK');
});

// ============================================================================
// Error Handling
// ============================================================================

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    service: SERVICE_NAME,
  });
});

// ============================================================================
// Server Startup
// ============================================================================

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`[${SERVICE_NAME}] SIGTERM received, shutting down gracefully...`);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`[${SERVICE_NAME}] SIGINT received, shutting down gracefully...`);
  process.exit(0);
});

// Start server
async function startServer(): Promise<void> {
  try {
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║  MetaPharm Connect - Messaging Service                ║
║  Port: ${PORT}                                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║  Status: Running                                       ║
║  Channels: WhatsApp, Email, Fax, In-App               ║
╚════════════════════════════════════════════════════════╝
      `);
      console.log(`[${SERVICE_NAME}] Ready to process messages`);
      console.log(`[${SERVICE_NAME}] Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Failed to start:`, error);
    process.exit(1);
  }
}

// Export for testing
export { app };

// Start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
