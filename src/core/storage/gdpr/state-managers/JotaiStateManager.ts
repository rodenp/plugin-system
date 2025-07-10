// Jotai State Manager Implementation - Phase 2
// Atomic state management using Jotai atoms

import { atom, getDefaultStore, createStore } from 'jotai';
import {
  StateManager,
  StateManagerStats,
  EntityUpdate,
  EntityRemoval
} from '../types';

interface JotaiConfig {
  customStore?: any;
  atomGC?: boolean; // Atom garbage collection
  devtools?: boolean;
}

export class JotaiStateManager implements StateManager {
  private store: any;
  private entityAtoms = new Map<string, any>();
  private tableAtoms = new Map<string, any>();
  private statsAtom: any;
  private config: JotaiConfig;

  constructor(config?: JotaiConfig) {
    this.config = {
      atomGC: true,
      devtools: false,
      ...config
    };
    
    // Use custom store or default
    this.store = this.config.customStore || getDefaultStore();
    
    // Create stats atom
    this.statsAtom = atom({
      totalEntities: 0,
      cacheHits: 0,
      totalAccesses: 0,
      lastUpdated: Date.now()
    });
    
    // Initialize stats
    this.store.set(this.statsAtom, {
      totalEntities: 0,
      cacheHits: 0,
      totalAccesses: 0,
      lastUpdated: Date.now()
    });
    
    console.log('JotaiStateManager: Initialized with atomic state management');
  }

  async initialize(config?: any): Promise<void> {
    console.log('JotaiStateManager: Initialization complete');
    
    if (this.config.devtools && typeof window !== 'undefined') {
      // Could integrate with Jotai DevTools
      console.log('JotaiStateManager: DevTools integration available');
    }
  }

  // Create or get table atom
  private createTableAtom(table: string) {
    if (!this.tableAtoms.has(table)) {
      const tableAtom = atom({} as Record<string, any>);
      this.tableAtoms.set(table, tableAtom);
    }
    return this.tableAtoms.get(table);
  }

  // Create or get entity atom
  private getEntityAtom(table: string, id: string) {
    const key = `${table}:${id}`;
    
    if (!this.entityAtoms.has(key)) {
      const tableAtom = this.createTableAtom(table);
      
      // Read-only atom that gets entity from table
      const readAtom = atom((get) => {
        const tableData = get(tableAtom);
        return tableData[id];
      });
      
      // Write atom that updates entity in table
      const writeAtom = atom(
        (get) => get(readAtom),
        (get, set, update: any) => {
          const tableData = get(tableAtom);
          const wasNew = !tableData[id];
          
          const newTableData = {
            ...tableData,
            [id]: {
              ...update,
              _lastUpdated: Date.now(),
              _jotaiManaged: true
            }
          };
          
          set(tableAtom, newTableData);
          
          // Update stats
          if (wasNew) {
            const currentStats = get(this.statsAtom);
            set(this.statsAtom, {
              ...currentStats,
              totalEntities: currentStats.totalEntities + 1,
              lastUpdated: Date.now()
            });
          }
        }
      );
      
      this.entityAtoms.set(key, writeAtom);
    }
    
    return this.entityAtoms.get(key);
  }

  getEntity<T>(table: string, id: string): T | undefined {
    const entityAtom = this.getEntityAtom(table, id);
    const entity = this.store.get(entityAtom);
    
    // Update access statistics
    const currentStats = this.store.get(this.statsAtom);
    this.store.set(this.statsAtom, {
      ...currentStats,
      totalAccesses: currentStats.totalAccesses + 1,
      cacheHits: entity ? currentStats.cacheHits + 1 : currentStats.cacheHits
    });
    
    return entity;
  }

  setEntity<T>(table: string, id: string, data: T): void {
    const entityAtom = this.getEntityAtom(table, id);
    this.store.set(entityAtom, data);
  }

  removeEntity(table: string, id: string): void {
    const tableAtom = this.createTableAtom(table);
    const tableData = this.store.get(tableAtom);
    
    if (tableData[id]) {
      const newTableData = { ...tableData };
      delete newTableData[id];
      this.store.set(tableAtom, newTableData);
      
      // Update stats
      const currentStats = this.store.get(this.statsAtom);
      this.store.set(this.statsAtom, {
        ...currentStats,
        totalEntities: currentStats.totalEntities - 1,
        lastUpdated: Date.now()
      });
      
      // Clean up entity atom if garbage collection is enabled
      if (this.config.atomGC) {
        const key = `${table}:${id}`;
        this.entityAtoms.delete(key);
      }
    }
  }

