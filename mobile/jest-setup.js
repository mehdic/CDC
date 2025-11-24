/**
 * Jest setup file for React Native testing environment
 * Runs after the test environment is set up but before tests execute
 */

// Suppress console warnings in tests (optional)
global.console = {
  ...console,
  // Suppress specific warnings if needed
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock global objects if needed
global.fetch = jest.fn();

// Mock React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn((title, message, buttons) => {
    // Mock implementation that simulates button press
    if (buttons && buttons.length > 0) {
      const firstButton = buttons[0];
      if (firstButton && firstButton.onPress) {
        firstButton.onPress();
      }
    }
  }),
}));

// Mock theme from doctor-app App
jest.mock('./doctor-app/src/App', () => ({
  theme: {
    colors: {
      primary: '#2196F3',
      secondary: '#03DAC6',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      error: '#B00020',
      success: '#4CAF50',
      warning: '#FF9800',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    typography: {
      h1: { fontSize: 28, fontWeight: 'bold' },
      h2: { fontSize: 24, fontWeight: 'bold' },
      h3: { fontSize: 20, fontWeight: '600' },
      body1: { fontSize: 16, fontWeight: 'normal' },
      body2: { fontSize: 14, fontWeight: 'normal' },
      caption: { fontSize: 12, fontWeight: 'normal' },
    },
  },
}));

// Add custom matchers from @testing-library/jest-native if installed
// This is already handled by setupFilesAfterEnv in jest.config.js
