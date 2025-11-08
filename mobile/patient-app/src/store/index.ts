/**
 * Redux Store Configuration
 * Configures the Redux store with slices and middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import prescriptionReducer from './prescriptionSlice';
import teleconsultationReducer from './teleconsultationSlice';

// Persist configuration for prescriptions
const prescriptionPersistConfig = {
  key: 'prescriptions',
  storage: AsyncStorage,
  whitelist: ['prescriptions'], // Only persist prescriptions array
  blacklist: ['loading', 'uploading', 'error'], // Don't persist temporary state
};

// Persist configuration for teleconsultations
const teleconsultationPersistConfig = {
  key: 'teleconsultations',
  storage: AsyncStorage,
  whitelist: ['consultations'], // Only persist consultations array
  blacklist: ['loading', 'booking', 'error', 'currentSession'], // Don't persist temporary state
};

// Create persisted reducers
const persistedPrescriptionReducer = persistReducer(
  prescriptionPersistConfig,
  prescriptionReducer
);

const persistedTeleconsultationReducer = persistReducer(
  teleconsultationPersistConfig,
  teleconsultationReducer
);

// Configure store
export const store = configureStore({
  reducer: {
    prescriptions: persistedPrescriptionReducer,
    teleconsultation: persistedTeleconsultationReducer,
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
