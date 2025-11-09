/**
 * Root Navigator
 * Main navigation structure with tab navigation for each app type
 * Supports deep linking and navigation state persistence
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';

/**
 * Navigation persistence key
 */
const NAVIGATION_STATE_KEY = '@metapharm/navigationState';

/**
 * App type for different user roles
 */
export type AppType = 'patient' | 'pharmacist' | 'doctor' | 'nurse' | 'delivery';

/**
 * Root navigator props
 */
interface RootNavigatorProps {
  appType: AppType;
  screens: Record<string, React.ComponentType<any>>;
  initialRouteName?: string;
  linking?: {
    prefixes: string[];
    config: any;
  };
}

/**
 * Create tab navigator
 */
const Tab = createBottomTabNavigator();

/**
 * Navigation theme
 */
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#212529',
    border: '#DEE2E6',
    notification: '#DC3545',
  },
};

/**
 * Deep linking configuration for each app type
 */
const getLinkingConfig = (appType: AppType, customLinking?: any) => {
  const prefixes = [
    `metapharm-${appType}://`,
    `https://metapharm.app/${appType}`,
    ...(customLinking?.prefixes || []),
  ];

  const baseConfig = {
    screens: {
      // Auth screens (common for all apps)
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password/:token',

      // App-specific screens
      ...(customLinking?.config?.screens || {}),
    },
  };

  return {
    prefixes,
    config: baseConfig,
  };
};

/**
 * Root Navigator Component
 */
export const RootNavigator: React.FC<RootNavigatorProps> = ({
  appType,
  screens,
  initialRouteName,
  linking,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();

  // Load persisted navigation state on mount
  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);

        if (savedStateString) {
          const savedState = JSON.parse(savedStateString);
          setInitialState(savedState);
        }
      } catch (error) {
        console.error('Error restoring navigation state:', error);
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  // Don't render until ready
  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer
      theme={navigationTheme}
      initialState={initialState}
      linking={getLinkingConfig(appType, linking)}
      onStateChange={(state) => {
        // Persist navigation state
        AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
      }}
      fallback={null}
    >
      <Tab.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
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
        }}
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
    </NavigationContainer>
  );
};

/**
 * Get tab label for screen name
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
  };

  return labels[screenName] || screenName;
};

/**
 * Get tab icon for screen name
 * Note: In a real implementation, use react-native-vector-icons
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
  };

  // In production, replace with proper icon component:
  // return <Icon name={iconName} size={size} color={color} />;

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
 * Clear persisted navigation state (useful for logout)
 */
export const clearNavigationState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
    console.log('Navigation state cleared');
  } catch (error) {
    console.error('Error clearing navigation state:', error);
  }
};

/**
 * Export navigator and utilities
 */
export default RootNavigator;
