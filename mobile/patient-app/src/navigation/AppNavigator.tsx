/**
 * App Navigator
 * Main navigation configuration for the Patient App
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PrescriptionListScreen from '../screens/PrescriptionListScreen';
import PrescriptionUploadScreen from '../screens/PrescriptionUploadScreen';
import PrescriptionDetailScreen from '../screens/PrescriptionDetailScreen';

// Stack and Tab navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Home Tab Navigator
 */
const HomeTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="PrescriptionList"
        component={PrescriptionListScreen}
        options={{
          tabBarLabel: 'Ordonnances',
          tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} />,
        }}
      />
      <Tab.Screen
        name="PrescriptionUpload"
        component={PrescriptionUploadScreen}
        options={{
          tabBarLabel: 'Ajouter',
          tabBarIcon: ({ color }) => <TabIcon icon="➕" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Tab Icon Component
 */
const TabIcon: React.FC<{ icon: string; color: string }> = ({ icon }) => {
  return <span style={{ fontSize: 24 }}>{icon}</span>;
};

/**
 * Main App Navigator
 */
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeTabNavigator} />
        <Stack.Screen
          name="PrescriptionDetail"
          component={PrescriptionDetailScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
