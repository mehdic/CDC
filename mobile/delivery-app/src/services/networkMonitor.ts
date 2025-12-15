/**
 * Network Monitor Service
 * Monitors network connectivity and triggers sync on reconnect
 */

import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';

import { offlineQueueService } from './offlineQueueService';

/**
 * Network Status
 */
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  effectiveType?: string;
}

/**
 * Network Event Types
 */
export type NetworkEventType = 'online' | 'offline' | 'reconnected';

/**
 * Network Event Listener
 */
export type NetworkEventListener = (
  event: NetworkEventType,
  status: NetworkStatus
) => void;

/**
 * Network Monitor Configuration
 */
interface NetworkMonitorConfig {
  autoSync: boolean;
  syncOnReconnect: boolean;
  checkInterval?: number;
}

/**
 * Network Monitor Service Class
 */
class NetworkMonitor {
  private isOnline = false;
  private wasOffline = false;
  private unsubscribe: NetInfoSubscription | null = null;
  private listeners: NetworkEventListener[] = [];
  private config: NetworkMonitorConfig = {
    autoSync: true,
    syncOnReconnect: true,
  };
  private checkIntervalId: NodeJS.Timeout | null = null;

  /**
   * Initialize network monitoring
   */
  async initialize(config?: Partial<NetworkMonitorConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Get initial network state
    const state = await NetInfo.fetch();
    this.isOnline = this.determineOnlineStatus(state);

    console.log(`[NetworkMonitor] Initial status: ${this.isOnline ? 'online' : 'offline'}`);

    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener(this.handleNetworkChange.bind(this));

    // Set up periodic checks if configured
    if (this.config.checkInterval) {
      this.checkIntervalId = setInterval(() => {
        this.checkNetworkStatus();
      }, this.config.checkInterval);
    }
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange(state: NetInfoState): void {
    const isNowOnline = this.determineOnlineStatus(state);
    const statusChanged = isNowOnline !== this.isOnline;

    if (!statusChanged) {
      return;
    }

    const wasOnline = this.isOnline;
    this.isOnline = isNowOnline;

    const status: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      effectiveType: state.details?.effectiveType,
    };

    console.log(`[NetworkMonitor] Status changed: ${wasOnline ? 'online' : 'offline'} → ${isNowOnline ? 'online' : 'offline'}`);

    if (isNowOnline) {
      // Went online
      if (wasOnline === false && this.wasOffline) {
        // This is a reconnection
        this.notifyListeners('reconnected', status);
        this.handleReconnection();
      } else {
        this.notifyListeners('online', status);
      }
      this.wasOffline = false;
    } else {
      // Went offline
      this.wasOffline = true;
      this.notifyListeners('offline', status);
    }
  }

  /**
   * Determine if device is online
   */
  private determineOnlineStatus(state: NetInfoState): boolean {
    // Consider online if connected AND internet is reachable
    // If isInternetReachable is null (can't determine), assume online if connected
    return (
      state.isConnected === true &&
      (state.isInternetReachable === true || state.isInternetReachable === null)
    );
  }

  /**
   * Handle reconnection
   */
  private async handleReconnection(): Promise<void> {
    console.log('[NetworkMonitor] Reconnected - triggering sync...');

    if (this.config.syncOnReconnect) {
      try {
        const result = await offlineQueueService.processQueue();
        console.log('[NetworkMonitor] Sync complete:', result);
      } catch (error) {
        console.error('[NetworkMonitor] Sync error:', error);
      }
    }
  }

  /**
   * Manually check network status
   */
  async checkNetworkStatus(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    const isNowOnline = this.determineOnlineStatus(state);

    // Update if status changed
    if (isNowOnline !== this.isOnline) {
      this.handleNetworkChange(state);
    }

    return {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      effectiveType: state.details?.effectiveType,
    };
  }

  /**
   * Get current online status
   */
  isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Force sync now (if online)
   */
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    console.log('[NetworkMonitor] Force sync triggered');
    await offlineQueueService.processQueue();
  }

  /**
   * Subscribe to network events
   */
  subscribe(listener: NetworkEventListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(event: NetworkEventType, status: NetworkStatus): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event, status);
      } catch (error) {
        console.error('[NetworkMonitor] Listener error:', error);
      }
    });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NetworkMonitorConfig>): void {
    this.config = { ...this.config, ...config };

    // Handle interval changes
    if (config.checkInterval !== undefined) {
      if (this.checkIntervalId) {
        clearInterval(this.checkIntervalId);
        this.checkIntervalId = null;
      }

      if (config.checkInterval > 0) {
        this.checkIntervalId = setInterval(() => {
          this.checkNetworkStatus();
        }, config.checkInterval);
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): NetworkMonitorConfig {
    return { ...this.config };
  }

  /**
   * Cleanup and stop monitoring
   */
  shutdown(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }

    this.listeners = [];
    console.log('[NetworkMonitor] Shutdown complete');
  }
}

/**
 * Export singleton instance
 */
export const networkMonitor = new NetworkMonitor();
export default networkMonitor;
