/**
 * LoadingState Component (T270)
 * Enhanced loading states for all async operations
 * Supports spinner, skeleton, progress bar, empty state, error state
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  Modal,
  StyleSheet,
  ViewStyle,
  Animated,
  Image,
} from 'react-native';
import { t } from '../utils/i18n';
import { Button } from './Button';

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
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  testID?: string;
  // For error state
  error?: ErrorState;
  // For empty state
  empty?: EmptyState;
  // Accessibility
  accessibilityLabel?: string;
}

/**
 * Spinner Loading State
 */
export const SpinnerState: React.FC<Omit<LoadingStateProps, 'type'>> = ({
  message,
  size = 'small',
  color = '#007AFF',
  style,
  testID,
  accessibilityLabel,
}) => {
  return (
    <View
      style={[styles.spinnerContainer, style]}
      testID={testID}
      accessibilityLabel={accessibilityLabel || t('accessibility.loading')}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.spinnerMessage}>{message}</Text>}
    </View>
  );
};

/**
 * Skeleton Loader
 */
export const SkeletonState: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}> = ({ width = '100%', height = 20, borderRadius = 4, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
      accessibilityLabel={t('accessibility.loading')}
    />
  );
};

/**
 * Progress Bar Loading State
 */
export const ProgressState: React.FC<Omit<LoadingStateProps, 'type'>> = ({
  progress = 0,
  message,
  color = '#007AFF',
  style,
  testID,
  accessibilityLabel,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View
      style={[styles.progressContainer, style]}
      testID={testID}
      accessibilityLabel={accessibilityLabel || `${t('common.loading')} ${clampedProgress}%`}
      accessibilityRole="progressbar"
    >
      {message && <Text style={styles.progressMessage}>{message}</Text>}
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{clampedProgress}%</Text>
    </View>
  );
};

/**
 * Error State
 */
export const ErrorState: React.FC<Omit<LoadingStateProps, 'type'>> = ({
  error,
  style,
  testID,
  accessibilityLabel,
}) => {
  if (!error) return null;

  return (
    <View
      style={[styles.errorContainer, style]}
      testID={testID}
      accessibilityLabel={accessibilityLabel || t('accessibility.error')}
      accessibilityRole="alert"
    >
      <Text style={styles.errorTitle}>{error.title}</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <View style={styles.errorActions}>
        {error.retryable && error.onRetry && (
          <Button
            title={t('common.retry')}
            onPress={error.onRetry}
            variant="primary"
            size="medium"
            style={styles.errorButton}
            testID={`${testID}-retry`}
          />
        )}
        {error.contactSupport && (
          <Button
            title={t('common.contactSupport')}
            onPress={() => {
              // TODO: Implement support contact
            }}
            variant="outline"
            size="medium"
            style={styles.errorButton}
            testID={`${testID}-support`}
          />
        )}
      </View>
    </View>
  );
};

/**
 * Empty State
 */
export const EmptyStateComponent: React.FC<Omit<LoadingStateProps, 'type'>> = ({
  empty,
  style,
  testID,
}) => {
  if (!empty) return null;

  return (
    <View style={[styles.emptyContainer, style]} testID={testID}>
      {empty.icon && <View style={styles.emptyIcon}>{empty.icon}</View>}
      <Text style={styles.emptyTitle}>{empty.title}</Text>
      <Text style={styles.emptyMessage}>{empty.message}</Text>
      {empty.action && (
        <Button
          title={empty.action.label}
          onPress={empty.action.onPress}
          variant="primary"
          size="medium"
          style={styles.emptyButton}
          testID={`${testID}-action`}
        />
      )}
    </View>
  );
};

/**
 * Overlay Loading State
 */
export const OverlayState: React.FC<Omit<LoadingStateProps, 'type'>> = ({
  visible = true,
  message,
  size = 'large',
  color = '#007AFF',
  testID,
  accessibilityLabel,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" testID={testID}>
      <View style={styles.overlayContainer}>
        <View
          style={styles.overlayContent}
          accessibilityLabel={accessibilityLabel || t('accessibility.loading')}
          accessibilityRole="progressbar"
        >
          <ActivityIndicator size={size} color={color} />
          {message && <Text style={styles.overlayMessage}>{message}</Text>}
        </View>
      </View>
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
      return <ErrorState {...rest} />;
    case 'empty':
      return <EmptyStateComponent {...rest} />;
    case 'overlay':
      return <OverlayState {...rest} />;
    default:
      return <SpinnerState {...rest} />;
  }
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  // Spinner styles
  spinnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  spinnerMessage: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6C757D',
  },

  // Skeleton styles
  skeleton: {
    backgroundColor: '#E9ECEF',
  },

  // Progress bar styles
  progressContainer: {
    padding: 16,
    alignItems: 'center',
  },
  progressMessage: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '600',
  },

  // Error state styles
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC3545',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  errorButton: {
    minWidth: 120,
  },

  // Empty state styles
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 150,
  },

  // Overlay styles
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 150,
  },
  overlayMessage: {
    marginTop: 12,
    fontSize: 16,
    color: '#212529',
    textAlign: 'center',
  },
});

/**
 * Export components
 */
export default LoadingState;
