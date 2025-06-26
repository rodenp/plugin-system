// Course Data plugin for the new architecture
import * as React from 'react';
import type { Plugin } from '../../types/plugin-interface';
import { CourseDataComponent } from './CourseDataComponent';

// Plugin definition
export const courseDataPlugin: Plugin = {
  id: 'course-data',
  name: 'Course Data',
  component: CourseDataComponent,
  icon: '📚',
  order: 12,
};

export default courseDataPlugin;