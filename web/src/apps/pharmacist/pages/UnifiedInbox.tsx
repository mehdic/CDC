/**
 * Unified Inbox Page
 * Multi-channel messaging interface for pharmacists
 *
 * Supports:
 * - WhatsApp messages
 * - Email messages
 * - Fax messages
 * - In-app messages
 * - Channel filtering
 * - Conversation threading
 * - Reply from any channel
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Chip,
  TextField,
  Button,
  IconButton,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  InputAdornment,
  Stack,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Fax as FaxIcon,
  Message as MessageIcon,
  Search as SearchIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// ============================================================================
// Types
// ============================================================================

enum MessageChannel {
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  FAX = 'fax',
  IN_APP = 'in-app',
}

interface Message {
  id: string;
  conversationId: string;
  channel: MessageChannel;
  direction: 'inbound' | 'outbound';
  from: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  subject?: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

interface Conversation {
  id: string;
  channel: MessageChannel;
  participantName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

// ============================================================================
// Channel Icon Component
// ============================================================================

const ChannelIcon: React.FC<{ channel: MessageChannel; size?: 'small' | 'medium' }> = ({ channel, size = 'medium' }) => {
  const iconSize = size === 'small' ? 16 : 24;

  switch (channel) {
    case MessageChannel.WHATSAPP:
      return <WhatsAppIcon sx={{ fontSize: iconSize, color: '#25D366' }} />;
    case MessageChannel.EMAIL:
      return <EmailIcon sx={{ fontSize: iconSize, color: '#1976d2' }} />;
    case MessageChannel.FAX:
      return <FaxIcon sx={{ fontSize: iconSize, color: '#9c27b0' }} />;
    case MessageChannel.IN_APP:
      return <MessageIcon sx={{ fontSize: iconSize, color: '#ff9800' }} />;
    default:
      return <MessageIcon sx={{ fontSize: iconSize }} />;
  }
};

// ============================================================================
// Channel Filter Component
// ============================================================================

interface ChannelFilterProps {
  activeChannel: MessageChannel | 'all';
  onChannelChange: (channel: MessageChannel | 'all') => void;
  unreadCounts: Record<MessageChannel | 'all', number>;
}

const ChannelFilter: React.FC<ChannelFilterProps> = ({ activeChannel, onChannelChange, unreadCounts }) => {
  return (
    <Tabs
      value={activeChannel}
      onChange={(e, value) => onChannelChange(value)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Tab
        value="all"
        label={
          <Badge badgeContent={unreadCounts.all} color="error" max={99}>
            <Typography>Tous</Typography>
          </Badge>
        }
      />
      <Tab
        value={MessageChannel.WHATSAPP}
        label={
          <Badge badgeContent={unreadCounts.whatsapp} color="error" max={99}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ChannelIcon channel={MessageChannel.WHATSAPP} size="small" />
              <Typography>WhatsApp</Typography>
            </Stack>
          </Badge>
        }
      />
      <Tab
        value={MessageChannel.EMAIL}
        label={
          <Badge badgeContent={unreadCounts.email} color="error" max={99}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ChannelIcon channel={MessageChannel.EMAIL} size="small" />
              <Typography>Email</Typography>
            </Stack>
          </Badge>
        }
      />
      <Tab
        value={MessageChannel.FAX}
        label={
          <Badge badgeContent={unreadCounts.fax} color="error" max={99}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ChannelIcon channel={MessageChannel.FAX} size="small" />
              <Typography>Fax</Typography>
            </Stack>
          </Badge>
        }
      />
      <Tab
        value={MessageChannel.IN_APP}
        label={
          <Badge badgeContent={unreadCounts['in-app']} color="error" max={99}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ChannelIcon channel={MessageChannel.IN_APP} size="small" />
              <Typography>In-App</Typography>
            </Stack>
          </Badge>
        }
      />
    </Tabs>
  );
};

// ============================================================================
// Conversation List Component
// ============================================================================

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onRefresh,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            placeholder="Rechercher..."
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={onRefresh} size="small" disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && filteredConversations.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Aucune conversation</Typography>
          </Box>
        )}

        {!isLoading &&
          filteredConversations.map((conversation) => (
            <ListItem key={conversation.id} disablePadding>
              <ListItemButton
                selected={conversation.id === selectedConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={conversation.unreadCount}
                    color="error"
                    max={99}
                    overlap="circular"
                  >
                    <Avatar>
                      <ChannelIcon channel={conversation.channel} />
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight={conversation.unreadCount > 0 ? 'bold' : 'normal'}>
                        {conversation.participantName}
                      </Typography>
                      <ChannelIcon channel={conversation.channel} size="small" />
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conversation.lastMessage}
                      </Typography>
                      <Typography component="span" variant="caption" color="text.secondary">
                        {new Date(conversation.lastMessageAt).toLocaleDateString('fr-CH')}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Paper>
  );
};

// ============================================================================
// Message Thread Component
// ============================================================================

interface MessageThreadProps {
  messages: Message[];
  onSendMessage: (body: string) => void;
  isLoading: boolean;
  conversationChannel: MessageChannel;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  onSendMessage,
  isLoading,
  conversationChannel,
}) => {
  const [messageBody, setMessageBody] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSend = () => {
    if (messageBody.trim()) {
      onSendMessage(messageBody);
      setMessageBody('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ChannelIcon channel={conversationChannel} />
          <Typography variant="h6">
            {conversationChannel === MessageChannel.WHATSAPP && 'WhatsApp'}
            {conversationChannel === MessageChannel.EMAIL && 'Email'}
            {conversationChannel === MessageChannel.FAX && 'Fax'}
            {conversationChannel === MessageChannel.IN_APP && 'In-App'}
          </Typography>
        </Stack>
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>Marquer comme lu</MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>Archiver</MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>Bloquer</MenuItem>
        </Menu>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && messages.length === 0 && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="text.secondary">Aucun message</Typography>
          </Box>
        )}

        {!isLoading &&
          messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.direction === 'outbound' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: message.direction === 'outbound' ? 'primary.main' : 'grey.100',
                  color: message.direction === 'outbound' ? 'white' : 'text.primary',
                }}
              >
                {message.subject && (
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    {message.subject}
                  </Typography>
                )}
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.body}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    opacity: 0.7,
                  }}
                >
                  {new Date(message.createdAt).toLocaleString('fr-CH')}
                </Typography>
              </Paper>
            </Box>
          ))}
      </Box>

      <Divider />

      {/* Compose */}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1}>
          <IconButton size="small">
            <AttachFileIcon />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Écrire un message..."
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
          />
          <IconButton color="primary" onClick={handleSend} disabled={!messageBody.trim()}>
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
    </Paper>
  );
};

