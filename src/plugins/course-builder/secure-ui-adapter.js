export class SecureUIAdapter {
    components = null;
    overrides = {};
    securityConfig;
    constructor(securityConfig) {
        this.securityConfig = securityConfig;
    }
    setComponents(components) {
        this.components = components;
    }
    setOverrides(overrides) {
        this.overrides = overrides;
    }
    getComponent(componentName) {
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
    hasAccess(componentName) {
        // Simple permission check - can be extended
        const requiredPermissions = {
            CourseEditor: ['edit_courses'],
            CourseViewer: ['view_courses'],
            CourseList: ['view_courses'],
            CreateCourseForm: ['create_courses'],
        };
        const required = requiredPermissions[componentName] || ['view_courses'];
        return required.some(permission => this.securityConfig.userPermissions.includes(permission));
    }
    getAllComponents() {
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
        const accessibleComponents = {};
        for (const [key, component] of Object.entries(this.components)) {
            try {
                accessibleComponents[key] = this.getComponent(key);
            }
            catch {
                // Component not accessible, skip it
            }
        }
        return accessibleComponents;
    }
}
// Factory function for easy creation
export function createSecureUIAdapter(components, overrides = {}, securityConfig = {}) {
    const defaultConfig = {
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
