/**
 * T2-050: User-Friendly Error Messages
 * Converts technical errors to actionable user messages with retry options
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorMessage {
  title: string;
  message: string;
  severity: ErrorSeverity;
  action?: {
    label: string;
    handler: () => void;
  };
  retryable: boolean;
  errorCode?: string;
}

/**
 * Maps HTTP status codes to user-friendly messages
 */
const httpStatusMessages: Record<number, ErrorMessage> = {
  400: {
    title: 'Invalid Request',
    message: 'The information you provided is not valid. Please check and try again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'BAD_REQUEST',
  },
  401: {
    title: 'Authentication Required',
    message: 'Your session has expired. Please log in again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'UNAUTHORIZED',
  },
  403: {
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
    severity: 'warning',
    retryable: false,
    errorCode: 'FORBIDDEN',
  },
  404: {
    title: 'Not Found',
    message: 'The requested item could not be found. It may have been deleted.',
    severity: 'info',
    retryable: true,
    errorCode: 'NOT_FOUND',
  },
  408: {
    title: 'Request Timeout',
    message: 'The request took too long. Please check your connection and try again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'REQUEST_TIMEOUT',
  },
  429: {
    title: 'Too Many Requests',
    message: 'You are making requests too quickly. Please wait a moment and try again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'RATE_LIMITED',
  },
  500: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified. Please try again later.',
    severity: 'critical',
    retryable: true,
    errorCode: 'INTERNAL_SERVER_ERROR',
  },
  502: {
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again in a few moments.',
    severity: 'critical',
    retryable: true,
    errorCode: 'BAD_GATEWAY',
  },
  503: {
    title: 'Server Maintenance',
    message: 'We are performing maintenance. Please try again in a few minutes.',
    severity: 'info',
    retryable: true,
    errorCode: 'SERVICE_UNAVAILABLE',
  },
  504: {
    title: 'Connection Timeout',
    message: 'The server is not responding. Please check your connection and try again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'GATEWAY_TIMEOUT',
  },
};

/**
 * Maps common error types to user-friendly messages
 */
const errorTypeMessages: Record<string, ErrorMessage> = {
  NETWORK_ERROR: {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'NETWORK_ERROR',
  },
  TIMEOUT_ERROR: {
    title: 'Request Timeout',
    message: 'The request took too long. Please check your connection and try again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'TIMEOUT_ERROR',
  },
  VALIDATION_ERROR: {
    title: 'Validation Error',
    message: 'Please check the information you provided and try again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'VALIDATION_ERROR',
  },
  FILE_UPLOAD_ERROR: {
    title: 'Upload Failed',
    message: 'The file could not be uploaded. Please check the file size and format, then try again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'FILE_UPLOAD_ERROR',
  },
  PERMISSION_ERROR: {
    title: 'Permission Denied',
    message: 'You do not have permission to perform this action.',
    severity: 'warning',
    retryable: false,
    errorCode: 'PERMISSION_ERROR',
  },
  OFFLINE_ERROR: {
    title: 'You Are Offline',
    message: 'Please connect to the internet to continue.',
    severity: 'info',
    retryable: true,
    errorCode: 'OFFLINE_ERROR',
  },
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has ended. Please log in again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'SESSION_EXPIRED',
  },
  UNKNOWN_ERROR: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    severity: 'error',
    retryable: true,
    errorCode: 'UNKNOWN_ERROR',
  },
};

/**
 * Specific domain error messages
 */
const domainErrorMessages: Record<string, ErrorMessage> = {
  PRESCRIPTION_NOT_FOUND: {
    title: 'Prescription Not Found',
    message: 'The prescription you are looking for could not be found.',
    severity: 'info',
    retryable: false,
    errorCode: 'PRESCRIPTION_NOT_FOUND',
  },
  INVALID_PRESCRIPTION: {
    title: 'Invalid Prescription',
    message: 'The prescription data is invalid. Please upload a clear image and try again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'INVALID_PRESCRIPTION',
  },
  CONSULTATION_CONFLICT: {
    title: 'Time Conflict',
    message: 'The selected time slot is no longer available. Please choose another time.',
    severity: 'warning',
    retryable: true,
    errorCode: 'CONSULTATION_CONFLICT',
  },
  INSUFFICIENT_INVENTORY: {
    title: 'Out of Stock',
    message: 'The medication is currently out of stock. Please check back soon.',
    severity: 'info',
    retryable: false,
    errorCode: 'INSUFFICIENT_INVENTORY',
  },
  PAYMENT_DECLINED: {
    title: 'Payment Failed',
    message: 'Your payment was declined. Please check your payment details and try again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'PAYMENT_DECLINED',
  },
  INVALID_QR_CODE: {
    title: 'Invalid QR Code',
    message: 'The QR code could not be read. Please ensure the code is clear and try again.',
    severity: 'warning',
    retryable: true,
    errorCode: 'INVALID_QR_CODE',
  },
};

