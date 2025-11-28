/**
 * Message Types and Interfaces
 * Unified data structures for multi-channel messaging
 */

export enum MessageChannel {
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  FAX = 'fax',
  IN_APP = 'in-app',
}

export enum MessageStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export interface MessageAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  content?: string; // Base64 encoded for inline attachments
}

export interface MessageRecipient {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  faxNumber?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  pharmacyId: string;
  channel: MessageChannel;
  direction: MessageDirection;
  status: MessageStatus;

  // Sender/Recipient
  from: MessageRecipient;
  to: MessageRecipient[];
  cc?: MessageRecipient[];
  bcc?: MessageRecipient[];

  // Content
  subject?: string;
  body: string;
  bodyHtml?: string;
  attachments?: MessageAttachment[];

  // Metadata
  externalId?: string; // ID from external provider (Twilio, SendGrid, etc.)
  threadId?: string; // For email threading
  replyToMessageId?: string;

  // Timestamps
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;

  // Channel-specific metadata
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  pharmacyId: string;
  participantIds: string[];
  channel: MessageChannel;
  subject?: string;
  lastMessageId?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface SendMessageRequest {
  pharmacyId: string;
  channel: MessageChannel;
  to: MessageRecipient[];
  cc?: MessageRecipient[];
  bcc?: MessageRecipient[];
  subject?: string;
  body: string;
  bodyHtml?: string;
  attachments?: MessageAttachment[];
  replyToMessageId?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageFilter {
  pharmacyId: string;
  channel?: MessageChannel;
  conversationId?: string;
  direction?: MessageDirection;
  status?: MessageStatus;
  unreadOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}
