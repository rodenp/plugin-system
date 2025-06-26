// Secure UI Adapter - Lightweight security layer for UI components
import type { CourseBuilderComponents } from './types';

export interface UISecurityConfig {
  enableSecurity: boolean;
  allowDefaultUIAccess: boolean;
  communityId?: string;
  userPermissions: string[];
  userRole: 'admin' | 'community_owner' | 'member' | 'anonymous';
}

export class SecureUIAdapter {
  private components: CourseBuilderComponents | null = null;
  private overrides: any = {};
  private securityConfig: UISecurityConfig;

  constructor(securityConfig: UISecurityConfig) {
    this.securityConfig = securityConfig;
  }

  setComponents(components: CourseBuilderComponents): void {
    this.components = components;
  }

  setOverrides(overrides: any): void {
    this.overrides = overrides;
  }

  getComponent(componentName: keyof CourseBuilderComponents): any {
    // If security is disabled, return components directly
    if (!this.securityConfig.enableSecurity) {
      return this.overrides[componentName] || this.components?.[componentName];
    }

    // Check for custom component first
    if (this.overrides[componentName]) {
      if (this.hasAccess(componentName)) {
        return this.overrides[componentName];
      }
    }

    // Fall back to default component only if allowed
    if (this.securityConfig.allowDefaultUIAccess && this.hasAccess(componentName)) {
      return this.components?.[componentName];
    }

    // Return null or throw error for no access
    throw new Error(`Access denied to component: ${String(componentName)}`);
  }

  private hasAccess(componentName: keyof CourseBuilderComponents): boolean {
    // Simple permission check - can be extended
    const requiredPermissions: Record<string, string[]> = {
      CourseEditor: ['edit_courses'],
      CourseViewer: ['view_courses'],
      CourseList: ['view_courses'],
      CreateCourseForm: ['create_courses'],
    };

    const required = requiredPermissions[componentName as string] || ['view_courses'];
    return required.some(permission => this.securityConfig.userPermissions.includes(permission));
  }

  getAllComponents(): CourseBuilderComponents {
    if (!this.components) {
      throw new Error('Components not initialized');
    }

    // If security disabled, return everything
    if (!this.securityConfig.enableSecurity) {
      return {
        ...this.components,
        ...this.overrides,
      };
    }

    // Filter components based on access
    const accessibleComponents: any = {};
    
    for (const [key, component] of Object.entries(this.components)) {
      try {
        accessibleComponents[key] = this.getComponent(key as keyof CourseBuilderComponents);
      } catch {
        // Component not accessible, skip it
      }
    }

    return accessibleComponents as CourseBuilderComponents;
  }
}

// Factory function for easy creation
export function createSecureUIAdapter(
  components: CourseBuilderComponents,
  overrides: any = {},
  securityConfig: Partial<UISecurityConfig> = {}
): SecureUIAdapter {
  const defaultConfig: UISecurityConfig = {
    enableSecurity: true,
    allowDefaultUIAccess: false, // Default: communities can't access core UI
    userPermissions: [],
    userRole: 'anonymous',
    ...securityConfig,
  };

  const adapter = new SecureUIAdapter(defaultConfig);
  adapter.setComponents(components);
  adapter.setOverrides(overrides);

  return adapter;
}