// Simplified Course Builder Plugin - No Security Layer
import React from 'react';
export class SimpleCourseBuilderPlugin {
    id = 'course-builder';
    name = 'Course Builder';
    version = '1.0.0';
    description = 'Rich course building interface with customizable UI components';
    config = null;
    defaultComponents = null;
    finalComponents = null;
    async initialize(config = {}) {
        // Set default configuration
        const defaultConfig = {
            enableRichTextEditor: config.enableRichTextEditor ?? true,
            enableDragAndDrop: config.enableDragAndDrop ?? true,
            enableLessonLibrary: config.enableLessonLibrary ?? true,
            enableTemplates: config.enableTemplates ?? true,
            theme: config.theme ?? 'default',
            customTheme: config.customTheme,
            user: config.user,
            customComponents: config.customComponents,
        };
        this.config = defaultConfig;
        // Load default components from internal folder (hidden from consumers)
        const defaultModule = await import('./internal/default-components');
        this.defaultComponents = defaultModule.components;
        // Create final component set: custom components override defaults
        this.finalComponents = this.mergeComponents(this.defaultComponents, config.customComponents);
        // Make components and plugin available globally
        window.__courseFrameworkComponents = this.finalComponents;
        window.__courseFrameworkConfig = this.config;
        window.__courseFrameworkPlugin = this;
        console.log(`✅ ${this.name} plugin initialized`);
        if (config.customComponents) {
            console.log('  - Custom UI components applied:', Object.keys(config.customComponents));
            console.log('  - CourseEditor override:', !!config.customComponents.CourseEditor);
        }
        console.log('  - Final CourseEditor:', this.finalComponents.CourseEditor?.name || 'Unknown');
        console.log('  - Rich Text Editor:', defaultConfig.enableRichTextEditor ? '✅' : '❌');
        console.log('  - Drag & Drop:', defaultConfig.enableDragAndDrop ? '✅' : '❌');
        console.log('  - Lesson Library:', defaultConfig.enableLessonLibrary ? '✅' : '❌');
        console.log('  - Templates:', defaultConfig.enableTemplates ? '✅' : '❌');
        console.log('  - Theme:', defaultConfig.theme);
    }
    async destroy() {
        // Clean up global references
        delete window.__courseFrameworkComponents;
        delete window.__courseFrameworkConfig;
        delete window.__courseFrameworkPlugin;
        this.config = null;
        this.defaultComponents = null;
        this.finalComponents = null;
        console.log(`🧹 ${this.name} plugin destroyed`);
    }
    // Simple merge: custom components override defaults
    mergeComponents(defaults, custom) {
        if (!custom) {
            return defaults;
        }
        return {
            // Main components - custom overrides default
            CourseEditor: custom.CourseEditor || defaults.CourseEditor,
            CourseViewer: custom.CourseViewer || defaults.CourseViewer,
            CourseList: custom.CourseList || defaults.CourseList,
            CreateCourseForm: custom.CreateCourseForm || defaults.CreateCourseForm,
            CourseCard: custom.CourseCard || defaults.CourseCard,
            CourseDetails: custom.CourseDetails || defaults.CourseDetails,
            // UI components - merge with custom overrides
            ui: {
                Badge: custom.ui?.Badge || defaults.ui.Badge,
                Button: custom.ui?.Button || defaults.ui.Button,
                Card: custom.ui?.Card || defaults.ui.Card,
                Dialog: custom.ui?.Dialog || defaults.ui.Dialog,
                Input: custom.ui?.Input || defaults.ui.Input,
                Progress: custom.ui?.Progress || defaults.ui.Progress,
                Select: custom.ui?.Select || defaults.ui.Select,
                Switch: custom.ui?.Switch || defaults.ui.Switch,
                Tabs: custom.ui?.Tabs || defaults.ui.Tabs,
                Textarea: custom.ui?.Textarea || defaults.ui.Textarea,
            },
        };
    }
    // Public API for requesting rendered UI components
    renderComponent(componentName, props = {}) {
        const Component = this.finalComponents?.[componentName];
        if (!Component) {
            console.warn(`Course builder component "${componentName}" not found`);
            return null;
        }
        return React.createElement(Component, props);
    }
    // Get raw component (for external consumers that need the component class)
    getComponent(componentName) {
        return this.finalComponents?.[componentName] || null;
    }
    getComponents() {
        return this.finalComponents;
    }
    getConfig() {
        return this.config;
    }
}
// Factory function for plugin manager compatibility
export function createCourseBuilderPlugin(config) {
    const plugin = new SimpleCourseBuilderPlugin();
    return {
        name: 'course-builder',
        version: '1.0.0',
        dependencies: [],
        components: {}, // Will be populated after initialization
        hooks: {
            useCourseBuilder: () => {
                const [courses, setCourses] = React.useState([]);
                const [loading, setLoading] = React.useState(false);
                return {
                    courses,
                    setCourses,
                    loading,
                    setLoading
                };
            }
        },
        routes: [],
        onInit: async (manager) => {
            await plugin.initialize(config);
            console.log('✅ Course Builder plugin initialized via factory');
        },
        onDestroy: async () => {
            await plugin.destroy();
            console.log('🧹 Course Builder plugin destroyed via factory');
        }
    };
}
