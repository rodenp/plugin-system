// Community plugin for the new architecture
import * as React from 'react';
import type { Plugin, PluginProps } from '../../../types/plugin-interface';
import { CommunityFeedComponent } from '../CommunityFeedComponent';

// Plugin definition
export const communityPlugin: Plugin = {
  id: 'community',
  name: 'Community',
  component: CommunityFeedComponent,
  icon: '',
  order: 1,
};

export default communityPlugin;