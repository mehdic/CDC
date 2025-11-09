/**
 * Shared Error Boundary Component
 * Catches React errors and displays user-friendly error UI
 * Integrates with error logging services
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Class component required for error boundary functionality
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send error to logging service (e.g., Sentry, Firebase Crashlytics)
    this.logErrorToService(error, errorInfo);
  }

  /**
   * Log error to external service
   */
  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    try {
      // Placeholder for error logging service integration
      // Example: Sentry.captureException(error, { extra: errorInfo });
      // Example: crashlytics().recordError(error);

      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      };

      console.log('Error logged to service:', errorData);

      // In production, send to actual logging service
      // await fetch('https://api.yourservice.com/errors', {
      //   method: 'POST',
      //   body: JSON.stringify(errorData),
      // });
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  }

  /**
   * Reset error boundary state
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Render error UI or children
   */
  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.resetError);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Oups ! Une erreur s'est produite</Text>

            <Text style={styles.message}>
              Nous sommes désolés, quelque chose s'est mal passé. L'équipe technique a été
              notifiée.
            </Text>

            {/* Error details (visible in development) */}
            {__DEV__ && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Détails de l'erreur :</Text>
                <Text style={styles.errorText}>{error.toString()}</Text>

                {error.stack && (
                  <>
                    <Text style={styles.errorTitle}>Stack trace :</Text>
                    <Text style={styles.errorText}>{error.stack}</Text>
                  </>
                )}

                {errorInfo?.componentStack && (
                  <>
                    <Text style={styles.errorTitle}>Component stack :</Text>
                    <Text style={styles.errorText}>{errorInfo.componentStack}</Text>
                  </>
                )}
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.button} onPress={this.resetError}>
                <Text style={styles.buttonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    // No error - render children normally
    return children;
  }
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginTop: 12,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#495057',
    lineHeight: 18,
  },
  actions: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

/**
 * Export component
 */
export default ErrorBoundary;
