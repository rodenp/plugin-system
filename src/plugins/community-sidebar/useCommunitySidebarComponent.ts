import { useState, useEffect } from 'react';
import type { CommunitySidebarProps } from './types';

export interface CommunitySidebarComponents {
  CommunitySidebar: React.ComponentType<CommunitySidebarProps>;
}

export function useCommunitySidebarComponent<K extends keyof CommunitySidebarComponents>(
  componentName: K
): CommunitySidebarComponents[K] | null {
  const [component, setComponent] = useState<CommunitySidebarComponents[K] | null>(null);
  
  useEffect(() => {
    const checkForComponent = () => {
      const components = (window as any).__communitySidebarComponents;
      console.log(`🔍 Checking for component "${componentName}":`, {
        components,
        hasComponent: !!(components && components[componentName]),
        requestedComponent: componentName
      });
      if (components && components[componentName]) {
        setComponent(() => components[componentName]);
        return true;
      }
      return false;
    };
    
    // Initial check
    if (!checkForComponent()) {
      // Poll every 100ms for up to 5 seconds
      const interval = setInterval(() => {
        if (checkForComponent()) {
          clearInterval(interval);
        }
      }, 100);
      
      // Cleanup after 5 seconds
      setTimeout(() => clearInterval(interval), 5000);
      
      return () => clearInterval(interval);
    }
  }, [componentName]);
  
  return component;
}