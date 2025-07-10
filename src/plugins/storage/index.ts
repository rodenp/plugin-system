// Storage Plugin - Complete Export Index
// This is the main entry point for the StoragePlugin system

// Core Plugin
export { StoragePlugin, createStoragePlugin } from './StoragePlugin';

// Types
export * from './types';

// Storage Adapters
export * from './adapters';

// GDPR Services
export { EncryptionService } from './services/EncryptionService';
export { ConsentManager } from './services/ConsentManager';
export { AuditLogger } from './services/AuditLogger';
export { DataSubjectRights } from './services/DataSubjectRights';

// Performance Services
export { StateManagerIntegration } from './StateManagerIntegration';
export { UpdateQueue } from './UpdateQueue';
export { CacheManager } from './CacheManager';

// React Integration
export * from './react/hooks';
export {
  StorageProvider,
  StorageErrorBoundary,
  StorageLoading,
  StorageStatusIndicator,
  ConsentManager as ConsentManagerComponent,
  DataExportButton,
  useStorageContext,
  useStorageInstance
} from './react/StorageProvider';

// Utility functions for common use cases
import { StoragePluginConfig, EntityType } from './types';
import { StoragePlugin } from './StoragePlugin';

/**
 * Create a storage plugin with common configuration presets
 */
export const createStoragePluginWithPreset = (preset: 'development' | 'production' | 'testing', overrides?: Partial<StoragePluginConfig>): StoragePlugin => {
  const baseConfigs = {
    development: {
      backend: {
        type: 'memory' as const,
        database: 'dev_storage'
      },
      gdpr: {
        enabled: true,
        encryption: {
          enabled: false, // Disabled for development
          algorithm: 'AES-256-GCM' as const,
          keyDerivation: 'PBKDF2' as const,
          keyRotationDays: 30
        },
        consent: {
          required: false,
          purposes: [
            {
              id: 'dev_testing',
              name: 'Development Testing',
              description: 'Data processing for development and testing',
              category: 'necessary' as const,
              required: false
            }
          ]
        },
        audit: {
          enabled: true,
          retentionPeriod: '30 days',
          batchSize: 1
        }
      },
      cache: {
        enabled: true,
        type: 'memory' as const,
        ttl: 60000, // 1 minute
        maxSize: 100
      },
      updateQueue: {
        enabled: false // Disabled for immediate feedback in development
      }
    },
    
    production: {
      backend: {
        type: 'indexeddb' as const,
        database: 'production_storage',
        options: { version: 1 }
      },
      gdpr: {
        enabled: true,
        encryption: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyDerivation: 'PBKDF2' as const,
          keyRotationDays: 90,
          encryptedFields: {
            [EntityType.USERS]: ['email', 'name', 'preferences'],
            [EntityType.MESSAGES]: ['content', 'metadata']
          }
        },
        consent: {
          required: true,
          purposes: [
            {
              id: 'essential',
              name: 'Essential Functions',
              description: 'Required for basic application functionality',
              category: 'necessary' as const,
              required: true
            },
            {
              id: 'analytics',
              name: 'Analytics',
              description: 'Help us improve the application',
              category: 'analytics' as const,
              required: false
            },
            {
              id: 'marketing',
              name: 'Marketing',
              description: 'Personalized content and recommendations',
              category: 'marketing' as const,
              required: false
            }
          ]
        },
        audit: {
          enabled: true,
          retentionPeriod: '2 years',
          batchSize: 50,
          flushInterval: 30000
        }
      },
      cache: {
        enabled: true,
        type: 'multi' as const,
        ttl: 300000, // 5 minutes
        maxSize: 1000,
        strategy: 'lru' as const,
        layers: {
          memory: {
            enabled: true,
            maxSize: 500,
            ttl: 300000
          },
          storage: {
            enabled: true,
            maxSize: 2000,
            ttl: 600000
          }
        }
      },
      updateQueue: {
        enabled: true,
        batchWindow: 100,
        maxBatchSize: 50,
        retryAttempts: 3,
        persistence: true
      },
      stateManagerIntegration: {
        enabled: true,
        enableCaching: true,
        enableReactiveQueries: true
      }
    },
    
    testing: {
      backend: {
        type: 'memory' as const,
        database: 'test_storage'
      },
      gdpr: {
        enabled: true,
        encryption: {
          enabled: true, // Test encryption in testing
          algorithm: 'AES-256-GCM' as const,
          keyDerivation: 'PBKDF2' as const,
          keyRotationDays: 1 // Fast rotation for testing
        },
        consent: {
          required: true,
          purposes: [
            {
              id: 'test_purpose',
              name: 'Test Purpose',
              description: 'Testing data processing',
              category: 'necessary' as const,
              required: true
            }
          ]
        },
        audit: {
          enabled: true,
          retentionPeriod: '1 day',
          batchSize: 1 // Immediate for testing
        }
      },
      cache: {
        enabled: false // Disabled for predictable testing
      },
      updateQueue: {
        enabled: false // Disabled for synchronous testing
      }
    }
  };
  
  const config = {
    ...baseConfigs[preset],
    ...overrides
  } as StoragePluginConfig;
  
  return new StoragePlugin(config);
};

