// Storage Plugin Configuration Validator
import { StoragePluginConfig } from './types';

export const validateConfig = (config: Partial<StoragePluginConfig>): string[] => {
  const errors: string[] = [];
  
  // Backend validation
  if (!config.backend?.type) {
    errors.push('Backend type is required');
  } else {
    const validBackendTypes = ['indexeddb', 'postgresql', 'mongodb', 'mysql', 'memory', 'file'];
    if (!validBackendTypes.includes(config.backend.type)) {
      errors.push(`Invalid backend type: ${config.backend.type}. Must be one of: ${validBackendTypes.join(', ')}`);
    }
    
    // Database validation for non-memory backends
    if (config.backend.type !== 'memory' && !config.backend.database) {
      errors.push('Database name is required for non-memory backends');
    }
    
    // Remote database validation
    if (['postgresql', 'mongodb', 'mysql'].includes(config.backend.type)) {
      if (!config.backend.host && !config.backend.connectionString) {
        errors.push('Database host or connection string required for remote backends');
      }
    }
  }
  
  // GDPR validation
  if (!config.gdpr) {
    errors.push('GDPR configuration is required');
  } else {
    // Encryption validation
    if (config.gdpr.encryption?.enabled) {
      if (!config.gdpr.encryption.algorithm) {
        errors.push('Encryption algorithm is required when encryption is enabled');
      }
      
      if (!config.gdpr.encryption.keyDerivation) {
        errors.push('Key derivation method is required when encryption is enabled');
      }
      
      if (config.gdpr.encryption.keyRotationDays && config.gdpr.encryption.keyRotationDays < 0) {
        errors.push('Key rotation days must be non-negative');
      }
      
      // Validate encrypted fields structure
      if (config.gdpr.encryption.encryptedFields) {
        const encryptedFields = config.gdpr.encryption.encryptedFields;
        if (typeof encryptedFields !== 'object') {
          errors.push('Encrypted fields must be an object mapping entity types to field arrays');
        } else {
          Object.entries(encryptedFields).forEach(([entityType, fields]) => {
            if (!Array.isArray(fields)) {
              errors.push(`Encrypted fields for ${entityType} must be an array`);
            }
          });
        }
      }
    }
    
    // Consent validation
    if (config.gdpr.consent?.required) {
      if (!config.gdpr.consent.purposes || config.gdpr.consent.purposes.length === 0) {
        errors.push('At least one consent purpose is required when consent is required');
      } else {
        config.gdpr.consent.purposes.forEach((purpose, index) => {
          if (!purpose.id) {
            errors.push(`Consent purpose at index ${index} must have an id`);
          }
          if (!purpose.name) {
            errors.push(`Consent purpose at index ${index} must have a name`);
          }
          if (!purpose.description) {
            errors.push(`Consent purpose at index ${index} must have a description`);
          }
        });
      }
    }
    
    // Audit validation
    if (config.gdpr.audit?.enabled) {
      if (config.gdpr.audit.retentionDays && config.gdpr.audit.retentionDays < 1) {
        errors.push('Audit retention days must be at least 1');
      }
    }
  }
  
  // Cache validation
  if (config.cache?.enabled) {
    if (!config.cache.type) {
      errors.push('Cache type is required when cache is enabled');
    }
    
    if (config.cache.ttl && config.cache.ttl < 0) {
      errors.push('Cache TTL must be non-negative');
    }
    
    if (config.cache.maxSize && config.cache.maxSize < 1) {
      errors.push('Cache max size must be at least 1');
    }
  }
  
  // Update queue validation
  if (config.updateQueue?.enabled) {
    if (config.updateQueue.batchWindow && config.updateQueue.batchWindow < 0) {
      errors.push('Update queue batch window must be non-negative');
    }
    
    if (config.updateQueue.maxBatchSize && config.updateQueue.maxBatchSize < 1) {
      errors.push('Update queue max batch size must be at least 1');
    }
    
    if (config.updateQueue.retryAttempts && config.updateQueue.retryAttempts < 0) {
      errors.push('Update queue retry attempts must be non-negative');
    }
  }
  
  return errors;
};