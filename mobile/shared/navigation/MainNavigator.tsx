/**
 * Main Navigator
 * Main application navigation with bottom tabs
 * Used for authenticated users to navigate between main features
 */

import React from 'react';
import { createBottomTabNavigator, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';

/**
 * Main stack param list for tab navigation
 */
export type MainStackParamList = {
  [key: string]: undefined | { [key: string]: any };
};

/**
 * Main navigator props
 */
interface MainNavigatorProps {
  screens: Record<string, React.ComponentType<any>>;
  initialRouteName?: string;
  screenOptions?: (props: any) => BottomTabNavigationOptions;
  tabBarOptions?: {
    activeTintColor?: string;
    inactiveTintColor?: string;
    style?: any;
    labelStyle?: any;
  };
}

/**
 * Create bottom tab navigator
 */
const Tab = createBottomTabNavigator<MainStackParamList>();

/**
 * Default screen options for main tabs
 */
const defaultScreenOptions: BottomTabNavigationOptions = {
  headerShown: true,
  headerStyle: {
    backgroundColor: '#FFFFFF',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  headerTintColor: '#007AFF',
  tabBarActiveTintColor: '#007AFF',
  tabBarInactiveTintColor: '#6C757D',
  tabBarStyle: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#DEE2E6',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
    paddingTop: 5,
    height: Platform.OS === 'ios' ? 85 : 60,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '600',
  },
};

/**
 * Main Navigator Component
 * Provides tab-based navigation for authenticated users
 */
export const MainNavigator: React.FC<MainNavigatorProps> = ({
  screens,
  initialRouteName,
  screenOptions,
  tabBarOptions = {},
}) => {
  // Merge custom tab bar options with defaults
  const mergedTabBarOptions = {
    activeTintColor: tabBarOptions.activeTintColor || '#007AFF',
    inactiveTintColor: tabBarOptions.inactiveTintColor || '#6C757D',
    style: tabBarOptions.style || defaultScreenOptions.tabBarStyle,
    labelStyle: tabBarOptions.labelStyle || defaultScreenOptions.tabBarLabelStyle,
  };

  // Merge custom screen options with defaults
  const mergedScreenOptions = screenOptions
    ? (props: any) => ({
        ...defaultScreenOptions,
        ...screenOptions(props),
      })
    : defaultScreenOptions;

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={mergedScreenOptions}
    >
      {Object.entries(screens).map(([name, component]) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarLabel: getTabLabel(name),
            tabBarIcon: ({ color, size }) => getTabIcon(name, color, size),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

/**
 * Get tab label for screen name
 * Can be overridden per app using i18n
 */
const getTabLabel = (screenName: string): string => {
  const labels: Record<string, string> = {
    Home: 'Accueil',
    Search: 'Rechercher',
    Orders: 'Commandes',
    Messages: 'Messages',
    Profile: 'Profil',
    Dashboard: 'Tableau de bord',
    Inventory: 'Inventaire',
    Patients: 'Patients',
    Deliveries: 'Livraisons',
    Map: 'Carte',
    Calendar: 'Agenda',
    Notifications: 'Notifications',
    Prescriptions: 'Ordonnances',
    Consultations: 'Consultations',
    Medications: 'Médicaments',
  };

  return labels[screenName] || screenName;
};

/**
 * Get tab icon for screen name
 * Note: In production, use react-native-vector-icons or similar
 * For now, using emoji placeholders
 */
const getTabIcon = (screenName: string, color: string, size: number): React.ReactNode => {
  const icons: Record<string, string> = {
    Home: '🏠',
    Search: '🔍',
    Orders: '📦',
    Messages: '💬',
    Profile: '👤',
    Dashboard: '📊',
    Inventory: '📋',
    Patients: '🏥',
    Deliveries: '🚚',
    Map: '🗺️',
    Calendar: '📅',
    Notifications: '🔔',
    Prescriptions: '💊',
    Consultations: '👨‍⚕️',
    Medications: '⚕️',
  };

  // In production, replace with proper icon component:
  // import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
  // return <MaterialIcons name={iconName} size={size} color={color} />;

  // Placeholder text-based icon
  const React = require('react');
  const { Text } = require('react-native');

  return React.createElement(
    Text,
    { style: { fontSize: size, color } },
    icons[screenName] || '•'
  );
};

/**
 * Hook to get main navigator instance
 */
export const useMainNavigation = () => {
  const { navigate } = require('@react-navigation/native');

  return {
    navigate,
    goBack: require('@react-navigation/native').useNavigation().goBack,
    reset: require('@react-navigation/native').useNavigation().reset,
  };
};

/**
 * Export navigator and utilities
 */
export default MainNavigator;
