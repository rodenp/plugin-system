import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const PluginContext = createContext(null);
export function PluginProvider({ manager, children, onError }) {
    const [state, setState] = useState({});
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        let mounted = true;
        const initializePlugins = async () => {
            try {
                await manager.initialize();
                if (mounted) {
                    setIsInitialized(true);
                    setState(manager.getAllState());
                }
            }
            catch (err) {
                const error = err;
                if (mounted) {
                    setError(error);
                    onError?.(error);
                }
            }
        };
        // Listen for state changes
        const handleStateChange = ({ state }) => {
            if (mounted) {
                setState(state);
            }
        };
        // Listen for plugin errors
        const handlePluginError = ({ error }) => {
            if (mounted) {
                setError(error);
                onError?.(error);
            }
        };
        manager.on('state:changed', handleStateChange);
        manager.on('plugin:error', handlePluginError);
        initializePlugins();
        return () => {
            mounted = false;
            manager.off('state:changed', handleStateChange);
            manager.off('plugin:error', handlePluginError);
            manager.destroy();
        };
    }, [manager, onError]);
    const contextValue = {
        manager,
        state,
        isInitialized,
        error
    };
    return (_jsx(PluginContext.Provider, { value: contextValue, children: children }));
}
// Hook to access plugin context
export function usePlugins() {
    const context = useContext(PluginContext);
    if (!context) {
        throw new Error('usePlugins must be used within a PluginProvider');
    }
    return context;
}
// Hook to get a specific plugin
export function usePlugin(name) {
    const { manager } = usePlugins();
    return manager.getPlugin(name);
}
// Hook to get a component from a plugin
export function usePluginComponent(pluginName, componentName) {
    const { manager } = usePlugins();
    return manager.getComponent(pluginName, componentName);
}
// Hook to get a hook from a plugin
export function usePluginHook(pluginName, hookName) {
    const { manager } = usePlugins();
    return manager.getHook(pluginName, hookName);
}
// Hook to execute hooks across plugins
export function usePluginHooks(hookName) {
    const { manager } = usePlugins();
    return async (...args) => {
        return await manager.executeHook(hookName, ...args);
    };
}
// Hook for plugin state management
export function usePluginState(key) {
    const { manager, state } = usePlugins();
    const setState = (newKey, value) => {
        manager.setState(newKey, value);
    };
    if (key) {
        return [state[key], (value) => setState(key, value)];
    }
    return [state, setState];
}
