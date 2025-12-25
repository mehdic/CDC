/**
 * MessagingPage Component
 * Main messaging view for patients to communicate with pharmacies
 */

import React, { useCallback, useMemo } from 'react';
import { Box, Typography, Paper, useMediaQuery, useTheme, IconButton, Drawer } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { ConversationList } from '../components/ConversationList';
import { MessageThread } from '../components/MessageThread';
import { MessageInput } from '../components/MessageInput';
import { usePatientConversations } from '../hooks/usePatientConversations';
import { usePatientMessaging } from '../hooks/usePatientMessaging';
import { getUserData } from '@shared/services/authService';
import { Conversation } from '../types/messaging.types';

interface MessagingPageProps {
  patientId?: string;
}

export function MessagingPage({ patientId }: MessagingPageProps): React.ReactElement {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileConversationOpen, setMobileConversationOpen] = React.useState(false);

  // Get current user ID from auth service if not provided
  const currentUserId = useMemo(() => {
    if (patientId) return patientId;
    const userData = getUserData();
    return userData?.id ?? '';
  }, [patientId]);

  // Hooks
  const {
    conversations,
    selectedConversation,
    isLoading: conversationsLoading,
    unreadCounts,
    selectConversation,
  } = usePatientConversations(currentUserId);

  const {
    sendingMessage,
    error: messageError,
    sendMessageToPharmacy,
    clearError,
  } = usePatientMessaging();

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    (conversation: Conversation) => {
      selectConversation(conversation);
      if (isMobile) {
        setMobileConversationOpen(true);
      }
    },
    [selectConversation, isMobile]
  );

  // Handle send message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversation) return;

      // Find the pharmacist recipient
      const pharmacist = selectedConversation.participants.find(
        (p) => p.role === 'pharmacist'
      );

      if (!pharmacist) {
        throw new Error('Aucun pharmacien trouve dans la conversation');
      }

      await sendMessageToPharmacy(
        selectedConversation.id,
        pharmacist.userId,
        content
      );
    },
    [selectedConversation, sendMessageToPharmacy]
  );

  // Handle back button on mobile
  const handleMobileBack = useCallback(() => {
    setMobileConversationOpen(false);
  }, []);

  // Conversation list component
  const conversationListComponent = (
    <ConversationList
      conversations={conversations}
      selectedId={selectedConversation?.id}
      onSelect={handleSelectConversation}
      isLoading={conversationsLoading}
      unreadCounts={unreadCounts}
      currentUserId={currentUserId}
    />
  );

  // Message thread component with input
  const messageAreaComponent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'background.default',
      }}
    >
      {/* Mobile back button */}
      {isMobile && selectedConversation && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'white',
          }}
        >
          <IconButton onClick={handleMobileBack} data-testid="mobile-back-button">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ ml: 1 }}>
            {selectedConversation.subject ?? 'Conversation'}
          </Typography>
        </Box>
      )}

      {/* Message Thread */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <MessageThread
          conversationId={selectedConversation?.id ?? ''}
          currentUserId={currentUserId}
        />
      </Box>

      {/* Message Input */}
      {selectedConversation && (
        <MessageInput
          onSend={handleSendMessage}
          isLoading={sendingMessage}
          error={messageError}
          onClearError={clearError}
        />
      )}
    </Box>
  );

  // Mobile layout with drawer
  if (isMobile) {
    return (
      <Box
        sx={{
          height: 'calc(100vh - 64px)', // Account for app bar
          display: 'flex',
          flexDirection: 'column',
        }}
        data-testid="messaging-page"
      >
        {/* Conversation list (always visible on mobile) */}
        {!mobileConversationOpen && (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {conversationListComponent}
          </Box>
        )}

        {/* Message area drawer */}
        <Drawer
          anchor="right"
          open={mobileConversationOpen}
          onClose={handleMobileBack}
          sx={{
            '& .MuiDrawer-paper': {
              width: '100%',
              height: '100%',
            },
          }}
          data-testid="mobile-message-drawer"
        >
          {messageAreaComponent}
        </Drawer>
      </Box>
    );
  }

  // Desktop layout
  return (
    <Paper
      elevation={0}
      sx={{
        height: 'calc(100vh - 120px)', // Account for app bar and padding
        display: 'flex',
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
      data-testid="messaging-page"
    >
      {/* Conversation List - Left Panel */}
      <Box
        sx={{
          width: 320,
          minWidth: 280,
          maxWidth: 400,
          borderRight: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {conversationListComponent}
      </Box>

      {/* Message Area - Right Panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {messageAreaComponent}
      </Box>
    </Paper>
  );
}

export default MessagingPage;
