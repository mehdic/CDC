/**
 * usePatientMessaging Hook
 * Handles message operations for patient users
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateMessageDTO,
  Message,
  MessageChannel,
  MessageAttachment,
} from '../types/messaging.types';
import { sendMessage, markMessageAsRead } from '../api/messaging.api';

export interface UsePatientMessagingResult {
  sendingMessage: boolean;
  error: string | null;
  sendMessageToPharmacy: (
    conversationId: string,
    recipientId: string,
    content: string,
    attachments?: MessageAttachment[]
  ) => Promise<Message>;
  markAsRead: (messageId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for patient message operations
 */
export function usePatientMessaging(): UsePatientMessagingResult {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (newMessage) => {
      // Invalidate messages query for the conversation
      queryClient.invalidateQueries({
        queryKey: ['conversations', newMessage.conversationId, 'messages'],
      });
      // Invalidate conversation list to update last message
      queryClient.invalidateQueries({
        queryKey: ['patient-conversations'],
      });
      setError(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'envoi du message';
      setError(message);
    },
  });

  // Mark message as read mutation
  const markReadMutation = useMutation({
    mutationFn: markMessageAsRead,
    onSuccess: () => {
      setError(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erreur lors du marquage du message';
      setError(message);
    },
  });

  // Send message to pharmacy
  const sendMessageToPharmacy = useCallback(
    async (
      conversationId: string,
      recipientId: string,
      content: string,
      attachments?: MessageAttachment[]
    ): Promise<Message> => {
      const messageData: CreateMessageDTO = {
        conversationId,
        recipientId,
        recipientRole: 'pharmacist',
        content,
        channel: MessageChannel.IN_APP,
        attachments,
      };
      return sendMutation.mutateAsync(messageData);
    },
    [sendMutation]
  );

  // Mark message as read
  const handleMarkAsRead = useCallback(
    async (messageId: string): Promise<void> => {
      await markReadMutation.mutateAsync(messageId);
    },
    [markReadMutation]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendingMessage: sendMutation.isPending,
    error,
    sendMessageToPharmacy,
    markAsRead: handleMarkAsRead,
    clearError,
  };
}
