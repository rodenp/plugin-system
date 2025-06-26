import type { Plugin, PluginConfig } from '../../types/core';
import type { CourseBuilderConfig, CourseBuilderComponents } from './types';
import { createSecureUIAdapter } from './secure-ui-adapter';
import type { UISecurityConfig } from './secure-ui-adapter';

export class CourseBuilderPlugin implements Plugin {
  id = 'course-builder';
  name = 'Course Builder UI';
  version = '1.0.0';
  description = 'Rich course building interface with drag & drop, rich text editor, and templates';

  private config: CourseBuilderConfig | null = null;
  private components: CourseBuilderComponents | null = null;
  private uiAdapter: any = null;

  async initialize(config: PluginConfig): Promise<void> {
    const courseBuilderConfig = config as CourseBuilderConfig;
    
    // Default configuration
    const defaultConfig: CourseBuilderConfig = {
      enableRichTextEditor: courseBuilderConfig?.enableRichTextEditor ?? true,
      enableDragAndDrop: courseBuilderConfig?.enableDragAndDrop ?? true,
      enableLessonLibrary: courseBuilderConfig?.enableLessonLibrary ?? true,
      enableTemplates: courseBuilderConfig?.enableTemplates ?? true,
      theme: courseBuilderConfig?.theme ?? 'default',
      ...(courseBuilderConfig?.customTheme && { customTheme: courseBuilderConfig.customTheme }),
      ...(courseBuilderConfig?.user && { user: courseBuilderConfig.user })
    };

    this.config = defaultConfig;

    // Dynamically import the UI components to avoid bundling if not used
    const componentModule = await import('./internal/default-components');
    this.components = componentModule.components;

    // Create security configuration
    const securityConfig: UISecurityConfig = {
      enableSecurity: courseBuilderConfig?.enableSecurity ?? true,
      allowDefaultUIAccess: courseBuilderConfig?.allowDefaultUIAccess ?? false, // Default: no access to core UI
      userPermissions: courseBuilderConfig?.userPermissions ?? [],
      userRole: courseBuilderConfig?.userRole ?? 'anonymous',
      communityId: courseBuilderConfig?.communityId,
    };

    // Create secure UI adapter
    this.uiAdapter = createSecureUIAdapter(
      this.components,
      courseBuilderConfig?.customComponents || {},
      securityConfig
    );
    
    if (courseBuilderConfig?.customComponents) {
      console.log('  - Custom UI components applied');
    }
    
    // Make components available globally for the framework
    (window as any).__courseFrameworkBuilderComponents = this.uiAdapter.getAllComponents();
    (window as any).__courseFrameworkBuilderConfig = this.config;
    (window as any).__courseFrameworkUser = this.config.user;
    (window as any).__courseFrameworkUIAdapter = this.uiAdapter;
    
    console.log(`✅ ${this.name} plugin initialized`);
    console.log('  - Rich Text Editor:', defaultConfig.enableRichTextEditor ? '✅' : '❌');
    console.log('  - Drag & Drop:', defaultConfig.enableDragAndDrop ? '✅' : '❌');
    console.log('  - Lesson Library:', defaultConfig.enableLessonLibrary ? '✅' : '❌');
    console.log('  - Templates:', defaultConfig.enableTemplates ? '✅' : '❌');
    console.log('  - Theme:', defaultConfig.theme);
    if (defaultConfig.user) {
      console.log('  - User:', defaultConfig.user.name, `(${defaultConfig.user.plan?.name || 'No plan'})`);
    }
  }

  async destroy(): Promise<void> {
    // Clean up global references
    delete (window as any).__courseFrameworkBuilderComponents;
    delete (window as any).__courseFrameworkBuilderConfig;
    delete (window as any).__courseFrameworkUser;
    delete (window as any).__courseFrameworkUIAdapter;
    this.components = null;
    this.config = null;
    this.uiAdapter = null;
    console.log(`🧹 ${this.name} plugin destroyed`);
  }

  getComponents(): CourseBuilderComponents | null {
    return this.components;
  }

  getConfig(): CourseBuilderConfig | null {
    return this.config;
  }
}

// Factory function for easier instantiation
export function createCourseBuilderPlugin(_config?: Partial<CourseBuilderConfig>): CourseBuilderPlugin {
  return new CourseBuilderPlugin();
}