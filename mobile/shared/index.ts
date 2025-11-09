/**
 * Shared Components and Utilities
 * Export all shared mobile components, services, and utilities
 */

// Components
export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button';

export { Input } from './components/Input';
export type { InputProps, InputType } from './components/Input';

export { Card } from './components/Card';
export type { CardProps, CardElevation } from './components/Card';

export {
  Loading,
  LoadingOverlay,
  LoadingSpinner,
  SkeletonLoader,
  SkeletonCard,
  SkeletonList,
} from './components/Loading';
export type { LoadingProps, SkeletonProps, LoadingType } from './components/Loading';

export { ErrorBoundary } from './components/ErrorBoundary';

// Navigation
export { RootNavigator, clearNavigationState } from './navigation/RootNavigator';
export type { AppType } from './navigation/RootNavigator';

export { AuthNavigator, useAuthNavigation } from './navigation/AuthNavigator';
export type { AuthStackParamList } from './navigation/AuthNavigator';

// Services
export {
  apiClient,
  get,
  post,
  put,
  del,
  patch,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
} from './services/apiClient';

export { offlineQueue } from './services/offlineQueue';
export type { QueuedRequest } from './services/offlineQueue';

// Utils
export {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  setAuthToken,
  getAuthToken,
  setRefreshToken,
  getRefreshToken,
  clearAuthTokens,
  isBiometricSupported,
  getBiometryType,
  setSecureItemWithBiometric,
  STORAGE_KEYS,
} from './utils/secureStorage';
export type { SecureStorageOptions } from './utils/secureStorage';
