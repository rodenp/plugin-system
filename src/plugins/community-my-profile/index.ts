import type { Plugin, PluginProps } from '../../types/plugin-interface';
import * as React from 'react';
import { defaultTheme } from '../shared/default-theme';
import ActivityCalendar from 'react-activity-calendar';

interface CommunityMyProfileProps extends PluginProps {
  // Community profile-specific data from host app (extends base PluginProps)
  // Data passed from host app
  userProfile?: any;
  activityData?: any[];
  ownedCommunities?: any[];
  memberships?: any[];
  contributions?: any[];
  stats?: {
    contributions: number;
    followers: number;
    following: number;
  };
  loading?: boolean;
  error?: string;
  
  // Action callbacks to host app
  onEditProfile?: () => Promise<void>;
  onViewCommunity?: (communityId: string) => Promise<void>;
  onViewContribution?: (contributionId: string) => Promise<void>;
  onLoadActivity?: () => Promise<void>;
  onLikePost?: (postId: string) => Promise<void>;
}

// Component for the Community My Profile tab
const CommunityMyProfileComponent: React.FC<CommunityMyProfileProps> = ({ 
  currentUser, 
  communityId, 
  community, 
  userRole, 
  theme, 
  ...props 
}) => {
  console.log('🔍 CommunityMyProfileComponent rendering with props:', { currentUser, userProfile: props.userProfile, ownedCommunities: props.ownedCommunities });
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

  const userProfile = props.userProfile || currentUser?.profile || {};
  const activityData = props.activityData || [];
  const ownedCommunities = props.ownedCommunities || [];
  const memberships = props.memberships || [];
  const contributions = props.contributions || [];
  const stats = props.stats || { contributions: 0, followers: 0, following: 0 };

  // Event handlers
  const handleEditProfile = async () => {
    if (props.onEditProfile) {
      try {
        await props.onEditProfile();
      } catch (error) {
        console.error('Failed to edit profile:', error);
      }
    }
  };

  const handleViewCommunity = async (communityId: string) => {
    if (props.onViewCommunity) {
      try {
        await props.onViewCommunity(communityId);
      } catch (error) {
        console.error('Failed to view community:', error);
      }
    }
  };

  const handleViewContribution = async (contributionId: string) => {
    if (props.onViewContribution) {
      try {
        await props.onViewContribution(contributionId);
      } catch (error) {
        console.error('Failed to view contribution:', error);
      }
    }
  };

  const handleLikePost = async (postId: string) => {
    if (props.onLikePost) {
      try {
        await props.onLikePost(postId);
      } catch (error) {
        console.error('Failed to like post:', error);
      }
    }
  };

  // Create proper activity heatmap
  const createActivityHeatmap = () => {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const days = ['Mon', 'Wed', 'Fri', 'Sun'];
    
    // Generate month header elements
    const monthHeaders = [React.createElement('div', { key: 'empty' })];
    months.forEach(month => {
      monthHeaders.push(React.createElement('div', {
        key: month,
        style: {
          fontSize: appliedTheme.font.sizeXs,
          color: appliedTheme.colors.textSecondary,
          textAlign: 'center'
        }
      }, month));
    });
    
    // Generate day labels
    const dayLabels = days.map(day =>
      React.createElement('div', {
        key: day,
        style: {
          fontSize: appliedTheme.font.sizeXs,
          color: appliedTheme.colors.textSecondary,
          height: '12px',
          display: 'flex',
          alignItems: 'center'
        }
      }, day)
    );
    
    // Generate activity squares for all 12 months
    const activityColumns = [];
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthSquares = [];
      for (let dayIndex = 0; dayIndex < 28; dayIndex++) {
        const intensity = Math.floor(Math.random() * 5);
        const opacity = intensity * 0.25;
        monthSquares.push(React.createElement('div', {
          key: `${monthIndex}-${dayIndex}`,
          style: {
            width: '12px',
            height: '12px',
            backgroundColor: intensity > 0 ? `${themeColors.primary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : appliedTheme.colors.surfaceAlt,
            borderRadius: '2px'
          }
        }));
      }
      
      activityColumns.push(React.createElement('div', {
        key: `month-${monthIndex}`,
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px'
        }
      }, ...monthSquares));
    }
    
    // Generate legend squares
    const legendSquares = [];
    for (let i = 0; i < 5; i++) {
      legendSquares.push(React.createElement('div', {
        key: `legend-${i}`,
        style: {
          width: '10px',
          height: '10px',
          backgroundColor: i === 0 ? appliedTheme.colors.surfaceAlt : `${themeColors.primary}${Math.round(i * 0.25 * 255).toString(16).padStart(2, '0')}`,
          borderRadius: '2px'
        }
      }));
    }
    
    return React.createElement('div', {
      style: {
        backgroundColor: appliedTheme.colors.surface,
        borderRadius: appliedTheme.borders.borderRadius,
        boxShadow: appliedTheme.borders.boxShadow,
        padding: appliedTheme.spacing.lg,
        marginBottom: appliedTheme.spacing.lg
      }
    },
      React.createElement('h3', {
        style: {
          fontSize: appliedTheme.font.sizeLg,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'Activity'),
      
      // Month headers
      React.createElement('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: '40px repeat(12, 1fr)',
          gap: appliedTheme.spacing.xs,
          marginBottom: appliedTheme.spacing.sm
        }
      }, ...monthHeaders),
      
      // Activity grid
      React.createElement('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: '40px repeat(12, 1fr)',
          gap: appliedTheme.spacing.xs
        }
      },
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: appliedTheme.spacing.xs
          }
        }, ...dayLabels),
        ...activityColumns
      ),
      
      // Activity legend
      React.createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: appliedTheme.spacing.md
        }
      },
        React.createElement('span', {
          style: {
            fontSize: appliedTheme.font.sizeXs,
            color: appliedTheme.colors.textSecondary
          }
        }, 'What is this?'),
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: appliedTheme.spacing.xs
          }
        },
          React.createElement('span', {
            style: {
              fontSize: appliedTheme.font.sizeXs,
              color: appliedTheme.colors.textSecondary
            }
          }, 'Less'),
          ...legendSquares,
          React.createElement('span', {
            style: {
              fontSize: appliedTheme.font.sizeXs,
              color: appliedTheme.colors.textSecondary
            }
          }, 'More')
        )
      )
    );
  };

  return React.createElement('div', {
    style: {
      padding: appliedTheme.spacing.lg,
      display: 'flex',
      gap: appliedTheme.spacing.lg
    }
  },
    // Left Column - Main Content
    React.createElement('div', {
      style: {
        flex: 1
      }
    },
      // Activity Heatmap using professional library
      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          boxShadow: appliedTheme.borders.boxShadow,
          padding: appliedTheme.spacing.lg,
          marginBottom: appliedTheme.spacing.lg
        }
      },
        React.createElement('h3', {
          style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
          }
        }, 'Activity'),
        activityData.length > 0 ? React.createElement(ActivityCalendar, {
          data: activityData,
          theme: {
            light: [
              appliedTheme.colors.surfaceAlt,
              `${themeColors.primary}40`,
              `${themeColors.primary}60`,
              `${themeColors.primary}80`,
              themeColors.primary
            ],
            dark: [
              appliedTheme.colors.surfaceAlt,
              `${themeColors.primary}40`,
              `${themeColors.primary}60`,
              `${themeColors.primary}80`,
              themeColors.primary
            ]
          },
          colorScheme: 'light',
          blockSize: 12,
          blockMargin: 2,
          fontSize: 12,
          hideColorLegend: false,
          hideMonthLabels: false,
          hideTotalCount: false,
          style: {
            color: appliedTheme.colors.textPrimary
          }
        }) : React.createElement('div', {
          style: {
            padding: '40px 20px',
            backgroundColor: appliedTheme.colors.surfaceAlt,
            borderRadius: appliedTheme.borders.borderRadius,
            textAlign: 'center',
            color: appliedTheme.colors.textSecondary
          }
        }, 'No activity data available'),
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: appliedTheme.spacing.sm
          }
        },
          React.createElement('span', {
            style: {
              fontSize: appliedTheme.font.sizeXs,
              color: appliedTheme.colors.textSecondary
            }
          }, 'What is this?')
        )
      ),
      
      // Owned Communities
      ownedCommunities.length > 0 && React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          boxShadow: appliedTheme.borders.boxShadow,
          padding: appliedTheme.spacing.lg,
          marginBottom: appliedTheme.spacing.lg
        }
      },
        React.createElement('h3', {
          style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
          }
        }, `Owned by ${userProfile.displayName || currentUser.profile.displayName || 'User'}`),
        React.createElement('div', {}, 
          ownedCommunities.map((community: any) =>
            React.createElement('div', {
              key: community.id,
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: appliedTheme.spacing.md,
                backgroundColor: appliedTheme.colors.surfaceAlt,
                borderRadius: appliedTheme.borders.borderRadius,
                marginBottom: appliedTheme.spacing.sm,
                cursor: 'pointer'
              },
              onClick: () => handleViewCommunity(community.id)
            },
              React.createElement('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: appliedTheme.spacing.md
                }
              },
                React.createElement('div', {
                  style: {
                    width: '48px',
                    height: '48px',
                    borderRadius: appliedTheme.borders.borderRadius,
                    backgroundColor: community.color || themeColors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: appliedTheme.font.sizeLg
                  }
                }, community.initials),
                React.createElement('div', {},
                  React.createElement('h4', {
                    style: {
                      fontSize: appliedTheme.font.sizeMd,
                      fontWeight: 600,
                      margin: 0,
                      marginBottom: '2px',
                      color: appliedTheme.colors.textPrimary
                    }
                  }, community.name),
                  React.createElement('p', {
                    style: {
                      fontSize: appliedTheme.font.sizeSm,
                      color: appliedTheme.colors.textSecondary,
                      margin: 0
                    }
                  }, `${community.memberCount} member${community.memberCount !== 1 ? 's' : ''} • ${community.type}`)
                )
              ),
              React.createElement('button', {
                style: {
                  padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: appliedTheme.borders.borderRadius,
                  fontSize: appliedTheme.font.sizeSm,
                  fontWeight: 500,
                  cursor: 'pointer'
                }
              }, 'VIEW')
            )
          )
        )
      ),
      
      // Memberships
      memberships.length > 0 && React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          boxShadow: appliedTheme.borders.boxShadow,
          padding: appliedTheme.spacing.lg,
          marginBottom: appliedTheme.spacing.lg
        }
      },
        React.createElement('h3', {
          style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
          }
        }, 'Memberships'),
        React.createElement('div', {
          style: {
            display: 'flex',
            gap: appliedTheme.spacing.md
          }
        },
          memberships.map((membership: any) =>
            React.createElement('div', {
              key: membership.id,
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: appliedTheme.spacing.sm,
                cursor: 'pointer'
              },
              onClick: () => handleViewCommunity(membership.id)
            },
              React.createElement('div', {
                style: {
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: membership.color || themeColors.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: appliedTheme.font.sizeMd
                }
              }, membership.initials),
              React.createElement('div', {},
                React.createElement('p', {
                  style: {
                    fontSize: appliedTheme.font.sizeSm,
                    fontWeight: 500,
                    margin: 0,
                    color: appliedTheme.colors.textPrimary
                  }
                }, membership.name),
                React.createElement('p', {
                  style: {
                    fontSize: appliedTheme.font.sizeXs,
                    color: appliedTheme.colors.textSecondary,
                    margin: 0
                  }
                }, `${membership.memberCount} members • ${membership.type}`)
              )
            )
          )
        )
      ),
      
      // Contributions
      contributions.length > 0 && React.createElement('div', {
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
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: appliedTheme.spacing.lg
          }
        },
          React.createElement('h3', {
            style: {
              fontSize: appliedTheme.font.sizeLg,
              fontWeight: 600,
              color: appliedTheme.colors.textPrimary,
              margin: 0
            }
          }, `${stats.contributions} contribution${stats.contributions !== 1 ? 's' : ''}`),
          React.createElement('select', {
            style: {
              padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
              border: `1px solid ${appliedTheme.borders.borderColor}`,
              borderRadius: appliedTheme.borders.borderRadius,
              fontSize: appliedTheme.font.sizeSm,
              backgroundColor: appliedTheme.colors.surface
            }
          },
            React.createElement('option', { value: 'all' }, 'Contributions for: Growthworks C...')
          )
        ),
        
        // Contributions list
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: appliedTheme.spacing.lg
          }
        },
          contributions.map((contribution: any) =>
            React.createElement('div', {
              key: contribution.id,
              style: {
                cursor: 'pointer'
              },
              onClick: () => handleViewContribution(contribution.id)
            },
              React.createElement('div', {
                style: {
                  display: 'flex',
                  gap: appliedTheme.spacing.md,
                  marginBottom: appliedTheme.spacing.sm
                }
              },
                React.createElement('div', {
                  style: {
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: appliedTheme.colors.surfaceAlt,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }
                },
                  contribution.avatar
                    ? React.createElement('img', {
                        src: contribution.avatar,
                        alt: contribution.author,
                        style: {
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }
                      })
                    : React.createElement('span', {
                        style: {
                          fontSize: appliedTheme.font.sizeSm
                        }
                      }, contribution.author?.charAt(0) || '👤')
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
                      gap: appliedTheme.spacing.sm,
                      marginBottom: appliedTheme.spacing.xs
                    }
                  },
                    React.createElement('span', {
                      style: {
                        fontSize: appliedTheme.font.sizeSm,
                        fontWeight: 500,
                        color: appliedTheme.colors.textPrimary
                      }
                    }, contribution.author),
                    React.createElement('span', {
                      style: {
                        fontSize: appliedTheme.font.sizeXs,
                        color: appliedTheme.colors.textSecondary
                      }
                    }, `${contribution.date} • ${contribution.category}`)
                  ),
                  React.createElement('h4', {
                    style: {
                      fontSize: appliedTheme.font.sizeMd,
                      fontWeight: 600,
                      margin: 0,
                      marginBottom: appliedTheme.spacing.sm,
                      color: appliedTheme.colors.textPrimary
                    }
                  }, contribution.title),
                  React.createElement('p', {
                    style: {
                      fontSize: appliedTheme.font.sizeSm,
                      color: appliedTheme.colors.textSecondary,
                      margin: 0,
                      marginBottom: appliedTheme.spacing.sm,
                      lineHeight: 1.5
                    }
                  }, contribution.content),
                  React.createElement('div', {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: appliedTheme.spacing.md
                    }
                  },
                    React.createElement('div', {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: appliedTheme.spacing.xs,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        transition: 'background-color 0.2s ease'
                      },
                      onClick: () => handleLikePost(contribution.id),
                      onMouseEnter: (e: any) => {
                        e.target.style.backgroundColor = appliedTheme.colors.surfaceAlt;
                      },
                      onMouseLeave: (e: any) => {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    },
                      React.createElement('span', {
                        style: {
                          fontSize: appliedTheme.font.sizeSm,
                          color: appliedTheme.colors.textSecondary
                        }
                      }, '👍'),
                      React.createElement('span', {
                        style: {
                          fontSize: appliedTheme.font.sizeSm,
                          color: appliedTheme.colors.textSecondary
                        }
                      }, contribution.likes || 0)
                    ),
                    React.createElement('div', {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: appliedTheme.spacing.xs
                      }
                    },
                      React.createElement('span', {
                        style: {
                          fontSize: appliedTheme.font.sizeSm,
                          color: appliedTheme.colors.textSecondary
                        }
                      }, '💬'),
                      React.createElement('span', {
                        style: {
                          fontSize: appliedTheme.font.sizeSm,
                          color: appliedTheme.colors.textSecondary
                        }
                      }, contribution.comments || 0)
                    ),
                    contribution.newComment && React.createElement('div', {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: appliedTheme.spacing.xs
                      }
                    },
                      React.createElement('span', {
                        style: {
                          fontSize: appliedTheme.font.sizeXs,
                          color: themeColors.primary,
                          fontWeight: 500
                        }
                      }, `New comment ${contribution.newComment}`)
                    )
                  )
                )
              )
            )
          )
        ),
        
        // Pagination
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: appliedTheme.spacing.lg,
            paddingTop: appliedTheme.spacing.lg,
            borderTop: `1px solid ${appliedTheme.borders.borderColor}`
          }
        },
          React.createElement('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: appliedTheme.spacing.sm
            }
          },
            React.createElement('button', {
              style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                border: `1px solid ${appliedTheme.borders.borderColor}`,
                borderRadius: appliedTheme.borders.borderRadius,
                backgroundColor: appliedTheme.colors.surface,
                color: appliedTheme.colors.textSecondary,
                fontSize: appliedTheme.font.sizeSm,
                cursor: 'pointer'
              }
            }, '< Previous'),
            React.createElement('span', {
              style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                backgroundColor: themeColors.primary,
                color: 'white',
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeSm,
                fontWeight: 500
              }
            }, '1'),
            React.createElement('button', {
              style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                border: `1px solid ${appliedTheme.borders.borderColor}`,
                borderRadius: appliedTheme.borders.borderRadius,
                backgroundColor: appliedTheme.colors.surface,
                color: appliedTheme.colors.textSecondary,
                fontSize: appliedTheme.font.sizeSm,
                cursor: 'pointer'
              }
            }, 'Next >')
          ),
          React.createElement('span', {
            style: {
              fontSize: appliedTheme.font.sizeXs,
              color: appliedTheme.colors.textSecondary
            }
          }, '1-1 of 1')
        )
      )
    ),
    
    // Right Column - Profile Card  
    React.createElement('div', {
      style: {
        width: '350px',
        backgroundColor: appliedTheme.colors.surface,
        borderRadius: appliedTheme.borders.borderRadius,
        boxShadow: appliedTheme.borders.boxShadow,
        padding: appliedTheme.spacing.lg,
        alignSelf: 'flex-start'
      }
    },
      // Profile picture section
      React.createElement('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: appliedTheme.spacing.md
        }
      },
        React.createElement('div', {
          style: {
            position: 'relative',
            marginBottom: appliedTheme.spacing.sm
          }
        },
          React.createElement('div', {
            style: {
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: appliedTheme.colors.surfaceAlt,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              border: `3px solid ${themeColors.primary}`,
              overflow: 'hidden'
            }
          }, (userProfile.displayName || currentUser.profile.displayName)?.charAt(0) || '👤'),
          React.createElement('div', {
            style: {
              position: 'absolute',
              bottom: '-3px',
              right: '-3px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: themeColors.primary,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: appliedTheme.font.sizeXs,
              border: `2px solid ${appliedTheme.colors.surface}`
            }
          }, userProfile.level || '1')
        ),
        React.createElement('div', {
          style: {
            textAlign: 'center'
          }
        },
          React.createElement('p', {
            style: {
              fontSize: appliedTheme.font.sizeXs,
              color: themeColors.primary,
              fontWeight: 600,
              margin: 0,
              marginBottom: '2px'
            }
          }, `Level ${userProfile.level || 1}`),
          React.createElement('p', {
            style: {
              fontSize: appliedTheme.font.sizeXs,
              color: appliedTheme.colors.textSecondary,
              margin: 0
            }
          }, `${userProfile.pointsToNext || 2} points to level up`)
        )
      ),
      
      // User info
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeLg,
          fontWeight: 600,
          margin: 0,
          marginBottom: '4px',
          color: appliedTheme.colors.textPrimary,
          textAlign: 'center'
        }
      }, userProfile.displayName || currentUser.profile.displayName || 'User'),
      React.createElement('p', {
        style: {
          fontSize: appliedTheme.font.sizeSm,
          color: appliedTheme.colors.textSecondary,
          margin: 0,
          marginBottom: '4px',
          textAlign: 'center'
        }
      }, userProfile.username || '@username'),
      React.createElement('p', {
        style: {
          fontSize: appliedTheme.font.sizeSm,
          color: appliedTheme.colors.textPrimary,
          margin: 0,
          marginBottom: appliedTheme.spacing.sm,
          textAlign: 'center'
        }
      }, userProfile.bio || 'User bio'),
      
      // Separator line
      React.createElement('div', {
        style: {
          height: '1px',
          backgroundColor: appliedTheme.borders.borderColor,
          margin: `${appliedTheme.spacing.sm} 0`
        }
      }),
      
      // Online status and join date
      React.createElement('div', {
        style: {
          marginBottom: appliedTheme.spacing.sm
        }
      },
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: appliedTheme.spacing.sm,
            marginBottom: '4px',
            justifyContent: 'center'
          }
        },
          React.createElement('div', {
            style: {
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#22c55e'
            }
          }),
          React.createElement('span', {
            style: {
              fontSize: appliedTheme.font.sizeSm,
              color: appliedTheme.colors.textPrimary,
              fontWeight: 500
            }
          }, 'Online now')
        ),
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: appliedTheme.spacing.sm,
            justifyContent: 'center'
          }
        },
          React.createElement('span', {
            style: {
              fontSize: appliedTheme.font.sizeSm,
              color: appliedTheme.colors.textSecondary
            }
          }, '📅'),
          React.createElement('span', {
            style: {
              fontSize: appliedTheme.font.sizeSm,
              color: appliedTheme.colors.textPrimary
            }
          }, userProfile.joinDate || 'Join date not available')
        )
      ),
      
      // Separator line
      React.createElement('div', {
        style: {
          height: '1px',
          backgroundColor: appliedTheme.borders.borderColor,
          margin: `${appliedTheme.spacing.sm} 0`
        }
      }),
      
      // Stats grid
      React.createElement('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: appliedTheme.spacing.sm,
          marginBottom: appliedTheme.spacing.sm
        }
      },
        React.createElement('div', {
          style: {
            textAlign: 'center'
          }
        },
          React.createElement('div', {
            style: {
              fontSize: appliedTheme.font.sizeLg,
              fontWeight: 600,
              color: appliedTheme.colors.textPrimary,
              marginBottom: '2px'
            }
          }, stats.contributions),
          React.createElement('div', {
            style: {
              fontSize: appliedTheme.font.sizeXs,
              color: appliedTheme.colors.textSecondary,
              textTransform: 'lowercase',
              letterSpacing: '0.05em'
            }
          }, 'contributions')
        ),
        React.createElement('div', {
          style: {
            textAlign: 'center'
          }
        },
          React.createElement('div', {
            style: {
              fontSize: appliedTheme.font.sizeLg,
              fontWeight: 600,
              color: appliedTheme.colors.textPrimary,
              marginBottom: '2px'
            }
          }, stats.followers),
          React.createElement('div', {
            style: {
              fontSize: appliedTheme.font.sizeXs,
              color: appliedTheme.colors.textSecondary,
              textTransform: 'lowercase',
              letterSpacing: '0.05em'
            }
          }, 'followers')
        ),
        React.createElement('div', {
          style: {
            textAlign: 'center'
          }
        },
          React.createElement('div', {
            style: {
              fontSize: appliedTheme.font.sizeLg,
              fontWeight: 600,
              color: appliedTheme.colors.textPrimary,
              marginBottom: '2px'
            }
          }, stats.following),
          React.createElement('div', {
            style: {
              fontSize: appliedTheme.font.sizeXs,
              color: appliedTheme.colors.textSecondary,
              textTransform: 'lowercase',
              letterSpacing: '0.05em'
            }
          }, 'following')
        )
      ),
      
      // Separator line before button
      React.createElement('div', {
        style: {
          height: '1px',
          backgroundColor: appliedTheme.borders.borderColor,
          margin: `${appliedTheme.spacing.sm} 0`
        }
      }),
      
      // Edit Profile button
      React.createElement('button', {
        onClick: handleEditProfile,
        style: {
          width: 'calc(100% - 16px)',
          margin: '0 8px',
          padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
          backgroundColor: themeColors.primary,
          border: 'none',
          borderRadius: appliedTheme.borders.borderRadius,
          color: 'white',
          fontSize: appliedTheme.font.sizeSm,
          fontWeight: 500,
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          transition: 'all 0.2s ease'
        },
        onMouseEnter: (e: any) => {
          e.target.style.backgroundColor = themeColors.secondary;
        },
        onMouseLeave: (e: any) => {
          e.target.style.backgroundColor = themeColors.primary;
        }
      }, 'EDIT PROFILE')
    )
  );
};

export const communityMyProfilePlugin: Plugin = {
  id: 'community-my-profile',
  name: 'My Profile',
  component: CommunityMyProfileComponent,
  icon: '',
  order: 8
};