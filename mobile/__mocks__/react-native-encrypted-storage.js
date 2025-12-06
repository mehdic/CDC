/**
 * Mock for react-native-encrypted-storage
 */

const mockStorage = {};

const EncryptedStorage = {
  setItem: jest.fn(async (key, value) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  getItem: jest.fn(async (key) => {
    return Promise.resolve(mockStorage[key] || null);
  }),
  removeItem: jest.fn(async (key) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
  clear: jest.fn(async () => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    return Promise.resolve();
  }),
};

export default EncryptedStorage;
