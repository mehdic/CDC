/**
 * App Navigator
 * Main navigation configuration for the Patient App
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Text, View } from 'react-native';

import PrescriptionDetailScreen from '../screens/PrescriptionDetailScreen';
import PrescriptionListScreen from '../screens/PrescriptionListScreen';
import PrescriptionUploadScreen from '../screens/PrescriptionUploadScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import { useSelector } from 'react-redux';
import { selectCartItemCount } from '../store/cartSlice';

// Stack and Tab navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Home Tab Navigator
 */
const HomeTabNavigator: React.FC = () => {
  const cartItemCount = useSelector(selectCartItemCount);

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
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Panier',
          tabBarIcon: ({ color }) => (
            <TabIconWithBadge icon="🛒" color={color} badgeCount={cartItemCount} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Tab Icon Component
 */
const TabIcon: React.FC<{ icon: string; color: string }> = ({ icon }) => {
  return <Text style={{ fontSize: 24 }}>{icon}</Text>;
};

/**
 * Tab Icon With Badge Component
 */
const TabIconWithBadge: React.FC<{
  icon: string;
  color: string;
  badgeCount: number;
}> = ({ icon, badgeCount }) => {
  return (
    <View style={{ position: 'relative' }}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      {badgeCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -8,
            backgroundColor: '#EF4444',
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 12,
              fontWeight: 'bold',
            }}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
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
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{
            headerShown: true,
            headerTitle: 'Checkout',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="OrderConfirmation"
          component={OrderConfirmationScreen}
          options={{
            headerShown: true,
            headerTitle: 'Order Confirmation',
            headerLeft: () => null,
            presentation: 'card',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
