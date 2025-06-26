// Classroom plugin for the new architecture
import * as React from 'react';
import type { Plugin, PluginProps } from '../../../types/plugin-interface';
import { ClassroomComponent } from './ClassroomComponent';
import { CourseProvider } from '../../../core/course-context';

// Wrapper component that provides CourseProvider
const ClassroomWithProvider: React.FC<PluginProps> = (props) => {
  return React.createElement(
    CourseProvider,
    null,
    React.createElement(ClassroomComponent, props)
  );
};

// Plugin definition
export const classroomPlugin: Plugin = {
  id: 'classroom',
  name: 'Classroom', 
  component: ClassroomWithProvider,
  dependencies: ['course-builder'], // Depends on course-builder plugin
  icon: '',
  order: 2,
};

export default classroomPlugin;