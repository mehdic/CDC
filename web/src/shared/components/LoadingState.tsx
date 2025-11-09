/**
 * LoadingState Component (T270) - Web Version
 * Enhanced loading states for all async operations
 * Supports spinner, skeleton, progress bar, empty state, error state
 */

import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Typography,
  Button,
  Modal,
  Paper,
  styled,
} from '@mui/material';
import { t } from '../utils/i18n';

/**
 * Loading state type
 */
export type LoadingStateType =
  | 'spinner'
  | 'skeleton'
  | 'progress'
  | 'empty'
  | 'error'
  | 'overlay';

/**
 * Error type
 */
export interface ErrorState {
  title: string;
  message: string;
  retryable?: boolean;
  onRetry?: () => void;
  contactSupport?: boolean;
}

/**
 * Empty state
 */
export interface EmptyState {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onPress: () => void;
  };
}

/**
 * LoadingState props
 */
export interface LoadingStateProps {
  type: LoadingStateType;
  visible?: boolean;
  message?: string;
  progress?: number; // 0-100 for progress bar
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit';
  sx?: any;
  testID?: string;
  // For error state
  error?: ErrorState;
  // For empty state
  empty?: EmptyState;
}

/**
 * Styled components
 */
const OverlayBackdrop = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: theme.zIndex.modal,
}));

const OverlayContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1.5),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: 200,
}));

/**
 * Spinner Loading State
 */
export const SpinnerState: React.FC<Omit<LoadingStateProps, 'type'>> = ({
  message,
  size = 'medium',
  color = 'primary',
  sx,
  testID,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        ...sx,
      }}
      data-testid={testID}
      role="progressbar"
      aria-label={message || t('accessibility.loading')}
    >
      <CircularProgress size={size === 'small' ? 24 : size === 'large' ? 48 : 32} color={color} />
      {message && (
        <Typography sx={{ ml: 1.5, fontSize: 14, color: 'text.secondary' }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Skeleton Loader
 */
export const SkeletonState: React.FC<{
  width?: number | string;
  height?: number;
  variant?: 'text' | 'rectangular' | 'circular';
  sx?: any;
}> = ({ width = '100%', height = 20, variant = 'rectangular', sx }) => {
  return (
    <Skeleton
      variant={variant}
      width={width}
      height={height}
      sx={sx}
      aria-label={t('accessibility.loading')}
    />
  );
};

/**
 * Progress Bar Loading State
 */
export const ProgressState: React.FC<Omit<LoadingStateProps, 'type'>> = ({
  progress = 0,
  message,
  color = 'primary',
  sx,
  testID,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <Box
      sx={{
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...sx,
      }}
      data-testid={testID}
      role="progressbar"
      aria-label={`${message || t('common.loading')} ${clampedProgress}%`}
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {message && (
        <Typography sx={{ fontSize: 14, color: 'text.primary', mb: 1, textAlign: 'center' }}>
          {message}
        </Typography>
      )}
      <Box sx={{ width: '100%', mb: 1 }}>
        <LinearProgress variant="determinate" value={clampedProgress} color={color} />
      </Box>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
        {clampedProgress}%
      </Typography>
    </Box>
  );
};

/**
 * Error State
 */
export const ErrorStateComponent: React.FC<Omit<LoadingStateProps, 'type'>> = ({
  error,
  sx,
  testID,
}) => {
  if (!error) return null;

  return (
    <Box
      sx={{
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      data-testid={testID}
      role="alert"
      aria-label={t('accessibility.error')}
    >
      <Typography
        variant="h6"
        sx={{ color: 'error.main', mb: 1, textAlign: 'center', fontWeight: 600 }}
      >
        {error.title}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', mb: 2, textAlign: 'center', lineHeight: 1.5 }}
      >
        {error.message}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        {error.retryable && error.onRetry && (
          <Button
            variant="contained"
            color="primary"
            onClick={error.onRetry}
            data-testid={`${testID}-retry`}
            sx={{ minWidth: 120 }}
          >
            {t('common.retry')}
          </Button>
        )}
        {error.contactSupport && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              // TODO: Implement support contact
            }}
            data-testid={`${testID}-support`}
            sx={{ minWidth: 120 }}
          >
            {t('common.contactSupport')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

/**
 * Empty State
 */
export const EmptyStateComponent: React.FC<Omit<LoadingStateProps, 'type'>> = ({
  empty,
  sx,
  testID,
}) => {
  if (!empty) return null;

  return (
    <Box
      sx={{
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      data-testid={testID}
    >
      {empty.icon && <Box sx={{ mb: 2 }}>{empty.icon}</Box>}
      <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, textAlign: 'center', fontWeight: 600 }}>
        {empty.title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, textAlign: 'center', lineHeight: 1.5 }}>
        {empty.message}
      </Typography>
      {empty.action && (
        <Button
          variant="contained"
          color="primary"
          onClick={empty.action.onPress}
          data-testid={`${testID}-action`}
          sx={{ minWidth: 150 }}
        >
          {empty.action.label}
        </Button>
      )}
    </Box>
  );
};

/**
 * Overlay Loading State
 */
export const OverlayState: React.FC<Omit<LoadingStateProps, 'type'>> = ({
  visible = true,
  message,
  size = 'large',
  color = 'primary',
  testID,
}) => {
  if (!visible) return null;

  return (
    <Modal open={visible} data-testid={testID}>
      <OverlayBackdrop>
        <OverlayContent role="progressbar" aria-label={message || t('accessibility.loading')}>
          <CircularProgress size={size === 'small' ? 32 : size === 'large' ? 64 : 48} color={color} />
          {message && (
            <Typography sx={{ mt: 1.5, fontSize: 16, color: 'text.primary', textAlign: 'center' }}>
              {message}
            </Typography>
          )}
        </OverlayContent>
      </OverlayBackdrop>
    </Modal>
  );
};

/**
 * Main LoadingState Component (Factory)
 */
export const LoadingState: React.FC<LoadingStateProps> = (props) => {
  const { type, ...rest } = props;

  switch (type) {
    case 'spinner':
      return <SpinnerState {...rest} />;
    case 'skeleton':
      return <SkeletonState {...rest} />;
    case 'progress':
      return <ProgressState {...rest} />;
    case 'error':
      return <ErrorStateComponent {...rest} />;
    case 'empty':
      return <EmptyStateComponent {...rest} />;
    case 'overlay':
      return <OverlayState {...rest} />;
    default:
      return <SpinnerState {...rest} />;
  }
};

/**
 * Export components
 */
export default LoadingState;
