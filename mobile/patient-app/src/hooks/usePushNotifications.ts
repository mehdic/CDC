/**
 * usePushNotifications Hook
 * Custom hook for managing push notifications in React components
 */

import { useEffect, useState, useCallback } from 'react';

import PushNotificationsService, {
  PushNotification,
} from '../services/push-notifications';

interface UsePushNotificationsReturn {
  notifications: PushNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

/**
 * Hook for managing push notifications
 */
export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize push notifications
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        await PushNotificationsService.initialize();

        // Load initial notifications
        const initialNotifications =
          await PushNotificationsService.getNotifications();
        setNotifications(initialNotifications);

        // Load unread count
        const count = await PushNotificationsService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Handle incoming notification
  const handleNotification = useCallback((notification: PushNotification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  // Register notification handler
  useEffect(() => {
    PushNotificationsService.registerHandler(handleNotification);

    return () => {
      PushNotificationsService.unregisterHandler(handleNotification);
    };
  }, [handleNotification]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await PushNotificationsService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      const newCount = await PushNotificationsService.getUnreadCount();
      setUnreadCount(newCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await PushNotificationsService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      const newCount = await PushNotificationsService.getUnreadCount();
      setUnreadCount(newCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      await PushNotificationsService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    deleteNotification,
    clearAll,
  };
};
