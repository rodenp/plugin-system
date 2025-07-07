// Storage Plugin Types - Complete Implementation
// Based on /spec/STORAGE_PLUGIN_IMPLEMENTATION_SPEC.md

// Core Entity Types
export enum EntityType {
  USERS = 'users',
  POSTS = 'posts',
  COMMENTS = 'comments',
  REPLIES = 'replies',
  COURSES = 'courses',
  MODULES = 'modules',
  LESSONS = 'lessons',
  ASSIGNMENTS = 'assignments',
  SUBMISSIONS = 'submissions',
  GRADES = 'grades',
  ENROLLMENTS = 'enrollments',
  CERTIFICATES = 'certificates',
  MEMBERS = 'members',
  GROUPS = 'groups',
  EVENTS = 'events',
  NOTIFICATIONS = 'notifications',
  MESSAGES = 'messages',
  ATTACHMENTS = 'attachments',
  PRODUCTS = 'products',
  ORDERS = 'orders',
  PAYMENTS = 'payments',
  ANALYTICS = 'analytics',
  AUDIT_LOGS = 'audit_logs',
  CONSENT_RECORDS = 'consent_records',
  DATA_EXPORTS = 'data_exports',
  SESSIONS = 'sessions',
  USER_PREFERENCES = 'user_preferences',
  USER_LIKES = 'user_likes',
  USER_FOLLOWS = 'user_follows',
  TAGS = 'tags',
  CATEGORIES = 'categories',
  MEDIA = 'media',
  FILES = 'files',
  BACKUPS = 'backups',
  INTEGRATIONS = 'integrations',
  WEBHOOKS = 'webhooks',
  API_KEYS = 'api_keys',
  TOKENS = 'tokens',
  ENCRYPTION_METADATA = 'encryption_metadata'
}

// Base Storage Entity
export interface StorageEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
  metadata?: Record<string, any>;
}

// Data Categories for GDPR Classification
export enum DataCategory {
  // GDPR Special Categories (Article 9)
  SPECIAL_CATEGORY = 'special_category',
  HEALTH_DATA = 'health_data',
  BIOMETRIC_DATA = 'biometric_data',
  GENETIC_DATA = 'genetic_data',
  RACIAL_ETHNIC_DATA = 'racial_ethnic_data',
  POLITICAL_OPINIONS = 'political_opinions',
  RELIGIOUS_BELIEFS = 'religious_beliefs',
  TRADE_UNION_DATA = 'trade_union_data',
  SEXUAL_ORIENTATION = 'sexual_orientation',
  CRIMINAL_DATA = 'criminal_data',
  
  // Financial & Payment Data
  FINANCIAL = 'financial',
  PAYMENT_DATA = 'payment_data',
  BANKING_DATA = 'banking_data',
  CREDIT_DATA = 'credit_data',
  
  // Authentication & Security
  AUTHENTICATION = 'authentication',
  CREDENTIALS = 'credentials',
  TOKENS = 'tokens',
  API_KEYS = 'api_keys',
  
  // Personal Identifiers
  PERSONAL_IDENTIFIER = 'personal_identifier',
  CONTACT_INFO = 'contact_info',
  GOVERNMENT_ID = 'government_id',
  
  // User Content & Behavior
  USER_CONTENT = 'user_content',
  BEHAVIORAL = 'behavioral',
  PREFERENCE_DATA = 'preference_data',
  COMMUNICATION = 'communication',
  
  // Educational Data
  EDUCATIONAL = 'educational',
  ACADEMIC_RECORD = 'academic_record',
  PERFORMANCE_DATA = 'performance_data',
  
  // Technical & System Data
  TECHNICAL = 'technical',
  SYSTEM_DATA = 'system_data',
  LOG_DATA = 'log_data',
  ANALYTICS_DATA = 'analytics_data',
  
  // Location Data
  LOCATION_DATA = 'location_data',
  GEOLOCATION = 'geolocation',
  
  // Marketing & Profiling
  MARKETING_DATA = 'marketing_data',
  PROFILING_DATA = 'profiling_data',
  
  // Legal & Compliance
  LEGAL_DATA = 'legal_data',
  COMPLIANCE_DATA = 'compliance_data',
  
