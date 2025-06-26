import type { Plugin, PluginRegistry, PluginConfig } from '../types/core';

class CourseFrameworkPluginRegistry implements PluginRegistry {
  public plugins: Map<string, Plugin> = new Map();
  private initialized: Set<string> = new Set();

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already registered`);
      return;
    }
    
    this.plugins.set(plugin.id, plugin);
    console.log(`Plugin ${plugin.name} (${plugin.id}) registered`);
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin && plugin.destroy) {
      plugin.destroy();
    }
    
    this.plugins.delete(pluginId);
    this.initialized.delete(pluginId);
    console.log(`Plugin ${pluginId} unregistered`);
  }

  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async initialize(pluginId: string, config: PluginConfig = {}): Promise<void> {
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
    } catch (error) {
      console.error(`Failed to initialize plugin ${pluginId}:`, error);
      throw error;
    }
  }

  isInitialized(pluginId: string): boolean {
    return this.initialized.has(pluginId);
  }

  async initializeAll(configs: Record<string, PluginConfig> = {}): Promise<void> {
    const initPromises = Array.from(this.plugins.keys()).map(pluginId => {
      const config = configs[pluginId] || {};
      return this.initialize(pluginId, config);
    });

    await Promise.all(initPromises);
  }
}

export const pluginRegistry = new CourseFrameworkPluginRegistry();