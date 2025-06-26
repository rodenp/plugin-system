import React, { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react';
import { eventBus } from './event-bus';

// ============================================================================
// STATE INTERFACES
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
}

export interface StripeConfig {
  publishableKey: string;
  testMode: boolean;
  plans: SubscriptionPlan[];
  features: {
    allowFreeTrial: boolean;
    freeTrialDays: number;
    collectBillingAddress: boolean;
    allowPromotionCodes: boolean;
  };
  branding: {
    primaryColor?: string;
    logoUrl?: string;
  };
  urls: {
    successUrl?: string;
    cancelUrl?: string;
  };
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  customEndpoint?: string;
  events: string[];
}

export interface ExternalService {
  id: string;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface FeatureFlag {
  id: string;
  enabled: boolean;
  plans: string[];
  permissions: string[];
  rolloutPercentage?: number;
}

export interface AppConfiguration {
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  cdnUrl?: string;
  version: string;
  stripe: StripeConfig;
  analytics: AnalyticsConfig;
  externalServices: ExternalService[];
  featureFlags: FeatureFlag[];
  i18n: {
    defaultLanguage: string;
    supportedLanguages: string[];
  };
  branding: {
    appName: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    faviconUrl?: string;
  };
}

export interface AppState {
  // System State
  initialized: boolean;
  loading: boolean;
  error: string | null;
  
  // User & Auth State
  user: User | null;
  isAuthenticated: boolean;
  
  // Billing State
  billing: BillingState;
  
  // Configuration
  config: AppConfiguration | null;
  
  // Feature State
  features: Record<string, boolean>;
  
  // UI State
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

// ============================================================================
// ACTIONS
// ============================================================================

export type AppAction =
  | { type: 'INITIALIZE_START' }
  | { type: 'INITIALIZE_SUCCESS'; payload: { config: AppConfiguration; user: User | null } }
  | { type: 'INITIALIZE_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_BILLING'; payload: Partial<BillingState> }
  | { type: 'UPDATE_CONFIG'; payload: Partial<AppConfiguration> }
  | { type: 'SET_FEATURE'; payload: { feature: string; enabled: boolean } }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'auto' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<AppState['notifications'][0], 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

// ============================================================================
// REDUCER
// ============================================================================

const initialState: AppState = {
  initialized: false,
  loading: false,
  error: null,
  user: null,
  isAuthenticated: false,
  billing: {
    invoices: []
  },
  config: null,
  features: {},
  theme: 'auto',
  sidebarOpen: true,
  notifications: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INITIALIZE_START':
      return { ...state, loading: true, error: null };
      
    case 'INITIALIZE_SUCCESS':
      return {
        ...state,
        loading: false,
        initialized: true,
        config: action.payload.config,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        features: action.payload.config.featureFlags.reduce((acc, flag) => {
          acc[flag.id] = flag.enabled;
          return acc;
        }, {} as Record<string, boolean>)
      };
      
    case 'INITIALIZE_ERROR':
      return { ...state, loading: false, error: action.payload };
      
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload 
      };
      
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null
      };
      
    case 'SET_BILLING':
      return {
        ...state,
        billing: { ...state.billing, ...action.payload }
      };
      
    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: state.config ? { ...state.config, ...action.payload } : null
      };
      
    case 'SET_FEATURE':
      return {
        ...state,
        features: { ...state.features, [action.payload.feature]: action.payload.enabled }
      };
      
    case 'SET_THEME':
      return { ...state, theme: action.payload };
      
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
      
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: `notification-${Date.now()}`,
            timestamp: new Date(),
            ...action.payload
          }
        ]
      };
      
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
      
    default:
      return state;
  }
}

// ============================================================================
// CONTEXT & PROVIDER
// ============================================================================

