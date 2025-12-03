/**
 * Secure Messaging Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SecureMessaging } from '../../components/SecureMessaging';
import * as doctorHooks from '../../hooks/useDoctor';

jest.mock('../../hooks/useDoctor');

const mockMessageThreads = {
  data: {
    threads: [
      {
        id: 'thread1',
        participantId: 'pharm1',
        participantName: 'Pharmacie du Centre',
        participantRole: 'Pharmacien',
        lastMessage: 'Prescription reçue et validée',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 2,
        messages: [
          {
            id: 'm1',
            conversationId: 'thread1',
            senderId: 'doctor1',
            senderName: 'Dr. Jean Dupont',
            senderRole: 'Médecin',
            recipientId: 'pharm1',
            recipientName: 'Pharmacie du Centre',
            content: 'Nouvelle prescription pour patient Jean Martin',
            timestamp: new Date().toISOString(),
            isRead: true,
          },
          {
            id: 'm2',
            conversationId: 'thread1',
            senderId: 'pharm1',
            senderName: 'Pharmacie du Centre',
            senderRole: 'Pharmacien',
            recipientId: 'doctor1',
            recipientName: 'Dr. Jean Dupont',
            content: 'Prescription reçue et validée',
            timestamp: new Date().toISOString(),
            isRead: false,
          },
        ],
      },
    ],
    total: 1,
  },
};

describe.skip('SecureMessaging Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SecureMessaging />
      </QueryClientProvider>
    );
  };

  it('should display page title', () => {
    (doctorHooks.useDoctorMessageThreads as jest.Mock).mockReturnValue({
      data: mockMessageThreads,
      isLoading: false,
    });

    (doctorHooks.useDoctorMessageThread as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    (doctorHooks.useSendMessage as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    expect(screen.getByTestId('page-title')).toBeInTheDocument();
    expect(screen.getByText('Messagerie Sécurisée')).toBeInTheDocument();
  });

  it('should display thread list', () => {
    (doctorHooks.useDoctorMessageThreads as jest.Mock).mockReturnValue({
      data: mockMessageThreads,
      isLoading: false,
    });

    (doctorHooks.useDoctorMessageThread as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    (doctorHooks.useSendMessage as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    expect(screen.getByTestId('thread-list')).toBeInTheDocument();
    expect(screen.getByTestId('thread-item-thread1')).toBeInTheDocument();
  });

  it('should display participant name in thread list', () => {
    (doctorHooks.useDoctorMessageThreads as jest.Mock).mockReturnValue({
      data: mockMessageThreads,
      isLoading: false,
    });

    (doctorHooks.useDoctorMessageThread as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    (doctorHooks.useSendMessage as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    expect(screen.getByText('Pharmacie du Centre')).toBeInTheDocument();
  });

  it('should display unread badge', () => {
    (doctorHooks.useDoctorMessageThreads as jest.Mock).mockReturnValue({
      data: mockMessageThreads,
      isLoading: false,
    });

    (doctorHooks.useDoctorMessageThread as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    (doctorHooks.useSendMessage as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    expect(screen.getByTestId('unread-badge')).toBeInTheDocument();
  });

  it('should select thread when clicking on it', () => {
    (doctorHooks.useDoctorMessageThreads as jest.Mock).mockReturnValue({
      data: mockMessageThreads,
      isLoading: false,
    });

    (doctorHooks.useDoctorMessageThread as jest.Mock).mockReturnValue({
      data: mockMessageThreads.data.threads[0],
      isLoading: false,
    });

    (doctorHooks.useSendMessage as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    const threadItem = screen.getByTestId('thread-item-thread1');
    fireEvent.click(threadItem);

    expect(screen.getByTestId('messages-area')).toBeInTheDocument();
  });

  it('should display message input field', () => {
    (doctorHooks.useDoctorMessageThreads as jest.Mock).mockReturnValue({
      data: mockMessageThreads,
      isLoading: false,
    });

    (doctorHooks.useDoctorMessageThread as jest.Mock).mockReturnValue({
      data: mockMessageThreads.data.threads[0],
      isLoading: false,
    });

    (doctorHooks.useSendMessage as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    const threadItem = screen.getByTestId('thread-item-thread1');
    fireEvent.click(threadItem);

    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  it('should display send button', () => {
    (doctorHooks.useDoctorMessageThreads as jest.Mock).mockReturnValue({
      data: mockMessageThreads,
      isLoading: false,
    });

    (doctorHooks.useDoctorMessageThread as jest.Mock).mockReturnValue({
      data: mockMessageThreads.data.threads[0],
      isLoading: false,
    });

    (doctorHooks.useSendMessage as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    const threadItem = screen.getByTestId('thread-item-thread1');
    fireEvent.click(threadItem);

    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('should display file attachment button', () => {
    (doctorHooks.useDoctorMessageThreads as jest.Mock).mockReturnValue({
      data: mockMessageThreads,
      isLoading: false,
    });

    (doctorHooks.useDoctorMessageThread as jest.Mock).mockReturnValue({
      data: mockMessageThreads.data.threads[0],
      isLoading: false,
    });

    (doctorHooks.useSendMessage as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    const threadItem = screen.getByTestId('thread-item-thread1');
    fireEvent.click(threadItem);

    expect(screen.getByTestId('attach-file-button')).toBeInTheDocument();
  });

  it('should handle message input', () => {
    (doctorHooks.useDoctorMessageThreads as jest.Mock).mockReturnValue({
      data: mockMessageThreads,
      isLoading: false,
    });

    (doctorHooks.useDoctorMessageThread as jest.Mock).mockReturnValue({
      data: mockMessageThreads.data.threads[0],
      isLoading: false,
    });

    (doctorHooks.useSendMessage as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    const threadItem = screen.getByTestId('thread-item-thread1');
    fireEvent.click(threadItem);

    const messageInput = screen.getByTestId('message-input') as HTMLTextAreaElement;
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    expect(messageInput.value).toBe('Test message');
  });

  it('should send message when clicking send button', () => {
    const mockSend = jest.fn().mockResolvedValue({});

    (doctorHooks.useDoctorMessageThreads as jest.Mock).mockReturnValue({
      data: mockMessageThreads,
      isLoading: false,
    });

    (doctorHooks.useDoctorMessageThread as jest.Mock).mockReturnValue({
      data: mockMessageThreads.data.threads[0],
      isLoading: false,
    });

    (doctorHooks.useSendMessage as jest.Mock).mockReturnValue({
      mutateAsync: mockSend,
      isPending: false,
    });

    renderComponent();

    const threadItem = screen.getByTestId('thread-item-thread1');
    fireEvent.click(threadItem);

    const messageInput = screen.getByTestId('message-input') as HTMLTextAreaElement;
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const sendButton = screen.getByTestId('send-button');
    fireEvent.click(sendButton);

    expect(mockSend).toHaveBeenCalled();
  });

  it('should display select conversation message when no thread is selected', () => {
    (doctorHooks.useDoctorMessageThreads as jest.Mock).mockReturnValue({
      data: mockMessageThreads,
      isLoading: false,
    });

    (doctorHooks.useDoctorMessageThread as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    (doctorHooks.useSendMessage as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderComponent();

    expect(screen.getByText('Sélectionnez une conversation')).toBeInTheDocument();
  });
});
