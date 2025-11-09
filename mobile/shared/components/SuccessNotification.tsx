/**
 * SuccessNotification Component (T272)
 * Success notifications with auto-dismiss and accessibility support
 * Variants: success, info, warning
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { t } from '../utils/i18n';

/**
 * Notification variant
 */
export type NotificationVariant = 'success' | 'info' | 'warning';

/**
 * Notification position (mobile: bottom is better for reachability)
 */
export type NotificationPosition = 'top' | 'bottom';

/**
 * SuccessNotification props
 */
export interface SuccessNotificationProps {
  visible: boolean;
  message: string;
  variant?: NotificationVariant;
  position?: NotificationPosition;
  duration?: number; // Auto-dismiss duration in ms (default: 3000)
  onDismiss?: () => void;
  showCloseButton?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Variant colors
 */
const VARIANT_COLORS = {
  success: {
    background: '#28A745',
    text: '#FFFFFF',
    border: '#1E7E34',
  },
  info: {
    background: '#007AFF',
    text: '#FFFFFF',
    border: '#0056B3',
  },
  warning: {
    background: '#FFC107',
    text: '#212529',
    border: '#E0A800',
  },
};

/**
 * SuccessNotification Component
 */
export const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  visible,
  message,
  variant = 'success',
  position = 'bottom',
  duration = 3000,
  onDismiss,
  showCloseButton = true,
  icon,
  style,
  testID,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const colors = VARIANT_COLORS[variant];

  // Accessibility label
  const accessibilityLabel = `${t(`accessibility.${variant}`)}. ${message}`;

  // Slide in/out animation
  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();

      // Auto-dismiss
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, duration);
      }
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    // Cleanup timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);

  const handleDismiss = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!visible && slideAnim._value === 0) {
    return null;
  }

  // Calculate slide animation based on position
  const slideTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: position === 'top' ? [-100, 0] : [100, 0],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.positionTop : styles.positionBottom,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          transform: [{ translateY: slideTranslate }],
          opacity,
        },
        style,
      ]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={3}>
          {message}
        </Text>
      </View>

      {showCloseButton && (
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.closeButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          accessibilityRole="button"
          accessibilityLabel={t('accessibility.closeButton')}
          testID={`${testID}-close`}
        >
          <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

/**
 * Notification Manager (for managing multiple notifications)
 */
export interface NotificationItem {
  id: string;
  message: string;
  variant?: NotificationVariant;
  duration?: number;
}

interface NotificationManagerProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  position?: NotificationPosition;
  testID?: string;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  notifications,
  onDismiss,
  position = 'bottom',
  testID,
}) => {
  return (
    <View style={styles.managerContainer} pointerEvents="box-none">
      {notifications.map((notification, index) => (
        <SuccessNotification
          key={notification.id}
          visible={true}
          message={notification.message}
          variant={notification.variant}
          duration={notification.duration}
          position={position}
          onDismiss={() => onDismiss(notification.id)}
          style={[
            position === 'top'
              ? { top: 16 + index * 80 }
              : { bottom: 16 + index * 80 },
          ]}
          testID={`${testID}-${notification.id}`}
        />
      ))}
    </View>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  positionTop: {
    top: 16,
  },
  positionBottom: {
    bottom: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  managerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});

/**
 * Export component
 */
export default SuccessNotification;
