/**
 * Shared Card Component
 * Container with elevation, header/body/footer sections, and press actions
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';

/**
 * Card elevation level (shadow depth)
 */
export type CardElevation = 'none' | 'low' | 'medium' | 'high';

/**
 * Card props
 */
export interface CardProps {
  children?: React.ReactNode;
  header?: React.ReactNode;
  headerTitle?: string;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  elevation?: CardElevation;
  onPress?: () => void;
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  bodyStyle?: ViewStyle;
  footerStyle?: ViewStyle;
  headerTitleStyle?: TextStyle;
  disabled?: boolean;
  testID?: string;
}

/**
 * Elevation shadow styles for iOS and Android
 */
const getElevationStyle = (elevation: CardElevation): ViewStyle => {
  switch (elevation) {
    case 'none':
      return {};
    case 'low':
      return Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
      }) || {};
    case 'medium':
      return Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        },
        android: {
          elevation: 4,
        },
      }) || {};
    case 'high':
      return Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }) || {};
    default:
      return {};
  }
};

/**
 * Card Component
 */
export const Card: React.FC<CardProps> = ({
  children,
  header,
  headerTitle,
  headerRight,
  footer,
  elevation = 'medium',
  onPress,
  style,
  headerStyle,
  bodyStyle,
  footerStyle,
  headerTitleStyle,
  disabled = false,
  testID,
}) => {
  const elevationStyle = getElevationStyle(elevation);

  const containerStyle: ViewStyle = {
    ...styles.container,
    ...elevationStyle,
    ...style,
  };

  // Render header section
  const renderHeader = () => {
    if (!header && !headerTitle && !headerRight) {
      return null;
    }

    if (header) {
      return <View style={[styles.header, headerStyle]}>{header}</View>;
    }

    return (
      <View style={[styles.header, styles.headerRow, headerStyle]}>
        {headerTitle && (
          <Text style={[styles.headerTitle, headerTitleStyle]} testID={`${testID}-header-title`}>
            {headerTitle}
          </Text>
        )}
        {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
      </View>
    );
  };

  // Render footer section
  const renderFooter = () => {
    if (!footer) {
      return null;
    }

    return <View style={[styles.footer, footerStyle]}>{footer}</View>;
  };

  // If onPress provided, make card pressable
  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        testID={testID}
      >
        {renderHeader()}
        <View style={[styles.body, bodyStyle]}>{children}</View>
        {renderFooter()}
      </TouchableOpacity>
    );
  }

  // Non-pressable card
  return (
    <View style={containerStyle} testID={testID}>
      {renderHeader()}
      <View style={[styles.body, bodyStyle]}>{children}</View>
      {renderFooter()}
    </View>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  body: {
    padding: 16,
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
});

/**
 * Export component
 */
export default Card;
