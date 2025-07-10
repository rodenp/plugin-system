// Core GDPR Storage Class - Phase 1: Basic Implementation
// Supports optional state managers with simple cache fallback

import {
  GDPRStorageConfig,
  StateManager,
  EntityUpdate,
  EntityRemoval,
  StateManagerStats,
  DatabaseAdapter,
  AuditEntry,
  DataExportRequest,
  DataExportResult,
  PerformanceMetrics,
  GDPRStorageError,
  ConsentError
} from './types';

import { StateManagerFactory } from './StateManagerFactory';
import { UpdateQueueManager } from './UpdateQueueManager';

export class GDPRStorage {
  private stateManager?: StateManager;
  private updateQueue: UpdateQueueManager;
  private databaseAdapter?: DatabaseAdapter;
  
  // Simple in-memory cache as fallback when no state manager
  private simpleCache = new Map<string, { data: any; expires: number }>();
  
  // Performance tracking
  private performanceMetrics: PerformanceMetrics = {
    queryTimes: { average: 0, min: 0, max: 0, p95: 0, p99: 0 },
    cacheStats: { hitRate: 0, missRate: 0, totalRequests: 0, evictions: 0 },
    updateQueue: { averageBatchSize: 0, averageProcessingTime: 0, queueLength: 0, totalUpdates: 0 },
    memory: { totalUsage: 0, entitiesCount: 0, averageEntitySize: 0 }
  };

  private config: GDPRStorageConfig;
  private initialized = false;

  constructor(config: GDPRStorageConfig) {
    this.config = config;
    
    // State manager is optional - only create if configured
    this.stateManager = config.stateManager 
      ? StateManagerFactory.create(config.stateManager)
      : undefined;
    
    // Core services always exist
    this.updateQueue = new UpdateQueueManager(
      this.stateManager, // Can be undefined
      config.updateQueue
    );
    
    console.log(this.stateManager 
      ? `GDPR Storage initialized WITH ${this.getStateManagerType()} state manager`
      : 'GDPR Storage initialized WITHOUT state manager (direct mode)'
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('GDPR Storage already initialized');
      return;
    }

    try {
      // Initialize database adapter (will be implemented in Phase 4)
      // await this.initializeDatabaseAdapter();
      
      // Initialize state manager if it exists
      if (this.stateManager) {
        await this.stateManager.initialize();
      }
      
      // Initialize update queue
      await this.updateQueue.initialize();
      
      this.initialized = true;
      console.log('GDPR Storage initialized successfully');
      
    } catch (error) {
      throw new GDPRStorageError(
        'Failed to initialize GDPR Storage',
        'INITIALIZATION_ERROR',
        error
      );
    }
  }