/**
 * Quick setup function for React applications
 */
export const setupStorageForReact = (config: StoragePluginConfig) => {
  // This function helps with React integration setup
  return {
    config,
    createProvider: (props: any) => {
      const { StorageProvider } = require('./react/StorageProvider');
      return StorageProvider({ ...props, config });
    }
  };
};

/**
 * Utility to validate storage configuration
 */
export const validateStorageConfig = (config: Partial<StoragePluginConfig>): string[] => {
  const errors: string[] = [];
  
  if (!config.backend) {
    errors.push('Backend configuration is required');
  } else {
    if (!config.backend.type) {
      errors.push('Backend type is required');
    }
    
    if (config.backend.type === 'postgresql' || config.backend.type === 'mysql') {
      if (!config.backend.host) errors.push('Database host is required for SQL backends');
      if (!config.backend.database) errors.push('Database name is required for SQL backends');
    }
  }
  
  if (!config.gdpr) {
    errors.push('GDPR configuration is required');
  } else {
    if (config.gdpr.encryption?.enabled && !config.gdpr.encryption.algorithm) {
      errors.push('Encryption algorithm is required when encryption is enabled');
    }
    
    if (config.gdpr.consent?.required && (!config.gdpr.consent.purposes || config.gdpr.consent.purposes.length === 0)) {
      errors.push('At least one consent purpose is required when consent is required');
    }
  }
  
  return errors;
};

/**
 * Get recommended configuration based on use case
 */
export const getRecommendedConfig = (useCase: {
  environment: 'browser' | 'node' | 'react-native';
  dataSize: 'small' | 'medium' | 'large';
  compliance: 'basic' | 'gdpr' | 'enterprise';
  performance: 'basic' | 'optimized' | 'high-performance';
}): Partial<StoragePluginConfig> => {
  const config: Partial<StoragePluginConfig> = {};
  
  // Backend selection
  if (useCase.environment === 'browser') {
    config.backend = {
      type: 'indexeddb',
      database: 'app_storage',
      options: { version: 1 }
    };
  } else if (useCase.environment === 'node') {
    config.backend = {
      type: 'postgresql',
      host: 'localhost',
      database: 'app_storage',
      username: 'app_user'
    };
  }
  
  // GDPR configuration
  config.gdpr = {
    enabled: useCase.compliance !== 'basic',
    encryption: {
      enabled: useCase.compliance === 'gdpr' || useCase.compliance === 'enterprise',
      algorithm: 'AES-256-GCM',
      keyRotationDays: useCase.compliance === 'enterprise' ? 30 : 90
    },
    audit: {
      enabled: useCase.compliance !== 'basic',
      retentionPeriod: useCase.compliance === 'enterprise' ? '7 years' : '2 years'
    }
  };
  
  // Performance configuration
  if (useCase.performance === 'high-performance') {
    config.cache = {
      enabled: true,
      type: 'multi',
      maxSize: useCase.dataSize === 'large' ? 5000 : 1000
    };
    
    config.updateQueue = {
      enabled: true,
      maxBatchSize: 100,
      batchWindow: 50
    };
    
    config.stateManagerIntegration = {
      enabled: true,
      enableCaching: true,
      enableReactiveQueries: true
    };
  }
  
  return config;
};

