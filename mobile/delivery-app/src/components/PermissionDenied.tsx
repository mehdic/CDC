/**
 * PermissionDenied Component
 * Shows guidance when camera permission is denied or blocked
 *
 * Features:
 * - Clear explanations of why permission is needed
 * - Direct link to device settings
 * - Fallback to manual entry option
 * - Accessibility support
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';

export interface PermissionDeniedProps {
  readonly permissionStatus: 'denied' | 'blocked' | 'unavailable';
  readonly onRetry?: () => void;
  readonly onOpenSettings?: () => void;
  readonly onManualEntry?: () => void;
}

/**
 * PermissionDenied Component
 * Displays permission denial guidance
 */
export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  permissionStatus,
  onRetry,
  onOpenSettings,
  onManualEntry,
}) => {
  const getContent = () => {
    switch (permissionStatus) {
      case 'blocked':
        return {
          icon: '🔒',
          title: 'Camera Permission Blocked',
          message:
            'Camera permission is blocked in your device settings. You need to enable it to scan QR codes.',
          instructions: [
            'Go to Settings > Apps > MetaPharm Delivery > Permissions',
            'Enable Camera permission',
            'Return to the app and try again',
          ],
          showSettings: true,
          showRetry: false,
        };

      case 'unavailable':
        return {
          icon: '📱',
          title: 'Camera Not Available',
          message:
            'Your device does not have a camera or it is not accessible at the moment. Please check your device or try again later.',
          instructions: [
            'Ensure your device has a functional camera',
            'Check if another app is using the camera',
            'Restart your device and try again',
          ],
          showSettings: false,
          showRetry: true,
        };

      case 'denied':
      default:
        return {
          icon: '📷',
          title: 'Camera Permission Required',
          message: 'Camera access is required to scan delivery package QR codes. This helps us verify packages accurately.',
          instructions: [
            'Grant camera permission when prompted',
            'Or enable it in Settings > Apps > MetaPharm Delivery > Permissions',
          ],
          showSettings: true,
          showRetry: true,
        };
    }
  };

  const content = getContent();

  const handleOpenSettings = async (): Promise<void> => {
    try {
      await Linking.openSettings();
      onOpenSettings?.();
    } catch (error) {
      Alert.alert(
        'Error',
        'Could not open device settings. Please manually navigate to Settings > Apps > MetaPharm Delivery > Permissions'
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      testID="permission-denied-container"
    >
      {/* Icon */}
      <Text
        style={styles.icon}
        accessibilityLabel={`${content.title} icon`}
        testID="permission-denied-icon"
      >
        {content.icon}
      </Text>

      {/* Title */}
      <Text
        style={styles.title}
        accessible={true}
        accessibilityLabel={content.title}
        accessibilityRole="header"
        testID="permission-denied-title"
      >
        {content.title}
      </Text>

      {/* Message */}
      <Text
        style={styles.message}
        accessible={true}
        accessibilityLabel={content.message}
        testID="permission-denied-message"
      >
        {content.message}
      </Text>

      {/* Instructions */}
      <View
        style={styles.instructionsContainer}
        accessible={true}
        accessibilityLabel={`Instructions: ${content.instructions.join(', ')}`}
        accessibilityRole="list"
        testID="permission-denied-instructions"
      >
        <Text style={styles.instructionsLabel}>Steps to enable camera:</Text>
        {content.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>{index + 1}.</Text>
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.buttonsContainer} testID="permission-denied-buttons">
        {content.showRetry && onRetry && (
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={onRetry}
            accessible={true}
            accessibilityLabel="Try again"
            accessibilityRole="button"
            accessibilityHint="Attempt to request camera permission again"
            testID="permission-denied-retry-button"
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}

        {content.showSettings && (
          <TouchableOpacity
            style={[styles.button, styles.settingsButton]}
            onPress={handleOpenSettings}
            accessible={true}
            accessibilityLabel="Open device settings"
            accessibilityRole="button"
            accessibilityHint="Navigate to device settings to enable camera permission"
            testID="permission-denied-settings-button"
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        )}

        {onManualEntry && (
          <TouchableOpacity
            style={[styles.button, styles.manualButton]}
            onPress={onManualEntry}
            accessible={true}
            accessibilityLabel="Enter code manually"
            accessibilityRole="button"
            accessibilityHint="Manually type or paste the QR code instead"
            testID="permission-denied-manual-button"
          >
            <Text style={styles.manualButtonText}>Enter Code Manually</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Privacy note */}
      <View style={styles.privacyNote} testID="permission-denied-privacy">
        <Text style={styles.privacyText}>
          We use camera only to scan QR codes. No photos are stored or transmitted.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Icon
  icon: {
    fontSize: 64,
    marginBottom: 24,
    textAlign: 'center',
  },

  // Title
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 32,
  },

  // Message
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },

  // Instructions section
  instructionsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    marginRight: 12,
    minWidth: 24,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },

  // Buttons
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#059669',
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  manualButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },

  // Privacy note
  privacyNote: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    width: '100%',
  },
  privacyText: {
    fontSize: 12,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default PermissionDenied;
