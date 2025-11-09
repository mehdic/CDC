/**
 * ErrorMessage Component (T271) - Web Version
 * User-friendly error messages with multilingual support
 * Avoids technical jargon, provides actionable suggestions
 */

import React from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import { t } from '../utils/i18n';

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
  onClick: () => void;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error';
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
  sx?: any;
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
  sx,
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
      onClick: onRetry,
      variant: 'contained',
      color: 'primary',
    });
  }

  if (showGoBack && onGoBack) {
    defaultActions.push({
      label: t('common.goBack'),
      onClick: onGoBack,
      variant: 'outlined',
      color: 'primary',
    });
  }

  if (showContactSupport && onContactSupport) {
    defaultActions.push({
      label: t('common.contactSupport'),
      onClick: onContactSupport,
      variant: 'text',
      color: 'secondary',
    });
  }

  // Merge custom actions with default actions
  const allActions = [...(actions || []), ...defaultActions];

  return (
    <Alert
      severity="error"
      icon={icon || undefined}
      sx={{
        my: 1,
        ...sx,
      }}
      data-testid={testID}
      role="alert"
      aria-label={`${displayTitle}. ${displayMessage}`}
    >
      <AlertTitle sx={{ fontWeight: 600 }}>{displayTitle}</AlertTitle>
      <Typography variant="body2" sx={{ mb: allActions.length > 0 ? 1.5 : 0 }}>
        {displayMessage}
      </Typography>

      {allActions.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
          {allActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'contained'}
              color={action.color || 'primary'}
              size="small"
              onClick={action.onClick}
              data-testid={`${testID}-action-${index}`}
              sx={{ minWidth: 100 }}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      )}
    </Alert>
  );
};

/**
 * Inline error message (compact version for forms)
 */
export const InlineErrorMessage: React.FC<{
  message: string;
  sx?: any;
  testID?: string;
}> = ({ message, sx, testID }) => {
  if (!message) return null;

  return (
    <Typography
      variant="caption"
      color="error"
      sx={{
        display: 'block',
        mt: 0.5,
        ...sx,
      }}
      data-testid={testID}
      role="alert"
    >
      {message}
    </Typography>
  );
};

/**
 * Export component
 */
export default ErrorMessage;
