// Storage Plugin Configuration Management
import { StoragePluginConfig } from './types';
import { defaultStorageConfig } from './default.config';
import { validateConfig } from './validator';

// Deep merge helper function
const deepMerge = (target: any, source: any): any => {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
};

// Current configuration state
let currentConfig: StoragePluginConfig = JSON.parse(JSON.stringify(defaultStorageConfig));

// Configuration management API
export const storageConfig = {
  /**
   * Get the current configuration
   */
  getConfig: (): StoragePluginConfig => {
    return JSON.parse(JSON.stringify(currentConfig));
  },
  
  /**
   * Update configuration with partial updates
   */
  setConfig: (updates: Partial<StoragePluginConfig>): void => {
    const newConfig = deepMerge(currentConfig, updates);
    const errors = validateConfig(newConfig);
    
    if (errors.length > 0) {
      throw new Error(`Invalid storage configuration: ${errors.join(', ')}`);
    }
    
    currentConfig = newConfig;
  },
  
  /**
   * Reset configuration to defaults
   */
  resetConfig: (): void => {
    currentConfig = JSON.parse(JSON.stringify(defaultStorageConfig));
  },
  
  /**
   * Load configuration from environment variables
   */
  loadFromEnvironment: (): void => {
    const env = import.meta.env;
    
    // Backend configuration from environment
    if (env.VITE_STORAGE_BACKEND) {
      currentConfig.backend.type = env.VITE_STORAGE_BACKEND as any;
    }
    if (env.VITE_STORAGE_DATABASE) {
      currentConfig.backend.database = env.VITE_STORAGE_DATABASE;
    }
    if (env.VITE_DB_HOST) {
      currentConfig.backend.host = env.VITE_DB_HOST;
    }
    if (env.VITE_DB_PORT) {
      currentConfig.backend.port = parseInt(env.VITE_DB_PORT);
    }
    if (env.VITE_DB_USERNAME) {
      currentConfig.backend.username = env.VITE_DB_USERNAME;
    }
    if (env.VITE_DB_PASSWORD) {
      currentConfig.backend.password = env.VITE_DB_PASSWORD;
    }
    if (env.VITE_DB_SSL) {
      currentConfig.backend.ssl = env.VITE_DB_SSL === 'true';
    }
    
    // GDPR configuration from environment
    if (env.VITE_GDPR_ENABLED !== undefined) {
      currentConfig.gdpr.enabled = env.VITE_GDPR_ENABLED === 'true';
    }
    
    // Encryption configuration
    if (env.VITE_ENCRYPTION_ENABLED !== undefined) {
      currentConfig.gdpr.encryption.enabled = env.VITE_ENCRYPTION_ENABLED === 'true';
    }
    if (env.VITE_ENCRYPTION_ALGORITHM) {
      currentConfig.gdpr.encryption.algorithm = env.VITE_ENCRYPTION_ALGORITHM as any;
    }
    if (env.VITE_ENCRYPTION_MASTER_KEY) {
      currentConfig.gdpr.encryption.masterKey = env.VITE_ENCRYPTION_MASTER_KEY;
    }
    if (env.VITE_KEY_ROTATION_DAYS) {
      currentConfig.gdpr.encryption.keyRotationDays = parseInt(env.VITE_KEY_ROTATION_DAYS);
    }
    
    // Consent configuration
    if (env.VITE_CONSENT_REQUIRED !== undefined) {
      currentConfig.gdpr.consent.required = env.VITE_CONSENT_REQUIRED === 'true';
    }
    
    // Audit configuration
    if (env.VITE_AUDIT_ENABLED !== undefined) {
      currentConfig.gdpr.audit.enabled = env.VITE_AUDIT_ENABLED === 'true';
    }
    if (env.VITE_AUDIT_RETENTION_DAYS) {
      currentConfig.gdpr.audit.retentionDays = parseInt(env.VITE_AUDIT_RETENTION_DAYS);
    }
    
    // Cache configuration
    if (env.VITE_CACHE_ENABLED !== undefined) {
      if (currentConfig.cache) {
        currentConfig.cache.enabled = env.VITE_CACHE_ENABLED === 'true';
      }
    }
    if (env.VITE_CACHE_TYPE && currentConfig.cache) {
      currentConfig.cache.type = env.VITE_CACHE_TYPE as any;
    }
    if (env.VITE_CACHE_TTL && currentConfig.cache) {
      currentConfig.cache.ttl = parseInt(env.VITE_CACHE_TTL);
    }
    if (env.VITE_CACHE_MAX_SIZE && currentConfig.cache) {
      currentConfig.cache.maxSize = parseInt(env.VITE_CACHE_MAX_SIZE);
    }
  },
  
  /**
   * Get configuration for a specific environment
   */
  getEnvironmentConfig: (environment: 'development' | 'test' | 'production'): Partial<StoragePluginConfig> => {
    const envConfigs = {
      development: {
        backend: { type: 'indexeddb' as const },
        gdpr: { 
          enabled: true, 
          encryption: { enabled: false } // No encryption in dev for easier debugging
        },
        cache: { enabled: true, ttl: 60000 } // 1 minute cache
      },
      
      test: {
        backend: { type: 'memory' as const }, // In-memory for tests
        gdpr: { enabled: true },
        cache: { enabled: false } // No cache for predictable tests
      },
      
      production: {
        backend: { 
          type: 'postgresql' as const,
          ssl: true
        },
        gdpr: {
          enabled: true,
          encryption: { enabled: true, keyRotationDays: 30 },
          audit: { enabled: true, retentionDays: 2555 } // 7 years
        },
        cache: {
          enabled: true,
          type: 'memory' as const,
          ttl: 3600000 // 1 hour
        }
      }
    };
    
    return envConfigs[environment] || {};
  }
};

// Initialize with environment variables on module load
storageConfig.loadFromEnvironment();

// Export everything needed
export { defaultStorageConfig } from './default.config';
export { validateConfig } from './validator';
export type { StoragePluginConfig } from './types';