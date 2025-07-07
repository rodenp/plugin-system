// State Manager Integration - Optional integration with State Manager Plugin
import { ServiceRegistry } from '../../core/communication/ServiceRegistry';
import {
  StateManagerIntegrationConfig,
  StorageEntity,
  StorageError,
  CacheEntry,
  StateManagerAdapter
} from './types';

export class StateManagerIntegration {
  private config: StateManagerIntegrationConfig;
  private serviceRegistry: ServiceRegistry;
  private stateManager?: StateManagerAdapter;
  private isInitialized = false;
  private isConnected = false;
  private subscribers: Map<string, Function[]> = new Map();
  private reactiveQueries: Map<string, {
    filter: any;
    callback: Function;
    lastResult: any;
  }> = new Map();

  constructor(config: StateManagerIntegrationConfig, serviceRegistry: ServiceRegistry) {
    this.config = this.validateConfig(config);
    this.serviceRegistry = serviceRegistry;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('StateManagerIntegration already initialized');
      return;
    }

    try {
      console.log('🔗 Initializing StateManagerIntegration...');
      
      // Try to connect to State Manager Plugin
      await this.connectToStateManager();
      
      // Set up reactive query system if connected
      if (this.isConnected) {
        this.setupReactiveQueries();
      }
      
      this.isInitialized = true;
      console.log('✅ StateManagerIntegration initialized');
      
    } catch (error) {
      console.warn('StateManagerIntegration initialization failed:', error);
      // Don't throw - this is optional functionality
      this.isInitialized = true;
    }
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      console.log('🔗 Destroying StateManagerIntegration...');
      
      // Clear subscribers
      this.subscribers.clear();
      this.reactiveQueries.clear();
      
      // Disconnect from state manager
      if (this.stateManager && this.isConnected) {
        await this.disconnectFromStateManager();
      }
      
