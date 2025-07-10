// Default Storage Plugin Configuration
import { StoragePluginConfig } from './types';
import { EntityType } from '../types';

export const defaultStorageConfig: StoragePluginConfig = {
  backend: {
    type: 'indexeddb',
    database: 'storage_plugin_db',
    options: { version: 1 }
  },
  
  gdpr: {
    enabled: false,
    encryption: {
      enabled: false,
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      keyRotationDays: 90,
      keyProvider: 'WebCrypto',
      encryptionStrength: 'high',
      currentVersion: 1,
      encryptedFields: {
        [EntityType.USERS]: ['email', 'name', 'phone'],
        [EntityType.POSTS]: ['content'],
        [EntityType.COMMENTS]: ['content']
      }
    },
    consent: {
      required: false,
      defaultConsent: true,
      purposes: [
        {
          id: 'essential',
          name: 'Essential Functions',
          description: 'Required for basic application functionality',
          category: 'necessary',
          required: true,
          legalBasis: 'legitimate_interest',
          dataCategories: ['functional_data']
        }
      ],
      expiryDays: 365,
      implicitConsent: ['essential'],
      explicitConsentRequired: [],
      withdrawalMethod: 'manual'
    },
    audit: {
      enabled: false,
      logLevel: 'standard',
      retentionDays: 730, // 2 years
      exportFormat: 'json',
      includeUserData: true,
      includeSystemData: true,
      includePerformanceData: false,
      realTimeMonitoring: false,
      anomalyDetection: false,
      storageBackend: 'indexeddb'
    },
    retention: {
      defaultRetentionDays: 2555, // 7 years
      customRetentionPolicies: [],
      automaticCleanup: false,
      notificationDays: 30
    },
    dataElements: {
      personalData: Object.values(EntityType),
      sensitiveData: [EntityType.USERS],
      publicData: [EntityType.POSTS],
      systemData: [EntityType.AUDIT_LOGS, EntityType.SESSIONS]
    }
  },
  
  cache: {
    enabled: true,
    type: 'memory',
    ttl: 60000, // 1 minute
    maxSize: 100,
    strategy: 'lru'
  },
  
  updateQueue: {
    enabled: false,
    batchWindow: 100,
    maxBatchSize: 10,
    retryAttempts: 3,
    retryDelay: 1000,
    maxQueueSize: 1000,
    priorityLevels: 3,
    deadLetterQueue: false,
    persistence: false
  }
};