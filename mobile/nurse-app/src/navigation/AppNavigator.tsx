/**
 * App Navigator - Main navigation structure for Nurse App
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import MfaVerificationScreen from '../screens/Auth/MfaVerificationScreen';

// Patient Screens
import PatientSearchScreen from '../screens/PatientSearch/PatientSearchScreen';
import PatientMedicationsScreen from '../screens/PatientMedications/PatientMedicationsScreen';

// Placeholder screens (to be implemented)
const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 18, color: '#2C3E50' }}>{title}</Text>
    <Text style={{ fontSize: 14, color: '#95A5A6', marginTop: 8 }}>Coming soon...</Text>
  </View>
);

import { View, Text } from 'react-native';

const MedicationOrderScreen = () => <PlaceholderScreen title="Medication Order" />;
const AdministrationScreen = () => <PlaceholderScreen title="Record Administration" />;
const PatientRecordsScreen = () => <PlaceholderScreen title="Patient Records" />;
const ReactionsScreen = () => <PlaceholderScreen title="Report Reaction" />;
const DeliveryTrackingScreen = () => <PlaceholderScreen title="Delivery Tracking" />;
const MessagingScreen = () => <PlaceholderScreen title="Messages" />;
const HandoverScreen = () => <PlaceholderScreen title="Shift Handover" />;
const ProfileScreen = () => <PlaceholderScreen title="Profile" />;

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="MfaVerification" component={MfaVerificationScreen} />
  </Stack.Navigator>
);

const PatientsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="PatientSearch"
      component={PatientSearchScreen}
      options={{ title: 'Patient Search' }}
    />
    <Stack.Screen
      name="PatientMedications"
      component={PatientMedicationsScreen}
      options={{ title: 'Patient Medications' }}
    />
    <Stack.Screen
      name="MedicationOrder"
      component={MedicationOrderScreen}
      options={{ title: 'Order Medication' }}
    />
    <Stack.Screen
      name="Administration"
      component={AdministrationScreen}
      options={{ title: 'Record Administration' }}
    />
    <Stack.Screen
      name="PatientRecords"
      component={PatientRecordsScreen}
      options={{ title: 'Patient Records' }}
    />
    <Stack.Screen
      name="Reactions"
      component={ReactionsScreen}
      options={{ title: 'Report Reaction' }}
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen
      name="PatientsTab"
      component={PatientsStack}
      options={{ title: 'Patients' }}
    />
    <Tab.Screen
      name="DeliveryTab"
      component={DeliveryTrackingScreen}
      options={{ title: 'Deliveries' }}
    />
    <Tab.Screen
      name="MessagesTab"
      component={MessagingScreen}
      options={{ title: 'Messages' }}
    />
    <Tab.Screen
      name="HandoverTab"
      component={HandoverScreen}
      options={{ title: 'Handover' }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