/**
 * Parses error object and returns user-friendly message
 */
export function parseError(error: any): ErrorMessage {
  // Check for HTTP status code
  if (error?.response?.status) {
    const statusMessage = httpStatusMessages[error.response.status];
    if (statusMessage) {
      return statusMessage;
    }
  }

  // Check for custom error code
  if (error?.code) {
    const codeMessage =
      errorTypeMessages[error.code] ||
      domainErrorMessages[error.code];
    if (codeMessage) {
      return codeMessage;
    }
  }

  // Check for error message patterns
  if (error?.message) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('timeout')) {
      return errorTypeMessages.NETWORK_ERROR;
    }
    if (message.includes('offline')) {
      return errorTypeMessages.OFFLINE_ERROR;
    }
    if (message.includes('validation')) {
      return errorTypeMessages.VALIDATION_ERROR;
    }
    if (message.includes('permission')) {
      return errorTypeMessages.PERMISSION_ERROR;
    }
    if (message.includes('session') || message.includes('expired')) {
      return errorTypeMessages.SESSION_EXPIRED;
    }

    // Return custom message if provided
    return {
      title: 'Error',
      message: error.message,
      severity: 'error',
      retryable: true,
      errorCode: 'CUSTOM_ERROR',
    };
  }

  // Default fallback
  return errorTypeMessages.UNKNOWN_ERROR;
}

/**
 * Creates error message with retry action
 */
export function createRetryableError(
  error: any,
  retryHandler: () => void,
): ErrorMessage {
  const baseError = parseError(error);

  if (baseError.retryable) {
    return {
      ...baseError,
      action: {
        label: 'Retry',
        handler: retryHandler,
      },
    };
  }

  return baseError;
}

/**
 * Validates form field and returns error message
 */
export function validateField(
  fieldName: string,
  value: any,
  rules: any,
): string | null {
  const fieldRules = rules[fieldName];
  if (!fieldRules) {return null;}

  // Required validation
  if (fieldRules.required && !value) {
    return `${fieldName} is required`;
  }

  // Email validation
  if (fieldRules.email && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
  }

  // Phone validation
  if (fieldRules.phone && value) {
    // Allow phone numbers with country code, spaces, dashes, dots, or parentheses (minimum 7 chars)
    const phoneRegex = /^[+]?[0-9\s().-]{7,}$/;
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid phone number';
    }
  }

  // Min length validation
  if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
    return `${fieldName} must be at least ${fieldRules.minLength} characters`;
  }

  // Max length validation
  if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
    return `${fieldName} must not exceed ${fieldRules.maxLength} characters`;
  }

  // Pattern validation
  if (fieldRules.pattern && value) {
    const regex = new RegExp(fieldRules.pattern);
    if (!regex.test(value)) {
      return fieldRules.patternMessage || `${fieldName} format is invalid`;
    }
  }

  return null;
}

/**
 * Validates entire form and returns errors
 */
export function validateForm(
  formData: Record<string, any>,
  rules: Record<string, any>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [fieldName, value] of Object.entries(formData)) {
    const error = validateField(fieldName, value, rules);
    if (error) {
      errors[fieldName] = error;
    }
  }

  return errors;
}

/**
 * Log error for debugging/analytics
 */
export function logError(
  error: any,
  context: string,
  userId?: string,
): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    userId,
    message: error?.message,
    code: error?.code,
    status: error?.response?.status,
    stack: error?.stack,
  };

  console.error('[ERROR]', JSON.stringify(errorLog, null, 2));

  // In production, send to error tracking service (Sentry, etc.)
  // sendToErrorTracker(errorLog);
}
