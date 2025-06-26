class CourseFrameworkPluginRegistry {
    plugins = new Map();
    initialized = new Set();
    register(plugin) {
        if (this.plugins.has(plugin.id)) {
            console.warn(`Plugin ${plugin.id} is already registered`);
            return;
        }
        this.plugins.set(plugin.id, plugin);
        console.log(`Plugin ${plugin.name} (${plugin.id}) registered`);
    }
    unregister(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (plugin && plugin.destroy) {
            plugin.destroy();
        }
        this.plugins.delete(pluginId);
        this.initialized.delete(pluginId);
        console.log(`Plugin ${pluginId} unregistered`);
    }
    get(pluginId) {
        return this.plugins.get(pluginId);
    }
    list() {
        return Array.from(this.plugins.values());
    }
    async initialize(pluginId, config = {}) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        if (this.initialized.has(pluginId)) {
            console.warn(`Plugin ${pluginId} is already initialized`);
            return;
        }
        try {
            await plugin.initialize(config);
            this.initialized.add(pluginId);
            console.log(`Plugin ${plugin.name} initialized`);
        }
        catch (error) {
            console.error(`Failed to initialize plugin ${pluginId}:`, error);
            throw error;
        }
    }
    isInitialized(pluginId) {
        return this.initialized.has(pluginId);
    }
    async initializeAll(configs = {}) {
        const initPromises = Array.from(this.plugins.keys()).map(pluginId => {
            const config = configs[pluginId] || {};
            return this.initialize(pluginId, config);
        });
        await Promise.all(initPromises);
    }
}
export const pluginRegistry = new CourseFrameworkPluginRegistry();
