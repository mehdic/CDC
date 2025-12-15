/**
 * Offline Indicator Component
 * Shows network status, queues operations offline, and syncs when connection is restored
 * MetaPharm Connect - Delivery App
 *
 * Updated to use new offlineQueueService and networkMonitor
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';

import { useOfflineMode } from '../hooks/useOfflineMode';
import { QueuedAction } from '../services/offlineQueueService';

/**
 * Props for OfflineIndicator
 */
interface OfflineIndicatorProps {
  showDetails?: boolean;
  onStatusChange?: (isOnline: boolean) => void;
  position?: 'top' | 'bottom';
}

/**
 * Offline Indicator Banner Component
 * Shows current network status and sync queue information
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showDetails = true,
  onStatusChange,
  position = 'top',
}) => {
  const {
    isOffline,
    queuedCount,
    isProcessing,
    networkStatus,
  } = useOfflineMode();

  const isOnline = !isOffline;
  const syncQueue = queuedCount;
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  /**
   * Monitor network status changes
   */
  useEffect(() => {
    if (networkStatus) {
      setConnectionType(networkStatus.type);
    }

    if (onStatusChange) {
      onStatusChange(isOnline);
    }

    // Update last sync time when online and queue is empty
    if (isOnline && queuedCount === 0 && !isProcessing) {
      setLastSyncTime(new Date());
    }
  }, [isOnline, networkStatus, onStatusChange, queuedCount, isProcessing]);

  /**
   * Animate banner visibility
   */
  useEffect(() => {
    if (!isOnline) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, slideAnim]);

  const animatedStyle = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [position === 'top' ? -100 : 0, 0],
        }),
      },
    ],
  };

  if (isOnline && syncQueue === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        isOnline ? styles.bannerOnline : styles.bannerOffline,
        animatedStyle,
        { top: position === 'top' ? 0 : undefined, bottom: position === 'bottom' ? 0 : undefined },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              isOnline ? styles.statusDotOnline : styles.statusDotOffline,
            ]}
          />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>
              {isOnline ? 'Back Online' : 'Offline Mode'}
            </Text>
            {!isOnline ? (
              <Text style={styles.statusSubtitle}>
                Operations will sync when connection returns
              </Text>
            ) : syncQueue > 0 ? (
              <Text style={styles.statusSubtitle}>
                {isProcessing ? 'Syncing' : 'Queued'} {syncQueue} pending operation{syncQueue !== 1 ? 's' : ''}
              </Text>
            ) : (
              <Text style={styles.statusSubtitle}>
                Last synced: {lastSyncTime ? formatTime(lastSyncTime) : 'just now'}
              </Text>
            )}
          </View>
        </View>

        {showDetails && (
          <View style={styles.details}>
            <Text style={styles.detailLabel}>Connection: {connectionType}</Text>
            {syncQueue > 0 && (
              <Text style={styles.detailLabel}>Pending: {syncQueue}</Text>
            )}
          </View>
        )}
      </View>

      {!isOnline && syncQueue > 0 && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            Alert.alert('Sync Queue', `${syncQueue} operations queued for sync`);
          }}
        >
          <Text style={styles.retryButtonText}>Details</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

/**
 * Sync Status Component
 * Shows detailed sync queue information
 */
export const SyncQueueStatus: React.FC = () => {
  const { queue, isOffline, isProcessing } = useOfflineMode();
  const isOnline = !isOffline;

  if (queue.length === 0) {
    return null;
  }

  return (
    <View style={styles.queueContainer}>
      <View style={styles.queueHeader}>
        <Text style={styles.queueTitle}>
          Sync Queue ({queue.length} item{queue.length !== 1 ? 's' : ''})
        </Text>
        <Text style={styles.queueStatus}>
          {isProcessing ? 'Syncing...' : isOnline ? 'Ready' : 'Paused'}
        </Text>
      </View>

      {queue.map((item: QueuedAction) => (
        <View key={item.id} style={styles.queueItem}>
          <View style={styles.queueItemHeader}>
            <Text style={styles.queueItemType}>{formatSyncType(item.type)}</Text>
            <Text style={styles.queueItemRetry}>
              {item.retryCount > 0 ? `Retry ${item.retryCount}` : 'Pending'}
            </Text>
          </View>
          <Text style={styles.queueItemTime}>
            {formatTime(new Date(item.timestamp))}
          </Text>
        </View>
      ))}
    </View>
  );
};

