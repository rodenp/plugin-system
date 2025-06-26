import * as React from 'react';
import type { PluginProps } from '../../types/plugin-interface';
import { defaultTheme } from '../shared/default-theme';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsConfig {
  providers: Array<'google-analytics' | 'mixpanel' | 'posthog' | 'amplitude' | 'custom'>;
  googleAnalytics?: {
    trackingId: string;
    gtag?: boolean;
    sendPageView?: boolean;
  };
  mixpanel?: {
    token: string;
    apiSecret?: string;
  };
  posthog?: {
    apiKey: string;
    host?: string;
  };
  amplitude?: {
    apiKey: string;
  };
  custom?: {
    endpoint: string;
    apiKey?: string;
    headers?: Record<string, string>;
  };
  enabledEvents: string[];
  userProperties: string[];
  courseProperties: string[];
}

export interface AnalyticsEvent {
  id: string;
  name: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: Date;
  provider: string;
  sent: boolean;
}

export interface UserAnalytics {
  userId: string;
  totalEvents: number;
  coursesStarted: number;
  coursesCompleted: number;
  totalTimeSpent: number;
  averageSessionDuration: number;
  lastActivity: Date;
  deviceInfo: {
    browser?: string;
    os?: string;
    device?: string;
  };
  locationInfo: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

export interface CourseAnalytics {
  courseId: string;
  totalEnrollments: number;
  totalCompletions: number;
  averageCompletionTime: number;
  averageRating: number;
  dropOffPoints: Array<{
    lessonId: string;
    dropOffRate: number;
  }>;
  engagementMetrics: {
    averageTimePerLesson: number;
    totalInteractions: number;
    commentsCount: number;
    questionsCount: number;
  };
}

interface AnalyticsProps extends PluginProps {
  // Data from host app
  config?: AnalyticsConfig;
  events?: AnalyticsEvent[];
  userAnalytics?: Record<string, UserAnalytics>;
  courseAnalytics?: Record<string, CourseAnalytics>;
  isInitialized?: boolean;
  isTracking?: boolean;
  loading?: boolean;
  error?: string;
  
