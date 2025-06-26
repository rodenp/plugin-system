// Reactive data streams for shared state between plugins
export class DataStreams {
    streams = new Map();
    subscriptions = new Map();
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    /**
     * Create a new data stream
     */
    createStream(streamId, initialData, ownerPlugin) {
        if (this.streams.has(streamId)) {
            console.warn(`[DataStreams] Stream ${streamId} already exists`);
            return this.getStream(streamId);
        }
        const stream = new InternalDataStream(streamId, initialData, this);
        this.streams.set(streamId, stream);
        console.log(`[DataStreams] Created stream: ${streamId}`, ownerPlugin ? `(owned by ${ownerPlugin})` : '');
        return stream;
    }
    /**
     * Get an existing data stream
     */
    getStream(streamId) {
        const stream = this.streams.get(streamId);
        if (!stream) {
            throw new Error(`Stream ${streamId} does not exist`);
        }
        return stream;
    }
    /**
     * Check if a stream exists
     */
    hasStream(streamId) {
        return this.streams.has(streamId);
    }
    /**
     * Get or create a stream
     */
    getOrCreateStream(streamId, initialData) {
        if (this.hasStream(streamId)) {
            return this.getStream(streamId);
        }
        return this.createStream(streamId, initialData);
    }
    /**
     * Subscribe to a stream with plugin tracking
     */
    subscribeToStream(streamId, callback, pluginId) {
        const subscription = {
            id: this.generateId(),
            streamId,
            pluginId,
            callback
        };
        if (!this.subscriptions.has(streamId)) {
            this.subscriptions.set(streamId, new Set());
        }
        this.subscriptions.get(streamId).add(subscription);
        console.log(`[DataStreams] ${pluginId} subscribed to stream: ${streamId}`);
        // Return unsubscribe function
        return () => {
            const streamSubs = this.subscriptions.get(streamId);
            if (streamSubs) {
                streamSubs.delete(subscription);
                if (streamSubs.size === 0) {
                    this.subscriptions.delete(streamId);
                }
            }
            console.log(`[DataStreams] ${pluginId} unsubscribed from stream: ${streamId}`);
        };
    }
    /**
     * Notify all subscribers of a stream update
     */
    notifySubscribers(streamId, data) {
        const subscribers = this.subscriptions.get(streamId);
        if (subscribers) {
            subscribers.forEach(subscription => {
                try {
                    subscription.callback(data);
                }
                catch (error) {
                    console.error(`[DataStreams] Error notifying subscriber ${subscription.pluginId} for stream ${streamId}:`, error);
                }
            });
        }
    }
    /**
     * Delete a stream
     */
    deleteStream(streamId) {
        this.streams.delete(streamId);
        this.subscriptions.delete(streamId);
        console.log(`[DataStreams] Deleted stream: ${streamId}`);
    }
    /**
     * Get all active streams
     */
    getActiveStreams() {
        return Array.from(this.streams.keys());
    }
    /**
     * Get stream subscribers for debugging
     */
    getStreamSubscribers(streamId) {
        const subscribers = this.subscriptions.get(streamId);
        return subscribers ? Array.from(subscribers).map(sub => sub.pluginId) : [];
    }
    /**
     * Get all subscribers grouped by stream
     */
    getAllSubscribers() {
        const result = {};
        for (const [streamId, subscribers] of this.subscriptions.entries()) {
            result[streamId] = Array.from(subscribers).map(sub => sub.pluginId);
        }
        return result;
    }
    /**
     * Clear all streams and subscriptions
     */
    clear() {
        this.streams.clear();
        this.subscriptions.clear();
    }
    /**
     * Get statistics about streams
     */
    getStats() {
        const totalStreams = this.streams.size;
        let totalSubscriptions = 0;
        const activePlugins = new Set();
        const streamSizes = {};
        for (const [streamId, subscribers] of this.subscriptions.entries()) {
            const subCount = subscribers.size;
            totalSubscriptions += subCount;
            streamSizes[streamId] = subCount;
            subscribers.forEach(sub => activePlugins.add(sub.pluginId));
        }
        return {
            totalStreams,
            totalSubscriptions,
            activePlugins: Array.from(activePlugins),
            streamSizes
        };
    }
}
/**
 * Internal implementation of DataStream
 */
class InternalDataStream {
    data;
    streamId;
    dataStreams;
    constructor(streamId, initialData, dataStreams) {
        this.streamId = streamId;
        this.data = { ...initialData };
        this.dataStreams = dataStreams;
    }
    get current() {
        return { ...this.data };
    }
    subscribe(callback) {
        // Note: This creates an anonymous subscription
        // For plugin tracking, use DataStreams.subscribeToStream instead
        return this.dataStreams.subscribeToStream(this.streamId, callback, 'anonymous');
    }
    update(data) {
        this.data = { ...this.data, ...data };
        this.dataStreams.notifySubscribers(this.streamId, this.current);
        console.log(`[DataStreams] Stream ${this.streamId} updated:`, data);
    }
    replace(data) {
        this.data = { ...data };
        this.dataStreams.notifySubscribers(this.streamId, this.current);
        console.log(`[DataStreams] Stream ${this.streamId} replaced`);
    }
    reset() {
        // Reset to empty object, streams should define their own reset logic
        this.data = {};
        this.dataStreams.notifySubscribers(this.streamId, this.current);
        console.log(`[DataStreams] Stream ${this.streamId} reset`);
    }
}