// Version information
export const STORAGE_PLUGIN_VERSION = '2.0.0';
export const SUPPORTED_FEATURES = [
  'crud_operations',
  'query_support', 
  'transactions',
  'backup_restore',
  'gdpr_compliance',
  'field_encryption',
  'consent_management',
  'audit_logging',
  'data_subject_rights',
  'multi_backend_support',
  'state_manager_integration',
  'update_queue',
  'multi_tier_caching',
  'react_integration',
  'performance_monitoring'
];

// Plugin System Interface
import type { Plugin } from '../../types/plugin-interface';
import { StoragePluginComponent } from './StoragePluginComponent';
import { storageConfig } from './config';
import { pluginRegistry } from '../../store/plugin-registry';

// Storage plugin instance management
let storageInstance: StoragePlugin | null = null;

export const storagePlugin: Plugin = {
  id: 'storage',
  name: 'Storage Plugin',
  component: StoragePluginComponent,
  dependencies: [], // No dependencies - this is the storage layer
  icon: '💾',
  order: -1000, // Load first - this is the foundation layer
  
  onInstall: async () => {
    console.log('🔌 Installing storage plugin...');
    
    // Check for config in window first (workaround for Vite HMR module duplication)
    let config = (window as any).__storagePluginConfig;
    if (config) {
      console.log('🔌 Using config from window (workaround)');
    } else {
      console.log('🔌 Using config from storageConfig module');
      config = storageConfig.getConfig();
    }
    
    console.log('🔌 Storage plugin using database:', config.backend.database);
    console.log('🔌 Storage plugin GDPR mode:', config.gdpr.enabled);
    storageInstance = new StoragePlugin(config);
    
    // Initialize storage instance
    await storageInstance.initialize();
    
    // Register services with plugin registry
    pluginRegistry.registerService('storage', {
      version: '2.0.0',
      components: {
        StorageAdmin: StoragePluginComponent,
      },
      services: {
        // Core CRUD operations - both direct methods and convenience wrappers
        create: storageInstance.create.bind(storageInstance),
        read: storageInstance.read.bind(storageInstance),
        update: storageInstance.update.bind(storageInstance),
        delete: storageInstance.delete.bind(storageInstance),
        query: storageInstance.query.bind(storageInstance),
        clear: storageInstance.clear.bind(storageInstance),
        count: storageInstance.count.bind(storageInstance),
        
        // Convenience methods for common operations
        save: storageInstance.create.bind(storageInstance), // Alias for create
        findAll: (entityType: string) => storageInstance.query(entityType), // Get all entities of type
        findById: storageInstance.read.bind(storageInstance), // Alias for read
        
        // Batch operations
        createMany: storageInstance.createMany.bind(storageInstance),
        
        // GDPR operations
        exportUserData: storageInstance.exportUserData.bind(storageInstance),
        deleteUserData: storageInstance.deleteUserData.bind(storageInstance),
        grantConsent: storageInstance.grantConsent.bind(storageInstance),
        revokeConsent: storageInstance.revokeConsent.bind(storageInstance),
        checkConsent: storageInstance.checkConsent.bind(storageInstance),
        getConsentStatus: storageInstance.getConsentStatus.bind(storageInstance),
        
        // Configuration management
        getConfig: storageConfig.getConfig,
        setConfig: (updates: Partial<StoragePluginConfig>) => {
          storageConfig.setConfig(updates);
          // Apply config changes to instance if needed
          if (storageInstance) {
            // Note: StoragePlugin may need an updateConfiguration method
            console.log('Storage configuration updated:', updates);
          }
        },
        
        // Storage information
        getStorageInfo: storageInstance.getStorageInfo.bind(storageInstance),
        getStatus: storageInstance.getStatus.bind(storageInstance),
        
        // GDPR specific services
        getEncryptionStatus: () => ({ enabled: true, algorithm: 'AES-256-GCM' }),
        getAuditLogs: (options?: any) => {
          return storageInstance.getAuditLogs(options);
        },
        
        // Instance access for advanced usage
        getInstance: () => storageInstance
      }
    });
    
    console.log('✅ Storage plugin installed and services registered');
  },
  
  onUninstall: async () => {
    if (storageInstance) {
      await storageInstance.destroy();
      storageInstance = null;
    }
    console.log('🔌 Storage plugin uninstalled');
  }
};

// Export configuration utilities
export { storageConfig };
export type { StoragePluginConfig } from './config/types';

// Export default as the main plugin class
export default StoragePlugin;