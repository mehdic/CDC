// Mock for react-native-encrypted-storage
const storage = {};

const setItem = jest.fn((key, value) => {
  storage[key] = value;
  return Promise.resolve();
});

const getItem = jest.fn((key) => {
  return Promise.resolve(storage[key] || null);
});

const removeItem = jest.fn((key) => {
  delete storage[key];
  return Promise.resolve();
});

const clear = jest.fn(() => {
  Object.keys(storage).forEach((key) => delete storage[key]);
  return Promise.resolve();
});

const getAllKeys = jest.fn(() => {
  return Promise.resolve(Object.keys(storage));
});

module.exports = {
  default: {
    setItem,
    getItem,
    removeItem,
    clear,
    getAllKeys,
  },
  setItem,
  getItem,
  removeItem,
  clear,
  getAllKeys,
};
