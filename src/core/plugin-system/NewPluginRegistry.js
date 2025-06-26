// New plugin registry system - storage agnostic with cross-plugin communication
import React from 'react';
import { MemoryStorageProvider } from '../storage/MemoryStorageProvider';
import { CrossPluginCommunication } from '../communication/CrossPluginCommunication';
import { PluginStateManager } from '../state/PluginStateManager';
export class NewPluginRegistry {
    plugins = new Map();
    instances = new Map();
    stateManager;
    communication;
    // Global context
    currentUser = null;
    globalTheme = null;
    globalConfig = {};
    constructor(storageProvider) {
        this.communication = new CrossPluginCommunication();
        this.communication.initializeSystemStreams();
        this.stateManager = new PluginStateManager({
            storage: storageProvider || new MemoryStorageProvider(),
            communication: this.communication,
            enableRealTime: true,
            enableOptimisticUpdates: true
        });
        console.log('[NewPluginRegistry] Initialized with storage-agnostic plugin system');
    }
    /**
     * Register a plugin
     */
    registerPlugin(plugin) {
        if (this.plugins.has(plugin.id)) {
            console.warn(`[NewPluginRegistry] Plugin ${plugin.id} already registered`);
            return;
        }
        this.plugins.set(plugin.id, plugin);
        console.log(`[NewPluginRegistry] Registered plugin: ${plugin.name} (${plugin.id})`);
        // Set up communication if specified
        if (plugin.communicationSetup) {
            const communicationInterface = this.communication.getInterface(plugin.id);
            plugin.communicationSetup(communicationInterface);
        }
    }
    /**
     * Install/activate a plugin
     */
    async installPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        if (this.instances.has(pluginId)) {
            console.warn(`[NewPluginRegistry] Plugin ${pluginId} already installed`);
            return;
        }
        console.log(`[NewPluginRegistry] Installing plugin: ${plugin.name}`);
        // Prepare initial data
        const initialData = {};
        const subscriptions = [];
        // Load required data collections
        if (plugin.dataRequirements?.collections) {
            for (const collection of plugin.dataRequirements.collections) {
                try {
                    const data = await this.stateManager.getActions(pluginId).getData(collection);
                    initialData[collection] = data;
                    console.log(`[NewPluginRegistry] Loaded ${data.length} items from ${collection} for ${pluginId}`);
                }
                catch (error) {
                    console.error(`[NewPluginRegistry] Failed to load ${collection} for ${pluginId}:`, error);
                    initialData[collection] = [];
                }
            }
        }
        // Real-time subscriptions are now handled in the plugin wrapper component
        // This avoids duplicate subscriptions and React state issues
        // Create wrapped component
        const WrappedComponent = this.createPluginWrapper(plugin, initialData);
        // Create plugin instance
        const instance = {
            plugin,
            component: WrappedComponent,
            data: initialData,
            subscriptions
        };
        this.instances.set(pluginId, instance);
        // Call plugin's onInstall lifecycle method if it exists
        if (plugin.onInstall && typeof plugin.onInstall === 'function') {
            try {
                console.log(`[NewPluginRegistry] Calling onInstall for ${plugin.name}`);
                await plugin.onInstall();
                console.log(`[NewPluginRegistry] onInstall completed for ${plugin.name}`);
            }
            catch (error) {
                console.error(`[NewPluginRegistry] onInstall failed for ${plugin.name}:`, error);
            }
        }
        // Emit installation event
        this.communication.emitSystemEvent('plugin:installed', {
            pluginId,
            plugin: plugin.name,
            dataCollections: Object.keys(initialData),
            subscriptions: subscriptions.length
        });
        console.log(`[NewPluginRegistry] Plugin ${plugin.name} installed successfully`);
    }
    /**
     * Uninstall a plugin
     */
    uninstallPlugin(pluginId) {
        const instance = this.instances.get(pluginId);
        if (!instance) {
            console.warn(`[NewPluginRegistry] Plugin ${pluginId} not installed`);
            return;
        }
        // Clean up subscriptions
        instance.subscriptions.forEach(unsubscribe => unsubscribe());
        // Clean up communication
        this.communication.cleanupPlugin(pluginId);
        // Clean up state manager
        this.stateManager.cleanupPlugin(pluginId);
        // Remove instance
        this.instances.delete(pluginId);
        this.communication.emitSystemEvent('plugin:uninstalled', { pluginId });
        console.log(`[NewPluginRegistry] Plugin ${pluginId} uninstalled`);
    }
    /**
     * Get plugin component for rendering
     */
    getPluginComponent(pluginId) {
        const instance = this.instances.get(pluginId);
        return instance ? instance.component : null;
    }
    /**
     * Get all installed plugins
     */
    getInstalledPlugins() {
        return Array.from(this.instances.values()).map(instance => instance.plugin);
    }
    /**
     * Get all available plugins
     */
    getAvailablePlugins() {
        return Array.from(this.plugins.values());
    }
    /**
     * Set global context
     */
    setCurrentUser(user) {
        this.currentUser = user;
        // Update user stream
        const userStream = this.communication.createSystemStream('current-user', user);
        userStream.replace(user);
        console.log('[NewPluginRegistry] Current user updated');
    }
    setGlobalTheme(theme) {
        this.globalTheme = theme;
        // Update theme stream
        const themeStream = this.communication.createSystemStream('global-theme', theme);
        themeStream.replace(theme);
        console.log('[NewPluginRegistry] Global theme updated');
    }
    setGlobalConfig(config) {
        this.globalConfig = config;
        console.log('[NewPluginRegistry] Global config updated');
    }
    /**
     * Create plugin wrapper component
     */
    createPluginWrapper(plugin, initialData) {
        const PluginWrapper = (additionalProps = {}) => {
            // Force re-render hook
            const [, forceUpdate] = React.useReducer(x => x + 1, 0);
            // Get the instance directly to avoid state duplication
            const instance = this.instances.get(plugin.id);
            // Create stable actions and communication references
            const actions = React.useMemo(() => this.stateManager.getActions(plugin.id), [plugin.id]);
            const communication = React.useMemo(() => this.communication.getInterface(plugin.id), [plugin.id]);
            // Set up real-time updates
            React.useEffect(() => {
                if (!plugin.dataRequirements?.realTimeCollections)
                    return;
                const unsubscribes = [];
                // Subscribe to real-time data changes
                for (const collection of plugin.dataRequirements.realTimeCollections) {
                    const unsubscribe = actions.subscribeToData(collection, {}, (newData) => {
                        // Update instance data
                        if (instance) {
                            instance.data[collection] = newData;
                            forceUpdate(); // Force re-render with new data
                        }
                    });
                    unsubscribes.push(unsubscribe);
                }
                return () => {
                    unsubscribes.forEach(fn => fn());
                };
            }, [plugin.id, actions, instance]);
            // Create plugin props directly from instance data
            const pluginProps = {
                pluginId: plugin.id,
                currentUser: this.currentUser,
                permissions: plugin.dataRequirements?.permissions || [],
                data: instance?.data || initialData,
                actions,
                communication,
                theme: this.globalTheme,
                config: this.globalConfig,
                ...additionalProps
            };
            // Error boundary
            const [error, setError] = React.useState(null);
            if (error) {
                return React.createElement('div', {
                    style: { padding: '20px', border: '1px solid red', margin: '10px' }
                }, [
                    React.createElement('h3', { key: 'title' }, `Plugin Error: ${plugin.name}`),
                    React.createElement('p', { key: 'message' }, error.message),
                    React.createElement('button', {
                        key: 'retry',
                        onClick: () => setError(null)
                    }, 'Retry')
                ]);
            }
            try {
                return React.createElement(plugin.component, pluginProps);
            }
            catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
                return null;
            }
        };
        PluginWrapper.displayName = `PluginWrapper(${plugin.name})`;
        return PluginWrapper;
    }
    /**
     * Initialize with seed data (for testing)
     */
    async seedData(seedData) {
        if (this.stateManager['storage'] instanceof MemoryStorageProvider) {
            this.stateManager['storage'].seed(seedData);
            console.log('[NewPluginRegistry] Seeded data:', Object.keys(seedData));
        }
        else {
            console.warn('[NewPluginRegistry] Seeding only supported with MemoryStorageProvider');
        }
    }
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            plugins: {
                registered: Array.from(this.plugins.keys()),
                installed: Array.from(this.instances.keys())
            },
            communication: this.communication.getDebugInfo(),
            stateManager: this.stateManager.getDebugInfo(),
            context: {
                currentUser: !!this.currentUser,
                theme: !!this.globalTheme,
                config: Object.keys(this.globalConfig)
            }
        };
    }
    /**
     * Connect to storage
     */
    async connect() {
        await this.stateManager['storage'].connect();
        console.log('[NewPluginRegistry] Connected to storage');
    }
    /**
     * Disconnect from storage
     */
    async disconnect() {
        // Uninstall all plugins first
        const installedPlugins = Array.from(this.instances.keys());
        installedPlugins.forEach(pluginId => this.uninstallPlugin(pluginId));
        await this.stateManager['storage'].disconnect();
        console.log('[NewPluginRegistry] Disconnected from storage');
    }
}
