export class UIComponentRegistry {
    defaultComponents = null;
    overrides = {};
    currentTheme = 'default';
    setDefaultComponents(components) {
        this.defaultComponents = components;
    }
    setOverrides(overrides) {
        this.overrides = { ...overrides };
    }
    setTheme(theme) {
        this.currentTheme = theme;
    }
    getComponent(componentName) {
        // First check for overrides
        if (this.overrides[componentName]) {
            return this.overrides[componentName];
        }
        // Fall back to default components
        if (this.defaultComponents?.[componentName]) {
            return this.defaultComponents[componentName];
        }
        throw new Error(`Component ${String(componentName)} not found in registry`);
    }
    getUIComponent(componentName) {
        // First check for overrides
        if (this.overrides.ui?.[componentName]) {
            return this.overrides.ui[componentName];
        }
        // Fall back to default components
        if (this.defaultComponents?.ui?.[componentName]) {
            return this.defaultComponents.ui[componentName];
        }
        throw new Error(`UI component ${String(componentName)} not found in registry`);
    }
    getAllComponents() {
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
    getCurrentTheme() {
        return this.currentTheme;
    }
}
// Global registry instance
export const uiRegistry = new UIComponentRegistry();
// Helper hooks for consuming components
export function useUIComponent(componentName) {
    return uiRegistry.getComponent(componentName);
}
export function useUIBaseComponent(componentName) {
    return uiRegistry.getUIComponent(componentName);
}
