/**
 * UnifiedInbox Component Tests
 * Test suite for the unified messaging inbox
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedInbox } from '../UnifiedInbox';

// Mock the API
jest.mock('../api/messaging.api');
jest.mock('../hooks/useConversations');
jest.mock('../hooks/useMessaging');

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

describe('UnifiedInbox Component', () => {
  const mockUserId = 'test-pharmacist-123';
  const mockRole = 'pharmacist';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the unified inbox container', () => {
      renderWithProviders(<UnifiedInbox currentUserId={mockUserId} currentRole={mockRole} />);

      expect(screen.getByText('Messagerie Unifiée')).toBeInTheDocument();
    });

    it('should render channel tabs', () => {
      renderWithProviders(<UnifiedInbox currentUserId={mockUserId} currentRole={mockRole} />);

      expect(screen.getByTestId('channel-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('channel-tab-in_app')).toBeInTheDocument();
      expect(screen.getByTestId('channel-tab-whatsapp')).toBeInTheDocument();
      expect(screen.getByTestId('channel-tab-email')).toBeInTheDocument();
      expect(screen.getByTestId('channel-tab-fax')).toBeInTheDocument();
    });

    it('should render conversation list', () => {
      renderWithProviders(<UnifiedInbox currentUserId={mockUserId} currentRole={mockRole} />);

      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });

    it('should render "New message" button', () => {
      renderWithProviders(<UnifiedInbox currentUserId={mockUserId} currentRole={mockRole} />);

      expect(screen.getByRole('button', { name: /Nouveau/i })).toBeInTheDocument();
    });
  });

  describe('Channel Selection', () => {
    it('should change active channel when tab is clicked', async () => {
      renderWithProviders(<UnifiedInbox currentUserId={mockUserId} currentRole={mockRole} />);

      const whatsappTab = screen.getByTestId('channel-tab-whatsapp');
      fireEvent.click(whatsappTab);

      await waitFor(() => {
        expect(whatsappTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Contact Selector', () => {
    it('should open contact selector when "New" button is clicked', async () => {
      renderWithProviders(<UnifiedInbox currentUserId={mockUserId} currentRole={mockRole} />);

      const newButton = screen.getByRole('button', { name: /Nouveau/i });
      fireEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByTestId('contact-selector-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Message Composer', () => {
    it('should have message composer when conversation is selected', () => {
      // This would require mocking the conversation selection
      // Implementation depends on the actual hook behavior
      renderWithProviders(<UnifiedInbox currentUserId={mockUserId} currentRole={mockRole} />);

      // Can expand based on conversation selection logic
    });
  });

  describe('Error Handling', () => {
    it('should display error message if message sending fails', async () => {
      renderWithProviders(<UnifiedInbox currentUserId={mockUserId} currentRole={mockRole} />);

      // Error display would depend on composer error state
    });
  });
});
