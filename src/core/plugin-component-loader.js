import React from 'react';
/**
 * Plugin-aware component loader for course builder components
 * Checks if the course builder plugin is loaded before trying to use components
 */
export class PluginComponentLoader {
    /**
     * Check if the course builder plugin is loaded
     */
    static isCourseBuilderLoaded() {
        return !!window.__courseFrameworkBuilderComponents;
    }
    /**
     * Get course builder components if the plugin is loaded
     */
    static getCourseBuilderComponents() {
        if (this.isCourseBuilderLoaded()) {
            return window.__courseFrameworkBuilderComponents;
        }
        return null;
    }
    /**
     * Get a specific course builder component
     */
    static getCourseBuilderComponent(componentName) {
        const components = this.getCourseBuilderComponents();
        if (components && componentName in components) {
            return components[componentName];
        }
        return null;
    }
    /**
     * Create a plugin-aware component wrapper that shows a fallback when plugin isn't loaded
     */
    static createPluginAwareComponent(componentName, fallback) {
        return (props) => {
            const Component = this.getCourseBuilderComponent(componentName);
            if (Component) {
                return React.createElement(Component, props);
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
                    textAlign: 'center'
                }
            }, fallbackMessage);
        };
    }
    /**
     * Create hooks for using course builder components
     */
    static useCourseBuilderComponent(componentName) {
        return this.getCourseBuilderComponent(componentName);
    }
    /**
     * Require course builder plugin - throws error if not loaded
     */
    static requireCourseBuilder() {
        const components = this.getCourseBuilderComponents();
        if (!components) {
            throw new Error('Course Builder plugin is required but not loaded. ' +
                'Please register the course builder plugin before using course components.');
        }
        return components;
    }
}
// Export convenience functions
export const { isCourseBuilderLoaded, getCourseBuilderComponents, getCourseBuilderComponent, createPluginAwareComponent, useCourseBuilderComponent, requireCourseBuilder } = PluginComponentLoader;
