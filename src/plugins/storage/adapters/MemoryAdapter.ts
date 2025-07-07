// Memory Storage Adapter - In-memory implementation for testing and development
import { BaseAdapter } from './BaseAdapter';
import {
  StorageEntity,
  QueryFilter,
  StorageInfo,
  TableInfo,
  StorageError,
  BackupData
} from '../types';

export class MemoryAdapter extends BaseAdapter {
  type = 'memory' as const;
  private data: Map<string, Map<string, StorageEntity>>;
  private indexes: Map<string, Map<string, Set<string>>>;

  constructor() {
    super();
    this.data = new Map();
    this.indexes = new Map();
    this.config.startTime = Date.now();
  }

  async connect(): Promise<void> {
    this.connected = true;
    console.log('🧠 Memory adapter connected');
  }

  async disconnect(): Promise<void> {
    this.data.clear();
    this.indexes.clear();
    this.cleanup();
    console.log('🧠 Memory adapter disconnected');
  }

  async create<T extends StorageEntity>(table: string, data: T): Promise<T> {
    this.validateConnection();
    
    return this.measureOperation(`create_${table}`, async () => {
      const entity = this.addTimestamps(data);
      
      if (!this.data.has(table)) {
        this.data.set(table, new Map());
      }
      
      const tableData = this.data.get(table)!;
      
      if (tableData.has(entity.id)) {
        throw new StorageError(`Entity already exists in ${table}: ${entity.id}`, 'DUPLICATE_KEY');
      }
      
      tableData.set(entity.id, entity);
      this.updateIndexes(table, entity);
      
      return entity;
    });
  }

  async read<T extends StorageEntity>(table: string, id: string): Promise<T | null> {
    this.validateConnection();
    
    return this.measureOperation(`read_${table}`, async () => {
      const tableData = this.data.get(table);
      if (!tableData) {
        return null;
      }
      
      const entity = tableData.get(id);
      return entity ? { ...entity } as T : null;
    });
  }

  async update<T extends StorageEntity>(table: string, id: string, data: Partial<T>): Promise<T> {
    this.validateConnection();
    
    return this.measureOperation(`update_${table}`, async () => {
      const tableData = this.data.get(table);
      if (!tableData || !tableData.has(id)) {
        throw new StorageError(`Entity not found in ${table}: ${id}`, 'NOT_FOUND');
      }
      
      const existing = tableData.get(id)!;
      const updated = this.addTimestamps({
        ...existing,
        ...data,
        id // Ensure ID doesn't change
      }, true);
      
      tableData.set(id, updated);
      this.updateIndexes(table, updated);
      
      return updated as T;
    });
  }

  async delete(table: string, id: string): Promise<void> {
    this.validateConnection();
    
    return this.measureOperation(`delete_${table}`, async () => {
      const tableData = this.data.get(table);
      if (!tableData || !tableData.has(id)) {
        throw new StorageError(`Entity not found in ${table}: ${id}`, 'NOT_FOUND');
      }
      
      const entity = tableData.get(id)!;
      tableData.delete(id);
      this.removeFromIndexes(table, entity);
    });
  }

  async query<T extends StorageEntity>(table: string, filter?: QueryFilter<T>): Promise<T[]> {
    this.validateConnection();
    
    return this.measureOperation(`query_${table}`, async () => {
      const tableData = this.data.get(table);
      if (!tableData) {
        return [];
      }
      
      const allItems = Array.from(tableData.values()) as T[];
      return this.applyFilter(allItems, filter);
    });
  }

  async count(table: string, filter?: QueryFilter<any>): Promise<number> {
    this.validateConnection();
    
    const tableData = this.data.get(table);
    if (!tableData) {
      return 0;
    }
    
    if (!filter?.where) {
      return tableData.size;
    }
    
    const items = await this.query(table, filter);
    return items.length;
  }

  async clear(table: string): Promise<void> {
    this.validateConnection();
    
    return this.measureOperation(`clear_${table}`, async () => {
      const tableData = this.data.get(table);
      if (tableData) {
        tableData.clear();
      }
      
      // Clear indexes for this table
      const tableIndexes = this.indexes.get(table);
      if (tableIndexes) {
        tableIndexes.clear();
      }
    });
  }

