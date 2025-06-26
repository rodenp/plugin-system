/**
 * Storage-Agnostic Plugin System Interfaces
 * 
 * These interfaces define the contract for plugins in a storage-agnostic way.
 * Plugins using these interfaces can work with any storage backend (PostgreSQL,
 * Memory, IndexedDB, etc.) without knowing the implementation details.
 */

import * as React from 'react';

// ============================================================================
// Core Entity Types (Storage-Agnostic)
// ============================================================================

export interface User {
  id: string;
  email: string;
  profile: {
    displayName: string;
    bio?: string;
    avatar?: string;
    timezone: string;
    location?: string;
  };
  role: 'creator' | 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  moderators: string[];
  access: 'free' | 'paid' | 'private';
  settings: {
    approval: 'instant' | 'manual';
    visibility: 'public' | 'private';
    inviteOnly: boolean;
    features: {
      courses: boolean;
      events: boolean;
      messaging: boolean;
      leaderboard: boolean;
      badges: boolean;
      merch: boolean;
    };
    gamification: {
      pointsPerLike: number;
      pointsPerPost: number;
      pointsPerComment: number;
      enableLevels: boolean;
      customBadges: any[];
    };
    notifications: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      weeklyDigest: boolean;
    };
  };
  theme?: any;
  stats?: {
    memberCount: number;
    online: number;
    adminCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// User role in a specific community
export type CommunityRole = 'owner' | 'admin' | 'moderator' | 'member';

// ============================================================================
// Plugin System Interfaces (Storage-Agnostic)
// ============================================================================

/**
 * Props interface for plugin components.
 * All plugins receive this standard set of props from the host application.
 */
export interface PluginProps {
  /** Current authenticated user */
  currentUser: User;
  
  /** ID of the current community */
  communityId: string;
  
  /** Current community data */
  community: Community;
  
  /** User's role in the current community */
  userRole: CommunityRole;
  
  /** Theme configuration (optional) */
  theme?: any;
}

/**
 * Plugin definition interface.
 * Defines the metadata and behavior of a plugin.
 */
export interface Plugin {
  /** Unique plugin identifier */
  id: string;
  
  /** Human-readable plugin name */
  name: string;
  
  /** React component that renders the plugin UI */
  component: React.ComponentType<PluginProps>;
  
  /** Other plugin IDs this plugin depends on (optional) */
  dependencies?: string[];
  
  /** Icon for the plugin tab/button (optional) */
  icon?: string;
  
  /** Display order for plugin tabs (optional, default: 0) */
  order?: number;
  
  /** Callback executed when plugin is installed (optional) */
  onInstall?: () => void | Promise<void>;
  
  /** Callback executed when plugin is uninstalled (optional) */
  onUninstall?: () => void | Promise<void>;
}

/**
 * Enhanced plugin props that include theme support.
 * Used for plugins that need explicit theme access.
 */
export interface ThemedPluginProps extends PluginProps {
  theme: any; // Theme is required for themed plugins
}

// ============================================================================
// Plugin Registry Interface (Storage-Agnostic)
// ============================================================================

/**
 * Plugin registry interface for managing plugin lifecycle.
 * Implementation is storage-agnostic and handles plugin registration,
 * installation, and dependency management.
 */
export interface PluginRegistryInterface {
  /** Register a plugin with the registry */
  register(plugin: Plugin): void;
  
  /** Install a plugin (and its dependencies) */
  install(pluginId: string): void;
  
  /** Uninstall a plugin */
  uninstall(pluginId: string): void;
  
  /** Get all installed plugins, sorted by order */
  getInstalledPlugins(): Plugin[];
  
  /** Get all registered plugins, sorted by order */
  getAllPlugins(): Plugin[];
  
  /** Get a specific plugin by ID */
  getPlugin(id: string): Plugin | undefined;
  
  /** Check if a plugin is installed */
  isInstalled(pluginId: string): boolean;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if a component uses themed props
 */
export function isThemedPlugin(props: PluginProps): props is ThemedPluginProps {
  return props.theme !== undefined;
}

/**
 * Helper to create a plugin definition with type safety
 */
export function createPlugin(definition: Plugin): Plugin {
  return {
    order: 0, // Default order
    ...definition,
  };
}

// ============================================================================
// Legacy Compatibility (Temporary)
// ============================================================================

/**
 * @deprecated Use Plugin interface instead
 * Legacy alias for backward compatibility during migration
 */
export type SkoolPlugin = Plugin;

/**
 * @deprecated Use PluginProps interface instead  
 * Legacy alias for backward compatibility during migration
 */
export type SkoolPluginProps = PluginProps;

// ============================================================================
// Export Summary (Note: Types are already exported above)
// ============================================================================