// State Manager Factory - Phase 1: Core Architecture Foundation
// Creates pluggable state managers with fallback support

import {
  StateManager,
  StateManagerConfig,
  StateManagerType,
  GDPRStorageError
} from './types';

export class StateManagerFactory {
  static create(config: StateManagerConfig): StateManager {
    switch (config.type) {
      case 'zustand':
        // Dynamically import Zustand state manager (Phase 2)
        return StateManagerFactory.createZustandManager(config.options);
        
      case 'jotai':
        // Dynamically import Jotai state manager (Phase 2)
        return StateManagerFactory.createJotaiManager(config.options);
        
      case 'simple':
        // Create simple in-memory state manager
        return StateManagerFactory.createSimpleManager(config.options);
        
      case 'custom':
        if (!config.customImplementation) {
          throw new GDPRStorageError(
            'Custom implementation required when type is "custom"',
            'INVALID_CONFIG'
          );
        }
        return config.customImplementation;
        
      case 'none':
        // No state manager - GDPRStorage will use simple cache fallback
        throw new GDPRStorageError(
          'State manager type "none" should not call factory',
          'INVALID_CONFIG'
        );
        
      default:
        throw new GDPRStorageError(
          `Unknown state manager type: ${config.type}`,
          'UNKNOWN_STATE_MANAGER'
        );
    }
  }

  // Phase 2: Real Zustand implementation
  private static createZustandManager(options?: any): StateManager {
    try {
      // Dynamic import to check if Zustand is available
      const { ZustandStateManager } = require('./state-managers/ZustandStateManager');
      return new ZustandStateManager();
    } catch (error) {
      console.error('Failed to create Zustand state manager, falling back to Simple:', error);
      console.error('Make sure Zustand is installed: npm install zustand');
      return StateManagerFactory.createSimpleManager(options);
    }
  }

  // Phase 2: Real Jotai implementation
  private static createJotaiManager(options?: any): StateManager {
    try {
      // Dynamic import to check if Jotai is available
      const { JotaiStateManager } = require('./state-managers/JotaiStateManager');
      return new JotaiStateManager(options);
    } catch (error) {
      console.error('Failed to create Jotai state manager, falling back to Simple:', error);
      console.error('Make sure Jotai is installed: npm install jotai');
      return StateManagerFactory.createSimpleManager(options);
    }
  }

  // Phase 1: Simple state manager implementation
  private static createSimpleManager(options?: any): StateManager {
    return new SimpleStateManager(options);
  }

  // Validation helper
  static validateConfig(config: StateManagerConfig): boolean {
    if (!config.type) {
      return false;
    }

    if (config.type === 'custom' && !config.customImplementation) {
      return false;
    }

    return true;
  }

  // Get available state manager types
  static getAvailableTypes(): StateManagerType[] {
    return ['simple', 'zustand', 'jotai', 'custom', 'none'];
  }

  // Check if a state manager type is available
  static isTypeAvailable(type: StateManagerType): boolean {
    switch (type) {
      case 'simple':
        return true;
      case 'zustand':
        try {
          require('zustand');
          return true;
        } catch {
          return false;
        }
      case 'jotai':
        try {
          require('jotai');
          return true;
        } catch {
          return false;
        }
      case 'custom':
        return true;
      case 'none':
        return true;
      default:
        return false;
    }
  }
}

// Simple State Manager Implementation (Phase 1)
// This provides a complete implementation without external dependencies
class SimpleStateManager implements StateManager {
  private entities: Record<string, Record<string, any>> = {};
  private subscriptions = new Map<string, Set<(entity: any) => void>>();
  private tableSubscriptions = new Map<string, Set<(entities: any[]) => void>>();
  private stats = {
    totalEntities: 0,
    cacheHits: 0,
    totalAccesses: 0
  };
  private options: any;

  constructor(options?: any) {
    this.options = {
      maxCacheSize: 10000,
      ttl: 5 * 60 * 1000, // 5 minutes
      persistence: false,
      ...options
    };
    
    console.log('SimpleStateManager initialized with options:', this.options);
  }

