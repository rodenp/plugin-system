// UI Injection system for Course Builder Plugin
import type { CourseBuilderComponents } from './types';

export interface UIComponentOverrides {
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
}

export interface UIInjectionConfig {
  components?: UIComponentOverrides;
  theme?: 'default' | 'skool' | 'custom';
  customTheme?: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
    surface?: string;
  };
}

export class UIComponentRegistry {
  private defaultComponents: CourseBuilderComponents | null = null;
  private overrides: UIComponentOverrides = {};
  private currentTheme: string = 'default';

  setDefaultComponents(components: CourseBuilderComponents): void {
    this.defaultComponents = components;
  }

  setOverrides(overrides: UIComponentOverrides): void {
    this.overrides = { ...overrides };
  }

  setTheme(theme: string): void {
    this.currentTheme = theme;
  }

  getComponent<K extends keyof CourseBuilderComponents>(
    componentName: K
  ): CourseBuilderComponents[K] {
    // First check for overrides
    if (this.overrides[componentName]) {
      return this.overrides[componentName] as CourseBuilderComponents[K];
    }

    // Fall back to default components
    if (this.defaultComponents?.[componentName]) {
      return this.defaultComponents[componentName];
    }

    throw new Error(`Component ${String(componentName)} not found in registry`);
  }

  getUIComponent<K extends keyof NonNullable<CourseBuilderComponents['ui']>>(
    componentName: K
  ): NonNullable<CourseBuilderComponents['ui']>[K] {
    // First check for overrides
    if (this.overrides.ui?.[componentName]) {
      return this.overrides.ui[componentName] as NonNullable<CourseBuilderComponents['ui']>[K];
    }

    // Fall back to default components
    if (this.defaultComponents?.ui?.[componentName]) {
      return this.defaultComponents.ui[componentName];
    }

    throw new Error(`UI component ${String(componentName)} not found in registry`);
  }

  getAllComponents(): CourseBuilderComponents {
    if (!this.defaultComponents) {
      throw new Error('Default components not set');
    }

    return {
      ...this.defaultComponents,
      ...this.overrides,
      ui: {
        ...this.defaultComponents.ui,
        ...this.overrides.ui,
      },
    };
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }
}

// Global registry instance
export const uiRegistry = new UIComponentRegistry();

// Helper hooks for consuming components
export function useUIComponent<K extends keyof CourseBuilderComponents>(
  componentName: K
): CourseBuilderComponents[K] {
  return uiRegistry.getComponent(componentName);
}

export function useUIBaseComponent<K extends keyof NonNullable<CourseBuilderComponents['ui']>>(
  componentName: K
): NonNullable<CourseBuilderComponents['ui']>[K] {
  return uiRegistry.getUIComponent(componentName);
}