// Storage Adapters - Export all available adapters
export { BaseAdapter } from './BaseAdapter';
export { IndexedDBAdapter } from './IndexedDBAdapter';
export { MemoryAdapter } from './MemoryAdapter';
export { PostgreSQLAdapter } from './PostgreSQLAdapter';

// Adapter factory function
import { StorageBackend, BackendConfig } from '../types';
import { BaseAdapter } from './BaseAdapter';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { MemoryAdapter } from './MemoryAdapter';
import { PostgreSQLAdapter } from './PostgreSQLAdapter';

export function createStorageAdapter(config: BackendConfig): StorageBackend {
  switch (config.type) {
    case 'indexeddb':
      return new IndexedDBAdapter(config.database, config.options?.version);
      
    case 'memory':
      return new MemoryAdapter();
      
    case 'postgresql':
      if (!config.host || !config.database) {
        throw new Error('PostgreSQL adapter requires host and database configuration');
      }
      return new PostgreSQLAdapter({
        host: config.host,
        port: config.port || 5432,
        database: config.database,
        user: config.username || 'postgres',
        password: config.password || '',
        ssl: config.ssl,
        poolSize: config.poolSize,
        connectionTimeoutMillis: config.timeout,
        ...config.options
      });
      
    case 'mongodb':
      throw new Error('MongoDB adapter not yet implemented');
      
    case 'mysql':
      throw new Error('MySQL adapter not yet implemented');
      
    case 'file':
      throw new Error('File adapter not yet implemented');
      
    default:
      throw new Error(`Unsupported storage backend: ${(config as any).type}`);
  }
}

// Adapter type checking utilities
export function isIndexedDBAdapter(adapter: StorageBackend): adapter is IndexedDBAdapter {
  return adapter.type === 'indexeddb';
}

export function isMemoryAdapter(adapter: StorageBackend): adapter is MemoryAdapter {
  return adapter.type === 'memory';
}

export function isPostgreSQLAdapter(adapter: StorageBackend): adapter is PostgreSQLAdapter {
  return adapter.type === 'postgresql';
}

// Adapter capabilities detection
export function getAdapterCapabilities(adapter: StorageBackend): string[] {
  const baseCapabilities = ['crud', 'query', 'count', 'clear'];
  
  switch (adapter.type) {
    case 'indexeddb':
      return [
        ...baseCapabilities,
        'transactions',
        'indexes',
        'cursors',
        'key_ranges',
        'compound_indexes',
        'auto_increment',
        'offline_support'
      ];
      
    case 'memory':
      return [
        ...baseCapabilities,
        'in_memory',
        'fast_access',
        'no_persistence',
        'unlimited_indexes',
        'development_mode'
      ];
      
    case 'postgresql':
      return [
        ...baseCapabilities,
        'transactions',
        'indexes',
        'foreign_keys',
        'full_text_search',
        'json_support',
        'window_functions',
        'common_table_expressions',
        'stored_procedures',
        'triggers',
        'views',
        'materialized_views',
        'partitioning',
        'replication',
        'acid_compliance'
      ];
      
    case 'mongodb':
      return [
        ...baseCapabilities,
        'documents',
        'schema_less',
        'aggregation_pipeline',
        'full_text_search',
        'geospatial',
        'sharding',
        'replication',
        'transactions'
      ];
      
    case 'mysql':
      return [
        ...baseCapabilities,
        'transactions',
        'indexes',
        'foreign_keys',
        'full_text_search',
        'json_support',
        'stored_procedures',
        'triggers',
        'views',
        'partitioning',
        'replication'
      ];
      
    default:
      return baseCapabilities;
  }
}

// Adapter performance characteristics
export interface AdapterPerformanceProfile {
  readPerformance: 'low' | 'medium' | 'high' | 'very_high';
  writePerformance: 'low' | 'medium' | 'high' | 'very_high';
  queryPerformance: 'low' | 'medium' | 'high' | 'very_high';
  scalability: 'low' | 'medium' | 'high' | 'very_high';
  persistence: boolean;
  distributedSupport: boolean;
  transactionSupport: boolean;
  fullTextSearch: boolean;
  optimalFor: string[];
}

