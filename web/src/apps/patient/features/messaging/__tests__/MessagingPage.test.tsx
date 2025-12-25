/**
 * MessagingPage Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material';
import { MessagingPage } from '../pages/MessagingPage';
import * as messagingApi from '../api/messaging.api';
import * as authService from '@shared/services/authService';
import { Conversation, ConversationType, MessageChannel, MessageDirection, MessageStatus } from '../types/messaging.types';

// Mock the API and auth
jest.mock('../api/messaging.api');
jest.mock('@shared/services/authService');

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

const theme = createTheme();

const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithProviders(component: React.ReactElement): ReturnType<typeof render> {
  return render(
    <QueryClientProvider client={mockQueryClient}>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function createMockConversation(overrides?: Partial<Conversation>): Conversation {
  return {
    id: 'conv-1',
    type: ConversationType.DIRECT,
    participants: [
      { userId: 'patient-1', role: 'patient', joinedAt: new Date() },
      { userId: 'pharmacist-1', role: 'pharmacist', joinedAt: new Date() },
    ],
    subject: 'Pharmacie Centrale',
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('MessagingPage Component', () => {
  const mockPatientId = 'patient-1';

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryClient.clear();

    // Mock auth service
    (authService.getUserData as jest.Mock).mockReturnValue({
      id: mockPatientId,
      email: 'patient@test.com',
      role: 'patient',
    });

    // Mock API responses
    (messagingApi.fetchConversations as jest.Mock).mockResolvedValue({
      conversations: [createMockConversation()],
      total: 1,
      limit: 50,
      offset: 0,
    });

    (messagingApi.fetchUnreadCounts as jest.Mock).mockResolvedValue({
      'conv-1': 0,
    });

    (messagingApi.fetchMessages as jest.Mock).mockResolvedValue({
      messages: [],
      total: 0,
      conversationId: 'conv-1',
    });

    (messagingApi.sendMessage as jest.Mock).mockResolvedValue({
      id: 'msg-new',
      conversationId: 'conv-1',
      senderId: mockPatientId,
      senderRole: 'patient',
      recipientId: 'pharmacist-1',
      recipientRole: 'pharmacist',
      channel: MessageChannel.IN_APP,
      direction: MessageDirection.OUTBOUND,
      content: 'Test message',
      status: MessageStatus.SENT,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('Rendering', () => {
    it('should render the messaging page container', async () => {
      renderWithProviders(<MessagingPage patientId={mockPatientId} />);

      await waitFor(() => {
        expect(screen.getByTestId('messaging-page')).toBeInTheDocument();
      });
    });

    it('should render the conversation list', async () => {
      renderWithProviders(<MessagingPage patientId={mockPatientId} />);

      await waitFor(() => {
        expect(screen.getByTestId('patient-conversation-list')).toBeInTheDocument();
      });
    });

    it('should display conversation items', async () => {
      renderWithProviders(<MessagingPage patientId={mockPatientId} />);

      await waitFor(() => {
        expect(screen.getByText('Pharmacie Centrale')).toBeInTheDocument();
      });
    });

    it('should show no conversation selected initially', async () => {
      renderWithProviders(<MessagingPage patientId={mockPatientId} />);

      await waitFor(() => {
        expect(screen.getByTestId('no-conversation-selected')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Selection', () => {
    it('should select conversation when clicked', async () => {
      renderWithProviders(<MessagingPage patientId={mockPatientId} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-item-conv-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('conversation-item-conv-1'));

      await waitFor(() => {
        expect(screen.getByTestId('message-thread')).toBeInTheDocument();
      });
    });

    it('should show message input when conversation selected', async () => {
      renderWithProviders(<MessagingPage patientId={mockPatientId} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-item-conv-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('conversation-item-conv-1'));

      await waitFor(() => {
        expect(screen.getByTestId('message-input-container')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch conversations on mount', async () => {
      renderWithProviders(<MessagingPage patientId={mockPatientId} />);

      await waitFor(() => {
        expect(messagingApi.fetchConversations).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockPatientId,
          })
        );
      });
    });

    it('should fetch unread counts on mount', async () => {
      renderWithProviders(<MessagingPage patientId={mockPatientId} />);

      await waitFor(() => {
        expect(messagingApi.fetchUnreadCounts).toHaveBeenCalledWith(mockPatientId);
      });
    });

    it('should use patientId from auth service if not provided', async () => {
      renderWithProviders(<MessagingPage />);

      await waitFor(() => {
        expect(authService.getUserData).toHaveBeenCalled();
        expect(messagingApi.fetchConversations).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockPatientId,
          })
        );
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no conversations', async () => {
      (messagingApi.fetchConversations as jest.Mock).mockResolvedValue({
        conversations: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      renderWithProviders(<MessagingPage patientId={mockPatientId} />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });
  });

  describe('Unread Indicators', () => {
    it('should display unread badge for conversations with unread messages', async () => {
      (messagingApi.fetchUnreadCounts as jest.Mock).mockResolvedValue({
        'conv-1': 5,
      });

      renderWithProviders(<MessagingPage patientId={mockPatientId} />);

      await waitFor(() => {
        expect(screen.getByTestId('unread-badge')).toBeInTheDocument();
      });
    });
  });
});
