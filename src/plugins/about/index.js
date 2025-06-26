import * as React from 'react';
import { defaultTheme } from '../shared/default-theme';
// Component wrapper for the About tab
const AboutComponent = ({ currentUser, communityId, community, userRole, theme, ...props }) => {
    const groupname = currentUser?.profile?.groupname || 'courzey';
    const pluginPath = `/${groupname}/about`;
    // Update document title and URL without causing page reload
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', pluginPath);
            document.title = `About - ${groupname}`;
        }
    }, [groupname, pluginPath]);
    const context = {
        currentUser,
        communityId,
        community,
        isOwner: userRole === 'owner' || userRole === 'admin'
    };
    const guidelines = props.guidelines || [];
    // Use theme colors or defaults
    const themeColors = {
        primary: theme?.colors?.primary || '#0066cc',
        secondary: theme?.colors?.secondary || '#0066cc',
        accent: theme?.colors?.accent || '#0066cc'
    };
    // Apply theme
    const appliedTheme = theme || defaultTheme;
    return React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: appliedTheme.spacing.lg,
            padding: appliedTheme.spacing.lg
        }
    }, 
    // Main Content
    React.createElement('div', {}, React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            boxShadow: appliedTheme.borders.boxShadow,
            padding: appliedTheme.spacing.lg
        }
    }, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.md
        }
    }, `About ${community?.name || 'Community'}`), community?.description
        ? React.createElement('div', {
            style: {
                maxWidth: 'none',
                lineHeight: 1.6
            }
        }, React.createElement('p', {
            style: {
                color: appliedTheme.colors.textSecondary
            }
        }, community.description))
        : React.createElement('div', {
            style: {
                textAlign: 'center',
                padding: `${appliedTheme.spacing.xl} 0`
            }
        }, React.createElement('div', {
            style: {
                color: appliedTheme.colors.muted,
                marginBottom: appliedTheme.spacing.md
            }
        }, '📝 Upload images / videos'), context.isOwner && React.createElement('p', {
            style: {
                fontSize: appliedTheme.font.sizeSm,
                color: appliedTheme.colors.muted
            }
        }, 'Add your community description by clicking the "Settings" button')), 
    // Community Rules
    React.createElement('div', {
        style: {
            marginTop: appliedTheme.spacing.xl,
            paddingTop: appliedTheme.spacing.lg,
            borderTop: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('h3', {
        style: {
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.md
        }
    }, 'Community Guidelines'), React.createElement('div', {
        style: {
            display: 'flex',
            flexDirection: 'column',
            gap: appliedTheme.spacing.sm,
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary
        }
    }, ...guidelines.map((guideline, index) => React.createElement('div', {
        key: index,
        style: {
            display: 'flex',
            alignItems: 'center',
            gap: appliedTheme.spacing.sm
        }
    }, React.createElement('span', { style: { color: themeColors.secondary } }, '✓'), React.createElement('span', {}, guideline))), guidelines.length === 0 && context.isOwner && React.createElement('p', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.muted,
            fontStyle: 'italic'
        }
    }, 'No community guidelines set. Add some in Settings.'))))), 
    // Community Info Sidebar
    React.createElement('div', {
        style: {
            display: 'flex',
            flexDirection: 'column',
            gap: appliedTheme.spacing.lg
        }
    }, 
    // Community Info Card
    React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            boxShadow: appliedTheme.borders.boxShadow,
            padding: appliedTheme.spacing.lg
        }
    }, React.createElement('div', { style: { textAlign: 'center' } }, React.createElement('div', {
        style: {
            width: '80px',
            height: '80px',
            backgroundColor: appliedTheme.colors.surfaceAlt,
            borderRadius: appliedTheme.borders.borderRadius,
            margin: '0 auto',
            marginBottom: appliedTheme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: appliedTheme.font.size2xl
        }
    }, React.createElement('span', {}, community?.name?.charAt(0) || '🏋️')), React.createElement('h3', {
        style: {
            fontWeight: 600,
            fontSize: appliedTheme.font.sizeLg,
            marginBottom: appliedTheme.spacing.sm
        }
    }, community?.name || 'Community'), React.createElement('p', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            marginBottom: appliedTheme.spacing.md
        }
    }, community?.description || 'Community description'), 
    // Community Stats
    React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: appliedTheme.spacing.md,
            textAlign: 'center',
            marginBottom: appliedTheme.spacing.md
        }
    }, React.createElement('div', {}, React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.size2xl,
            fontWeight: 'bold',
            color: appliedTheme.colors.textPrimary
        }
    }, community?.stats?.memberCount || 0), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeXs,
            color: appliedTheme.colors.muted
        }
    }, 'Members')), React.createElement('div', {}, React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.size2xl,
            fontWeight: 'bold',
            color: themeColors.secondary
        }
    }, community?.stats?.memberCount ? Math.floor(community.stats.memberCount * 0.1) : 0), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeXs,
            color: appliedTheme.colors.muted
        }
    }, 'Online')), React.createElement('div', {}, React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.size2xl,
            fontWeight: 'bold',
            color: themeColors.accent
        }
    }, context.isOwner ? '1' : '8'), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeXs,
            color: appliedTheme.colors.muted
        }
    }, 'Admins'))), React.createElement('button', {
        style: {
            width: '100%',
            color: 'white',
            fontWeight: 500,
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            borderRadius: appliedTheme.borders.borderRadius,
            backgroundColor: themeColors.secondary,
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
        },
        onClick: props.onInvitePeople,
        onMouseEnter: (e) => e.target.style.opacity = '0.9',
        onMouseLeave: (e) => e.target.style.opacity = '1'
    }, 'INVITE PEOPLE'))), 
    // Community Details
    React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            boxShadow: appliedTheme.borders.boxShadow,
            padding: appliedTheme.spacing.lg
        }
    }, React.createElement('h3', {
        style: {
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.md
        }
    }, 'Community Details'), React.createElement('div', {
        style: {
            display: 'flex',
            flexDirection: 'column',
            gap: appliedTheme.spacing.sm,
            fontSize: appliedTheme.font.sizeSm
        }
    }, React.createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            gap: appliedTheme.spacing.sm
        }
    }, React.createElement('span', { style: { color: appliedTheme.colors.muted } }, '🔒'), React.createElement('span', {}, 'Private')), React.createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            gap: appliedTheme.spacing.sm
        }
    }, React.createElement('span', { style: { color: appliedTheme.colors.muted } }, '👥'), React.createElement('span', {}, `${community?.stats?.memberCount || 1} member`)), React.createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            gap: appliedTheme.spacing.sm
        }
    }, React.createElement('span', { style: { color: appliedTheme.colors.muted } }, '💰'), React.createElement('span', {}, 'Free')), React.createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            gap: appliedTheme.spacing.sm
        }
    }, React.createElement('span', { style: { color: appliedTheme.colors.muted } }, '👤'), React.createElement('span', {}, `By ${currentUser?.profile?.displayName || 'Community Owner'}`))), context.isOwner && React.createElement('button', {
        style: {
            width: '100%',
            marginTop: appliedTheme.spacing.md,
            color: 'white',
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            fontWeight: 500,
            transition: 'opacity 0.2s',
            backgroundColor: themeColors.accent,
            border: 'none',
            cursor: 'pointer'
        },
        onClick: props.onOpenSettings,
        onMouseEnter: (e) => e.target.style.opacity = '0.9',
        onMouseLeave: (e) => e.target.style.opacity = '1'
    }, 'SETTINGS'))));
};
export const aboutPlugin = {
    id: 'about',
    name: 'About',
    component: AboutComponent,
    icon: '',
    order: 6
};
