/**
 * MessageThread Component
 * Displays messages in a patient conversation with auto-scroll
 */

import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, Stack, Button, Avatar } from '@mui/material';
import { LocalPharmacy as PharmacyIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchMessages } from '../api/messaging.api';
import { Message, MessageStatus } from '../types/messaging.types';

interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
  onMarkRead?: (messageId: string) => void;
}

const MESSAGES_PER_PAGE = 50;

/**
 * Format message timestamp
 */
function formatMessageTime(date: Date): string {
  const messageDate = new Date(date);

  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm', { locale: fr });
  }

  if (isYesterday(messageDate)) {
    return `Hier, ${format(messageDate, 'HH:mm', { locale: fr })}`;
  }

  return format(messageDate, 'dd/MM/yyyy HH:mm', { locale: fr });
}

/**
 * Message bubble component
 */
function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}): React.ReactElement {
  const bubbleColor = isOwn ? 'primary.main' : '#E8E8E8';
  const textColor = isOwn ? 'white' : 'text.primary';
  const formattedTime = formatMessageTime(new Date(message.createdAt));

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 1.5,
        px: 2,
      }}
      data-testid={`message-bubble-${message.id}`}
    >
      {!isOwn && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            mr: 1,
            bgcolor: 'primary.main',
          }}
        >
          <PharmacyIcon sx={{ fontSize: 18 }} />
        </Avatar>
      )}

      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
        }}
      >
        {!isOwn && (
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ mb: 0.5, ml: 0.5 }}
          >
            Pharmacie
          </Typography>
        )}

        <Box
          sx={{
            p: 1.5,
            backgroundColor: bubbleColor,
            color: textColor,
            borderRadius: 2,
            borderBottomLeftRadius: isOwn ? 12 : 4,
            borderBottomRightRadius: isOwn ? 4 : 12,
            boxShadow: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {message.content}
          </Typography>
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ mt: 0.5, px: 0.5 }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              color: 'text.secondary',
            }}
          >
            {formattedTime}
          </Typography>
          {isOwn && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                color: message.status === MessageStatus.READ ? 'primary.main' : 'text.secondary',
              }}
              data-testid={`message-status-${message.id}`}
            >
              {message.status === MessageStatus.READ
                ? 'Lu'
                : message.status === MessageStatus.DELIVERED
                  ? 'Delivre'
                  : message.status === MessageStatus.SENT
                    ? 'Envoye'
                    : 'En cours...'}
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export function MessageThread({
  conversationId,
  currentUserId,
  onMarkRead,
}: MessageThreadProps): React.ReactElement {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Fetch messages
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversations', conversationId, 'messages', page],
    queryFn: () => fetchMessages(conversationId, MESSAGES_PER_PAGE, page * MESSAGES_PER_PAGE),
    enabled: Boolean(conversationId),
  });

  // Update messages when data changes
  useEffect(() => {
    if (data?.messages) {
      if (page === 0) {
        setMessages(data.messages);
      } else {
        setMessages((prev) => [...data.messages, ...prev]);
      }
      setHasMore(page * MESSAGES_PER_PAGE + (data.messages?.length ?? 0) < data.total);
    }
  }, [data, page]);

  // Reset when conversation changes
  useEffect(() => {
    setMessages([]);
    setPage(0);
    setHasMore(true);
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (page === 0) {
      scrollToBottom();
    }
  }, [messages, page]);

  // Mark unread messages as read
  useEffect(() => {
    if (!onMarkRead || !conversationId) return;

    const unreadMessages = messages.filter(
      (m) => m.recipientId === currentUserId && m.status !== MessageStatus.READ
    );

    unreadMessages.forEach((message) => {
      onMarkRead(message.id);
    });
  }, [conversationId, currentUserId, messages, onMarkRead]);

  function scrollToBottom(): void {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function handleLoadMore(): void {
    setPage((prev) => prev + 1);
  }

  // No conversation selected
  if (!conversationId) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: 'text.secondary',
          p: 4,
        }}
        data-testid="no-conversation-selected"
      >
        <PharmacyIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" color="textSecondary">
          Selectionnez une conversation
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
          Choisissez une pharmacie dans la liste pour voir vos messages
        </Typography>
      </Box>
    );
  }

  // Loading state
  if (isLoading && messages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
        data-testid="loading-messages"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 4,
        }}
        data-testid="error-state"
      >
        <Typography color="error" align="center">
          Erreur lors du chargement des messages. Veuillez reessayer.
        </Typography>
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
        spacing={0}
        sx={{
          py: 2,
          flex: 1,
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              p: 4,
            }}
            data-testid="empty-messages"
          >
            <Typography color="textSecondary" align="center">
              Aucun message. Envoyez un message pour commencer la conversation.
            </Typography>
          </Box>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Stack>
    </Box>
  );
}
