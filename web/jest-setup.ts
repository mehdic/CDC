import '@testing-library/jest-dom';

// Mock window.matchMedia for Ant Design and other components
// This must be done BEFORE antd is imported
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
} else {
  // Override if it already exists but might be incomplete
  const original = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn((query: string) => {
      const result = original(query);
      // Ensure matches property exists
      if (!('matches' in result)) {
        result.matches = false;
      }
      return result;
    }),
  });
}

// Mock ResizeObserver for components that use it
const mockResizeObserverInstance = {
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
};

const mockResizeObserver = jest.fn().mockImplementation(() => mockResizeObserverInstance);
global.ResizeObserver = mockResizeObserver;

// Also mock @rc-component/resize-observer's observer to prevent errors
if (typeof window !== 'undefined') {
  (window as any).mockResizeObserver = mockResizeObserverInstance;
}

// Note: Ant Design ResponsiveObserver is mocked directly in test files that use Row/Col
// This avoids test setup issues with dynamic imports

// Mock useMediaQuery to return false by default (before it's used by any components)
jest.mock('@mui/system/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

// Suppress console warnings during tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
        args[0].includes('Warning: useLayoutEffect') ||
        args[0].includes('inside a test was not wrapped in act'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
