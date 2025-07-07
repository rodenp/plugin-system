// IndexedDB Storage Adapter - Production-ready implementation
import { BaseAdapter } from './BaseAdapter';
import {
  StorageEntity,
  QueryFilter,
  StorageInfo,
  TableInfo,
  StorageError,
  Transaction,
  BackupData,
  EntityType
} from '../types';

export class IndexedDBAdapter extends BaseAdapter {
  type = 'indexeddb' as const;
  private db?: IDBDatabase;
  private dbName: string;
  private version: number;
  private objectStores: Set<string>;
  private pendingTransactions: Map<string, IDBTransaction>;

  constructor(dbName = 'StoragePluginDB', version = 1) {
    super();
    this.dbName = dbName;
    this.version = version;
    this.objectStores = new Set();
    this.pendingTransactions = new Map();
    this.config.startTime = Date.now();
  }

  async connect(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new StorageError('IndexedDB not available in this environment', 'ENVIRONMENT_ERROR');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new StorageError(`Failed to open IndexedDB: ${request.error?.message}`, 'CONNECTION_ERROR'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.connected = true;
        
        // Track existing object stores
        for (let i = 0; i < this.db.objectStoreNames.length; i++) {
          this.objectStores.add(this.db.objectStoreNames[i]);
        }
        
        console.log(`📦 IndexedDB connected: ${this.dbName} (v${this.version})`);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.setupObjectStores(db);
      };
    });
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = undefined;
    }
    this.cleanup();
    console.log(`📦 IndexedDB disconnected: ${this.dbName}`);
  }

  private setupObjectStores(db: IDBDatabase): void {
    // Create object stores for all entity types
    const entityTypes = Object.values(EntityType);
    
    for (const entityType of entityTypes) {
      if (!db.objectStoreNames.contains(entityType)) {
        const store = db.createObjectStore(entityType, { keyPath: 'id' });
        
        // Create common indexes
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        
        // Create entity-specific indexes
        this.createEntitySpecificIndexes(store, entityType);
        
        this.objectStores.add(entityType);
        console.log(`📦 Created object store: ${entityType}`);
      }
    }
  }

  private createEntitySpecificIndexes(store: IDBObjectStore, entityType: string): void {
    switch (entityType) {
      case EntityType.USERS:
        store.createIndex('email', 'email', { unique: true });
        store.createIndex('username', 'username', { unique: true });
        break;
        
      case EntityType.POSTS:
        store.createIndex('authorId', 'authorId', { unique: false });
        store.createIndex('published', 'published', { unique: false });
        break;
        
      case EntityType.COMMENTS:
        store.createIndex('postId', 'postId', { unique: false });
        store.createIndex('authorId', 'authorId', { unique: false });
        break;
        
      case EntityType.COURSES:
        store.createIndex('instructorId', 'instructorId', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        break;
        
      case EntityType.ENROLLMENTS:
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('courseId', 'courseId', { unique: false });
        store.createIndex('userCourse', ['userId', 'courseId'], { unique: true });
        break;
        
      case EntityType.MESSAGES:
        store.createIndex('senderId', 'senderId', { unique: false });
        store.createIndex('recipientId', 'recipientId', { unique: false });
        store.createIndex('conversationId', 'conversationId', { unique: false });
        break;
        
      case EntityType.AUDIT_LOGS:
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('action', 'action', { unique: false });
        store.createIndex('resource', 'resource', { unique: false });
        break;
        
      case EntityType.CONSENT_RECORDS:
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('purposeId', 'purposeId', { unique: false });
        store.createIndex('userPurpose', ['userId', 'purposeId'], { unique: false });
        break;
    }
  }

  async create<T extends StorageEntity>(table: string, data: T): Promise<T> {
    this.validateConnection();
    await this.ensureObjectStore(table);

    return this.measureOperation(`create_${table}`, async () => {
      const entity = this.addTimestamps(data);
      
      return new Promise<T>((resolve, reject) => {
        const transaction = this.db!.transaction([table], 'readwrite');
        const store = transaction.objectStore(table);
        const request = store.add(entity);

        request.onsuccess = () => resolve(entity);
        request.onerror = () => reject(new StorageError(
          `Failed to create entity in ${table}: ${request.error?.message}`,
          'CREATE_ERROR'
        ));
      });
    });
  }

  async read<T extends StorageEntity>(table: string, id: string): Promise<T | null> {
    this.validateConnection();
    await this.ensureObjectStore(table);

    return this.measureOperation(`read_${table}`, async () => {
      return new Promise<T | null>((resolve, reject) => {
        const transaction = this.db!.transaction([table], 'readonly');
        const store = transaction.objectStore(table);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new StorageError(
          `Failed to read entity from ${table}: ${request.error?.message}`,
          'READ_ERROR'
        ));
      });
    });
  }

  async update<T extends StorageEntity>(table: string, id: string, data: Partial<T>): Promise<T> {
    this.validateConnection();
    await this.ensureObjectStore(table);

    return this.measureOperation(`update_${table}`, async () => {
      // First read the existing entity
      const existing = await this.read<T>(table, id);
      if (!existing) {
        throw new StorageError(`Entity not found in ${table}: ${id}`, 'NOT_FOUND');
      }

      // Merge updates with existing data
      const updated = this.addTimestamps({
        ...existing,
        ...data,
        id // Ensure ID doesn't change
      }, true);

      return new Promise<T>((resolve, reject) => {
        const transaction = this.db!.transaction([table], 'readwrite');
        const store = transaction.objectStore(table);
        const request = store.put(updated);

        request.onsuccess = () => resolve(updated);
        request.onerror = () => reject(new StorageError(
          `Failed to update entity in ${table}: ${request.error?.message}`,
          'UPDATE_ERROR'
        ));
      });
    });
  }

  async delete(table: string, id: string): Promise<void> {
    this.validateConnection();
    await this.ensureObjectStore(table);

    return this.measureOperation(`delete_${table}`, async () => {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([table], 'readwrite');
        const store = transaction.objectStore(table);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new StorageError(
          `Failed to delete entity from ${table}: ${request.error?.message}`,
          'DELETE_ERROR'
        ));
      });
    });
  }

  async query<T extends StorageEntity>(table: string, filter?: QueryFilter<T>): Promise<T[]> {
    this.validateConnection();
    await this.ensureObjectStore(table);

    return this.measureOperation(`query_${table}`, async () => {
      return new Promise<T[]>((resolve, reject) => {
        const transaction = this.db!.transaction([table], 'readonly');
        const store = transaction.objectStore(table);
        const request = store.getAll();

        request.onsuccess = () => {
          const allItems = request.result as T[];
          const filtered = this.applyFilter(allItems, filter);
          resolve(filtered);
        };

        request.onerror = () => reject(new StorageError(
          `Failed to query ${table}: ${request.error?.message}`,
          'QUERY_ERROR'
        ));
      });
    });
  }

  async count(table: string, filter?: QueryFilter<any>): Promise<number> {
    this.validateConnection();
    await this.ensureObjectStore(table);

    if (!filter?.where) {
      // Simple count without filter
      return new Promise<number>((resolve, reject) => {
        try {
          if (!this.db || this.db.readyState !== 'done') {
            resolve(0);
            return;
          }
          const transaction = this.db.transaction([table], 'readonly');
          const store = transaction.objectStore(table);
          const request = store.count();

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(new StorageError(
            `Failed to count ${table}: ${request.error?.message}`,
            'COUNT_ERROR'
          ));
        } catch (error) {
          resolve(0);
        }
      });
    } else {
      // Count with filter - need to fetch and filter
      const items = await this.query(table, filter);
      return items.length;
    }
  }

  async clear(table: string): Promise<void> {
    this.validateConnection();
    await this.ensureObjectStore(table);

    return this.measureOperation(`clear_${table}`, async () => {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([table], 'readwrite');
        const store = transaction.objectStore(table);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new StorageError(
          `Failed to clear ${table}: ${request.error?.message}`,
          'CLEAR_ERROR'
        ));
      });
    });
  }

  // IndexedDB-specific optimized operations
  async queryByIndex<T extends StorageEntity>(
    table: string, 
    indexName: string, 
    value: any, 
    filter?: QueryFilter<T>
  ): Promise<T[]> {
    this.validateConnection();
    await this.ensureObjectStore(table);

    return this.measureOperation(`query_index_${table}_${indexName}`, async () => {
      return new Promise<T[]>((resolve, reject) => {
        const transaction = this.db!.transaction([table], 'readonly');
        const store = transaction.objectStore(table);
        
        if (!store.indexNames.contains(indexName)) {
          reject(new StorageError(`Index ${indexName} not found in ${table}`, 'INDEX_ERROR'));
          return;
        }

        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => {
          const items = request.result as T[];
          const filtered = this.applyFilter(items, filter);
          resolve(filtered);
        };

        request.onerror = () => reject(new StorageError(
          `Failed to query index ${indexName} in ${table}: ${request.error?.message}`,
          'INDEX_QUERY_ERROR'
        ));
      });
    });
  }

  async queryByRange<T extends StorageEntity>(
    table: string,
    indexName: string,
    lower: any,
    upper: any,
    filter?: QueryFilter<T>
  ): Promise<T[]> {
    this.validateConnection();
    await this.ensureObjectStore(table);

    return this.measureOperation(`query_range_${table}_${indexName}`, async () => {
      return new Promise<T[]>((resolve, reject) => {
        const transaction = this.db!.transaction([table], 'readonly');
        const store = transaction.objectStore(table);
        
        if (!store.indexNames.contains(indexName)) {
          reject(new StorageError(`Index ${indexName} not found in ${table}`, 'INDEX_ERROR'));
          return;
        }

        const index = store.index(indexName);
        const range = IDBKeyRange.bound(lower, upper);
        const request = index.getAll(range);

        request.onsuccess = () => {
          const items = request.result as T[];
          const filtered = this.applyFilter(items, filter);
          resolve(filtered);
        };

        request.onerror = () => reject(new StorageError(
          `Failed to query range in ${indexName}: ${request.error?.message}`,
          'RANGE_QUERY_ERROR'
        ));
      });
    });
  }

  async createIndex(table: string, fields: string[], options?: any): Promise<void> {
    // IndexedDB indexes need to be created during version upgrade
    // This would require a database version upgrade
    throw new StorageError(
      'Index creation requires database version upgrade in IndexedDB',
      'NOT_SUPPORTED'
    );
  }

  // Transaction Support
  async beginTransaction(): Promise<Transaction> {
    this.validateConnection();
    
    const txId = this.generateId();
    const transaction: Transaction = {
      id: txId,
      startTime: new Date(),
      isolation: 'read_committed'
    };

    // IndexedDB transactions are auto-committed, so we track them for coordination
    return transaction;
  }

  async getStorageInfo(): Promise<StorageInfo> {
    this.validateConnection();

    const tables: TableInfo[] = [];
    
    for (const tableName of this.objectStores) {
      const count = await this.count(tableName);
      tables.push({
        name: tableName,
        recordCount: count,
        size: count * 1024, // Estimate
        lastAccessed: new Date(),
        lastModified: new Date()
      });
    }

    // Estimate storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          backend: 'IndexedDB',
          connected: this.connected,
          version: this.version.toString(),
          totalRecords: tables.reduce((sum, t) => sum + t.recordCount, 0),
          storageUsed: estimate.usage || 0,
          maxStorage: estimate.quota,
          tables,
          indexes: [], // IndexedDB doesn't provide easy access to index info
          connections: {
            current: 1,
            max: 1,
            idle: 0,
            active: 1
          },
          capabilities: [
            'transactions',
            'indexes',
            'cursors',
            'key_ranges',
            'compound_indexes',
            'auto_increment'
          ]
        };
      } catch (error) {
        console.warn('Failed to get storage estimate:', error);
      }
    }

    return {
      backend: 'IndexedDB',
      connected: this.connected,
      version: this.version.toString(),
      totalRecords: tables.reduce((sum, t) => sum + t.recordCount, 0),
      storageUsed: 0,
      tables,
      indexes: [],
      connections: {
        current: 1,
        max: 1,
        idle: 0,
        active: 1
      },
      capabilities: [
        'transactions',
        'indexes',
        'cursors',
        'key_ranges',
        'compound_indexes',
        'auto_increment'
      ]
    };
  }

  protected async storeBackup(backup: BackupData): Promise<void> {
    // Store backup in a special backups object store
    await this.ensureObjectStore('backups');
    
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['backups'], 'readwrite');
      const store = transaction.objectStore('backups');
      const request = store.put({
        id: backup.id,
        ...backup,
        createdAt: backup.timestamp,
        updatedAt: backup.timestamp
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(
        `Failed to store backup: ${request.error?.message}`,
        'BACKUP_ERROR'
      ));
    });
  }

  protected async getTableNames(): Promise<string[]> {
    return Array.from(this.objectStores);
  }

  private async ensureObjectStore(table: string): Promise<void> {
    if (!this.objectStores.has(table)) {
      // For dynamic table creation, we need to close and reopen with higher version
      await this.createDynamicObjectStore(table);
    }
  }

  private async createDynamicObjectStore(table: string): Promise<void> {
    if (this.objectStores.has(table)) return;

    // Close current connection
    this.db?.close();
    this.connected = false;

    // Increment version and reopen
    this.version++;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new StorageError(`Failed to create object store ${table}`, 'STORE_CREATION_ERROR'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.connected = true;
        this.objectStores.add(table);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Recreate existing stores and add the new one
        if (!db.objectStoreNames.contains(table)) {
          const store = db.createObjectStore(table, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          this.createEntitySpecificIndexes(store, table);
        }
      };
    });
  }

  // Utility methods for advanced IndexedDB features
  async getAllKeys(table: string): Promise<string[]> {
    this.validateConnection();
    await this.ensureObjectStore(table);

    return new Promise<string[]>((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(new StorageError(
        `Failed to get keys from ${table}: ${request.error?.message}`,
        'KEYS_ERROR'
      ));
    });
  }

  async openCursor<T extends StorageEntity>(
    table: string,
    callback: (cursor: IDBCursorWithValue | null) => void
  ): Promise<void> {
    this.validateConnection();
    await this.ensureObjectStore(table);

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        callback(cursor);
        if (cursor) {
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(new StorageError(
        `Failed to open cursor on ${table}: ${request.error?.message}`,
        'CURSOR_ERROR'
      ));
    });
  }
}