// ============================================================================
// Main Unified Inbox Component
// ============================================================================

export const UnifiedInbox: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<MessageChannel | 'all'>('all');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock unread counts
  const [unreadCounts] = useState({
    all: 5,
    whatsapp: 2,
    email: 1,
    fax: 1,
    'in-app': 1,
  });

  // Load conversations
  const loadConversations = async () => {
    setIsLoadingConversations(true);
    setError(null);

    try {
      // STUB: In production, this would fetch from API
      // const response = await fetch(`/api/messaging/conversations?pharmacyId=${pharmacyId}&channel=${activeChannel !== 'all' ? activeChannel : ''}`);
      // const data = await response.json();

      // Mock data
      const mockConversations: Conversation[] = [
        {
          id: 'conv-1',
          channel: MessageChannel.WHATSAPP,
          participantName: 'Dr. Jean Dupont',
          lastMessage: 'Merci pour la prescription',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 2,
        },
        {
          id: 'conv-2',
          channel: MessageChannel.EMAIL,
          participantName: 'Patient Marie Martin',
          lastMessage: 'Question sur les médicaments',
          lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
          unreadCount: 1,
        },
        {
          id: 'conv-3',
          channel: MessageChannel.FAX,
          participantName: 'Hôpital Cantonal',
          lastMessage: 'Fax reçu: Prescription urgente',
          lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
          unreadCount: 1,
        },
      ];

      setConversations(mockConversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);

    try {
      // STUB: In production, this would fetch from API
      // const response = await fetch(`/api/messaging/messages?conversationId=${conversationId}`);
      // const data = await response.json();

      // Mock data
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          conversationId,
          channel: MessageChannel.WHATSAPP,
          direction: 'inbound',
          from: { id: 'user-1', name: 'Dr. Jean Dupont', phone: '+41791234567' },
          body: 'Bonjour, j\'ai une question sur la prescription',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'msg-2',
          conversationId,
          channel: MessageChannel.WHATSAPP,
          direction: 'outbound',
          from: { id: 'pharmacy-1', name: 'Pharmacie' },
          body: 'Bonjour Docteur, je vous écoute',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];

      setMessages(mockMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    loadMessages(conversationId);
  };

  // Handle sending message
  const handleSendMessage = async (body: string) => {
    if (!selectedConversationId) return;

    try {
      // STUB: In production, this would POST to API
      // await fetch('/api/messaging/send', {
      //   method: 'POST',
      //   body: JSON.stringify({ conversationId: selectedConversationId, body }),
      // });

      // Add message to local state
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId: selectedConversationId,
        channel: conversations.find((c) => c.id === selectedConversationId)?.channel || MessageChannel.IN_APP,
        direction: 'outbound',
        from: { id: 'pharmacy-1', name: 'Pharmacie' },
        body,
        createdAt: new Date().toISOString(),
      };

      setMessages([...messages, newMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  // Load conversations on mount and channel change
  useEffect(() => {
    loadConversations();
  }, [activeChannel]);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Boîte de Réception Unifiée
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez tous vos messages depuis une seule interface
        </Typography>
      </Box>

      {/* Channel Filter */}
      <Paper sx={{ mb: 2 }}>
        <ChannelFilter
          activeChannel={activeChannel}
          onChannelChange={setActiveChannel}
          unreadCounts={unreadCounts}
        />
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Grid container spacing={2} sx={{ height: 'calc(100vh - 300px)' }}>
        {/* Conversation List */}
        <Grid item xs={12} md={4}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onRefresh={loadConversations}
            isLoading={isLoadingConversations}
          />
        </Grid>

        {/* Message Thread */}
        <Grid item xs={12} md={8}>
          {selectedConversation ? (
            <MessageThread
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingMessages}
              conversationChannel={selectedConversation.channel}
            />
          ) : (
            <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <MessageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Sélectionnez une conversation
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default UnifiedInbox;
