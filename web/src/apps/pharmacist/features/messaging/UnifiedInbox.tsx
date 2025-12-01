/**
 * UnifiedInbox Component
 * Main container for the unified messaging inbox
 * Task: P0-MSG-FE - Implement messaging frontend for pharmacists
 */

import React, { useState } from 'react';
import { Box, Grid, Paper, Stack, Button, Tooltip } from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { MessageChannel, MessageAttachment } from './types/messaging.types';
import { useConversations } from './hooks/useConversations';
import { useMessaging } from './hooks/useMessaging';
import { ChannelTabs } from './components/ChannelTabs';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { MessageComposer } from './MessageComposer';
import { ContactSelector, ContactOption } from './ContactSelector';

interface UnifiedInboxProps {
  currentUserId: string;
  currentRole?: string;
}

export const UnifiedInbox: React.FC<UnifiedInboxProps> = ({
  currentUserId,
  currentRole = 'pharmacist',
}) => {
  const [activeChannel, setActiveChannel] = useState<MessageChannel>(MessageChannel.IN_APP);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  // Get conversations
  const {
    conversations,
    selectedConversation,
    selectConversation,
    createNew,
    archiveConversation,
    unreadCounts,
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useConversations(currentUserId, {
    limit: 50,
  });

  // Get messaging functions
  const { sendMessage, markAsRead, isLoading: messagingLoading } = useMessaging();

  // Filter conversations by active channel
  const filteredConversations = conversations.filter((_conv) => {
    // In a real app, conversations would have a channel property
    // For now, show all conversations for all channels
    return true;
  });

  const handleSendMessage = async (content: string, attachments?: MessageAttachment[]) => {
    if (!selectedConversation) {
      setComposerError('Veuillez sélectionner une conversation');
      return;
    }

    try {
      const otherParticipant = selectedConversation.participants.find(
        (p) => p.userId !== currentUserId
      );

      if (!otherParticipant) {
        throw new Error('Participant non trouvé');
      }

      await sendMessage({
        conversationId: selectedConversation.id,
        recipientId: otherParticipant.userId,
        recipientRole: otherParticipant.role,
        content,
        channel: activeChannel,
        attachments,
      });

      setComposerError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'envoi';
      setComposerError(message);
      throw error;
    }
  };

  const handleCreateConversation = async (contact: ContactOption) => {
    try {
      const newConversation = await createNew({
        type: 'direct',
        participants: [
          { userId: currentUserId, role: currentRole },
          { userId: contact.id, role: contact.role },
        ],
        subject: contact.name,
      });

      selectConversation(newConversation);
      setShowContactSelector(false);
      setComposerError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création';
      setComposerError(message);
    }
  };


  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 0,
        }}
        elevation={0}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <h2 style={{ margin: 0 }}>Messagerie Unifiée</h2>
          <Tooltip title="Rafraîchir">
            <Button
              variant="outlined"
              size="small"
              onClick={refetchConversations}
              disabled={conversationsLoading}
              startIcon={<RefreshIcon />}
            >
              Rafraîchir
            </Button>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Nouveau message">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowContactSelector(true)}
            >
              Nouveau
            </Button>
          </Tooltip>
          <Tooltip title="Paramètres">
            <Button variant="outlined" size="small" startIcon={<SettingsIcon />} />
          </Tooltip>
        </Stack>
      </Paper>

      {/* Channel Tabs */}
      <ChannelTabs
        activeChannel={activeChannel}
        onChannelChange={setActiveChannel}
        unreadCounts={{
          [MessageChannel.IN_APP]: unreadCounts[MessageChannel.IN_APP] || 0,
          [MessageChannel.WHATSAPP]: unreadCounts[MessageChannel.WHATSAPP] || 0,
          [MessageChannel.EMAIL]: unreadCounts[MessageChannel.EMAIL] || 0,
          [MessageChannel.FAX]: unreadCounts[MessageChannel.FAX] || 0,
        }}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Grid container spacing={0} sx={{ height: '100%' }}>
          {/* Conversations List */}
          <Grid item xs={12} sm={4} sx={{ height: '100%', overflow: 'auto' }}>
            <ConversationList
              conversations={filteredConversations}
              selectedId={selectedConversation?.id}
              onSelect={selectConversation}
              isLoading={conversationsLoading}
              onArchive={archiveConversation}
              unreadCounts={unreadCounts}
            />
          </Grid>

          {/* Messages Area */}
          <Grid
            item
            xs={12}
            sm={8}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: { sm: '1px solid', borderColor: 'divider' },
            }}
          >
            {selectedConversation ? (
              <>
                {/* Message Thread */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <MessageThread
                    conversationId={selectedConversation.id}
                    currentUserId={currentUserId}
                    isLoading={messagingLoading}
                    onMarkRead={markAsRead}
                  />
                </Box>

                {/* Message Composer */}
                <MessageComposer
                  onSend={handleSendMessage}
                  isLoading={messagingLoading}
                  error={composerError}
                  onError={setComposerError}
                  disabled={messagingLoading}
                />
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  color: 'textSecondary',
                }}
              >
                <p>Sélectionnez une conversation pour commencer</p>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowContactSelector(true)}
                >
                  Créer une nouvelle conversation
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Contact Selector Dialog */}
      <ContactSelector
        open={showContactSelector}
        onClose={() => setShowContactSelector(false)}
        onSelect={handleCreateConversation}
        multiSelect={false}
      />
    </Box>
  );
};
