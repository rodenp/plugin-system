// Encryption Service - Field-level encryption for GDPR compliance
import {
  EncryptionConfig,
  StorageEntity,
  EncryptionError,
  DataElementRegistry,
  EncryptionKey,
  EncryptionContext,
  EncryptionMetadata,
  EntityType,
  StorageBackend
} from '../types';

export class EncryptionService {
  private config: EncryptionConfig;
  private masterKey?: CryptoKey;
  private keyRotationTimer?: NodeJS.Timeout;
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private dataElementRegistry?: DataElementRegistry;
  private isInitialized = false;
  private storageAdapter?: StorageBackend;
  private instanceId = Math.random().toString(36).substr(2, 9);
  
  // Encryption versioning
  private currentEncryptionVersion: number = 1;
  private encryptionVersions: Map<number, any> = new Map();
  private tableEncryptionVersions: Map<string, Map<number, any>> = new Map(); // table -> version -> config

  constructor(config: EncryptionConfig) {
    this.config = this.validateConfig(config);
  }

  setStorageAdapter(adapter: StorageBackend): void {
    this.storageAdapter = adapter;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('EncryptionService already initialized');
      return;
    }

    try {
      console.log(`🔐 Initializing EncryptionService [${this.instanceId}]...`);
      
      // Initialize master key
      await this.initializeMasterKey();
      
      // Load or create data element registry
      await this.initializeDataElementRegistry();
      
      // Initialize encryption versioning
      await this.initializeEncryptionVersions();
      
      // Set up key rotation if enabled
      if (this.config.keyRotationDays && this.config.keyRotationDays > 0) {
        this.setupKeyRotation();
      }
      
      this.isInitialized = true;
      console.log('✅ EncryptionService initialized');
      
    } catch (error) {
      throw new EncryptionError(
        `Failed to initialize EncryptionService: ${(error as Error).message}`,
        'INITIALIZATION_ERROR',
        { config: this.sanitizeConfig() }
      );
    }
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      console.log('🔐 Destroying EncryptionService...');
      
      // Clear key rotation timer
      if (this.keyRotationTimer) {
        clearInterval(this.keyRotationTimer);
        this.keyRotationTimer = undefined;
      }
      
      // Clear keys from memory
      this.encryptionKeys.clear();
      this.masterKey = undefined;
      
