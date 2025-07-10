// Core Types and Interfaces for GDPR Storage System
// Phase 1: Core Architecture Foundation

export interface StateManager {
  // Core entity operations
  getEntity<T>(table: string, id: string): T | undefined;
  setEntity<T>(table: string, id: string, data: T): void;
  removeEntity(table: string, id: string): void;
  
  // Batch operations
  batchUpdate(updates: EntityUpdate[]): void;
  batchRemove(removals: EntityRemoval[]): void;
  
  // Query operations
  getEntitiesWhere<T>(table: string, predicate: (entity: T) => boolean): T[];
  getAllEntities<T>(table: string): T[];
  
  // Subscription for reactivity
  subscribe(table: string, id: string, callback: (entity: any) => void): () => void;
  subscribeToTable(table: string, callback: (entities: any[]) => void): () => void;
  
  // Lifecycle
  initialize(config?: any): Promise<void>;
  clear(): void;
  destroy(): void;
  
  // Performance & debugging
  getStats(): StateManagerStats;
}

export interface EntityUpdate {
  table: string;
  id: string;
  data: any;
  metadata?: {
    userId?: string;
    timestamp?: number;
    source?: string;
  };
}

export interface EntityRemoval {
  table: string;
  id: string;
  metadata?: {
    userId?: string;
    timestamp?: number;
    reason?: string;
  };
}

export interface StateManagerStats {
  totalEntities: number;
  entitiesByTable: Record<string, number>;
  memoryUsage: number;
  cacheHitRate: number;
  lastUpdated: number;
}

export type StateManagerType = 'zustand' | 'jotai' | 'simple' | 'custom' | 'none';

export interface StateManagerConfig {
  type: StateManagerType;
  customImplementation?: StateManager;
  options?: {
    persistence?: boolean;
    devtools?: boolean;
    maxCacheSize?: number;
    ttl?: number;
  };
}

export interface GDPRStorageConfig {
  // State manager is completely optional
  stateManager?: StateManagerConfig;
  
  // Core GDPR configuration (always required)
  gdpr: GDPRConfig;
  
  // Database configuration (always required)
  database: DatabaseConfig;
  
  // Optional performance enhancements
  cache?: CacheConfig;
  
  // Update queue configuration
  updateQueue?: UpdateQueueConfig;
}

export interface GDPRConfig {
  encryption: EncryptionConfig;
  audit: AuditConfig;
  retention: RetentionConfig;
  consent: ConsentConfig;
  dataElements: DataElementConfig;
}

export interface EncryptionConfig {
  algorithm: 'AES-256-GCM' | 'AES-128-GCM';
  keyDerivation: 'PBKDF2' | 'scrypt';
  enabled: boolean;
  masterKey?: string;
  rotationInterval?: number; // days
}

export interface AuditConfig {
  enabled: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed';
  retentionDays: number;
  exportFormat: 'json' | 'csv' | 'xml';
}

export interface RetentionConfig {
  defaultPolicy: string; // ISO 8601 duration (e.g., 'P2Y' for 2 years)
  gracePeriod: number; // days
  automaticCleanup: boolean;
  policies: Record<string, string>; // table -> retention period
}

export interface ConsentConfig {
  required: boolean;
  defaultConsent: boolean;
  purposes: ConsentPurpose[];
  expiryDays: number;
}

export interface ConsentPurpose {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: 'necessary' | 'analytics' | 'marketing' | 'preferences';
}

export interface DataElementConfig {
  autoRegister: boolean;
  validation: boolean;
  inferSensitivity: boolean;
}

export interface DatabaseConfig {
  type: 'localStorage' | 'indexedDB' | 'postgresql' | 'memory';
  connectionString?: string;
  options?: {
    database?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    ssl?: boolean;
  };
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // milliseconds
  maxSize: number; // number of entities
  strategy: 'lru' | 'fifo' | 'ttl';
}

export interface UpdateQueueConfig {
  batchWindow: number; // milliseconds (default: 100)
  maxBatchSize: number; // number of updates
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

export interface DataElementDefinition {
  id: string;
  table: string;
  field: string;
  businessName: string;
  description: string;
  
  // GDPR Classification
  personalData: boolean;
  sensitiveData: boolean;
  publicData: boolean;
  
  // Security
  encrypted: boolean;
  encryptionLevel: 'none' | 'standard' | 'high';
  
  // Compliance
  retentionPeriod: string; // ISO 8601 duration
  legalBasis: string;
  processingPurposes: string[];
  
