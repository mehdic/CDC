/**
 * Mock for react-native-geolocation-service
 * Provides test-friendly geolocation mocking without requiring NativeEventEmitter
 */

const Geolocation = {
  getCurrentPosition: jest.fn((success, error, options) => {
    // Default: call success callback with mock position
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

  requestAuthorization: jest.fn(() => Promise.resolve('granted')),

  setRNConfiguration: jest.fn(),

  stopObserving: jest.fn(),
};

export default Geolocation;
