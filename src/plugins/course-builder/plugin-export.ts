// Export course-builder as a plugin for the new registry system
import * as React from 'react';
import type { Plugin } from '../../types/plugin-interface';
import { pluginRegistry } from '../../store/plugin-registry';
import { createCourseBuilderPlugin } from './simple-plugin';

// Initialize the actual course builder plugin when this is loaded
let courseBuilderInstance: any = null;

// Function to ensure course builder is initialized
const ensureCourseBuilderInitialized = async () => {
  if (!courseBuilderInstance) {
    console.log('🔄 Initializing Course Builder plugin...');
    courseBuilderInstance = createCourseBuilderPlugin({ 
      enableRichTextEditor: true,
      enableDragAndDrop: true,
      enableLessonLibrary: true,
      enableTemplates: true,
      theme: 'default'
    });
    
    // Call the onInit method to actually initialize the plugin
    if (courseBuilderInstance.onInit) {
      await courseBuilderInstance.onInit(null);
    }
    
    console.log('✅ Course Builder plugin initialized');
    console.log('✅ Global components set:', !!(window as any).__courseFrameworkComponents);
    if ((window as any).__courseFrameworkComponents) {
      console.log('✅ Available components:', Object.keys((window as any).__courseFrameworkComponents));
    }
  }
  return courseBuilderInstance;
};

// Don't initialize immediately - wait for plugin installation
// ensureCourseBuilderInitialized().catch(console.error);

// Dummy component - the actual course-builder functionality is accessed via hooks
const CourseBuilderComponent: React.FC<any> = ({ theme }) => {
  // Set global theme for course-builder to use
  React.useEffect(() => {
    if (theme) {
      (window as any).__skoolTheme = theme;
      // Apply theme colors to course-builder components
      import('./theme-utils').then(({ applyThemeColors }) => {
        applyThemeColors();
      });
    }
  }, [theme]);

  // Component no longer needs to initialize - handled by onInstall
  return React.createElement('div', { className: 'p-6' },
    React.createElement('div', { className: 'text-center text-gray-500' },
      'Course Builder functionality is accessed through other plugins.'
    )
  );
};

// Plugin definition for course-builder
export const courseBuilderPlugin: Plugin = {
  id: 'course-builder',
  name: 'Course Builder',
  component: CourseBuilderComponent,
  icon: '',
  order: 0, // Base plugin
  // Initialize the course builder when this plugin is installed
  onInstall: async () => {
    console.log('📦 Course Builder onInstall called');
    await ensureCourseBuilderInitialized();
    
    // Register components with service registry
    const components = (window as any).__courseFrameworkComponents;
    if (components) {
      pluginRegistry.registerService('course-builder', {
        version: '1.0.0',
        components: {
          CreateCourseForm: components.CreateCourseForm,
          CourseEditor: components.CourseEditor,
          CourseViewer: components.CourseViewer,
          // Add other components as needed
        }
      });
      console.log('✅ Course Builder components registered with service registry');
    } else {
      console.warn('⚠️ Course Builder components not available for service registry');
    }
    
    console.log('✅ Course Builder initialized in onInstall');
  },
};

export default courseBuilderPlugin;