// Storage Plugin Configuration Types
// Re-export types from main types file for config module

export type {
  StoragePluginConfig,
  BackendConfig,
  GDPRConfig,
  EncryptionConfig,
  AuditConfig,
  ConsentConfig,
  RetentionConfig,
  DataElementConfig,
  CacheConfig,
  UpdateQueueConfig,
  StateManagerIntegrationConfig,
  PerformanceConfig,
  MonitoringConfig,
  SecurityConfig,
  ConsentPurpose
} from '../types';

// EntityType is imported directly from '../types' where needed