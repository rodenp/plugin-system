// Calendar plugin for the new architecture
import * as React from 'react';
import type { Plugin, PluginProps } from '../../types/plugin-interface';
import { CalendarComponent } from './CalendarComponent';

// Plugin definition
export const calendarPlugin: Plugin = {
  id: 'calendar',
  name: 'Calendar',
  component: CalendarComponent,
  icon: '',
  order: 3,
};

export default calendarPlugin;