// External Services plugin for the new architecture
import * as React from 'react';
import type { Plugin } from '../../types/plugin-interface';
import { ExternalServicesComponent } from './ExternalServicesComponent';

// Plugin definition
export const externalServicesPlugin: Plugin = {
  id: 'external-services',
  name: 'External Services',
  component: ExternalServicesComponent,
  icon: '🔌',
  order: 13,
};

export default externalServicesPlugin;