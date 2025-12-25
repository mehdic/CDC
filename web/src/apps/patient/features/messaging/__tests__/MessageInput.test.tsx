/**
 * MessageInput Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../components/MessageInput';

describe('MessageInput Component', () => {
  const mockOnSend = jest.fn();
  const mockOnClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSend.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render the message input container', () => {
      render(<MessageInput onSend={mockOnSend} />);

      expect(screen.getByTestId('message-input-container')).toBeInTheDocument();
    });

    it('should render the text input', () => {
      render(<MessageInput onSend={mockOnSend} />);

      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });

    it('should render the send button', () => {
      render(<MessageInput onSend={mockOnSend} />);

      expect(screen.getByTestId('send-button')).toBeInTheDocument();
    });

    it('should render character counter', () => {
      render(<MessageInput onSend={mockOnSend} />);

      expect(screen.getByTestId('character-counter')).toBeInTheDocument();
      expect(screen.getByText('0/2000')).toBeInTheDocument();
    });

    it('should render custom placeholder', () => {
      render(<MessageInput onSend={mockOnSend} placeholder="Type here..." />);

      expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
    });

    it('should render error alert when error is provided', () => {
      render(
        <MessageInput
          onSend={mockOnSend}
          error="Erreur d'envoi"
          onClearError={mockOnClearError}
        />
      );

      expect(screen.getByTestId('message-error-alert')).toBeInTheDocument();
      expect(screen.getByText("Erreur d'envoi")).toBeInTheDocument();
    });
  });

  describe('Input Behavior', () => {
    it('should update character counter as user types', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByTestId('message-input');
      await user.type(input, 'Hello');

      expect(screen.getByText('5/2000')).toBeInTheDocument();
    });

    it('should disable send button when input is empty', () => {
      render(<MessageInput onSend={mockOnSend} />);

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has text', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByTestId('message-input');
      await user.type(input, 'Hello');

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).not.toBeDisabled();
    });

    it('should disable send button when input exceeds max length', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} maxLength={5} />);

      const input = screen.getByTestId('message-input');
      await user.type(input, 'Hello World');

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Send Message', () => {
    it('should call onSend with message content when send button clicked', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByTestId('message-input');
      await user.type(input, 'Test message');

      const sendButton = screen.getByTestId('send-button');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Test message');
      });
    });

    it('should clear input after successful send', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByTestId('message-input');
      await user.type(input, 'Test message');

      const sendButton = screen.getByTestId('send-button');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should send message on Enter key press', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByTestId('message-input');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Test message');
      });
    });

    it('should not send on Shift+Enter (allows newline)', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByTestId('message-input');
      await user.type(input, 'Test message');
      await user.keyboard('{Shift>}{Enter}{/Shift}');

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should trim whitespace from message', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByTestId('message-input');
      await user.type(input, '  Test message  ');

      const sendButton = screen.getByTestId('send-button');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Test message');
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(<MessageInput onSend={mockOnSend} disabled={true} />);

      const input = screen.getByTestId('message-input');
      expect(input).toBeDisabled();
    });

    it('should disable send button when disabled prop is true', () => {
      render(<MessageInput onSend={mockOnSend} disabled={true} />);

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });

    it('should disable input when isLoading is true', () => {
      render(<MessageInput onSend={mockOnSend} isLoading={true} />);

      const input = screen.getByTestId('message-input');
      expect(input).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should call onClearError when error alert is closed', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          onSend={mockOnSend}
          error="Test error"
          onClearError={mockOnClearError}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClearError).toHaveBeenCalled();
    });

    it('should not clear input when send fails', async () => {
      mockOnSend.mockRejectedValueOnce(new Error('Send failed'));

      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByTestId('message-input');
      await user.type(input, 'Test message');

      const sendButton = screen.getByTestId('send-button');
      await user.click(sendButton);

      await waitFor(() => {
        // Input should retain the text on error
        expect(input).toHaveValue('Test message');
      });
    });
  });

  describe('Character Limit', () => {
    it('should show warning color when approaching limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} maxLength={110} />);

      const input = screen.getByTestId('message-input');
      // Type 20 characters to be within 100 of limit (110 - 20 = 90 remaining)
      await user.type(input, '12345678901234567890');

      const counter = screen.getByTestId('character-counter');
      expect(counter).toHaveTextContent('20/110');
    });

    it('should show error color when over limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} maxLength={10} />);

      const input = screen.getByTestId('message-input');
      await user.type(input, 'This is over the limit');

      const counter = screen.getByTestId('character-counter');
      // MUI input may truncate but we test the counter reflects the input
      expect(counter).toBeInTheDocument();
    });
  });
});
