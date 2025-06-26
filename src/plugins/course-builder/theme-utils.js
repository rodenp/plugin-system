// Theme utilities for course-builder components
// This allows components to use theme colors via CSS custom properties
export const getThemeColors = () => {
    // Try to get theme from global Skool theme system
    const skoolTheme = window.__skoolTheme;
    if (skoolTheme?.colors) {
        return {
            primary: skoolTheme.colors.secondary || '#22c55e',
            secondary: skoolTheme.colors.accent || '#16a34a',
            success: skoolTheme.colors.secondary || '#22c55e',
            error: skoolTheme.colors.danger || '#ef4444',
            warning: '#f59e0b',
            info: skoolTheme.colors.level || '#2563eb',
            accent: '#8b5cf6' // purple for templates/library
        };
    }
    // Fallback to default theme colors
    return {
        primary: '#22c55e',
        secondary: '#16a34a',
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#2563eb',
        accent: '#8b5cf6'
    };
};
export const applyThemeColors = () => {
    const colors = getThemeColors();
    const root = document.documentElement;
    // Set CSS custom properties for colors
    root.style.setProperty('--course-builder-primary', colors.primary);
    root.style.setProperty('--course-builder-secondary', colors.secondary);
    root.style.setProperty('--course-builder-success', colors.success);
    root.style.setProperty('--course-builder-error', colors.error);
    root.style.setProperty('--course-builder-warning', colors.warning);
    root.style.setProperty('--course-builder-info', colors.info);
    root.style.setProperty('--course-builder-accent', colors.accent);
    // Set CSS custom properties for common styles
    root.style.setProperty('--course-builder-bg-primary', colors.primary);
    root.style.setProperty('--course-builder-bg-secondary', colors.secondary);
    root.style.setProperty('--course-builder-bg-muted', '#f9fafb');
    root.style.setProperty('--course-builder-bg-surface', '#ffffff');
    root.style.setProperty('--course-builder-text-primary', '#111827');
    root.style.setProperty('--course-builder-text-secondary', '#6b7280');
    root.style.setProperty('--course-builder-text-muted', '#9ca3af');
    root.style.setProperty('--course-builder-border', '#e5e7eb');
    root.style.setProperty('--course-builder-border-muted', '#f3f4f6');
    root.style.setProperty('--course-builder-shadow', '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)');
    root.style.setProperty('--course-builder-shadow-lg', '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)');
};
// Apply theme colors when this module is loaded
applyThemeColors();
