/**
 * useMessaging Hook
 * Handles message operations (send, read, etc.)
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateMessageDTO, Message } from '../types/messaging.types';
import { sendMessage, markMessageAsRead, markConversationAsRead } from '../api/messaging.api';

export interface UseMessagingResult {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  sendingMessageId?: string;
  sendMessage: (data: CreateMessageDTO) => Promise<Message>;
  markAsRead: (messageId: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing messages
 */
export const useMessaging = (): UseMessagingResult => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (newMessage) => {
      // Optimistically update local state
      setMessages((prev) => [...prev, newMessage]);
      // Invalidate conversation messages query
      queryClient.invalidateQueries({
        queryKey: ['conversations', newMessage.conversationId, 'messages'],
      });
      setError(null);
    },
    onError: (err) => {
      setError((err as Error).message || 'Failed to send message');
    },
  });

  // Mark message as read mutation
  const markReadMutation = useMutation({
    mutationFn: markMessageAsRead,
    onSuccess: (updatedMessage) => {
      // Update local messages with read status
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
      );
      setError(null);
    },
    onError: (err) => {
      setError((err as Error).message || 'Failed to mark message as read');
    },
  });

  // Mark conversation as read mutation
  const markConversationReadMutation = useMutation({
    mutationFn: markConversationAsRead,
    onSuccess: () => {
      setError(null);
    },
    onError: (err) => {
      setError((err as Error).message || 'Failed to mark conversation as read');
    },
  });

  // Handle send message
  const handleSendMessage = useCallback(
    async (data: CreateMessageDTO): Promise<Message> => {
      return sendMutation.mutateAsync(data);
    },
    [sendMutation]
  );

  // Handle mark as read
  const handleMarkAsRead = useCallback(
    async (messageId: string): Promise<void> => {
      await markReadMutation.mutateAsync(messageId);
    },
    [markReadMutation]
  );

  // Handle mark conversation read
  const handleMarkConversationRead = useCallback(
    async (conversationId: string): Promise<void> => {
      await markConversationReadMutation.mutateAsync(conversationId);
    },
    [markConversationReadMutation]
  );

  return {
    messages,
    setMessages,
    sendingMessageId: sendMutation.isPending ? 'pending' : undefined,
    sendMessage: handleSendMessage,
    markAsRead: handleMarkAsRead,
    markConversationRead: handleMarkConversationRead,
    isLoading:
      sendMutation.isPending || markReadMutation.isPending || markConversationReadMutation.isPending,
    error,
  };
};
