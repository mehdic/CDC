/**
 * Redux Store Configuration
 * Combines auth, patient, and medication slices with persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

import authReducer from './authSlice';
import patientReducer from './patientSlice';
import medicationReducer from './medicationSlice';

/**
 * Persist Configuration
 */
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'medication'], // Don't persist patient search results
};

/**
 * Root Reducer
 */
const rootReducer = combineReducers({
  auth: authReducer,
  patient: patientReducer,
  medication: medicationReducer,
});

/**
 * Persisted Reducer
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configure Store
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

/**
 * Persistor
 */
export const persistor = persistStore(store);

/**
 * TypeScript Types
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
