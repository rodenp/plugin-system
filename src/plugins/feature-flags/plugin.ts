// Feature Flags plugin for the new architecture
import * as React from 'react';
import type { Plugin } from '../../types/plugin-interface';
import { FeatureFlagsComponent } from './FeatureFlagsComponent';

// Plugin definition
export const featureFlagsPlugin: Plugin = {
  id: 'feature-flags',
  name: 'Feature Flags',
  component: FeatureFlagsComponent,
  icon: '🎛️',
  order: 14,
};

export default featureFlagsPlugin;