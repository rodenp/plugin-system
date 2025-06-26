import { configureStore, createSlice } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { eventBus } from '../event-bus';
const initialUserState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};
const userSlice = createSlice({
    name: 'user',
    initialState: initialUserState,
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.error = null;
            // Emit event for plugins
            eventBus.emit('user:changed', action.payload);
        },
        updateUser: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
                eventBus.emit('user:updated', action.payload);
            }
        },
        setError: (state, action) => {
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
const initialBillingState = {
    invoices: [],
    loading: false,
    error: null,
};
const billingSlice = createSlice({
    name: 'billing',
    initialState: initialBillingState,
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setPlan: (state, action) => {
            state.currentPlan = action.payload;
            eventBus.emit('billing:plan-changed', action.payload);
        },
        setSubscription: (state, action) => {
            state.subscription = action.payload;
            eventBus.emit('billing:subscription-changed', action.payload);
        },
        setPaymentMethod: (state, action) => {
            state.paymentMethod = action.payload;
        },
        addInvoice: (state, action) => {
            state.invoices.unshift(action.payload);
        },
        setInvoices: (state, action) => {
            state.invoices = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});
const initialConfigState = {
    config: null,
    featureFlags: {},
    loading: false,
    error: null,
};
const configSlice = createSlice({
    name: 'config',
    initialState: initialConfigState,
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setConfig: (state, action) => {
            state.config = action.payload;
            eventBus.emit('config:loaded', action.payload);
        },
        updateConfig: (state, action) => {
            if (state.config) {
                state.config = { ...state.config, ...action.payload };
                eventBus.emit('config:updated', action.payload);
            }
        },
        setFeatureFlag: (state, action) => {
            state.featureFlags[action.payload.feature] = action.payload.enabled;
            eventBus.emit('feature:toggled', action.payload);
        },
        setFeatureFlags: (state, action) => {
            state.featureFlags = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});
const initialUIState = {
    theme: 'auto',
    sidebarOpen: true,
    notifications: [],
};
const uiSlice = createSlice({
    name: 'ui',
    initialState: initialUIState,
    reducers: {
        setTheme: (state, action) => {
            state.theme = action.payload;
            eventBus.emit('theme:changed', action.payload);
        },
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen: (state, action) => {
            state.sidebarOpen = action.payload;
        },
        addNotification: (state, action) => {
            const notification = {
                id: `notification-${Date.now()}`,
                timestamp: new Date(),
                ...action.payload,
            };
            state.notifications.push(notification);
        },
        removeNotification: (state, action) => {
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
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
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
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
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
export const selectUser = (state) => state.user.user;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;
export const selectUserLoading = (state) => state.user.loading;
// Billing Selectors
export const selectCurrentPlan = (state) => state.billing.currentPlan;
export const selectSubscription = (state) => state.billing.subscription;
export const selectInvoices = (state) => state.billing.invoices;
export const selectBillingLoading = (state) => state.billing.loading;
// Config Selectors
export const selectConfig = (state) => state.config.config;
export const selectFeatureFlags = (state) => state.config.featureFlags;
// UI Selectors
export const selectTheme = (state) => state.ui.theme;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectNotifications = (state) => state.ui.notifications;
// Computed Selectors
export const selectHasFeature = (feature) => (state) => {
    const featureFlags = selectFeatureFlags(state);
    const currentPlan = selectCurrentPlan(state);
    if (featureFlags[feature] === false)
        return false;
    if (!currentPlan)
        return false;
    return currentPlan.features.includes(feature);
};
export const selectHasPermission = (permission) => (state) => {
    const user = selectUser(state);
    return user?.permissions.includes(permission) ?? false;
};
export const selectHasPlanAccess = (requiredPlan) => (state) => {
    const currentPlan = selectCurrentPlan(state);
    if (!currentPlan)
        return requiredPlan === 'basic';
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
        setUser: (user) => dispatch(userActions.setUser(user)),
        updateUser: (updates) => dispatch(userActions.updateUser(updates)),
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
        setPlan: (plan) => dispatch(billingActions.setPlan(plan)),
        setSubscription: (sub) => dispatch(billingActions.setSubscription(sub)),
    };
}
export function useFeatures() {
    const featureFlags = useAppSelector(selectFeatureFlags);
    const dispatch = useAppDispatch();
    return {
        featureFlags,
        hasFeature: (feature) => useAppSelector(selectHasFeature(feature)),
        setFeature: (feature, enabled) => dispatch(configActions.setFeatureFlag({ feature, enabled })),
    };
}
export function usePermissions() {
    return {
        hasPermission: (permission) => useAppSelector(selectHasPermission(permission)),
        hasPlanAccess: (plan) => useAppSelector(selectHasPlanAccess(plan)),
    };
}
export function useNotifications() {
    const notifications = useAppSelector(selectNotifications);
    const dispatch = useAppDispatch();
    return {
        notifications,
        addNotification: (notification) => dispatch(uiActions.addNotification(notification)),
        removeNotification: (id) => dispatch(uiActions.removeNotification(id)),
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
const pluginReducers = {};
export function registerPluginReducer(name, reducer) {
    pluginReducers[name] = reducer;
}
export function getPluginReducers() {
    return pluginReducers;
}
