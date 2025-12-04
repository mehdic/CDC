/**
 * MessageThread Component
 * Displays messages in a conversation with real-time updates
 */

import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, Stack, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchMessages } from './api/messaging.api';
import { Message, MessageStatus } from './types/messaging.types';
import { MessageBubble } from './components/MessageBubble';
import { useMessageUpdates } from './hooks/useWebSocket';

interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
  _isLoading?: boolean;
  onMarkRead?: (messageId: string) => void;
}

const MESSAGES_PER_PAGE = 50;

export const MessageThread: React.FC<MessageThreadProps> = ({
  conversationId,
  currentUserId,
  _isLoading = false,
  onMarkRead,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Fetch messages
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversations', conversationId, 'messages', page],
    queryFn: () => fetchMessages(conversationId, MESSAGES_PER_PAGE, page * MESSAGES_PER_PAGE),
    enabled: !!conversationId,
  });

  // Handle real-time message updates
  const handleNewMessage = (newMessage: Message): void => {
    if (newMessage.conversationId === conversationId) {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMessage.id);
        return exists ? prev : [...prev, newMessage];
      });
      // Auto-scroll to new message
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const handleStatusUpdate = (messageId: string, status: string): void => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, status: status as MessageStatus } : m
      )
    );
  };

  useMessageUpdates(conversationId, handleNewMessage, handleStatusUpdate);

  // Update messages when data changes
  useEffect(() => {
    if (data?.messages) {
      if (page === 0) {
        setMessages(data.messages);
      } else {
        setMessages((prev) => [...data.messages, ...prev]);
      }
      setHasMore((page * 20) + (data.messages?.length || 0) < data.total);
    }
  }, [data, page]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  // Mark messages as read when visible
  useEffect(() => {
    if (!onMarkRead || !conversationId) return;

    const unreadMessages = messages.filter(
      (m) => m.recipientId === currentUserId && m.status !== 'read'
    );

    unreadMessages.forEach((message) => {
      onMarkRead(message.id);
    });
  }, [conversationId, currentUserId, messages, onMarkRead]);

  if (!conversationId) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: 'textSecondary',
        }}
      >
        <Typography>Sélectionnez une conversation pour commencer</Typography>
      </Box>
    );
  }

  if (isLoading && messages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Typography color="error">Erreur lors du chargement des messages</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
        backgroundColor: '#fafafa',
      }}
      data-testid="message-thread"
    >
      {/* Load More Button */}
      {hasMore && messages.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <Button
            size="small"
            onClick={handleLoadMore}
            disabled={isLoading}
            data-testid="load-more-btn"
          >
            {isLoading ? <CircularProgress size={20} /> : 'Charger plus de messages'}
          </Button>
        </Box>
      )}

      {/* Messages */}
      <Stack
        spacing={2}
        sx={{
          p: 2,
          flex: 1,
          overflow: 'auto',
        }}
      >
        {messages.length === 0 ? (
          <Typography color="textSecondary" align="center" sx={{ mt: 4 }}>
            Aucun message dans cette conversation
          </Typography>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              showTimestamp={true}
              senderName={message.senderRole}
              data-testid={`message-${message.id}`}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Stack>
    </Box>
  );
};
