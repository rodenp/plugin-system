import type { Plugin, PluginProps } from '../../types/plugin-interface';
import * as React from 'react';
import { defaultTheme } from '../shared/default-theme';

interface LeaderboardProps extends PluginProps {
  // Data passed from host app
  leaderboards?: {
    sevenDay?: any[];
    thirtyDay?: any[];
    allTime?: any[];
  };
  levels?: any[];
  currentUserRank?: {
    sevenDay?: number;
    thirtyDay?: number;
    allTime?: number;
  };
  featuredMember?: any;
  loading?: boolean;
  error?: string;
  
  // Action callbacks to host app
  onLoadLeaderboard?: (period: '7day' | '30day' | 'alltime') => Promise<void>;
  onViewMemberProfile?: (memberId: string) => Promise<void>;
}

// Component for the Leaderboard tab
const LeaderboardComponent: React.FC<LeaderboardProps> = ({ 
  currentUser, 
  communityId, 
  community, 
  userRole, 
  theme, 
  ...props 
}) => {
  const groupname = currentUser?.profile?.groupname || 'courzey';
  const pluginPath = `/${groupname}/leaderboard`;
  
  // Update document title and URL without causing page reload
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', pluginPath);
      document.title = `Leaderboard - ${groupname}`;
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

  // Use theme colors
  const themeColors = {
    primary: theme?.colors?.secondary || appliedTheme.colors.secondary,
    secondary: theme?.colors?.accent || appliedTheme.colors.accent,
    muted: theme?.colors?.muted || appliedTheme.colors.muted,
    textPrimary: theme?.colors?.textPrimary || appliedTheme.colors.textPrimary,
    textSecondary: theme?.colors?.textSecondary || appliedTheme.colors.textSecondary
  };

  const leaderboards = props.leaderboards || { sevenDay: [], thirtyDay: [], allTime: [] };
  const levels = props.levels || [];
  const featuredMember = props.featuredMember || null;
  const currentUserRank = props.currentUserRank || {};

  // Event handlers
  const handleViewMember = async (memberId: string) => {
    if (props.onViewMemberProfile) {
      try {
        await props.onViewMemberProfile(memberId);
      } catch (error) {
        console.error('Failed to view member profile:', error);
      }
    }
  };

  // Render rank medal/number
  const renderRank = (rank: number) => {
    const medalColors = {
      1: '#FFD700', // Gold
      2: '#C0C0C0', // Silver
      3: '#CD7F32'  // Bronze
    };

    if (rank <= 3) {
      return React.createElement('div', {
        style: {
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: medalColors[rank as keyof typeof medalColors],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: appliedTheme.font.sizeSm,
          color: 'white'
        }
      }, rank);
    }

    return React.createElement('span', {
      style: {
        width: '24px',
        textAlign: 'center',
        fontSize: appliedTheme.font.sizeSm,
        color: appliedTheme.colors.textSecondary
      }
    }, rank);
  };

  return React.createElement('div', {
    style: {
      padding: appliedTheme.spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: appliedTheme.spacing.lg
    }
  },
    // Top Profile Card
    featuredMember && React.createElement('div', {
      style: {
        backgroundColor: appliedTheme.colors.surface,
        borderRadius: appliedTheme.borders.borderRadius,
        boxShadow: appliedTheme.borders.boxShadow,
        padding: appliedTheme.spacing.lg
      }
    },
      React.createElement('div', {
        style: {
          display: 'flex',
          gap: appliedTheme.spacing.lg
        }
      },
        // Featured member avatar and info
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: appliedTheme.spacing.md
          }
        },
          React.createElement('div', {
            style: {
              position: 'relative'
            }
          },
            React.createElement('div', {
              style: {
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                backgroundColor: appliedTheme.colors.surfaceAlt,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '5rem',
                border: `3px solid ${themeColors.primary}`,
                overflow: 'hidden'
              }
            },
              featuredMember.avatar
                ? React.createElement('img', {
                    src: featuredMember.avatar,
                    alt: featuredMember.name,
                    style: {
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }
                  })
                : React.createElement('span', {}, featuredMember.name?.charAt(0) || '👤')
            ),
            React.createElement('div', {
              style: {
                position: 'absolute',
                bottom: '5px',
                right: '5px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: themeColors.primary,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: appliedTheme.font.sizeMd,
                border: `3px solid ${appliedTheme.colors.surface}`
              }
            }, featuredMember.level || '1')
          ),
          React.createElement('div', {
            style: {
              textAlign: 'center'
            }
          },
            React.createElement('h3', {
              style: {
                fontSize: appliedTheme.font.sizeXl,
                fontWeight: 600,
                margin: 0,
                marginBottom: appliedTheme.spacing.xs
              }
            }, featuredMember.name),
            React.createElement('p', {
              style: {
                fontSize: appliedTheme.font.sizeMd,
                color: appliedTheme.colors.textSecondary,
                margin: 0,
                marginBottom: appliedTheme.spacing.xs
              }
            }, `Level ${featuredMember.level || 1}`),
            React.createElement('p', {
              style: {
                fontSize: appliedTheme.font.sizeMd,
                color: appliedTheme.colors.textSecondary,
                margin: 0
              }
            }, `${featuredMember.pointsToNext || 0} points to level up`)
          )
        ),

        // Levels grid
        React.createElement('div', {
          style: {
            flex: 1
          }
        },
          React.createElement('div', {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: appliedTheme.spacing.sm
            }
          },
            levels.map((level: any, index: number) =>
              React.createElement('div', {
                key: level.level,
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: appliedTheme.spacing.sm,
                  padding: appliedTheme.spacing.sm,
                  backgroundColor: level.unlocked ? appliedTheme.colors.surfaceAlt : 'transparent'
                }
              },
                React.createElement('div', {
                  style: {
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: level.unlocked ? themeColors.primary : appliedTheme.colors.muted,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: appliedTheme.font.sizeSm,
                    fontWeight: 'bold'
                  }
                }, level.level),
                React.createElement('div', {
                  style: {
                    flex: 1
                  }
                },
                  React.createElement('p', {
                    style: {
                      fontSize: appliedTheme.font.sizeSm,
                      fontWeight: 500,
                      margin: 0,
                      marginBottom: '2px'
                    }
                  }, `Level ${level.level}`),
                  level.requirement && React.createElement('p', {
                    style: {
                      fontSize: appliedTheme.font.sizeXs,
                      color: themeColors.primary,
                      margin: 0,
                      marginBottom: '2px'
                    }
                  }, level.requirement),
                  React.createElement('p', {
                    style: {
                      fontSize: appliedTheme.font.sizeXs,
                      color: appliedTheme.colors.textSecondary,
                      margin: 0
                    }
                  }, level.memberPercentage)
                )
              )
            )
          )
        )
      )
    ),

    // Three Leaderboard Columns
    React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: appliedTheme.spacing.lg
      }
    },
      // 7-Day Leaderboard
      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          boxShadow: appliedTheme.borders.boxShadow,
          padding: appliedTheme.spacing.lg
        }
      },
        React.createElement('h3', {
          style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
          }
        }, 'Leaderboard (7-day)'),
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: appliedTheme.spacing.sm
          }
        },
          (leaderboards.sevenDay || []).map((member: any, index: number) =>
            React.createElement('div', {
              key: member.id,
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: appliedTheme.spacing.sm,
                padding: appliedTheme.spacing.sm,
                backgroundColor: index < 3 ? appliedTheme.colors.surfaceAlt : 'transparent',
                borderRadius: appliedTheme.borders.borderRadius,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              },
              onClick: () => handleViewMember(member.id),
              onMouseEnter: (e: any) => {
                if (index >= 3) {
                  e.target.style.backgroundColor = appliedTheme.colors.surfaceAlt;
                }
              },
              onMouseLeave: (e: any) => {
                if (index >= 3) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }
            },
              renderRank(index + 1),
              React.createElement('div', {
                style: {
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: appliedTheme.colors.surfaceAlt,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }
              },
                member.avatar
                  ? React.createElement('img', {
                      src: member.avatar,
                      alt: member.name,
                      style: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }
                    })
                  : React.createElement('span', {
                      style: {
                        fontSize: appliedTheme.font.sizeXs
                      }
                    }, member.name?.charAt(0) || '👤')
              ),
              React.createElement('div', {
                style: {
                  flex: 1,
                  minWidth: 0
                }
              },
                React.createElement('p', {
                  style: {
                    fontSize: appliedTheme.font.sizeSm,
                    fontWeight: 500,
                    margin: 0,
                    color: appliedTheme.colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }
                }, member.name)
              ),
              React.createElement('div', {
                style: {
                  fontSize: appliedTheme.font.sizeSm,
                  fontWeight: 600,
                  color: themeColors.primary
                }
              }, `+${member.points}`)
            )
          )
        )
      ),

      // 30-Day Leaderboard
      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          boxShadow: appliedTheme.borders.boxShadow,
          padding: appliedTheme.spacing.lg
        }
      },
        React.createElement('h3', {
          style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
          }
        }, 'Leaderboard (30-day)'),
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: appliedTheme.spacing.sm
          }
        },
          (leaderboards.thirtyDay || []).map((member: any, index: number) =>
            React.createElement('div', {
              key: member.id,
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: appliedTheme.spacing.sm,
                padding: appliedTheme.spacing.sm,
                backgroundColor: index < 3 ? appliedTheme.colors.surfaceAlt : 'transparent',
                borderRadius: appliedTheme.borders.borderRadius,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              },
              onClick: () => handleViewMember(member.id),
              onMouseEnter: (e: any) => {
                if (index >= 3) {
                  e.target.style.backgroundColor = appliedTheme.colors.surfaceAlt;
                }
              },
              onMouseLeave: (e: any) => {
                if (index >= 3) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }
            },
              renderRank(index + 1),
              React.createElement('div', {
                style: {
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: appliedTheme.colors.surfaceAlt,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }
              },
                member.avatar
                  ? React.createElement('img', {
                      src: member.avatar,
                      alt: member.name,
                      style: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }
                    })
                  : React.createElement('span', {
                      style: {
                        fontSize: appliedTheme.font.sizeXs
                      }
                    }, member.name?.charAt(0) || '👤')
              ),
              React.createElement('div', {
                style: {
                  flex: 1,
                  minWidth: 0
                }
              },
                React.createElement('p', {
                  style: {
                    fontSize: appliedTheme.font.sizeSm,
                    fontWeight: 500,
                    margin: 0,
                    color: appliedTheme.colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }
                }, member.name)
              ),
              React.createElement('div', {
                style: {
                  fontSize: appliedTheme.font.sizeSm,
                  fontWeight: 600,
                  color: themeColors.primary
                }
              }, `+${member.points}`)
            )
          )
        )
      ),

      // All-Time Leaderboard
      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          boxShadow: appliedTheme.borders.boxShadow,
          padding: appliedTheme.spacing.lg
        }
      },
        React.createElement('h3', {
          style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
          }
        }, 'Leaderboard (all-time)'),
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: appliedTheme.spacing.sm
          }
        },
          (leaderboards.allTime || []).map((member: any, index: number) =>
            React.createElement('div', {
              key: member.id,
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: appliedTheme.spacing.sm,
                padding: appliedTheme.spacing.sm,
                backgroundColor: index < 3 ? appliedTheme.colors.surfaceAlt : 'transparent',
                borderRadius: appliedTheme.borders.borderRadius,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              },
              onClick: () => handleViewMember(member.id),
              onMouseEnter: (e: any) => {
                if (index >= 3) {
                  e.target.style.backgroundColor = appliedTheme.colors.surfaceAlt;
                }
              },
              onMouseLeave: (e: any) => {
                if (index >= 3) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }
            },
              renderRank(index + 1),
              React.createElement('div', {
                style: {
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: appliedTheme.colors.surfaceAlt,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }
              },
                member.avatar
                  ? React.createElement('img', {
                      src: member.avatar,
                      alt: member.name,
                      style: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }
                    })
                  : React.createElement('span', {
                      style: {
                        fontSize: appliedTheme.font.sizeXs
                      }
                    }, member.name?.charAt(0) || '👤')
              ),
              React.createElement('div', {
                style: {
                  flex: 1,
                  minWidth: 0
                }
              },
                React.createElement('p', {
                  style: {
                    fontSize: appliedTheme.font.sizeSm,
                    fontWeight: 500,
                    margin: 0,
                    color: appliedTheme.colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }
                }, member.name)
              ),
              React.createElement('div', {
                style: {
                  fontSize: appliedTheme.font.sizeSm,
                  fontWeight: 600,
                  color: appliedTheme.colors.textPrimary
                }
              }, member.points.toLocaleString())
            )
          ),
          
          // "Your rank" section for all-time leaderboard
          currentUserRank.allTime && React.createElement('div', {
            style: {
              marginTop: appliedTheme.spacing.md,
              paddingTop: appliedTheme.spacing.md,
              borderTop: `1px solid ${appliedTheme.borders.borderColor}`
            }
          },
            React.createElement('h4', {
              style: {
                fontSize: appliedTheme.font.sizeSm,
                fontWeight: 600,
                marginBottom: appliedTheme.spacing.sm,
                color: appliedTheme.colors.textSecondary
              }
            }, 'Your rank'),
            React.createElement('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: appliedTheme.spacing.sm,
                padding: appliedTheme.spacing.sm,
                backgroundColor: appliedTheme.colors.surfaceAlt,
                borderRadius: appliedTheme.borders.borderRadius
              }
            },
              React.createElement('span', {
                style: {
                  fontSize: appliedTheme.font.sizeLg,
                  fontWeight: 600,
                  color: appliedTheme.colors.textSecondary,
                  minWidth: '32px'
                }
              }, currentUserRank.allTime),
              React.createElement('div', {
                style: {
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: appliedTheme.colors.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }
              },
                currentUser?.profile?.avatar
                  ? React.createElement('img', {
                      src: currentUser.profile.avatar,
                      alt: currentUser.profile.displayName,
                      style: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }
                    })
                  : React.createElement('span', {
                      style: {
                        fontSize: appliedTheme.font.sizeXs
                      }
                    }, currentUser?.profile?.displayName?.charAt(0) || '👤')
              ),
              React.createElement('div', {
                style: {
                  flex: 1,
                  minWidth: 0
                }
              },
                React.createElement('p', {
                  style: {
                    fontSize: appliedTheme.font.sizeSm,
                    fontWeight: 500,
                    margin: 0,
                    color: appliedTheme.colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }
                }, currentUser?.profile?.displayName || 'Peter Roden')
              ),
              React.createElement('div', {
                style: {
                  fontSize: appliedTheme.font.sizeSm,
                  fontWeight: 600,
                  color: appliedTheme.colors.textPrimary
                }
              }, '3')
            )
          )
        )
      )
    ),

    // Error display
    props.error && React.createElement('div', {
      style: {
        margin: `${appliedTheme.spacing.lg} 0`,
        padding: appliedTheme.spacing.md,
        backgroundColor: appliedTheme.colors.danger + '10',
        border: `1px solid ${appliedTheme.colors.danger}`,
        borderRadius: appliedTheme.borders.borderRadius,
        color: appliedTheme.colors.danger,
        fontSize: appliedTheme.font.sizeSm
      }
    }, props.error)
  );
};

export const leaderboardPlugin: Plugin = {
  id: 'leaderboard',
  name: 'Leaderboard',
  component: LeaderboardComponent,
  icon: '',
  order: 4
};