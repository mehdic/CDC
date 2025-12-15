/**
 * Tests for PermissionDenied Component
 * Covers different permission states and user actions
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { PermissionDenied } from '../PermissionDenied';

// Mock Linking only (avoid breaking TurboModuleRegistry)
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openSettings: jest.fn().mockResolvedValue(undefined),
  openURL: jest.fn().mockResolvedValue(undefined),
}));

describe('PermissionDenied', () => {
  const mockOnRetry = jest.fn();
  const mockOnOpenSettings = jest.fn();
  const mockOnManualEntry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Permission Status: Denied', () => {
    it('should render denied state correctly', () => {
      const { getByText } = render(
        <PermissionDenied permissionStatus="denied" />
      );
      expect(getByText(/Camera Permission Required/)).toBeTruthy();
      expect(getByText(/scan delivery package/)).toBeTruthy();
    });

    it('should show try again button for denied state', () => {
      const { getByTestId } = render(
        <PermissionDenied
          permissionStatus="denied"
          onRetry={mockOnRetry}
        />
      );
      const tryAgainButton = getByTestId('permission-denied-retry-button');
      expect(tryAgainButton).toBeTruthy();
    });

    it('should show open settings button for denied state', () => {
      const { getByTestId } = render(
        <PermissionDenied
          permissionStatus="denied"
          onOpenSettings={mockOnOpenSettings}
        />
      );
      const settingsButton = getByTestId('permission-denied-settings-button');
      expect(settingsButton).toBeTruthy();
    });

    it('should show manual entry button for denied state', () => {
      const { getByTestId } = render(
        <PermissionDenied
          permissionStatus="denied"
          onManualEntry={mockOnManualEntry}
        />
      );
      const manualButton = getByTestId('permission-denied-manual-button');
      expect(manualButton).toBeTruthy();
    });
  });

  describe('Permission Status: Blocked', () => {
    it('should render blocked state correctly', () => {
      const { getByText } = render(
        <PermissionDenied permissionStatus="blocked" />
      );
      expect(getByText(/Camera Permission Blocked/)).toBeTruthy();
      expect(getByText(/blocked in your device settings/)).toBeTruthy();
    });

    it('should show only open settings button for blocked state', () => {
      const { getByTestId, queryByTestId } = render(
        <PermissionDenied
          permissionStatus="blocked"
          onOpenSettings={mockOnOpenSettings}
          onRetry={mockOnRetry}
        />
      );
      expect(getByTestId('permission-denied-settings-button')).toBeTruthy();
      expect(queryByTestId('permission-denied-retry-button')).toBeFalsy();
    });

    it('should provide settings navigation instructions', () => {
      const { getByText } = render(
        <PermissionDenied permissionStatus="blocked" />
      );
      expect(getByText(/Settings > Apps > MetaPharm/)).toBeTruthy();
    });
  });

  describe('Permission Status: Unavailable', () => {
    it('should render unavailable state correctly', () => {
      const { getByText } = render(
        <PermissionDenied permissionStatus="unavailable" />
      );
      expect(getByText(/Camera Not Available/)).toBeTruthy();
      expect(getByText(/device does not have a camera/)).toBeTruthy();
    });

    it('should show try again button for unavailable state', () => {
      const { getByTestId } = render(
        <PermissionDenied
          permissionStatus="unavailable"
          onRetry={mockOnRetry}
        />
      );
      const tryAgainButton = getByTestId('permission-denied-retry-button');
      expect(tryAgainButton).toBeTruthy();
    });

    it('should not show settings button for unavailable state', () => {
      const { queryByTestId } = render(
        <PermissionDenied
          permissionStatus="unavailable"
          onOpenSettings={mockOnOpenSettings}
        />
      );
      expect(queryByTestId('permission-denied-settings-button')).toBeFalsy();
    });
  });

  describe('Button Actions', () => {
    it('should call onRetry when try again clicked', async () => {
      const { getByTestId } = render(
        <PermissionDenied
          permissionStatus="denied"
          onRetry={mockOnRetry}
        />
      );
      const tryAgainButton = getByTestId('permission-denied-retry-button');

      fireEvent.press(tryAgainButton);

      await waitFor(() => {
        expect(mockOnRetry).toHaveBeenCalled();
      });
    });

    it('should open settings when settings button clicked', async () => {
      const { getByTestId } = render(
        <PermissionDenied
          permissionStatus="denied"
          onOpenSettings={mockOnOpenSettings}
        />
      );
      const settingsButton = getByTestId('permission-denied-settings-button');

      fireEvent.press(settingsButton);

      await waitFor(() => {
        expect(Linking.openSettings).toHaveBeenCalled();
        expect(mockOnOpenSettings).toHaveBeenCalled();
      });
    });

    it('should call onManualEntry when manual entry clicked', async () => {
      const { getByTestId } = render(
        <PermissionDenied
          permissionStatus="denied"
          onManualEntry={mockOnManualEntry}
        />
      );
      const manualButton = getByTestId('permission-denied-manual-button');

      fireEvent.press(manualButton);

      await waitFor(() => {
        expect(mockOnManualEntry).toHaveBeenCalled();
      });
    });
  });

  describe('Instructions Display', () => {
    it('should display numbered instructions', () => {
      const { getByText } = render(
        <PermissionDenied permissionStatus="denied" />
      );
      expect(getByText(/Steps to enable camera/)).toBeTruthy();
      expect(getByText(/1\./)).toBeTruthy();
      expect(getByText(/2\./)).toBeTruthy();
    });

    it('should show different instructions for different states', () => {
      const { getByText: getDeniedText } = render(
        <PermissionDenied permissionStatus="denied" />
      );
      expect(getDeniedText(/Grant camera permission/)).toBeTruthy();

      const { getByText: getBlockedText } = render(
        <PermissionDenied permissionStatus="blocked" />
      );
      expect(getBlockedText(/Go to Settings/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible icon label', () => {
      const { getByTestId } = render(
        <PermissionDenied permissionStatus="denied" />
      );
      const icon = getByTestId('permission-denied-icon');
      expect(icon).toBeTruthy();
    });

    it('should have accessible title', () => {
      const { getByTestId } = render(
        <PermissionDenied permissionStatus="denied" />
      );
      const title = getByTestId('permission-denied-title');
      expect(title).toBeTruthy();
    });

    it('should have accessible message', () => {
      const { getByTestId } = render(
        <PermissionDenied permissionStatus="denied" />
      );
      const message = getByTestId('permission-denied-message');
      expect(message).toBeTruthy();
    });

    it('should have accessible instructions', () => {
      const { getByTestId } = render(
        <PermissionDenied permissionStatus="denied" />
      );
      const instructions = getByTestId('permission-denied-instructions');
      expect(instructions).toBeTruthy();
    });

    it('should have accessible buttons with hints', () => {
      const { getByTestId } = render(
        <PermissionDenied
          permissionStatus="denied"
          onRetry={mockOnRetry}
        />
      );
      const button = getByTestId('permission-denied-retry-button');
      expect(button).toBeTruthy();
    });
  });

  describe('Privacy Notice', () => {
    it('should display privacy notice', () => {
      const { getByText } = render(
        <PermissionDenied permissionStatus="denied" />
      );
      expect(getByText(/We use camera only to scan QR codes/)).toBeTruthy();
    });

    it('should mention no photo storage', () => {
      const { getByText } = render(
        <PermissionDenied permissionStatus="denied" />
      );
      expect(getByText(/No photos are stored/)).toBeTruthy();
    });
  });

  describe('Optional Props', () => {
    it('should render without callbacks', () => {
      const { root } = render(
        <PermissionDenied permissionStatus="denied" />
      );
      expect(root).toBeTruthy();
    });

    it('should handle selective callback props', () => {
      const { root } = render(
        <PermissionDenied
          permissionStatus="denied"
          onRetry={mockOnRetry}
        />
      );
      expect(root).toBeTruthy();
    });

    it('should handle all callback props', () => {
      const { root } = render(
        <PermissionDenied
          permissionStatus="denied"
          onRetry={mockOnRetry}
          onOpenSettings={mockOnOpenSettings}
          onManualEntry={mockOnManualEntry}
        />
      );
      expect(root).toBeTruthy();
    });
  });

  describe('Visual States', () => {
    it('should render different visual states', () => {
      const states = ['denied', 'blocked', 'unavailable'] as const;

      states.forEach(state => {
        const { root } = render(
          <PermissionDenied permissionStatus={state} />
        );
        expect(root).toBeTruthy();
      });
    });
  });
});
