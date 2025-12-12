// Mock implementation of @react-native-async-storage/async-storage
const mockData = {};

module.exports = {
  setItem: jest.fn(async (key, value) => {
    mockData[key] = value;
  }),
  getItem: jest.fn(async (key) => {
    return mockData[key] || null;
  }),
  removeItem: jest.fn(async (key) => {
    delete mockData[key];
  }),
  clear: jest.fn(async () => {
    Object.keys(mockData).forEach((key) => {
      delete mockData[key];
    });
  }),
  getAllKeys: jest.fn(async () => {
    return Object.keys(mockData);
  }),
  multiGet: jest.fn(async (keys) => {
    return keys.map((key) => [key, mockData[key] || null]);
  }),
  multiSet: jest.fn(async (keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => {
      mockData[key] = value;
    });
  }),
  multiRemove: jest.fn(async (keys) => {
    keys.forEach((key) => {
      delete mockData[key];
    });
  }),
};
