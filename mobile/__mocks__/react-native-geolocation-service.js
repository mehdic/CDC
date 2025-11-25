/**
 * Mock for react-native-geolocation-service
 */

module.exports = {
  requestAuthorization: jest.fn(() => Promise.resolve('granted')),
  getCurrentPosition: jest.fn((success) => {
    success({
      coords: {
        latitude: 46.8182,
        longitude: 8.2275,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });
  }),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  setRNConfiguration: jest.fn(),
  getLastKnownPosition: jest.fn((success) => {
    success({
      coords: {
        latitude: 46.8182,
        longitude: 8.2275,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });
  }),
};
