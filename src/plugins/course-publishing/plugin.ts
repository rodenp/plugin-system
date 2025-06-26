// Course Publishing plugin for the new architecture
import * as React from 'react';
import type { Plugin } from '../../types/plugin-interface';
import { CoursePublishingComponent } from './CoursePublishingComponent';

// Plugin definition
export const coursePublishingPlugin: Plugin = {
  id: 'course-publishing',
  name: 'Course Publishing',
  component: CoursePublishingComponent,
  icon: '📚',
  order: 16,
};

export default coursePublishingPlugin;