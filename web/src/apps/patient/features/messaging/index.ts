/**
 * Patient Messaging Feature
 * Exports all messaging components, hooks, and types
 */

// Main page
export { MessagingPage } from './pages/MessagingPage';
export { default as PatientMessagingPage } from './pages/MessagingPage';

// Components
export { ConversationList } from './components/ConversationList';
export { MessageThread } from './components/MessageThread';
export { MessageInput } from './components/MessageInput';

// Hooks
export { usePatientConversations } from './hooks/usePatientConversations';
export { usePatientMessaging } from './hooks/usePatientMessaging';
export type { UsePatientConversationsResult } from './hooks/usePatientConversations';
export type { UsePatientMessagingResult } from './hooks/usePatientMessaging';

// Types (re-exported from pharmacist for consistency)
export type {
  Conversation,
  Message,
  MessageChannel,
  MessageStatus,
  MessageAttachment,
  CreateMessageDTO,
  PatientConversationInfo,
  PatientMessagingPageProps,
} from './types/messaging.types';
