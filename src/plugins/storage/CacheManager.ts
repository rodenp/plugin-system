// Cache Manager - Multi-tier caching system for performance optimization
import {
  CacheConfig,
  StorageEntity,
  StorageError,
  CacheEntry,
  CacheStats,
  CacheLayer,
  EvictionPolicy
} from './types';

export class CacheManager {
  private config: CacheConfig;
  private layers: Map<string, CacheLayer> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    hitRatio: 0,
    averageSetTime: 0,
    averageGetTime: 0,
    memoryUsage: 0
  };
  private isInitialized = false;
  private cleanupTimer?: NodeJS.Timeout;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: CacheConfig) {
    this.config = this.validateConfig(config);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('CacheManager already initialized');
      return;
    }

    try {
      console.log('📏 Initializing CacheManager...');
      
      // Initialize cache layers
      await this.initializeLayers();
      
      // Set up cleanup timer
      this.setupCleanupTimer();
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring();
      
      this.isInitialized = true;
      console.log('✅ CacheManager initialized');
      
    } catch (error) {
      throw new StorageError(
        `Failed to initialize CacheManager: ${(error as Error).message}`,
        'INITIALIZATION_ERROR',
        { config: this.sanitizeConfig() }
      );
    }
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      console.log('📏 Destroying CacheManager...');
      
      // Clear cleanup timer
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = undefined;
      }
      
      // Clear all cache layers
      for (const layer of this.layers.values()) {
        await this.clearLayer(layer);
      }
      
      this.layers.clear();
      this.eventListeners.clear();
      
      this.isInitialized = false;
      console.log('✅ CacheManager destroyed');
      
    } catch (error) {
      console.error('❌ CacheManager destruction failed:', error);
      throw new StorageError(
        `Failed to destroy CacheManager: ${(error as Error).message}`,
        'DESTRUCTION_ERROR'
      );
    }
  }

  // Core cache operations
  async get<T>(table: string, id: string): Promise<T | null> {
    this.validateInitialized();
    
    const startTime = Date.now();
    const key = this.generateKey(table, id);
    
    try {
      // Check each layer in order (fastest to slowest)
      for (const [layerName, layer] of this.layers) {
        const entry = await this.getFromLayer<T>(layer, key);
        
        if (entry && this.isValidEntry(entry)) {
          // Cache hit - update access time and promote to faster layers
          entry.accessed = new Date();
          entry.accessCount = (entry.accessCount || 0) + 1;
          
          await this.promoteEntry(key, entry, layerName);
          
          this.recordHit(Date.now() - startTime);
          this.emit('cache_hit', { table, id, layer: layerName });
          
          return entry.data;
        }
      }
      
      // Cache miss
      this.recordMiss(Date.now() - startTime);
      this.emit('cache_miss', { table, id });
      
      return null;
      
    } catch (error) {
      console.warn('Cache get operation failed:', error);
      this.recordMiss(Date.now() - startTime);
      return null;
    }
  }

  async set<T>(table: string, id: string, data: T, options?: {
    ttl?: number;
    layer?: string;
    tags?: string[];
  }): Promise<void> {
    this.validateInitialized();
    
    const startTime = Date.now();
    const key = this.generateKey(table, id);
    
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: new Date(),
        ttl: options?.ttl || this.config.ttl,
        accessed: new Date(),
        accessCount: 1,
        metadata: {
          table,
          entityId: id,
          tags: options?.tags || [],
          size: this.estimateSize(data)
        }
      };
      
      // Set in appropriate layer(s)
      const targetLayer = options?.layer || 'memory';
      const layer = this.layers.get(targetLayer);
      
      if (!layer) {
        throw new Error(`Cache layer not found: ${targetLayer}`);
      }
      
      await this.setInLayer(layer, key, entry);
      
      this.recordSet(Date.now() - startTime);
      this.emit('cache_set', { table, id, layer: targetLayer, size: entry.metadata.size });
      
    } catch (error) {
      console.warn('Cache set operation failed:', error);
      // Don't throw - cache failures shouldn't break main operations
    }
  }

  async delete(table: string, id: string): Promise<void> {
    this.validateInitialized();
    
    const key = this.generateKey(table, id);
    
    try {
      // Remove from all layers
      for (const layer of this.layers.values()) {
        await this.deleteFromLayer(layer, key);
      }
      
      this.stats.deletes++;
      this.emit('cache_delete', { table, id });
      
    } catch (error) {
      console.warn('Cache delete operation failed:', error);
    }
  }

  async clearTable(table: string): Promise<void> {
    this.validateInitialized();
    
    try {
      const pattern = `${table}:*`;
      
      for (const layer of this.layers.values()) {
        await this.clearPattern(layer, pattern);
      }
      
      this.emit('cache_clear_table', { table });
      
    } catch (error) {
      console.warn('Cache clear table operation failed:', error);
    }
  }

  async clearAll(): Promise<void> {
    this.validateInitialized();
    
    try {
      for (const layer of this.layers.values()) {
        await this.clearLayer(layer);
      }
      
      // Reset stats
      this.resetStats();
      
      this.emit('cache_clear_all', {});
      
    } catch (error) {
      console.warn('Cache clear all operation failed:', error);
    }
  }

  // Query caching
  async getQuery<T>(queryKey: string): Promise<T | null> {
    return this.get<T>('queries', queryKey);
  }

  async setQuery<T>(queryKey: string, result: T, ttl?: number): Promise<void> {
    await this.set('queries', queryKey, result, { ttl, tags: ['query'] });
  }

  async invalidateQueries(tags: string[]): Promise<void> {
    try {
      for (const layer of this.layers.values()) {
        await this.invalidateByTags(layer, tags);
      }
      
      this.emit('cache_invalidate_queries', { tags });
      
    } catch (error) {
      console.warn('Query invalidation failed:', error);
    }
  }

  // Cache layer management
  private async initializeLayers(): Promise<void> {
    // Memory layer (fastest)
    if (this.config.layers?.memory?.enabled !== false) {
      const memoryLayer: CacheLayer = {
        name: 'memory',
        type: 'memory',
        enabled: true,
        maxSize: this.config.layers?.memory?.maxSize || 1000,
        ttl: this.config.layers?.memory?.ttl || this.config.ttl,
        evictionPolicy: this.config.layers?.memory?.evictionPolicy || 'lru',
        data: new Map(),
        stats: { size: 0, hits: 0, misses: 0, evictions: 0 }
      };
      
      this.layers.set('memory', memoryLayer);
    }
    
    // Browser storage layer (persistent but slower)
    if (this.config.layers?.storage?.enabled && typeof window !== 'undefined') {
      const storageLayer: CacheLayer = {
        name: 'storage',
        type: 'storage',
        enabled: true,
        maxSize: this.config.layers?.storage?.maxSize || 500,
        ttl: this.config.layers?.storage?.ttl || this.config.ttl * 2,
        evictionPolicy: this.config.layers?.storage?.evictionPolicy || 'lru',
        data: new Map(),
        stats: { size: 0, hits: 0, misses: 0, evictions: 0 }
      };
      
      await this.loadStorageLayer(storageLayer);
      this.layers.set('storage', storageLayer);
    }
    
    console.log(`📏 Initialized ${this.layers.size} cache layers`);
  }

  private async getFromLayer<T>(layer: CacheLayer, key: string): Promise<CacheEntry<T> | null> {
    try {
      if (layer.type === 'memory') {
        const entry = layer.data.get(key) as CacheEntry<T> | undefined;
        return entry || null;
      } else if (layer.type === 'storage') {
        const stored = localStorage.getItem(`cache:${key}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`Failed to get from ${layer.name} layer:`, error);
      return null;
    }
  }

  private async setInLayer<T>(layer: CacheLayer, key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      // Check if eviction is needed
      if (layer.data.size >= layer.maxSize) {
        await this.evictFromLayer(layer, 1);
      }
      
      if (layer.type === 'memory') {
        layer.data.set(key, entry);
      } else if (layer.type === 'storage') {
        localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
        layer.data.set(key, { ...entry, data: null }); // Store metadata only
      }
      
      layer.stats.size++;
      
    } catch (error) {
      console.warn(`Failed to set in ${layer.name} layer:`, error);
    }
  }

  private async deleteFromLayer(layer: CacheLayer, key: string): Promise<void> {
    try {
      if (layer.type === 'memory') {
        layer.data.delete(key);
      } else if (layer.type === 'storage') {
        localStorage.removeItem(`cache:${key}`);
        layer.data.delete(key);
      }
      
      layer.stats.size = Math.max(0, layer.stats.size - 1);
      
    } catch (error) {
      console.warn(`Failed to delete from ${layer.name} layer:`, error);
    }
  }

  private async clearLayer(layer: CacheLayer): Promise<void> {
    try {
      if (layer.type === 'memory') {
        layer.data.clear();
      } else if (layer.type === 'storage') {
        // Clear storage layer entries
        const keys = Array.from(layer.data.keys());
        for (const key of keys) {
          localStorage.removeItem(`cache:${key}`);
        }
        layer.data.clear();
      }
      
      layer.stats = { size: 0, hits: 0, misses: 0, evictions: 0 };
      
    } catch (error) {
      console.warn(`Failed to clear ${layer.name} layer:`, error);
    }
  }

  private async clearPattern(layer: CacheLayer, pattern: string): Promise<void> {
    try {
      const regex = new RegExp(pattern.replace('*', '.*'));
      const keysToDelete: string[] = [];
      
      for (const key of layer.data.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }
      
      for (const key of keysToDelete) {
        await this.deleteFromLayer(layer, key);
      }
      
    } catch (error) {
      console.warn(`Failed to clear pattern ${pattern} from ${layer.name} layer:`, error);
    }
  }

  // Eviction strategies
  private async evictFromLayer(layer: CacheLayer, count: number): Promise<void> {
    try {
      const entries = Array.from(layer.data.entries());
      let toEvict: string[] = [];
      
      switch (layer.evictionPolicy) {
        case 'lru': // Least Recently Used
          toEvict = entries
            .sort(([, a], [, b]) => 
              (a.accessed?.getTime() || 0) - (b.accessed?.getTime() || 0)
            )
            .slice(0, count)
            .map(([key]) => key);
          break;
          
        case 'lfu': // Least Frequently Used
          toEvict = entries
            .sort(([, a], [, b]) => 
              (a.accessCount || 0) - (b.accessCount || 0)
            )
            .slice(0, count)
            .map(([key]) => key);
          break;
          
        case 'fifo': // First In, First Out
          toEvict = entries
            .sort(([, a], [, b]) => 
              (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
            )
            .slice(0, count)
            .map(([key]) => key);
          break;
          
        case 'ttl': // Time To Live based
          const now = new Date();
          toEvict = entries
            .filter(([, entry]) => {
              const expiry = new Date(entry.timestamp.getTime() + entry.ttl);
              return expiry < now;
            })
            .slice(0, count)
            .map(([key]) => key);
          break;
      }
      
      for (const key of toEvict) {
        await this.deleteFromLayer(layer, key);
        layer.stats.evictions++;
        this.stats.evictions++;
      }
      
      this.emit('cache_eviction', {
        layer: layer.name,
        evicted: toEvict.length,
        policy: layer.evictionPolicy
      });
      
    } catch (error) {
      console.warn(`Failed to evict from ${layer.name} layer:`, error);
    }
  }

  // Cache promotion (move entries to faster layers)
  private async promoteEntry(key: string, entry: CacheEntry<any>, fromLayer: string): Promise<void> {
    if (fromLayer === 'memory') {
      return; // Already in fastest layer
    }
    
    try {
      const memoryLayer = this.layers.get('memory');
      if (memoryLayer && memoryLayer.enabled) {
        // Promote frequently accessed entries to memory
        if ((entry.accessCount || 0) >= this.config.promotionThreshold) {
          await this.setInLayer(memoryLayer, key, entry);
        }
      }
    } catch (error) {
      console.warn('Failed to promote cache entry:', error);
    }
  }

  // Cache invalidation by tags
  private async invalidateByTags(layer: CacheLayer, tags: string[]): Promise<void> {
    try {
      const keysToDelete: string[] = [];
      
      for (const [key, entry] of layer.data) {
        const entryTags = entry.metadata?.tags || [];
        if (tags.some(tag => entryTags.includes(tag))) {
          keysToDelete.push(key);
        }
      }
      
      for (const key of keysToDelete) {
        await this.deleteFromLayer(layer, key);
      }
      
    } catch (error) {
      console.warn(`Failed to invalidate by tags in ${layer.name} layer:`, error);
    }
  }

  // Storage layer persistence
  private async loadStorageLayer(layer: CacheLayer): Promise<void> {
    try {
      // Load metadata from localStorage
      const metadataKey = `cache_metadata:${layer.name}`;
      const metadata = localStorage.getItem(metadataKey);
      
      if (metadata) {
        const { keys } = JSON.parse(metadata);
        
        for (const key of keys) {
          const stored = localStorage.getItem(`cache:${key}`);
          if (stored) {
            const entry = JSON.parse(stored);
            if (this.isValidEntry(entry)) {
              layer.data.set(key, { ...entry, data: null }); // Metadata only
            } else {
              localStorage.removeItem(`cache:${key}`);
            }
          }
        }
      }
      
      layer.stats.size = layer.data.size;
      
    } catch (error) {
      console.warn('Failed to load storage layer:', error);
    }
  }

  // Utility methods
  private setupCleanupTimer(): void {
    if (this.config.cleanupInterval) {
      this.cleanupTimer = setInterval(() => {
        this.performCleanup();
      }, this.config.cleanupInterval);
    }
  }

  private async performCleanup(): Promise<void> {
    try {
      for (const layer of this.layers.values()) {
        await this.cleanupExpiredEntries(layer);
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  private async cleanupExpiredEntries(layer: CacheLayer): Promise<void> {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of layer.data) {
      const expiry = new Date(entry.timestamp.getTime() + entry.ttl);
      if (expiry < now) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      await this.deleteFromLayer(layer, key);
    }
    
    if (expiredKeys.length > 0) {
      console.debug(`Cleaned up ${expiredKeys.length} expired entries from ${layer.name} layer`);
    }
  }

  private setupPerformanceMonitoring(): void {
    // Update hit ratio periodically
    setInterval(() => {
      const total = this.stats.hits + this.stats.misses;
      this.stats.hitRatio = total > 0 ? this.stats.hits / total : 0;
    }, 10000); // Every 10 seconds
  }

  private isValidEntry(entry: any): entry is CacheEntry<any> {
    if (!entry || typeof entry !== 'object') {
      return false;
    }
    
    const now = new Date();
    const entryTime = new Date(entry.timestamp);
    const expiry = new Date(entryTime.getTime() + entry.ttl);
    
    return expiry > now;
  }

  private generateKey(table: string, id: string): string {
    return `${table}:${id}`;
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private recordHit(duration: number): void {
    this.stats.hits++;
    this.updateAverageGetTime(duration);
  }

  private recordMiss(duration: number): void {
    this.stats.misses++;
    this.updateAverageGetTime(duration);
  }

  private recordSet(duration: number): void {
    this.stats.sets++;
    this.updateAverageSetTime(duration);
  }

  private updateAverageGetTime(duration: number): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.averageGetTime = 
      (this.stats.averageGetTime * (total - 1) + duration) / total;
  }

  private updateAverageSetTime(duration: number): void {
    this.stats.averageSetTime = 
      (this.stats.averageSetTime * (this.stats.sets - 1) + duration) / this.stats.sets;
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRatio: 0,
      averageSetTime: 0,
      averageGetTime: 0,
      memoryUsage: 0
    };
  }

  private validateConfig(config: CacheConfig): CacheConfig {
    if (!config) {
      throw new StorageError('Cache configuration is required', 'CONFIG_ERROR');
    }

    return {
      enabled: config.enabled !== false,
      type: config.type || 'memory',
      ttl: config.ttl || 300000, // 5 minutes
      maxSize: config.maxSize || 1000,
      strategy: config.strategy || 'lru',
      cleanupInterval: config.cleanupInterval || 60000, // 1 minute
      promotionThreshold: config.promotionThreshold || 3,
      ...config
    };
  }

  private sanitizeConfig(): any {
    return {
      enabled: this.config.enabled,
      type: this.config.type,
      ttl: this.config.ttl,
      maxSize: this.config.maxSize,
      strategy: this.config.strategy
    };
  }

  private validateInitialized(): void {
    if (!this.isInitialized) {
      throw new StorageError('CacheManager not initialized', 'NOT_INITIALIZED');
    }
  }

  // Event system
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in cache event listener for ${event}:`, error);
        }
      });
    }
  }

  // Public API
  isEnabled(): boolean {
    return this.config.enabled && this.isInitialized;
  }

  getStats(): CacheStats {
    // Update memory usage
    let memoryUsage = 0;
    for (const layer of this.layers.values()) {
      for (const entry of layer.data.values()) {
        memoryUsage += entry.metadata?.size || 0;
      }
    }
    this.stats.memoryUsage = memoryUsage;
    
    return { ...this.stats };
  }

  getConfiguration(): Partial<CacheConfig> {
    return {
      enabled: this.config.enabled,
      type: this.config.type,
      ttl: this.config.ttl,
      maxSize: this.config.maxSize,
      strategy: this.config.strategy
    };
  }

  getLayerStats(): Record<string, any> {
    const layerStats: Record<string, any> = {};
    
    for (const [name, layer] of this.layers) {
      layerStats[name] = {
        ...layer.stats,
        enabled: layer.enabled,
        type: layer.type,
        maxSize: layer.maxSize,
        currentSize: layer.data.size
      };
    }
    
    return layerStats;
  }
}