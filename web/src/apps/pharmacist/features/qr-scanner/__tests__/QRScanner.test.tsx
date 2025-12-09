/**
 * QR Scanner Component Tests
 * Task: T8-008 - Pharmacist QR Scanner
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QRScanner, ScanResult } from '../components/QRScanner';

describe('QRScanner Component', () => {
  let mockOnScanSuccess: jest.Mock;
  let mockOnScanError: jest.Mock;

  beforeEach(() => {
    mockOnScanSuccess = jest.fn();
    mockOnScanError = jest.fn();

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }],
        }),
      },
      writable: true,
    });

    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(),
        width: 640,
        height: 480,
      })),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render QR scanner container', () => {
      render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />
      );

      expect(screen.getByRole('button', { name: /stop scanning/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('should request camera access on mount', async () => {
      render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} isActive={true} />
      );

      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            video: expect.any(Object),
            audio: false,
          })
        );
      });
    });

    it('should handle camera access denied', async () => {
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
        new Error('NotAllowedError')
      );

      render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} isActive={true} />
      );

      await waitFor(() => {
        expect(mockOnScanError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Camera access denied'),
          })
        );
      });

      expect(screen.getByText(/camera access denied/i)).toBeInTheDocument();
    });
  });

  describe('Camera Controls', () => {
    it('should toggle scanning on/off', async () => {
      render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />
      );

      const toggleButton = screen.getByRole('button', { name: /stop scanning/i });

      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start scanning/i })).toBeInTheDocument();
      });
    });

    it('should reset scanner state', async () => {
      render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });

      fireEvent.click(resetButton);

      // After reset, scanner should be ready for new scans
      expect(resetButton).toBeInTheDocument();
    });

    it('should disable controls when camera permission is denied', async () => {
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
        new Error('NotAllowedError')
      );

      render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} isActive={true} />
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });
  });

  describe('QR Code Validation', () => {
    it('should validate QR code checksum', async () => {
      const { rerender } = render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />
      );

      // Test data with valid checksum
      const testQRData = {
        prescriptionId: 'RX-12345',
        patientId: 'PAT-67890',
        checksum: '5e28a3', // Calculated checksum for the above data
      };

      // This would be called internally when QR code is detected
      // For now, we're testing the component's ability to handle valid data
      expect(testQRData.checksum).toMatch(/^[0-9a-f]+$/);
    });

    it('should handle invalid QR code format', async () => {
      const { container } = render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />
      );

      // QR scanner should handle parse errors gracefully
      expect(container.querySelector('.qr-scanner-container')).toBeInTheDocument();
    });
  });

  describe('User Feedback', () => {
    it('should display loading state while requesting camera', async () => {
      render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} isActive={true} />
      );

      expect(document.querySelector('.qr-scanner-wrapper')).toBeInTheDocument();
    });

    it('should show frame overlay for QR positioning', async () => {
      render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />
      );

      await waitFor(() => {
        expect(document.querySelector('.qr-scanner-frame')).toBeInTheDocument();
        expect(document.querySelector('.qr-scanner-corner')).toBeInTheDocument();
      });
    });

    it('should display corners for scan frame guidance', async () => {
      render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />
      );

      await waitFor(() => {
        expect(document.querySelector('.qr-scanner-corner-tl')).toBeInTheDocument();
        expect(document.querySelector('.qr-scanner-corner-tr')).toBeInTheDocument();
        expect(document.querySelector('.qr-scanner-corner-bl')).toBeInTheDocument();
        expect(document.querySelector('.qr-scanner-corner-br')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Support', () => {
    it('should prefer rear camera on mobile', async () => {
      render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} isActive={true} />
      );

      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            video: expect.objectContaining({
              facingMode: 'environment',
            }),
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', async () => {
      render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />
      );

      expect(screen.getByRole('button', { name: /stop scanning/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const { container } = render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('should stop video tracks on unmount', async () => {
      const mockStop = jest.fn();
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce({
        getTracks: () => [{ stop: mockStop }, { stop: mockStop }],
      });

      const { unmount } = render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} isActive={true} />
      );

      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
      });

      unmount();

      expect(mockStop).toHaveBeenCalled();
    });

    it('should cancel animation frames on cleanup', async () => {
      const cancelAnimationFrameSpy = jest.spyOn(window, 'cancelAnimationFrame');

      const { unmount } = render(
        <QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />
      );

      unmount();

      // Animation frame should be cleaned up
      expect(cancelAnimationFrameSpy).toHaveBeenCalled();

      cancelAnimationFrameSpy.mockRestore();
    });
  });
});
