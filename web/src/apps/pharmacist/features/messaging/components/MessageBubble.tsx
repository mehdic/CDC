/**
 * MessageBubble Component
 * Displays a single message with formatting and status
 */

import React from 'react';
import { Box, Paper, Typography, Stack, Avatar, Tooltip } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Message, MessageChannel } from '../types/messaging.types';
import { StatusIndicator } from './StatusIndicator';
import { AttachmentPreview } from './AttachmentPreview';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTimestamp?: boolean;
  showAvatar?: boolean;
  senderName?: string;
}

const getChannelColor = (channel: MessageChannel): string => {
  switch (channel) {
    case MessageChannel.WHATSAPP:
      return '#25D366';
    case MessageChannel.EMAIL:
      return '#EA4335';
    case MessageChannel.FAX:
      return '#4285F4';
    case MessageChannel.IN_APP:
      return '#1976D2';
    default:
      return '#757575';
  }
};

const getChannelLabel = (channel: MessageChannel): string => {
  switch (channel) {
    case MessageChannel.WHATSAPP:
      return 'WhatsApp';
    case MessageChannel.EMAIL:
      return 'Email';
    case MessageChannel.FAX:
      return 'Fax';
    case MessageChannel.IN_APP:
      return 'In-App';
    default:
      return 'Inconnu';
  }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showTimestamp = true,
  showAvatar = false,
  senderName = 'Utilisateur',
}) => {
  const bubbleColor = isOwn ? 'primary.main' : '#E0E0E0';
  const textColor = isOwn ? 'white' : 'text.primary';
  const channelColor = getChannelColor(message.channel);
  const formattedTime = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 2,
        alignItems: 'flex-end',
        gap: 1,
      }}
      data-testid={`message-bubble-${message.id}`}
    >
      {showAvatar && !isOwn && (
        <Avatar
          sx={{
            bgcolor: channelColor,
            width: 32,
            height: 32,
            fontSize: '0.75rem',
          }}
        >
          {senderName.charAt(0)}
        </Avatar>
      )}

      <Stack
        direction={isOwn ? 'row-reverse' : 'row'}
        alignItems="flex-end"
        gap={0.5}
        sx={{ maxWidth: '70%', wordBreak: 'break-word' }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            backgroundColor: bubbleColor,
            color: textColor,
            borderRadius: 2,
            borderBottomLeftRadius: isOwn ? 12 : 4,
            borderBottomRightRadius: isOwn ? 4 : 12,
          }}
        >
          {!isOwn && (
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              {senderName}
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              mb: message.attachments?.length ? 1 : 0,
            }}
          >
            {message.content}
          </Typography>

          {message.attachments && message.attachments.length > 0 && (
            <Stack spacing={0.5}>
              {message.attachments.map((attachment) => (
                <AttachmentPreview
                  key={attachment.id}
                  attachment={attachment}
                  _isOwn={isOwn}
                />
              ))}
            </Stack>
          )}

          <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5} mt={0.5}>
            {showTimestamp && (
              <Typography
                variant="caption"
                sx={{
                  opacity: isOwn ? 0.7 : 0.6,
                  fontSize: '0.7rem',
                }}
              >
                {formattedTime}
              </Typography>
            )}
            {isOwn && <StatusIndicator status={message.status} size="small" />}
          </Stack>
        </Paper>

        {!isOwn && (
          <Tooltip title={getChannelLabel(message.channel)}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: channelColor,
              }}
              data-testid={`channel-indicator-${message.channel}`}
            />
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};
