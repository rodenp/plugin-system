import * as React from 'react'

interface WritePostSectionProps {
  currentUser: any
  theme: any
  onClick: () => void
}

export const WritePostSection: React.FC<WritePostSectionProps> = ({ 
  currentUser, 
  theme, 
  onClick 
}) => {
  return (
    <div 
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borders.borderRadius,
        boxShadow: theme.borders.boxShadow,
        padding: theme.spacing.lg,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: `1px solid ${theme.borders.borderColor}`
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = theme.borders.boxShadow
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: theme.spacing.md 
      }}>
        {/* User Avatar */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: theme.colors.secondary,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 600,
          color: 'white',
          fontSize: theme.font.sizeMd,
          flexShrink: 0
        }}>
          {currentUser?.profile?.displayName?.charAt(0) || 'U'}
        </div>
        
        {/* Write Something Input */}
        <div style={{
          flex: 1,
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          backgroundColor: theme.colors.surfaceAlt,
          border: `1px solid ${theme.borders.borderColor}`,
          borderRadius: '25px',
          color: theme.colors.textSecondary,
          fontSize: theme.font.sizeMd,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          Write something...
        </div>
      </div>
    </div>
  )
}