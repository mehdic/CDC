/**
 * useNotifications Hook
 * Manages notifications with real-time updates and sound alerts
 */

import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationRead } from '../services/nurseApi';
import type { Notification } from '../types/nurse';

export const useNotifications = (enableSound: boolean = false) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Play sound for new high-priority notifications
  useEffect(() => {
    if (enableSound && notifications.length > 0) {
      const highPriorityUnread = notifications.filter(
        (n) => !n.read && n.priority === 'high'
      );
      if (highPriorityUnread.length > 0) {
        // Play notification sound (browser API)
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {
          // Ignore errors if user hasn't interacted with page yet
        });
      }
    }
  }, [notifications, enableSound]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    refetch: fetchNotifications,
  };
};
