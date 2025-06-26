import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { defaultTheme } from '@/core/theme/default-theme';
const Card = React.forwardRef(({ style, theme = defaultTheme, ...props }, ref) => (_jsx("div", { ref: ref, style: {
        borderRadius: '0.75rem', // rounded-xl
        border: `1px solid ${theme.colors.border || '#e5e7eb'}`,
        backgroundColor: theme.colors.surface || '#ffffff',
        color: theme.colors.textPrimary || '#111827',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', // shadow
        ...style
    }, ...props })));
Card.displayName = "Card";
const CardHeader = React.forwardRef(({ style, theme = defaultTheme, ...props }, ref) => (_jsx("div", { ref: ref, style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem', // space-y-1.5
        padding: '1.5rem', // p-6
        ...style
    }, ...props })));
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(({ style, theme = defaultTheme, ...props }, ref) => (_jsx("div", { ref: ref, style: {
        fontWeight: '600', // font-semibold
        lineHeight: '1', // leading-none
        letterSpacing: '-0.025em', // tracking-tight
        color: theme.colors.textPrimary || '#111827',
        ...style
    }, ...props })));
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(({ style, theme = defaultTheme, ...props }, ref) => (_jsx("div", { ref: ref, style: {
        fontSize: '0.875rem', // text-sm
        color: theme.colors.textSecondary || '#6b7280', // text-muted-foreground
        ...style
    }, ...props })));
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(({ style, theme = defaultTheme, ...props }, ref) => (_jsx("div", { ref: ref, style: {
        padding: '1.5rem', // p-6
        paddingTop: '0', // pt-0
        ...style
    }, ...props })));
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(({ style, theme = defaultTheme, ...props }, ref) => (_jsx("div", { ref: ref, style: {
        display: 'flex',
        alignItems: 'center',
        padding: '1.5rem', // p-6
        paddingTop: '0', // pt-0
        ...style
    }, ...props })));
CardFooter.displayName = "CardFooter";
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
