/**
 * T124: Drug Search Component with AI Suggestions
 * Autocomplete search for medications with AI-powered recommendations
 *
 * Features:
 * - Real-time drug search with autocomplete
 * - AI-powered suggestions based on patient context
 * - RxNorm code lookup
 * - Generic/brand name display
 * - Common dosages hint
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { DrugSuggestion } from '../types';
import { drugApi } from '../services/api';
import { theme } from '../App';

interface DrugSearchProps {
  placeholder?: string;
  onSelectDrug: (drugName: string, rxNormCode?: string) => void;
  patientContext?: {
    patient_id: string;
    conditions?: string[];
    current_medications?: string[];
  };
}

const DrugSearch: React.FC<DrugSearchProps> = ({
  placeholder = 'Search medication...',
  onSelectDrug,
  patientContext,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<DrugSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search drugs when query changes (debounced)
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchDrugs(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const searchDrugs = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await drugApi.search(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (err: any) {
      setError(err.message || 'Failed to search drugs');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDrug = (suggestion: DrugSuggestion) => {
    onSelectDrug(suggestion.drug.name, suggestion.drug.rxnorm_code);
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const getConfidenceBadgeColor = (confidence: number): string => {
    if (confidence >= 90) return theme.colors.success;
    if (confidence >= 70) return theme.colors.primary;
    return theme.colors.warning;
  };

  const renderSuggestionItem = ({ item }: { item: DrugSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectDrug(item)}
    >
      <View style={styles.suggestionContent}>
        {/* Drug name */}
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionName}>{item.drug.name}</Text>
          {item.confidence >= 70 && (
            <View
              style={[
                styles.confidenceBadge,
                { backgroundColor: getConfidenceBadgeColor(item.confidence) },
              ]}
            >
              <Text style={styles.confidenceBadgeText}>
                {Math.round(item.confidence)}%
              </Text>
            </View>
          )}
        </View>

        {/* Generic name (if different) */}
        {item.drug.generic_name &&
          item.drug.generic_name !== item.drug.name && (
            <Text style={styles.suggestionGeneric}>
              Generic: {item.drug.generic_name}
            </Text>
          )}

        {/* Brand names */}
        {item.drug.brand_names && item.drug.brand_names.length > 0 && (
          <Text style={styles.suggestionBrands}>
            Brands: {item.drug.brand_names.slice(0, 3).join(', ')}
          </Text>
        )}

        {/* Common dosages */}
        {item.drug.common_dosages && item.drug.common_dosages.length > 0 && (
          <Text style={styles.suggestionDosages}>
            Common: {item.drug.common_dosages.slice(0, 3).join(', ')}
          </Text>
        )}

        {/* AI suggestion reason */}
        {item.reason && (
          <Text style={styles.suggestionReason}>💡 {item.reason}</Text>
        )}

        {/* RxNorm code */}
        {item.drug.rxnorm_code && (
          <Text style={styles.suggestionCode}>
            RxNorm: {item.drug.rxnorm_code}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator style={styles.loadingIcon} />}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsHeader}>
            {patientContext ? 'AI-Suggested Medications' : 'Search Results'}
          </Text>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item, index) => `${item.drug.id}-${index}`}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          />
        </View>
      )}

      {showSuggestions && suggestions.length === 0 && !loading && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No medications found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
    zIndex: 1000,
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
    maxHeight: 350,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsHeader: {
    ...theme.typography.caption,
    fontWeight: '600' as const,
    color: theme.colors.textSecondary,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
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
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionName: {
    ...theme.typography.body1,
    fontWeight: '600' as const,
    color: theme.colors.text,
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: theme.spacing.sm,
  },
  confidenceBadgeText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 10,
  },
  suggestionGeneric: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  suggestionBrands: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  suggestionDosages: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  suggestionReason: {
    ...theme.typography.caption,
    color: theme.colors.success,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  suggestionCode: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontSize: 10,
  },
  noResultsContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
});

export default DrugSearch;
