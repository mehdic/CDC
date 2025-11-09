/**
 * ErrorMessage Component (T271)
 * User-friendly error messages with multilingual support
 * Avoids technical jargon, provides actionable suggestions
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { t } from '../utils/i18n';
import { Button } from './Button';

/**
 * Error type enum
 */
export enum ErrorType {
  NETWORK = 'network',
  SERVER = 'server',
  VALIDATION = 'validation',
  NOT_FOUND = 'notFound',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
  // Healthcare-specific errors
  PRESCRIPTION_LOAD = 'prescriptionLoad',
  PATIENT_RECORD = 'patientRecord',
  INVENTORY = 'inventory',
  UPLOAD = 'upload',
  CAMERA = 'camera',
  LOCATION = 'location',
}

/**
 * Error action
 */
export interface ErrorAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

/**
 * ErrorMessage props
 */
export interface ErrorMessageProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  actions?: ErrorAction[];
  showRetry?: boolean;
  onRetry?: () => void;
  showContactSupport?: boolean;
  onContactSupport?: () => void;
  showGoBack?: boolean;
  onGoBack?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Get default error message based on type
 */
const getDefaultErrorMessage = (type: ErrorType): { title: string; message: string } => {
  const messageKey = `errors.${type}Error`;
  const message = t(messageKey);

  // Title based on error type
  let titleKey = 'errors.unknownError';
  switch (type) {
    case ErrorType.NETWORK:
      titleKey = 'errors.networkError';
      break;
    case ErrorType.SERVER:
      titleKey = 'errors.serverError';
      break;
    case ErrorType.VALIDATION:
      titleKey = 'errors.validationError';
      break;
    case ErrorType.NOT_FOUND:
      titleKey = 'errors.notFound';
      break;
    case ErrorType.UNAUTHORIZED:
      titleKey = 'errors.unauthorized';
      break;
    case ErrorType.FORBIDDEN:
      titleKey = 'errors.forbidden';
      break;
    case ErrorType.TIMEOUT:
      titleKey = 'errors.timeout';
      break;
    case ErrorType.PRESCRIPTION_LOAD:
      titleKey = 'errors.prescriptionLoadError';
      break;
    case ErrorType.PATIENT_RECORD:
      titleKey = 'errors.patientRecordError';
      break;
    case ErrorType.INVENTORY:
      titleKey = 'errors.inventoryError';
      break;
    case ErrorType.UPLOAD:
      titleKey = 'errors.uploadError';
      break;
    case ErrorType.CAMERA:
      titleKey = 'errors.cameraError';
      break;
    case ErrorType.LOCATION:
      titleKey = 'errors.locationError';
      break;
    default:
      titleKey = 'errors.unknownError';
  }

  return {
    title: t(titleKey),
    message: message !== messageKey ? message : t('errors.unknownError'),
  };
};

/**
 * ErrorMessage Component
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  type = ErrorType.UNKNOWN,
  title,
  message,
  actions,
  showRetry = false,
  onRetry,
  showContactSupport = false,
  onContactSupport,
  showGoBack = false,
  onGoBack,
  icon,
  style,
  testID,
}) => {
  const defaultMessages = getDefaultErrorMessage(type);

  // Use custom title/message if provided, otherwise use defaults
  const displayTitle = title || defaultMessages.title;
  const displayMessage = message || defaultMessages.message;

  // Build default actions
  const defaultActions: ErrorAction[] = [];

  if (showRetry && onRetry) {
    defaultActions.push({
      label: t('common.retry'),
      onPress: onRetry,
      variant: 'primary',
    });
  }

  if (showGoBack && onGoBack) {
    defaultActions.push({
      label: t('common.goBack'),
      onPress: onGoBack,
      variant: 'outline',
    });
  }

  if (showContactSupport && onContactSupport) {
    defaultActions.push({
      label: t('common.contactSupport'),
      onPress: onContactSupport,
      variant: 'secondary',
    });
  }

  // Merge custom actions with default actions
  const allActions = [...(actions || []), ...defaultActions];

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel={`${displayTitle}. ${displayMessage}`}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{displayTitle}</Text>
        <Text style={styles.message}>{displayMessage}</Text>
      </View>

      {allActions.length > 0 && (
        <View style={styles.actionsContainer}>
          {allActions.map((action, index) => (
            <Button
              key={index}
              title={action.label}
              onPress={action.onPress}
              variant={action.variant || 'primary'}
              size="medium"
              style={styles.actionButton}
              testID={`${testID}-action-${index}`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Inline error message (compact version for forms)
 */
export const InlineErrorMessage: React.FC<{
  message: string;
  style?: ViewStyle;
  testID?: string;
}> = ({ message, style, testID }) => {
  if (!message) return null;

  return (
    <View style={[styles.inlineContainer, style]} testID={testID}>
      <Text style={styles.inlineMessage} accessibilityRole="alert">
        {message}
      </Text>
    </View>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  iconContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  contentContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC3545',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    minWidth: 100,
  },
  // Inline error styles
  inlineContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  inlineMessage: {
    fontSize: 12,
    color: '#DC3545',
    lineHeight: 16,
  },
});

/**
 * Export component
 */
export default ErrorMessage;
