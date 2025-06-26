// Course Builder Plugin - Public API
// This is what consumers will import: import { CourseBuilderPlugin } from '@my-company/course-builder'
import React from 'react';
// Export only the public interface
export { SimpleCourseBuilderPlugin as CourseBuilderPlugin, createCourseBuilderPlugin } from './simple-plugin';
// Export the plugin for the new architecture
export { courseBuilderPlugin } from './skool-course-builder';
// Export utility hooks for accessing components
export function useCourseBuilderComponent(componentName) {
    const [componentAvailable, setComponentAvailable] = React.useState(false);
    React.useEffect(() => {
        const checkForComponent = () => {
            try {
                const components = window.__courseFrameworkComponents;
                if (components && components[componentName] && typeof components[componentName] === 'function') {
                    setComponentAvailable(true);
                    return true;
                }
                return false;
            }
            catch (error) {
                console.error(`Error checking for component ${componentName}:`, error);
                return false;
            }
        };
        if (checkForComponent()) {
            return;
        }
        // Poll for component availability
        const checkInterval = setInterval(() => {
            if (checkForComponent()) {
                clearInterval(checkInterval);
            }
        }, 100);
        // Cleanup
        return () => clearInterval(checkInterval);
    }, [componentName]);
    // Return the component directly from global if available
    if (componentAvailable) {
        const components = window.__courseFrameworkComponents;
        return components?.[componentName] || null;
    }
    return null;
}
export function useCourseBuilderComponents() {
    return window.__courseFrameworkComponents || null;
}
export function useCourseBuilderConfig() {
    return window.__courseFrameworkConfig || null;
}
// Helper to get the plugin instance (for advanced usage)
export function getCourseBuilderPlugin() {
    return window.__courseFrameworkPlugin || null;
}
// Render helper - requests the plugin to render a component
export function renderCourseBuilderComponent(componentName, props = {}) {
    const plugin = getCourseBuilderPlugin();
    if (!plugin) {
        console.warn('Course builder plugin not initialized');
        return null;
    }
    return plugin.renderComponent(componentName, props);
}
// NOTE: internal/ folder is NOT exported, so consumers cannot access default components
