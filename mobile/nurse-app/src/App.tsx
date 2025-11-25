/**
 * Nurse App - Main Entry Point
 * MetaPharm Connect - Nurse Mobile Application
 *
 * Features:
 * - HIN e-ID authentication with MFA
 * - Patient search and medication management
 * - Medication administration recording
 * - Barcode scanning for verification
 * - Delivery tracking
 * - Secure messaging with pharmacists
 * - Shift handover notes
 * - Adverse reaction reporting
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, persistor } from './store';
import AppNavigator from './navigation/AppNavigator';

/**
 * App Component
 * Root component of the Nurse App
 */
const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            <AppNavigator />
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