  batchUpdate(updates: EntityUpdate[]): void {
    // Group updates by table for efficiency
    const updatesByTable = updates.reduce((acc, update) => {
      if (!acc[update.table]) acc[update.table] = [];
      acc[update.table].push(update);
      return acc;
    }, {} as Record<string, EntityUpdate[]>);

    let newEntityCount = 0;

    Object.entries(updatesByTable).forEach(([table, tableUpdates]) => {
      const tableAtom = this.createTableAtom(table);
      const currentData = this.store.get(tableAtom);
      const newData = { ...currentData };
      
      tableUpdates.forEach(({ id, data }) => {
        const wasNew = !newData[id];
        if (wasNew) newEntityCount++;
        
        newData[id] = { 
          ...data, 
          _lastUpdated: Date.now(),
          _batchUpdated: true 
        };
      });
      
      this.store.set(tableAtom, newData);
    });

    // Update stats
    const currentStats = this.store.get(this.statsAtom);
    this.store.set(this.statsAtom, {
      ...currentStats,
      totalEntities: currentStats.totalEntities + newEntityCount,
      lastUpdated: Date.now()
    });
  }

  batchRemove(removals: EntityRemoval[]): void {
    // Group removals by table
    const removalsByTable = removals.reduce((acc, removal) => {
      if (!acc[removal.table]) acc[removal.table] = [];
      acc[removal.table].push(removal);
      return acc;
    }, {} as Record<string, EntityRemoval[]>);

    let removedCount = 0;

    Object.entries(removalsByTable).forEach(([table, tableRemovals]) => {
      const tableAtom = this.createTableAtom(table);
      const currentData = this.store.get(tableAtom);
      const newData = { ...currentData };
      
      tableRemovals.forEach(({ id }) => {
        if (newData[id]) {
          delete newData[id];
          removedCount++;
          
          // Clean up entity atom if garbage collection is enabled
          if (this.config.atomGC) {
            const key = `${table}:${id}`;
            this.entityAtoms.delete(key);
          }
        }
      });
      
      this.store.set(tableAtom, newData);
    });

    // Update stats
    const currentStats = this.store.get(this.statsAtom);
    this.store.set(this.statsAtom, {
      ...currentStats,
      totalEntities: currentStats.totalEntities - removedCount,
      lastUpdated: Date.now()
    });
  }

  getEntitiesWhere<T>(table: string, predicate: (entity: T) => boolean): T[] {
    const tableAtom = this.createTableAtom(table);
    const tableData = this.store.get(tableAtom);
    return Object.values(tableData).filter(predicate);
  }

  getAllEntities<T>(table: string): T[] {
    const tableAtom = this.createTableAtom(table);
    const tableData = this.store.get(tableAtom);
    return Object.values(tableData);
  }

  subscribe(table: string, id: string, callback: (entity: any) => void): () => void {
    const entityAtom = this.getEntityAtom(table, id);
    return this.store.sub(entityAtom, () => {
      const entity = this.store.get(entityAtom);
      callback(entity);
    });
  }

  subscribeToTable(table: string, callback: (entities: any[]) => void): () => void {
    const tableAtom = this.createTableAtom(table);
    return this.store.sub(tableAtom, () => {
      const tableData = this.store.get(tableAtom);
      callback(Object.values(tableData));
    });
  }

  clear(): void {
    // Clear all table atoms
    this.tableAtoms.forEach(tableAtom => {
      this.store.set(tableAtom, {});
    });
    
    // Clear entity atoms if garbage collection is disabled
    if (!this.config.atomGC) {
      this.entityAtoms.clear();
    }
    
    // Reset stats
    this.store.set(this.statsAtom, {
      totalEntities: 0,
      cacheHits: 0,
      totalAccesses: 0,
      lastUpdated: Date.now()
    });
    
    console.log('JotaiStateManager: All atoms cleared');
  }

  destroy(): void {
    this.clear();
    this.entityAtoms.clear();
    this.tableAtoms.clear();
    console.log('JotaiStateManager: Destroyed');
  }

  getStats(): StateManagerStats {
    const stats = this.store.get(this.statsAtom);
    const entitiesByTable: Record<string, number> = {};

    this.tableAtoms.forEach((tableAtom, table) => {
      const tableData = this.store.get(tableAtom);
      entitiesByTable[table] = Object.keys(tableData).length;
    });

    return {
      totalEntities: stats.totalEntities,
      entitiesByTable,
      memoryUsage: this.estimateMemoryUsage(),
      cacheHitRate: stats.totalAccesses > 0 
        ? stats.cacheHits / stats.totalAccesses 
        : 0,
      lastUpdated: stats.lastUpdated
    };
  }

  // Jotai-specific methods for React integration

  // Get entity atom for use with useAtom hook
  createAtomSelector<T>(table: string, id: string) {
    return this.getEntityAtom(table, id);
  }

  // Get table atom for use with useAtom hook
  createTableAtomSelector(table: string) {
    return this.createTableAtom(table);
  }

  // Create derived atom for filtered entities
  createFilteredTableAtom<T>(table: string, predicate: (entity: T) => boolean) {
    const tableAtom = this.createTableAtom(table);
    return atom((get) => {
      const tableData = get(tableAtom);
      return Object.values(tableData).filter(predicate);
    });
  }

  // Create computed atom based on multiple tables
  createComputedAtom<T>(computer: (get: any) => T) {
    return atom(computer);
  }