  async getStorageInfo(): Promise<StorageInfo> {
    this.validateConnection();
    
    const tables: TableInfo[] = [];
    let totalRecords = 0;
    let estimatedSize = 0;
    
    for (const [tableName, tableData] of this.data) {
      const recordCount = tableData.size;
      const tableSize = Array.from(tableData.values())
        .reduce((sum, entity) => sum + JSON.stringify(entity).length, 0);
      
      tables.push({
        name: tableName,
        recordCount,
        size: tableSize,
        lastAccessed: new Date(),
        lastModified: new Date()
      });
      
      totalRecords += recordCount;
      estimatedSize += tableSize;
    }
    
    return {
      backend: 'Memory',
      connected: this.connected,
      version: '1.0.0',
      totalRecords,
      storageUsed: estimatedSize,
      tables,
      indexes: [],
      connections: {
        current: 1,
        max: 1,
        idle: 0,
        active: 1
      },
      capabilities: [
        'in_memory',
        'fast_access',
        'no_persistence',
        'unlimited_indexes'
      ]
    };
  }

  // Memory-specific optimized operations
  async queryByField<T extends StorageEntity>(
    table: string,
    field: string,
    value: any,
    filter?: QueryFilter<T>
  ): Promise<T[]> {
    this.validateConnection();
    
    return this.measureOperation(`query_field_${table}_${field}`, async () => {
      // Check if we have an index for this field
      const indexKey = `${table}.${field}`;
      const tableIndexes = this.indexes.get(table);
      
      if (tableIndexes?.has(indexKey)) {
        const fieldIndex = tableIndexes.get(indexKey)!;
        const ids = fieldIndex.get(String(value)) || new Set();
        
        const results: T[] = [];
        const tableData = this.data.get(table);
        
        if (tableData) {
          for (const id of ids) {
            const entity = tableData.get(id);
            if (entity) {
              results.push({ ...entity } as T);
            }
          }
        }
        
        return this.applyFilter(results, filter);
      }
      
      // Fall back to full table scan
      const allItems = await this.query<T>(table);
      const filtered = allItems.filter(item => (item as any)[field] === value);
      return this.applyFilter(filtered, filter);
    });
  }