  // Action callbacks
  onInitializeAnalytics?: (config: AnalyticsConfig) => Promise<void>;
  onTrackEvent?: (name: string, properties?: Record<string, any>, userId?: string) => Promise<void>;
  onIdentifyUser?: (userId: string, properties: Record<string, any>) => Promise<void>;
  onTrackPageView?: (path: string, title?: string) => Promise<void>;
  onUpdateConfig?: (config: Partial<AnalyticsConfig>) => Promise<void>;
  onToggleTracking?: (enabled: boolean) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AnalyticsComponent: React.FC<AnalyticsProps> = ({
  currentUser,
  communityId,
  community,
  userRole,
  theme,
  config,
  events = [],
  userAnalytics = {},
  courseAnalytics = {},
  isInitialized = false,
  isTracking = false,
  loading = false,
  error,
  onInitializeAnalytics,
  onTrackEvent,
  onIdentifyUser,
  onTrackPageView,
  onUpdateConfig,
  onToggleTracking,
}) => {
  // Apply theme
  const appliedTheme = theme || defaultTheme;

  // Local state
  const [activeTab, setActiveTab] = React.useState<'overview' | 'events' | 'users' | 'courses' | 'config'>('overview');
  const [selectedTimeRange, setSelectedTimeRange] = React.useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Event handlers
  const handleTestEvent = async () => {
    if (onTrackEvent) {
      try {
        await onTrackEvent('test_event', {
          timestamp: new Date().toISOString(),
          source: 'analytics_dashboard',
          user_role: userRole
        }, currentUser.id);
      } catch (error) {
        console.error('Failed to track test event:', error);
      }
    }
  };

  const handleToggleTracking = async () => {
    if (onToggleTracking) {
      try {
        await onToggleTracking(!isTracking);
      } catch (error) {
        console.error('Failed to toggle tracking:', error);
      }
    }
  };

  const handleIdentifyCurrentUser = async () => {
    if (onIdentifyUser && currentUser) {
      try {
        await onIdentifyUser(currentUser.id, {
          email: currentUser.email,
          name: currentUser.profile?.displayName,
          role: userRole,
          community_id: communityId
        });
      } catch (error) {
        console.error('Failed to identify user:', error);
      }
    }
  };

  // Helper functions
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getRecentEvents = () => {
    return events
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  };

  const getTotalEvents = () => events.length;
  const getTotalUsers = () => Object.keys(userAnalytics).length;
  const getTotalCourses = () => Object.keys(courseAnalytics).length;

  // Render tab navigation
  const renderTabNavigation = () => (
    React.createElement('div', {
      style: {
        display: 'flex',
        borderBottom: `1px solid ${appliedTheme.borders.borderColor}`,
        marginBottom: appliedTheme.spacing.lg
      }
    },
      ['overview', 'events', 'users', 'courses', 'config'].map(tab => 
        React.createElement('button', {
          key: tab,
          onClick: () => setActiveTab(tab as any),
          style: {
            padding: `${appliedTheme.spacing.md} ${appliedTheme.spacing.lg}`,
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === tab ? `2px solid ${appliedTheme.colors.secondary}` : '2px solid transparent',
            color: activeTab === tab ? appliedTheme.colors.secondary : appliedTheme.colors.textSecondary,
            fontWeight: activeTab === tab ? 600 : 'normal',
            cursor: 'pointer',
            textTransform: 'capitalize'
          }
        }, tab)
      )
    )
  );

  // Render overview stats
  const renderOverview = () => (
    React.createElement('div', {},
      React.createElement('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: appliedTheme.spacing.lg,
          marginBottom: appliedTheme.spacing.xl
        }
      },
        [
          { label: 'Total Events', value: getTotalEvents() },
          { label: 'Total Users', value: getTotalUsers() },
          { label: 'Total Courses', value: getTotalCourses() },
          { label: 'Tracking Status', value: isTracking ? 'Active' : 'Disabled' }
        ].map((stat, index) =>
          React.createElement('div', {
            key: index,
            style: {
              backgroundColor: appliedTheme.colors.surface,
              borderRadius: appliedTheme.borders.borderRadius,
              padding: appliedTheme.spacing.lg,
              border: `1px solid ${appliedTheme.borders.borderColor}`,
              textAlign: 'center'
            }
          },
            React.createElement('div', {
              style: {
                fontSize: appliedTheme.font.sizeXl,
                fontWeight: 600,
                color: appliedTheme.colors.textPrimary,
                marginBottom: appliedTheme.spacing.xs
              }
            }, stat.value),
            React.createElement('div', {
              style: {
                fontSize: appliedTheme.font.sizeSm,
                color: appliedTheme.colors.textSecondary
              }
            }, stat.label)
          )
        )
      ),
      
      React.createElement('div', {
        style: {
          display: 'flex',
          gap: appliedTheme.spacing.md,
          marginBottom: appliedTheme.spacing.lg
        }
      },
        React.createElement('button', {
          onClick: handleTestEvent,
          style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
          }
        }, 'Track Test Event'),
        React.createElement('button', {
          onClick: handleToggleTracking,
          style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: isTracking ? appliedTheme.colors.danger : appliedTheme.colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
          }
        }, isTracking ? 'Disable Tracking' : 'Enable Tracking'),
        React.createElement('button', {
          onClick: handleIdentifyCurrentUser,
          style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
          }
        }, 'Identify Current User')
      ),

      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          padding: appliedTheme.spacing.lg,
          border: `1px solid ${appliedTheme.borders.borderColor}`
        }
      },
        React.createElement('h3', {
          style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.md,
            color: appliedTheme.colors.textPrimary
          }
        }, 'Recent Events'),
        getRecentEvents().length > 0 ? (
          React.createElement('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: appliedTheme.spacing.sm
            }
          },
            getRecentEvents().map(event =>
              React.createElement('div', {
                key: event.id,
                style: {
                  padding: appliedTheme.spacing.sm,
                  backgroundColor: appliedTheme.colors.background,
                  borderRadius: appliedTheme.borders.borderRadius,
                  fontSize: appliedTheme.font.sizeSm
                }
              },
                React.createElement('div', {
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }
                },
                  React.createElement('span', {
                    style: {
                      fontWeight: 500,
                      color: appliedTheme.colors.textPrimary
                    }
                  }, event.name),
                  React.createElement('span', {
                    style: {
                      color: appliedTheme.colors.textSecondary
                    }
                  }, formatDate(event.timestamp))
                ),
                Object.keys(event.properties).length > 0 && React.createElement('div', {
                  style: {
                    marginTop: appliedTheme.spacing.xs,
                    color: appliedTheme.colors.textSecondary,
                    fontSize: appliedTheme.font.sizeXs
                  }
                }, JSON.stringify(event.properties, null, 2))
              )
            )
          )
        ) : (
          React.createElement('p', {
            style: {
              color: appliedTheme.colors.textSecondary,
              textAlign: 'center',
              margin: 0
            }
          }, 'No events tracked yet.')
        )
      )
    )
  );

  // Render events list
  const renderEvents = () => (
    React.createElement('div', {},
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeXl,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'All Events'),
      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          padding: appliedTheme.spacing.lg,
          border: `1px solid ${appliedTheme.borders.borderColor}`
        }
      },
        events.length > 0 ? (
          React.createElement('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: appliedTheme.spacing.sm,
              maxHeight: '500px',
              overflowY: 'auto'
            }
          },
            events.map(event =>
              React.createElement('div', {
                key: event.id,
                style: {
                  padding: appliedTheme.spacing.md,
                  backgroundColor: appliedTheme.colors.background,
                  borderRadius: appliedTheme.borders.borderRadius,
                  border: `1px solid ${appliedTheme.borders.borderColor}`
                }
              },
                React.createElement('div', {
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: appliedTheme.spacing.xs
                  }
                },
                  React.createElement('span', {
                    style: {
                      fontWeight: 600,
                      fontSize: appliedTheme.font.sizeMd,
                      color: appliedTheme.colors.textPrimary
                    }
                  }, event.name),
                  React.createElement('span', {
                    style: {
                      fontSize: appliedTheme.font.sizeSm,
                      color: appliedTheme.colors.textSecondary
                    }
                  }, formatDate(event.timestamp))
                ),
                event.userId && React.createElement('div', {
                  style: {
                    fontSize: appliedTheme.font.sizeSm,
                    color: appliedTheme.colors.textSecondary,
                    marginBottom: appliedTheme.spacing.xs
                  }
                }, `User: ${event.userId}`),
                Object.keys(event.properties).length > 0 && React.createElement('pre', {
                  style: {
                    fontSize: appliedTheme.font.sizeXs,
                    color: appliedTheme.colors.textSecondary,
                    backgroundColor: appliedTheme.colors.muted + '20',
                    padding: appliedTheme.spacing.xs,
                    borderRadius: appliedTheme.borders.borderRadius,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }
                }, JSON.stringify(event.properties, null, 2))
              )
            )
          )
        ) : (
          React.createElement('p', {
            style: {
              color: appliedTheme.colors.textSecondary,
              textAlign: 'center',
              margin: 0
            }
          }, 'No events tracked yet.')
        )
      )
    )
  );

  return React.createElement('div', {
    style: {
      padding: appliedTheme.spacing.lg
    }
  },
    renderTabNavigation(),
    
    // Error display
    error && React.createElement('div', {
      style: {
        margin: `${appliedTheme.spacing.lg} 0`,
        padding: appliedTheme.spacing.md,
        backgroundColor: appliedTheme.colors.danger + '10',
        border: `1px solid ${appliedTheme.colors.danger}`,
        borderRadius: appliedTheme.borders.borderRadius,
        color: appliedTheme.colors.danger,
        fontSize: appliedTheme.font.sizeSm
      }
    }, error),

    // Loading state
    loading && React.createElement('div', {
      style: {
        textAlign: 'center',
        padding: appliedTheme.spacing.xl,
        color: appliedTheme.colors.textSecondary
      }
    }, 'Loading analytics...'),

    // Tab content
    !loading && activeTab === 'overview' && renderOverview(),
    !loading && activeTab === 'events' && renderEvents(),
    
    activeTab === 'users' && React.createElement('div', {
      style: {
        textAlign: 'center',
        padding: appliedTheme.spacing.xl,
        color: appliedTheme.colors.textSecondary
      }
    }, `${getTotalUsers()} user analytics available`),
    
    activeTab === 'courses' && React.createElement('div', {
      style: {
        textAlign: 'center',
        padding: appliedTheme.spacing.xl,
        color: appliedTheme.colors.textSecondary
      }
    }, `${getTotalCourses()} course analytics available`),
    
    activeTab === 'config' && React.createElement('div', {},
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeXl,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'Analytics Configuration'),
      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          padding: appliedTheme.spacing.lg
        }
      },
        React.createElement('p', {
          style: {
            color: appliedTheme.colors.textSecondary,
            margin: 0
          }
        }, config ? 'Analytics configuration is loaded.' : 'No analytics configuration found.')
      )
    )
  );
};