export function getAdapterPerformanceProfile(adapterType: string): AdapterPerformanceProfile {
  const profiles: Record<string, AdapterPerformanceProfile> = {
    memory: {
      readPerformance: 'very_high',
      writePerformance: 'very_high',
      queryPerformance: 'very_high',
      scalability: 'low',
      persistence: false,
      distributedSupport: false,
      transactionSupport: false,
      fullTextSearch: false,
      optimalFor: ['development', 'testing', 'caching', 'temporary_data']
    },
    
    indexeddb: {
      readPerformance: 'high',
      writePerformance: 'high',
      queryPerformance: 'medium',
      scalability: 'medium',
      persistence: true,
      distributedSupport: false,
      transactionSupport: true,
      fullTextSearch: false,
      optimalFor: ['browser_apps', 'offline_support', 'client_storage', 'pwas']
    },
    
    postgresql: {
      readPerformance: 'high',
      writePerformance: 'high',
      queryPerformance: 'very_high',
      scalability: 'very_high',
      persistence: true,
      distributedSupport: true,
      transactionSupport: true,
      fullTextSearch: true,
      optimalFor: ['enterprise_apps', 'complex_queries', 'analytical_workloads', 'multi_user_systems']
    },
    
    mongodb: {
      readPerformance: 'high',
      writePerformance: 'very_high',
      queryPerformance: 'high',
      scalability: 'very_high',
      persistence: true,
      distributedSupport: true,
      transactionSupport: true,
      fullTextSearch: true,
      optimalFor: ['document_storage', 'flexible_schemas', 'horizontal_scaling', 'real_time_apps']
    },
    
    mysql: {
      readPerformance: 'high',
      writePerformance: 'high',
      queryPerformance: 'high',
      scalability: 'high',
      persistence: true,
      distributedSupport: true,
      transactionSupport: true,
      fullTextSearch: true,
      optimalFor: ['web_applications', 'e_commerce', 'content_management', 'traditional_rdbms']
    }
  };
  
  return profiles[adapterType] || profiles.memory;
}

// Adapter configuration validation
export function validateAdapterConfig(config: BackendConfig): string[] {
  const errors: string[] = [];
  
  if (!config.type) {
    errors.push('Backend type is required');
    return errors;
  }
  
  switch (config.type) {
    case 'postgresql':
    case 'mysql':
      if (!config.host) errors.push('Host is required for SQL databases');
      if (!config.database) errors.push('Database name is required for SQL databases');
      if (!config.username) errors.push('Username is required for SQL databases');
      if (config.port && (config.port < 1 || config.port > 65535)) {
        errors.push('Port must be between 1 and 65535');
      }
      break;
      
    case 'mongodb':
      if (!config.connectionString && !config.host) {
        errors.push('Either connection string or host is required for MongoDB');
      }
      break;
      
    case 'indexeddb':
      if (typeof window === 'undefined') {
        errors.push('IndexedDB is only available in browser environments');
      }
      break;
      
    case 'memory':
      // No specific validation required
      break;
      
    case 'file':
      if (typeof window !== 'undefined') {
        errors.push('File adapter is not available in browser environments');
      }
      break;
  }
  
  return errors;
}

// Adapter recommendation engine
export interface AdapterRecommendation {
  adapter: string;
  score: number;
  reasons: string[];
  warnings?: string[];
}

export function recommendAdapter(requirements: {
  environment: 'browser' | 'node' | 'both';
  dataSize: 'small' | 'medium' | 'large' | 'very_large';
  queryComplexity: 'simple' | 'medium' | 'complex';
  scalability: 'single_user' | 'multi_user' | 'enterprise';
  persistence: 'none' | 'session' | 'permanent';
  consistency: 'eventual' | 'strong';
  budget: 'free' | 'low' | 'medium' | 'high';
}): AdapterRecommendation[] {
  const recommendations: AdapterRecommendation[] = [];
  
  // Memory adapter
  if (requirements.persistence === 'none' || requirements.persistence === 'session') {
    recommendations.push({
      adapter: 'memory',
      score: requirements.persistence === 'none' ? 100 : 80,
      reasons: [
        'Fastest performance',
        'No persistence overhead',
        'Perfect for temporary data'
      ],
      warnings: requirements.persistence !== 'none' ? ['Data lost on restart'] : undefined
    });
  }
  
  // IndexedDB adapter
  if (requirements.environment === 'browser' || requirements.environment === 'both') {
    let score = 70;
    const reasons = ['Browser native support', 'Offline capabilities'];
    const warnings: string[] = [];
    
    if (requirements.persistence === 'permanent') score += 20;
    if (requirements.dataSize === 'small' || requirements.dataSize === 'medium') score += 10;
    if (requirements.scalability === 'single_user') score += 10;
    if (requirements.queryComplexity === 'complex') {
      score -= 20;
      warnings.push('Limited query capabilities');
    }
    
    recommendations.push({
      adapter: 'indexeddb',
      score,
      reasons,
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }
  
  // PostgreSQL adapter
  if (requirements.environment === 'node' || requirements.environment === 'both') {
    let score = 60;
    const reasons = ['Enterprise grade', 'Full ACID compliance', 'Advanced query features'];
    const warnings: string[] = [];
    
    if (requirements.queryComplexity === 'complex') score += 30;
    if (requirements.scalability === 'enterprise') score += 25;
    if (requirements.consistency === 'strong') score += 20;
    if (requirements.dataSize === 'large' || requirements.dataSize === 'very_large') score += 15;
    if (requirements.budget === 'free' || requirements.budget === 'low') {
      score -= 10;
      warnings.push('May require infrastructure costs');
    }
    
    recommendations.push({
      adapter: 'postgresql',
      score,
      reasons,
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }
  
  // Sort by score descending
  return recommendations.sort((a, b) => b.score - a.score);
}

export default {
  createStorageAdapter,
  getAdapterCapabilities,
  getAdapterPerformanceProfile,
  validateAdapterConfig,
  recommendAdapter
};