  // Public & Anonymous
  PUBLIC = 'public',
  ANONYMOUS = 'anonymous',
  AGGREGATED = 'aggregated'
}

// Legal Basis for Data Processing (GDPR Article 6)
export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTEREST = 'legitimate_interest',
  EXPLICIT_CONSENT = 'explicit_consent' // For special categories
}

// Data Subject Rights (GDPR Chapter III)
export interface DataSubjectRights {
  access: boolean;           // Article 15 - Right of access
  rectification: boolean;    // Article 16 - Right to rectification
  erasure: boolean;          // Article 17 - Right to erasure
  restriction: boolean;      // Article 18 - Right to restriction
  portability: boolean;      // Article 20 - Right to data portability
  objection: boolean;        // Article 21 - Right to object
  automated_decision: boolean; // Article 22 - Automated decision-making
}

// GDPR Audit Actions for comprehensive compliance tracking
export enum GDPRAuditAction {
  // Core CRUD operations
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  QUERY = 'query',
  
  // Data Subject Rights (Articles 15-22)
  DATA_ACCESS = 'data_access',
  DATA_RECTIFICATION = 'data_rectification',
  DATA_ERASURE = 'data_erasure',
  DATA_PORTABILITY = 'data_portability',
  PROCESSING_RESTRICTION = 'processing_restriction',
  PROCESSING_OBJECTION = 'processing_objection',
  AUTOMATED_DECISION = 'automated_decision',
  
  // Consent Management (Articles 6-7)
  CONSENT_GRANTED = 'consent_granted',
  CONSENT_REVOKED = 'consent_revoked',
  CONSENT_WITHDRAWN = 'consent_withdrawn',
  
  // Data Protection & Security (Articles 25, 32-34)
  DATA_BREACH_DETECTED = 'data_breach_detected',
  DATA_BREACH_CONTAINED = 'data_breach_contained',
  DATA_BREACH_NOTIFICATION = 'data_breach_notification',
  ENCRYPTION_APPLIED = 'encryption_applied',
  PSEUDONYMIZATION_APPLIED = 'pseudonymization_applied',
  
  // Transfer & Sharing (Articles 44-49)
  DATA_TRANSFER_INITIATED = 'data_transfer_initiated',
  DATA_SHARING_APPROVED = 'data_sharing_approved',
  CROSS_BORDER_TRANSFER = 'cross_border_transfer',
  
  // System & Administrative
  RETENTION_POLICY_APPLIED = 'retention_policy_applied',
  DATA_ANONYMIZATION = 'data_anonymization',
  PROFILING_ACTIVITY = 'profiling_activity',
  DPIA_REQUIRED = 'dpia_required',
  DPIA_COMPLETED = 'dpia_completed'
}

// Error Classes
export class StorageError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ConsentError extends StorageError {
  constructor(message: string, public requiredPurpose?: string, details?: any) {
    super(message, 'CONSENT_ERROR', details);
    this.name = 'ConsentError';
  }
}

export class EncryptionError extends StorageError {
  constructor(message: string, public field?: string, details?: any) {
    super(message, 'ENCRYPTION_ERROR', details);
    this.name = 'EncryptionError';
  }
}

