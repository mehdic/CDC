/**
 * ErrorBoundary Component Tests (T8-060)
 * Tests error catching, reporting, and recovery mechanisms
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary, ErrorFallbackMinimal } from '../ErrorBoundary';

// Mock Sentry
const mockCaptureException = jest.fn();
const mockWithScope = jest.fn((callback) => callback({ setContext: jest.fn() }));

global.Sentry = {
  captureException: mockCaptureException,
  withScope: mockWithScope,
};

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal component</div>;
};

describe('ErrorBoundary', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    // Suppress console.error during tests (expected errors)
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockCaptureException.mockClear();
    mockWithScope.mockClear();
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal component')).toBeInTheDocument();
    });

    it('should not call Sentry when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(mockCaptureException).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByText('Normal component')).not.toBeInTheDocument();
    });

    it('should report errors to Sentry', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Check that withScope was called (which leads to captureException)
      expect(mockWithScope).toHaveBeenCalled();
    });

    it('should call custom onError handler when provided', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' }),
        expect.any(Object)
      );
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText(/Oops! Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should allow user to retry by clicking Try Again', () => {
      let shouldThrow = true;
      const ToggleableComponent: React.FC = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Recovered component</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ToggleableComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click Try Again to reset error boundary
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      // After clicking, error boundary should reset and render normally
      rerender(
        <ErrorBoundary>
          <ToggleableComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Oops! Something went wrong/i)).not.toBeInTheDocument();
      expect(screen.getByText('Recovered component')).toBeInTheDocument();
    });

    it('should reset when resetKeys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']} resetOnPropsChange={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();

      // Change resetKeys to trigger reset
      rerender(
        <ErrorBoundary resetKeys={['key2']} resetOnPropsChange={true}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Oops! Something went wrong/i)).not.toBeInTheDocument();
      expect(screen.getByText('Normal component')).toBeInTheDocument();
    });
  });

  describe('Development Mode', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should display error details in development', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Look for the error message in the alert
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('Error:');
      expect(errorAlert).toHaveTextContent('Test error');
    });
  });

  describe('Multiple Errors', () => {
    it('should track error count', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();

      // Try again (still throws error)
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error count
      expect(screen.getByText(/This error has occurred 2 times/i)).toBeInTheDocument();
    });
  });

  describe('ErrorFallbackMinimal', () => {
    it('should render minimal fallback', () => {
      const resetError = jest.fn();

      render(<ErrorFallbackMinimal resetError={resetError} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(resetError).toHaveBeenCalled();
    });

    it('should reload page when no resetError provided', () => {
      const reloadMock = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      render(<ErrorFallbackMinimal />);

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorIcon = screen.getByLabelText('Error icon');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/Oops! Something went wrong/i);
    });
  });
});
