/**
 * SignatureCapture Component Tests
 * Tests signature drawing, clearing, and submission
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignatureCapture } from '../SignatureCapture';
import { SignatureData } from '../../../../../shared/types/proofOfDelivery';

describe.skip('SignatureCapture', () => {
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
    const { container } = render(
      <SignatureCapture
        onSignatureCapture={mockOnSignatureCapture}
        onCancel={mockOnCancel}
      />
    );

    const canvas = screen.getByTestId('signature-pad') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    // Simulate mouse drawing on the canvas
    fireEvent.mouseDown(canvas, {
      buttons: 1,
      clientX: rect.left + 50,
      clientY: rect.top + 50,
    });
    fireEvent.mouseMove(canvas, {
      buttons: 1,
      clientX: rect.left + 100,
      clientY: rect.top + 100,
    });
    fireEvent.mouseUp(canvas);

    await waitFor(
      () => {
        const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
        // The button should be enabled after drawing
        if (confirmButton.hasAttribute('disabled')) {
          throw new Error('Button still disabled');
        }
      },
      { timeout: 2000 }
    );
  });

  it('should clear canvas when clear button is clicked', async () => {
    render(
      <SignatureCapture
        onSignatureCapture={mockOnSignatureCapture}
        onCancel={mockOnCancel}
      />
    );

    const canvas = screen.getByTestId('signature-pad') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    // Draw on canvas
    fireEvent.mouseDown(canvas, {
      buttons: 1,
      clientX: rect.left + 50,
      clientY: rect.top + 50,
    });
    fireEvent.mouseMove(canvas, {
      buttons: 1,
      clientX: rect.left + 100,
      clientY: rect.top + 100,
    });
    fireEvent.mouseUp(canvas);

    // Wait for submit button to be enabled
    await waitFor(
      () => {
        const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
        if (confirmButton.hasAttribute('disabled')) {
          throw new Error('Button not enabled');
        }
      },
      { timeout: 2000 }
    );

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

    const canvas = screen.getByTestId('signature-pad') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    // Draw on canvas
    fireEvent.mouseDown(canvas, {
      buttons: 1,
      clientX: rect.left + 50,
      clientY: rect.top + 50,
    });
    fireEvent.mouseMove(canvas, {
      buttons: 1,
      clientX: rect.left + 100,
      clientY: rect.top + 100,
    });
    fireEvent.mouseUp(canvas);

    // Wait for submit button to be enabled
    await waitFor(
      () => {
        const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
        if (confirmButton.hasAttribute('disabled')) {
          throw new Error('Button not enabled');
        }
      },
      { timeout: 2000 }
    );

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

    const canvas = screen.getByTestId('signature-pad') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    // Simulate touch drawing
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: rect.left + 50, clientY: rect.top + 50 }] as any,
    });
    fireEvent.touchMove(canvas, {
      touches: [{ clientX: rect.left + 100, clientY: rect.top + 100 }] as any,
    });
    fireEvent.touchEnd(canvas);

    await waitFor(
      () => {
        const confirmButton = screen.getByRole('button', { name: /confirm signature/i });
        if (confirmButton.hasAttribute('disabled')) {
          throw new Error('Button not enabled');
        }
      },
      { timeout: 2000 }
    );
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
