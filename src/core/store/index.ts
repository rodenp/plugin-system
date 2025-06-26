import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { eventBus } from '../event-bus';

// ============================================================================
// STATE INTERFACES (same as before but with Redux actions)
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'admin';
  customerId?: string;
  permissions: string[];
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  level: 'basic' | 'pro' | 'enterprise';
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    maxCourses: number;
    maxStudents: number;
    storageGB: number;
    apiCalls: number;
  };
  isPopular?: boolean;
  trialDays?: number;
}

export interface BillingState {
  currentPlan?: SubscriptionPlan;
  subscription?: {
    id: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
  paymentMethod?: {
    id: string;
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    date: Date;
    downloadUrl?: string;
  }>;
  loading: boolean;
  error: string | null;
}

export interface AppConfiguration {
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  cdnUrl?: string;
  version: string;
  stripe: {
    publishableKey: string;
    testMode: boolean;
  };
  analytics: {
    enabled: boolean;
    trackingId?: string;
  };
  branding: {
    appName: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

// ============================================================================
// USER SLICE
// ============================================================================

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialUserState: UserState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.error = null;
      
      // Emit event for plugins
      eventBus.emit('user:changed', action.payload);
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        eventBus.emit('user:updated', action.payload);
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

// ============================================================================
// BILLING SLICE
// ============================================================================

const initialBillingState: BillingState = {
  invoices: [],
  loading: false,
  error: null,
};

const billingSlice = createSlice({
  name: 'billing',
  initialState: initialBillingState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setPlan: (state, action: PayloadAction<SubscriptionPlan>) => {
      state.currentPlan = action.payload;
      eventBus.emit('billing:plan-changed', action.payload);
    },
    setSubscription: (state, action: PayloadAction<BillingState['subscription']>) => {
      state.subscription = action.payload;
      eventBus.emit('billing:subscription-changed', action.payload);
    },
    setPaymentMethod: (state, action: PayloadAction<BillingState['paymentMethod']>) => {
      state.paymentMethod = action.payload;
    },
    addInvoice: (state, action: PayloadAction<BillingState['invoices'][0]>) => {
      state.invoices.unshift(action.payload);
    },
    setInvoices: (state, action: PayloadAction<BillingState['invoices']>) => {
      state.invoices = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

// ============================================================================
// CONFIG SLICE
// ============================================================================

interface ConfigState {
  config: AppConfiguration | null;
  featureFlags: Record<string, boolean>;
  loading: boolean;
  error: string | null;
}

const initialConfigState: ConfigState = {
  config: null,
  featureFlags: {},
  loading: false,
  error: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState: initialConfigState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setConfig: (state, action: PayloadAction<AppConfiguration>) => {
      state.config = action.payload;
      eventBus.emit('config:loaded', action.payload);
    },
    updateConfig: (state, action: PayloadAction<Partial<AppConfiguration>>) => {
      if (state.config) {
        state.config = { ...state.config, ...action.payload };
        eventBus.emit('config:updated', action.payload);
      }
    },
    setFeatureFlag: (state, action: PayloadAction<{ feature: string; enabled: boolean }>) => {
      state.featureFlags[action.payload.feature] = action.payload.enabled;
      eventBus.emit('feature:toggled', action.payload);
    },
    setFeatureFlags: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.featureFlags = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

// ============================================================================
// UI SLICE
// ============================================================================

interface UIState {
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

const initialUIState: UIState = {
  theme: 'auto',
  sidebarOpen: true,
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUIState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
      eventBus.emit('theme:changed', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp'>>) => {
      const notification = {
        id: `notification-${Date.now()}`,
        timestamp: new Date(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

// Plugin reducers will be added dynamically by plugins themselves
// This avoids circular import issues during initialization

export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    billing: billingSlice.reducer,
    config: configSlice.reducer,
    ui: uiSlice.reducer,
    // Plugin reducers can be added dynamically via store.replaceReducer()
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['billing/addInvoice', 'ui/addNotification'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.timestamp', 'payload.date'],
        // Ignore these paths in the state
        ignoredPaths: ['billing.invoices', 'ui.notifications'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// ============================================================================
// TYPED HOOKS
// ============================================================================

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ============================================================================
// ACTION EXPORTS
// ============================================================================

export const userActions = userSlice.actions;
export const billingActions = billingSlice.actions;
export const configActions = configSlice.actions;
export const uiActions = uiSlice.actions;

// ============================================================================
// SELECTORS
// ============================================================================

// User Selectors
export const selectUser = (state: RootState) => state.user.user;
export const selectIsAuthenticated = (state: RootState) => state.user.isAuthenticated;
export const selectUserLoading = (state: RootState) => state.user.loading;

// Billing Selectors
export const selectCurrentPlan = (state: RootState) => state.billing.currentPlan;
export const selectSubscription = (state: RootState) => state.billing.subscription;
export const selectInvoices = (state: RootState) => state.billing.invoices;
export const selectBillingLoading = (state: RootState) => state.billing.loading;

// Config Selectors
export const selectConfig = (state: RootState) => state.config.config;
export const selectFeatureFlags = (state: RootState) => state.config.featureFlags;

// UI Selectors
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectNotifications = (state: RootState) => state.ui.notifications;

// Computed Selectors
export const selectHasFeature = (feature: string) => (state: RootState) => {
  const featureFlags = selectFeatureFlags(state);
  const currentPlan = selectCurrentPlan(state);
  
  if (featureFlags[feature] === false) return false;
  if (!currentPlan) return false;
  
  return currentPlan.features.includes(feature);
};

export const selectHasPermission = (permission: string) => (state: RootState) => {
  const user = selectUser(state);
  return user?.permissions.includes(permission) ?? false;
};

export const selectHasPlanAccess = (requiredPlan: 'basic' | 'pro' | 'enterprise') => (state: RootState) => {
  const currentPlan = selectCurrentPlan(state);
  if (!currentPlan) return requiredPlan === 'basic';
  
  const planHierarchy = { basic: 0, pro: 1, enterprise: 2 };
  const userLevel = planHierarchy[currentPlan.level];
  const requiredLevel = planHierarchy[requiredPlan];
  
  return userLevel >= requiredLevel;
};

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export function useUser() {
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectUserLoading);
  const dispatch = useAppDispatch();

  return {
    user,
    isAuthenticated,
    loading,
    setUser: (user: User | null) => dispatch(userActions.setUser(user)),
    updateUser: (updates: Partial<User>) => dispatch(userActions.updateUser(updates)),
  };
}

export function useBilling() {
  const currentPlan = useAppSelector(selectCurrentPlan);
  const subscription = useAppSelector(selectSubscription);
  const invoices = useAppSelector(selectInvoices);
  const loading = useAppSelector(selectBillingLoading);
  const dispatch = useAppDispatch();

  return {
    currentPlan,
    subscription,
    invoices,
    loading,
    setPlan: (plan: SubscriptionPlan) => dispatch(billingActions.setPlan(plan)),
    setSubscription: (sub: BillingState['subscription']) => dispatch(billingActions.setSubscription(sub)),
  };
}

export function useFeatures() {
  const featureFlags = useAppSelector(selectFeatureFlags);
  const dispatch = useAppDispatch();

  return {
    featureFlags,
    hasFeature: (feature: string) => useAppSelector(selectHasFeature(feature)),
    setFeature: (feature: string, enabled: boolean) => dispatch(configActions.setFeatureFlag({ feature, enabled })),
  };
}

export function usePermissions() {
  return {
    hasPermission: (permission: string) => useAppSelector(selectHasPermission(permission)),
    hasPlanAccess: (plan: 'basic' | 'pro' | 'enterprise') => useAppSelector(selectHasPlanAccess(plan)),
  };
}

export function useNotifications() {
  const notifications = useAppSelector(selectNotifications);
  const dispatch = useAppDispatch();

  return {
    notifications,
    addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => 
      dispatch(uiActions.addNotification(notification)),
    removeNotification: (id: string) => dispatch(uiActions.removeNotification(id)),
    clearNotifications: () => dispatch(uiActions.clearNotifications()),
  };
}

// Re-export from provider
export { AppStoreProvider } from './provider';

// ============================================================================
// DYNAMIC PLUGIN REDUCER REGISTRATION
// ============================================================================

/**
 * Plugins can register their reducers here
 * This will be called by plugin initialization
 */
const pluginReducers: Record<string, any> = {};

export function registerPluginReducer(name: string, reducer: any) {
  pluginReducers[name] = reducer;
}

export function getPluginReducers() {
  return pluginReducers;
}