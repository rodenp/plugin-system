import type { Plugin, PluginProps } from '../../types/plugin-interface';
import * as React from 'react';
import { defaultTheme } from '../shared/default-theme';

interface MembersProps extends PluginProps {
  // Data passed from host app (optional for now)
  members?: any[];
  searchQuery?: string;
  filter?: 'all' | 'online' | 'admins';
  loading?: boolean;
  error?: string;
  
  // Action callbacks to host app (optional)
  onSearchMembers?: (query: string) => Promise<void>;
  onFilterMembers?: (filter: string) => Promise<void>;
  onInviteMembers?: () => Promise<void>;
  onChatWithMember?: (memberId: string) => Promise<void>;
  onLoadMembers?: () => Promise<void>;
}

// Component wrapper for the Members tab
const MembersComponent: React.FC<MembersProps> = ({ currentUser, communityId, community, userRole, theme, ...props }) => {
  const groupname = currentUser?.profile?.groupname || 'courzey';
  const pluginPath = `/${groupname}/members`;
  
  // Update document title and URL without causing page reload
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', pluginPath);
      document.title = `Members - ${groupname}`;
    }
  }, [groupname, pluginPath]);
  
  const context = {
    currentUser,
    communityId,
    community,
    isOwner: userRole === 'owner' || userRole === 'admin'
  };

  // Apply theme
  const appliedTheme = theme || defaultTheme;

  // Use theme colors or defaults
  const themeColors = {
    primary: theme?.colors?.secondary || appliedTheme.colors.secondary,
    secondary: theme?.colors?.accent || appliedTheme.colors.accent, 
    avatar: theme?.colors?.level || appliedTheme.colors.level,
    success: theme?.colors?.secondary || appliedTheme.colors.secondary,
    muted: theme?.colors?.muted || appliedTheme.colors.muted,
    textPrimary: theme?.colors?.textPrimary || appliedTheme.colors.textPrimary
  };

  const members = props.members || [];

  // Local state for UI interactions
  const [searchQuery, setSearchQuery] = React.useState(props.searchQuery || '');
  const [filter, setFilter] = React.useState(props.filter || 'all');

  // Event handlers
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (props.onSearchMembers) {
      try {
        await props.onSearchMembers(query);
      } catch (error) {
        console.error('Failed to search members:', error);
      }
    }
  };

  const handleFilterChange = async (newFilter: string) => {
    setFilter(newFilter);
    if (props.onFilterMembers) {
      try {
        await props.onFilterMembers(newFilter);
      } catch (error) {
        console.error('Failed to filter members:', error);
      }
    }
  };

  const handleInvite = async () => {
    if (props.onInviteMembers) {
      try {
        await props.onInviteMembers();
      } catch (error) {
        console.error('Failed to invite members:', error);
      }
    }
  };

  const handleChatWithMember = async (memberId: string) => {
    if (props.onChatWithMember) {
      try {
        await props.onChatWithMember(memberId);
      } catch (error) {
        console.error('Failed to start chat:', error);
      }
    }
  };

  return React.createElement('div', { 
    style: {
      padding: appliedTheme.spacing.lg
    }
  },
    React.createElement('div', { 
      style: {
        backgroundColor: appliedTheme.colors.surface,
        borderRadius: appliedTheme.borders.borderRadius,
        boxShadow: appliedTheme.borders.boxShadow
      }
    },
      // Header
      React.createElement('div', { 
        style: {
          padding: appliedTheme.spacing.lg,
          borderBottom: `1px solid ${appliedTheme.borders.borderColor}`
        }
      },
        React.createElement('div', { 
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: appliedTheme.spacing.md
          }
        },
          React.createElement('div', { 
            style: {
              display: 'flex',
              gap: appliedTheme.spacing.md
            }
          },
            React.createElement('button', { 
              style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                color: 'white',
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeSm,
                backgroundColor: themeColors.primary,
                border: 'none',
                cursor: 'pointer'
              },
              onClick: () => handleFilterChange('all')
            }, `Members ${community?.stats?.memberCount || 0}`),
            React.createElement('button', { 
              style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                backgroundColor: appliedTheme.colors.surfaceAlt,
                color: appliedTheme.colors.textSecondary,
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeSm,
                border: 'none',
                cursor: 'pointer'
              },
              onClick: () => handleFilterChange('admins')
            }, 'Admins 8'),
            React.createElement('button', { 
              style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                backgroundColor: appliedTheme.colors.surfaceAlt,
                color: appliedTheme.colors.textSecondary,
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeSm,
                border: 'none',
                cursor: 'pointer'
              },
              onClick: () => handleFilterChange('online')
            }, `Online ${community?.stats?.memberCount ? Math.floor(community.stats.memberCount * 0.1) : 0}`)
          ),
          React.createElement('button', { 
            style: {
              color: 'white',
              padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
              borderRadius: appliedTheme.borders.borderRadius,
              fontSize: appliedTheme.font.sizeSm,
              fontWeight: 500,
              backgroundColor: themeColors.primary,
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            },
            onClick: handleInvite,
            onMouseEnter: (e: any) => e.target.style.opacity = '0.9',
            onMouseLeave: (e: any) => e.target.style.opacity = '1'
          }, 'INVITE')
        ),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search members',
          value: searchQuery,
          onChange: (e: any) => handleSearch(e.target.value),
          style: {
            width: '100%',
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            borderRadius: appliedTheme.borders.borderRadius,
            fontFamily: appliedTheme.font.family
          }
        })
      ),
      // Member List
      React.createElement('div', { 
        style: {
          display: 'flex',
          flexDirection: 'column'
        }
      },
        members.map((member: any, i: number) =>
          React.createElement('div', { 
            key: member.id || i, 
            style: {
              padding: appliedTheme.spacing.lg,
              display: 'flex',
              alignItems: 'flex-start',
              gap: appliedTheme.spacing.md,
              borderBottom: i < members.length - 1 ? `1px solid ${appliedTheme.borders.borderColor}` : 'none'
            }
          },
            React.createElement('div', { 
              style: {
                position: 'relative'
              }
            },
              React.createElement('div', { 
                style: {
                  width: '48px',
                  height: '48px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: themeColors.avatar
                }
              },
                React.createElement('span', { 
                  style: {
                    color: 'white',
                    fontWeight: 500
                  }
                }, member.name.charAt(0))
              ),
              member.online && React.createElement('div', { 
                style: {
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '999px',
                  border: `2px solid ${appliedTheme.colors.surface}`,
                  backgroundColor: themeColors.success
                }
              })
            ),
            React.createElement('div', { 
              style: {
                flex: 1
              }
            },
              React.createElement('div', { 
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }
              },
                React.createElement('div', {},
                  React.createElement('h3', { 
                    style: {
                      fontWeight: 500,
                      color: appliedTheme.colors.textPrimary,
                      margin: 0
                    }
                  }, member.name),
                  React.createElement('p', { 
                    style: {
                      fontSize: appliedTheme.font.sizeSm,
                      color: appliedTheme.colors.textSecondary,
                      margin: 0
                    }
                  }, member.username)
                ),
                React.createElement('button', { 
                  style: {
                    color: 'white',
                    padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeSm,
                    fontWeight: 500,
                    backgroundColor: themeColors.secondary,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  },
                  onClick: () => handleChatWithMember(member.id),
                  onMouseEnter: (e: any) => e.target.style.opacity = '0.9',
                  onMouseLeave: (e: any) => e.target.style.opacity = '1'
                }, 'CHAT')
              ),
              React.createElement('p', { 
                style: {
                  fontSize: appliedTheme.font.sizeSm,
                  color: appliedTheme.colors.textSecondary,
                  margin: `${appliedTheme.spacing.sm} 0`,
                  lineHeight: 1.5
                }
              }, member.bio),
              React.createElement('div', { 
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: appliedTheme.spacing.md,
                  fontSize: appliedTheme.font.sizeXs,
                  color: appliedTheme.colors.muted
                }
              },
                member.online && React.createElement('span', { 
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }
                },
                  React.createElement('div', { 
                    style: {
                      width: '8px',
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: themeColors.success
                    }
                  }),
                  'Online now'
                ),
                React.createElement('span', {}, `📍 ${member.location}`),
                React.createElement('span', {}, `📅 Joined ${member.joined}`)
              )
            )
          )
        )
      ),
      // Error display
      props.error && React.createElement('div', { 
        style: {
          margin: appliedTheme.spacing.lg,
          padding: appliedTheme.spacing.md,
          backgroundColor: appliedTheme.colors.danger + '10',
          border: `1px solid ${appliedTheme.colors.danger}`,
          borderRadius: appliedTheme.borders.borderRadius,
          color: appliedTheme.colors.danger,
          fontSize: appliedTheme.font.sizeSm
        }
      }, props.error)
    )
  );
};

export const membersPlugin: Plugin = {
  id: 'members',
  name: 'Members',
  component: MembersComponent,
  icon: '',
  order: 4
};