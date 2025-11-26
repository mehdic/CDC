/**
 * Mock for react-native-permissions
 */

const PERMISSIONS = {
  IOS: {
    CAMERA: 'ios.permission.CAMERA',
    PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
  },
  ANDROID: {
    CAMERA: 'android.permission.CAMERA',
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
  },
};

const RESULTS = {
  UNAVAILABLE: 'unavailable',
  BLOCKED: 'blocked',
  DENIED: 'denied',
  GRANTED: 'granted',
  LIMITED: 'limited',
};

const check = jest.fn(() => Promise.resolve(RESULTS.GRANTED));
const request = jest.fn(() => Promise.resolve(RESULTS.GRANTED));
const checkNotifications = jest.fn(() =>
  Promise.resolve({ status: RESULTS.GRANTED, settings: {} })
);
const requestNotifications = jest.fn(() =>
  Promise.resolve({ status: RESULTS.GRANTED, settings: {} })
);
const checkMultiple = jest.fn(() => Promise.resolve({}));
const requestMultiple = jest.fn(() => Promise.resolve({}));
const openSettings = jest.fn(() => Promise.resolve());

module.exports = {
  PERMISSIONS,
  RESULTS,
  check,
  request,
  checkNotifications,
  requestNotifications,
  checkMultiple,
  requestMultiple,
  openSettings,
};
