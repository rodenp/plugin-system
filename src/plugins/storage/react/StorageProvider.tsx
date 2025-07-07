// Storage Provider - React context and provider for StoragePlugin
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StoragePlugin, createStoragePlugin } from '../StoragePlugin';
import { StoragePluginConfig, StorageError } from '../types';
import { ServiceRegistry } from '../../../core/communication/ServiceRegistry';

// Context types
interface StorageContextValue {
  storage: StoragePlugin | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  config: StoragePluginConfig | null;
  status: any;
  capabilities: string[];
  stats: any;
}

interface StorageProviderProps {
  children: ReactNode;
  config: StoragePluginConfig;
  serviceRegistry?: ServiceRegistry;
  enableDevTools?: boolean;
  onInitialized?: (storage: StoragePlugin) => void;
  onError?: (error: Error) => void;
}

// Create context
const StorageContext = createContext<StorageContextValue>({
  storage: null,
  isInitialized: false,
  isLoading: true,
  error: null,
  config: null,
  status: null,
  capabilities: [],
  stats: null
});

// Provider component
export const StorageProvider: React.FC<StorageProviderProps> = ({
  children,
  config,
  serviceRegistry,
  enableDevTools = false,
  onInitialized,
  onError
}) => {
  const [storage, setStorage] = useState<StoragePlugin | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Initialize storage plugin
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        console.log('🚀 Initializing StoragePlugin via React Provider...');
        setIsLoading(true);
        setError(null);

        // Create storage instance
        const storageInstance = createStoragePlugin(config);
        
        // Initialize with service registry
        await storageInstance.initialize(serviceRegistry);
        
        // Get initial status and capabilities
        const initialStatus = storageInstance.getStatus();
        const initialCapabilities = storageInstance.getCapabilities();
        
        setStorage(storageInstance);
        setStatus(initialStatus);
        setCapabilities(initialCapabilities);
        setIsInitialized(true);
        
        // Set global reference for hooks
        (window as any).__STORAGE_PLUGIN_INSTANCE__ = storageInstance;
        
        // Setup event listeners
        setupEventListeners(storageInstance);
        
        // Enable dev tools if requested
        if (enableDevTools) {
          setupDevTools(storageInstance);
        }
        
        onInitialized?.(storageInstance);
        
        console.log('✅ StoragePlugin initialized via React Provider');
        
      } catch (err) {
        const error = err as Error;
        console.error('❌ StoragePlugin initialization failed:', error);
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();

    // Cleanup on unmount
    return () => {
      if (storage) {
        storage.destroy().catch(console.error);
        delete (window as any).__STORAGE_PLUGIN_INSTANCE__;
      }
    };
  }, [config, serviceRegistry, enableDevTools, onInitialized, onError]);

  // Setup event listeners for storage events
  const setupEventListeners = (storageInstance: StoragePlugin) => {
    // Listen for storage events to update context state
    storageInstance.on('initialized', () => {
      setStatus(storageInstance.getStatus());
    });

    storageInstance.on('data_created', (event) => {
      console.log('🆕 Data created:', event);
    });

    storageInstance.on('data_updated', (event) => {
      console.log('✏️ Data updated:', event);
    });

    storageInstance.on('data_deleted', (event) => {
      console.log('🗑️ Data deleted:', event);
    });

    storageInstance.on('operation_completed', (event) => {
      // Update stats on operation completion
      if (event.success) {
        updateStats(storageInstance);
      }
    });

    storageInstance.on('error', (error) => {
      console.error('❌ Storage error:', error);
      setError(error);
    });
  };

  // Setup development tools
  const setupDevTools = (storageInstance: StoragePlugin) => {
    // Add storage instance to window for debugging
    (window as any).__STORAGE_DEBUG__ = {
      instance: storageInstance,
      getStats: () => storageInstance.getPerformanceMetrics(),
      getStatus: () => storageInstance.getStatus(),
      getConfig: () => storageInstance.getConfiguration(),
      clearCache: () => {
        if ((storageInstance as any).cacheManager) {
          return (storageInstance as any).cacheManager.clearAll();
        }
      },
      forceFlush: () => {
        if ((storageInstance as any).updateQueue) {
          return (storageInstance as any).updateQueue.forceFlush();
        }
      }
    };

    console.log('🔧 Storage DevTools enabled - Access via window.__STORAGE_DEBUG__');
  };

  // Update stats periodically
  const updateStats = async (storageInstance: StoragePlugin) => {
    try {
      const [performanceMetrics, storageInfo] = await Promise.all([
        storageInstance.getPerformanceMetrics(),
        storageInstance.getStorageInfo()
      ]);
      
      setStats({
        performance: performanceMetrics,
        storage: storageInfo,
        timestamp: new Date()
      });
    } catch (error) {
      console.warn('Failed to update storage stats:', error);
    }
  };

  // Update stats every 30 seconds when initialized
  useEffect(() => {
    if (!storage || !isInitialized) return;

    updateStats(storage);
    
    const interval = setInterval(() => {
      updateStats(storage);
    }, 30000);

    return () => clearInterval(interval);
  }, [storage, isInitialized]);

  const contextValue: StorageContextValue = {
    storage,
    isInitialized,
    isLoading,
    error,
    config,
    status,
    capabilities,
    stats
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};

// Context hook
export const useStorageContext = (): StorageContextValue => {
  const context = useContext(StorageContext);
  
  if (!context) {
    throw new Error('useStorageContext must be used within a StorageProvider');
  }
  
  return context;
};

