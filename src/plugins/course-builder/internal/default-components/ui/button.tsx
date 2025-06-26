import * as React from "react"
import { defaultTheme } from '@/core/theme/default-theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  theme?: typeof defaultTheme;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', theme = defaultTheme, style, onMouseEnter, onMouseLeave, disabled, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);

    // Base styles
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem', // gap-2
      whiteSpace: 'nowrap',
      borderRadius: '0.375rem', // rounded-md
      fontSize: '0.875rem', // text-sm
      fontWeight: '500', // font-medium
      transition: 'all 0.2s',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      border: 'none',
      outline: 'none',
      position: 'relative',
    };

    // Size styles
    const sizeStyles = {
      default: {
        height: '2.25rem', // h-9
        padding: '0.5rem 1rem', // px-4 py-2
      },
      sm: {
        height: '2rem', // h-8
        padding: '0.5rem 0.75rem', // px-3
        fontSize: '0.75rem', // text-xs
      },
      lg: {
        height: '2.5rem', // h-10
        padding: '0.5rem 2rem', // px-8
      },
      icon: {
        height: '2.25rem', // h-9
        width: '2.25rem', // w-9
        padding: '0',
      },
    };

    // Variant styles
    const getVariantStyles = (): React.CSSProperties => {
      const hover = isHovered && !disabled;
      
      switch (variant) {
        case 'default':
          return {
            backgroundColor: hover ? theme.colors.primaryHover || '#2563eb' : theme.colors.primary || '#3b82f6',
            color: theme.colors.white || '#ffffff',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          };
        case 'destructive':
          return {
            backgroundColor: hover ? '#dc2626' : '#ef4444',
            color: '#ffffff',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          };
        case 'outline':
          return {
            border: `1px solid ${theme.colors.border || '#e5e7eb'}`,
            backgroundColor: hover ? theme.colors.backgroundAlt || '#f9fafb' : theme.colors.surface || '#ffffff',
            color: hover ? theme.colors.primary || '#3b82f6' : theme.colors.textPrimary || '#111827',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          };
        case 'secondary':
          return {
            backgroundColor: hover ? theme.colors.secondaryHover || '#e0e7ff' : theme.colors.secondary || '#eef2ff',
            color: theme.colors.secondaryForeground || '#4f46e5',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          };
        case 'ghost':
          return {
            backgroundColor: hover ? theme.colors.backgroundAlt || '#f9fafb' : 'transparent',
            color: hover ? theme.colors.primary || '#3b82f6' : theme.colors.textPrimary || '#111827',
          };
        case 'link':
          return {
            backgroundColor: 'transparent',
            color: theme.colors.primary || '#3b82f6',
            textDecoration: hover ? 'underline' : 'none',
            textUnderlineOffset: '4px',
          };
        default:
          return {};
      }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(true);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(false);
      onMouseLeave?.(e);
    };

    return (
      <button
        ref={ref}
        style={{
          ...baseStyles,
          ...sizeStyles[size],
          ...getVariantStyles(),
          ...style,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        {...props}
      />
    );
  }
)
Button.displayName = "Button"

export { Button }