import type { Plugin } from '../../types/plugin-interface';
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
    // Expose components globally for dependent plugins
    (window as any).__communitySidebarComponents = {
      CommunitySidebar: CommunitySidebar,
    };
    console.log('🔌 Community Sidebar plugin initialized');
    console.log('🔌 Exposed CommunitySidebar component:', CommunitySidebar);
    console.log('🔌 Global components now:', (window as any).__communitySidebarComponents);
  },
  onUninstall: async () => {
    // Clean up global components
    delete (window as any).__communitySidebarComponents;
    console.log('🔌 Community Sidebar plugin destroyed');
  }
};

// Export the hook for accessing components
export { useCommunitySidebarComponent } from './useCommunitySidebarComponent';
export type { CommunitySidebarComponents } from './useCommunitySidebarComponent';

// Export types
export * from './types';