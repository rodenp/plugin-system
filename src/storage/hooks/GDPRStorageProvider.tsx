// GDPR Storage Provider Component
// React provider for GDPR storage context

import React, { useState, useEffect, ReactNode } from 'react';
import { GDPRStorage, GDPRStorageConfig, StoragePresets } from '../index';
import { GDPRStorageContext } from './useGDPRStorage';

export interface GDPRStorageProviderProps {
  children: ReactNode;
  // Storage configuration or preset name
  config?: GDPRStorageConfig | keyof typeof StoragePresets;
  // Custom storage instance (overrides config)
  storage?: GDPRStorage;
  // Loading component
  fallback?: ReactNode;
  // Error component
  errorFallback?: (error: Error) => ReactNode;
  // Called when storage is initialized
  onInitialized?: (storage: GDPRStorage) => void;
  // Called when storage fails to initialize
  onError?: (error: Error) => void;
}

export function GDPRStorageProvider({
  children,
  config = 'DEVELOPMENT',
  storage: providedStorage,
  fallback = <div>Initializing storage...</div>,
  errorFallback,
  onInitialized,
  onError
}: GDPRStorageProviderProps) {
  const [storage, setStorage] = useState<GDPRStorage | null>(providedStorage || null);
  const [loading, setLoading] = useState(!providedStorage);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If storage is provided, use it directly
    if (providedStorage) {
      setStorage(providedStorage);
      setLoading(false);
      if (onInitialized) {
        onInitialized(providedStorage);
      }
      return;
    }

    let mounted = true;

    const initializeStorage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create storage configuration
        let storageConfig: GDPRStorageConfig;
        
        if (typeof config === 'string') {
          // Use preset
          storageConfig = StoragePresets[config];
        } else {
          // Use provided config
          storageConfig = config;
        }

        // Create and initialize storage
        const newStorage = new GDPRStorage(storageConfig);
        await newStorage.initialize();

        if (!mounted) {
          // Component unmounted during initialization
          await newStorage.destroy();
          return;
        }

        setStorage(newStorage);
        setLoading(false);
        
        if (onInitialized) {
          onInitialized(newStorage);
        }

        console.log('GDPRStorageProvider: Storage initialized successfully');

      } catch (err) {
        if (!mounted) return;

        const error = err instanceof Error ? err : new Error('Failed to initialize storage');
        setError(error);
        setLoading(false);
        
        if (onError) {
          onError(error);
        }
        
        console.error('GDPRStorageProvider: Failed to initialize storage:', error);
      }
    };

    initializeStorage();

    return () => {
      mounted = false;
      
      // Cleanup storage on unmount
      if (storage && !providedStorage) {
        storage.destroy().catch(err => {
          console.error('Failed to cleanup storage:', err);
        });
      }
    };
  }, [config, providedStorage, onInitialized, onError]);

  // Show loading state
  if (loading) {
    return <>{fallback}</>;
  }

  // Show error state
  if (error) {
    if (errorFallback) {
      return <>{errorFallback(error)}</>;
    }
    
    return (
      <div style={{ 
        padding: '20px', 
        border: '1px solid #red', 
        borderRadius: '4px', 
        backgroundColor: '#fee' 
      }}>
        <h3>Storage Initialization Error</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  // Provide storage context
  return (
    <GDPRStorageContext.Provider value={storage}>
      {children}
    </GDPRStorageContext.Provider>
  );
}

// HOC for wrapping components with storage provider
export function withGDPRStorage<P extends object>(
  Component: React.ComponentType<P>,
  storageConfig?: GDPRStorageConfig | keyof typeof StoragePresets
) {
  return function WrappedComponent(props: P) {
    return (
      <GDPRStorageProvider config={storageConfig}>
        <Component {...props} />
      </GDPRStorageProvider>
    );
  };
}