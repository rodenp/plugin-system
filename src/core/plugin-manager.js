// Browser-compatible EventEmitter
class EventEmitter {
    listeners = {};
    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
        return this;
    }
    emit(event, ...args) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(...args));
        }
        return true;
    }
    off(event, listener) {
        if (listener && this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        }
        else {
            delete this.listeners[event];
        }
        return this;
    }
    removeAllListeners(event) {
        if (event) {
            delete this.listeners[event];
        }
        else {
            this.listeners = {};
        }
        return this;
    }
    setMaxListeners(n) {
        // Browser implementation - no-op since we don't enforce limits
        return this;
    }
}
export class PluginManager extends EventEmitter {
    plugins = new Map();
    initializedPlugins = new Set();
    globalState = new Map();
    dependencies = new Map();
    constructor() {
        super();
        this.setMaxListeners(50); // Allow many plugins to listen
    }
    /**
     * Register a single plugin or array of plugins
     */
    register(plugins) {
        const pluginArray = Array.isArray(plugins) ? plugins : [plugins];
        for (const plugin of pluginArray) {
            this.validatePlugin(plugin);
            // Check dependencies
            for (const dep of plugin.dependencies) {
                if (!this.plugins.has(dep)) {
                    throw new Error(`Plugin ${plugin.name} depends on ${dep} which is not registered`);
                }
            }
            this.plugins.set(plugin.name, plugin);
            this.dependencies.set(plugin.name, plugin.dependencies);
            this.emit('plugin:registered', { plugin });
        }
    }
    /**
     * Initialize all registered plugins in dependency order
     */
    async initialize() {
        console.log('PluginManager.initialize() called');
        console.log('Plugins to initialize:', Array.from(this.plugins.keys()));
        console.log('Dependencies map:', Object.fromEntries(this.dependencies));
        const initOrder = this.resolveDependencyOrder();
        console.log('Initialization order:', initOrder);
        for (const pluginName of initOrder) {
            console.log('Initializing plugin:', pluginName);
            await this.initializePlugin(pluginName);
        }
        console.log('All plugins initialized. Final plugin list:', Array.from(this.plugins.keys()));
    }
    /**
     * Initialize a specific plugin
     */
    async initializePlugin(name) {
        if (this.initializedPlugins.has(name))
            return;
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin ${name} not found`);
        }
        try {
            // Initialize dependencies first
            for (const dep of plugin.dependencies) {
                await this.initializePlugin(dep);
            }
            // Initialize the plugin
            if (plugin.onInit) {
                console.log(`Calling onInit for ${name}, plugins before:`, Array.from(this.plugins.keys()));
                await plugin.onInit(this);
                console.log(`onInit for ${name} completed, plugins after:`, Array.from(this.plugins.keys()));
            }
            this.initializedPlugins.add(name);
            this.emit('plugin:initialized', { plugin });
        }
        catch (error) {
            this.emit('plugin:error', { plugin, error: error });
            throw error;
        }
    }
    /**
     * Get a plugin by name
     */
    getPlugin(name) {
        return this.plugins.get(name);
    }
    /**
     * Get a component from a plugin
     */
    getComponent(pluginName, componentName) {
        const plugin = this.plugins.get(pluginName);
        return plugin?.components[componentName];
    }
    /**
     * Get a hook from a plugin
     */
    getHook(pluginName, hookName) {
        const plugin = this.plugins.get(pluginName);
        return plugin?.hooks[hookName];
    }
    /**
     * Execute a hook across multiple plugins
     */
    async executeHook(hookName, ...args) {
        const results = [];
        for (const plugin of this.plugins.values()) {
            if (plugin.hooks[hookName]) {
                try {
                    const result = await plugin.hooks[hookName](...args);
                    results.push(result);
                }
                catch (error) {
                    this.emit('plugin:error', { plugin, error: error });
                }
            }
        }
        return results;
    }
    /**
     * Get all routes from all plugins
     */
    getAllRoutes() {
        const routes = [];
        for (const plugin of this.plugins.values()) {
            if (plugin.routes) {
                routes.push(...plugin.routes);
            }
        }
        return routes;
    }
    /**
     * Global state management for plugin communication
     */
    setState(key, value) {
        this.globalState.set(key, value);
        this.emit('state:changed', { state: Object.fromEntries(this.globalState) });
    }
    getState(key) {
        return this.globalState.get(key);
    }
    getAllState() {
        return Object.fromEntries(this.globalState);
    }
    /**
     * Destroy all plugins
     */
    async destroy() {
        const destroyOrder = [...this.initializedPlugins].reverse();
        for (const pluginName of destroyOrder) {
            const plugin = this.plugins.get(pluginName);
            if (plugin?.onDestroy) {
                try {
                    await plugin.onDestroy();
                    this.emit('plugin:destroyed', { plugin });
                }
                catch (error) {
                    this.emit('plugin:error', { plugin, error: error });
                }
            }
        }
        this.plugins.clear();
        this.initializedPlugins.clear();
        this.globalState.clear();
        this.dependencies.clear();
    }
    /**
     * Validate plugin structure
     */
    validatePlugin(plugin) {
        if (!plugin.name || typeof plugin.name !== 'string') {
            throw new Error('Plugin must have a valid name');
        }
        if (!plugin.version || typeof plugin.version !== 'string') {
            throw new Error('Plugin must have a valid version');
        }
        if (!plugin.components || typeof plugin.components !== 'object') {
            throw new Error('Plugin must have a components object');
        }
        if (!plugin.hooks || typeof plugin.hooks !== 'object') {
            throw new Error('Plugin must have a hooks object');
        }
        if (!Array.isArray(plugin.dependencies)) {
            throw new Error('Plugin must have a dependencies array');
        }
        // Check for duplicate plugin names
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin ${plugin.name} is already registered`);
        }
    }
    /**
     * Resolve plugin initialization order based on dependencies
     */
    resolveDependencyOrder() {
        const visited = new Set();
        const visiting = new Set();
        const order = [];
        const visit = (pluginName) => {
            if (visiting.has(pluginName)) {
                throw new Error(`Circular dependency detected involving ${pluginName}`);
            }
            if (visited.has(pluginName))
                return;
            visiting.add(pluginName);
            const deps = this.dependencies.get(pluginName) || [];
            for (const dep of deps) {
                visit(dep);
            }
            visiting.delete(pluginName);
            visited.add(pluginName);
            order.push(pluginName);
        };
        for (const pluginName of this.plugins.keys()) {
            visit(pluginName);
        }
        return order;
    }
}
// Singleton instance for global access (optional)
// export const pluginManager = new PluginManager();
