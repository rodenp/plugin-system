// Zustand State Manager Implementation - Phase 2
// High-performance state manager using Zustand store

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  StateManager,
  StateManagerStats,
  EntityUpdate,
  EntityRemoval
} from '../types';

interface ZustandStoreState {
  entities: Record<string, Record<string, any>>;
  stats: {
    totalEntities: number;
    cacheHits: number;
    totalAccesses: number;
    lastUpdated: number;
  };
  
  // Internal methods
  _setEntity: (table: string, id: string, data: any) => void;
  _removeEntity: (table: string, id: string) => void;
  _batchUpdate: (updates: EntityUpdate[]) => void;
  _batchRemove: (removals: EntityRemoval[]) => void;
  _incrementAccess: (hit: boolean) => void;
  _countEntities: (entities: Record<string, Record<string, any>>) => number;
}

export class ZustandStateManager implements StateManager {
  private store: any;
  private subscriptions = new Map<string, Set<() => void>>();

  constructor() {
    this.store = create<ZustandStoreState>()(
      subscribeWithSelector((set, get) => ({
        entities: {} as Record<string, Record<string, any>>,
        stats: {
          totalEntities: 0,
          cacheHits: 0,
          totalAccesses: 0,
          lastUpdated: Date.now()
        },
        
        // Internal state management methods
        _setEntity: (table: string, id: string, data: any) => set(state => {
          const wasNew = !state.entities[table]?.[id];
          const newEntities = {
            ...state.entities,
            [table]: {
              ...state.entities[table],
              [id]: { 
                ...data, 
                _lastUpdated: Date.now(),
                _zustandManaged: true 
              }
            }
          };
          
          return {
            entities: newEntities,
            stats: {
              ...state.stats,
              totalEntities: wasNew 
                ? state.stats.totalEntities + 1 
                : state.stats.totalEntities,
              lastUpdated: Date.now()
            }
          };
        }),
        
        _removeEntity: (table: string, id: string) => set(state => {
          if (!state.entities[table]?.[id]) {
            return state; // No change if entity doesn't exist
          }
          
          const newTable = { ...state.entities[table] };
          delete newTable[id];
          
          const newEntities = { ...state.entities, [table]: newTable };
          
          // Clean up empty tables
          if (Object.keys(newTable).length === 0) {
            delete newEntities[table];
          }
          
          return {
            entities: newEntities,
            stats: {
              ...state.stats,
              totalEntities: state.stats.totalEntities - 1,
              lastUpdated: Date.now()
            }
          };
        }),
        
        _batchUpdate: (updates: EntityUpdate[]) => set(state => {
          const newEntities = { ...state.entities };
          let newEntityCount = 0;
          
          updates.forEach(({ table, id, data }) => {
            if (!newEntities[table]) {
              newEntities[table] = {};
            }
            
            const wasNew = !newEntities[table][id];
            if (wasNew) newEntityCount++;
            
            newEntities[table] = {
              ...newEntities[table],
              [id]: { 
                ...data, 
                _lastUpdated: Date.now(),
                _batchUpdated: true 
              }
            };
          });
          
          return {
            entities: newEntities,
            stats: {
              ...state.stats,
              totalEntities: state.stats.totalEntities + newEntityCount,
              lastUpdated: Date.now()
            }
          };
        }),
        
        _batchRemove: (removals: EntityRemoval[]) => set(state => {
          const newEntities = { ...state.entities };
          let removedCount = 0;
          
          removals.forEach(({ table, id }) => {
            if (newEntities[table]?.[id]) {
              newEntities[table] = { ...newEntities[table] };
              delete newEntities[table][id];
              removedCount++;
              
              // Clean up empty tables
              if (Object.keys(newEntities[table]).length === 0) {
                delete newEntities[table];
              }
            }
          });
          
          return {
            entities: newEntities,
            stats: {
              ...state.stats,
              totalEntities: state.stats.totalEntities - removedCount,
              lastUpdated: Date.now()
            }
          };
        }),
        
        _incrementAccess: (hit: boolean) => set(state => ({
          stats: {
            ...state.stats,
            totalAccesses: state.stats.totalAccesses + 1,
            cacheHits: hit ? state.stats.cacheHits + 1 : state.stats.cacheHits
          }
        })),
        
        _countEntities: (entities: Record<string, Record<string, any>>) => {
          return Object.values(entities).reduce(
            (total, table) => total + Object.keys(table).length, 
            0
          );
        }
      }))
    );
    
    console.log('ZustandStateManager: Initialized with reactive store');
  }

  async initialize(config?: any): Promise<void> {
    console.log('ZustandStateManager: Initialization complete');
    
    // Set up any configuration-specific behavior
    if (config?.devtools && typeof window !== 'undefined') {
      // Could integrate with Redux DevTools here
      console.log('ZustandStateManager: DevTools integration available');
    }
  }

  getEntity<T>(table: string, id: string): T | undefined {
    const state = this.store.getState();
    const entity = state.entities[table]?.[id];
    
    // Update access statistics
    state._incrementAccess(!!entity);
    
    return entity;
  }

  setEntity<T>(table: string, id: string, data: T): void {
    const state = this.store.getState();
    state._setEntity(table, id, data);
  }

  removeEntity(table: string, id: string): void {
    const state = this.store.getState();
    state._removeEntity(table, id);
  }

  batchUpdate(updates: EntityUpdate[]): void {
    const state = this.store.getState();
    state._batchUpdate(updates);
  }

  batchRemove(removals: EntityRemoval[]): void {
    const state = this.store.getState();
    state._batchRemove(removals);
  }

