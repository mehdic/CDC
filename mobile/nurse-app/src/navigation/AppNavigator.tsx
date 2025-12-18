/**
 * App Navigator
 * Manages navigation between auth and main app screens
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { useAppSelector } from '../hooks/useRedux';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';

// Main Screens
import PatientSearchScreen from '../screens/PatientSearch/PatientSearchScreen';
import PatientDetailScreen from '../screens/PatientDetail/PatientDetailScreen';
import MedicationOrderScreen from '../screens/MedicationOrder/MedicationOrderScreen';
import PharmacyRecordsScreen from '../screens/PharmacyRecords/PharmacyRecordsScreen';
import DeliveryTrackingScreen from '../screens/DeliveryTracking/DeliveryTrackingScreen';
import AdministrationLogScreen from '../screens/AdministrationLog/AdministrationLogScreen';
import ShiftHandoverScreen from '../screens/ShiftHandover/ShiftHandoverScreen';

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
        name="PatientSearch"
        component={PatientSearchScreen}
        options={{ tabBarLabel: 'Patients' }}
      />
      <Tab.Screen
        name="MedicationOrder"
        component={MedicationOrderScreen}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="AdministrationLog"
        component={AdministrationLogScreen}
        options={{ tabBarLabel: 'Logs' }}
      />
      <Tab.Screen
        name="ShiftHandover"
        component={ShiftHandoverScreen}
        options={{ tabBarLabel: 'Handover' }}
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
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ title: 'Patient Details' }}
      />
      <Stack.Screen
        name="PharmacyRecords"
        component={PharmacyRecordsScreen}
        options={{ title: 'Pharmacy Records' }}
      />
      <Stack.Screen
        name="DeliveryTracking"
        component={DeliveryTrackingScreen}
        options={{ title: 'Track Delivery' }}
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
