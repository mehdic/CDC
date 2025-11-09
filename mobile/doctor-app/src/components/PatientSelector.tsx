/**
 * T126: Patient Selector Component
 * Search and select patient for prescription
 *
 * Features:
 * - Patient search by name or email
 * - Recent patients quick selection
 * - Patient details display
 * - Autocomplete suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Patient } from '../types';
import { patientApi } from '../services/api';
import { theme } from '../App';

interface PatientSelectorProps {
  selectedPatient?: Patient;
  onSelect: (patient: Patient) => void;
  onClear?: () => void;
}

const PatientSelector: React.FC<PatientSelectorProps> = ({
  selectedPatient,
  onSelect,
  onClear,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load recent patients on mount
  useEffect(() => {
    loadRecentPatients();
  }, []);

  // Search patients when query changes (debounced)
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchPatients(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPatients([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const loadRecentPatients = async () => {
    try {
      const recent = await patientApi.getRecent();
      setRecentPatients(recent);
    } catch (err) {
      console.error('Failed to load recent patients:', err);
    }
  };

  const searchPatients = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await patientApi.search(query);
      setPatients(results);
      setShowSuggestions(true);
    } catch (err: any) {
      setError(err.message || 'Failed to search patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    onSelect(patient);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setPatients([]);
    setShowSuggestions(false);
    onClear?.();
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectPatient(item)}
    >
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.suggestionEmail}>{item.email}</Text>
        {item.date_of_birth && (
          <Text style={styles.suggestionDetail}>DOB: {item.date_of_birth}</Text>
        )}
        {item.allergies && item.allergies.length > 0 && (
          <Text style={styles.suggestionAllergies}>
            ⚠️ Allergies: {item.allergies.join(', ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Patient *</Text>

      {selectedPatient ? (
        // Display selected patient
        <View style={styles.selectedContainer}>
          <View style={styles.selectedContent}>
            <Text style={styles.selectedName}>
              {selectedPatient.first_name} {selectedPatient.last_name}
            </Text>
            <Text style={styles.selectedEmail}>{selectedPatient.email}</Text>
            {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
              <Text style={styles.selectedAllergies}>
                ⚠️ Allergies: {selectedPatient.allergies.join(', ')}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Search input
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {loading && <ActivityIndicator style={styles.loadingIcon} />}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Suggestions dropdown */}
          {showSuggestions && patients.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={patients}
                renderItem={renderPatientItem}
                keyExtractor={(item) => item.id}
                style={styles.suggestionsList}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {/* Recent patients */}
          {!showSuggestions && recentPatients.length > 0 && searchQuery.length === 0 && (
            <View style={styles.recentContainer}>
              <Text style={styles.recentLabel}>Recent Patients</Text>
              <FlatList
                data={recentPatients.slice(0, 5)}
                renderItem={renderPatientItem}
                keyExtractor={(item) => item.id}
                style={styles.recentList}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body1,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    ...theme.typography.body1,
    backgroundColor: theme.colors.background,
  },
  loadingIcon: {
    position: 'absolute',
    right: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  suggestionsContainer: {
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    maxHeight: 300,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    ...theme.typography.body1,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  suggestionEmail: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  suggestionDetail: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  suggestionAllergies: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    marginTop: theme.spacing.xs,
    fontWeight: '600' as const,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  selectedContent: {
    flex: 1,
  },
  selectedName: {
    ...theme.typography.body1,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  selectedEmail: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  selectedAllergies: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    marginTop: theme.spacing.xs,
    fontWeight: '600' as const,
  },
  clearButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  clearButtonText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  recentContainer: {
    marginTop: theme.spacing.md,
  },
  recentLabel: {
    ...theme.typography.body2,
    fontWeight: '600' as const,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  recentList: {
    maxHeight: 200,
  },
});

export default PatientSelector;
