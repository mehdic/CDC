/**
 * AddressCard Component
 * Reusable card for displaying formatted addresses
 * Extracted from DeliveryDetailScreen for reusability
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

import { Address } from '../types/delivery';

export interface AddressCardProps {
  address: Address;
  title?: string;
  showMapButton?: boolean;
  onMapPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

/**
 * AddressCard Component
 * Displays formatted address with optional map button
 */
export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  title = 'Address',
  showMapButton = false,
  onMapPress,
  style,
  testID = 'address-card',
}) => {
  const formatAddress = (): string[] => {
    const lines: string[] = [];

    if (address.street) {lines.push(address.street);}
    if (address.postalCode && address.city) {
      lines.push(`${address.postalCode} ${address.city}`);
    } else if (address.city) {
      lines.push(address.city);
    }
    if (address.canton) {lines.push(address.canton);}
    if (address.country) {lines.push(address.country);}

    return lines;
  };

  const addressLines = formatAddress();
  const fullAddress = addressLines.join(', ');

  return (
    <View style={[styles.container, style]} testID={testID}>
      {title && (
        <Text
          style={styles.title}
          testID={`${testID}-title`}
          accessibilityRole="header"
          accessibilityLabel={title}
        >
          {title}
        </Text>
      )}

      <View style={styles.addressContainer}>
        {addressLines.map((line, index) => (
          <Text
            key={index}
            style={styles.addressLine}
            testID={`${testID}-line-${index}`}
            accessibilityLabel={line}
          >
            {line}
          </Text>
        ))}
      </View>

      {address.instructions && (
        <View style={styles.instructionsContainer}>
          <Text
            style={styles.instructionsLabel}
            testID={`${testID}-instructions-label`}
            accessibilityRole="header"
          >
            Delivery Instructions:
          </Text>
          <Text
            style={styles.instructionsText}
            testID={`${testID}-instructions-text`}
            accessibilityLabel={`Delivery instructions: ${address.instructions}`}
          >
            {address.instructions}
          </Text>
        </View>
      )}

      {showMapButton && (
        <TouchableOpacity
          style={styles.mapButton}
          onPress={onMapPress}
          testID={`${testID}-map-button`}
          accessible={true}
          accessibilityLabel="View on map"
          accessibilityHint="Double tap to view this address on the map"
          accessibilityRole="button"
        >
          <Text style={styles.mapButtonText}>📍 View on Map</Text>
        </TouchableOpacity>
      )}

      {address.latitude && address.longitude && (
        <Text
          style={styles.coordinates}
          testID={`${testID}-coordinates`}
          accessibilityLabel={`Coordinates: Latitude ${address.latitude.toFixed(6)}, Longitude ${address.longitude.toFixed(6)}`}
        >
          {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  addressContainer: {
    marginBottom: 8,
  },
  addressLine: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 2,
  },
  instructionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 12,
    color: '#856404',
    backgroundColor: '#FFF3CD',
    padding: 8,
    borderRadius: 4,
    fontStyle: 'italic',
  },
  mapButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  coordinates: {
    marginTop: 8,
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});

export default AddressCard;
