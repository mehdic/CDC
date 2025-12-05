/**
 * Redux Store Configuration - Pharmacist App
 * Configures the Redux store with slices and middleware
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';

import inventoryReducer from './inventorySlice';
import queueReducer from './queueSlice';

// Persist configuration for inventory
const inventoryPersistConfig = {
  key: 'inventory',
  storage: AsyncStorage,
  whitelist: ['items'], // Only persist items array
  blacklist: ['loading', 'error'], // Don't persist temporary state
};

// Persist configuration for prescription queue
const queuePersistConfig = {
  key: 'queue',
  storage: AsyncStorage,
  whitelist: ['prescriptions'], // Only persist prescriptions array
  blacklist: ['loading', 'error'], // Don't persist temporary state
};

// Create persisted reducers
const persistedInventoryReducer = persistReducer(
  inventoryPersistConfig,
  inventoryReducer
);

const persistedQueueReducer = persistReducer(
  queuePersistConfig,
  queueReducer
);

// Configure store
export const store = configureStore({
  reducer: {
    inventory: persistedInventoryReducer,
    queue: persistedQueueReducer,
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
