// Plugin registry system
import type { Slice, Reducer, combineReducers } from '@reduxjs/toolkit';
import React from 'react';
import type { SkoolPluginProps } from './types';

export interface SkoolPlugin {
  id: string;
  name: string;
  component: React.ComponentType<SkoolPluginProps>;
  reduxSlice?: Slice; // Made optional to support Redux-free plugins
  dependencies?: string[]; // Other plugin IDs this depends on
  icon?: string; // Icon for the tab
  order?: number; // Display order
  onInstall?: () => void; // Callback when plugin is installed
}

// Theme-enhanced plugin component wrapper
interface ThemedPluginProps extends SkoolPluginProps {
  theme?: any;
}

class PluginRegistry {
  private plugins = new Map<string, SkoolPlugin>();
  private installedPlugins = new Set<string>();

  register(plugin: SkoolPlugin): void {
    if (!plugin) {
      console.error('❌ Attempted to register undefined plugin');
      return;
    }
    if (!plugin.id) {
      console.error('❌ Plugin missing ID:', plugin);
      return;
    }
    this.plugins.set(plugin.id, plugin);
    console.log(`🔌 Plugin registered: ${plugin.name} (${plugin.id})`);
  }

  install(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.error(`❌ Plugin not found: ${pluginId}`);
      console.error(`   Available plugins: ${Array.from(this.plugins.keys()).join(', ')}`);
      throw new Error(`Plugin not found: ${pluginId}. Available plugins: ${Array.from(this.plugins.keys()).join(', ')}`);
    }

    // Auto-install dependencies
    if (plugin.dependencies) {
      for (const depId of plugin.dependencies) {
        if (!this.installedPlugins.has(depId)) {
          console.log(`🔄 Auto-installing dependency: ${depId} (required by ${pluginId})`);
          // Check if dependency exists before trying to install
          if (!this.plugins.has(depId)) {
            throw new Error(`Dependency '${depId}' required by '${pluginId}' is not registered. Make sure to register all dependencies before installing plugins.`);
          }
          this.install(depId); // Recursive call to install dependency
        }
      }
    }

    this.installedPlugins.add(pluginId);
    
    // Call onInstall callback if provided
    if (plugin.onInstall) {
      try {
        // Handle both sync and async onInstall callbacks
        const result = plugin.onInstall();
        if (result && typeof result.then === 'function') {
          // It's a promise, wait for it
          result.catch((error: any) => {
            console.error(`❌ Error in async onInstall callback for ${pluginId}:`, error);
          });
        }
      } catch (error) {
        console.error(`❌ Error in onInstall callback for ${pluginId}:`, error);
      }
    }
    
    console.log(`✅ Plugin installed: ${plugin.name} (${plugin.id})`);
  }

  uninstall(pluginId: string): void {
    this.installedPlugins.delete(pluginId);
    console.log(`❌ Plugin uninstalled: ${pluginId}`);
  }

  getInstalledPlugins(): SkoolPlugin[] {
    return Array.from(this.installedPlugins)
      .map(id => this.plugins.get(id)!)
      .filter(Boolean)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getAllPlugins(): SkoolPlugin[] {
    return Array.from(this.plugins.values())
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getPlugin(id: string): SkoolPlugin | undefined {
    return this.plugins.get(id);
  }

  isInstalled(pluginId: string): boolean {
    return this.installedPlugins.has(pluginId);
  }

  // Auto-combine Redux slices from installed plugins
  createPluginReducers(): Record<string, Reducer> {
    const reducers: Record<string, Reducer> = {};
    
    this.getInstalledPlugins().forEach(plugin => {
      // Only add reducer if plugin has a reduxSlice
      if (plugin.reduxSlice && plugin.reduxSlice.reducer) {
        reducers[plugin.id] = plugin.reduxSlice.reducer;
      }
    });
    
    return reducers;
  }

  // Install multiple plugins at once
  installMany(pluginIds: string[]): void {
    // Sort by dependencies first
    const sortedIds = this.topologicalSort(pluginIds);
    
    for (const id of sortedIds) {
      this.install(id);
    }
  }

  // Create a theme-enhanced component wrapper for any plugin
  createThemedComponent(plugin: SkoolPlugin): React.ComponentType<SkoolPluginProps> {
    const ThemedPluginComponent: React.FC<SkoolPluginProps> = (props) => {
      // Extract theme from community object if available
      const theme = (props.community as any)?.theme;
      
      // Create enhanced props with theme
      const enhancedProps: ThemedPluginProps = {
        ...props,
        theme: theme
      };

      // Log theme injection for debugging
      if (theme) {
        console.log(`🎨 Plugin Registry: Injecting theme into ${plugin.name} plugin`, theme.colors?.secondary);
      }

      // Render the original plugin component with enhanced props
      return React.createElement(plugin.component, enhancedProps);
    };

    // Preserve display name for debugging
    ThemedPluginComponent.displayName = `Themed(${plugin.name})`;
    
    return ThemedPluginComponent;
  }

  // Get a theme-enhanced version of an installed plugin
  getThemedPlugin(id: string): SkoolPlugin | undefined {
    const plugin = this.plugins.get(id);
    if (!plugin) return undefined;

    // Return a new plugin object with theme-enhanced component
    return {
      ...plugin,
      component: this.createThemedComponent(plugin)
    };
  }

  // Simple topological sort for dependency resolution
  private topologicalSort(pluginIds: string[]): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const plugin = this.plugins.get(id);
      if (plugin?.dependencies) {
        for (const depId of plugin.dependencies) {
          if (pluginIds.includes(depId)) {
            visit(depId);
          }
        }
      }

      result.push(id);
    };

    for (const id of pluginIds) {
      visit(id);
    }

    return result;
  }
}

// Global plugin registry instance
export const pluginRegistry = new PluginRegistry();

// Helper hook for getting installed plugins
export function useInstalledPlugins(): SkoolPlugin[] {
  return pluginRegistry.getInstalledPlugins();
}