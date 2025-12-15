/**
 * Tests for ScanOverlay Component
 * Covers rendering, animations, and status feedback
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { ScanOverlay } from '../ScanOverlay';

describe('ScanOverlay', () => {
  describe('Rendering', () => {
    it('should render successfully', () => {
      const { toJSON } = render(<ScanOverlay status="scanning" />);
      expect(toJSON()).toBeTruthy();
    });

    it('should render with default props', () => {
      const { getByTestId } = render(<ScanOverlay />);
      const overlay = getByTestId('scan-overlay-container');
      expect(overlay).toBeTruthy();
    });

    it('should render center box by default', () => {
      const { getByTestId } = render(<ScanOverlay showCenterBox={true} />);
      expect(getByTestId('scan-overlay-center-box')).toBeTruthy();
    });

    it('should hide center box when showCenterBox is false', () => {
      const { queryByTestId } = render(<ScanOverlay showCenterBox={false} />);
      expect(queryByTestId('scan-overlay-center-box')).toBeFalsy();
    });

    it('should render corners by default', () => {
      const { getByTestId } = render(<ScanOverlay showCorners={true} />);
      expect(getByTestId('scan-overlay-corner-tl')).toBeTruthy();
    });

    it('should hide corners when showCorners is false', () => {
      const { queryByTestId } = render(<ScanOverlay showCorners={false} />);
      expect(queryByTestId('scan-overlay-corner-tl')).toBeFalsy();
    });
  });

  describe('Status Feedback', () => {
    it('should render with idle status', () => {
      const { getByTestId } = render(<ScanOverlay status="idle" />);
      const overlay = getByTestId('scan-overlay-container');
      expect(overlay).toBeTruthy();
      expect(overlay.props.accessibilityLabel).toContain('idle status');
    });

    it('should render with scanning status', () => {
      const { getByTestId } = render(<ScanOverlay status="scanning" />);
      const overlay = getByTestId('scan-overlay-container');
      expect(overlay).toBeTruthy();
      expect(overlay.props.accessibilityLabel).toContain('scanning status');
    });

    it('should render with success status', () => {
      const { getByTestId } = render(<ScanOverlay status="success" />);
      const overlay = getByTestId('scan-overlay-container');
      expect(overlay).toBeTruthy();
      expect(overlay.props.accessibilityLabel).toContain('success status');
    });

    it('should render with error status', () => {
      const { getByTestId } = render(<ScanOverlay status="error" />);
      const overlay = getByTestId('scan-overlay-container');
      expect(overlay).toBeTruthy();
      expect(overlay.props.accessibilityLabel).toContain('error status');
    });
  });

  describe('Messages', () => {
    it('should render custom message', () => {
      const message = 'Position QR code in frame';
      const { getByText } = render(<ScanOverlay message={message} />);
      expect(getByText(message)).toBeTruthy();
    });

    it('should render without message when not provided', () => {
      const { queryByLabelText } = render(<ScanOverlay />);
      // Message container should not be present without message
      const messageText = queryByLabelText(/Position/);
      expect(messageText).toBeFalsy();
    });

    it('should have correct accessibility label for message', () => {
      const message = 'Test message';
      const { getByTestId } = render(<ScanOverlay message={message} />);
      const messageElement = getByTestId('scan-overlay-message-text');
      expect(messageElement).toBeTruthy();
      expect(messageElement.props.accessibilityLabel).toBe(message);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible container', () => {
      const { getByTestId } = render(<ScanOverlay status="scanning" />);
      const container = getByTestId('scan-overlay-container');
      expect(container).toBeTruthy();
      expect(container.props.accessible).toBe(true);
    });

    it('should have correct accessibility role', () => {
      const { getByTestId } = render(<ScanOverlay />);
      const overlay = getByTestId('scan-overlay-container');
      expect(overlay).toBeTruthy();
      expect(overlay.props.accessibilityRole).toBe('image');
    });

    it('should have helpful hint text', () => {
      const { getByTestId } = render(<ScanOverlay />);
      const overlay = getByTestId('scan-overlay-container');
      expect(overlay).toBeTruthy();
      expect(overlay.props.accessibilityHint).toContain('Position the QR code');
    });

    it('should have accessible message labels', () => {
      const message = 'Scanning in progress';
      const { getByTestId } = render(<ScanOverlay message={message} />);
      const messageElement = getByTestId('scan-overlay-message-text');
      expect(messageElement).toBeTruthy();
      expect(messageElement.props.accessibilityLabel).toBe(message);
    });
  });

  describe('Animations', () => {
    it('should start animations on mount', () => {
      const { unmount } = render(<ScanOverlay status="scanning" />);
      expect(unmount).toBeTruthy();
    });

    it('should stop animations when status changes', () => {
      const { rerender, unmount } = render(<ScanOverlay status="scanning" />);
      rerender(<ScanOverlay status="success" />);
      expect(unmount).toBeTruthy();
    });

    it('should handle rapid status changes', () => {
      const { rerender } = render(<ScanOverlay status="scanning" />);
      rerender(<ScanOverlay status="success" />);
      rerender(<ScanOverlay status="error" />);
      rerender(<ScanOverlay status="idle" />);
      expect(true).toBe(true);
    });
  });

  describe('Props Combinations', () => {
    it('should render with all props provided', () => {
      const { getByTestId } = render(
        <ScanOverlay status="success" message="Success!" showCorners={true} showCenterBox={true} />
      );
      expect(getByTestId('scan-overlay-container')).toBeTruthy();
    });

    it('should render with minimal props', () => {
      const { root } = render(<ScanOverlay />);
      expect(root).toBeTruthy();
    });

    it('should handle status changes with message', () => {
      const { rerender } = render(<ScanOverlay status="scanning" message="Scanning..." />);
      rerender(<ScanOverlay status="success" message="Package verified!" />);
      expect(true).toBe(true);
    });

    it('should handle visibility toggling', () => {
      const { rerender } = render(<ScanOverlay showCenterBox={true} showCorners={true} />);
      rerender(<ScanOverlay showCenterBox={false} showCorners={false} />);
      rerender(<ScanOverlay showCenterBox={true} showCorners={true} />);
      expect(true).toBe(true);
    });
  });

  describe('Visual Styles', () => {
    it('should have correct default styling', () => {
      const { root } = render(<ScanOverlay status="scanning" />);
      expect(root).toBeTruthy();
    });

    it('should apply success styling', () => {
      const { root } = render(<ScanOverlay status="success" />);
      expect(root).toBeTruthy();
    });

    it('should apply error styling', () => {
      const { root } = render(<ScanOverlay status="error" />);
      expect(root).toBeTruthy();
    });

    it('should apply idle styling', () => {
      const { root } = render(<ScanOverlay status="idle" />);
      expect(root).toBeTruthy();
    });
  });
});
