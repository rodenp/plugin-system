import { useState, useEffect } from 'react';
import { pluginRegistry } from '../../store/plugin-registry';

/**
 * Universal hook for getting components from any plugin
 * 
 * Replaces plugin-specific hooks like useMessagingComponent, useCommunitySidebarComponent
 * with a single universal hook that can access any plugin's components.
 * 
 * @param pluginId - The ID of the plugin to get the component from
 * @param componentName - The name of the component to get
 * @returns The component or null if not found/not yet registered
 */
export function usePluginComponent(
  pluginId: string, 
  componentName: string
): React.ComponentType<any> | null {
  const [component, setComponent] = useState<React.ComponentType<any> | null>(null);
  
  useEffect(() => {
    // Check if component is immediately available
    const comp = pluginRegistry.getComponent(pluginId, componentName);
    if (comp) {
      console.log(`✅ Found component ${componentName} in service registry for ${pluginId}`);
      setComponent(() => comp);
      return;
    }
    
    // Poll for component availability (plugins might load async)
    const checkInterval = setInterval(() => {
      const comp = pluginRegistry.getComponent(pluginId, componentName);
      if (comp) {
        console.log(`✅ Found component ${componentName} in service registry for ${pluginId}`);
        setComponent(() => comp);
        clearInterval(checkInterval);
      }
    }, 100);
    
    // Cleanup after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      console.warn(`⚠️ Component ${pluginId}.${componentName} not found after 5s`);
    }, 5000);
    
    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [pluginId, componentName]);
  
  return component;
}

/**
 * Universal hook for getting services from any plugin
 * 
 * @param pluginId - The ID of the plugin to get the service from
 * @param serviceName - The name of the service to get
 * @returns The service function or null if not found
 */
export function usePluginService(
  pluginId: string, 
  serviceName: string
): Function | null {
  const [service, setService] = useState<Function | null>(null);
  
  useEffect(() => {
    const serviceFunc = pluginRegistry.getService(pluginId, serviceName);
    setService(() => serviceFunc);
  }, [pluginId, serviceName]);
  
  return service;
}