// Storage instance hook
export const useStorageInstance = (): StoragePlugin => {
  const { storage, isInitialized, error, isLoading } = useStorageContext();
  
  if (error) {
    throw error;
  }
  
  if (isLoading || !isInitialized || !storage) {
    throw new StorageError('StoragePlugin not yet initialized', 'NOT_INITIALIZED');
  }
  
  return storage;
};

// Error boundary for storage operations
interface StorageErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface StorageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class StorageErrorBoundary extends React.Component<
  StorageErrorBoundaryProps,
  StorageErrorBoundaryState
> {
  constructor(props: StorageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): StorageErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('StorageErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      
      return (
        <div className="storage-error-boundary">
          <h2>Storage Error</h2>
          <p>Something went wrong with the storage system.</p>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error.message}</pre>
            <pre>{this.state.error.stack}</pre>
          </details>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component
interface StorageLoadingProps {
  message?: string;
  showProgress?: boolean;
}

export const StorageLoading: React.FC<StorageLoadingProps> = ({
  message = 'Initializing storage...',
  showProgress = false
}) => {
  const { isLoading, error } = useStorageContext();
  
  if (!isLoading || error) {
    return null;
  }
  
  return (
    <div className="storage-loading">
      <div className="loading-spinner" />
      <p>{message}</p>
      {showProgress && (
        <div className="loading-progress">
          <div className="progress-bar" />
        </div>
      )}
    </div>
  );
};

// Status indicator component
export const StorageStatusIndicator: React.FC = () => {
  const { status, error, isInitialized } = useStorageContext();
  
  const getStatusColor = () => {
    if (error) return 'red';
    if (!isInitialized) return 'yellow';
    if (status?.health === 'healthy') return 'green';
    return 'orange';
  };
  
  const getStatusText = () => {
    if (error) return `Error: ${error.message}`;
    if (!isInitialized) return 'Initializing...';
    if (status?.health === 'healthy') return 'Connected';
    return 'Warning';
  };
  
  return (
    <div className="storage-status-indicator">
      <div 
        className="status-dot" 
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="status-text">{getStatusText()}</span>
      {status && (
        <span className="status-details">
          {status.metrics?.operations || 0} ops
        </span>
      )}
    </div>
  );
};

// GDPR compliance components
interface ConsentManagerProps {
  userId: string;
  purposes: Array<{ id: string; name: string; description: string; required: boolean }>;
  onConsentChange?: (granted: string[], revoked: string[]) => void;
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({
  userId,
  purposes,
  onConsentChange
}) => {
  const storage = useStorageInstance();
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConsents = async () => {
      try {
        const consentRecords = await storage.getConsentStatus(userId);
        const consentMap = consentRecords.reduce((acc, record) => {
          acc[record.purposeId] = record.status === 'granted';
          return acc;
        }, {} as Record<string, boolean>);
        setConsents(consentMap);
      } catch (error) {
        console.error('Failed to load consents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConsents();
  }, [storage, userId]);

  const handleConsentChange = async (purposeId: string, granted: boolean) => {
    try {
      setConsents(prev => ({ ...prev, [purposeId]: granted }));
      
      if (granted) {
        await storage.grantConsent(userId, [purposeId]);
      } else {
        await storage.revokeConsent(userId, [purposeId]);
      }
      
      const updatedConsents = { ...consents, [purposeId]: granted };
      const grantedPurposes = Object.entries(updatedConsents)
        .filter(([, granted]) => granted)
        .map(([id]) => id);
      const revokedPurposes = Object.entries(updatedConsents)
        .filter(([, granted]) => !granted)
        .map(([id]) => id);
      
      onConsentChange?.(grantedPurposes, revokedPurposes);
      
    } catch (error) {
      console.error('Failed to update consent:', error);
      // Revert optimistic update
      setConsents(prev => ({ ...prev, [purposeId]: !granted }));
    }
  };

  if (loading) {
    return <div>Loading consent preferences...</div>;
  }

  return (
    <div className="consent-manager">
      <h3>Privacy Preferences</h3>
      <p>Manage your data processing consents below:</p>
      
      {purposes.map(purpose => (
        <div key={purpose.id} className="consent-item">
          <div className="consent-header">
            <label>
              <input
                type="checkbox"
                checked={consents[purpose.id] || false}
                onChange={(e) => handleConsentChange(purpose.id, e.target.checked)}
                disabled={purpose.required}
              />
              <strong>{purpose.name}</strong>
              {purpose.required && <span className="required"> (Required)</span>}
            </label>
          </div>
          <p className="consent-description">{purpose.description}</p>
        </div>
      ))}
    </div>
  );
};

// Data export component
interface DataExportButtonProps {
  userId: string;
  onExportComplete?: (result: any) => void;
  className?: string;
}

export const DataExportButton: React.FC<DataExportButtonProps> = ({
  userId,
  onExportComplete,
  className = ''
}) => {
  const storage = useStorageInstance();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await storage.exportUserData(userId);
      
      // Create and download file
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onExportComplete?.(result);
      
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`data-export-button ${className}`}>
      <button 
        onClick={handleExport} 
        disabled={loading}
        className="export-btn"
      >
        {loading ? 'Exporting...' : 'Export My Data'}
      </button>
      {error && (
        <div className="error-message">
          Export failed: {error}
        </div>
      )}
    </div>
  );
};

export default StorageProvider;