  async initialize(config?: any): Promise<void> {
    console.log('SimpleStateManager: Initialization complete');
    
    // Load from localStorage if persistence is enabled
    if (this.options.persistence && typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('gdpr_simple_state');
        if (stored) {
          const data = JSON.parse(stored);
          this.entities = data.entities || {};
          this.stats.totalEntities = this.countTotalEntities();
          console.log('SimpleStateManager: Restored from localStorage');
        }
      } catch (error) {
        console.warn('SimpleStateManager: Failed to restore from localStorage:', error);
      }
    }
  }

  getEntity<T>(table: string, id: string): T | undefined {
    this.stats.totalAccesses++;
    const entity = this.entities[table]?.[id];
    if (entity) {
      this.stats.cacheHits++;
    }
    return entity;
  }

  setEntity<T>(table: string, id: string, data: T): void {
    if (!this.entities[table]) {
      this.entities[table] = {};
    }
    
    const wasNew = !this.entities[table][id];
    this.entities[table][id] = { 
      ...data, 
      _lastUpdated: Date.now(),
      _simpleStateManager: true 
    };
    
    if (wasNew) {
      this.stats.totalEntities++;
    }
    
    // Check cache size limits
    this.enforceMaxCacheSize();
    
    // Persist to localStorage if enabled
    this.persistToStorage();
    
    // Notify subscribers
    this.notifyEntitySubscribers(table, id, this.entities[table][id]);
    this.notifyTableSubscribers(table);
  }

  removeEntity(table: string, id: string): void {
    if (this.entities[table]?.[id]) {
      delete this.entities[table][id];
      this.stats.totalEntities--;
      
      // Clean up empty tables
      if (Object.keys(this.entities[table]).length === 0) {
        delete this.entities[table];
      }
      
      this.persistToStorage();
      this.notifyEntitySubscribers(table, id, undefined);
      this.notifyTableSubscribers(table);
    }
  }

  batchUpdate(updates: import('./types').EntityUpdate[]): void {
    const affectedTables = new Set<string>();
    
    updates.forEach(({ table, id, data }) => {
      if (!this.entities[table]) {
        this.entities[table] = {};
      }
      
      const wasNew = !this.entities[table][id];
      this.entities[table][id] = { 
        ...data, 
        _lastUpdated: Date.now(),
        _batchUpdated: true 
      };
      
      if (wasNew) {
        this.stats.totalEntities++;
      }
      
      affectedTables.add(table);
      this.notifyEntitySubscribers(table, id, this.entities[table][id]);
    });
    
    this.enforceMaxCacheSize();
    this.persistToStorage();
    
    // Notify table subscribers
    affectedTables.forEach(table => {
      this.notifyTableSubscribers(table);
    });
  }

  batchRemove(removals: import('./types').EntityRemoval[]): void {
    const affectedTables = new Set<string>();
    
    removals.forEach(({ table, id }) => {
      if (this.entities[table]?.[id]) {
        delete this.entities[table][id];
        this.stats.totalEntities--;
        affectedTables.add(table);
        this.notifyEntitySubscribers(table, id, undefined);
      }
    });
    
    // Clean up empty tables
    affectedTables.forEach(table => {
      if (this.entities[table] && Object.keys(this.entities[table]).length === 0) {
        delete this.entities[table];
      }
    });
    
    this.persistToStorage();
    
    // Notify table subscribers
    affectedTables.forEach(table => {
      this.notifyTableSubscribers(table);
    });
  }

  getEntitiesWhere<T>(table: string, predicate: (entity: T) => boolean): T[] {
    const entities = this.entities[table] || {};
    return Object.values(entities).filter(predicate);
  }

  getAllEntities<T>(table: string): T[] {
    return Object.values(this.entities[table] || {});
  }

  subscribe(table: string, id: string, callback: (entity: any) => void): () => void {
    const key = `${table}:${id}`;
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)!.add(callback);

    return () => {
      this.subscriptions.get(key)?.delete(callback);
      if (this.subscriptions.get(key)?.size === 0) {
        this.subscriptions.delete(key);
      }
    };
  }

  subscribeToTable(table: string, callback: (entities: any[]) => void): () => void {
    if (!this.tableSubscriptions.has(table)) {
      this.tableSubscriptions.set(table, new Set());
    }
    this.tableSubscriptions.get(table)!.add(callback);

    return () => {
      this.tableSubscriptions.get(table)?.delete(callback);
      if (this.tableSubscriptions.get(table)?.size === 0) {
        this.tableSubscriptions.delete(table);
      }
    };
  }

  clear(): void {
    this.entities = {};
    this.stats = { totalEntities: 0, cacheHits: 0, totalAccesses: 0 };
    this.persistToStorage();
    
    // Notify all subscribers of clearing
    this.subscriptions.forEach((callbacks, key) => {
      callbacks.forEach(callback => callback(undefined));
    });
    
    this.tableSubscriptions.forEach((callbacks, table) => {
      callbacks.forEach(callback => callback([]));
    });
  }

  destroy(): void {
    this.clear();
    this.subscriptions.clear();
    this.tableSubscriptions.clear();
    
    // Clear localStorage if persistence was enabled
    if (this.options.persistence && typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('gdpr_simple_state');
    }
    
    console.log('SimpleStateManager destroyed');
  }

  getStats(): import('./types').StateManagerStats {
    const entitiesByTable: Record<string, number> = {};
    Object.entries(this.entities).forEach(([table, entities]) => {
      entitiesByTable[table] = Object.keys(entities).length;
    });

    return {
      totalEntities: this.stats.totalEntities,
      entitiesByTable,
      memoryUsage: this.estimateMemoryUsage(),
      cacheHitRate: this.stats.totalAccesses > 0 
        ? this.stats.cacheHits / this.stats.totalAccesses 
        : 0,
      lastUpdated: Date.now()
    };
  }

  // Helper methods
  private notifyEntitySubscribers(table: string, id: string, entity: any): void {
    const key = `${table}:${id}`;
    this.subscriptions.get(key)?.forEach(callback => {
      try {
        callback(entity);
      } catch (error) {
        console.error('SimpleStateManager: Error in entity subscriber:', error);
      }
    });
  }

  private notifyTableSubscribers(table: string): void {
    const entities = Object.values(this.entities[table] || {});
    this.tableSubscriptions.get(table)?.forEach(callback => {
      try {
        callback(entities);
      } catch (error) {
        console.error('SimpleStateManager: Error in table subscriber:', error);
      }
    });
  }

  private countTotalEntities(): number {
    return Object.values(this.entities).reduce(
      (total, table) => total + Object.keys(table).length, 
      0
    );
  }

  private estimateMemoryUsage(): number {
    try {
      return JSON.stringify(this.entities).length * 2; // Rough estimate
    } catch {
      return 0;
    }
  }

  private enforceMaxCacheSize(): void {
    const totalEntities = this.countTotalEntities();
    
    if (totalEntities > this.options.maxCacheSize) {
      // Simple LRU-like eviction: remove oldest entities
      const allEntities: Array<{ table: string; id: string; lastUpdated: number }> = [];
      
      Object.entries(this.entities).forEach(([table, entities]) => {
        Object.entries(entities).forEach(([id, entity]) => {
          allEntities.push({
            table,
            id,
            lastUpdated: entity._lastUpdated || 0
          });
        });
      });
      
      // Sort by last updated (oldest first)
      allEntities.sort((a, b) => a.lastUpdated - b.lastUpdated);
      
      // Remove oldest entities until we're under the limit
      const toRemove = totalEntities - this.options.maxCacheSize;
      for (let i = 0; i < toRemove; i++) {
        const { table, id } = allEntities[i];
        delete this.entities[table][id];
        this.stats.totalEntities--;
      }
      
      console.log(`SimpleStateManager: Evicted ${toRemove} entities to stay under cache limit`);
    }
  }

  private persistToStorage(): void {
    if (this.options.persistence && typeof window !== 'undefined' && window.localStorage) {
      try {
        const data = {
          entities: this.entities,
          timestamp: Date.now()
        };
        localStorage.setItem('gdpr_simple_state', JSON.stringify(data));
      } catch (error) {
        console.warn('SimpleStateManager: Failed to persist to localStorage:', error);
      }
    }
  }
}