/**
 * Shared Input Component
 * Reusable text input with validation, password visibility toggle, and error messages
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';

/**
 * Input type
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'phone';

/**
 * Input props
 */
export interface InputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  type?: InputType;
  error?: string;
  touched?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  testID?: string;
}

/**
 * Get keyboard type based on input type
 */
const getKeyboardType = (type: InputType): TextInputProps['keyboardType'] => {
  switch (type) {
    case 'email':
      return 'email-address';
    case 'number':
      return 'numeric';
    case 'phone':
      return 'phone-pad';
    default:
      return 'default';
  }
};

/**
 * Get auto-capitalize setting based on input type
 */
const getAutoCapitalize = (type: InputType): TextInputProps['autoCapitalize'] => {
  switch (type) {
    case 'email':
      return 'none';
    case 'password':
      return 'none';
    default:
      return 'sentences';
  }
};

/**
 * Input Component
 */
export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  error,
  touched = false,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  showPasswordToggle = true,
  testID,
  ...textInputProps
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Determine if input is password type
  const isPassword = type === 'password';
  const secureTextEntry = isPassword && !isPasswordVisible;

  // Show error if touched and error exists
  const showError = touched && Boolean(error);

  // Input container border color
  const borderColor = showError ? '#DC3545' : '#DEE2E6';

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, labelStyle]} testID={`${testID}-label`}>
          {label}
        </Text>
      )}

      {/* Input container */}
      <View style={[styles.inputContainer, { borderColor }]}>
        {/* Left icon */}
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        {/* Text input */}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            (rightIcon || isPassword) ? styles.inputWithRightIcon : null,
            inputStyle,
          ]}
          secureTextEntry={secureTextEntry}
          keyboardType={getKeyboardType(type)}
          autoCapitalize={getAutoCapitalize(type)}
          autoCorrect={type !== 'email' && type !== 'password'}
          placeholderTextColor="#6C757D"
          testID={testID}
          {...textInputProps}
        />

        {/* Right icon or password toggle */}
        {isPassword && showPasswordToggle ? (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={togglePasswordVisibility}
            testID={`${testID}-password-toggle`}
          >
            <Text style={styles.passwordToggleText}>
              {isPasswordVisible ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        ) : null}
      </View>

      {/* Error message */}
      {showError && (
        <Text style={[styles.errorText, errorStyle]} testID={`${testID}-error`}>
          {error}
        </Text>
      )}
    </View>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordToggleText: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#DC3545',
    marginTop: 4,
  },
});

/**
 * Export component
 */
export default Input;
