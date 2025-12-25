/**
 * ConversationList Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationList } from '../components/ConversationList';
import { Conversation, ConversationType } from '../types/messaging.types';

// Mock date-fns to avoid timezone issues
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => 'il y a 5 minutes'),
}));

jest.mock('date-fns/locale', () => ({
  fr: {},
}));

const createMockConversation = (overrides?: Partial<Conversation>): Conversation => ({
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
});

describe('ConversationList Component', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the conversation list container', () => {
      render(
        <ConversationList
          conversations={[]}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByTestId('patient-conversation-list')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(
        <ConversationList
          conversations={[]}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByTestId('conversation-search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Rechercher une pharmacie...')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(
        <ConversationList
          conversations={[]}
          onSelect={mockOnSelect}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('should render empty state when no conversations', () => {
      render(
        <ConversationList
          conversations={[]}
          onSelect={mockOnSelect}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText(/Aucune conversation/)).toBeInTheDocument();
    });

    it('should render conversation items', () => {
      const conversations = [
        createMockConversation({ id: 'conv-1', subject: 'Pharmacie A' }),
        createMockConversation({ id: 'conv-2', subject: 'Pharmacie B' }),
      ];

      render(
        <ConversationList
          conversations={conversations}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByTestId('conversations-list')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-item-conv-1')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-item-conv-2')).toBeInTheDocument();
      expect(screen.getByText('Pharmacie A')).toBeInTheDocument();
      expect(screen.getByText('Pharmacie B')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onSelect when conversation is clicked', () => {
      const conversation = createMockConversation();

      render(
        <ConversationList
          conversations={[conversation]}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByTestId('conversation-item-conv-1'));
      expect(mockOnSelect).toHaveBeenCalledWith(conversation);
    });

    it('should highlight selected conversation', () => {
      const conversations = [
        createMockConversation({ id: 'conv-1' }),
        createMockConversation({ id: 'conv-2' }),
      ];

      render(
        <ConversationList
          conversations={conversations}
          selectedId="conv-1"
          onSelect={mockOnSelect}
        />
      );

      const selectedItem = screen.getByTestId('conversation-item-conv-1');
      expect(selectedItem).toHaveClass('Mui-selected');
    });
  });

  describe('Search', () => {
    it('should filter conversations based on search query', () => {
      const conversations = [
        createMockConversation({ id: 'conv-1', subject: 'Pharmacie Centrale' }),
        createMockConversation({ id: 'conv-2', subject: 'Pharmacie du Lac' }),
      ];

      render(
        <ConversationList
          conversations={conversations}
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Rechercher une pharmacie...');
      fireEvent.change(searchInput, { target: { value: 'Lac' } });

      expect(screen.queryByText('Pharmacie Centrale')).not.toBeInTheDocument();
      expect(screen.getByText('Pharmacie du Lac')).toBeInTheDocument();
    });

    it('should show empty state when search has no results', () => {
      const conversations = [createMockConversation()];

      render(
        <ConversationList
          conversations={conversations}
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Rechercher une pharmacie...');
      fireEvent.change(searchInput, { target: { value: 'xyz123' } });

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('Unread Indicators', () => {
    it('should display unread badge when there are unread messages', () => {
      const conversation = createMockConversation();

      render(
        <ConversationList
          conversations={[conversation]}
          onSelect={mockOnSelect}
          unreadCounts={{ 'conv-1': 3 }}
        />
      );

      expect(screen.getByTestId('unread-badge')).toBeInTheDocument();
      expect(screen.getByText(/3 nouveaux messages/)).toBeInTheDocument();
    });

    it('should not display badge when no unread messages', () => {
      const conversation = createMockConversation();

      render(
        <ConversationList
          conversations={[conversation]}
          onSelect={mockOnSelect}
          unreadCounts={{ 'conv-1': 0 }}
        />
      );

      expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
    });
  });
});
