/**
 * useConversations Hook
 * Handles conversation operations and queries
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Conversation,
  ConversationFilterDTO,
  CreateConversationDTO,
} from '../types/messaging.types';
import {
  fetchConversations,
  createConversation,
  updateConversation,
  fetchUnreadCounts,
} from '../api/messaging.api';

export interface UseConversationsResult {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  unreadCounts: Record<string, number>;
  selectConversation: (conversation: Conversation) => void;
  createNew: (data: CreateConversationDTO) => Promise<Conversation>;
  archiveConversation: (conversationId: string) => Promise<void>;
  refetch: () => void;
  hasMore: boolean;
  total: number;
}

/**
 * Hook for managing conversations
 */
export const useConversations = (userId: string, filters?: Partial<ConversationFilterDTO>) => {
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);

  // Fetch conversations
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversations', userId, filters],
    queryFn: () =>
      fetchConversations({
        userId,
        ...filters,
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
      }),
    enabled: !!userId,
  });

  // Fetch unread counts
  const { data: unreadCounts = {} } = useQuery({
    queryKey: ['conversations', userId, 'unread-counts'],
    queryFn: () => fetchUnreadCounts(userId),
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });

  // Create conversation mutation
  const createMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({
        queryKey: ['conversations', userId],
      });
      setSelectedConversation(newConversation);
    },
  });

  // Archive conversation mutation
  const archiveMutation = useMutation({
    mutationFn: (conversationId: string) =>
      updateConversation(conversationId, {
        metadata: { archived: true },
      } as Partial<Conversation>),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['conversations', userId],
      });
    },
  });


  const handleCreateNew = async (createData: CreateConversationDTO): Promise<Conversation> => {
    return createMutation.mutateAsync(createData);
  };

  const handleArchive = async (conversationId: string): Promise<void> => {
    await archiveMutation.mutateAsync(conversationId);
  };

  const handleSelectConversation = (conversation: Conversation): void => {
    setSelectedConversation(conversation);
  };

  return {
    conversations: data?.conversations || [],
    selectedConversation,
    isLoading,
    error: error ? (error as Error).message : null,
    unreadCounts,
    selectConversation: handleSelectConversation,
    createNew: handleCreateNew,
    archiveConversation: handleArchive,
    refetch,
    hasMore: (data?.offset || 0) + (data?.limit || 50) < (data?.total || 0),
    total: data?.total || 0,
  };
};

// Import React for the hook
import React from 'react';
