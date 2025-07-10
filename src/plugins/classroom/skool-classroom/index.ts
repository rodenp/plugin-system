// Classroom plugin for the new architecture
import * as React from 'react';
import type { Plugin, PluginProps } from '../../../types/plugin-interface';
import { ClassroomComponent } from './ClassroomComponent';

// Direct component with URL management
const ClassroomWithUrlManagement: React.FC<PluginProps> = (props) => {
  // Use community slug or a default
  const groupname = props.community?.slug || 'courzey';
  const pluginPath = `/${groupname}/classroom`;
  
  // Update document title and URL without causing page reload
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', pluginPath);
      document.title = `Classroom - ${groupname}`;
    }
  }, [groupname, pluginPath]);
  
  return React.createElement(ClassroomComponent, props);
};

// Plugin definition
export const classroomPlugin: Plugin = {
  id: 'classroom',
  name: 'Classroom', 
  component: ClassroomWithUrlManagement,
  dependencies: ['course-builder'], // Depends on course-builder plugin
  icon: '',
  order: 2,
};

export default classroomPlugin;