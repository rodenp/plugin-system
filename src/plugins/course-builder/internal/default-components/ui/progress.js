import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { defaultTheme } from '@/core/theme/default-theme';
const Progress = React.forwardRef(({ value = 0, theme = defaultTheme, style, ...props }, ref) => {
    // Ensure value is between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, value));
    return (_jsx("div", { ref: ref, style: {
            position: 'relative',
            height: '0.5rem', // h-2
            width: '100%',
            overflow: 'hidden',
            borderRadius: '9999px', // rounded-full
            backgroundColor: `${theme.colors.primary || '#3b82f6'}20`, // bg-primary/20
            ...style,
        }, ...props, children: _jsx("div", { style: {
                height: '100%',
                width: '100%',
                flex: 1,
                backgroundColor: theme.colors.primary || '#3b82f6',
                transition: 'transform 0.3s ease',
                transform: `translateX(-${100 - clampedValue}%)`,
            } }) }));
});
Progress.displayName = "Progress";
export { Progress };
