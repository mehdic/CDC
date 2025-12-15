/**
 * Login Screen
 * Delivery Personnel authentication with HIN e-ID integration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { useAppDispatch } from '../../hooks/useRedux';
import { loginAsync, setHinEIDVerified } from '../../store/authSlice';

/**
 * Login Screen Component
 */
export const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handle Login
   */
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(loginAsync({ email, password })).unwrap();
      // Success - navigation handled by App.tsx based on auth state
    } catch (error: any) {
      Alert.alert('Login Failed', error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle HIN e-ID Login (simulated)
   */
  const handleHinEIDLogin = async () => {
    Alert.alert(
      'HIN e-ID Authentication',
      'This will redirect to HIN e-ID provider for secure authentication',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // In production, this would open HIN e-ID OAuth flow
            // For now, simulate successful verification
            dispatch(setHinEIDVerified(true));
            Alert.alert('Success', 'HIN e-ID verified successfully');
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>MetaPharm Delivery</Text>
          <Text style={styles.subtitle}>Delivery Personnel Login</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="delivery@metapharm.ch"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            testID="email-input"
            accessibilityLabel="Email address input field"
            accessibilityHint="Enter your delivery personnel email address in the format: delivery@metapharm.ch"
            accessibilityRole="text"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            testID="password-input"
            accessibilityLabel="Password input field"
            accessibilityHint="Enter your secure password. Your entry is hidden for security."
            accessibilityRole="text"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            testID="login-button"
            accessibilityLabel="Login button"
            accessibilityHint="Double tap to submit your email and password credentials"
            accessibilityRole="button"
            accessible={true}
          >
            {loading ? (
              <ActivityIndicator
                color="#FFF"
                accessibilityLiveRegion="polite"
                accessibilityLabel="Login in progress"
              />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.buttonHIN]}
            onPress={handleHinEIDLogin}
            disabled={loading}
            testID="hin-eid-button"
            accessibilityLabel="Login with HIN e-ID button"
            accessibilityHint="Double tap to authenticate using your HIN e-ID provider credentials. This is a secure Swiss healthcare authentication method."
            accessibilityRole="button"
            accessible={true}
          >
            <Text style={styles.buttonTextHIN}>Login with HIN e-ID</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPassword}
            accessibilityLabel="Forgot password link"
            accessibilityHint="Double tap to initiate password recovery process"
            accessibilityRole="link"
            accessible={true}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure delivery personnel authentication
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonHIN: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonTextHIN: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default LoginScreen;
