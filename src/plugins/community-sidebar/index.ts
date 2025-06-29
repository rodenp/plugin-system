import type { Plugin } from '../../types/plugin-interface';
import { pluginRegistry } from '../../store/plugin-registry';
import { CommunitySidebar } from './components/CommunitySidebar';
import { CommunitySidebarDemo } from './CommunitySidebarDemo';

export const communitySidebarPlugin: Plugin = {
  id: 'community-sidebar',
  name: 'Community Sidebar',
  component: CommunitySidebarDemo,
  dependencies: [], // No dependencies
  icon: '📊',
  order: 2,
  onInstall: async () => {
    // Register components with service registry
    pluginRegistry.registerService('community-sidebar', {
      version: '1.0.0',
      components: {
        CommunitySidebar,
      }
    });
    console.log('🔌 Community Sidebar plugin initialized with service registry');
  },
  onUninstall: async () => {
    console.log('🔌 Community Sidebar plugin destroyed');
  }
};

// Export the hook for accessing components
export { useCommunitySidebarComponent } from './useCommunitySidebarComponent';
export type { CommunitySidebarComponents } from './useCommunitySidebarComponent';

// Export types
export * from './types';