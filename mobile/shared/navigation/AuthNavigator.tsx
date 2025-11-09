/**
 * Auth Navigator
 * Navigation flow for authentication screens
 * Handles Login, Register, MFA verification, and Password reset flows
 */

import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';

/**
 * Auth stack param list
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: { userType?: string };
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  MFAVerification: { userId: string; method: 'sms' | 'email' | 'app' };
  BiometricSetup: undefined;
};

/**
 * Auth navigator props
 */
interface AuthNavigatorProps {
  loginScreen: React.ComponentType<any>;
  registerScreen: React.ComponentType<any>;
  forgotPasswordScreen?: React.ComponentType<any>;
  resetPasswordScreen?: React.ComponentType<any>;
  mfaVerificationScreen?: React.ComponentType<any>;
  biometricSetupScreen?: React.ComponentType<any>;
  initialRouteName?: keyof AuthStackParamList;
}

/**
 * Create stack navigator
 */
const Stack = createStackNavigator<AuthStackParamList>();

/**
 * Default screen options for auth screens
 */
const defaultScreenOptions: StackNavigationOptions = {
  headerShown: false,
  cardStyle: {
    backgroundColor: '#FFFFFF',
  },
  animationEnabled: true,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
};

/**
 * Auth Navigator Component
 */
export const AuthNavigator: React.FC<AuthNavigatorProps> = ({
  loginScreen: LoginScreen,
  registerScreen: RegisterScreen,
  forgotPasswordScreen: ForgotPasswordScreen,
  resetPasswordScreen: ResetPasswordScreen,
  mfaVerificationScreen: MFAVerificationScreen,
  biometricSetupScreen: BiometricSetupScreen,
  initialRouteName = 'Login',
}) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={defaultScreenOptions}
    >
      {/* Login screen */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'Connexion',
        }}
      />

      {/* Register screen */}
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: 'Inscription',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerTintColor: '#007AFF',
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E9ECEF',
          },
        }}
      />

      {/* Forgot password screen */}
      {ForgotPasswordScreen && (
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{
            title: 'Mot de passe oublié',
            headerShown: true,
            headerBackTitle: 'Retour',
            headerTintColor: '#007AFF',
            headerStyle: {
              backgroundColor: '#FFFFFF',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#E9ECEF',
            },
          }}
        />
      )}

      {/* Reset password screen */}
      {ResetPasswordScreen && (
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{
            title: 'Réinitialiser le mot de passe',
            headerShown: true,
            headerBackTitle: 'Retour',
            headerTintColor: '#007AFF',
            headerStyle: {
              backgroundColor: '#FFFFFF',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#E9ECEF',
            },
          }}
        />
      )}

      {/* MFA verification screen */}
      {MFAVerificationScreen && (
        <Stack.Screen
          name="MFAVerification"
          component={MFAVerificationScreen}
          options={{
            title: 'Vérification à deux facteurs',
            headerShown: true,
            headerBackTitle: 'Retour',
            headerTintColor: '#007AFF',
            headerStyle: {
              backgroundColor: '#FFFFFF',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#E9ECEF',
            },
            // Prevent going back during MFA verification
            gestureEnabled: false,
            headerLeft: () => null,
          }}
        />
      )}

      {/* Biometric setup screen (optional after login/register) */}
      {BiometricSetupScreen && (
        <Stack.Screen
          name="BiometricSetup"
          component={BiometricSetupScreen}
          options={{
            title: 'Configuration biométrique',
            headerShown: true,
            headerBackTitle: 'Ignorer',
            headerTintColor: '#007AFF',
            headerStyle: {
              backgroundColor: '#FFFFFF',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#E9ECEF',
            },
          }}
        />
      )}
    </Stack.Navigator>
  );
};

/**
 * Helper hook to access auth navigation
 */
export const useAuthNavigation = () => {
  const { navigate } = require('@react-navigation/native');

  return {
    navigateToLogin: () => navigate('Login'),
    navigateToRegister: (userType?: string) => navigate('Register', { userType }),
    navigateToForgotPassword: () => navigate('ForgotPassword'),
    navigateToResetPassword: (token: string) => navigate('ResetPassword', { token }),
    navigateToMFAVerification: (
      userId: string,
      method: 'sms' | 'email' | 'app'
    ) => navigate('MFAVerification', { userId, method }),
    navigateToBiometricSetup: () => navigate('BiometricSetup'),
  };
};

/**
 * Export navigator and utilities
 */
export default AuthNavigator;
