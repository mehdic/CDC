/**
 * usePatientConversations Hook
 * Manages conversations for patient users
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Conversation,
  ConversationFilterDTO,
  CreateConversationDTO,
  ConversationType,
  MessageChannel,
} from '../types/messaging.types';
import {
  fetchConversations,
  createConversation,
  markConversationAsRead,
  fetchUnreadCounts,
} from '../api/messaging.api';

export interface UsePatientConversationsResult {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  unreadCounts: Record<string, number>;
  totalUnread: number;
  selectConversation: (conversation: Conversation) => void;
  startConversationWithPharmacy: (pharmacyId: string, pharmacistId: string) => Promise<Conversation>;
  markAsRead: (conversationId: string) => Promise<void>;
  refetch: () => void;
  hasMore: boolean;
  total: number;
}

/**
 * Hook for managing patient conversations with pharmacists
 */
export function usePatientConversations(
  patientId: string,
  filters?: Partial<ConversationFilterDTO>
): UsePatientConversationsResult {
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Fetch patient conversations
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patient-conversations', patientId, filters],
    queryFn: () =>
      fetchConversations({
        userId: patientId,
        ...filters,
        limit: filters?.limit ?? 50,
        offset: filters?.offset ?? 0,
      }),
    enabled: Boolean(patientId),
  });

  // Fetch unread counts
  const { data: unreadCounts = {} } = useQuery({
    queryKey: ['patient-conversations', patientId, 'unread-counts'],
    queryFn: () => fetchUnreadCounts(patientId),
    enabled: Boolean(patientId),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time feel
  });

  // Calculate total unread
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // Create conversation mutation
  const createMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({
        queryKey: ['patient-conversations', patientId],
      });
      setSelectedConversation(newConversation);
    },
  });

  // Mark conversation as read mutation
  const markReadMutation = useMutation({
    mutationFn: markConversationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['patient-conversations', patientId, 'unread-counts'],
      });
    },
  });

  // Start a new conversation with a pharmacy
  const startConversationWithPharmacy = useCallback(
    async (pharmacyId: string, pharmacistId: string): Promise<Conversation> => {
      const createData: CreateConversationDTO = {
        type: ConversationType.DIRECT,
        participants: [
          { userId: patientId, role: 'patient' },
          { userId: pharmacistId, role: 'pharmacist' },
        ],
        metadata: {
          tags: ['patient-inquiry'],
        },
      };
      return createMutation.mutateAsync(createData);
    },
    [patientId, createMutation]
  );

  // Mark conversation as read
  const handleMarkAsRead = useCallback(
    async (conversationId: string): Promise<void> => {
      await markReadMutation.mutateAsync(conversationId);
    },
    [markReadMutation]
  );

  // Select a conversation
  const handleSelectConversation = useCallback(
    (conversation: Conversation): void => {
      setSelectedConversation(conversation);
      // Mark as read when selected
      if (unreadCounts[conversation.id] && unreadCounts[conversation.id] > 0) {
        handleMarkAsRead(conversation.id);
      }
    },
    [unreadCounts, handleMarkAsRead]
  );

  return {
    conversations: data?.conversations ?? [],
    selectedConversation,
    isLoading,
    error: error ? (error as Error).message : null,
    unreadCounts,
    totalUnread,
    selectConversation: handleSelectConversation,
    startConversationWithPharmacy,
    markAsRead: handleMarkAsRead,
    refetch,
    hasMore: (data?.offset ?? 0) + (data?.limit ?? 50) < (data?.total ?? 0),
    total: data?.total ?? 0,
  };
}
