// Simplified Course Builder Plugin - No Security Layer
import React from 'react';
import type { Plugin, PluginConfig } from '../../types/core';
import type { CourseBuilderComponents } from './types';

export interface SimpleCourseBuilderConfig extends PluginConfig {
  enableRichTextEditor?: boolean;
  enableDragAndDrop?: boolean;
  enableLessonLibrary?: boolean;
  enableTemplates?: boolean;
  theme?: 'default' | 'dark' | 'custom';
  customTheme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  user?: any;
  // Simple UI override system - pass in custom components for the plugin to render
  customComponents?: {
    CourseEditor?: React.ComponentType<any>;
    CourseViewer?: React.ComponentType<any>;
    CourseList?: React.ComponentType<any>;
    CreateCourseForm?: React.ComponentType<any>;
    CourseCard?: React.ComponentType<any>;
    CourseDetails?: React.ComponentType<any>;
    ui?: {
      Badge?: React.ComponentType<any>;
      Button?: React.ComponentType<any>;
      Card?: React.ComponentType<any>;
      Dialog?: React.ComponentType<any>;
      Input?: React.ComponentType<any>;
      Progress?: React.ComponentType<any>;
      Select?: React.ComponentType<any>;
      Switch?: React.ComponentType<any>;
      Tabs?: React.ComponentType<any>;
      Textarea?: React.ComponentType<any>;
    };
  };
  
  // Plugin rendering configuration
  renderTarget?: string | HTMLElement; // Where to render plugin UI
  autoRender?: boolean; // Whether plugin should auto-render its UI
}

export class SimpleCourseBuilderPlugin implements Plugin {
  id = 'course-builder';
  name = 'Course Builder';
  version = '1.0.0';
  description = 'Rich course building interface with customizable UI components';

  private config: SimpleCourseBuilderConfig | null = null;
  private defaultComponents: CourseBuilderComponents | null = null;
  private finalComponents: CourseBuilderComponents | null = null;

  async initialize(config: SimpleCourseBuilderConfig = {}): Promise<void> {
    // Set default configuration
    const defaultConfig: SimpleCourseBuilderConfig = {
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
    (window as any).__courseFrameworkComponents = this.finalComponents;
    (window as any).__courseFrameworkConfig = this.config;
    (window as any).__courseFrameworkPlugin = this;
    
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

  async destroy(): Promise<void> {
    // Clean up global references
    delete (window as any).__courseFrameworkComponents;
    delete (window as any).__courseFrameworkConfig;
    delete (window as any).__courseFrameworkPlugin;
    
    this.config = null;
    this.defaultComponents = null;
    this.finalComponents = null;
    
    console.log(`🧹 ${this.name} plugin destroyed`);
  }

  // Simple merge: custom components override defaults
  private mergeComponents(
    defaults: CourseBuilderComponents, 
    custom?: SimpleCourseBuilderConfig['customComponents']
  ): CourseBuilderComponents {
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
  renderComponent<K extends keyof CourseBuilderComponents>(
    componentName: K, 
    props: any = {}
  ): React.ReactElement | null {
    const Component = this.finalComponents?.[componentName];
    if (!Component) {
      console.warn(`Course builder component "${componentName}" not found`);
      return null;
    }
    return React.createElement(Component, props);
  }

  // Get raw component (for external consumers that need the component class)
  getComponent<K extends keyof CourseBuilderComponents>(componentName: K): CourseBuilderComponents[K] | null {
    return this.finalComponents?.[componentName] || null;
  }

  getComponents(): CourseBuilderComponents | null {
    return this.finalComponents;
  }

  getConfig(): SimpleCourseBuilderConfig | null {
    return this.config;
  }
}

// Factory function for plugin manager compatibility
export function createCourseBuilderPlugin(config?: SimpleCourseBuilderConfig) {
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
    
    onInit: async (manager: any) => {
      await plugin.initialize(config);
      console.log('✅ Course Builder plugin initialized via factory');
    },
    
    onDestroy: async () => {
      await plugin.destroy();
      console.log('🧹 Course Builder plugin destroyed via factory');
    }
  };
}