/**
 * ConversationList Component
 * Displays list of patient conversations with pharmacies
 */

import React, { useState, useMemo } from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  TextField,
  Typography,
  CircularProgress,
  Box,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalPharmacy as PharmacyIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Conversation } from '../types/messaging.types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  isLoading?: boolean;
  unreadCounts?: Record<string, number>;
  currentUserId?: string;
}

/**
 * Get display name for conversation (pharmacy/pharmacist name)
 */
function getPharmacyName(conversation: Conversation, currentUserId?: string): string {
  if (conversation.subject) return conversation.subject;

  // Find the pharmacist participant
  const pharmacist = conversation.participants.find(
    (p) => p.role === 'pharmacist' && (!currentUserId || p.userId !== currentUserId)
  );

  if (pharmacist) {
    return `Pharmacie ${pharmacist.userId}`;
  }

  return 'Conversation';
}

/**
 * Get formatted last message time
 */
function getLastMessageTime(conversation: Conversation): string {
  if (!conversation.lastMessageAt) return 'Pas de messages';
  return formatDistanceToNow(new Date(conversation.lastMessageAt), {
    addSuffix: true,
    locale: fr,
  });
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading = false,
  unreadCounts = {},
  currentUserId,
}: ConversationListProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const name = getPharmacyName(conv, currentUserId).toLowerCase();
      return name.includes(query) || conv.subject?.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery, currentUserId]);

  // Sort by most recent first
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredConversations]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'white',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
      data-testid="patient-conversation-list"
    >
      {/* Search Bar */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          placeholder="Rechercher une pharmacie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          data-testid="conversation-search-input"
        />
      </Box>

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
            data-testid="loading-indicator"
          >
            <CircularProgress />
          </Box>
        ) : sortedConversations.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
              px: 2,
            }}
            data-testid="empty-state"
          >
            <PharmacyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography color="textSecondary" align="center">
              {searchQuery
                ? 'Aucune conversation trouvee'
                : 'Aucune conversation. Contactez votre pharmacie pour commencer.'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding data-testid="conversations-list">
            {sortedConversations.map((conversation) => {
              const unreadCount = unreadCounts[conversation.id] ?? 0;
              const isSelected = selectedId === conversation.id;
              const pharmacyName = getPharmacyName(conversation, currentUserId);
              const lastMessageTime = getLastMessageTime(conversation);

              return (
                <ListItemButton
                  key={conversation.id}
                  selected={isSelected}
                  onClick={() => onSelect(conversation)}
                  data-testid={`conversation-item-${conversation.id}`}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={unreadCount}
                      color="primary"
                      overlap="circular"
                      invisible={unreadCount === 0}
                      data-testid={unreadCount > 0 ? 'unread-badge' : undefined}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <PharmacyIcon />
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: unreadCount > 0 ? 700 : 400,
                            color: unreadCount > 0 ? 'text.primary' : 'text.secondary',
                          }}
                        >
                          {pharmacyName}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ whiteSpace: 'nowrap', ml: 1 }}
                        >
                          {lastMessageTime}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      unreadCount > 0 && (
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ fontWeight: 500 }}
                        >
                          {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''} message
                          {unreadCount > 1 ? 's' : ''}
                        </Typography>
                      )
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}
