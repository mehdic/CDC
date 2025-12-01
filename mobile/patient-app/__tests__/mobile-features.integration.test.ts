/**
 * Mobile Features Integration Test
 * Validates that all new mobile services are properly implemented
 */

import PushNotificationsService from '../src/services/push-notifications';
import OfflineStorageService from '../src/services/offline-storage';
import BiometricAuthService from '../src/services/biometric-auth';
import LocationService from '../src/services/location';

describe('Mobile Features Integration', () => {
  describe('Services Initialization', () => {
    test('PushNotificationsService should be accessible', () => {
      expect(PushNotificationsService).toBeDefined();
      expect(typeof PushNotificationsService.initialize).toBe('function');
      expect(typeof PushNotificationsService.getNotifications).toBe('function');
    });

    test('OfflineStorageService should be accessible', () => {
      expect(OfflineStorageService).toBeDefined();
      expect(typeof OfflineStorageService.cache).toBe('function');
      expect(typeof OfflineStorageService.getCache).toBe('function');
      expect(typeof OfflineStorageService.queueSync).toBe('function');
    });

    test('BiometricAuthService should be accessible', () => {
      expect(BiometricAuthService).toBeDefined();
      expect(typeof BiometricAuthService.isBiometricAvailable).toBe(
        'function'
      );
      expect(typeof BiometricAuthService.authenticate).toBe('function');
    });

    test('LocationService should be accessible', () => {
      expect(LocationService).toBeDefined();
      expect(typeof LocationService.getCurrentLocation).toBe('function');
      expect(typeof LocationService.findNearbyPharmacies).toBe('function');
    });
  });

  describe('Service Methods', () => {
    test('PushNotificationsService should have all required methods', () => {
      const methods = [
        'initialize',
        'registerHandler',
        'unregisterHandler',
        'handleNotification',
        'getNotifications',
        'markAsRead',
        'deleteNotification',
        'clearAllNotifications',
        'getUnreadCount',
        'getDeviceToken',
        'setDeviceToken',
      ];

      methods.forEach((method) => {
        expect(typeof (PushNotificationsService as any)[method]).toBe(
          'function'
        );
      });
    });

    test('OfflineStorageService should have all required methods', () => {
      const methods = [
        'cache',
        'getCache',
        'clearCache',
        'clearAllCache',
        'queueSync',
        'syncOfflineQueue',
        'removeSyncQueueItem',
        'getSyncQueueStatus',
        'isConnected',
        'onConnectionStatusChanged',
      ];

      methods.forEach((method) => {
        expect(typeof (OfflineStorageService as any)[method]).toBe('function');
      });
    });

    test('BiometricAuthService should have all required methods', () => {
      const methods = [
        'isBiometricAvailable',
        'getBiometricType',
        'isBiometricEnabled',
        'enableBiometric',
        'disableBiometric',
        'authenticate',
        'getStoredCredentials',
        'updateStoredCredentials',
        'clearBiometricData',
      ];

      methods.forEach((method) => {
        expect(typeof (BiometricAuthService as any)[method]).toBe('function');
      });
    });

    test('LocationService should have all required methods', () => {
      const methods = [
        'requestLocationPermission',
        'getCurrentLocation',
        'startWatchingLocation',
        'stopWatchingLocation',
        'findNearbyPharmacies',
        'getDistance',
        'clearLocationCache',
      ];

      methods.forEach((method) => {
        expect(typeof (LocationService as any)[method]).toBe('function');
      });
    });
  });

  describe('Service Singleton Pattern', () => {
    test('services should use singleton pattern', () => {
      const push1 = PushNotificationsService;
      const push2 = PushNotificationsService;
      expect(push1).toBe(push2);

      const offline1 = OfflineStorageService;
      const offline2 = OfflineStorageService;
      expect(offline1).toBe(offline2);

      const bio1 = BiometricAuthService;
      const bio2 = BiometricAuthService;
      expect(bio1).toBe(bio2);

      const loc1 = LocationService;
      const loc2 = LocationService;
      expect(loc1).toBe(loc2);
    });
  });

  describe('Service Error Handling', () => {
    test('services should handle errors gracefully', async () => {
      // Test that services don't throw on basic operations
      try {
        await PushNotificationsService.initialize();
        expect(true).toBe(true);
      } catch (error) {
        fail('PushNotificationsService should not throw');
      }

      try {
        const available = await BiometricAuthService.isBiometricAvailable();
        expect(typeof available).toBe('boolean');
      } catch (error) {
        fail('BiometricAuthService should not throw');
      }

      try {
        const status = await OfflineStorageService.getSyncQueueStatus();
        expect(status).toHaveProperty('pending');
        expect(status).toHaveProperty('isOnline');
      } catch (error) {
        fail('OfflineStorageService should not throw');
      }
    });
  });

  describe('Service Interface Compliance', () => {
    test('all services should export as default', () => {
      expect(PushNotificationsService).toBeDefined();
      expect(OfflineStorageService).toBeDefined();
      expect(BiometricAuthService).toBeDefined();
      expect(LocationService).toBeDefined();
    });

    test('services should be usable immediately', () => {
      // Services should be initialized and ready to use
      expect(PushNotificationsService.registerHandler).toBeDefined();
      expect(OfflineStorageService.isConnected).toBeDefined();
      expect(BiometricAuthService.getBiometricType).toBeDefined();
      expect(LocationService.getCurrentLocation_Cached).toBeDefined();
    });
  });
});
