/**
 * Messaging Types
 * Type definitions for the unified messaging system
 */

export enum MessageChannel {
  IN_APP = 'in_app',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  FAX = 'fax',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  BROADCAST = 'broadcast',
}

export interface Participant {
  userId: string;
  role: string;
  joinedAt: Date;
  lastReadAt?: Date;
  unreadCount?: number;
}

export interface ConversationMetadata {
  prescriptionId?: string;
  orderId?: string;
  deliveryId?: string;
  consultationId?: string;
  tags?: string[];
  archived?: boolean;
  [key: string]: unknown;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  participants: Participant[];
  subject?: string;
  lastMessageId?: string;
  lastMessageAt?: Date;
  metadata?: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  id: string;
  type: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface MessageMetadata {
  externalId?: string;
  templateId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  deliveryAttempts?: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
  [key: string]: unknown;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  recipientId: string;
  recipientRole: string;
  channel: MessageChannel;
  direction: MessageDirection;
  content: string;
  attachments?: MessageAttachment[];
  status: MessageStatus;
  metadata?: MessageMetadata;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationDTO {
  type: ConversationType;
  participants: Array<{
    userId: string;
    role: string;
  }>;
  subject?: string;
  metadata?: ConversationMetadata;
}

export interface CreateMessageDTO {
  conversationId: string;
  recipientId: string;
  recipientRole: string;
  content: string;
  channel: MessageChannel;
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
}

export interface ConversationFilterDTO {
  userId: string;
  type?: ConversationType;
  archived?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  conversationId: string;
}

export interface WebSocketMessage {
  type: 'message' | 'status' | 'typing' | 'read' | 'error';
  payload: unknown;
}

export interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTimestamp?: boolean;
}

export interface StatusIndicatorProps {
  status: MessageStatus;
  size?: 'small' | 'medium' | 'large';
}
