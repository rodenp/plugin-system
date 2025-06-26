import React from 'react';
import type { CourseBuilderComponents } from '../plugins/course-builder/types';

/**
 * Plugin-aware component loader for course builder components
 * Checks if the course builder plugin is loaded before trying to use components
 */
export class PluginComponentLoader {
  /**
   * Check if the course builder plugin is loaded
   */
  static isCourseBuilderLoaded(): boolean {
    return !!(window as any).__courseFrameworkBuilderComponents;
  }

  /**
   * Get course builder components if the plugin is loaded
   */
  static getCourseBuilderComponents(): CourseBuilderComponents | null {
    if (this.isCourseBuilderLoaded()) {
      return (window as any).__courseFrameworkBuilderComponents;
    }
    return null;
  }

  /**
   * Get a specific course builder component
   */
  static getCourseBuilderComponent<T = React.ComponentType<any>>(
    componentName: keyof CourseBuilderComponents
  ): T | null {
    const components = this.getCourseBuilderComponents();
    if (components && componentName in components) {
      return components[componentName] as T;
    }
    return null;
  }

  /**
   * Create a plugin-aware component wrapper that shows a fallback when plugin isn't loaded
   */
  static createPluginAwareComponent<P = any>(
    componentName: keyof CourseBuilderComponents,
    fallback?: string
  ): React.ComponentType<P> {
    return (props: P) => {
      const Component = this.getCourseBuilderComponent<React.ComponentType<any>>(componentName);
      
      if (Component) {
        return React.createElement(Component as any, props as any);
      }

      // Show fallback message
      const fallbackMessage = fallback || `Course Builder plugin not loaded. Component "${String(componentName)}" is not available.`;
      
      return React.createElement('div', {
        className: 'course-framework-plugin-missing',
        style: {
          padding: '16px',
          border: '1px solid #e5e5e5',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
          color: '#666',
          textAlign: 'center' as const
        }
      }, fallbackMessage);
    };
  }

  /**
   * Create hooks for using course builder components
   */
  static useCourseBuilderComponent<T = React.ComponentType<any>>(
    componentName: keyof CourseBuilderComponents
  ): T | null {
    return this.getCourseBuilderComponent<T>(componentName);
  }

  /**
   * Require course builder plugin - throws error if not loaded
   */
  static requireCourseBuilder(): CourseBuilderComponents {
    const components = this.getCourseBuilderComponents();
    if (!components) {
      throw new Error(
        'Course Builder plugin is required but not loaded. ' +
        'Please register the course builder plugin before using course components.'
      );
    }
    return components;
  }
}

// Export convenience functions
export const {
  isCourseBuilderLoaded,
  getCourseBuilderComponents,
  getCourseBuilderComponent,
  createPluginAwareComponent,
  useCourseBuilderComponent,
  requireCourseBuilder
} = PluginComponentLoader;