export class ValidationError extends StorageError {
  constructor(message: string, public field?: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class RetentionError extends StorageError {
  constructor(message: string, public dataElement?: string, details?: any) {
    super(message, 'RETENTION_ERROR', details);
    this.name = 'RetentionError';
  }
}

// GDPR Configuration Types
export interface GDPRConfig {
  enabled: boolean;
  encryption: EncryptionConfig;
  audit: AuditConfig;
  consent: ConsentConfig;
  retention: RetentionConfig;
  dataElements: DataElementConfig;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'AES-256-GCM' | 'AES-128-GCM' | 'ChaCha20-Poly1305';
  keyDerivation: 'PBKDF2' | 'scrypt' | 'Argon2';
  keyRotationDays: number;
  encryptedFields: Record<string, string[]>; // table -> fields
  keyProvider: 'WebCrypto' | 'HSM' | 'KMS' | 'File';
  keyStorageLocation?: string;
  compressionEnabled?: boolean;
  encryptionStrength: 'standard' | 'high' | 'maximum';
  // Encryption versioning
  currentVersion?: number;
  encryptionVersions?: EncryptionVersion[];
  masterKey?: string | Uint8Array;
}

export interface EncryptionVersion {
  version: number;
  createdAt: Date;
  encryptedFields: Record<string, string[]>; // table -> fields
  algorithm: string;
  description?: string;
  active: boolean;
  table?: string; // Specific table this version applies to
}

export interface TableEncryptionVersion {
  table: string;
  version: number;
  createdAt: Date;
  encryptedFields: string[]; // fields for this specific table
  algorithm: string;
  description?: string;
  active: boolean;
}

export interface EncryptionMetadata extends StorageEntity {
  tableName: string;
  encryptionVersion: number;
  encryptedFields: string[];
  algorithm: string;
  description?: string;
  active: boolean;
  previousVersion?: number;
}

export interface AuditConfig {
  enabled: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
  retentionDays: number;
  exportFormat: 'json' | 'csv' | 'xml';
  includeUserData: boolean;
  includeSystemData: boolean;
  includePerformanceData: boolean;
  realTimeMonitoring: boolean;
  anomalyDetection: boolean;
  storageBackend: 'memory' | 'indexeddb' | 'file' | 'remote';
}

export interface ConsentConfig {
  required: boolean;
  defaultConsent: boolean;
  purposes: ConsentPurpose[];
  expiryDays: number;
  implicitConsent: string[];
  explicitConsentRequired: string[];
  withdrawalMethod: 'automatic' | 'manual' | 'hybrid';
  consentVersion: string;
  doubleOptIn: boolean;
  blockWithoutConsent?: boolean; // Whether to block operations without consent
  defaultRetention?: string; // Default retention period for consent records
  auditEnabled?: boolean; // Whether to audit consent changes
}

export interface RetentionConfig {
  defaultPolicy: string; // ISO 8601 duration (P1Y = 1 year)
  policies: Record<string, string>; // table -> retention policy
  gracePeriod: number; // days
  automaticCleanup: boolean;
  archiveBeforeDelete: boolean;
  notifyBeforeDelete: boolean;
  legalHoldSupport: boolean;
  minimumRetention: Record<string, string>; // Legal minimums
}

export interface DataElementConfig {
  autoRegister: boolean;
  validation: boolean;
  inferSensitivity: boolean;
  customDefinitions: Record<string, DataElementDefinition>;
  sensitivityPatterns: SensitivityPattern[];
  dataClassification: boolean;
}

// GDPR Entity Types
export interface ConsentPurpose {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: 'necessary' | 'analytics' | 'marketing' | 'preferences' | 'functional';
  legalBasis: LegalBasis;
  dataCategories: DataCategory[];
  retentionPeriod?: string;
  thirdPartySharing?: boolean;
  geographicRestrictions?: string[];
}

export interface ConsentRecord extends Omit<StorageEntity, 'version'> {
  userId: string;
  purposeId: string;
  granted: boolean;
  source: 'explicit' | 'implicit' | 'legitimate_interest' | 'pre_ticked' | 'inferred';
  method: 'checkbox' | 'button' | 'api' | 'form' | 'voice' | 'biometric';
  ipAddress?: string;
  userAgent?: string;
  geolocation?: string;
  evidenceType: 'digital_signature' | 'checkbox_tick' | 'voice_recording' | 'api_call';
  evidence?: any;
  expiresAt?: Date;
  withdrawnAt?: Date;
  version: string; // Consent version, not entity version
  entityVersion?: number; // Optional entity version
  language: string;
  doubleOptInConfirmed?: boolean;
}

export interface AuditEntry extends StorageEntity {
  userId: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  resourceType?: EntityType;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  geolocation?: string;
  success: boolean;
  errorMessage?: string;
  performanceMetrics?: {
    duration: number;
    memoryUsage?: number;
    cpu?: number;
  };
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  dataCategories?: DataCategory[];
  legalBasis?: LegalBasis;
  consentRequired?: boolean;
  retentionPolicy?: string;
  // Enhanced GDPR fields
  processingPurpose?: string;
  retentionPeriod?: string;
  recipients?: string[];
}

// AuditLog is the type used by AuditLogger service
export interface AuditLog extends Omit<StorageEntity, 'version'> {
  userId: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  // GDPR-specific fields for Article 30 compliance
  legalBasis?: LegalBasis;
  processingPurpose?: string;
  dataCategories?: DataCategory[];
  retentionPeriod?: string;
  recipients?: string[];
  geolocation?: string;
}

export interface DataElementDefinition {
  id: string;
  name: string;
  entity: EntityType;
  field: string;
  category: DataCategory;
  type: 'personal' | 'sensitive' | 'special_category' | 'public' | 'anonymous';
  encryptionRequired: boolean;
  retentionPolicy: string;
  purposes: string[];
  legalBasis: LegalBasis;
  dataSubjectRights: DataSubjectRights;
  thirdPartySharing: boolean;
  crossBorderTransfer: boolean;
  description: string;
  examples?: string[];
  validationRules?: ValidationRule[];
  sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';
}

export interface SensitivityPattern {
  pattern: RegExp;
  category: DataCategory;
  encryptionRequired: boolean;
  description: string;
  examples: string[];
}

export interface ValidationRule {
  type: 'regex' | 'length' | 'range' | 'enum' | 'custom';
  rule: any;
  message: string;
  required?: boolean;
}

// Storage Backend Types
export interface StorageBackend {
  type: 'indexeddb' | 'postgresql' | 'mongodb' | 'mysql' | 'memory' | 'file';
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // CRUD operations
  create<T extends StorageEntity>(table: string, data: T): Promise<T>;
  read<T extends StorageEntity>(table: string, id: string): Promise<T | null>;
  update<T extends StorageEntity>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<void>;
  
  // Batch operations
  createMany<T extends StorageEntity>(table: string, data: T[]): Promise<T[]>;
  updateMany<T extends StorageEntity>(table: string, updates: Array<{id: string, data: Partial<T>}>): Promise<T[]>;
  deleteMany(table: string, ids: string[]): Promise<void>;
  
  // Query operations
  query<T extends StorageEntity>(table: string, filter?: QueryFilter<T>): Promise<T[]>;
  count(table: string, filter?: QueryFilter<any>): Promise<number>;
  exists(table: string, id: string): Promise<boolean>;
  
  // Advanced query operations
  aggregate<T extends StorageEntity>(table: string, pipeline: AggregationPipeline): Promise<any[]>;
  search<T extends StorageEntity>(table: string, query: SearchQuery): Promise<T[]>;
  
  // Transaction support
  beginTransaction(): Promise<Transaction>;
  commitTransaction(tx: Transaction): Promise<void>;
  rollbackTransaction(tx: Transaction): Promise<void>;
  
  // Schema operations
  createTable(table: string, schema?: TableSchema): Promise<void>;
  dropTable(table: string): Promise<void>;
  alterTable(table: string, changes: TableChange[]): Promise<void>;
  
  // Index operations
  createIndex(table: string, fields: string[], options?: IndexOptions): Promise<void>;
  dropIndex(table: string, indexName: string): Promise<void>;
  
  // Maintenance operations
  clear(table: string): Promise<void>;
  vacuum(table?: string): Promise<void>;
  analyze(table?: string): Promise<AnalysisResult>;
  backup(options?: BackupOptions): Promise<BackupResult>;
  restore(backup: BackupData, options?: RestoreOptions): Promise<void>;
  
  // Monitoring operations
  getStorageInfo(): Promise<StorageInfo>;
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
  getHealthStatus(): Promise<HealthStatus>;
}

// Query and Filter Types
export interface QueryFilter<T> {
  where?: Partial<T> | ComplexFilter<T>;
  orderBy?: Array<{field: keyof T, direction: 'asc' | 'desc'}>;
  limit?: number;
  offset?: number;
  select?: Array<keyof T>;
  include?: string[];
  exclude?: string[];
}

export interface ComplexFilter<T> {
  and?: Array<Partial<T> | ComplexFilter<T>>;
  or?: Array<Partial<T> | ComplexFilter<T>>;
  not?: Partial<T> | ComplexFilter<T>;
  [field: string]: any;
}

export interface SearchQuery {
  text: string;
  fields?: string[];
  fuzzy?: boolean;
  boost?: Record<string, number>;
  filters?: Record<string, any>;
}

export interface AggregationPipeline {
  stages: AggregationStage[];
}

export interface AggregationStage {
  type: 'match' | 'group' | 'sort' | 'limit' | 'skip' | 'project' | 'unwind';
  params: any;
}

// Transaction Types
export interface Transaction {
  id: string;
  startTime: Date;
  isolation: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
  timeout?: number;
}

// Schema Types
export interface TableSchema {
  fields: FieldDefinition[];
  indexes?: IndexDefinition[];
  constraints?: ConstraintDefinition[];
}

export interface FieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'binary';
  nullable?: boolean;
  unique?: boolean;
  default?: any;
  validation?: ValidationRule[];
}

export interface IndexDefinition {
  name: string;
  fields: string[];
  unique?: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface ConstraintDefinition {
  name: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check';
  fields: string[];
  reference?: {
    table: string;
    fields: string[];
    onDelete?: 'cascade' | 'restrict' | 'set_null';
    onUpdate?: 'cascade' | 'restrict' | 'set_null';
  };
  check?: string;
}

export interface TableChange {
  type: 'add_field' | 'drop_field' | 'modify_field' | 'add_index' | 'drop_index';
  field?: FieldDefinition;
  oldFieldName?: string;
  index?: IndexDefinition;
  indexName?: string;
}

export interface IndexOptions {
  unique?: boolean;
  partial?: string; // WHERE clause for partial index
  concurrent?: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

// Backup and Restore Types
export interface BackupOptions {
  tables?: string[];
  compression?: 'none' | 'gzip' | 'brotli';
  encryption?: boolean;
  format?: 'json' | 'sql' | 'binary';
  incremental?: boolean;
  baseBackup?: string;
}

export interface RestoreOptions {
  tables?: string[];
  overwrite?: boolean;
  skipErrors?: boolean;
  dryRun?: boolean;
}

export interface BackupResult {
  id: string;
  timestamp: Date;
  size: number;
  checksum: string;
  tables: string[];
  location: string;
  format: string;
  compression?: string;
  encrypted: boolean;
}

export interface BackupData {
  id: string;
  timestamp: Date;
  version: string;
  data: Record<string, any[]>;
  metadata: BackupMetadata;
}

export interface BackupMetadata {
  source: string;
  tables: string[];
  totalRecords: number;
  checksum: string;
  encryption?: {
    algorithm: string;
    keyId: string;
  };
}

// Storage Information Types
export interface StorageInfo {
  backend: string;
  connected: boolean;
  version?: string;
  totalRecords: number;
  storageUsed: number;
  maxStorage?: number;
  tables: TableInfo[];
  indexes: IndexInfo[];
  connections: ConnectionInfo;
  capabilities: string[];
}

export interface TableInfo {
  name: string;
  recordCount: number;
  size: number;
  lastAccessed?: Date;
  lastModified?: Date;
  schema?: TableSchema;
}

export interface IndexInfo {
  name: string;
  table: string;
  fields: string[];
  unique: boolean;
  size: number;
  usage: number;
}

export interface ConnectionInfo {
  current: number;
  max: number;
  idle: number;
  active: number;
}

// Performance and Health Types
export interface PerformanceMetrics {
  queriesPerSecond: number;
  averageQueryTime: number;
  slowQueries: SlowQuery[];
  cacheHitRatio?: number;
  indexUsage: IndexUsageStats[];
  memoryUsage: MemoryUsage;
  diskUsage: DiskUsage;
  networkUsage?: NetworkUsage;
}

export interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
  table: string;
  userId?: string;
}

export interface IndexUsageStats {
  indexName: string;
  table: string;
  usage: number;
  efficiency: number;
}

export interface MemoryUsage {
  total: number;
  used: number;
  free: number;
  buffers?: number;
  cache?: number;
}

export interface DiskUsage {
  total: number;
  used: number;
  free: number;
  dataSize: number;
  indexSize: number;
  logSize?: number;
}

export interface NetworkUsage {
  bytesIn: number;
  bytesOut: number;
  connectionsIn: number;
  connectionsOut: number;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'maintenance';
  checks: HealthCheck[];
  uptime: number;
  lastCheckTime: Date;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  details?: any;
  lastCheck: Date;
  duration: number;
}

export interface AnalysisResult {
  tables: TableAnalysis[];
  recommendations: Recommendation[];
  performance: PerformanceAnalysis;
  storage: StorageAnalysis;
}

export interface TableAnalysis {
  name: string;
  recordCount: number;
  averageRecordSize: number;
  fragmentationLevel: number;
  indexEfficiency: number;
  queryPatterns: QueryPattern[];
}

export interface QueryPattern {
  pattern: string;
  frequency: number;
  averageDuration: number;
  indexUsage: string[];
}

export interface Recommendation {
  type: 'index' | 'query' | 'schema' | 'performance' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  action?: string;
}

export interface PerformanceAnalysis {
  bottlenecks: string[];
  slowQueries: SlowQuery[];
  resourceUsage: ResourceUsage;
  scalabilityMetrics: ScalabilityMetrics;
}

export interface StorageAnalysis {
  totalSize: number;
  growth: GrowthAnalysis;
  fragmentation: FragmentationAnalysis;
  retention: RetentionAnalysis;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export interface ScalabilityMetrics {
  currentCapacity: number;
  projectedCapacity: number;
  growthRate: number;
  timeToCapacity?: number;
}

export interface GrowthAnalysis {
  dailyGrowth: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  projection: {
    days: number;
    weeks: number;
    months: number;
  };
}

export interface FragmentationAnalysis {
  level: number;
  impactOnPerformance: 'low' | 'medium' | 'high';
  recommendedAction: string;
}

export interface RetentionAnalysis {
  expiredData: number;
  retentionCompliance: number;
  cleanupRecommendations: string[];
}

// Configuration Types
export interface StoragePluginConfig {
  // Optional State Manager Plugin integration
  stateManagerIntegration?: StateManagerIntegrationConfig;
  
