/**
 * Mock implementation of axios for Jest tests
 */

const mockAxiosInstance = {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  request: jest.fn(() => Promise.resolve({ data: {} })),
  head: jest.fn(() => Promise.resolve({ data: {} })),
  options: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
  defaults: {
    headers: {
      common: {},
      get: {},
      post: {},
      put: {},
      patch: {},
      delete: {},
      head: {},
    },
  },
};

const mockAxios = {
  create: jest.fn(() => mockAxiosInstance),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  request: jest.fn(() => Promise.resolve({ data: {} })),
  head: jest.fn(() => Promise.resolve({ data: {} })),
  options: jest.fn(() => Promise.resolve({ data: {} })),
  isAxiosError: jest.fn(() => false),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
  defaults: {
    headers: {
      common: {},
      get: {},
      post: {},
      put: {},
      patch: {},
      delete: {},
      head: {},
    },
  },
};

module.exports = mockAxios;
