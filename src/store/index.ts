// Redux store configuration
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import localforage from 'localforage';
import { pluginRegistry } from './plugin-registry';
import usersReducer from './entities/users';
import communitiesReducer from './entities/communities';
import uiSlice from './ui';
import relationshipsSlice from './relationships';

// Configure localForage for IndexedDB persistence
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'SkoolPluginsDB',
  version: 1.0,
  storeName: 'redux_state',
  description: 'Redux state persistence for Skool plugins'
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: localforage,
  whitelist: ['entities', 'ui', 'relationships'],
  transforms: [
    // Transform to handle Date objects
    {
      in: (inboundState: any) => {
        // Convert Date objects to ISO strings for storage
        return JSON.parse(JSON.stringify(inboundState, (key, value) => {
          if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() };
          }
          return value;
        }));
      },
      out: (outboundState: any) => {
        // Convert ISO strings back to Date objects
        return JSON.parse(JSON.stringify(outboundState), (key, value) => {
          if (value && typeof value === 'object' && value.__type === 'Date') {
            return new Date(value.value);
          }
          return value;
        });
      }
    }
  ]
};

// Create root reducer with plugin support
function createRootReducer() {
  const staticReducers = {
    entities: combineReducers({
      users: usersReducer,
      communities: communitiesReducer,
      // Plugin reducers will be added dynamically
      ...pluginRegistry.createPluginReducers()
    }),
    ui: uiSlice.reducer,
    relationships: relationshipsSlice.reducer
  };

  return combineReducers(staticReducers);
}

// Create store
const rootReducer = persistReducer(persistConfig, createRootReducer());

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'persist/FLUSH'
        ],
        ignoredPaths: ['_persist']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export const persistor = persistStore(store);

// Type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hook for typed dispatch
export const useAppDispatch = () => store.dispatch as AppDispatch;

// Recreate store when plugins change
export function recreateStore() {
  console.log('🔄 Recreating Redux store with updated plugins...');
  const newRootReducer = persistReducer(persistConfig, createRootReducer());
  store.replaceReducer(newRootReducer);
}

// Auto-recreate store when plugins are installed/uninstalled
const originalInstall = pluginRegistry.install.bind(pluginRegistry);
const originalUninstall = pluginRegistry.uninstall.bind(pluginRegistry);

pluginRegistry.install = function(pluginId: string) {
  originalInstall(pluginId);
  recreateStore();
};

pluginRegistry.uninstall = function(pluginId: string) {
  originalUninstall(pluginId);
  recreateStore();
};

export default store;