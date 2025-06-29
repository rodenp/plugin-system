import * as React from 'react'
import type { Community } from '../../../types/plugin-interface'
import { defaultTheme } from '../../shared/default-theme'

export interface CommunitySidebarProps {
  currentUser: any
  community: Community
  userRole: string
  theme?: any
}

export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ 
  community, 
  userRole, 
  theme 
}) => {
  const appliedTheme = theme || defaultTheme
  const isOwner = userRole === 'owner'
  
  return (
    <>
      <div style={{
        backgroundColor: appliedTheme.colors.surface,
        borderRadius: appliedTheme.borders.borderRadius,
        boxShadow: appliedTheme.borders.boxShadow,
        padding: appliedTheme.spacing.lg
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: appliedTheme.borders.borderRadius,
            backgroundColor: appliedTheme.colors.surfaceAlt,
            margin: 'auto', display: 'flex',
            justifyContent: 'center', alignItems: 'center',
            fontSize: appliedTheme.font.size2xl, fontWeight: 600,
            marginBottom: appliedTheme.spacing.md
          }}>
            {community?.name?.charAt(0) || '🏋️'}
          </div>
          <h3 style={{ fontSize: appliedTheme.font.sizeLg, fontWeight: 600 }}>{community?.name}</h3>
          <p style={{ fontSize: appliedTheme.font.sizeSm, color: appliedTheme.colors.textSecondary, marginBottom: appliedTheme.spacing.md }}>
            {community?.description || 'Community description'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: appliedTheme.spacing.md, marginBottom: appliedTheme.spacing.md }}>
            <div>
              <div style={{ fontSize: appliedTheme.font.sizeLg, fontWeight: 600 }}>{community?.stats?.memberCount || 0}</div>
              <div style={{ fontSize: appliedTheme.font.sizeXs, color: appliedTheme.colors.muted }}>Members</div>
            </div>
            <div>
              <div style={{ fontSize: appliedTheme.font.sizeLg, fontWeight: 600, color: appliedTheme.colors.accent }}>{community?.stats?.online || 0}</div>
              <div style={{ fontSize: appliedTheme.font.sizeXs, color: appliedTheme.colors.muted }}>Online</div>
            </div>
            <div>
              <div style={{ fontSize: appliedTheme.font.sizeLg, fontWeight: 600, color: appliedTheme.colors.secondary }}>{community?.stats?.adminCount || 0}</div>
              <div style={{ fontSize: appliedTheme.font.sizeXs, color: appliedTheme.colors.muted }}>Admins</div>
            </div>
          </div>
          <button style={{
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            borderRadius: appliedTheme.borders.borderRadius,
            border: 'none',
            width: '100%',
            fontWeight: 600,
            cursor: 'pointer'
          }}>INVITE PEOPLE</button>
        </div>
      </div>

      {/* Status Card */}
      <div style={{
        backgroundColor: appliedTheme.colors.surface,
        borderRadius: appliedTheme.borders.borderRadius,
        boxShadow: appliedTheme.borders.boxShadow,
        padding: appliedTheme.spacing.lg,
        marginTop: appliedTheme.spacing.lg
      }}>
        <h3 style={{ fontSize: appliedTheme.font.sizeLg, fontWeight: 600, marginBottom: appliedTheme.spacing.md }}>Status</h3>
        <p style={{ fontSize: appliedTheme.font.sizeSm, color: appliedTheme.colors.textSecondary, marginBottom: appliedTheme.spacing.md }}>
          Get respect with a status emoji next to your name.
        </p>
        <div style={{ fontSize: appliedTheme.font.sizeSm, display: 'flex', flexDirection: 'column', gap: appliedTheme.spacing.sm }}>
          <div>⭐ Star — top 1% of discovery</div>
          <div>🔥 Fire — 30d activity streak</div>
          <div>🐐 Goat — highest earner</div>
          <div>🥷 Ninja — $300k MRR</div>
          <div>💎 Diamond — $100k MRR</div>
          <div>👑 Crown — $30k MRR</div>
          <div>🚀 Rocket — $10k MRR</div>
        </div>
      </div>
    </>
  )
}