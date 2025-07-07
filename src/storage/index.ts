// GDPR Storage - Main Exports and Public API
// Production-ready organized storage system

// Core storage classes
export { GDPRStorage } from '../core/storage/gdpr/GDPRStorage';
export { StateManagerFactory } from '../core/storage/gdpr/StateManagerFactory';
export { UpdateQueueManager } from '../core/storage/gdpr/UpdateQueueManager';

// State manager implementations
export { ZustandStateManager } from '../core/storage/gdpr/state-managers/ZustandStateManager';
export { JotaiStateManager } from '../core/storage/gdpr/state-managers/JotaiStateManager';

// TypeScript types and interfaces
export type {
  // Core interfaces
  StateManager,
  StateManagerStats,
  StateManagerType,
  StateManagerConfig,
  GDPRStorageConfig,
  
  // Entity operations
  EntityUpdate,
  EntityRemoval,
  
  // GDPR types
  GDPRConfig,
  EncryptionConfig,
  AuditConfig,
  RetentionConfig,
  ConsentConfig,
  ConsentPurpose,
  DataElementConfig,
  DataElementDefinition,
  AuditEntry,
  ConsentRecord,
  RetentionPolicy,
  
  // Database and caching
  DatabaseConfig,
  DatabaseAdapter,
  CacheConfig,
  UpdateQueueConfig,
  
  // Export and performance
  DataExportRequest,
  DataExportResult,
  PerformanceMetrics,
  
  // Error types
  GDPRStorageError,
  ConsentError,
  EncryptionError,
  RetentionError,
  
  // Utility types
  DeepPartial,
  RequiredKeys,
  OptionalKeys,
  AuditAction
} from '../core/storage/gdpr/types';

// Configuration presets for easy setup
export const StoragePresets = {
  // Development preset - Simple state manager, no encryption
  DEVELOPMENT: {
    stateManager: { type: 'simple' as const, options: { persistence: false } },
    gdpr: {
      encryption: { algorithm: 'AES-256-GCM' as const, keyDerivation: 'PBKDF2' as const, enabled: false },
      audit: { enabled: true, logLevel: 'standard' as const, retentionDays: 30, exportFormat: 'json' as const },
      retention: { defaultPolicy: 'P1Y', gracePeriod: 30, automaticCleanup: false, policies: {} },
      consent: { required: false, defaultConsent: true, purposes: [], expiryDays: 365 },
      dataElements: { autoRegister: true, validation: false, inferSensitivity: false }
    },
    database: { type: 'memory' as const },
    cache: { enabled: true, ttl: 5 * 60 * 1000, maxSize: 1000, strategy: 'lru' as const },
    updateQueue: { batchWindow: 100, maxBatchSize: 50, retryAttempts: 3, retryDelay: 1000 }
  },
  
  // Production preset - Zustand state manager, full GDPR compliance
  PRODUCTION: {
    stateManager: { type: 'zustand' as const, options: { persistence: true } },
    gdpr: {
      encryption: { algorithm: 'AES-256-GCM' as const, keyDerivation: 'PBKDF2' as const, enabled: true },
      audit: { enabled: true, logLevel: 'detailed' as const, retentionDays: 2555, exportFormat: 'json' as const }, // 7 years
      retention: { defaultPolicy: 'P2Y', gracePeriod: 90, automaticCleanup: true, policies: {} },
      consent: { required: true, defaultConsent: false, purposes: [], expiryDays: 365 },
      dataElements: { autoRegister: true, validation: true, inferSensitivity: true }
    },
    database: { type: 'postgresql' as const },
    cache: { enabled: true, ttl: 10 * 60 * 1000, maxSize: 10000, strategy: 'lru' as const },
    updateQueue: { batchWindow: 50, maxBatchSize: 100, retryAttempts: 5, retryDelay: 1000 }
  },
  
  // Testing preset - Jotai state manager, moderate settings
  TESTING: {
    stateManager: { type: 'jotai' as const, options: { atomGC: true } },
    gdpr: {
      encryption: { algorithm: 'AES-256-GCM' as const, keyDerivation: 'PBKDF2' as const, enabled: false },
      audit: { enabled: true, logLevel: 'standard' as const, retentionDays: 90, exportFormat: 'json' as const },
      retention: { defaultPolicy: 'P30D', gracePeriod: 7, automaticCleanup: true, policies: {} },
      consent: { required: false, defaultConsent: true, purposes: [], expiryDays: 30 },
      dataElements: { autoRegister: true, validation: true, inferSensitivity: false }
    },
    database: { type: 'memory' as const },
    cache: { enabled: true, ttl: 1 * 60 * 1000, maxSize: 100, strategy: 'ttl' as const },
    updateQueue: { batchWindow: 10, maxBatchSize: 10, retryAttempts: 2, retryDelay: 500 }
  },
  
  // High Performance preset - Optimized for speed
  HIGH_PERFORMANCE: {
    stateManager: { type: 'zustand' as const, options: { persistence: false } },
    gdpr: {
      encryption: { algorithm: 'AES-128-GCM' as const, keyDerivation: 'scrypt' as const, enabled: false },
      audit: { enabled: false, logLevel: 'minimal' as const, retentionDays: 7, exportFormat: 'json' as const },
      retention: { defaultPolicy: 'P1Y', gracePeriod: 0, automaticCleanup: true, policies: {} },
      consent: { required: false, defaultConsent: true, purposes: [], expiryDays: 365 },
      dataElements: { autoRegister: false, validation: false, inferSensitivity: false }
    },
    database: { type: 'memory' as const },
    cache: { enabled: true, ttl: 30 * 60 * 1000, maxSize: 50000, strategy: 'lru' as const },
    updateQueue: { batchWindow: 25, maxBatchSize: 200, retryAttempts: 1, retryDelay: 100 }
  }
} as const;

