// Base Storage Adapter - Abstract implementation for all storage backends
import {
  StorageBackend,
  StorageEntity,
  QueryFilter,
  Transaction,
  StorageInfo,
  PerformanceMetrics,
  HealthStatus,
  BackupOptions,
  BackupResult,
  BackupData,
  RestoreOptions,
  TableSchema,
  TableChange,
  IndexOptions,
  AggregationPipeline,
  SearchQuery,
  AnalysisResult,
  StorageError
} from '../types';

export abstract class BaseAdapter implements StorageBackend {
  protected connected = false;
  protected config: any;
  protected metrics: PerformanceMetrics;
  protected lastError?: Error;

  abstract type: 'indexeddb' | 'postgresql' | 'mongodb' | 'mysql' | 'memory' | 'file';

  constructor(config?: any) {
    this.config = config || {};
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      queriesPerSecond: 0,
      averageQueryTime: 0,
      slowQueries: [],
      indexUsage: [],
      memoryUsage: {
        total: 0,
        used: 0,
        free: 0
      },
      diskUsage: {
        total: 0,
        used: 0,
        free: 0,
        dataSize: 0,
        indexSize: 0
      }
    };
  }

  // Connection Management
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  protected validateConnection(): void {
    if (!this.connected) {
      throw new StorageError('Storage adapter not connected', 'CONNECTION_ERROR');
    }
  }

  // Core CRUD Operations
  abstract create<T extends StorageEntity>(table: string, data: T): Promise<T>;
  abstract read<T extends StorageEntity>(table: string, id: string): Promise<T | null>;
  abstract update<T extends StorageEntity>(table: string, id: string, data: Partial<T>): Promise<T>;
  abstract delete(table: string, id: string): Promise<void>;

  // Batch Operations
  async createMany<T extends StorageEntity>(table: string, data: T[]): Promise<T[]> {
    const results: T[] = [];
    for (const item of data) {
      results.push(await this.create(table, item));
    }
    return results;
  }

  async updateMany<T extends StorageEntity>(table: string, updates: Array<{id: string, data: Partial<T>}>): Promise<T[]> {
    const results: T[] = [];
    for (const update of updates) {
      results.push(await this.update(table, update.id, update.data));
    }
    return results;
  }

  async deleteMany(table: string, ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(table, id);
    }
  }

  // Query Operations
  abstract query<T extends StorageEntity>(table: string, filter?: QueryFilter<T>): Promise<T[]>;
  abstract count(table: string, filter?: QueryFilter<any>): Promise<number>;

  async exists(table: string, id: string): Promise<boolean> {
    const result = await this.read(table, id);
    return result !== null;
  }

  // Advanced Operations (Default implementations)
  async aggregate<T extends StorageEntity>(table: string, pipeline: AggregationPipeline): Promise<any[]> {
    throw new StorageError(`Aggregation not supported by ${this.type} adapter`, 'NOT_SUPPORTED');
  }

  async search<T extends StorageEntity>(table: string, query: SearchQuery): Promise<T[]> {
    // Basic text search implementation - can be overridden by specific adapters
    const allItems = await this.query<T>(table);
    const searchText = query.text.toLowerCase();
    const searchFields = query.fields || ['id'];

    return allItems.filter(item => {
      return searchFields.some(field => {
        const value = (item as any)[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchText);
        }
        return false;
      });
    });
  }

  // Transaction Support (Default: No-op implementations)
  async beginTransaction(): Promise<Transaction> {
    return {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      isolation: 'read_committed'
    };
  }

  async commitTransaction(tx: Transaction): Promise<void> {
    // Default: No-op
  }

  async rollbackTransaction(tx: Transaction): Promise<void> {
    // Default: No-op
  }

  // Schema Operations (Default: No-op implementations)
  async createTable(table: string, schema?: TableSchema): Promise<void> {
    // Default: No-op for NoSQL databases
  }

  async dropTable(table: string): Promise<void> {
    await this.clear(table);
  }

  async alterTable(table: string, changes: TableChange[]): Promise<void> {
    throw new StorageError(`Schema alterations not supported by ${this.type} adapter`, 'NOT_SUPPORTED');
  }

  // Index Operations (Default: No-op implementations)
  async createIndex(table: string, fields: string[], options?: IndexOptions): Promise<void> {
    // Default: No-op for adapters that don't support explicit indexing
  }

  async dropIndex(table: string, indexName: string): Promise<void> {
    // Default: No-op
  }

  // Maintenance Operations
  abstract clear(table: string): Promise<void>;

  async vacuum(table?: string): Promise<void> {
    // Default: No-op
  }

  async analyze(table?: string): Promise<AnalysisResult> {
    const tables = table ? [table] : await this.getTableNames();
    const tableAnalyses = [];

    for (const tableName of tables) {
      const count = await this.count(tableName);
      tableAnalyses.push({
        name: tableName,
        recordCount: count,
        averageRecordSize: 0, // Would need actual calculation
        fragmentationLevel: 0,
        indexEfficiency: 1,
        queryPatterns: []
      });
    }

    return {
      tables: tableAnalyses,
      recommendations: [],
      performance: {
        bottlenecks: [],
        slowQueries: this.metrics.slowQueries,
        resourceUsage: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0
        },
        scalabilityMetrics: {
          currentCapacity: 1000000,
          projectedCapacity: 1000000,
          growthRate: 0
        }
      },
      storage: {
        totalSize: this.metrics.diskUsage.used,
        growth: {
          dailyGrowth: 0,
          weeklyGrowth: 0,
          monthlyGrowth: 0,
          trend: 'stable',
          projection: {
            days: 0,
            weeks: 0,
            months: 0
          }
        },
        fragmentation: {
          level: 0,
          impactOnPerformance: 'low',
          recommendedAction: 'none'
        },
        retention: {
          expiredData: 0,
          retentionCompliance: 100,
          cleanupRecommendations: []
        }
      }
    };
  }

  // Backup and Restore Operations
  async backup(options?: BackupOptions): Promise<BackupResult> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();
    const tables = options?.tables || await this.getTableNames();
    
    let totalSize = 0;
    const backupData: Record<string, any[]> = {};

    for (const table of tables) {
      const data = await this.query(table);
      backupData[table] = data;
      totalSize += JSON.stringify(data).length;
    }

    const backup: BackupData = {
      id: backupId,
      timestamp,
      version: '1.0.0',
      data: backupData,
      metadata: {
        source: this.type,
        tables,
        totalRecords: Object.values(backupData).reduce((sum, records) => sum + records.length, 0),
        checksum: this.calculateChecksum(JSON.stringify(backupData))
      }
    };

    // Store backup (implementation depends on adapter)
    await this.storeBackup(backup);

    return {
      id: backupId,
      timestamp,
      size: totalSize,
      checksum: backup.metadata.checksum,
      tables,
      location: `${this.type}:${backupId}`,
      format: 'json',
      encrypted: false
    };
  }

  async restore(backup: BackupData, options?: RestoreOptions): Promise<void> {
    const tables = options?.tables || Object.keys(backup.data);
    
    for (const table of tables) {
      if (backup.data[table]) {
        if (options?.overwrite) {
          await this.clear(table);
        }
        
        await this.createMany(table, backup.data[table]);
      }
    }
  }

  protected async storeBackup(backup: BackupData): Promise<void> {
    // Default: Store as JSON file (can be overridden)
    if (typeof window === 'undefined') {
      // Node.js environment - store to file
      const fs = await import('fs');
      const path = await import('path');
      const backupPath = path.join(process.cwd(), 'backups', `${backup.id}.json`);
      
      // Ensure backups directory exists
      await fs.promises.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.promises.writeFile(backupPath, JSON.stringify(backup, null, 2));
    } else {
      // Browser environment - store to IndexedDB or localStorage
      localStorage.setItem(`backup_${backup.id}`, JSON.stringify(backup));
    }
  }

  protected calculateChecksum(data: string): string {
    // Simple checksum calculation (can be improved with crypto)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Information and Monitoring
  abstract getStorageInfo(): Promise<StorageInfo>;

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return { ...this.metrics };
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const checks = [
      {
        name: 'connection',
        status: this.connected ? 'pass' as const : 'fail' as const,
        message: this.connected ? 'Connected' : 'Not connected',
        lastCheck: new Date(),
        duration: 0
      },
      {
        name: 'performance',
        status: this.metrics.averageQueryTime < 1000 ? 'pass' as const : 'warn' as const,
        message: `Average query time: ${this.metrics.averageQueryTime}ms`,
        lastCheck: new Date(),
        duration: 0
      }
    ];

    return {
      status: this.connected ? 'healthy' : 'critical',
      checks,
      uptime: Date.now() - (this.config.startTime || Date.now()),
      lastCheckTime: new Date()
    };
  }

  // Helper Methods
  protected updateMetrics(operation: string, duration: number): void {
    this.metrics.averageQueryTime = (this.metrics.averageQueryTime + duration) / 2;
    
    if (duration > 1000) {
      this.metrics.slowQueries.push({
        query: operation,
        duration,
        timestamp: new Date(),
        table: 'unknown'
      });
      
      // Keep only last 10 slow queries
      if (this.metrics.slowQueries.length > 10) {
        this.metrics.slowQueries.shift();
      }
    }
  }

  protected async measureOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.updateMetrics(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(operation, duration);
      this.lastError = error as Error;
      throw error;
    }
  }

  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected addTimestamps<T extends StorageEntity>(data: Partial<T>, isUpdate = false): T {
    const now = new Date();
    const result = { ...data } as T;
    
    if (!isUpdate) {
      result.id = result.id || this.generateId();
      result.createdAt = now;
    }
    
    result.updatedAt = now;
    result.version = (result.version || 0) + 1;
    
    return result;
  }

  protected applyFilter<T>(items: T[], filter?: QueryFilter<T>): T[] {
    let result = items;

    // Apply where clause
    if (filter?.where) {
      result = result.filter(item => this.matchesFilter(item, filter.where!));
    }

    // Apply ordering
    if (filter?.orderBy && filter.orderBy.length > 0) {
      result = result.sort((a, b) => {
        for (const order of filter.orderBy!) {
          const aVal = (a as any)[order.field];
          const bVal = (b as any)[order.field];
          
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          if (aVal > bVal) comparison = 1;
          
          if (comparison !== 0) {
            return order.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    // Apply pagination
    if (filter?.offset) {
      result = result.slice(filter.offset);
    }
    
    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }

    // Apply field selection
    if (filter?.select && filter.select.length > 0) {
      result = result.map(item => {
        const selected: any = {};
        for (const field of filter.select!) {
          selected[field] = (item as any)[field];
        }
        return selected;
      });
    }

    return result;
  }

  private matchesFilter<T>(item: T, filter: any): boolean {
    if (typeof filter !== 'object' || filter === null) {
      return true;
    }

    // Handle complex filters (and, or, not)
    if (filter.and) {
      return filter.and.every((subFilter: any) => this.matchesFilter(item, subFilter));
    }
    
    if (filter.or) {
      return filter.or.some((subFilter: any) => this.matchesFilter(item, subFilter));
    }
    
    if (filter.not) {
      return !this.matchesFilter(item, filter.not);
    }

    // Handle simple field matches
    for (const [key, value] of Object.entries(filter)) {
      const itemValue = (item as any)[key];
      
      if (typeof value === 'object' && value !== null) {
        // Handle operators like $gt, $lt, etc.
        for (const [operator, operatorValue] of Object.entries(value)) {
          switch (operator) {
            case '$eq':
              if (itemValue !== operatorValue) return false;
              break;
            case '$ne':
              if (itemValue === operatorValue) return false;
              break;
            case '$gt':
              if (itemValue <= operatorValue) return false;
              break;
            case '$gte':
              if (itemValue < operatorValue) return false;
              break;
            case '$lt':
              if (itemValue >= operatorValue) return false;
              break;
            case '$lte':
              if (itemValue > operatorValue) return false;
              break;
            case '$in':
              if (!Array.isArray(operatorValue) || !operatorValue.includes(itemValue)) return false;
              break;
            case '$nin':
              if (Array.isArray(operatorValue) && operatorValue.includes(itemValue)) return false;
              break;
            case '$contains':
              if (typeof itemValue === 'string' && typeof operatorValue === 'string') {
                if (!itemValue.toLowerCase().includes(operatorValue.toLowerCase())) return false;
              }
              break;
            case '$regex':
              if (typeof itemValue === 'string') {
                const regex = new RegExp(operatorValue);
                if (!regex.test(itemValue)) return false;
              }
              break;
          }
        }
      } else {
        // Simple equality check
        if (itemValue !== value) return false;
      }
    }

    return true;
  }

  protected async getTableNames(): Promise<string[]> {
    // Default implementation - should be overridden by specific adapters
    return ['users', 'posts', 'comments', 'courses'];
  }

  // Cleanup and lifecycle
  protected cleanup(): void {
    this.connected = false;
    this.lastError = undefined;
  }
}