/**
 * Delivery App - Main Entry Point
 * MetaPharm Connect - Delivery Personnel Mobile Application
 *
 * Features:
 * - GPS tracking with 30-second updates
 * - QR code package verification
 * - Proof of delivery with signature and photo
 * - Route optimization with turn-by-turn navigation
 * - Offline mode with sync queue
 * - Earnings and statistics dashboard
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, persistor } from './store';
import AppNavigator from './navigation/AppNavigator';
import { useOfflineSync } from './hooks/useOfflineSync';

/**
 * Offline Sync Wrapper
 * Enables offline sync hook inside Redux context
 */
const OfflineSyncWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useOfflineSync();
  return <>{children}</>;
};

/**
 * App Component
 * Root component of the Delivery App
 */
const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <OfflineSyncWrapper>
            <SafeAreaProvider>
              <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
              <AppNavigator />
            </SafeAreaProvider>
          </OfflineSyncWrapper>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
