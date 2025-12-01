/**
 * Secure Messaging Component
 * Doctor-Pharmacist secure communication
 * Task: T4-032 - Doctor-Pharmacist Messaging
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Paper,
  Badge,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Paperclip as PaperclipIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useDoctorMessageThreads, useDoctorMessageThread, useSendMessage } from '../hooks/useDoctor';
import { getUserData } from '@shared/services/authService';
import type { MessageThread, Message } from '../types/doctor';

// ============================================================================
// Message Bubble Component
// ============================================================================

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      mb: 2,
    }}
    data-testid={`message-${message.id}`}
  >
    <Box
      sx={{
        maxWidth: '70%',
        p: 1.5,
        borderRadius: 2,
        backgroundColor: isOwn ? '#1976d2' : '#f5f5f5',
        color: isOwn ? 'white' : 'text.primary',
      }}
    >
      {!isOwn && (
        <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
          {message.senderName}
        </Typography>
      )}
      <Typography variant="body2">{message.content}</Typography>
      {message.attachments && message.attachments.length > 0 && (
        <Box sx={{ mt: 1, pt: 1, borderTop: isOwn ? '1px solid rgba(255,255,255,0.3)' : '1px solid #e0e0e0' }}>
          {message.attachments.map((attachment) => (
            <Box
              key={attachment.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 0.5,
                backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : '#e8e8e8',
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <PaperclipIcon sx={{ fontSize: 16 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {attachment.fileName}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                  {(attachment.fileSize / 1024).toFixed(1)} KB
                </Typography>
              </Box>
              <Button
                size="small"
                href={attachment.downloadUrl}
                download
                sx={{ color: 'inherit', minWidth: 'auto', p: 0.5 }}
              >
                ↓
              </Button>
            </Box>
          ))}
        </Box>
      )}
      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
        {new Date(message.timestamp).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
      </Typography>
    </Box>
  </Box>
);

// ============================================================================
// Thread List Item Component
// ============================================================================

interface ThreadListItemProps {
  thread: MessageThread;
  isSelected: boolean;
  onSelect: (threadId: string) => void;
}

const ThreadListItem: React.FC<ThreadListItemProps> = ({ thread, isSelected, onSelect }) => (
  <ListItemButton
    selected={isSelected}
    onClick={() => onSelect(thread.id)}
    data-testid={`thread-item-${thread.id}`}
  >
    <ListItemText
      primary={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            fontWeight={thread.unreadCount > 0 ? 'bold' : 'normal'}
            sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {thread.participantName}
          </Typography>
          {thread.unreadCount > 0 && (
            <Badge badgeContent={thread.unreadCount} color="primary" data-testid="unread-badge" />
          )}
        </Box>
      }
      secondary={
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {thread.participantRole}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: thread.unreadCount > 0 ? '600' : 'normal',
            }}
          >
            {thread.lastMessage}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(thread.lastMessageTime).toLocaleString('fr-CH')}
          </Typography>
        </Box>
      }
    />
  </ListItemButton>
);

// ============================================================================
// Main Secure Messaging Component
// ============================================================================

export const SecureMessaging: React.FC = () => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user
  const currentUser = getUserData();

  // API hooks
  const { data: threadsData, isLoading: threadsLoading } = useDoctorMessageThreads();
  const { data: threadData, isLoading: threadLoading } = useDoctorMessageThread(selectedThreadId || '');
  const sendMutation = useSendMessage();

  const threads = threadsData?.data.threads || [];
  const currentThread = threadData?.data;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handleSendMessage = async () => {
    if (!selectedThreadId || !messageContent.trim()) return;

    try {
      await sendMutation.mutateAsync({
        conversationId: selectedThreadId,
        content: messageContent,
        attachments: selectedFiles.map((f) => f.name), // In real app, would upload files first
      });

      setMessageContent('');
      setSelectedFiles([]);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setSelectedFiles(selectedFiles.filter((f) => f.name !== fileName));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom data-testid="page-title">
          Messagerie Sécurisée
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Communication confidentielle avec les pharmaciens
        </Typography>
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        {/* Thread List */}
        <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* List Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
              <Typography variant="subtitle2" fontWeight="bold" data-testid="conversations-title">
                Conversations
              </Typography>
            </Box>

            {/* Thread List */}
            {threadsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <CircularProgress />
              </Box>
            ) : threads.length > 0 ? (
              <List sx={{ flex: 1, overflow: 'auto' }} data-testid="thread-list">
                {threads.map((thread, idx) => (
                  <Box key={thread.id}>
                    <ThreadListItem
                      thread={thread}
                      isSelected={selectedThreadId === thread.id}
                      onSelect={handleSelectThread}
                    />
                    {idx < threads.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Aucune conversation
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Message Area */}
        <Grid item xs={12} md={9} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {!selectedThreadId ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Sélectionnez une conversation
                </Typography>
              </Box>
            ) : (
              <>
                {/* Chat Header */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                  {currentThread && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {currentThread.participantName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currentThread.participantRole}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Messages Area */}
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    backgroundColor: '#fafafa',
                  }}
                  data-testid="messages-area"
                >
                  {threadLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : currentThread?.messages ? (
                    <>
                      {currentThread.messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isOwn={message.senderId === currentUser?.id}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  ) : null}
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: 'white' }}>
                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <Box sx={{ mb: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Pièces jointes:
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {selectedFiles.map((file) => (
                          <Box
                            key={file.name}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              p: 0.75,
                              backgroundColor: 'white',
                              borderRadius: 1,
                              border: '1px solid #e0e0e0',
                              mb: 1,
                            }}
                            data-testid={`selected-file-${file.name}`}
                          >
                            <PaperclipIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">{file.name}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveFile(file.name)}
                              sx={{ p: 0, ml: 'auto' }}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Message Input */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      minRows={1}
                      placeholder="Écrivez votre message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleSendMessage();
                        }
                      }}
                      disabled={sendMutation.isPending}
                      data-testid="message-input"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              component="label"
                              disabled={sendMutation.isPending}
                              data-testid="attach-file-button"
                            >
                              <AttachFileIcon />
                              <input
                                hidden
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                data-testid="file-input"
                              />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() || sendMutation.isPending}
                      endIcon={sendMutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
                      data-testid="send-button"
                    >
                      Envoyer
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SecureMessaging;