  // Core entity operations work with or without state manager
  async getEntity<T>(table: string, id: string): Promise<T | null> {
    if (!this.initialized) {
      throw new GDPRStorageError('GDPR Storage not initialized', 'NOT_INITIALIZED');
    }

    const startTime = Date.now();
    const cacheKey = `${table}:${id}`;
    
    try {
      // Try state manager first (if available)
      if (this.stateManager) {
        const cached = this.stateManager.getEntity<T>(table, id);
        if (cached) {
          this.recordCacheHit();
          this.recordQueryTime(Date.now() - startTime);
          await this.auditLog('cache_hit', table, id);
          return cached;
        }
      }
      
      // Try simple cache (if no state manager)
      if (!this.stateManager) {
        const cached = this.simpleCache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
          this.recordCacheHit();
          this.recordQueryTime(Date.now() - startTime);
          await this.auditLog('simple_cache_hit', table, id);
          return cached.data;
        }
      }
      
      // Cache miss - would load from database (Phase 4)
      this.recordCacheMiss();
      
      // For now, return null (database integration in Phase 4)
      const entity = await this.loadFromDatabase<T>(table, id);
      
      if (entity) {
        // Apply GDPR processing (Phase 3)
        const processedEntity = await this.processEntityForRead(table, entity);
        
        // Cache the result
        if (this.stateManager) {
          this.stateManager.setEntity(table, id, processedEntity);
        } else {
          this.simpleCache.set(cacheKey, {
            data: processedEntity,
            expires: Date.now() + (this.config.cache?.ttl || 5 * 60 * 1000) // 5 minutes default
          });
        }
        
        await this.auditLog('database_load', table, id);
        this.recordQueryTime(Date.now() - startTime);
        return processedEntity;
      }

      this.recordQueryTime(Date.now() - startTime);
      return null;

    } catch (error) {
      this.recordQueryTime(Date.now() - startTime);
      throw new GDPRStorageError(
        `Failed to get entity ${table}:${id}`,
        'GET_ENTITY_ERROR',
        error
      );
    }
  }

  async setEntity<T>(table: string, id: string, data: T): Promise<void> {
    if (!this.initialized) {
      throw new GDPRStorageError('GDPR Storage not initialized', 'NOT_INITIALIZED');
    }

    try {
      console.log(`🔧 [GDPRStorage] setEntity called for ${table}:${id}`);
      
      // GDPR compliance checks (Phase 3)
      console.log(`🔍 [GDPRStorage] Validating GDPR compliance...`);
      await this.validateGDPRCompliance(table, data);
      
      // Update cache immediately (if available)
      if (this.stateManager) {
        console.log(`💾 [GDPRStorage] Updating state manager cache immediately...`);
        this.stateManager.setEntity(table, id, data);
      } else {
        console.log(`💾 [GDPRStorage] Updating simple cache immediately...`);
        // Update simple cache
        const cacheKey = `${table}:${id}`;
        this.simpleCache.set(cacheKey, {
          data,
          expires: Date.now() + (this.config.cache?.ttl || 5 * 60 * 1000)
        });
      }
      
      console.log(`📤 [GDPRStorage] Forwarding to UpdateQueue for batched database update...`);
      // Queue database update (works with or without state manager)
      this.updateQueue.queueUpdate(table, id, data);
      
      console.log(`📝 [GDPRStorage] Logging audit entry...`);
      await this.auditLog('entity_updated', table, id);
      
    } catch (error) {
      throw new GDPRStorageError(
        `Failed to set entity ${table}:${id}`,
        'SET_ENTITY_ERROR',
        error
      );
    }
  }

  async removeEntity(table: string, id: string): Promise<void> {
    if (!this.initialized) {
      throw new GDPRStorageError('GDPR Storage not initialized', 'NOT_INITIALIZED');
    }

    try {
      // Remove from cache
      if (this.stateManager) {
        this.stateManager.removeEntity(table, id);
      } else {
        this.simpleCache.delete(`${table}:${id}`);
      }
      
      // Queue database deletion
      this.updateQueue.queueDeletion(table, id);
      
      await this.auditLog('entity_deleted', table, id);
      
    } catch (error) {
      throw new GDPRStorageError(
        `Failed to remove entity ${table}:${id}`,
        'REMOVE_ENTITY_ERROR',
        error
      );
    }
  }

  // Query operations adapt to available caching
  async getEntitiesWhere<T>(
    table: string, 
    predicate: (entity: T) => boolean
  ): Promise<T[]> {
    if (!this.initialized) {
      throw new GDPRStorageError('GDPR Storage not initialized', 'NOT_INITIALIZED');
    }

    try {
      // If we have a state manager, use it for queries
      if (this.stateManager) {
        const cached = this.stateManager.getEntitiesWhere(table, predicate);
        if (cached.length > 0) {
          return cached;
        }
      }
      
      // Otherwise, load from database (Phase 4)
      const entities = await this.loadEntitiesFromDatabase<T>(table, predicate);
      
      // Cache results if state manager is available
      if (this.stateManager && entities.length > 0) {
        entities.forEach(entity => {
          this.stateManager!.setEntity(table, (entity as any).id, entity);
        });
      }
      
      return entities;
      
    } catch (error) {
      throw new GDPRStorageError(
        `Failed to query entities in ${table}`,
        'QUERY_ENTITIES_ERROR',
        error
      );
    }
  }

  // Batch operations work efficiently with or without state manager
  async batchUpdate(updates: EntityUpdate[]): Promise<void> {
    if (!this.initialized) {
      throw new GDPRStorageError('GDPR Storage not initialized', 'NOT_INITIALIZED');
    }

    try {
      // Update cache
      if (this.stateManager) {
        this.stateManager.batchUpdate(updates);
      } else {
        // Update simple cache
        updates.forEach(({ table, id, data }) => {
          const cacheKey = `${table}:${id}`;
          this.simpleCache.set(cacheKey, {
            data,
            expires: Date.now() + (this.config.cache?.ttl || 5 * 60 * 1000)
          });
        });
      }
      
      // Queue database updates
      this.updateQueue.batchUpdate(updates);
      
      await this.auditLog('batch_update', 'multiple', `${updates.length} entities`);
      
    } catch (error) {
      throw new GDPRStorageError(
        'Failed to batch update entities',
        'BATCH_UPDATE_ERROR',
        error
      );
    }
  }

  // GDPR operations work regardless of state manager
  async exportUserData(request: DataExportRequest): Promise<DataExportResult> {
    if (!this.initialized) {
      throw new GDPRStorageError('GDPR Storage not initialized', 'NOT_INITIALIZED');
    }

    try {
      const userData: any = {};
      const tables = request.tables || await this.getTablesWithUserData();
      
      for (const table of tables) {
        // Try to get from cache first (if available)
        if (this.stateManager) {
          const cachedEntities = this.stateManager.getEntitiesWhere(
            table,
            (entity: any) => entity.userId === request.userId || entity.authorId === request.userId
          );
          
          if (cachedEntities.length > 0) {
            userData[table] = cachedEntities;
            continue;
          }
        }
        
        // Load from database (Phase 4)
        userData[table] = await this.loadUserEntitiesFromDatabase(table, request.userId);
      }

      const result: DataExportResult = {
        requestId: this.generateId(),
        userId: request.userId,
        exportDate: new Date(),
        format: request.format,
        data: userData,
        metadata: {
          totalRecords: Object.values(userData).flat().length,
          tablesIncluded: Object.keys(userData),
          gdprCompliant: true,
          encrypted: request.encryptExport
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      await this.auditLog('export', 'user_data', request.userId);
      return result;
      
    } catch (error) {
      throw new GDPRStorageError(
        `Failed to export user data for ${request.userId}`,
        'EXPORT_ERROR',
        error
      );
    }
  }

  async deleteUserData(userId: string): Promise<any> {
    if (!this.initialized) {
      throw new GDPRStorageError('GDPR Storage not initialized', 'NOT_INITIALIZED');
    }

    try {
      const tables = await this.getTablesWithUserData();
      const deletedItems: any[] = [];

      for (const table of tables) {
        // Remove from cache (if available)
        if (this.stateManager) {
          const entities = this.stateManager.getEntitiesWhere(
            table,
            (entity: any) => entity.userId === userId || entity.authorId === userId
          );

          entities.forEach(entity => {
            this.stateManager!.removeEntity(table, (entity as any).id);
            deletedItems.push({ table, id: (entity as any).id });
          });
        } else {
          // Clean simple cache
          for (const [key, value] of this.simpleCache.entries()) {
            if (key.startsWith(`${table}:`)) {
              const entity = value.data;
              if (entity.userId === userId || entity.authorId === userId) {
                this.simpleCache.delete(key);
                deletedItems.push({ table, id: entity.id });
              }
            }
          }
        }

        // Queue database deletions (Phase 4)
        await this.queueDatabaseDeletions(table, userId);
      }

      const result = {
        deletionDate: new Date(),
        userId,
        deletedItems,
        cacheMode: this.stateManager ? 'state_manager' : 'simple_cache'
      };

      await this.auditLog('delete', 'user_data', userId);
      return result;
      
    } catch (error) {
      throw new GDPRStorageError(
        `Failed to delete user data for ${userId}`,
        'DELETE_ERROR',
        error
      );
    }
  }

  // Subscription methods adapt to available features
  subscribe(
    table: string, 
    id: string, 
    callback: (entity: any) => void
  ): () => void {
    if (this.stateManager) {
      // Use state manager's reactive subscriptions
      return this.stateManager.subscribe(table, id, callback);
    } else {
      // Simple polling fallback
      const interval = setInterval(async () => {
        const entity = await this.getEntity(table, id);
        callback(entity);
      }, 1000); // Poll every second
      
      return () => clearInterval(interval);
    }
  }

  subscribeToTable(
    table: string, 
    callback: (entities: any[]) => void
  ): () => void {
    if (this.stateManager) {
      return this.stateManager.subscribeToTable(table, callback);
    } else {
      // Simple polling fallback
      const interval = setInterval(async () => {
        const entities = await this.getAllEntities(table);
        callback(entities);
      }, 2000); // Poll every 2 seconds
      
      return () => clearInterval(interval);
    }
  }

  // Introspection methods
  getStateManagerType(): string {
    return this.stateManager?.constructor.name || 'No State Manager';
  }

  getStats(): any {
    if (this.stateManager) {
      return {
        mode: 'state_manager',
        stateManagerStats: this.stateManager.getStats(),
        updateQueue: this.updateQueue.getStats(),
        performance: this.performanceMetrics
      };
    } else {
      return {
        mode: 'simple_cache',
        simpleCacheSize: this.simpleCache.size,
        updateQueue: this.updateQueue.getStats(),
        performance: this.performanceMetrics
      };
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Cleanup methods
  async destroy(): Promise<void> {
    if (this.stateManager) {
      this.stateManager.destroy();
    }
    
    this.simpleCache.clear();
    await this.updateQueue.destroy();
    
    if (this.databaseAdapter) {
      await this.databaseAdapter.close();
    }
    
    this.initialized = false;
    console.log('GDPR Storage destroyed');
  }

  clear(): void {
    if (this.stateManager) {
      this.stateManager.clear();
    }
    
    this.simpleCache.clear();
    this.updateQueue.clear();
    
    console.log('GDPR Storage cleared');
  }

  // Helper methods (placeholder implementations for Phase 1)
  private async loadFromDatabase<T>(table: string, id: string): Promise<T | null> {
    // Placeholder - will implement in Phase 4 with actual database adapters
    console.log(`Loading ${table}:${id} from database (placeholder)`);
    return null;
  }

  private async loadEntitiesFromDatabase<T>(
    table: string, 
    predicate: (entity: T) => boolean
  ): Promise<T[]> {
    // Placeholder - will implement in Phase 4
    console.log(`Loading entities from ${table} with predicate (placeholder)`);
    return [];
  }

  private async processEntityForRead<T>(table: string, entity: T): Promise<T> {
    // Placeholder - will implement GDPR processing in Phase 3
    // This is where decryption and data subject rights would be applied
    return entity;
  }

  private async validateGDPRCompliance(table: string, data: any): Promise<void> {
    // Placeholder - will implement GDPR validation in Phase 3
    // This is where consent checking and encryption would happen
    console.log(`Validating GDPR compliance for ${table} (placeholder)`);
  }

  private async auditLog(action: string, table: string, id: string): Promise<void> {
    // Placeholder - will implement audit logging in Phase 3
    console.log(`Audit: ${action} on ${table}:${id}`);
  }

  private async getTablesWithUserData(): Promise<string[]> {
    // Placeholder - will implement in Phase 4
    return ['users', 'comments', 'courses', 'enrollments'];
  }

  private async loadUserEntitiesFromDatabase(table: string, userId: string): Promise<any[]> {
    // Placeholder - will implement in Phase 4
    console.log(`Loading user entities from ${table} for user ${userId} (placeholder)`);
    return [];
  }

  private async queueDatabaseDeletions(table: string, userId: string): Promise<void> {
    // Placeholder - will implement in Phase 4
    console.log(`Queuing deletions in ${table} for user ${userId} (placeholder)`);
  }

  private async getAllEntities<T>(table: string): Promise<T[]> {
    if (this.stateManager) {
      return this.stateManager.getAllEntities<T>(table);
    } else {
      // Load from database (Phase 4)
      return [];
    }
  }

  private generateId(): string {
    return `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Performance tracking helpers
  private recordCacheHit(): void {
    this.performanceMetrics.cacheStats.totalRequests++;
    this.performanceMetrics.cacheStats.hitRate = 
      this.performanceMetrics.cacheStats.totalRequests > 0
        ? (this.performanceMetrics.cacheStats.totalRequests - this.performanceMetrics.cacheStats.missRate) 
          / this.performanceMetrics.cacheStats.totalRequests
        : 0;
  }

  private recordCacheMiss(): void {
    this.performanceMetrics.cacheStats.totalRequests++;
    this.performanceMetrics.cacheStats.missRate++;
    this.performanceMetrics.cacheStats.hitRate = 
      this.performanceMetrics.cacheStats.totalRequests > 0
        ? (this.performanceMetrics.cacheStats.totalRequests - this.performanceMetrics.cacheStats.missRate) 
          / this.performanceMetrics.cacheStats.totalRequests
        : 0;
  }

  private recordQueryTime(timeMs: number): void {
    const times = this.performanceMetrics.queryTimes;
    times.average = (times.average + timeMs) / 2; // Simple running average
    times.min = times.min === 0 ? timeMs : Math.min(times.min, timeMs);
    times.max = Math.max(times.max, timeMs);
    // P95/P99 would need proper histogram tracking - simplified for Phase 1
    times.p95 = times.max * 0.95;
    times.p99 = times.max * 0.99;
  }
}