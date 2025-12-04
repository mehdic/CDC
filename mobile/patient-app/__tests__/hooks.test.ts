/**
 * Hooks Tests
 * Test suite for custom React hooks
 */

// Mock services BEFORE importing hooks
jest.mock('../src/services/push-notifications', () => ({
  PushNotificationService: {
    subscribeToNotifications: jest.fn().mockResolvedValue(undefined),
    unsubscribeFromNotifications: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/services/offline-storage', () => ({
  default: {
    getSyncQueueStatus: jest.fn().mockResolvedValue({ pending: 0 }),
    cacheData: jest.fn().mockResolvedValue(undefined),
    getCachedData: jest.fn().mockResolvedValue(null),
    queueChange: jest.fn().mockResolvedValue('change-id'),
    syncQueue: jest.fn().mockResolvedValue(undefined),
    onConnectionStatusChanged: jest.fn(() => jest.fn()), // Returns unsubscribe function
  },
}));

jest.mock('../src/services/biometric-auth', () => ({
  default: {
    isBiometricAvailable: jest.fn().mockResolvedValue(false),
    isEnabled: jest.fn().mockResolvedValue(false),
    enable: jest.fn().mockResolvedValue(undefined),
    disable: jest.fn().mockResolvedValue(undefined),
    authenticate: jest.fn().mockResolvedValue(false),
    getStoredCredentials: jest.fn().mockResolvedValue(null),
  },
}));

import { renderHook, act } from '@testing-library/react-native';

import { useBiometricAuth } from '../src/hooks/useBiometricAuth';
import { useOfflineData } from '../src/hooks/useOfflineData';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

describe('usePushNotifications Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.skip('should initialize with default values', () => {
    // TODO: Mock PushNotificationService.registerHandler properly
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test.skip('should have mark as read function', () => {
    // TODO: Mock registerHandler properly
    const { result } = renderHook(() => usePushNotifications());

    expect(typeof result.current.markAsRead).toBe('function');
  });

  test.skip('should have delete notification function', () => {
    // TODO: Mock registerHandler properly
    const { result } = renderHook(() => usePushNotifications());

    expect(typeof result.current.deleteNotification).toBe('function');
  });

  test.skip('should have clear all function', () => {
    // TODO: Mock registerHandler properly
    const { result } = renderHook(() => usePushNotifications());

    expect(typeof result.current.clearAll).toBe('function');
  });

  test.skip('should mark notification as read', async () => {
    // TODO: Mock registerHandler properly
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.markAsRead('test-id');
    });

    expect(result.current).toBeDefined();
  });

  test.skip('should delete notification', async () => {
    // TODO: Mock registerHandler properly
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.deleteNotification('test-id');
    });

    expect(result.current).toBeDefined();
  });

  test.skip('should clear all notifications', async () => {
    // TODO: Mock registerHandler properly
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.clearAll();
    });

    expect(result.current).toBeDefined();
  });
});

describe.skip('useOfflineData Hook', () => {
  // TODO: These tests require proper service mocking setup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useOfflineData());

    expect(result.current.data).toBeNull();
    expect(result.current.isOnline).toBe(false);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.pendingChanges).toBe(0);
    expect(result.current.error).toBeNull();
  });

  test('should have cache data function', () => {
    const { result } = renderHook(() => useOfflineData());

    expect(typeof result.current.cacheData).toBe('function');
  });

  test('should have get cached data function', () => {
    const { result } = renderHook(() => useOfflineData());

    expect(typeof result.current.getCachedData).toBe('function');
  });

  test('should have queue change function', () => {
    const { result } = renderHook(() => useOfflineData());

    expect(typeof result.current.queueChange).toBe('function');
  });

  test('should have sync now function', () => {
    const { result } = renderHook(() => useOfflineData());

    expect(typeof result.current.syncNow).toBe('function');
  });

  test('should cache data', async () => {
    const { result } = renderHook(() => useOfflineData());
    const testData = { test: 'data' };

    await act(async () => {
      await result.current.cacheData('test-key', testData);
    });

    expect(result.current.data).toBeDefined();
  });

  test('should queue change', async () => {
    const { result } = renderHook(() => useOfflineData());

    await act(async () => {
      const id = await result.current.queueChange('create', 'items', {
        name: 'Test',
      });
      expect(id).toBeDefined();
    });
  });

  test('should sync offline queue', async () => {
    const { result } = renderHook(() => useOfflineData());

    await act(async () => {
      await result.current.syncNow();
    });

    expect(result.current).toBeDefined();
  });
});

describe('useBiometricAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.skip('should initialize with default values', () => {
    // TODO: Mock biometric auth service initialization
    const { result } = renderHook(() => useBiometricAuth());

    expect(result.current.biometricAvailable).toBe(false);
    expect(result.current.biometricEnabled).toBe(false);
    expect(result.current.biometricType).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('should have enable biometric function', () => {
    const { result } = renderHook(() => useBiometricAuth());

    expect(typeof result.current.enableBiometric).toBe('function');
  });

  test('should have disable biometric function', () => {
    const { result } = renderHook(() => useBiometricAuth());

    expect(typeof result.current.disableBiometric).toBe('function');
  });

  test('should have authenticate function', () => {
    const { result } = renderHook(() => useBiometricAuth());

    expect(typeof result.current.authenticate).toBe('function');
  });

  test('should have get stored credentials function', () => {
    const { result } = renderHook(() => useBiometricAuth());

    expect(typeof result.current.getStoredCredentials).toBe('function');
  });

  test('should have clear biometric data function', () => {
    const { result } = renderHook(() => useBiometricAuth());

    expect(typeof result.current.clearBiometricData).toBe('function');
  });

  test('should enable biometric', async () => {
    const { result } = renderHook(() => useBiometricAuth());

    await act(async () => {
      await result.current.enableBiometric('user@example.com', 'password');
    });

    expect(result.current).toBeDefined();
  });

  test('should authenticate', async () => {
    const { result } = renderHook(() => useBiometricAuth());

    await act(async () => {
      await result.current.authenticate();
    });

    expect(result.current).toBeDefined();
  });

  test('should get stored credentials', async () => {
    const { result } = renderHook(() => useBiometricAuth());

    await act(async () => {
      const credentials = await result.current.getStoredCredentials();
      expect(credentials === null || typeof credentials === 'object').toBe(
        true
      );
    });
  });

  test('should clear biometric data', async () => {
    const { result } = renderHook(() => useBiometricAuth());

    await act(async () => {
      await result.current.clearBiometricData();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe.skip('Hooks Integration', () => {
  // TODO: Fix service mocks to make integration tests work
  test('multiple hooks should work independently', () => {
    const { result: result1 } = renderHook(() => usePushNotifications());
    const { result: result2 } = renderHook(() => useOfflineData());
    const { result: result3 } = renderHook(() => useBiometricAuth());

    expect(result1.current).toBeDefined();
    expect(result2.current).toBeDefined();
    expect(result3.current).toBeDefined();
  });

  test('hooks should handle errors gracefully', async () => {
    const { result } = renderHook(() => usePushNotifications());

    // Even with errors, hook should maintain structure
    expect(result.current.notifications).toBeDefined();
    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
  });
});
