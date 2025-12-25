/**
 * Patient Messaging Types
 * Re-exports pharmacist messaging types for patient use
 * with patient-specific additions
 */

// Re-export all types from pharmacist messaging for consistency
export {
  MessageChannel,
  MessageStatus,
  MessageDirection,
  ConversationType,
  type Participant,
  type ConversationMetadata,
  type Conversation,
  type MessageAttachment,
  type MessageMetadata,
  type Message,
  type CreateConversationDTO,
  type CreateMessageDTO,
  type ConversationFilterDTO,
  type ConversationListResponse,
  type MessageListResponse,
  type WebSocketMessage,
  type ConversationListItemProps,
  type MessageBubbleProps,
  type StatusIndicatorProps,
} from '@apps/pharmacist/features/messaging/types/messaging.types';

/**
 * Patient-specific conversation display info
 */
export interface PatientConversationInfo {
  pharmacyName: string;
  pharmacistName: string;
  pharmacyAvatar?: string;
  lastActivity: Date;
  hasUnread: boolean;
}

/**
 * Props for patient messaging page
 */
export interface PatientMessagingPageProps {
  patientId: string;
}
