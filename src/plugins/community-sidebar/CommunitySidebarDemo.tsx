import * as React from 'react'
import type { PluginProps } from '../../types/plugin-interface'
import { defaultTheme } from '../shared/default-theme'
import { CommunitySidebar } from './components/CommunitySidebar'

export const CommunitySidebarDemo: React.FC<PluginProps> = ({
  community,
  currentUser,
  userRole = 'member',
  theme
}) => {
  const appliedTheme = theme || defaultTheme

  return (
    <div style={{ 
      padding: appliedTheme.spacing.lg,
      backgroundColor: appliedTheme.colors.background,
      minHeight: '500px'
    }}>
      <h2 style={{ 
        fontSize: appliedTheme.font.sizeXl,
        fontWeight: 600,
        marginBottom: appliedTheme.spacing.lg,
        color: appliedTheme.colors.textPrimary
      }}>
        Community Sidebar Demo
      </h2>
      
      <div style={{ 
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <CommunitySidebar
          community={community}
          currentUser={currentUser}
          userRole={userRole}
          theme={appliedTheme}
        />
      </div>
      
      <div style={{
        marginTop: appliedTheme.spacing.xl,
        padding: appliedTheme.spacing.lg,
        backgroundColor: appliedTheme.colors.surface,
        borderRadius: appliedTheme.borders.borderRadius,
        boxShadow: appliedTheme.borders.boxShadow
      }}>
        <h3 style={{ 
          fontSize: appliedTheme.font.sizeLg,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.md,
          color: appliedTheme.colors.textPrimary
        }}>
          Component Info:
        </h3>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          color: appliedTheme.colors.textSecondary
        }}>
          <li style={{ marginBottom: appliedTheme.spacing.xs }}>
            • Community Info Card with stats
          </li>
          <li style={{ marginBottom: appliedTheme.spacing.xs }}>
            • Status/Achievement levels display
          </li>
          <li style={{ marginBottom: appliedTheme.spacing.xs }}>
            • Invite people button
          </li>
          <li style={{ marginBottom: appliedTheme.spacing.xs }}>
            • Responsive design with theme support
          </li>
        </ul>
      </div>
    </div>
  )
}