// Utility functions for easy configuration
export const StorageUtils = {
  // Create storage with preset configuration
  createWithPreset(preset: keyof typeof StoragePresets, overrides?: Partial<GDPRStorageConfig>) {
    const config = { ...StoragePresets[preset], ...overrides };
    return new GDPRStorage(config);
  },
  
  // Get available state managers
  getAvailableStateManagers() {
    return StateManagerFactory.getAvailableTypes().filter(type => 
      StateManagerFactory.isTypeAvailable(type)
    );
  },
  
  // Create development storage quickly
  createDevelopmentStorage(stateManagerType?: StateManagerType) {
    const config = { 
      ...StoragePresets.DEVELOPMENT,
      stateManager: stateManagerType ? { type: stateManagerType } : StoragePresets.DEVELOPMENT.stateManager
    };
    return new GDPRStorage(config);
  },
  
  // Create production storage with environment configuration
  createProductionStorage(databaseUri?: string) {
    const config = { 
      ...StoragePresets.PRODUCTION,
      database: databaseUri 
        ? { type: 'postgresql' as const, connectionString: databaseUri }
        : StoragePresets.PRODUCTION.database
    };
    return new GDPRStorage(config);
  }
};

// Error classes for easy imports
export {
  GDPRStorageError,
  ConsentError,
  EncryptionError,
  RetentionError
} from '../core/storage/gdpr/types';

// Verification and testing utilities
export {
  verifyPhase1,
  demonstratePhase1,
  testBasicFunctionalityWithoutStateManager,
  testBasicFunctionalityWithSimpleStateManager,
  testUpdateQueueBatching,
  testPerformanceTracking,
  testErrorHandling,
  basicGdprConfig,
  testDatabaseConfig,
  testCacheConfig
} from '../core/storage/gdpr/phase1-verification';

export {
  verifyPhase2,
  demonstratePhase2,
  testStateManagerAvailability,
  testAllStateManagers,
  testPerformanceComparison,
  testReactIntegrationPatterns,
  testStateManagerSpecificFeatures
} from '../core/storage/gdpr/phase2-verification';

// React hooks and components
export {
  // Core hooks
  GDPRStorageContext,
  useGDPRStorage,
  useOptionalGDPRStorage,
  
  // Entity hooks
  useEntity,
  useEntities,
  useEntityMutation,
  
  // Performance and monitoring hooks
  useStorageStats,
  usePerformanceMonitor,
  useStorageHealth,
  
  // Provider component
  GDPRStorageProvider,
  withGDPRStorage,
  
  // Types
  type StorageStatsData
} from './hooks';

// Re-export everything for convenience
export * from '../core/storage/gdpr/types';