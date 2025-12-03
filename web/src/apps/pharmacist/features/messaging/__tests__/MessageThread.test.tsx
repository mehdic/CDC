/**
 * MessageThread Component Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessageThread } from '../MessageThread';
import * as messagingApi from '../api/messaging.api';
import { Message, MessageStatus, MessageChannel, MessageDirection } from '../types/messaging.types';

jest.mock('../api/messaging.api');
jest.mock('../hooks/useWebSocket');

const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={mockQueryClient}>
      {component}
    </QueryClientProvider>
  );
};

const createMockMessage = (overrides?: Partial<Message>): Message => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-2',
  senderRole: 'patient',
  recipientId: 'user-1',
  recipientRole: 'pharmacist',
  channel: MessageChannel.IN_APP,
  direction: MessageDirection.INBOUND,
  content: 'Test message',
  status: MessageStatus.SENT,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe.skip('MessageThread Component', () => {
  const mockConversationId = 'conv-1';
  const mockCurrentUserId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
    (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
      messages: [createMockMessage()],
      total: 1,
      conversationId: mockConversationId,
    });
  });

  describe('Rendering', () => {
    it('should render message thread container', async () => {
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

    it('should render loading state initially', () => {
      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display messages after loading', async () => {
      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
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
        expect(screen.getByText('Aucun message dans cette conversation')).toBeInTheDocument();
      });
    });

    it('should show message not selected state when no conversationId', () => {
      renderWithProviders(
        <MessageThread conversationId="" currentUserId={mockCurrentUserId} />
      );

      expect(screen.getByText('Sélectionnez une conversation pour commencer')).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should display message content', async () => {
      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });

    it('should mark own messages correctly', async () => {
      const ownMessage = createMockMessage({
        senderId: mockCurrentUserId,
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
        const messageBubble = screen.getByTestId(`message-bubble-${ownMessage.id}`);
        expect(messageBubble).toBeInTheDocument();
      });
    });

    it('should display multiple messages', async () => {
      const messages = [
        createMockMessage({ id: 'msg-1', content: 'First message' }),
        createMockMessage({ id: 'msg-2', content: 'Second message' }),
        createMockMessage({ id: 'msg-3', content: 'Third message' }),
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
        expect(screen.getByText('First message')).toBeInTheDocument();
        expect(screen.getByText('Second message')).toBeInTheDocument();
        expect(screen.getByText('Third message')).toBeInTheDocument();
      });
    });
  });

  describe('Loading More', () => {
    it('should show load more button when hasMore is true', async () => {
      (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
        messages: [createMockMessage()],
        total: 100,
        offset: 0,
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

    it('should hide load more button when hasMore is false', async () => {
      (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
        messages: [createMockMessage()],
        total: 1,
        offset: 0,
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
        expect(onMarkRead).toHaveBeenCalledWith(unreadMessage.id);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on fetch error', async () => {
      (messagingApi.fetchMessages as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch messages')
      );

      renderWithProviders(
        <MessageThread
          conversationId={mockConversationId}
          currentUserId={mockCurrentUserId}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText('Erreur lors du chargement des messages')
        ).toBeInTheDocument();
      });
    });
  });
});
