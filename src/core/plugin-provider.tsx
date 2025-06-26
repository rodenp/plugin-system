import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PluginManager } from './plugin-manager';

// Plugin context for React apps
interface PluginContextValue {
  manager: PluginManager;
  state: Record<string, any>;
  isInitialized: boolean;
  error: Error | null;
}

const PluginContext = createContext<PluginContextValue | null>(null);

interface PluginProviderProps {
  manager: PluginManager;
  children: ReactNode;
  onError?: (error: Error) => void;
}

export function PluginProvider({ manager, children, onError }: PluginProviderProps) {
  const [state, setState] = useState<Record<string, any>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializePlugins = async () => {
      try {
        await manager.initialize();
        if (mounted) {
          setIsInitialized(true);
          setState(manager.getAllState());
        }
      } catch (err) {
        const error = err as Error;
        if (mounted) {
          setError(error);
          onError?.(error);
        }
      }
    };

    // Listen for state changes
    const handleStateChange = ({ state }: { state: Record<string, any> }) => {
      if (mounted) {
        setState(state);
      }
    };

    // Listen for plugin errors
    const handlePluginError = ({ error }: { error: Error }) => {
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

  const contextValue: PluginContextValue = {
    manager,
    state,
    isInitialized,
    error
  };

  return (
    <PluginContext.Provider value={contextValue}>
      {children}
    </PluginContext.Provider>
  );
}

// Hook to access plugin context
export function usePlugins(): PluginContextValue {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePlugins must be used within a PluginProvider');
  }
  return context;
}

// Hook to get a specific plugin
export function usePlugin(name: string) {
  const { manager } = usePlugins();
  return manager.getPlugin(name);
}

// Hook to get a component from a plugin
export function usePluginComponent(pluginName: string, componentName: string) {
  const { manager } = usePlugins();
  return manager.getComponent(pluginName, componentName);
}

// Hook to get a hook from a plugin
export function usePluginHook(pluginName: string, hookName: string) {
  const { manager } = usePlugins();
  return manager.getHook(pluginName, hookName);
}

// Hook to execute hooks across plugins
export function usePluginHooks(hookName: string) {
  const { manager } = usePlugins();
  
  return async (...args: any[]) => {
    return await manager.executeHook(hookName, ...args);
  };
}

// Hook for plugin state management
export function usePluginState(key?: string) {
  const { manager, state } = usePlugins();
  
  const setState = (newKey: string, value: any) => {
    manager.setState(newKey, value);
  };
  
  if (key) {
    return [state[key], (value: any) => setState(key, value)] as const;
  }
  
  return [state, setState] as const;
}