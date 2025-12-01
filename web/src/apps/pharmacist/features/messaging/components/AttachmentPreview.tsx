/**
 * AttachmentPreview Component
 * Displays message attachments (images, documents, etc.)
 */

import React from 'react';
import { Box, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import {
  Download as DownloadIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  AudioFile as AudioIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import { MessageAttachment } from '../types/messaging.types';

interface AttachmentPreviewProps {
  attachment: MessageAttachment;
  _isOwn?: boolean;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('audio/')) return AudioIcon;
  if (type.startsWith('video/')) return VideoIcon;
  if (
    type.includes('pdf') ||
    type.includes('document') ||
    type.includes('spreadsheet')
  ) {
    return DocumentIcon;
  }
  return DocumentIcon;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const isImageType = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachment,
  _isOwn = false,
}) => {
  const FileIcon = getFileIcon(attachment.mimeType);
  const fileSize = formatFileSize(attachment.size);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box
      data-testid={`attachment-${attachment.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        my: 1,
      }}
    >
      {isImageType(attachment.mimeType) ? (
        <Box
          sx={{
            maxWidth: '100%',
            borderRadius: 1,
            overflow: 'hidden',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
            },
          }}
          onClick={handleDownload}
        >
          <img
            src={attachment.url}
            alt={attachment.filename}
            style={{
              maxWidth: '100%',
              maxHeight: 300,
              objectFit: 'cover',
              borderRadius: 4,
            }}
          />
        </Box>
      ) : (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            p: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 1,
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <FileIcon sx={{ fontSize: 24 }} />
          <Stack flex={1} spacing={0.25}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {attachment.filename}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {fileSize}
            </Typography>
          </Stack>
          <Tooltip title="Télécharger">
            <IconButton
              size="small"
              onClick={handleDownload}
              sx={{ ml: 1 }}
              data-testid={`download-btn-${attachment.id}`}
            >
              <DownloadIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Box>
  );
};
