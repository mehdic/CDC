/**
 * Redux Store Configuration
 * Combines auth and delivery slices with persistence
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './authSlice';
import deliveryReducer from './deliverySlice';

/**
 * Persist Configuration
 */
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'delivery'], // Persist both slices
};

/**
 * Root Reducer
 */
const rootReducer = combineReducers({
  auth: authReducer,
  delivery: deliveryReducer,
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
