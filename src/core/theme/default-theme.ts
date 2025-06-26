import type { ThemeTokens } from './theme-tokens';

export const defaultTheme: ThemeTokens = {
  colors: {
    background: '#f7f5f3',
    surface: '#ffffff',
    surfaceAlt: '#f1f1f1',
    highlight: '#facc15',
    secondary: '#0066cc',
    accent: '#22c55e',
    danger: '#ef4444',
    muted: '#999999',
    textPrimary: '#111827',
    textSecondary: '#666666',
    level: '#2563eb'
  },
  borders: {
    borderColor: '#e5e5e5',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  },
  font: {
    family: "'Inter', sans-serif",
    sizeXs: '0.75rem',
    sizeSm: '0.875rem',
    sizeMd: '1rem',
    sizeLg: '1.25rem',
    sizeXl: '1.5rem',
    size2xl: '2rem'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
    elevation: {
    shadow: '0 1px 3px rgba(0,0,0,0.1)',
    shadowHover: '0 4px 6px rgba(0,0,0,0.15)',
  }
};