  // Access Control
  accessLevel: 'public' | 'internal' | 'restricted' | 'confidential';
  dataSubjectRights: {
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
  
  // Metadata
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  entity: string;
  entityId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Change details
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  
  // GDPR context
  legalBasis?: string;
  processingPurpose?: string;
  consentId?: string;
  
  // Metadata
  source: 'user' | 'system' | 'api' | 'migration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
}

export type AuditAction = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'export' | 'import' | 'encrypt' | 'decrypt'
  | 'consent_given' | 'consent_withdrawn'
  | 'retention_applied' | 'access_granted' | 'access_denied'
  | 'cache_hit' | 'cache_miss' | 'database_load'
  | 'batch_update' | 'queue_update' | 'migration';

export interface ConsentRecord {
  id: string;
  userId: string;
  purposeId: string;
  granted: boolean;
  timestamp: Date;
  expiresAt?: Date;
  source: 'explicit' | 'implicit' | 'legitimate_interest';
  ipAddress: string;
  userAgent: string;
  version: number;
  metadata?: Record<string, any>;
  purposes?: Record<string, boolean>; // purposeId -> granted
  givenAt?: Date;
  withdrawnAt?: Date;
}

export interface RetentionPolicy {
  id: string;
  table: string;
  field?: string; // if null, applies to entire table
  retentionPeriod: string; // ISO 8601 duration
  gracePeriod: number; // days
  deleteMode: 'soft' | 'hard' | 'anonymize';
  conditions?: Record<string, any>; // additional conditions
}

export interface DatabaseAdapter {
  initialize(): Promise<void>;
  findById<T>(table: string, id: string): Promise<T | null>;
  findAll<T>(table: string): Promise<T[]>;
  findWhere<T>(table: string, predicate: (entity: T) => boolean): Promise<T[]>;
  create<T>(table: string, id: string, data: T): Promise<void>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<void>;
  delete(table: string, id: string): Promise<void>;
  batchUpdate(updates: EntityUpdate[]): Promise<void>;
  batchDelete(removals: EntityRemoval[]): Promise<void>;
  close(): Promise<void>;
}

// Export data structures
export interface DataExportRequest {
  userId: string;
  format: 'json' | 'csv' | 'pdf' | 'xml';
  tables?: string[];
  includeMetadata: boolean;
  encryptExport: boolean;
  requestedBy?: string;
  includeTables?: string[];
}

export interface DataExportResult {
  requestId: string;
  userId: string;
  exportDate: Date;
  format: string;
  data: Record<string, any[]>;
  metadata: {
    totalRecords: number;
    tablesIncluded: string[];
    gdprCompliant: boolean;
    encrypted: boolean;
  };
  downloadUrl?: string;
  expiresAt: Date;
}

// Data deletion request
export interface DataDeletionRequest {
  userId: string;
  reason: string;
  hardDelete: boolean;
  requestedBy: string;
  includeTables?: string[];
}

// Data rectification request
export interface DataRectificationRequest {
  userId: string;
  updates: Record<string, Record<string, any>>;
  requestedBy: string;
  reason?: string;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  result: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// Audit event
export interface AuditEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  result?: 'success' | 'failure';
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// Encrypted data structure
export interface EncryptedData {
  algorithm: string;
  iv: string;
  ciphertext: string;
  tag?: string;
  keyId: string;
}

// Performance monitoring
export interface PerformanceMetrics {
  queryTimes: {
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  cacheStats: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    evictions: number;
  };
  updateQueue: {
    averageBatchSize: number;
    averageProcessingTime: number;
    queueLength: number;
    totalUpdates: number;
  };
  memory: {
    totalUsage: number;
    entitiesCount: number;
    averageEntitySize: number;
  };
}

// Error types
export class GDPRStorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GDPRStorageError';
  }
}

export class ConsentError extends GDPRStorageError {
  constructor(message: string, details?: any) {
    super(message, 'CONSENT_ERROR', details);
    this.name = 'ConsentError';
  }
}

export class EncryptionError extends GDPRStorageError {
  constructor(message: string, details?: any) {
    super(message, 'ENCRYPTION_ERROR', details);
    this.name = 'EncryptionError';
  }
}

export class RetentionError extends GDPRStorageError {
  constructor(message: string, details?: any) {
    super(message, 'RETENTION_ERROR', details);
    this.name = 'RetentionError';
  }
}

export class DataSubjectRightsError extends GDPRStorageError {
  constructor(message: string, details?: any) {
    super(message, 'DATA_SUBJECT_RIGHTS_ERROR', details);
    this.name = 'DataSubjectRightsError';
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;