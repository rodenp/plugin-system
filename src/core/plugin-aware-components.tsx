import React from 'react';
import { PluginComponentLoader } from './plugin-component-loader';

/**
 * Plugin-aware wrapper components that work with or without the course builder plugin
 * These provide a safe API for using course builder components
 */

/**
 * Course Editor that works with or without the course builder plugin
 */
export const CourseEditor = PluginComponentLoader.createPluginAwareComponent(
  'CourseEditor',
  'Course Editor requires the Course Builder plugin. Please register the plugin to enable rich course editing features.'
);

/**
 * Course Viewer that works with or without the course builder plugin
 */
export const CourseViewer = PluginComponentLoader.createPluginAwareComponent(
  'CourseViewer',
  'Course Viewer requires the Course Builder plugin. Please register the plugin to enable course viewing features.'
);

/**
 * Course List that works with or without the course builder plugin
 */
export const CourseList = PluginComponentLoader.createPluginAwareComponent(
  'CourseList',
  'Course List requires the Course Builder plugin. Please register the plugin to enable course listing features.'
);

/**
 * Course Card that works with or without the course builder plugin
 */
export const CourseCard = PluginComponentLoader.createPluginAwareComponent(
  'CourseCard',
  'Course Card requires the Course Builder plugin. Please register the plugin to enable course card display.'
);

/**
 * Create Course Form that works with or without the course builder plugin
 */
export const CreateCourseForm = PluginComponentLoader.createPluginAwareComponent(
  'CreateCourseForm',
  'Create Course Form requires the Course Builder plugin. Please register the plugin to enable course creation features.'
);

/**
 * Hook to check if course builder components are available
 */
export function useCourseBuilderAvailable(): boolean {
  return PluginComponentLoader.isCourseBuilderLoaded();
}

/**
 * Hook to get course builder components (returns null if not loaded)
 */
export function useCourseBuilderComponents() {
  return PluginComponentLoader.getCourseBuilderComponents();
}

/**
 * Higher-order component that renders children only if course builder is loaded
 */
export function WithCourseBuilder({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isLoaded = useCourseBuilderAvailable();
  
  if (!isLoaded) {
    return fallback || (
      <div className="course-framework-plugin-missing" style={{
        padding: '16px',
        border: '1px solid #e5e5e5',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9',
        color: '#666',
        textAlign: 'center'
      }}>
        Course Builder plugin is required for this feature.
      </div>
    );
  }
  
  return <>{children}</>;
}