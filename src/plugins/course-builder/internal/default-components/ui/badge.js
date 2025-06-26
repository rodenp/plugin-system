import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { defaultTheme } from '@/core/theme/default-theme';
function Badge({ variant = 'default', theme = defaultTheme, style, onMouseEnter, onMouseLeave, ...props }) {
    const [isHovered, setIsHovered] = React.useState(false);
    // Base styles
    const baseStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '0.375rem', // rounded-md
        border: '1px solid transparent',
        padding: '0.125rem 0.625rem', // px-2.5 py-0.5
        fontSize: '0.75rem', // text-xs
        fontWeight: '600', // font-semibold
        transition: 'all 0.2s',
    };
    // Variant styles
    const getVariantStyles = () => {
        const hover = isHovered;
        switch (variant) {
            case 'default':
                return {
                    backgroundColor: hover ?
                        (theme.colors.primaryHover || '#2563eb') :
                        (theme.colors.primary || '#3b82f6'),
                    color: theme.colors.white || '#ffffff',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                };
            case 'secondary':
                return {
                    backgroundColor: hover ?
                        (theme.colors.secondaryHover || '#e0e7ff') :
                        (theme.colors.secondary || '#eef2ff'),
                    color: theme.colors.secondaryForeground || '#4f46e5',
                };
            case 'destructive':
                return {
                    backgroundColor: hover ? '#dc2626' : '#ef4444',
                    color: '#ffffff',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                };
            case 'outline':
                return {
                    border: `1px solid ${theme.colors.border || '#e5e7eb'}`,
                    backgroundColor: 'transparent',
                    color: theme.colors.textPrimary || '#111827',
                };
            default:
                return {};
        }
    };
    const handleMouseEnter = (e) => {
        setIsHovered(true);
        onMouseEnter?.(e);
    };
    const handleMouseLeave = (e) => {
        setIsHovered(false);
        onMouseLeave?.(e);
    };
    return (_jsx("div", { style: {
            ...baseStyles,
            ...getVariantStyles(),
            ...style,
        }, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, ...props }));
}
export { Badge };
