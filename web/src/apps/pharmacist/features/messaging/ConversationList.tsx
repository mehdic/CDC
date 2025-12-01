/**
 * ConversationList Component
 * Displays list of conversations with search and filtering
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
  Stack,
  Typography,
  CircularProgress,
  Box,
  Chip,
  InputAdornment,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Conversation } from './types/messaging.types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  isLoading?: boolean;
  onArchive?: (conversationId: string) => void;
  onDelete?: (conversationId: string) => void;
  unreadCounts?: Record<string, number>;
}

const getParticipantName = (conversation: Conversation, currentUserId?: string): string => {
  if (conversation.subject) return conversation.subject;

  const otherParticipants = conversation.participants.filter(
    (p) => !currentUserId || p.userId !== currentUserId
  );

  if (otherParticipants.length === 0) return 'Conversation';
  if (otherParticipants.length === 1) return otherParticipants[0].userId;

  return `${otherParticipants.length} participants`;
};

const getLastMessagePreview = (conversation: Conversation): string => {
  if (!conversation.lastMessageAt) return 'Pas de messages';
  return formatDistanceToNow(new Date(conversation.lastMessageAt), {
    addSuffix: true,
    locale: fr,
  });
};

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  isLoading = false,
  onArchive,
  onDelete,
  unreadCounts = {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!searchQuery) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.subject?.toLowerCase().includes(query) ||
        conv.participants.some((p) => p.userId.toLowerCase().includes(query))
    );
  }, [conversations, searchQuery]);

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>, conversationId: string) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setSelectedConversationId(conversationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedConversationId(null);
  };

  const handleArchive = (conversationId: string) => {
    onArchive?.(conversationId);
    handleMenuClose();
  };

  const handleDelete = (conversationId: string) => {
    onDelete?.(conversationId);
    handleMenuClose();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'white',
      }}
      data-testid="conversation-list"
    >
      {/* Search Bar */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          placeholder="Rechercher les conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          data-testid="conversation-search"
        />
      </Box>

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <Typography color="textSecondary">
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filtered.map((conversation) => {
              const unreadCount = unreadCounts[conversation.id] || 0;
              const isSelected = selectedId === conversation.id;
              const participantName = getParticipantName(conversation);
              const lastMessage = getLastMessagePreview(conversation);

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
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={unreadCount}
                      color="primary"
                      overlap="circular"
                      invisible={unreadCount === 0}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {participantName.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: unreadCount > 0 ? 600 : 400,
                            flex: 1,
                          }}
                        >
                          {participantName}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          {lastMessage}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={1} spacing-mt={0.5} alignItems="center">
                        {conversation.metadata?.tags?.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20 }}
                          />
                        ))}
                      </Stack>
                    }
                  />

                  {/* Actions Menu */}
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleMenuOpen(e, conversation.id)}
                    data-testid={`conversation-menu-${conversation.id}`}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => selectedConversationId && handleArchive(selectedConversationId)}
          data-testid="menu-archive"
        >
          <ArchiveIcon sx={{ mr: 1, fontSize: 20 }} />
          Archiver
        </MenuItem>
        <MenuItem
          onClick={() => selectedConversationId && handleDelete(selectedConversationId)}
          data-testid="menu-delete"
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Supprimer
        </MenuItem>
      </Menu>
    </Box>
  );
};
