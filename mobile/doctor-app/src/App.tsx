/**
 * Doctor App - Main Entry Point
 * T122: Initialize Doctor App with navigation and authentication
 *
 * Features:
 * - Navigation setup for prescription creation workflow
 * - Authentication state management
 * - Theme configuration
 * - Error boundary
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import CreatePrescriptionScreen from './screens/CreatePrescriptionScreen';
import SendConfirmationScreen from './screens/SendConfirmationScreen';

// Navigation
import { RootStackParamList } from './navigation/types';

// ============================================================================
// Navigation Stack
// ============================================================================

const Stack = createStackNavigator<RootStackParamList>();

// ============================================================================
// Theme Configuration
// ============================================================================

const theme = {
  colors: {
    primary: '#2196F3',
    secondary: '#03DAC6',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    error: '#B00020',
    success: '#4CAF50',
    warning: '#FF9800',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: 'bold' },
    h2: { fontSize: 24, fontWeight: 'bold' },
    h3: { fontSize: 20, fontWeight: '600' },
    body1: { fontSize: 16, fontWeight: 'normal' },
    body2: { fontSize: 14, fontWeight: 'normal' },
    caption: { fontSize: 12, fontWeight: 'normal' },
  },
};

// ============================================================================
// Auth State Management (simplified for MVP)
// ============================================================================

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'doctor';
  } | null;
  loading: boolean;
}

const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    // Check for stored auth token
    const checkAuth = async () => {
      try {
        // In production, verify token with backend
        const token = await getStoredToken();

        if (token) {
          // Mock user data for MVP
          setAuthState({
            isAuthenticated: true,
            user: {
              id: 'doctor-123',
              email: 'doctor@example.com',
              first_name: 'Dr. John',
              last_name: 'Smith',
              role: 'doctor',
            },
            loading: false,
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    };

    checkAuth();
  }, []);

  return authState;
};

// Helper function to get stored token (mock for MVP)
const getStoredToken = async (): Promise<string | null> => {
  // In production: use AsyncStorage or SecureStore
  // For MVP, assume authenticated
  return 'mock-token-12345';
};

// ============================================================================
// Loading Screen
// ============================================================================

const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// ============================================================================
// Login Screen (Placeholder)
// ============================================================================

const LoginScreen: React.FC = () => (
  <View style={styles.loginContainer}>
    <Text style={styles.loginTitle}>Doctor Login</Text>
    <Text style={styles.loginSubtitle}>
      Authentication required. Please use HIN e-ID or email/password.
    </Text>
  </View>
);

// ============================================================================
// Main App Component
// ============================================================================

const App: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Show login if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="CreatePrescription"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="CreatePrescription"
            component={CreatePrescriptionScreen}
            options={{
              title: 'Create Prescription',
              headerLeft: undefined, // No back button on main screen
            }}
          />
          <Stack.Screen
            name="SendConfirmation"
            component={SendConfirmationScreen}
            options={{
              title: 'Confirm & Send',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  loginTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  loginSubtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default App;
export { theme };
