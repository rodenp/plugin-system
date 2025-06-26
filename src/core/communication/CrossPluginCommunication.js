// Main communication hub combining all communication methods
import { EventBus } from './EventBus';
import { ServiceRegistry } from './ServiceRegistry';
import { DataStreams } from './DataStreams';
export class CrossPluginCommunication {
    eventBus = new EventBus();
    serviceRegistry = new ServiceRegistry();
    dataStreams = new DataStreams();
    /**
     * Get communication interface for a specific plugin
     */
    getInterface(pluginId) {
        return {
            events: {
                emit: (eventType, data) => {
                    this.eventBus.emit(eventType, data, pluginId);
                },
                subscribe: (eventType, callback) => {
                    return this.eventBus.subscribe(eventType, callback, pluginId);
                },
                once: (eventType, callback) => {
                    return this.eventBus.once(eventType, callback, pluginId);
                }
            },
            services: {
                call: async (targetPlugin, method, ...args) => {
                    return await this.serviceRegistry.callService(targetPlugin, method, pluginId, ...args);
                },
                register: (service) => {
                    this.serviceRegistry.registerService(pluginId, service);
                },
                getAvailable: () => {
                    return this.serviceRegistry.getAvailableServicesFor(pluginId);
                }
            },
            streams: {
                get: (streamId) => {
                    return this.dataStreams.getStream(streamId);
                },
                create: (streamId, initialData) => {
                    return this.dataStreams.createStream(streamId, initialData, pluginId);
                },
                getOrCreate: (streamId, initialData) => {
                    return this.dataStreams.getOrCreateStream(streamId, initialData);
                },
                subscribe: (streamId, callback) => {
                    return this.dataStreams.subscribeToStream(streamId, callback, pluginId);
                }
            }
        };
    }
    /**
     * Set service permissions for a plugin
     */
    setServicePermissions(pluginId, allowedCallers) {
        this.serviceRegistry.setPermissions(pluginId, allowedCallers);
    }
    /**
     * Global event emission (for system events)
     */
    emitSystemEvent(eventType, data) {
        this.eventBus.emit(eventType, data, 'system');
    }
    /**
     * Create system-level data streams
     */
    createSystemStream(streamId, initialData) {
        return this.dataStreams.createStream(streamId, initialData, 'system');
    }
    /**
     * Get debugging information
     */
    getDebugInfo() {
        return {
            events: {
                subscriptions: this.eventBus.getSubscriptions(),
                recentEvents: this.eventBus.getEventHistory(20),
                stats: this.eventBus.getStats()
            },
            services: {
                available: this.serviceRegistry.getAvailableServices(),
                recentCalls: this.serviceRegistry.getCallHistory(20),
                stats: this.serviceRegistry.getStats()
            },
            streams: {
                active: this.dataStreams.getActiveStreams(),
                subscribers: this.dataStreams.getAllSubscribers(),
                stats: this.dataStreams.getStats()
            }
        };
    }
    /**
     * Clean up all communication for a plugin
     */
    cleanupPlugin(pluginId) {
        // Services are automatically cleaned up by their unsubscribe functions
        // Streams subscriptions are also cleaned up automatically
        // This method is mainly for explicit cleanup if needed
        this.serviceRegistry.unregister(pluginId);
        console.log(`[CrossPluginCommunication] Cleaned up plugin: ${pluginId}`);
    }
    /**
     * Clear all communication (for testing)
     */
    clear() {
        this.eventBus.clear();
        this.serviceRegistry.clear();
        this.dataStreams.clear();
    }
    /**
     * Initialize common system streams
     */
    initializeSystemStreams() {
        // Current user stream
        this.createSystemStream('current-user', null);
        // Global app settings
        this.createSystemStream('app-settings', {
            theme: 'default',
            language: 'en',
            notifications: true
        });
        // Plugin states
        this.createSystemStream('plugin-states', {});
        console.log('[CrossPluginCommunication] System streams initialized');
    }
}
