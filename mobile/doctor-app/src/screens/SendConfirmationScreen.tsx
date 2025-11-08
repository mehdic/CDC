/**
 * T128: Send Confirmation Screen
 * Review prescription details and send to pharmacy
 *
 * Features:
 * - Prescription summary display
 * - Patient and pharmacy details
 * - Medication list review
 * - Final validation
 * - Send to pharmacy
 * - Success/error handling
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { prescriptionApi } from '../services/api';
import { theme } from '../App';

type SendConfirmationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SendConfirmation'
>;

type SendConfirmationScreenRouteProp = RouteProp<
  RootStackParamList,
  'SendConfirmation'
>;

interface Props {
  navigation: SendConfirmationScreenNavigationProp;
  route: SendConfirmationScreenRouteProp;
}

const SendConfirmationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { prescription } = route.params;
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);

    try {
      // Create prescription request
      const requestData = {
        pharmacy_id: prescription.pharmacy_id,
        patient_id: prescription.patient_id,
        items: prescription.items,
        prescribed_date: new Date().toISOString(),
        notes: prescription.notes,
      };

      const response = await prescriptionApi.create(requestData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Prescription sent successfully to pharmacy!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('CreatePrescription'),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to send prescription');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to send prescription. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSending(false);
    }
  };

  const handleEdit = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Review & Confirm</Text>
        <Text style={styles.subtitle}>
          Please review the prescription details before sending to pharmacy
        </Text>

        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Name</Text>
            <Text style={styles.cardValue}>
              {/* In production, fetch patient name */}
              Patient #{prescription.patient_id.substring(0, 8)}
            </Text>
            <Text style={[styles.cardLabel, { marginTop: theme.spacing.sm }]}>
              Patient ID
            </Text>
            <Text style={styles.cardValue}>{prescription.patient_id}</Text>
          </View>
        </View>

        {/* Pharmacy Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pharmacy</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Pharmacy ID</Text>
            <Text style={styles.cardValue}>{prescription.pharmacy_id}</Text>
          </View>
        </View>

        {/* Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications ({prescription.items.length})</Text>
          {prescription.items.map((item, index) => (
            <View key={index} style={styles.medicationCard}>
              <View style={styles.medicationHeader}>
                <Text style={styles.medicationName}>{item.medication_name}</Text>
                <View style={styles.medicationBadge}>
                  <Text style={styles.medicationBadgeText}>#{index + 1}</Text>
                </View>
              </View>

              <View style={styles.medicationDetail}>
                <Text style={styles.medicationDetailLabel}>Dosage:</Text>
                <Text style={styles.medicationDetailValue}>{item.dosage}</Text>
              </View>

              <View style={styles.medicationDetail}>
                <Text style={styles.medicationDetailLabel}>Frequency:</Text>
                <Text style={styles.medicationDetailValue}>{item.frequency}</Text>
              </View>

              {item.duration && (
                <View style={styles.medicationDetail}>
                  <Text style={styles.medicationDetailLabel}>Duration:</Text>
                  <Text style={styles.medicationDetailValue}>{item.duration}</Text>
                </View>
              )}

              {item.quantity && (
                <View style={styles.medicationDetail}>
                  <Text style={styles.medicationDetailLabel}>Quantity:</Text>
                  <Text style={styles.medicationDetailValue}>{item.quantity}</Text>
                </View>
              )}

              {item.medication_rxnorm_code && (
                <View style={styles.medicationDetail}>
                  <Text style={styles.medicationDetailLabel}>RxNorm Code:</Text>
                  <Text style={styles.medicationDetailValue}>
                    {item.medication_rxnorm_code}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Notes */}
        {prescription.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{prescription.notes}</Text>
            </View>
          </View>
        )}

        {/* Prescription Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescribed Date</Text>
          <View style={styles.card}>
            <Text style={styles.cardValue}>
              {new Date(prescription.prescribed_date || new Date()).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            disabled={sending}
          >
            <Text style={styles.editButtonText}>← Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonText}>Send to Pharmacy</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ By sending this prescription, you confirm that all information is accurate
            and you have verified the patient's medical history and potential drug
            interactions.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  cardValue: {
    ...theme.typography.body1,
    color: theme.colors.text,
  },
  medicationCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  medicationName: {
    ...theme.typography.body1,
    fontWeight: '600' as const,
    color: theme.colors.text,
    flex: 1,
  },
  medicationBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  medicationBadgeText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  medicationDetail: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  medicationDetailLabel: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    width: 90,
  },
  medicationDetailValue: {
    ...theme.typography.body2,
    color: theme.colors.text,
    flex: 1,
    fontWeight: '500' as const,
  },
  notesText: {
    ...theme.typography.body1,
    color: theme.colors.text,
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  editButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editButtonText: {
    ...theme.typography.body1,
    color: theme.colors.text,
    fontWeight: '600' as const,
  },
  sendButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  sendButtonText: {
    ...theme.typography.body1,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  disclaimer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  disclaimerText: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    lineHeight: 18,
  },
});

export default SendConfirmationScreen;
