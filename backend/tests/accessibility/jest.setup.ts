/**
 * Jest setup file for accessibility tests
 * Configures jsdom environment and global test utilities
 */

// Mock HTML5 document methods that may not be available in jsdom
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = jest.fn();
}

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
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

// Mock window.getComputedStyle for style-based accessibility checks
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = jest.fn((element) => {
  const defaultStyles = {
    outline: '2px solid blue',
    outlineOffset: '2px',
    display: 'block',
    visibility: 'visible',
    opacity: '1',
  };

  return {
    ...defaultStyles,
    getPropertyValue: jest.fn((prop: string) => defaultStyles[prop as keyof typeof defaultStyles] || ''),
  } as any;
});

// Global test timeout for accessibility tests
jest.setTimeout(10000);

// Set default HTML lang attribute for language tests
if (!document.documentElement.hasAttribute('lang')) {
  document.documentElement.setAttribute('lang', 'en');
}

// Clear DOM between tests
afterEach(() => {
  document.body.innerHTML = '';
});