  async getAllTables(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  async getTableSize(table: string): Promise<number> {
    const tableData = this.data.get(table);
    return tableData ? tableData.size : 0;
  }

  // Bulk operations optimized for memory
  async createMany<T extends StorageEntity>(table: string, entities: T[]): Promise<T[]> {
    this.validateConnection();
    
    return this.measureOperation(`create_many_${table}`, async () => {
      if (!this.data.has(table)) {
        this.data.set(table, new Map());
      }
      
      const tableData = this.data.get(table)!;
      const results: T[] = [];
      
      for (const data of entities) {
        const entity = this.addTimestamps(data);
        
        if (tableData.has(entity.id)) {
          throw new StorageError(`Entity already exists in ${table}: ${entity.id}`, 'DUPLICATE_KEY');
        }
        
        tableData.set(entity.id, entity);
        this.updateIndexes(table, entity);
        results.push(entity);
      }
      
      return results;
    });
  }

  async updateMany<T extends StorageEntity>(
    table: string,
    updates: Array<{id: string, data: Partial<T>}>
  ): Promise<T[]> {
    this.validateConnection();
    
    return this.measureOperation(`update_many_${table}`, async () => {
      const tableData = this.data.get(table);
      if (!tableData) {
        throw new StorageError(`Table not found: ${table}`, 'TABLE_NOT_FOUND');
      }
      
      const results: T[] = [];
      
      for (const { id, data } of updates) {
        if (!tableData.has(id)) {
          throw new StorageError(`Entity not found in ${table}: ${id}`, 'NOT_FOUND');
        }
        
        const existing = tableData.get(id)!;
        const updated = this.addTimestamps({
          ...existing,
          ...data,
          id // Ensure ID doesn't change
        }, true);
        
        tableData.set(id, updated);
        this.updateIndexes(table, updated);
        results.push(updated as T);
      }
      
      return results;
    });
  }

  async deleteMany(table: string, ids: string[]): Promise<void> {
    this.validateConnection();
    
    return this.measureOperation(`delete_many_${table}`, async () => {
      const tableData = this.data.get(table);
      if (!tableData) {
        return; // Table doesn't exist, nothing to delete
      }
      
      for (const id of ids) {
        if (tableData.has(id)) {
          const entity = tableData.get(id)!;
          tableData.delete(id);
          this.removeFromIndexes(table, entity);
        }
      }
    });
  }

  // Index management
  private updateIndexes(table: string, entity: StorageEntity): void {
    if (!this.indexes.has(table)) {
      this.indexes.set(table, new Map());
    }
    
    const tableIndexes = this.indexes.get(table)!;
    
    // Create indexes for common fields
    const indexableFields = ['userId', 'authorId', 'courseId', 'postId', 'parentId', 'category', 'type', 'status'];
    
    for (const field of indexableFields) {
      if ((entity as any)[field] !== undefined) {
        const indexKey = `${table}.${field}`;
        const value = String((entity as any)[field]);
        
        if (!tableIndexes.has(indexKey)) {
          tableIndexes.set(indexKey, new Map());
        }
        
        const fieldIndex = tableIndexes.get(indexKey)!;
        if (!fieldIndex.has(value)) {
          fieldIndex.set(value, new Set());
        }
        
        fieldIndex.get(value)!.add(entity.id);
      }
    }
  }

  private removeFromIndexes(table: string, entity: StorageEntity): void {
    const tableIndexes = this.indexes.get(table);
    if (!tableIndexes) return;
    
    const indexableFields = ['userId', 'authorId', 'courseId', 'postId', 'parentId', 'category', 'type', 'status'];
    
    for (const field of indexableFields) {
      if ((entity as any)[field] !== undefined) {
        const indexKey = `${table}.${field}`;
        const value = String((entity as any)[field]);
        const fieldIndex = tableIndexes.get(indexKey);
        
        if (fieldIndex?.has(value)) {
          fieldIndex.get(value)!.delete(entity.id);
          
          // Clean up empty index entries
          if (fieldIndex.get(value)!.size === 0) {
            fieldIndex.delete(value);
          }
        }
      }
    }
  }

  protected async storeBackup(backup: BackupData): Promise<void> {
    // Store backup in memory (will be lost on restart)
    if (!this.data.has('backups')) {
      this.data.set('backups', new Map());
    }
    
    const backupsTable = this.data.get('backups')!;
    backupsTable.set(backup.id, {
      ...backup,
      id: backup.id,
      createdAt: backup.timestamp,
      updatedAt: backup.timestamp,
      version: 1
    });
  }

  protected async getTableNames(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  // Debug and development utilities
  getMemoryUsage(): {
    tables: Record<string, number>;
    indexes: Record<string, number>;
    total: number;
  } {
    const tables: Record<string, number> = {};
    const indexes: Record<string, number> = {};
    let totalTablesSize = 0;
    let totalIndexesSize = 0;
    
    // Calculate table sizes
    for (const [tableName, tableData] of this.data) {
      const size = Array.from(tableData.values())
        .reduce((sum, entity) => sum + JSON.stringify(entity).length, 0);
      tables[tableName] = size;
      totalTablesSize += size;
    }
    
    // Calculate index sizes
    for (const [tableName, tableIndexes] of this.indexes) {
      let tableIndexSize = 0;
      for (const [indexKey, fieldIndex] of tableIndexes) {
        const indexSize = Array.from(fieldIndex.entries())
          .reduce((sum, [value, ids]) => sum + value.length + (ids.size * 20), 0);
        tableIndexSize += indexSize;
      }
      indexes[tableName] = tableIndexSize;
      totalIndexesSize += tableIndexSize;
    }
    
    return {
      tables,
      indexes,
      total: totalTablesSize + totalIndexesSize
    };
  }

  dumpTable(table: string): any[] {
    const tableData = this.data.get(table);
    return tableData ? Array.from(tableData.values()) : [];
  }

  dumpIndexes(table: string): any {
    const tableIndexes = this.indexes.get(table);
    if (!tableIndexes) return {};
    
    const result: any = {};
    for (const [indexKey, fieldIndex] of tableIndexes) {
      result[indexKey] = {};
      for (const [value, ids] of fieldIndex) {
        result[indexKey][value] = Array.from(ids);
      }
    }
    return result;
  }

  // Statistics and monitoring
  getStatistics(): {
    tables: number;
    totalRecords: number;
    memoryUsage: number;
    indexCount: number;
    averageEntitySize: number;
  } {
    let totalRecords = 0;
    let totalSize = 0;
    let indexCount = 0;
    
    for (const [, tableData] of this.data) {
      totalRecords += tableData.size;
      totalSize += Array.from(tableData.values())
        .reduce((sum, entity) => sum + JSON.stringify(entity).length, 0);
    }
    
    for (const [, tableIndexes] of this.indexes) {
      indexCount += tableIndexes.size;
    }
    
    return {
      tables: this.data.size,
      totalRecords,
      memoryUsage: totalSize,
      indexCount,
      averageEntitySize: totalRecords > 0 ? Math.round(totalSize / totalRecords) : 0
    };
  }
}