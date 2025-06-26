// Secure UI Registry with access control
import type { CourseBuilderComponents } from '../plugins/course-builder/types';

export interface UIAccessContext {
  userRole: 'admin' | 'community_owner' | 'member' | 'anonymous';
  permissions: string[];
  communityId?: string;
  userId?: string;
  isSystemAdmin?: boolean;
}

export interface SecureUIComponentOverrides {
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

export class SecureUIComponentRegistry {
  private defaultComponents: CourseBuilderComponents | null = null;
  private overrides: Map<string, SecureUIComponentOverrides> = new Map();
  private accessControl: Map<string, UIAccessContext> = new Map();
  private currentTheme: string = 'default';

  // Set default components (only accessible by system admin)
  setDefaultComponents(components: CourseBuilderComponents, context: UIAccessContext): void {
    if (!this.isSystemAdmin(context)) {
      throw new Error('Access denied: Only system administrators can set default components');
    }
    this.defaultComponents = components;
  }

  // Register community-specific UI overrides
  registerCommunityUI(
    communityId: string, 
    overrides: SecureUIComponentOverrides,
    context: UIAccessContext
  ): void {
    // Only community owners or system admins can register custom UI
    if (!this.canManageCommunityUI(communityId, context)) {
      throw new Error('Access denied: Insufficient permissions to register UI for this community');
    }

    this.overrides.set(communityId, overrides);
    this.accessControl.set(communityId, context);
    
    console.log(`🔒 UI components registered for community ${communityId}`);
  }

  // Get component with security checks
  getComponent<K extends keyof CourseBuilderComponents>(
    componentName: K,
    context: UIAccessContext,
    communityId?: string
  ): CourseBuilderComponents[K] {
    // Check if user has access to request components
    if (!this.hasComponentAccess(context, componentName)) {
      throw new Error(`Access denied: No permission to access ${String(componentName)} component`);
    }

    // First try community-specific overrides
    if (communityId) {
      const communityOverrides = this.overrides.get(communityId);
      if (communityOverrides?.[componentName]) {
        // Verify user has access to this community's custom UI
        if (this.hasCommunityAccess(communityId, context)) {
          return communityOverrides[componentName] as CourseBuilderComponents[K];
        }
      }
    }

    // Fall back to default components (only if user has appropriate access)
    if (this.canAccessDefaultUI(context)) {
      if (this.defaultComponents?.[componentName]) {
        return this.defaultComponents[componentName];
      }
    }

    throw new Error(`Component ${String(componentName)} not available or access denied`);
  }

  // Get UI component with security checks
  getUIComponent<K extends keyof NonNullable<CourseBuilderComponents['ui']>>(
    componentName: K,
    context: UIAccessContext,
    communityId?: string
  ): NonNullable<CourseBuilderComponents['ui']>[K] {
    if (!this.hasComponentAccess(context, componentName)) {
      throw new Error(`Access denied: No permission to access ${String(componentName)} UI component`);
    }

    // Try community-specific overrides first
    if (communityId) {
      const communityOverrides = this.overrides.get(communityId);
      if (communityOverrides?.ui?.[componentName]) {
        if (this.hasCommunityAccess(communityId, context)) {
          return communityOverrides.ui[componentName] as NonNullable<CourseBuilderComponents['ui']>[K];
        }
      }
    }

    // Fall back to default UI components
    if (this.canAccessDefaultUI(context)) {
      if (this.defaultComponents?.ui?.[componentName]) {
        return this.defaultComponents.ui[componentName];
      }
    }

    throw new Error(`UI component ${String(componentName)} not available or access denied`);
  }

  // Security check methods
  private isSystemAdmin(context: UIAccessContext): boolean {
    return context.isSystemAdmin === true || context.userRole === 'admin';
  }

  private canManageCommunityUI(communityId: string, context: UIAccessContext): boolean {
    return (
      this.isSystemAdmin(context) ||
      (context.userRole === 'community_owner' && context.communityId === communityId) ||
      context.permissions.includes('manage_community_ui')
    );
  }

  private hasCommunityAccess(communityId: string, context: UIAccessContext): boolean {
    return (
      this.isSystemAdmin(context) ||
      context.communityId === communityId ||
      context.permissions.includes('access_all_communities')
    );
  }

  private hasComponentAccess(context: UIAccessContext, componentName: string | symbol): boolean {
    // Anonymous users have no access to components
    if (context.userRole === 'anonymous') {
      return false;
    }

    // System admins have access to everything
    if (this.isSystemAdmin(context)) {
      return true;
    }

    // Check specific component permissions
    const componentPermissions: Record<string, string[]> = {
      'CourseEditor': ['edit_courses', 'manage_content'],
      'CourseViewer': ['view_courses'],
      'CourseList': ['view_courses'],
      'CreateCourseForm': ['create_courses', 'manage_content'],
      'CourseCard': ['view_courses'],
      'CourseDetails': ['view_courses', 'manage_content'],
    };

    const requiredPermissions = componentPermissions[String(componentName)] || ['view_courses'];
    return requiredPermissions.some(permission => context.permissions.includes(permission));
  }

  private canAccessDefaultUI(context: UIAccessContext): boolean {
    // Default UI is only accessible to system admins or in fallback scenarios
    // Communities should use their custom UI or have no access
    return (
      this.isSystemAdmin(context) ||
      context.permissions.includes('access_default_ui') ||
      // Fallback for legitimate use cases where no custom UI is provided
      (context.userRole === 'community_owner' && !context.communityId)
    );
  }

  // Public methods for controlled access
  getCurrentTheme(): string {
    return this.currentTheme;
  }

  setTheme(theme: string, context: UIAccessContext): void {
    if (!this.isSystemAdmin(context) && !context.permissions.includes('manage_theme')) {
      throw new Error('Access denied: Insufficient permissions to change theme');
    }
    this.currentTheme = theme;
  }

  // Admin method to revoke community UI access
  revokeCommunityUI(communityId: string, context: UIAccessContext): void {
    if (!this.isSystemAdmin(context)) {
      throw new Error('Access denied: Only system administrators can revoke community UI');
    }
    
    this.overrides.delete(communityId);
    this.accessControl.delete(communityId);
    console.log(`🔒 UI access revoked for community ${communityId}`);
  }

  // Audit method for security monitoring
  getAccessAudit(context: UIAccessContext): any {
    if (!this.isSystemAdmin(context)) {
      throw new Error('Access denied: Only system administrators can access audit information');
    }

    return {
      registeredCommunities: Array.from(this.overrides.keys()),
      activeTheme: this.currentTheme,
      hasDefaultComponents: !!this.defaultComponents,
      accessContexts: Object.fromEntries(this.accessControl),
    };
  }
}

// Global secure registry instance
export const secureUIRegistry = new SecureUIComponentRegistry();

// Helper hooks with security context
export function useSecureUIComponent<K extends keyof CourseBuilderComponents>(
  componentName: K,
  context: UIAccessContext,
  communityId?: string
): CourseBuilderComponents[K] {
  return secureUIRegistry.getComponent(componentName, context, communityId);
}

export function useSecureUIBaseComponent<K extends keyof NonNullable<CourseBuilderComponents['ui']>>(
  componentName: K,
  context: UIAccessContext,
  communityId?: string
): NonNullable<CourseBuilderComponents['ui']>[K] {
  return secureUIRegistry.getUIComponent(componentName, context, communityId);
}