/**
 * Loading States Component
 * Provides skeleton loaders and shimmer effects for delivery lists and data loading
 * MetaPharm Connect - Delivery App
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';

/**
 * Shimmer Effect Component
 * Creates a shimmer animation overlay for skeleton loaders
 */
const ShimmerOverlay: React.FC<{ width?: number; height?: number; style?: ViewStyle }> = ({
  width = '100%',
  height = 16,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-1000, 1000],
  });

  return (
    <View style={[styles.skeletonContainer, { width, height }, style]}>
      <View style={styles.skeletonBase} />
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      />
    </View>
  );
};

/**
 * Skeleton Loader for Delivery Card
 * Mimics the structure of a DeliveryRequest card during loading
 */
export const DeliveryCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ShimmerOverlay width="60%" height={20} />
        <ShimmerOverlay width="20%" height={20} />
      </View>
      <ShimmerOverlay width="80%" height={16} style={{ marginVertical: 12 }} />
      <View style={styles.cardFooter}>
        <ShimmerOverlay width="15%" height={14} />
        <ShimmerOverlay width="15%" height={14} />
        <ShimmerOverlay width="20%" height={14} style={{ marginLeft: 'auto' }} />
      </View>
      <ShimmerOverlay width="70%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
};

/**
 * Skeleton List Loader
 * Shows multiple skeleton cards to simulate list loading
 */
export const DeliveryListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <ShimmerOverlay width="45%" height={36} style={{ marginRight: 8 }} />
        <ShimmerOverlay width="45%" height={36} />
      </View>
      <ShimmerOverlay width="100%" height={40} style={styles.searchInput} />
      <FlatList
        data={skeletons}
        renderItem={() => <DeliveryCardSkeleton />}
        keyExtractor={(item) => item.toString()}
        scrollEnabled={false}
      />
    </View>
  );
};

/**
 * Progressive Loading Component
 * Shows initial skeleton, then reveals content as data loads
 */
export interface ProgressiveLoadingProps {
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  skeletonCount?: number;
  onRetry?: () => void;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  isLoading,
  error,
  children,
  skeletonCount = 3,
  onRetry,
}) => {
  if (isLoading) {
    return <DeliveryListSkeleton count={skeletonCount} />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        {onRetry && (
          <View style={styles.retryButton}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </View>
        )}
      </View>
    );
  }

  return <>{children}</>;
};

/**
 * Slow Network Indicator
 * Shows when network speed is slow (> 3 seconds for request)
 */
export const SlowNetworkIndicator: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.slowNetworkBanner}>
      <Text style={styles.slowNetworkText}>Slow network detected. Loading data...</Text>
      <ActivityIndicator size="small" color="#FFF" />
    </View>
  );
};

/**
 * Minimal Loading Spinner
 * Simple centered spinner for modal or overlay scenarios
 */
export const LoadingSpinner: React.FC<{ message?: string; size?: 'small' | 'large' }> = ({
  message,
  size = 'large',
}) => {
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color="#007AFF" />
      {message && <Text style={styles.spinnerText}>{message}</Text>}
    </View>
  );
};

/**
 * Inline Loading State
 * Shows loading indicator within a section of the UI
 */
export const InlineLoading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <View style={styles.inlineLoadingContainer}>
      <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 8 }} />
      <Text style={styles.inlineLoadingText}>{message}</Text>
    </View>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filterBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
  },
  searchInput: {
    margin: 16,
    marginTop: 0,
  },
  card: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonContainer: {
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
  },
  skeletonBase: {
    flex: 1,
    backgroundColor: '#E8E8E8',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    opacity: 0.3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F5F5F5',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC3545',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  slowNetworkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  slowNetworkText: {
    flex: 1,
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  spinnerText: {
    marginTop: 12,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  inlineLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  inlineLoadingText: {
    fontSize: 14,
    color: '#666',
  },
});

export default {
  DeliveryCardSkeleton,
  DeliveryListSkeleton,
  ProgressiveLoading,
  SlowNetworkIndicator,
  LoadingSpinner,
  InlineLoading,
};