      this.isInitialized = false;
      console.log('✅ EncryptionService destroyed');
      
    } catch (error) {
      console.error('❌ EncryptionService destruction failed:', error);
      throw new EncryptionError(
        `Failed to destroy EncryptionService: ${(error as Error).message}`,
        'DESTRUCTION_ERROR'
      );
    }
  }

  // Core encryption operations
  async processEntityForStorage<T extends StorageEntity>(table: string, entity: T): Promise<T> {
    if (!this.isInitialized) {
      throw new EncryptionError('EncryptionService not initialized', 'NOT_INITIALIZED');
    }

    if (!this.config.enabled) {
      return entity;
    }

    const fieldsToEncrypt = this.getFieldsToEncrypt(table, entity);
    if (fieldsToEncrypt.length === 0) {
      return entity;
    }

    const encryptedEntity = { ...entity };
    const encryptionContext: EncryptionContext = {
      table,
      entityId: entity.id,
      timestamp: new Date(),
      keyVersion: this.getCurrentKeyVersion()
    };

    for (const field of fieldsToEncrypt) {
      const value = (entity as any)[field];
      if (value !== undefined && value !== null) {
        try {
          const encryptedValue = await this.encryptField(value, field, encryptionContext);
          (encryptedEntity as any)[field] = encryptedValue;
        } catch (error) {
          throw new EncryptionError(
            `Failed to encrypt field ${field} in table ${table}: ${(error as Error).message}`,
            'FIELD_ENCRYPTION_ERROR',
            { table, field, entityId: entity.id }
          );
        }
      }
    }

    // Add encryption version field to the entity (visible in database)
    if (fieldsToEncrypt.length > 0) {
      (encryptedEntity as any).encryptionVersion = this.currentEncryptionVersion;
    }

    return encryptedEntity;
  }

  async processEntityFromStorage<T extends StorageEntity>(table: string, entity: T): Promise<T> {
    if (!this.isInitialized) {
      throw new EncryptionError('EncryptionService not initialized', 'NOT_INITIALIZED');
    }

    if (!this.config.enabled) {
      return entity;
    }

    const fieldsToDecrypt = this.getFieldsToEncrypt(table, entity);
    if (fieldsToDecrypt.length === 0) {
      return entity;
    }

    const decryptedEntity = { ...entity };

    for (const field of fieldsToDecrypt) {
      const value = (entity as any)[field];
      if (value !== undefined && value !== null && this.isEncryptedValue(value)) {
        try {
          const decryptedValue = await this.decryptField(value, field);
          (decryptedEntity as any)[field] = decryptedValue;
        } catch (error) {
          throw new EncryptionError(
            `Failed to decrypt field ${field} in table ${table}: ${(error as Error).message}`,
            'FIELD_DECRYPTION_ERROR',
            { table, field, entityId: entity.id }
          );
        }
      }
    }

    // Remove encryptionVersion field from decrypted entity (it's only for storage tracking)
    if ((decryptedEntity as any).encryptionVersion !== undefined) {
      delete (decryptedEntity as any).encryptionVersion;
    }

    return decryptedEntity;
  }

  // Field-level encryption
  private async encryptField(
    value: any,
    fieldName: string,
    context: EncryptionContext
  ): Promise<string> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const key = await this.getEncryptionKey(context.keyVersion);
    
    // Create initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encodedData = new TextEncoder().encode(stringValue);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key.cryptoKey,
      encodedData
    );
    
    // Combine IV + encrypted data into a single buffer (simple format)
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    // Convert to base64 string
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  }

  private async decryptField(encryptedValue: string, fieldName: string): Promise<any> {
    try {
      // Decode base64 string to get combined IV + encrypted data
      const combined = new Uint8Array(atob(encryptedValue).split('').map(c => c.charCodeAt(0)));
      
      // Extract IV (first 12 bytes) and encrypted data (remaining bytes)
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      
      // Get the current encryption key (using current key version)
      const key = await this.getEncryptionKey(this.getCurrentKeyVersion());
      
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key.cryptoKey,
        data
      );
      
      const decryptedString = new TextDecoder().decode(decryptedData);
      
      // Try to parse as JSON, fall back to string
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
      
    } catch (error) {
      throw new EncryptionError(
        `Failed to decrypt field ${fieldName}: ${(error as Error).message}`,
        'DECRYPTION_ERROR',
        { fieldName }
      );
    }
  }

  // Encryption dictionary management
  private getFieldsToEncrypt(table: string, entity: StorageEntity): string[] {
    const fields: Set<string> = new Set();
    
    // Table-level configuration
    const tableFields = this.config.encryptedFields?.[table];
    if (tableFields) {
      tableFields.forEach(field => fields.add(field));
    }
    
    // Pattern-based configuration
    if (this.config.encryptionPatterns) {
      for (const pattern of this.config.encryptionPatterns) {
        if (this.matchesPattern(table, entity, pattern)) {
          pattern.fields.forEach(field => fields.add(field));
        }
      }
    }
    
    // Data element registry
    if (this.dataElementRegistry) {
      const registryFields = this.getFieldsFromRegistry(table, entity);
      registryFields.forEach(field => fields.add(field));
    }
    
    // Dynamic rules
    if (this.config.dynamicEncryption?.enabled) {
      const dynamicFields = this.evaluateDynamicRules(table, entity);
      dynamicFields.forEach(field => fields.add(field));
    }
    
    return Array.from(fields);
  }

  private matchesPattern(table: string, entity: StorageEntity, pattern: any): boolean {
    // Check table pattern
    if (pattern.tablePattern && !table.match(pattern.tablePattern)) {
      return false;
    }
    
    // Check conditions
    if (pattern.conditions) {
      for (const condition of pattern.conditions) {
        if (!this.evaluateCondition(entity, condition)) {
          return false;
        }
      }
    }
    
    return true;
  }

  private evaluateCondition(entity: StorageEntity, condition: any): boolean {
    const { field, operator, value } = condition;
    const entityValue = (entity as any)[field];
    
    switch (operator) {
      case 'equals':
        return entityValue === value;
      case 'contains':
        return typeof entityValue === 'string' && entityValue.includes(value);
      case 'startsWith':
        return typeof entityValue === 'string' && entityValue.startsWith(value);
      case 'exists':
        return entityValue !== undefined && entityValue !== null;
      default:
        return false;
    }
  }

  private getFieldsFromRegistry(table: string, entity: StorageEntity): string[] {
    if (!this.dataElementRegistry) return [];
    
    const elements = this.dataElementRegistry.elements || [];
    const fields: string[] = [];
    
    for (const element of elements) {
      if (element.tables?.includes(table) && element.encryption?.required) {
        fields.push(element.fieldName);
      }
    }
    
    return fields;
  }

  private evaluateDynamicRules(table: string, entity: StorageEntity): string[] {
    const fields: string[] = [];
    
    // Example dynamic rules
    if (table === 'users') {
      // Always encrypt email and name for users
      fields.push('email', 'name');
    }
    
    if (table === 'messages' && (entity as any).type === 'private') {
      // Encrypt private message content
      fields.push('content');
    }
    
    return fields;
  }

  private isEncryptedValue(value: any): boolean {
    if (typeof value !== 'string') return false;
    
    // Check if it's a base64 string that's likely encrypted data
    // Base64 strings have specific length patterns and character sets
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    
    // Must be base64 format and reasonably long (IV + encrypted data)
    // Minimum: 12 bytes IV + some encrypted data = at least 16 bytes = 22+ base64 chars
    return base64Regex.test(value) && value.length >= 22;
  }

  // Key management
  private async initializeMasterKey(): Promise<void> {
    if (this.config.masterKey) {
      // Use provided master key
      const keyData = typeof this.config.masterKey === 'string' 
        ? new TextEncoder().encode(this.config.masterKey)
        : this.config.masterKey;
        
      this.masterKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
    } else {
      // Generate a new master key
      const keyMaterial = crypto.getRandomValues(new Uint8Array(32));
      this.masterKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
    }
  }

  private async getEncryptionKey(version: string): Promise<EncryptionKey> {
    if (this.encryptionKeys.has(version)) {
      return this.encryptionKeys.get(version)!;
    }

    // Generate new key for this version
    const key = await this.deriveKey(version);
    this.encryptionKeys.set(version, key);
    
    return key;
  }

  private async deriveKey(version: string): Promise<EncryptionKey> {
    if (!this.masterKey) {
      throw new EncryptionError('Master key not initialized', 'KEY_ERROR');
    }

    const salt = new TextEncoder().encode(`${this.config.algorithm}-${version}`);
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      this.masterKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );

    return {
      version,
      cryptoKey: derivedKey,
      algorithm: this.config.algorithm,
      createdAt: new Date(),
      expiresAt: this.config.keyRotationDays 
        ? new Date(Date.now() + this.config.keyRotationDays * 24 * 60 * 60 * 1000)
        : undefined
    };
  }

  private getCurrentKeyVersion(): string {
    // Use environment variable or fixed key version since we have a fixed master key
    // This ensures we always use the same key for encryption/decryption
    return (import.meta?.env?.VITE_ENCRYPTION_KEY_VERSION as string) || 'v1';
  }

  private setupKeyRotation(): void {
    if (!this.config.keyRotationDays || this.config.keyRotationDays <= 0) {
      return;
    }

    // Clear any existing rotation timer to prevent multiple timers
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
      this.keyRotationTimer = undefined;
    }

    const rotationInterval = this.config.keyRotationDays * 24 * 60 * 60 * 1000;
    
    // Ensure minimum rotation interval of 1 hour to prevent rapid rotation
    const minInterval = 60 * 60 * 1000; // 1 hour
    
    // JavaScript timer maximum safe value is 2^31-1 milliseconds (about 24.8 days)
    const maxSafeInterval = 2147483647; // 24.8 days
    
    let actualInterval = Math.max(rotationInterval, minInterval);
    
    // If the interval exceeds the maximum safe value, use daily checks instead
    if (actualInterval > maxSafeInterval) {
      console.log(`🔄 Key rotation interval (${this.config.keyRotationDays} days) exceeds maximum safe timer value. Using daily check pattern.`);
      this.setupDailyRotationCheck();
      return;
    }
    
    console.log(`🔄 Setting up key rotation every ${actualInterval / (1000 * 60 * 60)} hours`);
    
    this.keyRotationTimer = setInterval(async () => {
      try {
        await this.rotateKeys();
        console.log(`🔄 Encryption keys rotated [${this.instanceId}]`);
      } catch (error) {
        console.error('❌ Key rotation failed:', error);
      }
    }, actualInterval);
  }

  private setupDailyRotationCheck(): void {
    // Check every 24 hours if rotation is needed
    const dailyCheckInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    console.log(`🔄 Setting up daily rotation check every 24 hours`);
    
    this.keyRotationTimer = setInterval(async () => {
      try {
        await this.checkAndRotateKeys();
      } catch (error) {
        console.error('❌ Daily rotation check failed:', error);
      }
    }, dailyCheckInterval);
    
    // Also check immediately on startup
    setTimeout(() => this.checkAndRotateKeys(), 1000);
  }

  private async checkAndRotateKeys(): Promise<void> {
    if (!this.config.keyRotationDays || this.config.keyRotationDays <= 0) {
      return;
    }

    // Check if rotation is needed based on the last rotation time
    const lastRotationKey = 'last_key_rotation_time';
    const now = Date.now();
    
    try {
      // Try to get last rotation time from storage (simplified for demo)
      const lastRotationTime = localStorage.getItem(lastRotationKey);
      const lastRotation = lastRotationTime ? parseInt(lastRotationTime) : 0;
      
      const rotationIntervalMs = this.config.keyRotationDays * 24 * 60 * 60 * 1000;
      const timeSinceLastRotation = now - lastRotation;
      
      if (timeSinceLastRotation >= rotationIntervalMs) {
        console.log(`🔄 Key rotation needed (${Math.floor(timeSinceLastRotation / (24 * 60 * 60 * 1000))} days since last rotation)`);
        await this.rotateKeys();
        localStorage.setItem(lastRotationKey, now.toString());
        console.log(`🔄 Encryption keys rotated [${this.instanceId}]`);
      } else {
        const daysUntilRotation = Math.ceil((rotationIntervalMs - timeSinceLastRotation) / (24 * 60 * 60 * 1000));
        console.log(`🔄 Key rotation check: ${daysUntilRotation} days until next rotation`);
      }
    } catch (error) {
      console.error('❌ Error checking rotation time:', error);
    }
  }

  private async rotateKeys(): Promise<void> {
    // Remove old keys
    const now = new Date();
    for (const [version, key] of this.encryptionKeys) {
      if (key.expiresAt && key.expiresAt < now) {
        this.encryptionKeys.delete(version);
      }
    }
    
    // New keys will be created on demand
  }

  private async initializeDataElementRegistry(): Promise<void> {
    if (this.config.dataElementRegistry) {
      this.dataElementRegistry = this.config.dataElementRegistry;
    } else {
      // Create default registry
      this.dataElementRegistry = {
        version: '1.0.0',
        lastUpdated: new Date(),
        elements: this.createDefaultDataElements()
      };
    }
  }

  private createDefaultDataElements(): any[] {
    return [
      {
        id: 'user_email',
        name: 'User Email Address',
        fieldName: 'email',
        dataType: 'string',
        sensitivityLevel: 'high',
        tables: ['users'],
        encryption: {
          required: true,
          algorithm: 'AES-256-GCM'
        },
        retention: {
          period: '7 years',
          action: 'anonymize'
        }
      },
      {
        id: 'user_name',
        name: 'User Full Name',
        fieldName: 'name',
        dataType: 'string',
        sensitivityLevel: 'medium',
        tables: ['users'],
        encryption: {
          required: true,
          algorithm: 'AES-256-GCM'
        }
      },
      {
        id: 'user_preferences',
        name: 'User Preferences',
        fieldName: 'preferences',
        dataType: 'json',
        sensitivityLevel: 'low',
        tables: ['users'],
        encryption: {
          required: false
        }
      }
    ];
  }

  // Encryption versioning methods
  private async initializeEncryptionVersions(): Promise<void> {
    // Initialize current version from config or default to 1
    this.currentEncryptionVersion = this.config.currentVersion || 1;
    
    // Load existing versions from config
    if (this.config.encryptionVersions) {
      for (const versionConfig of this.config.encryptionVersions) {
        this.encryptionVersions.set(versionConfig.version, versionConfig);
      }
    }
    
    // Initialize table-specific versions
    if (this.config.encryptedFields) {
      for (const [table, fields] of Object.entries(this.config.encryptedFields)) {
        if (fields.length > 0) {
          // Check if we already have persistent metadata for this table
          const existingMetadata = await this.getEncryptionMetadataForTable(table);
          
          if (existingMetadata.length === 0) {
            // Create initial persistent metadata record
            try {
              await this.createEncryptionMetadataRecord({
                tableName: table,
                encryptionVersion: 1,
                encryptedFields: fields,
                algorithm: this.config.algorithm,
                description: `Initial encryption version for ${table}`,
                active: true
              });
            } catch (error) {
              console.warn(`Failed to create initial metadata for ${table}:`, error);
            }
          }
          
          // Create version 1 for each table with encrypted fields (in-memory backup)
          if (!this.tableEncryptionVersions.has(table)) {
            this.tableEncryptionVersions.set(table, new Map());
          }
          
          const tableVersions = this.tableEncryptionVersions.get(table)!;
          if (!tableVersions.has(1)) {
            const initialVersion = {
              table,
              version: 1,
              createdAt: new Date(),
              encryptedFields: fields,
              algorithm: this.config.algorithm,
              description: `Initial encryption version for ${table}`,
              active: true
            };
            tableVersions.set(1, initialVersion);
          }
        }
      }
    }
    
    // Ensure current version exists
    if (!this.encryptionVersions.has(this.currentEncryptionVersion)) {
      const currentVersion = {
        version: this.currentEncryptionVersion,
        createdAt: new Date(),
        encryptedFields: this.config.encryptedFields || {},
        algorithm: this.config.algorithm,
        description: 'Initial encryption version',
        active: true
      };
      this.encryptionVersions.set(this.currentEncryptionVersion, currentVersion);
    }
    
  }

  public createNewEncryptionVersion(newEncryptedFields: Record<string, string[]>, description?: string): number {
    const newVersion = this.currentEncryptionVersion + 1;
    
    // Deactivate current version
    const currentVersionData = this.encryptionVersions.get(this.currentEncryptionVersion);
    if (currentVersionData) {
      currentVersionData.active = false;
    }
    
    // Create new version
    const newVersionData = {
      version: newVersion,
      createdAt: new Date(),
      encryptedFields: newEncryptedFields,
      algorithm: this.config.algorithm,
      description: description || `Version ${newVersion} - Updated encryption fields`,
      active: true
    };
    
    this.encryptionVersions.set(newVersion, newVersionData);
    this.currentEncryptionVersion = newVersion;
    
    // Update config
    this.config.currentVersion = newVersion;
    this.config.encryptedFields = newEncryptedFields;
    
    console.log(`🔐 Created new encryption version: ${newVersion}`);
    return newVersion;
  }

  public getEncryptionVersions(): any[] {
    return Array.from(this.encryptionVersions.values()).sort((a, b) => b.version - a.version);
  }

  public getCurrentEncryptionVersion(): number {
    return this.currentEncryptionVersion;
  }

  public async createNewTableEncryptionVersion(table: string, newEncryptedFields: string[], description?: string): Promise<number> {
    const currentTableVersion = await this.getCurrentTableEncryptionVersion(table);
    const newVersion = currentTableVersion + 1;
    
    // Create persistent metadata record
    const metadata = await this.createEncryptionMetadataRecord({
      tableName: table,
      encryptionVersion: newVersion,
      encryptedFields: newEncryptedFields,
      algorithm: this.config.algorithm,
      description: description || `Version ${newVersion} for ${table}`,
      active: true,
      previousVersion: currentTableVersion > 0 ? currentTableVersion : undefined
    });
    
    // Update active status in persistent storage
    await this.updateActiveMetadata(table, newVersion);
    
    // Update in-memory structures for backwards compatibility
    if (!this.tableEncryptionVersions.has(table)) {
      this.tableEncryptionVersions.set(table, new Map());
    }
    
    const tableVersions = this.tableEncryptionVersions.get(table)!;
    
    // Deactivate current version in memory
    if (tableVersions.has(currentTableVersion)) {
      const currentVersionData = tableVersions.get(currentTableVersion);
      if (currentVersionData) {
        currentVersionData.active = false;
      }
    }
    
    // Add new version to memory
    const newVersionData = {
      table,
      version: newVersion,
      createdAt: metadata.createdAt,
      encryptedFields: newEncryptedFields,
      algorithm: this.config.algorithm,
      description: metadata.description,
      active: true
    };
    
    tableVersions.set(newVersion, newVersionData);
    
    // Update global config for this table
    this.config.encryptedFields = {
      ...this.config.encryptedFields,
      [table]: newEncryptedFields
    };
    
    return newVersion;
  }

  public async getTableEncryptionVersions(table: string): Promise<any[]> {
    // First try to get from persistent storage
    const persistentMetadata = await this.getEncryptionMetadataForTable(table);
    if (persistentMetadata.length > 0) {
      return persistentMetadata.map(metadata => ({
        table: metadata.tableName,
        version: metadata.encryptionVersion,
        createdAt: metadata.createdAt,
        encryptedFields: metadata.encryptedFields,
        algorithm: metadata.algorithm,
        description: metadata.description,
        active: metadata.active
      }));
    }
    
    // Fallback to in-memory data
    const tableVersions = this.tableEncryptionVersions.get(table);
    if (!tableVersions) {
      return [];
    }
    return Array.from(tableVersions.values()).sort((a, b) => b.version - a.version);
  }

  public async getCurrentTableEncryptionVersion(table: string): Promise<number> {
    // First try to get from persistent storage
    const persistentMetadata = await this.getEncryptionMetadataForTable(table);
    const activeMetadata = persistentMetadata.find(m => m.active);
    if (activeMetadata) {
      return activeMetadata.encryptionVersion;
    }
    
    // Fallback to in-memory data
    const tableVersions = this.tableEncryptionVersions.get(table);
    if (!tableVersions || tableVersions.size === 0) {
      return 1;
    }
    
    // Find the active version
    for (const [version, data] of tableVersions) {
      if (data.active) {
        return version;
      }
    }
    
    // If no active version found, return the highest version
    return Math.max(...Array.from(tableVersions.keys()));
  }

  public async getAllTablesWithEncryption(): Promise<string[]> {
    const tables = new Set<string>();
    
    // Add tables from persistent storage
    const allMetadata = await this.getAllEncryptionMetadata();
    allMetadata.forEach(metadata => {
      if (metadata.encryptedFields.length > 0) {
        tables.add(metadata.tableName);
      }
    });
    
    // Add tables from current config
    Object.keys(this.config.encryptedFields || {}).forEach(table => {
      if (this.config.encryptedFields[table].length > 0) {
        tables.add(table);
      }
    });
    
    // Add tables from version history
    this.tableEncryptionVersions.forEach((_, table) => {
      tables.add(table);
    });
    
    return Array.from(tables).sort();
  }

  // Persistent encryption metadata management
  private async createEncryptionMetadataRecord(metadata: Omit<EncryptionMetadata, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<EncryptionMetadata> {
    if (!this.storageAdapter) {
      throw new EncryptionError('Storage adapter not available', 'STORAGE_ERROR');
    }

    const record: EncryptionMetadata = {
      id: `encryption_${metadata.tableName}_v${metadata.encryptionVersion}_${Date.now()}`,
      ...metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    return await this.storageAdapter.create(EntityType.ENCRYPTION_METADATA, record);
  }

  private async getEncryptionMetadataForTable(tableName: string): Promise<EncryptionMetadata[]> {
    if (!this.storageAdapter) {
      return [];
    }

    try {
      const allMetadata = await this.storageAdapter.query<EncryptionMetadata>(
        EntityType.ENCRYPTION_METADATA,
        { where: { tableName } }
      );
      return allMetadata.sort((a, b) => b.encryptionVersion - a.encryptionVersion);
    } catch (error) {
      console.error('Failed to load encryption metadata:', error);
      return [];
    }
  }

  private async getAllEncryptionMetadata(): Promise<EncryptionMetadata[]> {
    if (!this.storageAdapter) {
      return [];
    }

    try {
      return await this.storageAdapter.query<EncryptionMetadata>(EntityType.ENCRYPTION_METADATA);
    } catch (error) {
      console.error('Failed to load all encryption metadata:', error);
      return [];
    }
  }

  private async updateActiveMetadata(tableName: string, newVersion: number): Promise<void> {
    if (!this.storageAdapter) {
      return;
    }

    try {
      // Deactivate all previous versions for this table
      const allMetadata = await this.getEncryptionMetadataForTable(tableName);
      for (const metadata of allMetadata) {
        if (metadata.active && metadata.encryptionVersion !== newVersion) {
          // Create a new record to update (since we can't update with partial data directly)
          const updatedMetadata = {
            ...metadata,
            active: false,
            updatedAt: new Date()
          };
          delete (updatedMetadata as any).id; // Remove id for update
          await this.storageAdapter.update(EntityType.ENCRYPTION_METADATA, metadata.id, updatedMetadata);
        }
      }
    } catch (error) {
      console.error('Failed to update active metadata:', error);
    }
  }

  // Configuration validation
  private validateConfig(config: EncryptionConfig): EncryptionConfig {
    if (!config) {
      throw new EncryptionError('Encryption configuration is required', 'CONFIG_ERROR');
    }

    if (config.enabled && !config.algorithm) {
      throw new EncryptionError('Encryption algorithm is required when encryption is enabled', 'CONFIG_ERROR');
    }

    const supportedAlgorithms = ['AES-256-GCM', 'AES-192-GCM', 'AES-128-GCM'];
    if (config.enabled && !supportedAlgorithms.includes(config.algorithm)) {
      throw new EncryptionError(
        `Unsupported encryption algorithm: ${config.algorithm}`,
        'CONFIG_ERROR',
        { supportedAlgorithms }
      );
    }

    return {
      enabled: config.enabled || false,
      algorithm: config.algorithm || 'AES-256-GCM',
      keyDerivation: config.keyDerivation || 'PBKDF2',
      keyRotationDays: config.keyRotationDays || 90,
      encryptedFields: config.encryptedFields || {},
      keyProvider: config.keyProvider || 'WebCrypto',
      encryptionStrength: config.encryptionStrength || 'high',
      currentVersion: config.currentVersion || 1,
      encryptionVersions: config.encryptionVersions || [],
      masterKey: config.masterKey,
      keyStorageLocation: config.keyStorageLocation,
      compressionEnabled: config.compressionEnabled
    };
  }

  private sanitizeConfig(): any {
    return {
      ...this.config,
      masterKey: this.config.masterKey ? '***' : undefined
    };
  }

  // Public API for external access
  isEnabled(): boolean {
    return this.config.enabled;
  }

  getConfiguration(): Partial<EncryptionConfig> {
    return {
      enabled: this.config.enabled,
      algorithm: this.config.algorithm,
      keyDerivation: this.config.keyDerivation,
      keyRotationDays: this.config.keyRotationDays
    };
  }

  getEncryptedFieldsForTable(table: string): string[] {
    return this.config.encryptedFields?.[table] || [];
  }

  async testEncryption(): Promise<boolean> {
    try {
      const testData = 'test-encryption-' + Date.now();
      const context: EncryptionContext = {
        table: 'test',
        entityId: 'test',
        timestamp: new Date(),
        keyVersion: this.getCurrentKeyVersion()
      };
      
      const encrypted = await this.encryptField(testData, 'test', context);
      const decrypted = await this.decryptField(encrypted, 'test');
      
      return decrypted === testData;
    } catch (error) {
      console.error('Encryption test failed:', error);
      return false;
    }
  }
}