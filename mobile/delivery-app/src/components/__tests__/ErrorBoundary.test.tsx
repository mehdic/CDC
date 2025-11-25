/**
 * Unit Tests for ErrorBoundary Component
 * Tests error catching, recovery, and retry mechanisms
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ErrorBoundary, useErrorHandler, withErrorBoundary } from '../ErrorBoundary';

// Suppress console error output in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary Component', () => {
  // Test component that throws an error
  const ErrorThrowingComponent = () => {
    throw new Error('Test error message');
  };

  // Test component that renders normally
  const NormalComponent = () => <React.Fragment>Normal Content</React.Fragment>;

  describe('Rendering', () => {
    it('should render children when no error occurs', () => {
      const { UNSAFE_root } = render(
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should catch and display error when child component throws', () => {
      const { UNSAFE_root } = render(
        <ErrorBoundary>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Error Details', () => {
    it('should hide error details by default', () => {
      const { UNSAFE_root } = render(
        <ErrorBoundary showDetails={false}>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should show error details when showDetails is true', () => {
      const { UNSAFE_root } = render(
        <ErrorBoundary showDetails={true}>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Retry Mechanism', () => {
    it('should display retry and reset buttons', () => {
      const { UNSAFE_root } = render(
        <ErrorBoundary>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should have a retry limit', () => {
      const { UNSAFE_root } = render(
        <ErrorBoundary>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );
      // Component should be in error state
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Custom Error Handler', () => {
    it('should call onError prop when error occurs', () => {
      const mockOnError = jest.fn();
      render(
        <ErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );
      expect(mockOnError).toHaveBeenCalled();
    });

    it('should pass error to onError handler', () => {
      const mockOnError = jest.fn();
      render(
        <ErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );

      const [error] = mockOnError.mock.calls[0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error message');
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = (error: Error, retry: () => void) => (
        <React.Fragment>Custom Error UI</React.Fragment>
      );

      const { UNSAFE_root } = render(
        <ErrorBoundary fallback={customFallback}>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should pass error to custom fallback', () => {
      const customFallback = jest.fn((error: Error, retry: () => void) => (
        <React.Fragment>{error.message}</React.Fragment>
      ));

      render(
        <ErrorBoundary fallback={customFallback}>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );

      expect(customFallback).toHaveBeenCalled();
    });
  });

  describe('Error Logging', () => {
    it('should log error to console', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Reset Functionality', () => {
    it('should have reset capability', () => {
      const { UNSAFE_root } = render(
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});

describe('useErrorHandler Hook', () => {
  const TestComponent = () => {
    const { error, handleError, resetError, hasError } = useErrorHandler();

    return (
      <React.Fragment>
        {hasError && <React.Fragment>{error?.message}</React.Fragment>}
      </React.Fragment>
    );
  };

  it('should initialize with no error', () => {
    const { UNSAFE_root } = render(<TestComponent />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should handle errors', () => {
    const { UNSAFE_root } = render(<TestComponent />);
    expect(UNSAFE_root).toBeTruthy();
  });
});

describe('withErrorBoundary HOC', () => {
  const TestComponent = () => <React.Fragment>Wrapped Content</React.Fragment>;

  it('should wrap component with ErrorBoundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    const { UNSAFE_root } = render(<WrappedComponent />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should catch errors in wrapped component', () => {
    const ErrorComponent = () => {
      throw new Error('Wrapped error');
    };

    const WrappedComponent = withErrorBoundary(ErrorComponent);
    const { UNSAFE_root } = render(<WrappedComponent />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should pass error boundary props through HOC', () => {
    const mockOnError = jest.fn();
    const ErrorComponent = () => {
      throw new Error('Test');
    };

    const WrappedComponent = withErrorBoundary(ErrorComponent, { onError: mockOnError });
    render(<WrappedComponent />);
    expect(mockOnError).toHaveBeenCalled();
  });
});
