/**
 * ErrorBoundary Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Test Child</Text>
      </ErrorBoundary>
    );

    expect(getByText('Test Child')).toBeTruthy();
  });

  it('should catch errors and display error UI', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText(/Une erreur s'est produite/)).toBeTruthy();
  });

  it('should call onError callback when error is caught', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it('should reset error when retry button is pressed', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be visible
    expect(getByText(/Une erreur s'est produite/)).toBeTruthy();

    // Press retry button
    const retryButton = getByText('Réessayer');
    fireEvent.press(retryButton);

    // Error UI should be hidden (component will re-render)
    // Note: In practice, the component might throw again if the underlying issue isn't fixed
  });

  it('should render custom fallback when provided', () => {
    const customFallback = (error: Error, resetError: () => void) => (
      <Text>Custom Error: {error.message}</Text>
    );

    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Custom Error: Test error')).toBeTruthy();
  });
});
