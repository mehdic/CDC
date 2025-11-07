/**
 * Redux Store Configuration
 * Configures the Redux store with slices and middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import prescriptionReducer from './prescriptionSlice';

// Persist configuration for prescriptions
const prescriptionPersistConfig = {
  key: 'prescriptions',
  storage: AsyncStorage,
  whitelist: ['prescriptions'], // Only persist prescriptions array
  blacklist: ['loading', 'uploading', 'error'], // Don't persist temporary state
};

// Create persisted reducer
const persistedPrescriptionReducer = persistReducer(
  prescriptionPersistConfig,
  prescriptionReducer
);

// Configure store
export const store = configureStore({
  reducer: {
    prescriptions: persistedPrescriptionReducer,
    // Add more reducers here as needed (auth, profile, etc.)
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
