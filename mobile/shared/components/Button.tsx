/**
 * Shared Button Component
 * Reusable button with multiple variants, loading states, and icon support
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';

/**
 * Button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success';

/**
 * Button size
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Button props
 */
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

/**
 * Color schemes for button variants
 */
const VARIANT_COLORS = {
  primary: {
    background: '#007AFF',
    text: '#FFFFFF',
    border: '#007AFF',
  },
  secondary: {
    background: '#6C757D',
    text: '#FFFFFF',
    border: '#6C757D',
  },
  outline: {
    background: 'transparent',
    text: '#007AFF',
    border: '#007AFF',
  },
  danger: {
    background: '#DC3545',
    text: '#FFFFFF',
    border: '#DC3545',
  },
  success: {
    background: '#28A745',
    text: '#FFFFFF',
    border: '#28A745',
  },
};

/**
 * Disabled colors
 */
const DISABLED_COLORS = {
  background: '#E9ECEF',
  text: '#6C757D',
  border: '#DEE2E6',
};

/**
 * Size configurations
 */
const SIZE_CONFIG = {
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    height: 36,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    fontSize: 16,
    height: 44,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    fontSize: 18,
    height: 52,
  },
};

/**
 * Button Component
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  testID,
}) => {
  const isDisabled = disabled || loading;

  // Get color scheme
  const colors = isDisabled ? DISABLED_COLORS : VARIANT_COLORS[variant];
  const sizeConfig = SIZE_CONFIG[size];

  // Button container style
  const containerStyle: ViewStyle = {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: variant === 'outline' ? 1 : 0,
    paddingVertical: sizeConfig.paddingVertical,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: sizeConfig.height,
    opacity: isDisabled ? 0.6 : 1,
    ...(fullWidth && { width: '100%' }),
  };

  // Text style
  const textStyleComputed: TextStyle = {
    color: colors.text,
    fontSize: sizeConfig.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  };

  // Render content (text + icon + loading indicator)
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.contentContainer}>
          <ActivityIndicator
            size="small"
            color={colors.text}
            style={styles.loadingIndicator}
          />
          <Text style={[textStyleComputed, textStyle]}>{title}</Text>
        </View>
      );
    }

    if (icon) {
      return (
        <View style={styles.contentContainer}>
          {iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[textStyleComputed, textStyle]}>{title}</Text>
          {iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      );
    }

    return <Text style={[textStyleComputed, textStyle]}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={testID}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

/**
 * Export component
 */
export default Button;
