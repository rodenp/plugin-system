import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventBus } from '@course-framework/core/event-bus';

// ============================================================================
// FEATURE FLAGS PLUGIN
// ============================================================================

export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: {
    userRoles?: string[];
    userPermissions?: string[];
    planLevels?: Array<'basic' | 'pro' | 'enterprise'>;
    customConditions?: Array<{
      key: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    }>;
  };
  environments?: Array<'development' | 'staging' | 'production'>;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagsConfig {
  provider: 'local' | 'launchdarkly' | 'split' | 'optimizely' | 'custom';
  apiKey?: string;
  endpoint?: string;
  environment?: string;
  userId?: string;
  defaultFlags: FeatureFlag[];
  enableAnalytics?: boolean;
  refreshInterval?: number; // in seconds
}

export interface PermissionRule {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  conditions?: {
    userRoles?: string[];
    userPermissions?: string[];
    planLevels?: Array<'basic' | 'pro' | 'enterprise'>;
    resourceOwnership?: boolean;
    customConditions?: Array<{
      key: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    }>;
  };
}

// ============================================================================
// REDUX SLICE
// ============================================================================

interface FeatureFlagsState {
  config: FeatureFlagsConfig | null;
  flags: Record<string, FeatureFlag>;
  permissions: Record<string, PermissionRule>;
  userFlags: Record<string, boolean>; // Resolved flags for current user
  userPermissions: Record<string, boolean>; // Resolved permissions for current user
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

const initialState: FeatureFlagsState = {
  config: null,
  flags: {},
  permissions: {},
  userFlags: {},
  userPermissions: {},
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const initializeFeatureFlags = createAsyncThunk(
  'featureFlags/initialize',
  async (config: FeatureFlagsConfig) => {
    let provider: any;
    
    switch (config.provider) {
      case 'launchdarkly':
        provider = await initializeLaunchDarkly(config);
        break;
      case 'split':
        provider = await initializeSplit(config);
        break;
      case 'optimizely':
        provider = await initializeOptimizely(config);
        break;
      case 'custom':
        provider = await initializeCustomProvider(config);
        break;
      default:
        provider = await initializeLocalProvider(config);
    }
    
    // Store provider globally
    (window as any).__featureFlagsProvider = provider;
    
    return { config, provider };
  }
);

export const loadFeatureFlags = createAsyncThunk(
  'featureFlags/loadFlags',
  async ({ userId, userContext }: { userId?: string; userContext?: Record<string, any> }) => {
    const provider = (window as any).__featureFlagsProvider;
    if (!provider) {
      throw new Error('Feature flags provider not initialized');
    }
    
    const flags = await provider.getAllFlags(userId, userContext);
    return { flags, userId };
  }
);

export const evaluateFlag = createAsyncThunk(
  'featureFlags/evaluateFlag',
  async ({ flagId, userId, userContext, defaultValue }: {
    flagId: string;
    userId?: string;
    userContext?: Record<string, any>;
    defaultValue?: boolean;
  }) => {
    const provider = (window as any).__featureFlagsProvider;
    if (!provider) {
      return { flagId, value: defaultValue || false };
    }
    
    const value = await provider.isEnabled(flagId, userId, userContext, defaultValue);
    return { flagId, value };
  }
);

export const updateFeatureFlag = createAsyncThunk(
  'featureFlags/updateFlag',
  async (flag: FeatureFlag) => {
    const provider = (window as any).__featureFlagsProvider;
    if (provider && provider.updateFlag) {
      await provider.updateFlag(flag);
    }
    
    return flag;
  }
);

// ============================================================================
// SLICE DEFINITION
// ============================================================================

const featureFlagsSlice = createSlice({
  name: 'featureFlags',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<FeatureFlagsConfig>) => {
      state.config = action.payload;
    },
    setFlag: (state, action: PayloadAction<FeatureFlag>) => {
      state.flags[action.payload.id] = action.payload;
      eventBus.emit('feature-flag:updated', action.payload);
    },
    setFlags: (state, action: PayloadAction<Record<string, FeatureFlag>>) => {
      state.flags = action.payload;
      state.lastUpdated = new Date();
    },
    setUserFlag: (state, action: PayloadAction<{ flagId: string; value: boolean }>) => {
      state.userFlags[action.payload.flagId] = action.payload.value;
    },
    setUserFlags: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.userFlags = action.payload;
    },
    addPermissionRule: (state, action: PayloadAction<PermissionRule>) => {
      state.permissions[action.payload.id] = action.payload;
    },
    removePermissionRule: (state, action: PayloadAction<string>) => {
      delete state.permissions[action.payload];
    },
    setUserPermission: (state, action: PayloadAction<{ permission: string; value: boolean }>) => {
      state.userPermissions[action.payload.permission] = action.payload.value;
    },
    setUserPermissions: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.userPermissions = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeFeatureFlags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeFeatureFlags.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload.config;
        
        // Set default flags
        action.payload.config.defaultFlags.forEach(flag => {
          state.flags[flag.id] = flag;
        });
      })
      .addCase(initializeFeatureFlags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to initialize feature flags';
      })
      .addCase(loadFeatureFlags.fulfilled, (state, action) => {
        state.userFlags = action.payload.flags;
        state.lastUpdated = new Date();
      })
      .addCase(evaluateFlag.fulfilled, (state, action) => {
        state.userFlags[action.payload.flagId] = action.payload.value;
      })
      .addCase(updateFeatureFlag.fulfilled, (state, action) => {
        state.flags[action.payload.id] = action.payload;
      });
  },
});

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

