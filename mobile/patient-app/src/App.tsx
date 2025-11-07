/**
 * Patient App - Main Entry Point
 * MetaPharm Connect - Patient Mobile Application
 *
 * Features:
 * - Prescription upload (camera + gallery)
 * - Prescription list with status tracking
 * - Prescription detail view with transcription data
 * - Real-time status updates
 * - Offline support with Redux Persist
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
 * Root component of the Patient App
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
