import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * T2-052: Real-time Form Validation with Feedback
 * Validates form fields with inline error/success indicators
 */

export interface FormFieldValidator {
  validate: (value: string) => string | null;
  message?: string;
}

export interface FormFieldProps extends TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  validators?: FormFieldValidator[];
  error?: string;
  success?: boolean;
  showValidation?: boolean;
  helperText?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  testID?: string;
}

/**
 * Form field component with real-time validation
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  validators = [],
  error: externalError,
  success: externalSuccess,
  showValidation = true,
  helperText,
  icon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  testID,
  accessibilityLabel,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);
  const [error, setError] = useState<string | null>(externalError ?? null);
  const [touched, setTouched] = useState(false);

  // Real-time validation
  const validateField = useCallback(
    (text: string) => {
      let validationError: string | null = null;

      for (const validator of validators) {
        const result = validator.validate(text);
        if (result) {
          validationError = result;
          break;
        }
      }

      setError(validationError);
      return validationError === null;
    },
    [validators],
  );

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (touched && showValidation) {
      validateField(text);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTouched(true);
    if (showValidation) {
      validateField(value);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const isValid = error === null && value.length > 0;
  const showError = error && touched && showValidation;
  const showSuccess =
    externalSuccess !== undefined
      ? externalSuccess && touched && value.length > 0
      : isValid && touched && value.length > 0;

  const borderColor = showError
    ? '#f44336'
    : isFocused
      ? '#00897b'
      : showSuccess
        ? '#4caf50'
        : '#e0e0e0';

  const a11yLabel = `${label || 'Input field'}${
    error && touched ? ', error: ' + error : ''
  }`;

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            !!error && touched ? styles.labelError : undefined,
            showSuccess ? styles.labelSuccess : undefined,
          ]}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor: isFocused ? '#f5f5f5' : '#fff',
          },
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={isFocused ? '#00897b' : '#999'}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : undefined]}
          value={value}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          onFocus={handleFocus}
          secureTextEntry={!showPassword}
          accessibilityLabel={accessibilityLabel || a11yLabel}
          accessible
          testID={testID}
          {...textInputProps}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconButton}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        )}

        {!isPassword && rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name={rightIcon} size={20} color="#999" />
          </TouchableOpacity>
        )}

        {showSuccess && !isPassword && !rightIcon && (
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color="#4caf50"
            style={styles.rightIcon}
          />
        )}

        {showError && (
          <MaterialCommunityIcons
            name="alert-circle"
            size={20}
            color="#f44336"
            style={styles.rightIcon}
          />
        )}
      </View>

      {showError && (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessible
        >
          {error}
        </Text>
      )}

      {showSuccess && !error && (
        <Text
          style={styles.successText}
          accessible
          accessibilityLabel="Validation successful"
        >
          Looks good!
        </Text>
      )}

      {helperText && !showError && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};

/**
 * Common validators
 */
export const Validators = {
  required: (fieldName: string = 'This field'): FormFieldValidator => ({
    validate: (value) => (!value ? `${fieldName} is required` : null),
  }),

  email: (): FormFieldValidator => ({
    validate: (value) => {
      if (!value) {return null;}
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : 'Please enter a valid email';
    },
  }),

  phone: (): FormFieldValidator => ({
    validate: (value) => {
      if (!value) {return null;}
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      return phoneRegex.test(value)
        ? null
        : 'Please enter a valid phone number';
    },
  }),

  minLength: (length: number): FormFieldValidator => ({
    validate: (value) =>
      value.length < length
        ? `Must be at least ${length} characters`
        : null,
  }),

  maxLength: (length: number): FormFieldValidator => ({
    validate: (value) =>
      value.length > length ? `Must not exceed ${length} characters` : null,
  }),

  pattern: (
    regex: RegExp,
    message: string = 'Invalid format',
  ): FormFieldValidator => ({
    validate: (value) => (!value ? null : regex.test(value) ? null : message),
  }),

  passwordStrength: (): FormFieldValidator => ({
    validate: (value) => {
      if (!value) {return null;}
      if (value.length < 8) {return 'Password must be at least 8 characters';}
      if (!/[A-Z]/.test(value))
        {return 'Password must contain an uppercase letter';}
      if (!/[a-z]/.test(value))
        {return 'Password must contain a lowercase letter';}
      if (!/[0-9]/.test(value)) {return 'Password must contain a number';}
      if (!/[!@#$%^&*]/.test(value))
        {return 'Password must contain a special character';}
      return null;
    },
  }),

  match: (
    otherValue: string,
    fieldName: string = 'Fields',
  ): FormFieldValidator => ({
    validate: (value) =>
      value === otherValue ? null : `${fieldName} do not match`,
  }),
};

/**
 * Form group component - manages multiple fields
 */
interface FormGroupProps {
  children: React.ReactNode;
  spacing?: number;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  spacing = 16,
}) => {
  return (
    <View style={{ gap: spacing }}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  labelError: {
    color: '#f44336',
  },
  labelSuccess: {
    color: '#4caf50',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  inputWithIcon: {
    paddingLeft: 4,
  },
  rightIcon: {
    marginLeft: 8,
  },
  rightIconButton: {
    padding: 6,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
  },
  successText: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
