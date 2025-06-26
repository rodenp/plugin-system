export class PluginStateManager {
    storage;
    communication;
    enableRealTime;
    enableOptimisticUpdates;
    // Track plugin data subscriptions
    subscriptions = new Map();
    dataCache = new Map(); // pluginId -> collection -> data
    constructor(config) {
        this.storage = config.storage;
        this.communication = config.communication;
        this.enableRealTime = config.enableRealTime ?? true;
        this.enableOptimisticUpdates = config.enableOptimisticUpdates ?? true;
        this.initializeSystemEvents();
    }
    initializeSystemEvents() {
        // Listen for system-wide data changes to invalidate caches
        this.communication.emitSystemEvent('state-manager:initialized', {
            timestamp: new Date(),
            features: {
                realTime: this.enableRealTime,
                optimisticUpdates: this.enableOptimisticUpdates
            }
        });
    }
    /**
     * Get actions interface for a specific plugin
     */
    getActions(pluginId) {
        return {
            getData: async (collection, query) => {
                return await this.getData(pluginId, collection, query);
            },
            getById: async (collection, id) => {
                return await this.getById(pluginId, collection, id);
            },
            createItem: async (collection, data) => {
                return await this.createItem(pluginId, collection, data);
            },
            updateItem: async (collection, id, data) => {
                return await this.updateItem(pluginId, collection, id, data);
            },
            deleteItem: async (collection, id) => {
                return await this.deleteItem(pluginId, collection, id);
            },
            createMany: async (collection, items) => {
                return await this.createMany(pluginId, collection, items);
            },
            updateMany: async (collection, updates) => {
                return await this.updateMany(pluginId, collection, updates);
            },
            subscribeToData: (collection, query, callback) => {
                return this.subscribeToData(pluginId, collection, query, callback);
            },
            transaction: async (operations) => {
                return await this.transaction(pluginId, operations);
            }
        };
    }
    /**
     * Get data for a plugin
     */
    async getData(pluginId, collection, query) {
        console.log(`[StateManager] ${pluginId} requesting data from ${collection}`, query);
        try {
            const data = await this.storage.get(collection, query);
            // Update cache
            this.updateCache(pluginId, collection, data);
            // Emit event for other plugins
            this.communication.emitSystemEvent('data:accessed', {
                pluginId,
                collection,
                query,
                resultCount: data.length
            });
            return data;
        }
        catch (error) {
            console.error(`[StateManager] Error getting data for ${pluginId}:`, error);
            this.communication.emitSystemEvent('data:error', {
                pluginId,
                collection,
                operation: 'get',
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Get single item by ID
     */
    async getById(pluginId, collection, id) {
        console.log(`[StateManager] ${pluginId} requesting ${collection}/${id}`);
        try {
            const item = await this.storage.getById(collection, id);
            this.communication.emitSystemEvent('data:accessed', {
                pluginId,
                collection,
                id,
                found: !!item
            });
            return item;
        }
        catch (error) {
            console.error(`[StateManager] Error getting item ${id} for ${pluginId}:`, error);
            throw error;
        }
    }
    /**
     * Create new item
     */
    async createItem(pluginId, collection, data) {
        console.log(`[StateManager] ${pluginId} creating item in ${collection}`, data);
        try {
            // Apply optimistic update if enabled
            if (this.enableOptimisticUpdates) {
                this.applyOptimisticCreate(pluginId, collection, data);
            }
            const created = await this.storage.create(collection, data);
            // Update all relevant caches
            this.invalidateCollectionCache(collection);
            // Emit events
            this.communication.emitSystemEvent('data:created', {
                pluginId,
                collection,
                item: created
            });
            // Cross-plugin notification
            this.communication.emitSystemEvent(`${collection}:created`, {
                item: created,
                by: pluginId
            });
            console.log(`[StateManager] Item created successfully:`, created);
            return created;
        }
        catch (error) {
            // Rollback optimistic update
            if (this.enableOptimisticUpdates) {
                this.rollbackOptimisticUpdate(pluginId, collection);
            }
            console.error(`[StateManager] Error creating item for ${pluginId}:`, error);
            this.communication.emitSystemEvent('data:error', {
                pluginId,
                collection,
                operation: 'create',
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Update existing item
     */
    async updateItem(pluginId, collection, id, data) {
        console.log(`[StateManager] ${pluginId} updating ${collection}/${id}`, data);
        try {
            const updated = await this.storage.update(collection, id, data);
            // Update caches
            this.invalidateCollectionCache(collection);
            // Emit events
            this.communication.emitSystemEvent('data:updated', {
                pluginId,
                collection,
                id,
                item: updated
            });
            this.communication.emitSystemEvent(`${collection}:updated`, {
                item: updated,
                by: pluginId
            });
            console.log(`[StateManager] Item updated successfully:`, updated);
            return updated;
        }
        catch (error) {
            console.error(`[StateManager] Error updating item ${id} for ${pluginId}:`, error);
            throw error;
        }
    }
    /**
     * Delete item
     */
    async deleteItem(pluginId, collection, id) {
        console.log(`[StateManager] ${pluginId} deleting ${collection}/${id}`);
        try {
            // Get item before deletion for event
            const item = await this.storage.getById(collection, id);
            await this.storage.delete(collection, id);
            // Update caches
            this.invalidateCollectionCache(collection);
            // Emit events
            this.communication.emitSystemEvent('data:deleted', {
                pluginId,
                collection,
                id,
                item
            });
            this.communication.emitSystemEvent(`${collection}:deleted`, {
                item,
                by: pluginId
            });
            console.log(`[StateManager] Item deleted successfully: ${id}`);
        }
        catch (error) {
            console.error(`[StateManager] Error deleting item ${id} for ${pluginId}:`, error);
            throw error;
        }
    }
    /**
     * Create multiple items
     */
    async createMany(pluginId, collection, items) {
        console.log(`[StateManager] ${pluginId} creating ${items.length} items in ${collection}`);
        try {
            const created = await this.storage.createMany(collection, items);
            this.invalidateCollectionCache(collection);
            this.communication.emitSystemEvent('data:batch_created', {
                pluginId,
                collection,
                count: created.length,
                items: created
            });
            return created;
        }
        catch (error) {
            console.error(`[StateManager] Error creating multiple items for ${pluginId}:`, error);
            throw error;
        }
    }
    /**
     * Update multiple items
     */
    async updateMany(pluginId, collection, updates) {
        console.log(`[StateManager] ${pluginId} updating ${updates.length} items in ${collection}`);
        try {
            const updated = await this.storage.updateMany(collection, updates);
            this.invalidateCollectionCache(collection);
            this.communication.emitSystemEvent('data:batch_updated', {
                pluginId,
                collection,
                count: updated.length,
                items: updated
            });
            return updated;
        }
        catch (error) {
            console.error(`[StateManager] Error updating multiple items for ${pluginId}:`, error);
            throw error;
        }
    }
    /**
     * Subscribe to real-time data changes
     */
    subscribeToData(pluginId, collection, query, callback) {
        const subscriptionId = this.generateId();
        const unsubscribeStorage = this.storage.subscribe(collection, query, (data) => {
            console.log(`[StateManager] Real-time update for ${pluginId}/${collection}:`, data.length, 'items');
            // Update cache
            this.updateCache(pluginId, collection, data);
            // Notify plugin
            callback(data);
            // Emit system event
            this.communication.emitSystemEvent('data:realtime_update', {
                pluginId,
                collection,
                query,
                count: data.length
            });
        });
        const subscription = {
            id: subscriptionId,
            pluginId,
            collection,
            query,
            callback,
            unsubscribe: unsubscribeStorage
        };
        if (!this.subscriptions.has(pluginId)) {
            this.subscriptions.set(pluginId, new Set());
        }
        this.subscriptions.get(pluginId).add(subscription);
        console.log(`[StateManager] ${pluginId} subscribed to ${collection} real-time updates`);
        // Return unsubscribe function
        return () => {
            unsubscribeStorage();
            const pluginSubs = this.subscriptions.get(pluginId);
            if (pluginSubs) {
                pluginSubs.delete(subscription);
                if (pluginSubs.size === 0) {
                    this.subscriptions.delete(pluginId);
                }
            }
            console.log(`[StateManager] ${pluginId} unsubscribed from ${collection} real-time updates`);
        };
    }
    /**
     * Execute transaction
     */
    async transaction(pluginId, operations) {
        console.log(`[StateManager] ${pluginId} executing transaction with ${operations.length} operations`);
        try {
            const results = await this.storage.transaction(operations);
            // Invalidate all affected collections
            const affectedCollections = new Set(operations.map(op => op.collection));
            affectedCollections.forEach(collection => {
                this.invalidateCollectionCache(collection);
            });
            // Emit transaction event
            this.communication.emitSystemEvent('data:transaction', {
                pluginId,
                operations: operations.length,
                results: results.length,
                collections: Array.from(affectedCollections)
            });
            return results;
        }
        catch (error) {
            console.error(`[StateManager] Transaction failed for ${pluginId}:`, error);
            throw error;
        }
    }
    /**
     * Cache management
     */
    updateCache(pluginId, collection, data) {
        if (!this.dataCache.has(pluginId)) {
            this.dataCache.set(pluginId, new Map());
        }
        this.dataCache.get(pluginId).set(collection, data);
    }
    invalidateCollectionCache(collection) {
        for (const pluginCache of this.dataCache.values()) {
            pluginCache.delete(collection);
        }
    }
    applyOptimisticCreate(pluginId, collection, data) {
        // Simple optimistic update - add to cache with temporary ID
        const optimisticId = `temp_${Date.now()}`;
        const optimisticItem = { ...data, id: optimisticId, _optimistic: true };
        const pluginCache = this.dataCache.get(pluginId)?.get(collection) || [];
        pluginCache.push(optimisticItem);
        this.updateCache(pluginId, collection, pluginCache);
    }
    rollbackOptimisticUpdate(pluginId, collection) {
        const pluginCache = this.dataCache.get(pluginId)?.get(collection) || [];
        const filtered = pluginCache.filter(item => !item._optimistic);
        this.updateCache(pluginId, collection, filtered);
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    /**
     * Cleanup plugin subscriptions
     */
    cleanupPlugin(pluginId) {
        const pluginSubs = this.subscriptions.get(pluginId);
        if (pluginSubs) {
            pluginSubs.forEach(sub => sub.unsubscribe());
            this.subscriptions.delete(pluginId);
        }
        this.dataCache.delete(pluginId);
        console.log(`[StateManager] Cleaned up plugin: ${pluginId}`);
    }
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            subscriptions: Array.from(this.subscriptions.entries()).map(([pluginId, subs]) => ({
                pluginId,
                subscriptions: Array.from(subs).map(sub => ({
                    collection: sub.collection,
                    query: sub.query
                }))
            })),
            cacheStats: Array.from(this.dataCache.entries()).map(([pluginId, cache]) => ({
                pluginId,
                collections: Array.from(cache.keys()),
                totalItems: Array.from(cache.values()).reduce((sum, items) => sum + items.length, 0)
            }))
        };
    }
}
