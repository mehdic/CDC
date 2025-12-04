/**
 * OfflineIndicator Component
 * Displays offline status and pending changes indicator
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

import OfflineStorageService from '../services/offline-storage';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showPendingCount?: boolean;
}

/**
 * OfflineIndicator Component
 * Shows when device is offline or has pending changes
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  showPendingCount = _showPendingCount,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  // Subscribe to connection status
  useEffect(() => {
    const unsubscribe = OfflineStorageService.onConnectionStatusChanged(
      (online) => {
        setIsOnline(online);
        if (online) {
          // Device came online - try to sync
          handleSync();
        }
      }
    );

    // Get initial status
    setIsOnline(OfflineStorageService.isConnected());
    updatePendingCount();

    return () => {
      unsubscribe();
    };
  }, []);

  // Update pending count periodically
  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Animate indicator in/out
  useEffect(() => {
    if (!isOnline || pendingCount > 0) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isOnline, pendingCount, slideAnim]);

  // Update pending changes count
  const updatePendingCount = async () => {
    try {
      const status = await OfflineStorageService.getSyncQueueStatus();
      setPendingCount(status.pending);
    } catch (error) {
      console.error('Error updating pending count:', error);
    }
  };

  // Handle sync
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await OfflineStorageService.syncOfflineQueue();
      await updatePendingCount();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Hide indicator if online and no pending changes
  if (isOnline && pendingCount === 0) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [position === 'top' ? -100 : 100, 0],
  });

  const backgroundColor = isOnline ? '#FFA500' : '#FF6B6B';
  const statusText = isOnline
    ? `${pendingCount} pending change${pendingCount !== 1 ? 's' : ''}`
    : 'Offline - Changes will sync when online';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          backgroundColor,
          [position]: 0,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.statusText}>{statusText}</Text>
        {isOnline && pendingCount > 0 && (
          <Text
            style={[
              styles.syncButton,
              isSyncing && styles.syncButtonDisabled,
            ]}
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  syncButton: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
});

export default OfflineIndicator;
