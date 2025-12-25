/**
 * MessageThread Component Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessageThread } from '../components/MessageThread';
import * as messagingApi from '../api/messaging.api';
import { Message, MessageStatus, MessageChannel, MessageDirection } from '../types/messaging.types';

jest.mock('../api/messaging.api');

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => 'il y a 5 minutes'),
  format: jest.fn(() => '14:30'),
  isToday: jest.fn(() => true),
  isYesterday: jest.fn(() => false),
}));

jest.mock('date-fns/locale', () => ({
  fr: {},
}));

const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithProviders(component: React.ReactElement): ReturnType<typeof render> {
  return render(
    <QueryClientProvider client={mockQueryClient}>
      {component}
    </QueryClientProvider>
  );
}

function createMockMessage(overrides?: Partial<Message>): Message {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'pharmacist-1',
    senderRole: 'pharmacist',
    recipientId: 'patient-1',
    recipientRole: 'patient',
    channel: MessageChannel.IN_APP,
    direction: MessageDirection.INBOUND,
    content: 'Bonjour, votre ordonnance est prete.',
    status: MessageStatus.DELIVERED,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('MessageThread Component', () => {
  const mockConversationId = 'conv-1';
  const mockCurrentUserId = 'patient-1';

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryClient.clear();
    (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
      messages: [createMockMessage()],
      total: 1,
      conversationId: mockConversationId,
    });
  });

  describe('Rendering', () => {
    it('should render no conversation selected state when no conversationId', () => {
      renderWithProviders(
        <MessageThread conversationId="" currentUserId={mockCurrentUserId} />
      );

      expect(screen.getByTestId('no-conversation-selected')).toBeInTheDocument();
      expect(screen.getByText('Selectionnez une conversation')).toBeInTheDocument();
    });

    it('should render loading state initially', () => {
      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      expect(screen.getByTestId('loading-messages')).toBeInTheDocument();
    });

    it('should render message thread container after loading', async () => {
      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('message-thread')).toBeInTheDocument();
      });
    });

    it('should display messages after loading', async () => {
      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bonjour, votre ordonnance est prete.')).toBeInTheDocument();
      });
    });

    it('should show empty state when no messages', async () => {
      (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
        messages: [],
        total: 0,
        conversationId: mockConversationId,
      });

      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('empty-messages')).toBeInTheDocument();
        expect(screen.getByText(/Aucun message/)).toBeInTheDocument();
      });
    });
  });

  describe('Message Display', () => {
    it('should display message content correctly', async () => {
      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bonjour, votre ordonnance est prete.')).toBeInTheDocument();
      });
    });

    it('should display message bubble with correct test id', async () => {
      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('message-bubble-msg-1')).toBeInTheDocument();
      });
    });

    it('should display multiple messages', async () => {
      const messages = [
        createMockMessage({ id: 'msg-1', content: 'Premier message' }),
        createMockMessage({ id: 'msg-2', content: 'Deuxieme message' }),
        createMockMessage({ id: 'msg-3', content: 'Troisieme message' }),
      ];

      (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
        messages,
        total: 3,
        conversationId: mockConversationId,
      });

      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Premier message')).toBeInTheDocument();
        expect(screen.getByText('Deuxieme message')).toBeInTheDocument();
        expect(screen.getByText('Troisieme message')).toBeInTheDocument();
      });
    });

    it('should style own messages differently', async () => {
      const ownMessage = createMockMessage({
        id: 'msg-own',
        senderId: mockCurrentUserId,
        senderRole: 'patient',
      });

      (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
        messages: [ownMessage],
        total: 1,
        conversationId: mockConversationId,
      });

      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('message-bubble-msg-own')).toBeInTheDocument();
      });
    });
  });

  describe('Load More', () => {
    it('should show load more button when there are more messages', async () => {
      (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
        messages: [createMockMessage()],
        total: 100,
        conversationId: mockConversationId,
      });

      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('load-more-btn')).toBeInTheDocument();
      });
    });

    it('should hide load more button when all messages loaded', async () => {
      (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
        messages: [createMockMessage()],
        total: 1,
        conversationId: mockConversationId,
      });

      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.queryByTestId('load-more-btn')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mark as Read', () => {
    it('should call onMarkRead for unread messages', async () => {
      const onMarkRead = jest.fn();
      const unreadMessage = createMockMessage({
        id: 'unread-msg',
        recipientId: mockCurrentUserId,
        status: MessageStatus.DELIVERED,
      });

      (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
        messages: [unreadMessage],
        total: 1,
        conversationId: mockConversationId,
      });

      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
          onMarkRead={onMarkRead}
        />
      );

      await waitFor(() => {
        expect(onMarkRead).toHaveBeenCalledWith('unread-msg');
      });
    });

    it('should not call onMarkRead for already read messages', async () => {
      const onMarkRead = jest.fn();
      const readMessage = createMockMessage({
        id: 'read-msg',
        recipientId: mockCurrentUserId,
        status: MessageStatus.READ,
      });

      (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
        messages: [readMessage],
        total: 1,
        conversationId: mockConversationId,
      });

      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
          onMarkRead={onMarkRead}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('message-thread')).toBeInTheDocument();
      });

      expect(onMarkRead).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error state on fetch failure', async () => {
      (messagingApi.fetchMessages as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByText(/Erreur lors du chargement/)).toBeInTheDocument();
      });
    });
  });
});
