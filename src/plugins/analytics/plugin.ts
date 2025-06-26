// Analytics plugin for the new architecture
import * as React from 'react';
import type { Plugin } from '../../types/plugin-interface';
import { AnalyticsComponent } from './AnalyticsComponent';

// Plugin definition
export const analyticsPlugin: Plugin = {
  id: 'analytics',
  name: 'Analytics',
  component: AnalyticsComponent,
  icon: '📊',
  order: 8,
};

export default analyticsPlugin;