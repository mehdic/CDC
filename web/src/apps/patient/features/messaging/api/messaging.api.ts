/**
 * Patient Messaging API Client
 * Wraps the pharmacist messaging API with patient-specific helpers
 */

// Re-export all API functions from pharmacist messaging
export {
  fetchConversations,
  fetchConversation,
  createConversation,
  updateConversation,
  fetchMessages,
  sendMessage,
  markMessageAsRead,
  markConversationAsRead,
  searchConversations,
  fetchUnreadCounts,
} from '@apps/pharmacist/features/messaging/api/messaging.api';
