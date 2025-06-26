import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventBus } from '@course-framework/core/event-bus';
const initialState = {
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
export const initializeFeatureFlags = createAsyncThunk('featureFlags/initialize', async (config) => {
    let provider;
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
    window.__featureFlagsProvider = provider;
    return { config, provider };
});
export const loadFeatureFlags = createAsyncThunk('featureFlags/loadFlags', async ({ userId, userContext }) => {
    const provider = window.__featureFlagsProvider;
    if (!provider) {
        throw new Error('Feature flags provider not initialized');
    }
    const flags = await provider.getAllFlags(userId, userContext);
    return { flags, userId };
});
export const evaluateFlag = createAsyncThunk('featureFlags/evaluateFlag', async ({ flagId, userId, userContext, defaultValue }) => {
    const provider = window.__featureFlagsProvider;
    if (!provider) {
        return { flagId, value: defaultValue || false };
    }
    const value = await provider.isEnabled(flagId, userId, userContext, defaultValue);
    return { flagId, value };
});
export const updateFeatureFlag = createAsyncThunk('featureFlags/updateFlag', async (flag) => {
    const provider = window.__featureFlagsProvider;
    if (provider && provider.updateFlag) {
        await provider.updateFlag(flag);
    }
    return flag;
});
// ============================================================================
// SLICE DEFINITION
// ============================================================================
const featureFlagsSlice = createSlice({
    name: 'featureFlags',
    initialState,
    reducers: {
        setConfig: (state, action) => {
            state.config = action.payload;
        },
        setFlag: (state, action) => {
            state.flags[action.payload.id] = action.payload;
            eventBus.emit('feature-flag:updated', action.payload);
        },
        setFlags: (state, action) => {
            state.flags = action.payload;
            state.lastUpdated = new Date();
        },
        setUserFlag: (state, action) => {
            state.userFlags[action.payload.flagId] = action.payload.value;
        },
        setUserFlags: (state, action) => {
            state.userFlags = action.payload;
        },
        addPermissionRule: (state, action) => {
            state.permissions[action.payload.id] = action.payload;
        },
        removePermissionRule: (state, action) => {
            delete state.permissions[action.payload];
        },
        setUserPermission: (state, action) => {
            state.userPermissions[action.payload.permission] = action.payload.value;
        },
        setUserPermissions: (state, action) => {
            state.userPermissions = action.payload;
        },
        setError: (state, action) => {
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
async function initializeLaunchDarkly(config) {
    console.warn('LaunchDarkly integration not available in this build. Using local provider instead.');
    return initializeLocalProvider(config);
}
async function initializeSplit(config) {
    console.warn('Split integration not available in this build. Using local provider instead.');
    return initializeLocalProvider(config);
}
async function initializeOptimizely(config) {
    console.warn('Optimizely integration not available in this build. Using local provider instead.');
    return initializeLocalProvider(config);
}
async function initializeCustomProvider(config) {
    return {
        isEnabled: async (flagId, userId, context, defaultValue = false) => {
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
            if (!response.ok)
                return defaultValue;
            const data = await response.json();
            return data.enabled || defaultValue;
        },
        getAllFlags: async (userId, context) => {
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
            if (!response.ok)
                return {};
            return response.json();
        }
    };
}
async function initializeLocalProvider(config) {
    return {
        isEnabled: (flagId, userId, context, defaultValue = false) => {
            const flag = config.defaultFlags?.find(f => f.id === flagId);
            if (!flag)
                return defaultValue;
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
        getAllFlags: (userId, context) => {
            const flags = {};
            config.defaultFlags?.forEach(flag => {
                flags[flag.id] = flag.enabled; // Simplified - would use isEnabled logic
            });
            return flags;
        },
        updateFlag: (flag) => {
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
function hashString(str) {
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
export function createFeatureFlagsPlugin(config) {
    return {
        id: 'feature-flags',
        name: 'Feature Flags & Permissions',
        version: '1.0.0',
        initialize: async () => {
            const store = window.__courseFrameworkStore;
            if (store) {
                await store.dispatch(initializeFeatureFlags(config));
            }
        },
        config: {
            featureFlags: config,
        },
        slice: featureFlagsSlice,
        utils: {
            isEnabled: (flagId, defaultValue = false) => {
                const store = window.__courseFrameworkStore;
                if (!store)
                    return defaultValue;
                const state = store.getState();
                return state.featureFlags?.userFlags[flagId] ?? defaultValue;
            },
            hasPermission: (permission) => {
                const store = window.__courseFrameworkStore;
                if (!store)
                    return false;
                const state = store.getState();
                return state.featureFlags?.userPermissions[permission] ?? false;
            },
            // Common feature flags for course platforms
            canCreateCourse: () => {
                const store = window.__courseFrameworkStore;
                if (!store)
                    return false;
                const state = store.getState();
                return state.featureFlags?.userFlags['create_course'] ?? false;
            },
            canAccessAnalytics: () => {
                const store = window.__courseFrameworkStore;
                if (!store)
                    return false;
                const state = store.getState();
                return state.featureFlags?.userFlags['access_analytics'] ?? false;
            },
            canExportCourse: () => {
                const store = window.__courseFrameworkStore;
                if (!store)
                    return false;
                const state = store.getState();
                return state.featureFlags?.userFlags['export_course'] ?? false;
            }
        },
        // Event handlers
        onUserChanged: (user) => {
            const store = window.__courseFrameworkStore;
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
    const { config, flags, userFlags, userPermissions, loading, error } = useAppSelector((state) => state.featureFlags || initialState);
    return {
        config,
        flags,
        userFlags,
        userPermissions,
        loading,
        error,
        // Flag checking
        isEnabled: (flagId, defaultValue = false) => userFlags[flagId] ?? defaultValue,
        hasPermission: (permission) => userPermissions[permission] ?? false,
        // Actions
        loadFlags: (userId, userContext) => dispatch(loadFeatureFlags({ userId, userContext })),
        evaluateFlag: (flagId, userId, userContext, defaultValue) => dispatch(evaluateFlag({ flagId, userId, userContext, defaultValue })),
        updateFlag: (flag) => dispatch(updateFeatureFlag(flag)),
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
