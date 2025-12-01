/**
 * Messaging API Client
 * Handles API calls for messaging service
 */

import {
  Conversation,
  ConversationFilterDTO,
  ConversationListResponse,
  CreateConversationDTO,
  CreateMessageDTO,
  Message,
  MessageListResponse,
} from '../types/messaging.types';
import { fetchApi, mutateApi } from '@shared/hooks/useApi';

const BASE_ENDPOINT = '/messaging';

/**
 * Fetch conversations for a user
 */
export const fetchConversations = async (
  filter: ConversationFilterDTO
): Promise<ConversationListResponse> => {
  const params = new URLSearchParams();
  params.append('userId', filter.userId);
  if (filter.type) params.append('type', filter.type);
  if (filter.archived !== undefined) params.append('archived', String(filter.archived));
  if (filter.tags?.length) params.append('tags', filter.tags.join(','));
  if (filter.limit) params.append('limit', String(filter.limit));
  if (filter.offset) params.append('offset', String(filter.offset));

  return fetchApi<ConversationListResponse>(
    `${BASE_ENDPOINT}/conversations?${params.toString()}`
  );
};

/**
 * Get a single conversation with latest messages
 */
export const fetchConversation = async (
  conversationId: string
): Promise<Conversation> => {
  return fetchApi<Conversation>(`${BASE_ENDPOINT}/conversations/${conversationId}`);
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  data: CreateConversationDTO
): Promise<Conversation> => {
  return mutateApi<Conversation, CreateConversationDTO>(
    `${BASE_ENDPOINT}/conversations`,
    data,
    { method: 'POST' }
  );
};

/**
 * Update conversation (archive, add participants, etc.)
 */
export const updateConversation = async (
  conversationId: string,
  data: Partial<Conversation>
): Promise<Conversation> => {
  return mutateApi<Conversation, Partial<Conversation>>(
    `${BASE_ENDPOINT}/conversations/${conversationId}`,
    data,
    { method: 'PATCH' }
  );
};

/**
 * Fetch messages for a conversation with pagination
 */
export const fetchMessages = async (
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<MessageListResponse> => {
  const params = new URLSearchParams();
  params.append('limit', String(limit));
  params.append('offset', String(offset));

  return fetchApi<MessageListResponse>(
    `${BASE_ENDPOINT}/conversations/${conversationId}/messages?${params.toString()}`
  );
};

/**
 * Send a message
 */
export const sendMessage = async (data: CreateMessageDTO): Promise<Message> => {
  return mutateApi<Message, CreateMessageDTO>(
    `${BASE_ENDPOINT}/messages`,
    data,
    { method: 'POST' }
  );
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId: string): Promise<Message> => {
  return mutateApi<Message, { messageId: string }>(
    `${BASE_ENDPOINT}/messages/${messageId}/read`,
    { messageId },
    { method: 'PATCH' }
  );
};

/**
 * Mark conversation as read for user
 */
export const markConversationAsRead = async (
  conversationId: string
): Promise<Conversation> => {
  return mutateApi<Conversation, Record<string, unknown>>(
    `${BASE_ENDPOINT}/conversations/${conversationId}/read`,
    {},
    { method: 'PATCH' }
  );
};

/**
 * Search conversations
 */
export const searchConversations = async (
  userId: string,
  query: string
): Promise<ConversationListResponse> => {
  const params = new URLSearchParams();
  params.append('userId', userId);
  params.append('search', query);

  return fetchApi<ConversationListResponse>(
    `${BASE_ENDPOINT}/conversations/search?${params.toString()}`
  );
};

/**
 * Get unread count per channel
 */
export const fetchUnreadCounts = async (
  userId: string
): Promise<Record<string, number>> => {
  return fetchApi<Record<string, number>>(
    `${BASE_ENDPOINT}/conversations/unread-counts?userId=${userId}`
  );
};