async function initializeLaunchDarkly(config: FeatureFlagsConfig) {
  console.warn('LaunchDarkly integration not available in this build. Using local provider instead.');
  return initializeLocalProvider(config);
}

async function initializeSplit(config: FeatureFlagsConfig) {
  console.warn('Split integration not available in this build. Using local provider instead.');
  return initializeLocalProvider(config);
}

async function initializeOptimizely(config: FeatureFlagsConfig) {
  console.warn('Optimizely integration not available in this build. Using local provider instead.');
  return initializeLocalProvider(config);
}

async function initializeCustomProvider(config: FeatureFlagsConfig) {
  return {
    isEnabled: async (flagId: string, userId?: string, context?: any, defaultValue = false) => {
      const response = await fetch(`${config.endpoint}/flags/${flagId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          userId,
          context
        })
      });
      
      if (!response.ok) return defaultValue;
      const data = await response.json();
      return data.enabled || defaultValue;
    },
    getAllFlags: async (userId?: string, context?: any) => {
      const response = await fetch(`${config.endpoint}/flags`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          userId,
          context
        })
      });
      
      if (!response.ok) return {};
      return response.json();
    }
  };
}

async function initializeLocalProvider(config: FeatureFlagsConfig) {
  return {
    isEnabled: (flagId: string, userId?: string, context?: any, defaultValue = false) => {
      const flag = config.defaultFlags?.find(f => f.id === flagId);
      if (!flag) return defaultValue;
      
      // Check conditions
      if (flag.conditions) {
        // Simplified condition checking - in real implementation, this would be more robust
        if (flag.conditions.userRoles && context?.role && !flag.conditions.userRoles.includes(context.role)) {
          return false;
        }
        if (flag.conditions.planLevels && context?.planLevel && !flag.conditions.planLevels.includes(context.planLevel)) {
          return false;
        }
      }
      
      // Check rollout percentage
      if (flag.rolloutPercentage && flag.rolloutPercentage < 100) {
        const hash = userId ? hashString(userId) : Math.random();
        if (hash > flag.rolloutPercentage / 100) {
          return false;
        }
      }
      
      return flag.enabled;
    },
    getAllFlags: (userId?: string, context?: any) => {
      const flags: Record<string, boolean> = {};
      config.defaultFlags?.forEach(flag => {
        flags[flag.id] = flag.enabled; // Simplified - would use isEnabled logic
      });
      return flags;
    },
    updateFlag: (flag: FeatureFlag) => {
      // For local provider, we just update in memory
      const index = config.defaultFlags?.findIndex(f => f.id === flag.id);
      if (index !== -1 && config.defaultFlags) {
        config.defaultFlags[index] = flag;
      }
      return Promise.resolve();
    }
  };
}

// Simple string hashing function for rollout percentage
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
}

// ============================================================================
// PLUGIN FACTORY
// ============================================================================

export function createFeatureFlagsPlugin(config: FeatureFlagsConfig) {
  return {
    id: 'feature-flags',
    name: 'Feature Flags & Permissions',
    version: '1.0.0',
    
    initialize: async () => {
      const store = (window as any).__courseFrameworkStore;
      if (store) {
        await store.dispatch(initializeFeatureFlags(config));
      }
    },
    
    config: {
      featureFlags: config,
    },
    
    slice: featureFlagsSlice,
    
    utils: {
      isEnabled: (flagId: string, defaultValue = false) => {
        const store = (window as any).__courseFrameworkStore;
        if (!store) return defaultValue;
        
        const state = store.getState();
        return state.featureFlags?.userFlags[flagId] ?? defaultValue;
      },
      
      hasPermission: (permission: string) => {
        const store = (window as any).__courseFrameworkStore;
        if (!store) return false;
        
        const state = store.getState();
        return state.featureFlags?.userPermissions[permission] ?? false;
      },
      
      // Common feature flags for course platforms
      canCreateCourse: () => {
        const store = (window as any).__courseFrameworkStore;
        if (!store) return false;
        
        const state = store.getState();
        return state.featureFlags?.userFlags['create_course'] ?? false;
      },
      
      canAccessAnalytics: () => {
        const store = (window as any).__courseFrameworkStore;
        if (!store) return false;
        
        const state = store.getState();
        return state.featureFlags?.userFlags['access_analytics'] ?? false;
      },
      
      canExportCourse: () => {
        const store = (window as any).__courseFrameworkStore;
        if (!store) return false;
        
        const state = store.getState();
        return state.featureFlags?.userFlags['export_course'] ?? false;
      }
    },
    
    // Event handlers
    onUserChanged: (user: any) => {
      const store = (window as any).__courseFrameworkStore;
      if (store && user) {
        store.dispatch(loadFeatureFlags({
          userId: user.id,
          userContext: {
            role: user.role,
            planLevel: user.plan?.level,
            permissions: user.permissions
          }
        }));
      }
    }
  };
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useAppSelector, useAppDispatch } from '@course-framework/core/store';

export function useFeatureFlags() {
  const dispatch = useAppDispatch();
  const { config, flags, userFlags, userPermissions, loading, error } = useAppSelector(
    (state: any) => state.featureFlags || initialState
  );
  
  return {
    config,
    flags,
    userFlags,
    userPermissions,
    loading,
    error,
    
    // Flag checking
    isEnabled: (flagId: string, defaultValue = false) => userFlags[flagId] ?? defaultValue,
    hasPermission: (permission: string) => userPermissions[permission] ?? false,
    
    // Actions
    loadFlags: (userId?: string, userContext?: Record<string, any>) => 
      dispatch(loadFeatureFlags({ userId, userContext })),
    evaluateFlag: (flagId: string, userId?: string, userContext?: Record<string, any>, defaultValue?: boolean) =>
      dispatch(evaluateFlag({ flagId, userId, userContext, defaultValue })),
    updateFlag: (flag: FeatureFlag) => dispatch(updateFeatureFlag(flag)),
    
    // Common course platform flags
    canCreateCourse: userFlags['create_course'] ?? false,
    canAccessAnalytics: userFlags['access_analytics'] ?? false,
    canExportCourse: userFlags['export_course'] ?? false,
    canManageUsers: userFlags['manage_users'] ?? false,
    canAccessBilling: userFlags['access_billing'] ?? false,
  };
}

export const featureFlagsActions = featureFlagsSlice.actions;
export default featureFlagsSlice.reducer;