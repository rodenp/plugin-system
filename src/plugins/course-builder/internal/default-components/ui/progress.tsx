import * as React from "react"
import { defaultTheme } from '@/core/theme/default-theme';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  theme?: typeof defaultTheme;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, theme = defaultTheme, style, ...props }, ref) => {
    // Ensure value is between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        style={{
          position: 'relative',
          height: '0.5rem', // h-2
          width: '100%',
          overflow: 'hidden',
          borderRadius: '9999px', // rounded-full
          backgroundColor: `${theme.colors.primary || '#3b82f6'}20`, // bg-primary/20
          ...style,
        }}
        {...props}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            flex: 1,
            backgroundColor: theme.colors.primary || '#3b82f6',
            transition: 'transform 0.3s ease',
            transform: `translateX(-${100 - clampedValue}%)`,
          }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress"

export { Progress }