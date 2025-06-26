import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store, userActions, billingActions, configActions } from './index';
import { eventBus } from '../event-bus';
export function AppStoreProvider({ children, initialConfig, initialUser, initialBilling }) {
    useEffect(() => {
        // Initialize store with provided data
        if (initialConfig) {
            store.dispatch(configActions.setConfig(initialConfig));
        }
        if (initialUser) {
            store.dispatch(userActions.setUser(initialUser));
        }
        if (initialBilling?.currentPlan) {
            store.dispatch(billingActions.setPlan(initialBilling.currentPlan));
        }
        if (initialBilling?.subscription) {
            store.dispatch(billingActions.setSubscription(initialBilling.subscription));
        }
        // Make store available globally for plugins
        window.__courseFrameworkStore = store;
        // Emit initialization event
        eventBus.emit('store:initialized', {
            config: initialConfig,
            user: initialUser,
            billing: initialBilling
        });
        return () => {
            // Cleanup global reference
            delete window.__courseFrameworkStore;
        };
    }, [initialConfig, initialUser, initialBilling]);
    return (_jsx(Provider, { store: store, children: children }));
}
// ============================================================================
// PLUGIN INTEGRATION UTILITIES
// ============================================================================
/**
 * Utility to get store state for plugins
 */
export function getStoreForPlugin() {
    const globalStore = window.__courseFrameworkStore;
    if (!globalStore) {
        throw new Error('Store not initialized. Make sure AppStoreProvider is rendered.');
    }
    return globalStore;
}
/**
 * Subscribe to store changes from within plugins
 */
export function subscribeToStore(callback) {
    const store = getStoreForPlugin();
    return store.subscribe(() => callback(store.getState()));
}
/**
 * Dispatch actions from within plugins
 */
export function dispatchFromPlugin(action) {
    const store = getStoreForPlugin();
    return store.dispatch(action);
}
// ============================================================================
// ASYNC ACTION CREATORS (Thunks)
// ============================================================================
import { createAsyncThunk } from '@reduxjs/toolkit';
// User Authentication
export const loginUser = createAsyncThunk('user/login', async (credentials) => {
    // This would typically call your auth API
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    if (!response.ok) {
        throw new Error('Login failed');
    }
    return response.json();
});
export const logoutUser = createAsyncThunk('user/logout', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    return null;
});
// Billing Operations
export const loadBillingData = createAsyncThunk('billing/loadData', async (userId) => {
    const [planResponse, subscriptionResponse, invoicesResponse] = await Promise.all([
        fetch(`/api/billing/plan/${userId}`),
        fetch(`/api/billing/subscription/${userId}`),
        fetch(`/api/billing/invoices/${userId}`)
    ]);
    const plan = await planResponse.json();
    const subscription = await subscriptionResponse.json();
    const invoices = await invoicesResponse.json();
    return { plan, subscription, invoices };
});
export const updateSubscription = createAsyncThunk('billing/updateSubscription', async ({ userId, planId }) => {
    const response = await fetch(`/api/billing/subscription/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
    });
    if (!response.ok) {
        throw new Error('Failed to update subscription');
    }
    return response.json();
});
// Configuration Loading
export const loadConfiguration = createAsyncThunk('config/load', async (environment) => {
    const response = await fetch(`/api/config/${environment}`);
    if (!response.ok) {
        throw new Error('Failed to load configuration');
    }
    return response.json();
});
export const pluginEventMiddleware = (store) => (next) => (action) => {
    const result = next(action);
    // Emit events for specific actions that plugins might care about
    switch (action.type) {
        case 'user/setUser':
            eventBus.emit('user:changed', action.payload);
            break;
        case 'billing/setPlan':
            eventBus.emit('billing:plan-changed', action.payload);
            break;
        case 'config/setFeatureFlag':
            eventBus.emit('feature:toggled', action.payload);
            break;
        case 'ui/setTheme':
            // Apply theme to DOM
            const theme = action.payload;
            if (theme === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', prefersDark);
            }
            else {
                document.documentElement.classList.toggle('dark', theme === 'dark');
            }
            eventBus.emit('theme:changed', action.payload);
            break;
    }
    return result;
};
// ============================================================================
// PLUGIN HOOK FOR ACCESSING STORE
// ============================================================================
/**
 * Hook for plugins to access the global store
 * This allows plugins to subscribe to any part of the app state
 */
export function usePluginStore() {
    const store = getStoreForPlugin();
    const [state, setState] = React.useState(store.getState());
    React.useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            setState(store.getState());
        });
        return unsubscribe;
    }, [store]);
    return {
        state,
        dispatch: store.dispatch,
        subscribe: store.subscribe,
        getState: store.getState,
    };
}
