/**
 * Shared Loading Component
 * Full-screen loading overlay, inline spinner, and skeleton loaders
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
} from 'react-native';

/**
 * Loading type
 */
export type LoadingType = 'overlay' | 'inline' | 'skeleton';

/**
 * Loading props
 */
export interface LoadingProps {
  visible?: boolean;
  type?: LoadingType;
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Skeleton loader props
 */
export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Full-screen loading overlay
 */
export const LoadingOverlay: React.FC<Omit<LoadingProps, 'type'>> = ({
  visible = true,
  message,
  size = 'large',
  color = '#007AFF',
  testID,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" testID={testID}>
      <View style={styles.overlayContainer}>
        <View style={styles.overlayContent}>
          <ActivityIndicator size={size} color={color} />
          {message && <Text style={styles.overlayMessage}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};

/**
 * Inline loading spinner
 */
export const LoadingSpinner: React.FC<Omit<LoadingProps, 'type' | 'visible'>> = ({
  message,
  size = 'small',
  color = '#007AFF',
  style,
  testID,
}) => {
  return (
    <View style={[styles.inlineContainer, style]} testID={testID}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
};

/**
 * Skeleton loader with shimmer animation
 */
export const SkeletonLoader: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
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
    />
  );
};

/**
 * Skeleton card loader (common use case)
 */
export const SkeletonCard: React.FC = () => {
  return (
    <View style={styles.skeletonCard}>
      <SkeletonLoader width="60%" height={24} style={styles.skeletonTitle} />
      <SkeletonLoader width="100%" height={16} style={styles.skeletonLine} />
      <SkeletonLoader width="100%" height={16} style={styles.skeletonLine} />
      <SkeletonLoader width="80%" height={16} style={styles.skeletonLine} />
    </View>
  );
};

/**
 * Skeleton list loader (common use case)
 */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </>
  );
};

/**
 * Main Loading component (factory)
 */
export const Loading: React.FC<LoadingProps> = ({
  visible = true,
  type = 'inline',
  message,
  size = 'small',
  color = '#007AFF',
  style,
  testID,
}) => {
  switch (type) {
    case 'overlay':
      return (
        <LoadingOverlay
          visible={visible}
          message={message}
          size={size}
          color={color}
          testID={testID}
        />
      );
    case 'skeleton':
      return <SkeletonCard />;
    case 'inline':
    default:
      return (
        <LoadingSpinner
          message={message}
          size={size}
          color={color}
          style={style}
          testID={testID}
        />
      );
  }
};

/**
 * Styles
 */
const styles = StyleSheet.create({
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

  // Inline spinner styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  inlineMessage: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6C757D',
  },

  // Skeleton styles
  skeleton: {
    backgroundColor: '#E9ECEF',
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  skeletonTitle: {
    marginBottom: 12,
  },
  skeletonLine: {
    marginBottom: 8,
  },
});

/**
 * Export components
 */
export default Loading;
