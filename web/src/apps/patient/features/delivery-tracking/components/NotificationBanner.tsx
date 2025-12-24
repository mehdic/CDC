/**
 * Notification Banner Component
 * T8-042: Patient Delivery Tracking
 * Displays delivery notifications with simulated push/SMS
 */

import React, { useEffect } from 'react';
import { Alert, Snackbar, Badge, IconButton, Box, Typography } from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import type { DeliveryNotification } from '../types/tracking';

/**
 * Props
 */
export interface NotificationBannerProps {
  notifications: DeliveryNotification[];
  onNotificationRead: (id: string) => void;
}

/**
 * Notification Banner Component
 */
export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notifications,
  onNotificationRead,
}) => {
  const [snackbarOpen, setSnackbarOpen] = React.useState<boolean>(false);
  const [currentNotification, setCurrentNotification] =
    React.useState<DeliveryNotification | null>(null);

  // Get unread notifications count
  const unreadCount = notifications.filter((n) => !n.read).length;

  /**
   * Show new notification
   */
  useEffect(() => {
    // Find the most recent unread notification
    const latestUnread = notifications.find((n) => !n.read);

    if (latestUnread && currentNotification?.id !== latestUnread.id) {
      setCurrentNotification(latestUnread);
      setSnackbarOpen(true);

      // Simulate push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(latestUnread.title, {
          body: latestUnread.message,
          icon: '/favicon.ico',
          tag: latestUnread.id,
        });
      }

      // Simulate SMS (log to console in development)
      console.log('[SMS Simulation]', {
        to: 'patient_phone_number',
        message: `${latestUnread.title}: ${latestUnread.message}`,
        timestamp: latestUnread.timestamp,
      });
    }
  }, [notifications, currentNotification]);

  /**
   * Handle Snackbar Close
   */
  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  /**
   * Handle Notification Read
   */
  const handleMarkAsRead = () => {
    if (currentNotification) {
      onNotificationRead(currentNotification.id);
    }
    handleSnackbarClose();
  };

  /**
   * Get Severity Color
   */
  const getSeverity = (type: string): 'success' | 'info' | 'warning' | 'error' => {
    switch (type) {
      case 'delivered':
        return 'success';
      case 'assigned':
      case 'picked_up':
        return 'info';
      case 'arrived':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <>
      {/* Notification Badge Icon */}
      {unreadCount > 0 && (
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            right: 16,
            zIndex: 1300,
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon color="action" />
          </Badge>
        </Box>
      )}

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        {currentNotification && (
          <Alert
            onClose={handleMarkAsRead}
            severity={getSeverity(currentNotification.type)}
            variant="filled"
            sx={{ width: '100%', maxWidth: 400 }}
            icon={<NotificationsIcon />}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              {currentNotification.title}
            </Typography>
            <Typography variant="body2">{currentNotification.message}</Typography>
          </Alert>
        )}
      </Snackbar>
    </>
  );
};

/**
 * Request Notification Permission (utility)
 */
export function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('[Notifications] Permission granted');
      } else {
        console.log('[Notifications] Permission denied');
      }
    });
  }
}
