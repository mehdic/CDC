import '@testing-library/jest-dom';

// Mock window.matchMedia for Ant Design and other components
// This must be done BEFORE antd is imported
const createMatchMediaMock = () => {
  return jest.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: createMatchMediaMock(),
});

// Mock ResizeObserver for components that use it - returns fully functional mock
// Create a proper ResizeObserver constructor that returns a proper instance
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Ensure ResizeObserver is mocked at window level for rc-component/resize-observer
if (typeof window !== 'undefined') {
  (window as any).ResizeObserver = MockResizeObserver;
}

// Mock global fetch API - provides default responses
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  blob: jest.fn().mockResolvedValue(new Blob()),
  clone: jest.fn(),
  headers: new Headers(),
  redirected: false,
  statusText: 'OK',
  type: 'basic' as any,
  url: '',
}) as jest.Mock;

// Mock window.scrollTo for pagination tests
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  configurable: true,
  value: jest.fn(),
});

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
        args[0].includes('Not implemented: window.scrollTo') ||
        args[0].includes('Warning: useLayoutEffect') ||
        args[0].includes('inside a test was not wrapped in act') ||
        args[0].includes('Cannot destructure property'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('ResponsiveObserver'))
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