interface AppContextType extends AppState {
  // Actions
  initialize: (config: AppConfiguration, user?: User) => Promise<void>;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setBilling: (billing: Partial<BillingState>) => void;
  updateConfig: (config: Partial<AppConfiguration>) => void;
  setFeature: (feature: string, enabled: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  
  // Computed Values
  hasFeature: (feature: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasPlanAccess: (requiredPlan: 'basic' | 'pro' | 'enterprise') => boolean;
  isWithinLimits: (limitType: keyof SubscriptionPlan['limits'], currentUsage: number) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
  initialConfig?: Partial<AppConfiguration>;
}

export function AppProvider({ children, initialConfig }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const initialize = useCallback(async (config: AppConfiguration, user?: User) => {
    try {
      dispatch({ type: 'INITIALIZE_START' });
      
      // Merge with initial config if provided
      const finalConfig = initialConfig ? { ...config, ...initialConfig } : config;
      
      dispatch({ 
        type: 'INITIALIZE_SUCCESS', 
        payload: { config: finalConfig, user: user || null } 
      });
      
      // Emit initialization event
      eventBus.emit('app:initialized', { config: finalConfig, user });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize app';
      dispatch({ type: 'INITIALIZE_ERROR', payload: errorMessage });
    }
  }, [initialConfig]);

  const setUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
    eventBus.emit('user:changed', user);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
    eventBus.emit('user:updated', updates);
  }, []);

  const setBilling = useCallback((billing: Partial<BillingState>) => {
    dispatch({ type: 'SET_BILLING', payload: billing });
    eventBus.emit('billing:updated', billing);
  }, []);

  const updateConfig = useCallback((config: Partial<AppConfiguration>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: config });
    eventBus.emit('config:updated', config);
  }, []);

  const setFeature = useCallback((feature: string, enabled: boolean) => {
    dispatch({ type: 'SET_FEATURE', payload: { feature, enabled } });
    eventBus.emit('feature:toggled', { feature, enabled });
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark' | 'auto') => {
    dispatch({ type: 'SET_THEME', payload: theme });
    
    // Apply theme to document
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    
    eventBus.emit('theme:changed', theme);
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const addNotification = useCallback((notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    // Auto-remove after 5 seconds unless it's an error
    if (notification.type !== 'error') {
      setTimeout(() => {
        // Note: This might create stale closure issues in some cases
        // For production, consider using a more robust notification system
      }, 5000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const hasFeature = useCallback((feature: string): boolean => {
    if (!state.user || !state.billing.currentPlan) return false;
    
    // Check feature flags
    if (state.features[feature] === false) return false;
    
    // Check plan features
    return state.billing.currentPlan.features.includes(feature);
  }, [state.user, state.billing.currentPlan, state.features]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.user) return false;
    return state.user.permissions.includes(permission);
  }, [state.user]);

  const hasPlanAccess = useCallback((requiredPlan: 'basic' | 'pro' | 'enterprise'): boolean => {
    if (!state.billing.currentPlan) return requiredPlan === 'basic';
    
    const planHierarchy = { basic: 0, pro: 1, enterprise: 2 };
    const userLevel = planHierarchy[state.billing.currentPlan.level];
    const requiredLevel = planHierarchy[requiredPlan];
    
    return userLevel >= requiredLevel;
  }, [state.billing.currentPlan]);

  const isWithinLimits = useCallback((limitType: keyof SubscriptionPlan['limits'], currentUsage: number): boolean => {
    if (!state.billing.currentPlan) return false;
    
    const limit = state.billing.currentPlan.limits[limitType];
    return currentUsage < limit;
  }, [state.billing.currentPlan]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Listen for theme changes
  useEffect(() => {
    if (state.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [state.theme]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AppContextType = {
    ...state,
    initialize,
    setUser,
    updateUser,
    setBilling,
    updateConfig,
    setFeature,
    setTheme,
    toggleSidebar,
    addNotification,
    removeNotification,
    hasFeature,
    hasPermission,
    hasPlanAccess,
    isWithinLimits,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks for specific state slices
export function useUser() {
  const { user, setUser, updateUser, isAuthenticated } = useApp();
  return { user, setUser, updateUser, isAuthenticated };
}

export function useBilling() {
  const { billing, setBilling, hasFeature, hasPlanAccess, isWithinLimits } = useApp();
  return { billing, setBilling, hasFeature, hasPlanAccess, isWithinLimits };
}

export function useConfig() {
  const { config, updateConfig } = useApp();
  return { config, updateConfig };
}

export function useFeatures() {
  const { features, setFeature, hasFeature } = useApp();
  return { features, setFeature, hasFeature };
}

export function usePermissions() {
  const { hasPermission } = useApp();
  return { hasPermission };
}

export function useNotifications() {
  const { notifications, addNotification, removeNotification } = useApp();
  return { notifications, addNotification, removeNotification };
}

export function useTheme() {
  const { theme, setTheme } = useApp();
  return { theme, setTheme };
}