  // Create async atom for complex operations
  createAsyncAtom<T>(asyncOperation: (get: any) => Promise<T>) {
    return atom(asyncOperation);
  }

  // Get the Jotai store instance
  getStore() {
    return this.store;
  }

  // Performance and debugging methods

  getPerformanceMetrics() {
    const stats = this.store.get(this.statsAtom);
    return {
      atomCount: this.entityAtoms.size + this.tableAtoms.size,
      entityAtoms: this.entityAtoms.size,
      tableAtoms: this.tableAtoms.size,
      totalEntities: stats.totalEntities,
      cacheHitRate: stats.totalAccesses > 0 
        ? stats.cacheHits / stats.totalAccesses 
        : 0,
      memoryUsage: this.estimateMemoryUsage(),
      lastUpdated: stats.lastUpdated
    };
  }

  debugState() {
    const stats = this.store.get(this.statsAtom);
    const tableInfo: Record<string, number> = {};
    
    this.tableAtoms.forEach((tableAtom, table) => {
      const tableData = this.store.get(tableAtom);
      tableInfo[table] = Object.keys(tableData).length;
    });
    
    console.log('JotaiStateManager Debug State:', {
      atomCounts: {
        entity: this.entityAtoms.size,
        table: this.tableAtoms.size,
        total: this.entityAtoms.size + this.tableAtoms.size
      },
      tableInfo,
      stats,
      config: this.config
    });
    
    return {
      atomCounts: {
        entity: this.entityAtoms.size,
        table: this.tableAtoms.size
      },
      tableInfo,
      stats
    };
  }

  debugTable(table: string) {
    const tableAtom = this.createTableAtom(table);
    const tableData = this.store.get(tableAtom);
    
    console.log(`JotaiStateManager Debug Table [${table}]:`, {
      entityCount: Object.keys(tableData).length,
      entityIds: Object.keys(tableData),
      hasAtom: this.tableAtoms.has(table),
      sampleEntity: Object.values(tableData)[0]
    });
    
    return tableData;
  }

  // Atom management utilities

  // Force garbage collection of unused entity atoms
  garbageCollectAtoms(): number {
    const activeEntities = new Set<string>();
    
    // Collect all active entity IDs from table atoms
    this.tableAtoms.forEach((tableAtom, table) => {
      const tableData = this.store.get(tableAtom);
      Object.keys(tableData).forEach(id => {
        activeEntities.add(`${table}:${id}`);
      });
    });
    
    // Remove entity atoms that are no longer active
    let removedCount = 0;
    for (const [key] of this.entityAtoms) {
      if (!activeEntities.has(key)) {
        this.entityAtoms.delete(key);
        removedCount++;
      }
    }
    
    console.log(`JotaiStateManager: Garbage collected ${removedCount} unused atoms`);
    return removedCount;
  }

  // Get atom usage statistics
  getAtomUsage() {
    const usage = {
      entityAtoms: this.entityAtoms.size,
      tableAtoms: this.tableAtoms.size,
      total: this.entityAtoms.size + this.tableAtoms.size,
      byTable: {} as Record<string, number>
    };
    
    // Count entity atoms by table
    for (const [key] of this.entityAtoms) {
      const [table] = key.split(':');
      usage.byTable[table] = (usage.byTable[table] || 0) + 1;
    }
    
    return usage;
  }

  // Batch atom operations for performance
  batchAtomOperations(operations: (() => void)[]): void {
    // Jotai batches operations automatically, but we can still
    // provide explicit batching for complex operations
    operations.forEach(op => op());
  }

  // Subscribe to atom creation/destruction (useful for monitoring)
  subscribeToAtomLifecycle(callback: (event: 'created' | 'destroyed', type: 'entity' | 'table', key: string) => void): () => void {
    // This would need custom implementation to track atom lifecycle
    // For now, return a no-op unsubscribe function
    console.log('JotaiStateManager: Atom lifecycle monitoring not yet implemented');
    return () => {};
  }

  // Helper methods
  private estimateMemoryUsage(): number {
    try {
      let totalSize = 0;
      
      this.tableAtoms.forEach(tableAtom => {
        const tableData = this.store.get(tableAtom);
        totalSize += JSON.stringify(tableData).length * 2;
      });
      
      return totalSize;
    } catch {
      return 0;
    }
  }

  // Export state for persistence
  exportState() {
    const state: Record<string, any> = {};
    
    this.tableAtoms.forEach((tableAtom, table) => {
      state[table] = this.store.get(tableAtom);
    });
    
    return {
      entities: state,
      stats: this.store.get(this.statsAtom),
      timestamp: Date.now()
    };
  }

  // Import state from persistence
  importState(state: { entities: Record<string, any>; stats?: any }) {
    Object.entries(state.entities).forEach(([table, tableData]) => {
      const tableAtom = this.createTableAtom(table);
      this.store.set(tableAtom, tableData);
    });
    
    if (state.stats) {
      this.store.set(this.statsAtom, {
        ...state.stats,
        lastUpdated: Date.now()
      });
    }
    
    console.log('JotaiStateManager: State imported successfully');
  }
}