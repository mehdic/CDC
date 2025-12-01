/**
 * MessageComposer Component
 * Rich text input for composing messages with attachments
 */

import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { MessageAttachment } from './types/messaging.types';

interface MessageComposerProps {
  onSend: (content: string, attachments?: MessageAttachment[]) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onError?: (error: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  allowAttachments?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  isLoading = false,
  error = null,
  onError,
  disabled = false,
  placeholder = 'Votre message...',
  maxLength = 5000,
  allowAttachments = true,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = disabled || isLoading || sending;
  const isEmpty = !content.trim() && attachments.length === 0;
  const isOverLimit = content.length > maxLength;

  const handleSend = async () => {
    if (isEmpty || isDisabled || isOverLimit) return;

    try {
      setSending(true);
      await onSend(content, attachments.length > 0 ? attachments : undefined);
      setContent('');
      setAttachments([]);
      if (onError) onError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
      if (onError) onError(message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSend();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    // Process selected files (simplified - in real app would upload to backend)
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment: MessageAttachment = {
          id: Math.random().toString(36).substr(2, 9),
          filename: file.name,
          type: file.type.startsWith('image') ? 'image' : 'document',
          url: event.target?.result as string,
          size: file.size,
          mimeType: file.type,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: '#fafafa',
      }}
      data-testid="message-composer"
    >
      {error && (
        <Alert severity="error" onClose={() => onError?.('')} sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', useFlexGap: true }}>
          {attachments.map((attachment) => (
            <Chip
              key={attachment.id}
              label={attachment.filename}
              onDelete={() => handleRemoveAttachment(attachment.id)}
              size="small"
              data-testid={`attachment-chip-${attachment.id}`}
            />
          ))}
        </Stack>
      )}

      {/* Composer Input */}
      <Stack spacing={1}>
        <TextField
          fullWidth
          multiline
          maxRows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          size="small"
          error={isOverLimit}
          helperText={
            isOverLimit
              ? `Limite dépassée (${content.length}/${maxLength})`
              : `${content.length}/${maxLength}`
          }
          inputProps={{ maxLength }}
          data-testid="message-input"
        />

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
          {allowAttachments && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={isDisabled}
                data-testid="file-input"
              />
              <Tooltip title="Ajouter une pièce jointe">
                <span>
                  <IconButton
                    onClick={handleAttachmentClick}
                    disabled={isDisabled}
                    size="small"
                    data-testid="attach-btn"
                  >
                    <AttachFileIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}

          {content.trim() && (
            <Tooltip title="Effacer le message">
              <IconButton
                onClick={() => setContent('')}
                disabled={isDisabled}
                size="small"
                data-testid="clear-btn"
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}

          <Button
            variant="contained"
            endIcon={
              sending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )
            }
            onClick={handleSend}
            disabled={isEmpty || isDisabled || isOverLimit}
            data-testid="send-btn"
          >
            Envoyer
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
