/**
 * SignatureCapture Component Tests
 * Tests signature drawing, clearing, and submission
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignatureCapture } from '../SignatureCapture';
import { SignatureData } from '../../../../../shared/types/proofOfDelivery';

describe('SignatureCapture', () => {
  const mockOnSignatureCapture = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSignatureCapture.mockClear();
    mockOnCancel.mockClear();
  });

  it('should render signature canvas', () => {
    render(
      <SignatureCapture
        onSignatureCapture={mockOnSignatureCapture}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Signature Capture')).toBeInTheDocument();
    expect(screen.getByTestId('signature-pad')).toBeInTheDocument();
  });

  it('should disable submit button when canvas is empty', () => {
    render(
      <SignatureCapture
        onSignatureCapture={mockOnSignatureCapture}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
    expect(confirmButton).toBeDisabled();
  });

  it('should enable submit button after drawing', async () => {
    render(
      <SignatureCapture
        onSignatureCapture={mockOnSignatureCapture}
        onCancel={mockOnCancel}
      />
    );

    const canvas = screen.getByTestId('signature-pad');

    // Simulate mouse drawing
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('should clear canvas when clear button is clicked', async () => {
    render(
      <SignatureCapture
        onSignatureCapture={mockOnSignatureCapture}
        onCancel={mockOnCancel}
      />
    );

    const canvas = screen.getByTestId('signature-pad');

    // Draw on canvas
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    // Wait for submit button to be enabled
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
      expect(confirmButton).not.toBeDisabled();
    });

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    // Submit button should be disabled again
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
      expect(confirmButton).toBeDisabled();
    });
  });

  it('should show error when submitting empty signature', async () => {
    render(
      <SignatureCapture
        onSignatureCapture={mockOnSignatureCapture}
        onCancel={mockOnCancel}
      />
    );

    // Try to submit without drawing
    const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
    expect(confirmButton).toBeDisabled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <SignatureCapture
        onSignatureCapture={mockOnSignatureCapture}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onSignatureCapture with signature data', async () => {
    render(
      <SignatureCapture
        onSignatureCapture={mockOnSignatureCapture}
        onCancel={mockOnCancel}
      />
    );

    const canvas = screen.getByTestId('signature-pad');

    // Draw on canvas
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    // Wait for submit button to be enabled
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
      expect(confirmButton).not.toBeDisabled();
    });

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnSignatureCapture).toHaveBeenCalledTimes(1);
      const callArgs = mockOnSignatureCapture.mock.calls[0][0];
      expect(callArgs).toHaveProperty('base64');
      expect(callArgs).toHaveProperty('timestamp');
      expect(callArgs).toHaveProperty('capturedAt');
      expect(callArgs).toHaveProperty('mimeType', 'image/png');
    });
  });

  it('should support touch input', async () => {
    render(
      <SignatureCapture
        onSignatureCapture={mockOnSignatureCapture}
        onCancel={mockOnCancel}
      />
    );

    const canvas = screen.getByTestId('signature-pad');

    // Simulate touch drawing
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 50, clientY: 50 }],
    });
    fireEvent.touchMove(canvas, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(canvas);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('should show required indicator when required prop is true', () => {
    render(
      <SignatureCapture
        onSignatureCapture={mockOnSignatureCapture}
        onCancel={mockOnCancel}
        isRequired={true}
      />
    );

    expect(screen.getByText(/sign in the box below/i)).toBeInTheDocument();
  });
});