/**
 * Partial Connectivity Component
 * Shows warning when connection is weak but not offline
 */
export interface PartialConnectivityProps {
  signalStrength?: number; // 0-100
  onWiFiSwitch?: () => void;
}

export const PartialConnectivity: React.FC<PartialConnectivityProps> = ({
  signalStrength,
  onWiFiSwitch,
}) => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (signalStrength !== undefined && signalStrength < 30) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [signalStrength]);

  if (!showWarning) {
    return null;
  }

  return (
    <View style={styles.warningBanner}>
      <View style={styles.warningContent}>
        <Text style={styles.warningIcon}>📡</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.warningTitle}>Weak Connection</Text>
          <Text style={styles.warningSubtitle}>
            Network signal is weak. Operations may be slower.
          </Text>
        </View>
      </View>

      {onWiFiSwitch && (
        <TouchableOpacity style={styles.wifiButton} onPress={onWiFiSwitch}>
          <Text style={styles.wifiButtonText}>Use WiFi</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Connection Recovery Helper Component
 * Shows tips and actions for regaining connection
 */
export const ConnectionRecoveryHelper: React.FC = () => {
  const { isOffline, checkNetwork } = useOfflineMode();

  if (!isOffline) {
    return null;
  }

  const handleCheckConnection = async () => {
    await checkNetwork();
  };

  return (
    <View style={styles.recoveryContainer}>
      <Text style={styles.recoveryTitle}>Offline Mode Active</Text>
      <Text style={styles.recoverySubtitle}>
        Your app is working offline. Changes will sync automatically when connection returns.
      </Text>

      <View style={styles.tips}>
        <TipItem
          icon="📍"
          title="Location tracking"
          description="Still enabled in background"
        />
        <TipItem
          icon="📝"
          title="Data collection"
          description="Stored locally and synced later"
        />
        <TipItem
          icon="⏱️"
          title="Auto-sync"
          description="Activates when online"
        />
      </View>

      <TouchableOpacity
        style={styles.checkConnectionButton}
        onPress={handleCheckConnection}
      >
        <Text style={styles.checkConnectionText}>Check Connection Status</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Tip Item Component
 * Individual recovery tip
 */
interface TipItemProps {
  icon: string;
  title: string;
  description: string;
}

const TipItem: React.FC<TipItemProps> = ({ icon, title, description }) => (
  <View style={styles.tip}>
    <Text style={styles.tipIcon}>{icon}</Text>
    <View style={styles.tipContent}>
      <Text style={styles.tipTitle}>{title}</Text>
      <Text style={styles.tipDescription}>{description}</Text>
    </View>
  </View>
);

/**
 * Utility Functions
 */

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format sync type for display
 */
function formatSyncType(type: string): string {
  const typeMap: Record<string, string> = {
    status_update: 'Status Update',
    location_update: 'Location Update',
    proof_submit: 'Proof of Delivery',
    accept_delivery: 'Delivery Acceptance',
    reject_delivery: 'Delivery Rejection',
  };
  return typeMap[type] || type;
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerOffline: {
    backgroundColor: '#DC3545',
  },
  bannerOnline: {
    backgroundColor: '#28A745',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusDotOffline: {
    backgroundColor: '#FFF',
  },
  statusDotOnline: {
    backgroundColor: '#90EE90',
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  statusSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  details: {
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  queueContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  queueStatus: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  queueItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueItemType: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  queueItemRetry: {
    fontSize: 11,
    color: '#999',
  },
  queueItemTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#856404',
  },
  warningSubtitle: {
    fontSize: 12,
    color: '#856404',
    marginTop: 2,
  },
  wifiButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFC107',
    borderRadius: 4,
    marginLeft: 8,
  },
  wifiButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  recoveryContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  recoveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recoverySubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  tips: {
    marginBottom: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  tipDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  checkConnectionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  checkConnectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default {
  OfflineIndicator,
  SyncQueueStatus,
  PartialConnectivity,
  ConnectionRecoveryHelper,
};
