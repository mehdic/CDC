import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';

/**
 * T2-049: Loading States Implementation
 * Provides skeleton screens and loading indicators for async operations
 */

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

interface SkeletonTextProps extends LoadingSkeletonProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
}

interface FullScreenLoaderProps {
  message?: string;
  color?: string;
}

interface PrescriptionSkeletonProps {
  count?: number;
}

/**
 * Basic skeleton loader - animated placeholder
 */
export const SkeletonLoader: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

/**
 * Multiple lines of skeleton text
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 12,
  spacing = 8,
  width = '100%',
  style,
}) => {
  return (
    <View style={[{ width }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={{ marginBottom: i < lines - 1 ? spacing : 0 }}>
          <SkeletonLoader height={lineHeight} width="100%" />
        </View>
      ))}
    </View>
  );
};

/**
 * Prescription card skeleton - mimics prescription list item
 */
export const PrescriptionSkeleton: React.FC<PrescriptionSkeletonProps> = ({
  count = 1,
}) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.prescriptionCard}>
          <View style={styles.prescriptionHeader}>
            <SkeletonLoader width="60%" height={16} />
            <SkeletonLoader width="25%" height={14} borderRadius={12} />
          </View>
          <View style={styles.prescriptionContent}>
            <SkeletonText lines={2} lineHeight={12} spacing={6} width="100%" />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Consultation card skeleton
 */
export const ConsultationSkeleton: React.FC<{ count?: number }> = ({
  count = 1,
}) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.consultationCard}>
          <View style={styles.consultationHeader}>
            <SkeletonLoader width="50%" height={16} />
            <SkeletonLoader width="30%" height={14} borderRadius={20} />
          </View>
          <SkeletonText lines={1} lineHeight={12} spacing={6} width="80%" />
          <View style={styles.consultationFooter}>
            <SkeletonLoader width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Full screen loading overlay
 */
export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message = 'Loading...',
  color = '#00897b',
}) => {
  return (
    <View style={styles.fullScreenContainer}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={color} />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );
};

/**
 * Progress indicator with percentage
 */
interface ProgressIndicatorProps {
  progress: number; // 0-1
  label?: string;
  color?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  label,
  color = '#00897b',
}) => {
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.progressContainer}>
      {label && <Text style={styles.progressLabel}>{label}</Text>}
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.progressPercentage}>{percentage}%</Text>
    </View>
  );
};

/**
 * Inline loading indicator (spinner for buttons, etc.)
 */
interface InlineLoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  size = 'small',
  color = '#00897b',
  message,
}) => {
  const sizeMap = {
    small: 20,
    medium: 30,
    large: 40,
  };

  return (
    <View style={styles.inlineLoaderContainer}>
      <ActivityIndicator size={sizeMap[size]} color={color} />
      {message && <Text style={styles.inlineLoaderText}>{message}</Text>}
    </View>
  );
};

/**
 * Shimmer effect loader (animated gradient background)
 */
export const ShimmerLoader: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  return (
    <View
      style={[
        styles.shimmerLoader,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  shimmerLoader: {
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  prescriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00897b',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  prescriptionContent: {
    marginTop: 8,
  },
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderTopWidth: 4,
    borderTopColor: '#1976d2',
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  consultationFooter: {
    marginTop: 12,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  inlineLoaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLoaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});
