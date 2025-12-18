// Jest setup file - comprehensive React Native mocking
// Establishes proper native module mocks before any component/hook imports
// Note: react-native jest preset already provides mocks for PixelRatio, Dimensions, etc.
// We only add what's missing or needs special handling

/**
 * Mock NativeEventEmitter FIRST (before React Native tries to use it)
 * This fixes errors like "new NativeEventEmitter() requires a non-null argument"
 */
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  const EventEmitter = require('events').EventEmitter;
  return class extends EventEmitter {
    constructor(nativeModule) {
      super();
      this.nativeModule = nativeModule;
    }

    addListener(eventType, listener, context) {
      return super.on(eventType, listener);
    }

    removeListener(eventType, listener) {
      return super.off(eventType, listener);
    }

    removeAllListeners(eventType) {
      if (eventType) {
        super.removeAllListeners(eventType);
      } else {
        super.removeAllListeners();
      }
    }

    emit(eventType, ...args) {
      return super.emit(eventType, ...args);
    }
  };
});

/**
 * Mock TurboModuleRegistry to prevent "SettingsManager not found" errors
 */
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn((moduleName) => {
    // Return mock implementations for required modules
    const mocks = {
      SettingsManager: {
        getConstants: jest.fn(() => ({})),
      },
      SoundManager: {
        playSound: jest.fn(),
      },
      ModalManager: {
        showModal: jest.fn(),
      },
      Appearance: {
        getColorScheme: jest.fn(() => 'light'),
      },
      ActionSheetManager: {
        showActionSheetWithOptions: jest.fn(),
      },
    };

    return mocks[moduleName] || {};
  }),
  get: jest.fn((moduleName) => {
    return null; // Non-strict get returns null
  }),
}));


/**
 * Mock RCTNativeAppEventEmitter for event handling
 */
jest.mock('react-native/Libraries/EventEmitter/RCTNativeAppEventEmitter', () => ({
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
}));

/**
 * Mock AsyncStorage globally
 */
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
  default: {
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

/**
 * Mock NetInfo globally
 */
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: { effectiveType: '4g' },
    })
  ),
}));

/**
 * Mock react-native-geolocation-service
 */
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn((success) => {
    setTimeout(() => {
      success({
        coords: {
          latitude: 47.3769,
          longitude: 8.5417,
          accuracy: 10,
          altitude: 100,
          altitudeAccuracy: 5,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });
    }, 0);
  }),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
  startObserving: jest.fn(),
  stopObserving: jest.fn(),
  requestAuthorization: jest.fn(() => Promise.resolve('granted')),
  default: {
    getCurrentPosition: jest.fn((success) => {
      setTimeout(() => {
        success({
          coords: {
            latitude: 47.3769,
            longitude: 8.5417,
            accuracy: 10,
            altitude: 100,
            altitudeAccuracy: 5,
            heading: 0,
            speed: 0,
          },
          timestamp: Date.now(),
        });
      }, 0);
    }),
    watchPosition: jest.fn(() => 1),
    clearWatch: jest.fn(),
    startObserving: jest.fn(),
    stopObserving: jest.fn(),
    requestAuthorization: jest.fn(() => Promise.resolve('granted')),
  },
}));

/**
 * Mock react-native-maps
 */
jest.mock('react-native-maps', () => ({
  default: {
    __esModule: true,
    Marker: 'Marker',
    Polyline: 'Polyline',
    Callout: 'Callout',
  },
  Marker: 'Marker',
  Polyline: 'Polyline',
  Callout: 'Callout',
}));

/**
 * Mock react-native-camera
 */
jest.mock('react-native-camera', () => ({
  RNCamera: 'RNCamera',
  default: 'RNCamera',
}));

/**
 * Mock react-native-signature-canvas via __mocks__
 */
jest.mock('react-native-signature-canvas');

/**
 * Mock react-native-qrcode-scanner
 */
jest.mock('react-native-qrcode-scanner', () => ({
  default: 'QRCodeScanner',
  RNQRGenerator: 'RNQRGenerator',
}));

/**
 * Setup testing library matchers
 */
try {
  require('@testing-library/jest-native/extend-expect');
} catch (e) {
  // Extend-expect may fail with certain react-native versions
  // Tests will still work without it
}
