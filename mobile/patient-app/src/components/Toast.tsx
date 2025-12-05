import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * T2-051: Success Notifications
 * Toast/Snackbar component with auto-dismiss and accessibility
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  type: ToastType;
  message: string;
  description?: string;
  duration?: number; // ms, 0 = no auto-dismiss
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface Toast extends ToastConfig {
  id: string;
}

export class ToastManager {
  private toasts: Toast[] = [];
  private listeners: Set<(toasts: Toast[]) => void> = new Set();
  private nextId = 0;

  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  show(config: ToastConfig): string {
    const id = String(this.nextId++);
    const toast: Toast = {
      ...config,
      id,
      duration: config.duration ?? 3000,
    };

    this.toasts.push(toast);
    this.notifyListeners();

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.hide(id), toast.duration);
    }

    return id;
  }

  hide(id: string): void {
    const index = this.toasts.findIndex((t) => t.id === id);
    if (index > -1) {
      this.toasts.splice(index, 1);
      this.notifyListeners();
    }
  }

  success(message: string, description?: string): string {
    return this.show({ type: 'success', message, description });
  }

  error(message: string, description?: string): string {
    return this.show({ type: 'error', message, description });
  }

  warning(message: string, description?: string): string {
    return this.show({ type: 'warning', message, description });
  }

  info(message: string, description?: string): string {
    return this.show({ type: 'info', message, description });
  }

  clear(): void {
    this.toasts = [];
    this.notifyListeners();
  }
}

export const toastManager = new ToastManager();

/**
 * Single toast component
 */
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      default:
        return '#323232';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      case 'info':
        return 'information';
      default:
        return 'message';
    }
  };

  const slideStyle = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [100, 0],
        }),
      },
    ],
  };

  const accessibilityLabel = `${toast.type}: ${toast.message}${
    toast.description ? ', ' + toast.description : ''
  }`;

  return (
    <Animated.View
      style={[styles.toastContainer, slideStyle]}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="alert"
    >
      <View
        style={[
          styles.toastContent,
          { backgroundColor: getBackgroundColor() },
        ]}
      >
        <MaterialCommunityIcons
          name={getIcon()}
          size={20}
          color="#fff"
          style={styles.toastIcon}
        />
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastMessage}>{toast.message}</Text>
          {toast.description && (
            <Text style={styles.toastDescription}>{toast.description}</Text>
          )}
        </View>
        {toast.action && (
          <TouchableOpacity
            onPress={() => {
              toast.action?.onPress();
              onDismiss(toast.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={toast.action.label}
          >
            <Text style={styles.toastAction}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => onDismiss(toast.id)}
          style={styles.toastCloseButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
        >
          <MaterialCommunityIcons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

/**
 * Toast container - manages multiple toasts
 */
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const handleDismiss = (id: string) => {
    toastManager.hide(id);
  };

  return (
    <View
      style={styles.toastStackContainer}
      pointerEvents="box-none"
      accessible={false}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </View>
  );
};

/**
 * Hook for using toast notifications
 */
export function useToast() {
  return {
    success: (message: string, description?: string) =>
      toastManager.success(message, description),
    error: (message: string, description?: string) =>
      toastManager.error(message, description),
    warning: (message: string, description?: string) =>
      toastManager.warning(message, description),
    info: (message: string, description?: string) =>
      toastManager.info(message, description),
    show: (config: ToastConfig) => toastManager.show(config),
    hide: (id: string) => toastManager.hide(id),
    clear: () => toastManager.clear(),
  };
}

const styles = StyleSheet.create({
  toastStackContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  toastContainer: {
    marginBottom: 12,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  toastTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  toastMessage: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  toastDescription: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 4,
  },
  toastAction: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
    textDecorationLine: 'underline',
  },
  toastCloseButton: {
    padding: 4,
  },
});
