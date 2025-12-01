/**
 * Configuration
 * Messaging service configuration
 */

import dotenv from 'dotenv';
import { MessageChannel } from '../models/Message';
import { WhatsAppConfig } from '../channels/whatsappChannel';
import { EmailConfig } from '../channels/emailChannel';
import { FaxConfig } from '../channels/faxChannel';
import { ChannelConfig } from '../channels/ChannelInterface';
import { RouterConfig } from '../services/routerService';

dotenv.config();

export const config = {
  // Server config
  port: parseInt(process.env.MESSAGING_SERVICE_PORT || '4010', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database config
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'metapharm',
    password: process.env.DATABASE_PASSWORD || 'metapharm_dev_password',
    database: process.env.DATABASE_NAME || 'metapharm',
  },

  // CORS config
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000'],

  // Channel configs
  channels: {
    inApp: {
      enabled: true,
    } as ChannelConfig,

    whatsapp: {
      enabled: process.env.WHATSAPP_ENABLED === 'true',
      apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || '',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
      rateLimit: {
        maxMessages: 80,
        windowMs: 60000, // 1 minute
      },
      retryPolicy: {
        maxAttempts: 3,
        backoffMs: 1000,
      },
    } as WhatsAppConfig,

    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      provider: (process.env.EMAIL_PROVIDER || 'sendgrid') as 'sendgrid' | 'smtp',
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.EMAIL_FROM || 'noreply@metapharm.ch',
      fromName: process.env.EMAIL_FROM_NAME || 'MetaPharm Connect',
      replyTo: process.env.EMAIL_REPLY_TO || 'support@metapharm.ch',
      rateLimit: {
        maxMessages: 100,
        windowMs: 60000,
      },
      retryPolicy: {
        maxAttempts: 3,
        backoffMs: 1000,
      },
    } as EmailConfig,

    fax: {
      enabled: process.env.FAX_ENABLED === 'true',
      provider: (process.env.FAX_PROVIDER || 'twilio') as 'twilio' | 'efax',
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      fromFaxNumber: process.env.FAX_FROM_NUMBER || '',
      apiUrl: process.env.FAX_API_URL,
      webhookUrl: process.env.FAX_WEBHOOK_URL,
      rateLimit: {
        maxMessages: 10,
        windowMs: 60000,
      },
      retryPolicy: {
        maxAttempts: 2,
        backoffMs: 2000,
      },
    } as FaxConfig,
  },

  // Router config
  router: {
    defaultChannel: MessageChannel.IN_APP,
    fallbackChain: [
      MessageChannel.EMAIL,
      MessageChannel.WHATSAPP,
      MessageChannel.IN_APP,
    ],
    routingRules: [
      {
        channel: MessageChannel.WHATSAPP,
        recipientRole: 'patient',
        priority: 10,
        conditions: {
          urgency: 'urgent',
        },
      },
      {
        channel: MessageChannel.EMAIL,
        recipientRole: 'doctor',
        priority: 8,
      },
      {
        channel: MessageChannel.FAX,
        recipientRole: 'doctor',
        priority: 5,
        conditions: {
          messageType: 'prescription',
        },
      },
    ],
    rateLimits: {
      [MessageChannel.WHATSAPP]: {
        maxMessages: 80,
        windowMs: 60000,
      },
      [MessageChannel.EMAIL]: {
        maxMessages: 100,
        windowMs: 60000,
      },
      [MessageChannel.FAX]: {
        maxMessages: 10,
        windowMs: 60000,
      },
    },
  } as RouterConfig,
};
