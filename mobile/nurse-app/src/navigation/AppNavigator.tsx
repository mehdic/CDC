/**
 * App Navigator - Main navigation structure for Nurse App
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { PatientsStackParamList } from './types';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import MfaVerificationScreen from '../screens/Auth/MfaVerificationScreen';

// Patient Screens
import PatientSearchScreen from '../screens/PatientSearch/PatientSearchScreen';
import PatientMedicationsScreen from '../screens/PatientMedications/PatientMedicationsScreen';

// Medication Screens
import MedicationOrderScreen from '../screens/MedicationOrder/MedicationOrderScreen';
import AdministrationRecordingScreen from '../screens/Administration/AdministrationRecordingScreen';
import BarcodeScannerScreen from '../screens/BarcodeScanner/BarcodeScannerScreen';

// Records & Safety Screens
import PatientRecordsScreen from '../screens/PatientRecords/PatientRecordsScreen';
import AdverseReactionsScreen from '../screens/Reactions/AdverseReactionsScreen';

// Delivery & Communication Screens
import DeliveryTrackingScreen from '../screens/DeliveryTracking/DeliveryTrackingScreen';
import MessagingScreen from '../screens/Messaging/MessagingScreen';
import ShiftHandoverScreen from '../screens/Handover/ShiftHandoverScreen';

// Profile Screen
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Stack = createStackNavigator<PatientsStackParamList>();
const AuthNavigator = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <AuthNavigator.Navigator screenOptions={{ headerShown: false }}>
    <AuthNavigator.Screen name="Login" component={LoginScreen} />
    <AuthNavigator.Screen name="MfaVerification" component={MfaVerificationScreen} />
  </AuthNavigator.Navigator>
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
      component={AdministrationRecordingScreen}
      options={{ title: 'Record Administration' }}
    />
    <Stack.Screen
      name="BarcodeScanner"
      component={BarcodeScannerScreen}
      options={{ title: 'Scan Barcode', headerShown: false }}
    />
    <Stack.Screen
      name="PatientRecords"
      component={PatientRecordsScreen}
      options={{ title: 'Patient Records' }}
    />
    <Stack.Screen
      name="Reactions"
      component={AdverseReactionsScreen}
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
      component={ShiftHandoverScreen}
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
