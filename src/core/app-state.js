import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { eventBus } from './event-bus';
// ============================================================================
// REDUCER
// ============================================================================
const initialState = {
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
function appReducer(state, action) {
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
                }, {})
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
const AppContext = createContext(undefined);
export function AppProvider({ children, initialConfig }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    // ============================================================================
    // ACTIONS
    // ============================================================================
    const initialize = useCallback(async (config, user) => {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to initialize app';
            dispatch({ type: 'INITIALIZE_ERROR', payload: errorMessage });
        }
    }, [initialConfig]);
    const setUser = useCallback((user) => {
        dispatch({ type: 'SET_USER', payload: user });
        eventBus.emit('user:changed', user);
    }, []);
    const updateUser = useCallback((updates) => {
        dispatch({ type: 'UPDATE_USER', payload: updates });
        eventBus.emit('user:updated', updates);
    }, []);
    const setBilling = useCallback((billing) => {
        dispatch({ type: 'SET_BILLING', payload: billing });
        eventBus.emit('billing:updated', billing);
    }, []);
    const updateConfig = useCallback((config) => {
        dispatch({ type: 'UPDATE_CONFIG', payload: config });
        eventBus.emit('config:updated', config);
    }, []);
    const setFeature = useCallback((feature, enabled) => {
        dispatch({ type: 'SET_FEATURE', payload: { feature, enabled } });
        eventBus.emit('feature:toggled', { feature, enabled });
    }, []);
    const setTheme = useCallback((theme) => {
        dispatch({ type: 'SET_THEME', payload: theme });
        // Apply theme to document
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', prefersDark);
        }
        else {
            document.documentElement.classList.toggle('dark', theme === 'dark');
        }
        eventBus.emit('theme:changed', theme);
    }, []);
    const toggleSidebar = useCallback(() => {
        dispatch({ type: 'TOGGLE_SIDEBAR' });
    }, []);
    const addNotification = useCallback((notification) => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
        // Auto-remove after 5 seconds unless it's an error
        if (notification.type !== 'error') {
            setTimeout(() => {
                // Note: This might create stale closure issues in some cases
                // For production, consider using a more robust notification system
            }, 5000);
        }
    }, []);
    const removeNotification = useCallback((id) => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    }, []);
    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================
    const hasFeature = useCallback((feature) => {
        if (!state.user || !state.billing.currentPlan)
            return false;
        // Check feature flags
        if (state.features[feature] === false)
            return false;
        // Check plan features
        return state.billing.currentPlan.features.includes(feature);
    }, [state.user, state.billing.currentPlan, state.features]);
    const hasPermission = useCallback((permission) => {
        if (!state.user)
            return false;
        return state.user.permissions.includes(permission);
    }, [state.user]);
    const hasPlanAccess = useCallback((requiredPlan) => {
        if (!state.billing.currentPlan)
            return requiredPlan === 'basic';
        const planHierarchy = { basic: 0, pro: 1, enterprise: 2 };
        const userLevel = planHierarchy[state.billing.currentPlan.level];
        const requiredLevel = planHierarchy[requiredPlan];
        return userLevel >= requiredLevel;
    }, [state.billing.currentPlan]);
    const isWithinLimits = useCallback((limitType, currentUsage) => {
        if (!state.billing.currentPlan)
            return false;
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
            const handleChange = (e) => {
                document.documentElement.classList.toggle('dark', e.matches);
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [state.theme]);
    // ============================================================================
    // CONTEXT VALUE
    // ============================================================================
    const value = {
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
    return (_jsx(AppContext.Provider, { value: value, children: children }));
}
// ============================================================================
// HOOKS
// ============================================================================
export function useApp() {
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
