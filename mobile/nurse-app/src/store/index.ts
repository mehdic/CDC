/**
 * Redux Store Configuration
 * Root store setup with Redux Toolkit and Redux Persist
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import patientReducer from './slices/patientSlice';
import medicationReducer from './slices/medicationSlice';

const persistConfig = {
  key: 'nurse-app-root',
  storage: AsyncStorage,
  whitelist: ['auth', 'patients'], // Only persist auth and patients
  blacklist: ['medications'], // Don't persist medications (too dynamic)
};

const rootReducer = combineReducers({
  auth: authReducer,
  patients: patientReducer,
  medications: medicationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
