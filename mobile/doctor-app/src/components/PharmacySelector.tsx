/**
 * T127: Pharmacy Selector Component
 * Search and select pharmacy for prescription delivery
 *
 * Features:
 * - Pharmacy search by name or location
 * - Nearby pharmacies (GPS-based)
 * - Distance display
 * - Operating hours display
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
import { Pharmacy } from '../types';
import { pharmacyApi } from '../services/api';
import { theme } from '../App';

interface PharmacySelectorProps {
  selectedPharmacy?: Pharmacy;
  onSelect: (pharmacy: Pharmacy) => void;
  onClear?: () => void;
}

const PharmacySelector: React.FC<PharmacySelectorProps> = ({
  selectedPharmacy,
  onSelect,
  onClear,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [nearbyPharmacies, setNearbyPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load nearby pharmacies on mount
  useEffect(() => {
    loadNearbyPharmacies();
  }, []);

  // Search pharmacies when query changes (debounced)
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchPharmacies(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPharmacies([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const loadNearbyPharmacies = async () => {
    try {
      // In production: get user's GPS location
      // For MVP, load all pharmacies or filter by canton
      const nearby = await pharmacyApi.getNearby();
      setNearbyPharmacies(nearby);
    } catch (err) {
      console.error('Failed to load nearby pharmacies:', err);
    }
  };

  const searchPharmacies = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await pharmacyApi.search(query);
      setPharmacies(results);
      setShowSuggestions(true);
    } catch (err: any) {
      setError(err.message || 'Failed to search pharmacies');
      setPharmacies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPharmacy = (pharmacy: Pharmacy) => {
    onSelect(pharmacy);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setPharmacies([]);
    setShowSuggestions(false);
    onClear?.();
  };

  const renderPharmacyItem = ({ item }: { item: Pharmacy }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectPharmacy(item)}
    >
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionName}>{item.name}</Text>
        <Text style={styles.suggestionAddress}>
          {item.city}, {item.canton} {item.postal_code}
        </Text>
        {item.phone && (
          <Text style={styles.suggestionDetail}>📞 {item.phone}</Text>
        )}
        {item.distance && (
          <Text style={styles.suggestionDistance}>
            📍 {item.distance.toFixed(1)} km away
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pharmacy *</Text>

      {selectedPharmacy ? (
        // Display selected pharmacy
        <View style={styles.selectedContainer}>
          <View style={styles.selectedContent}>
            <Text style={styles.selectedName}>{selectedPharmacy.name}</Text>
            <Text style={styles.selectedAddress}>
              {selectedPharmacy.city}, {selectedPharmacy.canton}{' '}
              {selectedPharmacy.postal_code}
            </Text>
            {selectedPharmacy.phone && (
              <Text style={styles.selectedDetail}>📞 {selectedPharmacy.phone}</Text>
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
              placeholder="Search by name or location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {loading && <ActivityIndicator style={styles.loadingIcon} />}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Suggestions dropdown */}
          {showSuggestions && pharmacies.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={pharmacies}
                renderItem={renderPharmacyItem}
                keyExtractor={(item) => item.id}
                style={styles.suggestionsList}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {/* Nearby pharmacies */}
          {!showSuggestions && nearbyPharmacies.length > 0 && searchQuery.length === 0 && (
            <View style={styles.nearbyContainer}>
              <Text style={styles.nearbyLabel}>Nearby Pharmacies</Text>
              <FlatList
                data={nearbyPharmacies.slice(0, 5)}
                renderItem={renderPharmacyItem}
                keyExtractor={(item) => item.id}
                style={styles.nearbyList}
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: theme.colors.text,
  },
  suggestionAddress: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  suggestionDetail: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  suggestionDistance: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    fontWeight: '600',
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
    fontWeight: '600',
    color: theme.colors.text,
  },
  selectedAddress: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  selectedDetail: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  clearButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  clearButtonText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  nearbyContainer: {
    marginTop: theme.spacing.md,
  },
  nearbyLabel: {
    ...theme.typography.body2,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  nearbyList: {
    maxHeight: 200,
  },
});

export default PharmacySelector;
