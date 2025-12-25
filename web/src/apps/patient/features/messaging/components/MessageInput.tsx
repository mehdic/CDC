/**
 * MessageInput Component
 * Text input for composing and sending messages
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
  placeholder?: string;
  maxLength?: number;
}

const DEFAULT_MAX_LENGTH = 2000;

export function MessageInput({
  onSend,
  disabled = false,
  isLoading = false,
  error = null,
  onClearError,
  placeholder = 'Ecrivez votre message...',
  maxLength = DEFAULT_MAX_LENGTH,
}: MessageInputProps): React.ReactElement {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const isDisabled = disabled || isLoading || sending;
  const isEmpty = !content.trim();
  const isOverLimit = content.length > maxLength;
  const remainingChars = maxLength - content.length;

  const handleSend = useCallback(async () => {
    if (isEmpty || isDisabled || isOverLimit) return;

    const messageContent = content.trim();
    try {
      setSending(true);
      await onSend(messageContent);
      setContent('');
      if (onClearError) {
        onClearError();
      }
    } catch {
      // Error is handled by parent via error prop
    } finally {
      setSending(false);
    }
  }, [content, isEmpty, isDisabled, isOverLimit, onSend, onClearError]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Send on Enter (without Shift for newline)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setContent(e.target.value);
    },
    []
  );

  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'white',
      }}
      data-testid="message-input-container"
    >
      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          onClose={onClearError}
          sx={{ mb: 2 }}
          data-testid="message-error-alert"
        >
          {error}
        </Alert>
      )}

      {/* Input Row */}
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          size="small"
          error={isOverLimit}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: '#f5f5f5',
            },
          }}
          inputProps={{
            'data-testid': 'message-input',
            'aria-label': 'Message',
          }}
        />

        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={isEmpty || isDisabled || isOverLimit}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '&.Mui-disabled': {
              backgroundColor: 'action.disabledBackground',
              color: 'action.disabled',
            },
          }}
          data-testid="send-button"
          aria-label="Envoyer le message"
        >
          {sending ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Stack>

      {/* Character Counter */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: isOverLimit
              ? 'error.main'
              : remainingChars < 100
                ? 'warning.main'
                : 'text.secondary',
          }}
          data-testid="character-counter"
        >
          {content.length}/{maxLength}
        </Typography>
      </Box>
    </Box>
  );
}