  getEntitiesWhere<T>(table: string, predicate: (entity: T) => boolean): T[] {
    const state = this.store.getState();
    const entities = state.entities[table] || {};
    return Object.values(entities).filter(predicate);
  }

  getAllEntities<T>(table: string): T[] {
    const state = this.store.getState();
    return Object.values(state.entities[table] || {});
  }

  subscribe(table: string, id: string, callback: (entity: any) => void): () => void {
    // Use Zustand's built-in subscription with selector
    return this.store.subscribe(
      (state: ZustandStoreState) => state.entities[table]?.[id],
      callback,
      {
        equalityFn: (a: any, b: any) => {
          // Deep comparison for entity changes
          if (a === b) return true;
          if (!a || !b) return false;
          return JSON.stringify(a) === JSON.stringify(b);
        }
      }
    );
  }

  subscribeToTable(table: string, callback: (entities: any[]) => void): () => void {
    return this.store.subscribe(
      (state: ZustandStoreState) => Object.values(state.entities[table] || {}),
      callback,
      {
        equalityFn: (a: any[], b: any[]) => {
          if (a.length !== b.length) return false;
          return JSON.stringify(a) === JSON.stringify(b);
        }
      }
    );
  }

  clear(): void {
    this.store.setState({
      entities: {},
      stats: {
        totalEntities: 0,
        cacheHits: 0,
        totalAccesses: 0,
        lastUpdated: Date.now()
      }
    });
    console.log('ZustandStateManager: Store cleared');
  }

  destroy(): void {
    this.subscriptions.clear();
    this.clear();
    console.log('ZustandStateManager: Destroyed');
  }

  getStats(): StateManagerStats {
    const state = this.store.getState();
    const entitiesByTable: Record<string, number> = {};
    
    Object.entries(state.entities).forEach(([table, entities]) => {
      entitiesByTable[table] = Object.keys(entities).length;
    });

    return {
      totalEntities: state.stats.totalEntities,
      entitiesByTable,
      memoryUsage: this.estimateMemoryUsage(),
      cacheHitRate: state.stats.totalAccesses > 0 
        ? state.stats.cacheHits / state.stats.totalAccesses 
        : 0,
      lastUpdated: state.stats.lastUpdated
    };
  }

  // React integration methods
  createSelector<T>(selector: (state: ZustandStoreState) => T) {
    return () => this.store(selector);
  }

  // Get the raw store for advanced React patterns
  getStore() {
    return this.store;
  }

  // Subscribe to specific entity changes with React hooks
  createEntitySelector<T>(table: string, id: string) {
    return (state: ZustandStoreState) => state.entities[table]?.[id] as T;
  }

  // Subscribe to table changes with React hooks  
  createTableSelector<T>(table: string) {
    return (state: ZustandStoreState) => Object.values(state.entities[table] || {}) as T[];
  }

  // Subscribe to filtered entities with React hooks
  createFilteredTableSelector<T>(table: string, predicate: (entity: T) => boolean) {
    return (state: ZustandStoreState) => {
      const entities = state.entities[table] || {};
      return Object.values(entities).filter(predicate) as T[];
    };
  }

  // Advanced: Subscribe to computed values
  createComputedSelector<T>(computer: (state: ZustandStoreState) => T) {
    return (state: ZustandStoreState) => computer(state);
  }

  // Performance monitoring
  getPerformanceMetrics() {
    const state = this.store.getState();
    return {
      storeSize: Object.keys(state.entities).length,
      totalEntities: state.stats.totalEntities,
      cacheHitRate: state.stats.totalAccesses > 0 
        ? state.stats.cacheHits / state.stats.totalAccesses 
        : 0,
      memoryUsage: this.estimateMemoryUsage(),
      lastUpdated: state.stats.lastUpdated
    };
  }

  // Debug helpers
  debugState() {
    const state = this.store.getState();
    console.log('ZustandStateManager Debug State:', {
      tableCount: Object.keys(state.entities).length,
      totalEntities: state.stats.totalEntities,
      tables: Object.keys(state.entities),
      stats: state.stats
    });
    return state;
  }

  debugTable(table: string) {
    const state = this.store.getState();
    const tableData = state.entities[table] || {};
    console.log(`ZustandStateManager Debug Table [${table}]:`, {
      entityCount: Object.keys(tableData).length,
      entityIds: Object.keys(tableData),
      sampleEntity: Object.values(tableData)[0]
    });
    return tableData;
  }

  // Helper methods
  private estimateMemoryUsage(): number {
    try {
      const state = this.store.getState();
      return JSON.stringify(state.entities).length * 2; // Rough estimate in bytes
    } catch {
      return 0;
    }
  }

  // Zustand-specific features
  
  // Enable time travel debugging (useful for development)
  enableTimeTravel() {
    if (typeof window !== 'undefined') {
      (window as any).__ZUSTAND_GDPR_STORE__ = this.store;
      console.log('ZustandStateManager: Time travel debugging enabled. Access via window.__ZUSTAND_GDPR_STORE__');
    }
  }

  // Subscribe to all state changes (useful for debugging)
  subscribeToAllChanges(callback: (state: ZustandStoreState) => void): () => void {
    return this.store.subscribe(callback);
  }

  // Get current state snapshot
  getSnapshot(): ZustandStoreState {
    return this.store.getState();
  }

  // Batch multiple operations for performance
  batch(operations: (() => void)[]): void {
    // Zustand automatically batches state updates in React
    operations.forEach(op => op());
  }

  // Reset to a specific state (useful for testing)
  restoreState(state: Partial<ZustandStoreState>): void {
    this.store.setState(state);
  }
}