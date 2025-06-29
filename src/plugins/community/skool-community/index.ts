// Community plugin for the new architecture
import * as React from 'react';
import type { Plugin, PluginProps } from '../../../types/plugin-interface';
import { CommunityFeedComponent } from '../CommunityFeedComponent';

// Wrapper component that handles internal routing
const CommunityPluginWrapper: React.FC<PluginProps> = (props) => {
  const groupname = props.currentUser?.profile?.groupname || 'courzey';
  const pluginPath = `/${groupname}/community`;
  
  // Update document title and URL without causing page reload
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', pluginPath);
      document.title = `Community - ${groupname}`;
    }
  }, [groupname, pluginPath]);
  
  return React.createElement(CommunityFeedComponent, props);
};

// Plugin definition
export const communityPlugin: Plugin = {
  id: 'community',
  name: 'Community',
  component: CommunityPluginWrapper,
  dependencies: ['messaging', 'community-sidebar'], // Declare dependencies
  icon: '',
  order: 3, // Should load after its dependencies
};

export default communityPlugin;