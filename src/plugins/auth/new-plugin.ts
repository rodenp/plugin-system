// Auth plugin for the new architecture
import * as React from 'react';
import type { Plugin } from '../../types/plugin-interface';
import { AuthComponent } from './AuthComponent';

// Plugin definition
export const authPlugin: Plugin = {
  id: 'auth',
  name: 'Authentication',
  component: AuthComponent,
  icon: '🔐',
  order: 15,
};

export default authPlugin;