/**
 * App Navigator
 * Manages navigation between auth and main app screens
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSelector } from '../hooks/useRedux';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';

// Main Screens
import DeliveryListScreen from '../screens/DeliveryList/DeliveryListScreen';
import DeliveryDetailScreen from '../screens/DeliveryDetail/DeliveryDetailScreen';
import MapScreen from '../screens/Map/MapScreen';
import QRScannerScreen from '../screens/QRScanner/QRScannerScreen';
import ProofOfDeliveryScreen from '../screens/ProofOfDelivery/ProofOfDeliveryScreen';
import EarningsScreen from '../screens/Earnings/EarningsScreen';
import ProfileScreen from '../screens/Auth/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Main Tab Navigator
 */
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Deliveries"
        component={DeliveryListScreen}
        options={{ tabBarLabel: 'Deliveries' }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ tabBarLabel: 'Earnings' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

/**
 * Auth Stack Navigator
 */
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

/**
 * Main Stack Navigator
 */
const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="DeliveryDetail"
        component={DeliveryDetailScreen}
        options={{ title: 'Delivery Details' }}
      />
      <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Navigation' }} />
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ title: 'Scan QR Code' }}
      />
      <Stack.Screen
        name="ProofOfDelivery"
        component={ProofOfDeliveryScreen}
        options={{ title: 'Proof of Delivery' }}
      />
    </Stack.Navigator>
  );
};

/**
 * Root App Navigator
 */
const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
