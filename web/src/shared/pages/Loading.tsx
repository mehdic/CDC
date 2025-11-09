import React from 'react';
import {
  Box,
  CircularProgress,
  Skeleton,
  Typography,
  styled,
} from '@mui/material';

/**
 * Loading component variants
 */
export type LoadingVariant = 'fullscreen' | 'inline' | 'skeleton';

/**
 * Loading component props
 */
export interface LoadingProps {
  variant?: LoadingVariant;
  message?: string;
  skeletonCount?: number;
  height?: number | string;
}

/**
 * Styled components
 */
const FullScreenContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  gap: theme.spacing(2),
}));

const InlineContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  gap: theme.spacing(2),
}));

/**
 * Loading component
 * Provides full-screen loading, inline spinner, and skeleton loaders
 */
export const Loading: React.FC<LoadingProps> = ({
  variant = 'fullscreen',
  message = 'Chargement...',
  skeletonCount = 5,
  height = 60,
}) => {
  // Full-screen loading indicator
  if (variant === 'fullscreen') {
    return (
      <FullScreenContainer>
        <CircularProgress size={60} thickness={4} />
        {message && (
          <Typography variant="h6" color="textSecondary">
            {message}
          </Typography>
        )}
      </FullScreenContainer>
    );
  }

  // Inline loading spinner
  if (variant === 'inline') {
    return (
      <InlineContainer>
        <CircularProgress size={40} />
        {message && (
          <Typography variant="body1" color="textSecondary">
            {message}
          </Typography>
        )}
      </InlineContainer>
    );
  }

  // Skeleton loaders for lists/cards
  if (variant === 'skeleton') {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={height}
            sx={{ mb: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  return null;
};

/**
 * Full-screen loading component
 */
export const FullScreenLoading: React.FC<{ message?: string }> = ({
  message,
}) => <Loading variant="fullscreen" message={message} />;

/**
 * Inline loading spinner component
 */
export const InlineLoading: React.FC<{ message?: string }> = ({ message }) => (
  <Loading variant="inline" message={message} />
);

/**
 * Skeleton loader component
 */
export const SkeletonLoader: React.FC<{
  count?: number;
  height?: number | string;
}> = ({ count, height }) => (
  <Loading variant="skeleton" skeletonCount={count} height={height} />
);

export default Loading;
