/**
 * Pharmacist App - Main Application Component
 * React Native app for pharmacist prescription review workflow
 * T105 - User Story 1: Prescription Processing & Validation
 */

import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import queueReducer from './store/queueSlice';

// Screens
import PrescriptionQueueScreen from './screens/PrescriptionQueueScreen';
import PrescriptionReviewScreen from './screens/PrescriptionReviewScreen';
import DoctorMessageScreen from './screens/DoctorMessageScreen';

// ============================================================================
// Redux Store Configuration
// ============================================================================

const store = configureStore({
  reducer: {
    queue: queueReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore serialization warnings for certain action types
        ignoredActions: ['queue/fetchPrescriptionQueue/fulfilled'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ============================================================================
// Navigation Configuration
// ============================================================================

export type RootStackParamList = {
  PrescriptionQueue: undefined;
  PrescriptionReview: { prescriptionId: string };
  DoctorMessage: { prescriptionId: string; doctorId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

// ============================================================================
// Main App Component
// ============================================================================

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="PrescriptionQueue"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#fff',
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
              },
              headerTintColor: '#1F2937',
              headerTitleStyle: {
                fontWeight: '700',
                fontSize: 18,
              },
              headerBackTitleVisible: false,
              cardStyle: {
                backgroundColor: '#F9FAFB',
              },
            }}
          >
            <Stack.Screen
              name="PrescriptionQueue"
              component={PrescriptionQueueScreen}
              options={{
                title: 'Prescription Queue',
                headerShown: false, // Custom header in component
              }}
            />
            <Stack.Screen
              name="PrescriptionReview"
              component={PrescriptionReviewScreen}
              options={{
                title: 'Review Prescription',
                headerBackTitle: 'Queue',
              }}
            />
            <Stack.Screen
              name="DoctorMessage"
              component={DoctorMessageScreen}
              options={{
                title: 'Message Doctor',
                headerBackTitle: 'Review',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </Provider>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
