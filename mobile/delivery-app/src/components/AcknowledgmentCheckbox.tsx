/**
 * AcknowledgmentCheckbox Component
 * Checkbox with timestamp tracking for alert acknowledgments
 * Records when a user acknowledges special handling requirements
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

export interface AcknowledgmentCheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheck: (checked: boolean, timestamp: string) => void;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

/**
 * Format timestamp to readable format
 */
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return 'Invalid time';
  }
};

/**
 * AcknowledgmentCheckbox Component
 * Displays checkbox with label and optional description
 * Automatically records timestamp when checked
 */
export const AcknowledgmentCheckbox: React.FC<AcknowledgmentCheckboxProps> = ({
  label,
  description,
  checked,
  onCheck,
  disabled = false,
  testID = 'acknowledgment-checkbox',
  accessibilityLabel,
}) => {
  const [checkTime, setCheckTime] = useState<string | null>(null);

  const handlePress = () => {
    if (disabled) {return;}

    if (!checked) {
      // When checking, record the current timestamp
      const timestamp = new Date().toISOString();
      setCheckTime(timestamp);
      onCheck(true, timestamp);
    } else {
      // When unchecking
      setCheckTime(null);
      onCheck(false, new Date().toISOString());
    }
  };

  const containerStyle: ViewStyle = {
    opacity: disabled ? 0.5 : 1,
  };

  const checkboxStyle: ViewStyle = {
    backgroundColor: checked ? '#007AFF' : '#FFF',
    borderColor: checked ? '#007AFF' : '#CCCCCC',
  };

  const checkmarkStyle: TextStyle = {
    color: checked ? '#FFF' : 'transparent',
  };

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
      accessible={true}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={
        accessibilityLabel ||
        `${label}. ${checked ? 'Checked' : 'Unchecked'}${description ? '. ' + description : ''}`
      }
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View
        style={[styles.checkbox, checkboxStyle]}
        testID={`${testID}-box`}
      >
        <Text
          style={[styles.checkmark, checkmarkStyle]}
          testID={`${testID}-checkmark`}
        >
          ✓
        </Text>
      </View>

      <View style={styles.labelContainer}>
        <Text
          style={styles.label}
          testID={`${testID}-label`}
        >
          {label}
        </Text>
        {description && (
          <Text
            style={styles.description}
            testID={`${testID}-description`}
          >
            {description}
          </Text>
        )}
        {checked && checkTime && (
          <Text
            style={styles.timestamp}
            testID={`${testID}-timestamp`}
            accessibilityLabel={`Acknowledged at ${formatTimestamp(checkTime)}`}
          >
            Acknowledged at {formatTimestamp(checkTime)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    marginVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default AcknowledgmentCheckbox;
