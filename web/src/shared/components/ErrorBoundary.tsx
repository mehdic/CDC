/**
 * Error Boundary Component (T8-060)
 * Catches React component errors and provides graceful fallback UI
 *
 * Features:
 * - Error catching with stack traces
 * - Sentry error reporting integration
 * - User-friendly error messages
 * - Error recovery mechanisms
 * - Development mode detailed errors
 *
 * Usage:
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <App />
 * </ErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Container, Typography, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

// Sentry will be initialized in main app
declare const Sentry: any;

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  /**
   * Update state when error occurs
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details and report to monitoring service
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error details
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Report to Sentry if available
    if (typeof Sentry !== 'undefined' && Sentry.captureException) {
      Sentry.withScope((scope: any) => {
        scope.setContext('errorBoundary', {
          componentStack: errorInfo.componentStack,
          errorCount: this.state.errorCount + 1,
        });
        Sentry.captureException(error);
      });
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-reload if too many errors (prevent infinite error loop)
    if (this.state.errorCount >= 3) {
      console.error('Too many errors, reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }

  /**
   * Reset error boundary when props change
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && this.props.resetOnPropsChange) {
      // Check if resetKeys have changed
      if (this.props.resetKeys) {
        const hasChangedResetKey = this.props.resetKeys.some(
          (key, index) => key !== prevProps.resetKeys?.[index]
        );

        if (hasChangedResetKey) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  /**
   * Reset error boundary to normal state
   */
  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the page
   */
  reloadPage = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 3,
            }}
          >
            <ErrorOutlineIcon
              sx={{ fontSize: 80, color: 'error.main' }}
              aria-label="Error icon"
            />

            <Typography variant="h4" component="h1" gutterBottom>
              Oops! Something went wrong
            </Typography>

            <Typography variant="body1" color="text.secondary">
              We're sorry, but an unexpected error has occurred.
              Our team has been notified and we're working on a fix.
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  <strong>Error:</strong> {this.state.error.message}
                </Typography>
                {this.state.error.stack && (
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      mt: 1,
                      fontSize: '0.7rem',
                    }}
                  >
                    {this.state.error.stack}
                  </Typography>
                )}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.resetErrorBoundary}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={this.reloadPage}
              >
                Reload Page
              </Button>
            </Box>

            {this.state.errorCount > 1 && (
              <Alert severity="warning" sx={{ width: '100%', mt: 2 }}>
                This error has occurred {this.state.errorCount} times.
                {this.state.errorCount >= 3 && ' Page will reload automatically...'}
              </Alert>
            )}
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

/**
 * Custom Error Fallback Component
 * Lightweight alternative to default fallback
 */
export const ErrorFallbackMinimal: React.FC<{ resetError?: () => void }> = ({
  resetError,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      p: 3,
    }}
  >
    <Typography variant="h5" gutterBottom>
      Something went wrong
    </Typography>
    <Button
      variant="contained"
      onClick={resetError || (() => window.location.reload())}
      sx={{ mt: 2 }}
    >
      Try Again
    </Button>
  </Box>
);

export default ErrorBoundary;