      this.isInitialized = false;
      console.log('✅ StateManagerIntegration destroyed');
      
    } catch (error) {
      console.error('❌ StateManagerIntegration destruction failed:', error);
      throw new StorageError(
        `Failed to destroy StateManagerIntegration: ${(error as Error).message}`,
        'DESTRUCTION_ERROR'
      );
    }
  }

  // Cache Management Integration
  async getCachedEntity<T extends StorageEntity>(table: string, id: string): Promise<T | null> {
    if (!this.isConnected || !this.stateManager) {
      return null;
    }

    try {
      const cacheKey = this.generateCacheKey(table, id);
      const cached = await this.stateManager.getFromCache(cacheKey);
      
      if (cached && this.isValidCacheEntry(cached)) {
        return cached.data as T;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get cached entity:', error);
      return null;
    }
  }

  async setCachedEntity<T extends StorageEntity>(table: string, entity: T): Promise<void> {
    if (!this.isConnected || !this.stateManager) {
      return;
    }

    try {
      const cacheKey = this.generateCacheKey(table, entity.id);
      const cacheEntry: CacheEntry<T> = {
        data: entity,
        timestamp: new Date(),
        ttl: this.config.cache?.defaultTTL || 300000, // 5 minutes
        accessed: new Date(),
        metadata: {
          table,
          entityId: entity.id,
          version: entity.version || 1
        }
      };
      
      await this.stateManager.setInCache(cacheKey, cacheEntry);
    } catch (error) {
      console.warn('Failed to cache entity:', error);
    }
  }

  async invalidateCache(table: string, id?: string): Promise<void> {
    if (!this.isConnected || !this.stateManager) {
      return;
    }

    try {
      if (id) {
        // Invalidate specific entity
        const cacheKey = this.generateCacheKey(table, id);
        await this.stateManager.removeFromCache(cacheKey);
      } else {
        // Invalidate all entities for table
        const pattern = `storage:${table}:*`;
        await this.stateManager.clearCachePattern(pattern);
      }
    } catch (error) {
      console.warn('Failed to invalidate cache:', error);
    }
  }

  // Reactive Updates
  async notifyEntityChanged<T extends StorageEntity>(
    action: 'created' | 'updated' | 'deleted',
    table: string,
    entity: T,
    oldEntity?: T
  ): Promise<void> {
    if (!this.isConnected || !this.stateManager) {
      return;
    }

    try {
      const event = {
        type: 'storage_entity_changed',
        action,
        table,
        entity,
        oldEntity,
        timestamp: new Date()
      };

      // Notify state manager of change
      await this.stateManager.emitEvent(event);
      
      // Update reactive queries
      await this.updateReactiveQueries(table, action, entity);
      
      // Notify local subscribers
      this.notifySubscribers(table, event);
      
    } catch (error) {
      console.warn('Failed to notify entity change:', error);
    }
  }

  // Subscription Management
  subscribe(table: string, callback: Function): () => void {
    if (!this.subscribers.has(table)) {
      this.subscribers.set(table, []);
    }
    
    this.subscribers.get(table)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(table);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  subscribeToQuery(table: string, filter: any, callback: Function): () => void {
    const queryId = this.generateQueryId(table, filter);
    
    this.reactiveQueries.set(queryId, {
      filter,
      callback,
      lastResult: null
    });
    
    // Return unsubscribe function
    return () => {
      this.reactiveQueries.delete(queryId);
    };
  }

  // State Synchronization
  async syncWithStateManager<T extends StorageEntity>(
    table: string,
    entities: T[]
  ): Promise<void> {
    if (!this.isConnected || !this.stateManager) {
      return;
    }

    try {
      // Update state manager with current entities
      const stateKey = `storage_table:${table}`;
      await this.stateManager.setState(stateKey, entities);
      
      // Update cache entries
      for (const entity of entities) {
        await this.setCachedEntity(table, entity);
      }
      
    } catch (error) {
      console.warn('Failed to sync with state manager:', error);
    }
  }

  async getStateFromManager<T extends StorageEntity>(table: string): Promise<T[]> {
    if (!this.isConnected || !this.stateManager) {
      return [];
    }

    try {
      const stateKey = `storage_table:${table}`;
      const state = await this.stateManager.getState(stateKey);
      return Array.isArray(state) ? state : [];
    } catch (error) {
      console.warn('Failed to get state from manager:', error);
      return [];
    }
  }

  // Performance Optimization
  async prefetchRelatedEntities<T extends StorageEntity>(
    table: string,
    entity: T,
    relations: string[]
  ): Promise<void> {
    if (!this.isConnected || !this.config.enablePrefetching) {
      return;
    }

    try {
      // Implementation would depend on relation mapping
      // This is a placeholder for relation-based prefetching
      console.debug(`Prefetching related entities for ${table}:${entity.id}`, relations);
    } catch (error) {
      console.warn('Failed to prefetch related entities:', error);
    }
  }

  async batchUpdateState(updates: Array<{
    action: 'set' | 'delete';
    table: string;
    key: string;
    data?: any;
  }>): Promise<void> {
    if (!this.isConnected || !this.stateManager) {
      return;
    }

    try {
      // Use state manager's batch update if available
      if (typeof this.stateManager.batchUpdate === 'function') {
        await this.stateManager.batchUpdate(updates);
      } else {
        // Fallback to individual updates
        for (const update of updates) {
          if (update.action === 'set') {
            await this.stateManager.setState(update.key, update.data);
          } else {
            await this.stateManager.deleteState(update.key);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to batch update state:', error);
    }
  }

  // Private implementation methods
  private async connectToStateManager(): Promise<void> {
    try {
      // Check if State Manager Plugin is available
      const stateManagerService = this.serviceRegistry.getService('stateManager');
      
      if (!stateManagerService) {
        console.info('State Manager Plugin not available - running in standalone mode');
        return;
      }

      // Create adapter interface
      this.stateManager = {
        getFromCache: stateManagerService.getFromCache?.bind(stateManagerService),
        setInCache: stateManagerService.setInCache?.bind(stateManagerService),
        removeFromCache: stateManagerService.removeFromCache?.bind(stateManagerService),
        clearCachePattern: stateManagerService.clearCachePattern?.bind(stateManagerService),
        emitEvent: stateManagerService.emitEvent?.bind(stateManagerService),
        setState: stateManagerService.setState?.bind(stateManagerService),
        getState: stateManagerService.getState?.bind(stateManagerService),
        deleteState: stateManagerService.deleteState?.bind(stateManagerService),
        batchUpdate: stateManagerService.batchUpdate?.bind(stateManagerService),
        subscribe: stateManagerService.subscribe?.bind(stateManagerService)
      };

      this.isConnected = true;
      console.log('✅ Connected to State Manager Plugin');
      
    } catch (error) {
      console.warn('Failed to connect to State Manager:', error);
      this.isConnected = false;
    }
  }

  private async disconnectFromStateManager(): Promise<void> {
    this.stateManager = undefined;
    this.isConnected = false;
    console.log('🔌 Disconnected from State Manager Plugin');
  }

  private setupReactiveQueries(): void {
    if (!this.stateManager?.subscribe) {
      return;
    }

    // Subscribe to state manager events
    this.stateManager.subscribe('storage_events', (event: any) => {
      this.handleStateManagerEvent(event);
    });

    console.log('🔄 Reactive queries system enabled');
  }

  private handleStateManagerEvent(event: any): void {
    try {
      if (event.type === 'storage_entity_changed') {
        this.updateReactiveQueries(event.table, event.action, event.entity);
      }
    } catch (error) {
      console.warn('Failed to handle state manager event:', error);
    }
  }

  private async updateReactiveQueries(
    table: string,
    action: string,
    entity: StorageEntity
  ): Promise<void> {
    for (const [queryId, query] of this.reactiveQueries) {
      if (queryId.startsWith(`${table}:`)) {
        try {
          // Simplified reactive update - would need proper query matching
          query.callback({
            action,
            entity,
            timestamp: new Date()
          });
        } catch (error) {
          console.warn(`Failed to update reactive query ${queryId}:`, error);
        }
      }
    }
  }

  private notifySubscribers(table: string, event: any): void {
    const callbacks = this.subscribers.get(table);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.warn('Failed to notify subscriber:', error);
        }
      });
    }
  }

  private generateCacheKey(table: string, id: string): string {
    return `storage:${table}:${id}`;
  }

  private generateQueryId(table: string, filter: any): string {
    return `${table}:${JSON.stringify(filter)}`;
  }

  private isValidCacheEntry(entry: any): entry is CacheEntry<any> {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    const now = new Date();
    const entryTime = new Date(entry.timestamp);
    const age = now.getTime() - entryTime.getTime();

    return age < (entry.ttl || this.config.cache?.defaultTTL || 300000);
  }

  private validateConfig(config: StateManagerIntegrationConfig): StateManagerIntegrationConfig {
    if (!config) {
      throw new StorageError('StateManagerIntegration configuration is required', 'CONFIG_ERROR');
    }

    return {
      enabled: config.enabled !== false,
      enableCaching: config.enableCaching !== false,
      enableReactiveQueries: config.enableReactiveQueries !== false,
      enablePrefetching: config.enablePrefetching || false,
      cache: {
        defaultTTL: 300000, // 5 minutes
        maxSize: 1000,
        ...config.cache
      },
      ...config
    };
  }

  // Public API
  isEnabled(): boolean {
    return this.config.enabled && this.isInitialized;
  }

  isStateManagerConnected(): boolean {
    return this.isConnected;
  }

  getConfiguration(): Partial<StateManagerIntegrationConfig> {
    return {
      enabled: this.config.enabled,
      enableCaching: this.config.enableCaching,
      enableReactiveQueries: this.config.enableReactiveQueries,
      enablePrefetching: this.config.enablePrefetching
    };
  }

  getStats(): {
    connected: boolean;
    subscribers: number;
    reactiveQueries: number;
    cacheEnabled: boolean;
  } {
    return {
      connected: this.isConnected,
      subscribers: Array.from(this.subscribers.values()).reduce((sum, subs) => sum + subs.length, 0),
      reactiveQueries: this.reactiveQueries.size,
      cacheEnabled: this.config.enableCaching || false
    };
  }
}