  // Core GDPR configuration (required)
  gdpr: GDPRConfig;
  
  // Storage backend configuration (required)
  backend: BackendConfig;
  
  // Optional performance features
  cache?: CacheConfig;
  updateQueue?: UpdateQueueConfig;
  performance?: PerformanceConfig;
  
  // Optional monitoring and observability
  monitoring?: MonitoringConfig;
  
  // Optional security features
  security?: SecurityConfig;
}

export interface StateManagerIntegrationConfig {
  enabled: boolean;
  type?: 'simple' | 'zustand' | 'jotai' | 'redux' | 'mobx';
  options?: {
    maxCacheSize?: number;
    ttl?: number;
    devtools?: boolean;
    persistState?: boolean;
    syncStrategy?: 'immediate' | 'debounced' | 'batched';
    conflictResolution?: 'client_wins' | 'server_wins' | 'last_write_wins' | 'merge';
  };
}

export interface BackendConfig {
  type: 'indexeddb' | 'postgresql' | 'mongodb' | 'mysql' | 'memory' | 'file';
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  poolSize?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  options?: Record<string, any>;
}

export interface CacheConfig {
  enabled: boolean;
  type: 'memory' | 'redis' | 'memcached' | 'hybrid';
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'fifo' | 'random';
  compression?: boolean;
  encryption?: boolean;
  namespace?: string;
  keyPrefix?: string;
  distributed?: boolean;
  replication?: {
    enabled: boolean;
    nodes: string[];
    consistency: 'eventual' | 'strong';
  };
}

export interface UpdateQueueConfig {
  enabled: boolean;
  batchWindow: number; // milliseconds
  maxBatchSize: number;
  retryAttempts: number;
  retryDelay: number;
  maxQueueSize: number;
  priorityLevels: number;
  deadLetterQueue: boolean;
  persistence: boolean;
  compression?: boolean;
  overflowStrategy?: 'reject' | 'drop_oldest';
}

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  entityId?: string;
  data?: any;
  timestamp: Date;
  priority: number;
  retryCount: number;
  maxRetries: number;
  lastError?: Error;
}

export interface BatchResult {
  processed: number;
  errors: Array<{ operation: QueuedOperation; error: Error }>;
  duration: number;
}

export interface UpdateQueueStats {
  totalOperations: number;
  batchesProcessed: number;
  averageBatchSize: number;
  averageProcessingTime: number;
  errorCount: number;
  currentQueueSize: number;
}

export interface PerformanceConfig {
  enableMetrics: boolean;
  metricsInterval: number;
  indexing: boolean;
  autoIndexCreation: boolean;
  queryOptimization: boolean;
  compression: boolean;
  backgroundSync: boolean;
  prefetching: boolean;
  lazyLoading: boolean;
  connectionPooling: boolean;
  queryPlanCaching: boolean;
  statementPreparing: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  level: 'basic' | 'detailed' | 'comprehensive';
  metricsCollection: boolean;
  performanceTracking: boolean;
  errorTracking: boolean;
  alerting: AlertingConfig;
  dashboards: boolean;
  exportMetrics: boolean;
  exportFormat: 'prometheus' | 'graphite' | 'statsd' | 'json';
  retentionDays: number;
}

export interface AlertingConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
  escalation: EscalationRule[];
  throttling: boolean;
  batchAlerts: boolean;
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  channels: string[];
  enabled: boolean;
}

export interface EscalationRule {
  rule: string;
  delay: number;
  channels: string[];
}

export interface SecurityConfig {
  encryption: EncryptionConfig;
  accessControl: AccessControlConfig;
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  auditing: AuditConfig;
  rateLimiting: RateLimitingConfig;
  inputValidation: ValidationConfig;
  dataProtection: DataProtectionConfig;
}

export interface AccessControlConfig {
  enabled: boolean;
  defaultPolicy: 'allow' | 'deny';
  rules: AccessRule[];
  roleBasedAccess: boolean;
  attributeBasedAccess: boolean;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  geolocationRestrictions?: string[];
}

export interface AccessRule {
  resource: string;
  action: string;
  principal: string;
  effect: 'allow' | 'deny';
  conditions?: Record<string, any>;
}

export interface AuthenticationConfig {
  required: boolean;
  methods: AuthMethod[];
  sessionManagement: SessionConfig;
  multiFactorAuth: boolean;
  passwordPolicy: PasswordPolicy;
  accountLocking: AccountLockingConfig;
}

export interface AuthMethod {
  type: 'password' | 'token' | 'certificate' | 'biometric' | 'oauth' | 'saml';
  config: Record<string, any>;
  enabled: boolean;
}

export interface SessionConfig {
  timeout: number;
  renewalEnabled: boolean;
  maxConcurrentSessions: number;
  cookieSettings: CookieSettings;
}

export interface CookieSettings {
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  path?: string;
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventUserInfoInPassword: boolean;
  passwordHistory: number;
  maxAge: number;
}

export interface AccountLockingConfig {
  enabled: boolean;
  maxAttempts: number;
  lockoutDuration: number;
  progressiveLockout: boolean;
  notifyOnLockout: boolean;
}

export interface AuthorizationConfig {
  enabled: boolean;
  model: 'rbac' | 'abac' | 'hybrid';
  defaultRole: string;
  roles: Role[];
  permissions: Permission[];
  policiesEngine: 'local' | 'opa' | 'casbin';
}

export interface Role {
  name: string;
  description: string;
  permissions: string[];
  inherits?: string[];
  conditions?: Record<string, any>;
}

export interface Permission {
  name: string;
  description: string;
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface RateLimitingConfig {
  enabled: boolean;
  rules: RateLimit[];
  storage: 'memory' | 'redis' | 'database';
  distributed: boolean;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface RateLimit {
  name: string;
  requests: number;
  period: number; // seconds
  burst?: number;
  skipIf?: string; // condition
  keyGenerator?: string; // function to generate rate limit key
}

export interface ValidationConfig {
  enabled: boolean;
  strictMode: boolean;
  sanitization: boolean;
  schemaValidation: boolean;
  customValidators: CustomValidator[];
  errorHandling: 'strict' | 'lenient' | 'custom';
}

export interface CustomValidator {
  name: string;
  validator: string; // function name or code
  message: string;
  async?: boolean;
}

export interface DataProtectionConfig {
  encryption: EncryptionConfig;
  masking: MaskingConfig;
  anonymization: AnonymizationConfig;
  pseudonymization: PseudonymizationConfig;
  dataLoss: DataLossPreventionConfig;
}

export interface MaskingConfig {
  enabled: boolean;
  rules: MaskingRule[];
  defaultMask: string;
  preserveFormat: boolean;
}

export interface MaskingRule {
  field: string;
  pattern: string;
  replacement: string;
  conditions?: Record<string, any>;
}

export interface AnonymizationConfig {
  enabled: boolean;
  techniques: AnonymizationTechnique[];
  kAnonymity: number;
  lDiversity: number;
  tCloseness: number;
}

export interface AnonymizationTechnique {
  name: string;
  type: 'generalization' | 'suppression' | 'perturbation' | 'swapping';
  fields: string[];
  parameters: Record<string, any>;
}

export interface PseudonymizationConfig {
  enabled: boolean;
  keyManagement: 'local' | 'hsm' | 'kms';
  algorithm: 'hmac' | 'aes' | 'format_preserving';
  reversible: boolean;
  keyRotation: boolean;
}

export interface DataLossPreventionConfig {
  enabled: boolean;
  scanning: boolean;
  classification: boolean;
  policies: DLPPolicy[];
  actions: DLPAction[];
}

export interface DLPPolicy {
  name: string;
  patterns: string[];
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  actions: string[];
  conditions?: Record<string, any>;
}

export interface DLPAction {
  type: 'block' | 'warn' | 'log' | 'encrypt' | 'mask';
  parameters: Record<string, any>;
}

// Event Types
export interface StorageEvent {
  type: string;
  timestamp: Date;
  source: string;
  data: any;
  metadata?: Record<string, any>;
}

export interface DataChangeEvent extends StorageEvent {
  type: 'data_change';
  data: {
    operation: 'create' | 'update' | 'delete';
    table: string;
    id: string;
    oldValue?: any;
    newValue?: any;
    changes?: string[];
  };
}

export interface ConsentEvent extends StorageEvent {
  type: 'consent_change';
  data: {
    userId: string;
    purposeId: string;
    granted: boolean;
    method: string;
    evidence?: any;
  };
}

export interface AuditEvent extends StorageEvent {
  type: 'audit_log';
  data: AuditEntry;
}

export interface PerformanceEvent extends StorageEvent {
  type: 'performance_metric';
  data: {
    metric: string;
    value: number;
    threshold?: number;
    unit: string;
  };
}

export interface SecurityEvent extends StorageEvent {
  type: 'security_alert';
  data: {
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    source: string;
    remediation?: string;
  };
}

// Plugin Interface Types
export interface Plugin {
  name: string;
  version: string;
  initialize(config?: any): Promise<void>;
  destroy(): Promise<void>;
  getStatus(): PluginStatus;
  getCapabilities(): string[];
}

export interface PluginStatus {
  name: string;
  status: 'initializing' | 'active' | 'inactive' | 'error' | 'maintenance';
  version: string;
  uptime: number;
  lastError?: Error;
  health: 'healthy' | 'warning' | 'critical';
  metrics?: Record<string, any>;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type EntityWithoutMeta<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'metadata'>;

export type EntityCreate<T> = EntityWithoutMeta<T> & Partial<Pick<T, 'id'>>;

export type EntityUpdate<T> = Partial<EntityWithoutMeta<T>>;

// Constants
export const DEFAULT_PAGINATION_LIMIT = 50;
export const MAX_PAGINATION_LIMIT = 1000;
export const DEFAULT_CACHE_TTL = 300; // 5 minutes
export const DEFAULT_BATCH_SIZE = 100;
export const DEFAULT_RETRY_ATTEMPTS = 3;
export const DEFAULT_TIMEOUT = 30000; // 30 seconds

// Enums for common values
export enum CacheStrategy {
  LRU = 'lru',
  LFU = 'lfu',
  FIFO = 'fifo',
  RANDOM = 'random'
}

export enum ConsistencyLevel {
  EVENTUAL = 'eventual',
  STRONG = 'strong',
  BOUNDED_STALENESS = 'bounded_staleness',
  SESSION = 'session',
  CONSISTENT_PREFIX = 'consistent_prefix'
}

export enum IsolationLevel {
  READ_UNCOMMITTED = 'read_uncommitted',
  READ_COMMITTED = 'read_committed',
  REPEATABLE_READ = 'repeatable_read',
  SERIALIZABLE = 'serializable'
}

export enum CompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  BROTLI = 'brotli',
  LZ4 = 'lz4',
  ZSTD = 'zstd'
}

export enum EncryptionMode {
  NONE = 'none',
  TRANSPARENT = 'transparent',
  APPLICATION = 'application',
  COLUMN = 'column',
  ROW = 'row'
}

// Export all types for external use
// Note: All types are already exported above in this file