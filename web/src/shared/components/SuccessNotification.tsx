/**
 * SuccessNotification Component (T272) - Web Version
 * Success notifications with auto-dismiss and accessibility support
 * Uses notistack for better toast management
 */

import React from 'react';
import { Snackbar, Alert, AlertColor, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { t } from '../utils/i18n';

/**
 * Notification variant
 */
export type NotificationVariant = 'success' | 'info' | 'warning' | 'error';

/**
 * Notification position
 */
export type NotificationPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * SuccessNotification props
 */
export interface SuccessNotificationProps {
  open: boolean;
  message: string;
  variant?: NotificationVariant;
  position?: NotificationPosition;
  duration?: number; // Auto-dismiss duration in ms (default: 3000)
  onClose?: () => void;
  showCloseButton?: boolean;
  icon?: React.ReactNode;
  sx?: any;
  testID?: string;
}

/**
 * Convert position to anchorOrigin
 */
const getAnchorOrigin = (
  position: NotificationPosition
): {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
} => {
  const [vertical, horizontal] = position.split('-') as [
    'top' | 'bottom',
    'left' | 'center' | 'right'
  ];
  return { vertical, horizontal };
};

/**
 * SuccessNotification Component
 */
export const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  open,
  message,
  variant = 'success',
  position = 'top-right',
  duration = 3000,
  onClose,
  showCloseButton = true,
  icon,
  sx,
  testID,
}) => {
  const anchorOrigin = getAnchorOrigin(position);

  // Accessibility label
  const accessibilityLabel = `${t(`accessibility.${variant}`)}. ${message}`;

  // Handle auto-dismiss
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration > 0 ? duration : null}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      data-testid={testID}
      sx={sx}
    >
      <Alert
        severity={variant as AlertColor}
        icon={icon || undefined}
        onClose={showCloseButton ? handleClose : undefined}
        sx={{
          width: '100%',
          boxShadow: 3,
        }}
        role="alert"
        aria-label={accessibilityLabel}
        aria-live="polite"
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

/**
 * Notification Manager Hook (for managing multiple notifications)
 */
export interface NotificationItem {
  id: string;
  message: string;
  variant?: NotificationVariant;
  duration?: number;
}

/**
 * Use notifications hook
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

  const showNotification = React.useCallback(
    (item: Omit<NotificationItem, 'id'>) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      setNotifications((prev) => [...prev, { ...item, id }]);
      return id;
    },
    []
  );

  const dismissNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = React.useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    dismissNotification,
    dismissAll,
  };
};

/**
 * Notification Container (for rendering multiple notifications)
 */
interface NotificationContainerProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  position?: NotificationPosition;
  testID?: string;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onDismiss,
  position = 'top-right',
  testID,
}) => {
  return (
    <>
      {notifications.map((notification) => (
        <SuccessNotification
          key={notification.id}
          open={true}
          message={notification.message}
          variant={notification.variant}
          duration={notification.duration}
          position={position}
          onClose={() => onDismiss(notification.id)}
          testID={`${testID}-${notification.id}`}
        />
      ))}
    </>
  );
};

/**
 * Convenience functions for showing notifications
 */
export const showSuccessNotification = (message: string, duration = 3000) => {
  return { message, variant: 'success' as NotificationVariant, duration };
};

export const showInfoNotification = (message: string, duration = 3000) => {
  return { message, variant: 'info' as NotificationVariant, duration };
};

export const showWarningNotification = (message: string, duration = 4000) => {
  return { message, variant: 'warning' as NotificationVariant, duration };
};

export const showErrorNotification = (message: string, duration = 5000) => {
  return { message, variant: 'error' as NotificationVariant, duration };
};

/**
 * Export component
 */
export default SuccessNotification;
