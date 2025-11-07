/**
 * T125: Dosage Picker Component
 * Pick medication dosage with form, strength, frequency, and duration
 *
 * Features:
 * - Form selection (tablet, capsule, liquid, etc.)
 * - Strength input (mg, ml, etc.)
 * - Frequency picker (once daily, twice daily, etc.)
 * - Duration input (days, weeks)
 * - Quantity calculation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { DosagePickerState, PrescriptionItem } from '../types';
import { theme } from '../App';

interface DosagePickerProps {
  medicationName: string;
  onUpdate: (item: Partial<PrescriptionItem>) => void;
  initialValues?: Partial<DosagePickerState>;
}

// Common medication forms
const MEDICATION_FORMS = [
  'tablet',
  'capsule',
  'liquid',
  'injection',
  'cream',
  'ointment',
  'inhaler',
  'drops',
  'patch',
];

// Common frequencies
const FREQUENCIES = [
  { label: 'Once daily', value: 'once daily' },
  { label: 'Twice daily', value: 'twice daily' },
  { label: 'Three times daily', value: 'three times daily' },
  { label: 'Every 4 hours', value: 'every 4 hours' },
  { label: 'Every 6 hours', value: 'every 6 hours' },
  { label: 'Every 8 hours', value: 'every 8 hours' },
  { label: 'Every 12 hours', value: 'every 12 hours' },
  { label: 'As needed', value: 'as needed' },
  { label: 'At bedtime', value: 'at bedtime' },
  { label: 'Before meals', value: 'before meals' },
  { label: 'After meals', value: 'after meals' },
];

// Common durations
const DURATIONS = [
  { label: '3 days', value: '3 days' },
  { label: '5 days', value: '5 days' },
  { label: '7 days', value: '7 days' },
  { label: '10 days', value: '10 days' },
  { label: '14 days', value: '14 days' },
  { label: '21 days', value: '21 days' },
  { label: '30 days', value: '30 days' },
  { label: 'Ongoing', value: 'ongoing' },
];

const DosagePicker: React.FC<DosagePickerProps> = ({
  medicationName,
  onUpdate,
  initialValues,
}) => {
  const [form, setForm] = useState(initialValues?.form || 'tablet');
  const [strength, setStrength] = useState(initialValues?.strength || '');
  const [frequency, setFrequency] = useState(initialValues?.frequency || '');
  const [duration, setDuration] = useState(initialValues?.duration || '');
  const [quantity, setQuantity] = useState<string>('');
  const [customFrequency, setCustomFrequency] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [showCustomFrequency, setShowCustomFrequency] = useState(false);
  const [showCustomDuration, setShowCustomDuration] = useState(false);

  // Update parent component when values change
  useEffect(() => {
    if (strength && (frequency || customFrequency) && (duration || customDuration)) {
      const finalFrequency = frequency === 'custom' ? customFrequency : frequency;
      const finalDuration = duration === 'custom' ? customDuration : duration;

      onUpdate({
        medication_name: medicationName,
        dosage: `${strength} (${form})`,
        frequency: finalFrequency,
        duration: finalDuration,
        quantity: quantity ? parseInt(quantity, 10) : undefined,
        form,
      });
    }
  }, [form, strength, frequency, duration, quantity, customFrequency, customDuration, medicationName]);

  const handleFormSelect = (selectedForm: string) => {
    setForm(selectedForm);
  };

  const handleFrequencySelect = (value: string) => {
    if (value === 'custom') {
      setShowCustomFrequency(true);
      setFrequency('custom');
    } else {
      setShowCustomFrequency(false);
      setFrequency(value);
    }
  };

  const handleDurationSelect = (value: string) => {
    if (value === 'custom') {
      setShowCustomDuration(true);
      setDuration('custom');
    } else {
      setShowCustomDuration(false);
      setDuration(value);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Dosage Details</Text>

      {/* Form Selection */}
      <Text style={styles.label}>Form *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formScroll}>
        {MEDICATION_FORMS.map((formOption) => (
          <TouchableOpacity
            key={formOption}
            style={[
              styles.formButton,
              form === formOption && styles.formButtonActive,
            ]}
            onPress={() => handleFormSelect(formOption)}
          >
            <Text
              style={[
                styles.formButtonText,
                form === formOption && styles.formButtonTextActive,
              ]}
            >
              {formOption}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Strength Input */}
      <Text style={styles.label}>Strength *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 500mg, 10ml, 5%"
        value={strength}
        onChangeText={setStrength}
        autoCapitalize="none"
      />

      {/* Frequency Selection */}
      <Text style={styles.label}>Frequency *</Text>
      <View style={styles.optionsGrid}>
        {FREQUENCIES.map((freq) => (
          <TouchableOpacity
            key={freq.value}
            style={[
              styles.optionButton,
              frequency === freq.value && styles.optionButtonActive,
            ]}
            onPress={() => handleFrequencySelect(freq.value)}
          >
            <Text
              style={[
                styles.optionButtonText,
                frequency === freq.value && styles.optionButtonTextActive,
              ]}
            >
              {freq.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.optionButton,
            frequency === 'custom' && styles.optionButtonActive,
          ]}
          onPress={() => handleFrequencySelect('custom')}
        >
          <Text
            style={[
              styles.optionButtonText,
              frequency === 'custom' && styles.optionButtonTextActive,
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {showCustomFrequency && (
        <TextInput
          style={styles.input}
          placeholder="Enter custom frequency..."
          value={customFrequency}
          onChangeText={setCustomFrequency}
        />
      )}

      {/* Duration Selection */}
      <Text style={styles.label}>Duration *</Text>
      <View style={styles.optionsGrid}>
        {DURATIONS.map((dur) => (
          <TouchableOpacity
            key={dur.value}
            style={[
              styles.optionButton,
              duration === dur.value && styles.optionButtonActive,
            ]}
            onPress={() => handleDurationSelect(dur.value)}
          >
            <Text
              style={[
                styles.optionButtonText,
                duration === dur.value && styles.optionButtonTextActive,
              ]}
            >
              {dur.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.optionButton,
            duration === 'custom' && styles.optionButtonActive,
          ]}
          onPress={() => handleDurationSelect('custom')}
        >
          <Text
            style={[
              styles.optionButtonText,
              duration === 'custom' && styles.optionButtonTextActive,
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {showCustomDuration && (
        <TextInput
          style={styles.input}
          placeholder="Enter custom duration..."
          value={customDuration}
          onChangeText={setCustomDuration}
        />
      )}

      {/* Quantity Input (Optional) */}
      <Text style={styles.label}>Quantity (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Total units to dispense"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    ...theme.typography.body1,
    backgroundColor: theme.colors.background,
  },
  formScroll: {
    marginBottom: theme.spacing.sm,
  },
  formButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  formButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  formButtonText: {
    ...theme.typography.body2,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  formButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    margin: 4,
    backgroundColor: theme.colors.background,
  },
  optionButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionButtonText: {
    ...theme.typography.body2,
    color: theme.colors.text,
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default DosagePicker;
