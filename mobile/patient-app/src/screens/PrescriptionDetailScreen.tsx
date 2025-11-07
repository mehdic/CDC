/**
 * Prescription Detail Screen
 * Displays detailed information about a specific prescription
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import {
  fetchPrescription,
  selectSelectedPrescription,
  selectLoading,
  transcribePrescription,
} from '../store/prescriptionSlice';
import { SafetyWarningLevel, ConfidenceLevel } from '@metapharm/api-types';
import PrescriptionStatusBadge from '../components/PrescriptionStatusBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type RootStackParamList = {
  PrescriptionDetail: { prescriptionId: string };
};

type PrescriptionDetailRouteProp = RouteProp<RootStackParamList, 'PrescriptionDetail'>;

export const PrescriptionDetailScreen: React.FC = () => {
  const route = useRoute<PrescriptionDetailRouteProp>();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const prescription = useSelector(selectSelectedPrescription);
  const loading = useSelector(selectLoading);

  const prescriptionId = route.params?.prescriptionId;

  /**
   * Load prescription on mount
   */
  useEffect(() => {
    if (prescriptionId) {
      dispatch(fetchPrescription(prescriptionId) as any);
    }
  }, [prescriptionId]);

  /**
   * Retry transcription
   */
  const handleRetryTranscription = async () => {
    if (!prescription) return;

    try {
      await dispatch(transcribePrescription(prescription.id) as any);
      Alert.alert('Succès', 'La transcription a été relancée.', [{ text: 'OK' }]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la transcription', [
        { text: 'OK' },
      ]);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Get confidence level label and color
   */
  const getConfidenceStyle = (level?: ConfidenceLevel) => {
    switch (level) {
      case ConfidenceLevel.HIGH:
        return { label: 'Haute confiance', color: '#10B981' };
      case ConfidenceLevel.MEDIUM:
        return { label: 'Confiance moyenne', color: '#F59E0B' };
      case ConfidenceLevel.LOW:
        return { label: 'Faible confiance', color: '#EF4444' };
      default:
        return { label: 'Inconnu', color: '#6B7280' };
    }
  };

  /**
   * Get warning level color
   */
  const getWarningColor = (level: SafetyWarningLevel): string => {
    switch (level) {
      case SafetyWarningLevel.CRITICAL:
        return '#EF4444';
      case SafetyWarningLevel.WARNING:
        return '#F59E0B';
      case SafetyWarningLevel.INFO:
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  if (loading || !prescription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Détails de l'ordonnance</Text>
            <PrescriptionStatusBadge status={prescription.status} size="small" />
          </View>
        </View>

        {/* Prescription Image */}
        <View style={styles.imageContainer}>
          {prescription.imageUrl ? (
            <Image
              source={{ uri: prescription.imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📄</Text>
            </View>
          )}
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date de téléchargement:</Text>
            <Text style={styles.infoValue}>{formatDate(prescription.createdAt)}</Text>
          </View>
          {prescription.prescribingDoctorName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Médecin prescripteur:</Text>
              <Text style={styles.infoValue}>
                Dr. {prescription.prescribingDoctorName}
              </Text>
            </View>
          )}
          {prescription.pharmacistName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pharmacien:</Text>
              <Text style={styles.infoValue}>{prescription.pharmacistName}</Text>
            </View>
          )}
          {prescription.approvedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date d'approbation:</Text>
              <Text style={styles.infoValue}>{formatDate(prescription.approvedAt)}</Text>
            </View>
          )}
          {prescription.validUntil && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Valide jusqu'au:</Text>
              <Text style={styles.infoValue}>{formatDate(prescription.validUntil)}</Text>
            </View>
          )}
        </View>

        {/* Transcription Data */}
        {prescription.transcriptionData ? (
          <>
            {/* Medications */}
            {prescription.transcriptionData.medications &&
              prescription.transcriptionData.medications.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Médicaments prescrits</Text>
                  {prescription.transcriptionData.medications.map((med, index) => (
                    <View key={index} style={styles.medicationCard}>
                      <View style={styles.medicationHeader}>
                        <Text style={styles.medicationName}>{med.medicationName}</Text>
                        {med.confidenceLevel && (
                          <View
                            style={[
                              styles.confidenceBadge,
                              {
                                backgroundColor: getConfidenceStyle(med.confidenceLevel)
                                  .color + '20',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.confidenceText,
                                { color: getConfidenceStyle(med.confidenceLevel).color },
                              ]}
                            >
                              {getConfidenceStyle(med.confidenceLevel).label}
                            </Text>
                          </View>
                        )}
                      </View>
                      {med.dosage && (
                        <Text style={styles.medicationDetail}>Dosage: {med.dosage}</Text>
                      )}
                      {med.frequency && (
                        <Text style={styles.medicationDetail}>
                          Fréquence: {med.frequency}
                        </Text>
                      )}
                      {med.duration && (
                        <Text style={styles.medicationDetail}>Durée: {med.duration}</Text>
                      )}
                      {med.instructions && (
                        <Text style={styles.medicationInstructions}>
                          {med.instructions}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

            {/* Safety Warnings */}
            {prescription.safetyWarnings && prescription.safetyWarnings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alertes de sécurité</Text>
                {prescription.safetyWarnings.map((warning, index) => (
                  <View
                    key={index}
                    style={[
                      styles.warningCard,
                      { borderLeftColor: getWarningColor(warning.level) },
                    ]}
                  >
                    <View style={styles.warningHeader}>
                      <Text
                        style={[
                          styles.warningLevel,
                          { color: getWarningColor(warning.level) },
                        ]}
                      >
                        {warning.level === SafetyWarningLevel.CRITICAL
                          ? 'CRITIQUE'
                          : warning.level === SafetyWarningLevel.WARNING
                          ? 'ATTENTION'
                          : 'INFO'}
                      </Text>
                      <Text style={styles.warningType}>{warning.type}</Text>
                    </View>
                    <Text style={styles.warningMessage}>{warning.message}</Text>
                    {warning.details && (
                      <Text style={styles.warningDetails}>{warning.details}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.noDataText}>Transcription en attente...</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryTranscription}
            >
              <Text style={styles.retryButtonText}>Relancer la transcription</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes */}
        {prescription.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{prescription.notes}</Text>
          </View>
        )}

        {/* Rejection Reason */}
        {prescription.rejectionReason && (
          <View style={[styles.section, styles.rejectionSection]}>
            <Text style={styles.sectionTitle}>Raison du rejet</Text>
            <Text style={styles.rejectionReason}>{prescription.rejectionReason}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 32,
    color: '#3B82F6',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  imageContainer: {
    backgroundColor: '#000',
    padding: 16,
  },
  image: {
    width: '100%',
    height: 400,
  },
  imagePlaceholder: {
    width: '100%',
    height: 400,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 80,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  medicationCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  medicationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  medicationDetail: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  medicationInstructions: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningLevel: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
  },
  warningType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  warningMessage: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 4,
  },
  warningDetails: {
    fontSize: 13,
    color: '#6B7280',
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notes: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  rejectionSection: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  rejectionReason: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
  },
});

export default PrescriptionDetailScreen;
