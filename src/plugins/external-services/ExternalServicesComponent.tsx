import * as React from 'react';
import type { PluginProps } from '../../types/plugin-interface';
import { defaultTheme } from '../shared/default-theme';

// ============================================================================
// TYPES (copied from original Redux plugin)
// ============================================================================

export interface ServiceConfig {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'video' | 'ai' | 'storage' | 'cdn' | 'webhook' | 'integration';
  provider: string;
  enabled: boolean;
  credentials: Record<string, string>;
  settings: Record<string, any>;
  endpoints?: {
    baseUrl?: string;
    auth?: string;
    webhook?: string;
  };
  rateLimits?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
  retryConfig?: {
    maxRetries?: number;
    backoffMs?: number;
  };
}

export interface ServiceStatus {
  serviceId: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastChecked: Date;
  responseTime?: number;
  errorMessage?: string;
  uptime?: number;
}

export interface ServiceUsage {
  serviceId: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  totalCost?: number;
  period: 'hour' | 'day' | 'month';
  timestamp: Date;
}

export interface WebhookEvent {
  id: string;
  serviceId: string;
  event: string;
  payload: any;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

interface ExternalServicesProps extends PluginProps {
  // Data from host app
  services?: Record<string, ServiceConfig>;
  statuses?: Record<string, ServiceStatus>;
  usage?: Record<string, ServiceUsage[]>;
  webhookEvents?: WebhookEvent[];
  loading?: boolean;
  error?: string;
  
  // Action callbacks
  onInitializeServices?: (services: ServiceConfig[]) => Promise<void>;
  onTestConnection?: (serviceId: string) => Promise<void>;
  onSendEmail?: (to: string | string[], subject: string, body?: string, template?: string, data?: any) => Promise<void>;
  onUploadFile?: (file: File, path?: string, metadata?: any) => Promise<void>;
  onGenerateContent?: (prompt: string, contentType?: string, options?: any) => Promise<void>;
  onAddService?: (service: ServiceConfig) => void;
  onUpdateService?: (service: ServiceConfig) => void;
  onRemoveService?: (serviceId: string) => void;
  onSendWebhook?: (url: string, payload: any) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ExternalServicesComponent: React.FC<ExternalServicesProps> = ({
  currentUser,
  communityId,
  community,
  userRole,
  theme,
  services = {},
  statuses = {},
  usage = {},
  webhookEvents = [],
  loading = false,
  error,
  onInitializeServices,
  onTestConnection,
  onSendEmail,
  onUploadFile,
  onGenerateContent,
  onAddService,
  onUpdateService,
  onRemoveService,
  onSendWebhook,
}) => {
  // Apply theme
  const appliedTheme = theme || defaultTheme;

  // Local state
  const [activeTab, setActiveTab] = React.useState<'services' | 'status' | 'usage' | 'webhooks' | 'test'>('services');
  const [showAddService, setShowAddService] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<ServiceConfig | null>(null);
  const [testResults, setTestResults] = React.useState<Record<string, any>>({});

  // Computed values
  const serviceCount = Object.keys(services).length;
  const healthyServices = Object.values(statuses).filter(s => s.status === 'healthy').length;
  const totalRequests = Object.values(usage).reduce((sum, serviceUsage) => 
    sum + serviceUsage.reduce((total, record) => total + record.requestCount, 0), 0
  );
  const totalErrors = Object.values(usage).reduce((sum, serviceUsage) => 
    sum + serviceUsage.reduce((total, record) => total + record.errorCount, 0), 0
  );

  // Helper functions
  const getServiceTypeIcon = (type: ServiceConfig['type']) => {
    switch (type) {
      case 'email': return '📧';
      case 'sms': return '💬';
      case 'video': return '📹';
      case 'ai': return '🤖';
      case 'storage': return '💾';
      case 'cdn': return '🌐';
      case 'webhook': return '🔗';
      case 'integration': return '🔌';
      default: return '⚙️';
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return appliedTheme.colors.secondary;
      case 'degraded':
        return appliedTheme.colors.warning;
      case 'down':
        return appliedTheme.colors.danger;
      default:
        return appliedTheme.colors.muted;
    }
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Event handlers
  const handleTestConnection = async (serviceId: string) => {
    if (onTestConnection) {
      try {
        setTestResults(prev => ({ ...prev, [serviceId]: 'testing' }));
        await onTestConnection(serviceId);
        setTestResults(prev => ({ ...prev, [serviceId]: 'success' }));
      } catch (error) {
        setTestResults(prev => ({ ...prev, [serviceId]: 'error' }));
        console.error('Failed to test connection:', error);
      }
    }
  };

  const handleSendTestEmail = async () => {
    if (onSendEmail) {
      try {
        await onSendEmail(
          currentUser.email,
          'Test Email from External Services',
          '<h1>Test Email</h1><p>This is a test email sent from the External Services plugin.</p>',
          undefined,
          { userName: currentUser.profile.displayName }
        );
      } catch (error) {
        console.error('Failed to send test email:', error);
      }
    }
  };

  const handleGenerateTestContent = async () => {
    if (onGenerateContent) {
      try {
        await onGenerateContent(
          'Write a short welcome message for a new course platform user',
          'text',
          { maxTokens: 100, temperature: 0.7 }
        );
      } catch (error) {
        console.error('Failed to generate content:', error);
      }
    }
  };

  const handleAddService = () => {
    if (onAddService) {
      const newService: ServiceConfig = {
        id: `service-${Date.now()}`,
        name: 'New Service',
        type: 'integration',
        provider: 'custom',
        enabled: false,
        credentials: {},
        settings: {},
        endpoints: {
          baseUrl: 'https://api.example.com'
        },
        rateLimits: {
          requestsPerMinute: 60
        }
      };
      onAddService(newService);
      setShowAddService(false);
    }
  };

  // Render helpers
  const renderTabNavigation = () => (
    React.createElement('div', {
      style: {
        display: 'flex',
        borderBottom: `1px solid ${appliedTheme.borders.borderColor}`,
        marginBottom: appliedTheme.spacing.lg
      }
    },
      ['services', 'status', 'usage', 'webhooks', 'test'].map(tab =>
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

  const renderOverview = () => (
    React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: appliedTheme.spacing.lg,
        marginBottom: appliedTheme.spacing.xl
      }
    },
      [
        { label: 'Total Services', value: serviceCount },
        { label: 'Healthy Services', value: `${healthyServices}/${serviceCount}` },
        { label: 'Total Requests', value: totalRequests.toLocaleString() },
        { label: 'Total Errors', value: totalErrors.toLocaleString() }
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
    )
  );

  const renderServices = () => (
    React.createElement('div', {},
      renderOverview(),
      React.createElement('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: appliedTheme.spacing.lg
        }
      },
        React.createElement('h2', {
          style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            margin: 0,
            color: appliedTheme.colors.textPrimary
          }
        }, 'External Services'),
        (userRole === 'owner' || userRole === 'admin') && React.createElement('button', {
          onClick: handleAddService,
          style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
          }
        }, 'Add Service')
      ),
      React.createElement('div', {
        style: {
          display: 'grid',
          gap: appliedTheme.spacing.lg
        }
      },
        Object.values(services).length > 0 ?
          Object.values(services).map(service => {
            const status = statuses[service.id];
            const serviceUsage = usage[service.id] || [];
            const totalRequests = serviceUsage.reduce((sum, record) => sum + record.requestCount, 0);

            return React.createElement('div', {
              key: service.id,
              style: {
                backgroundColor: appliedTheme.colors.surface,
                borderRadius: appliedTheme.borders.borderRadius,
                padding: appliedTheme.spacing.lg,
                border: `1px solid ${appliedTheme.borders.borderColor}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }
            },
              React.createElement('div', {
                style: { display: 'flex', alignItems: 'center', gap: appliedTheme.spacing.md }
              },
                React.createElement('div', {
                  style: {
                    fontSize: appliedTheme.font.sizeLg,
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: appliedTheme.colors.background,
                    borderRadius: appliedTheme.borders.borderRadius
                  }
                }, getServiceTypeIcon(service.type)),
                React.createElement('div', {},
                  React.createElement('h3', {
                    style: {
                      fontSize: appliedTheme.font.sizeLg,
                      fontWeight: 600,
                      margin: 0,
                      color: appliedTheme.colors.textPrimary
                    }
                  }, service.name),
                  React.createElement('p', {
                    style: {
                      fontSize: appliedTheme.font.sizeSm,
                      color: appliedTheme.colors.textSecondary,
                      margin: 0
                    }
                  }, `${service.provider} • ${service.type}`)
                )
              ),
              React.createElement('div', {
                style: { display: 'flex', alignItems: 'center', gap: appliedTheme.spacing.md }
              },
                React.createElement('div', {
                  style: { textAlign: 'right' }
                },
                  status && React.createElement('div', {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: appliedTheme.spacing.xs,
                      marginBottom: appliedTheme.spacing.xs
                    }
                  },
                    React.createElement('div', {
                      style: {
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(status.status)
                      }
                    }),
                    React.createElement('span', {
                      style: {
                        fontSize: appliedTheme.font.sizeSm,
                        color: appliedTheme.colors.textSecondary,
                        textTransform: 'capitalize'
                      }
                    }, status.status)
                  ),
                  React.createElement('div', {
                    style: {
                      fontSize: appliedTheme.font.sizeXs,
                      color: appliedTheme.colors.textSecondary
                    }
                  }, `${totalRequests} requests`)
                ),
                React.createElement('button', {
                  onClick: () => handleTestConnection(service.id),
                  disabled: testResults[service.id] === 'testing',
                  style: {
                    padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                    backgroundColor: appliedTheme.colors.accent,
                    color: 'white',
                    border: 'none',
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeXs,
                    cursor: testResults[service.id] === 'testing' ? 'not-allowed' : 'pointer',
                    opacity: testResults[service.id] === 'testing' ? 0.6 : 1
                  }
                }, testResults[service.id] === 'testing' ? 'Testing...' : 'Test')
              )
            );
          }) :
          React.createElement('p', {
            style: {
              textAlign: 'center',
              color: appliedTheme.colors.textSecondary,
              padding: appliedTheme.spacing.xl
            }
          }, 'No external services configured yet.')
      )
    )
  );

  const renderStatus = () => (
    React.createElement('div', {},
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeXl,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'Service Status'),
      React.createElement('div', {
        style: {
          display: 'grid',
          gap: appliedTheme.spacing.md
        }
      },
        Object.values(statuses).length > 0 ?
          Object.values(statuses).map(status =>
            React.createElement('div', {
              key: status.serviceId,
              style: {
                backgroundColor: appliedTheme.colors.surface,
                borderRadius: appliedTheme.borders.borderRadius,
                padding: appliedTheme.spacing.lg,
                border: `1px solid ${appliedTheme.borders.borderColor}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }
            },
              React.createElement('div', {},
                React.createElement('h3', {
                  style: {
                    fontSize: appliedTheme.font.sizeMd,
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: appliedTheme.spacing.xs,
                    color: appliedTheme.colors.textPrimary
                  }
                }, services[status.serviceId]?.name || status.serviceId),
                React.createElement('p', {
                  style: {
                    fontSize: appliedTheme.font.sizeSm,
                    color: appliedTheme.colors.textSecondary,
                    margin: 0
                  }
                }, `Last checked: ${status.lastChecked.toLocaleTimeString()}`)
              ),
              React.createElement('div', {
                style: { textAlign: 'right' }
              },
                React.createElement('div', {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: appliedTheme.spacing.xs,
                    marginBottom: appliedTheme.spacing.xs,
                    justifyContent: 'flex-end'
                  }
                },
                  React.createElement('div', {
                    style: {
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(status.status)
                    }
                  }),
                  React.createElement('span', {
                    style: {
                      fontSize: appliedTheme.font.sizeSm,
                      color: appliedTheme.colors.textPrimary,
                      textTransform: 'capitalize',
                      fontWeight: 500
                    }
                  }, status.status)
                ),
                status.responseTime && React.createElement('div', {
                  style: {
                    fontSize: appliedTheme.font.sizeXs,
                    color: appliedTheme.colors.textSecondary
                  }
                }, formatResponseTime(status.responseTime))
              )
            )
          ) :
          React.createElement('p', {
            style: {
              textAlign: 'center',
              color: appliedTheme.colors.textSecondary,
              padding: appliedTheme.spacing.xl
            }
          }, 'No service status data available.')
      )
    )
  );

  const renderWebhooks = () => (
    React.createElement('div', {},
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeXl,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'Webhook Events'),
      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          padding: appliedTheme.spacing.lg,
          border: `1px solid ${appliedTheme.borders.borderColor}`
        }
      },
        webhookEvents.length > 0 ?
          React.createElement('div', {
            style: {
              display: 'grid',
              gap: appliedTheme.spacing.sm
            }
          },
            webhookEvents.slice(0, 10).map(event =>
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
                      fontSize: appliedTheme.font.sizeSm,
                      fontWeight: 500,
                      color: appliedTheme.colors.textPrimary
                    }
                  }, event.event),
                  React.createElement('span', {
                    style: {
                      padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                      borderRadius: appliedTheme.borders.borderRadius,
                      fontSize: appliedTheme.font.sizeXs,
                      fontWeight: 500,
                      backgroundColor: getStatusColor(event.status === 'completed' ? 'healthy' : event.status === 'failed' ? 'down' : 'degraded') + '20',
                      color: getStatusColor(event.status === 'completed' ? 'healthy' : event.status === 'failed' ? 'down' : 'degraded'),
                      textTransform: 'capitalize'
                    }
                  }, event.status)
                ),
                React.createElement('p', {
                  style: {
                    fontSize: appliedTheme.font.sizeXs,
                    color: appliedTheme.colors.textSecondary,
                    margin: 0
                  }
                }, `${event.serviceId} • ${event.timestamp.toLocaleString()}`)
              )
            )
          ) :
          React.createElement('p', {
            style: {
              textAlign: 'center',
              color: appliedTheme.colors.textSecondary,
              margin: 0
            }
          }, 'No webhook events recorded yet.')
      )
    )
  );

  const renderTestInterface = () => (
    React.createElement('div', {},
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeXl,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'Test Services'),
      React.createElement('div', {
        style: {
          display: 'grid',
          gap: appliedTheme.spacing.lg
        }
      },
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
          }, 'Email Service Test'),
          React.createElement('p', {
            style: {
              fontSize: appliedTheme.font.sizeSm,
              color: appliedTheme.colors.textSecondary,
              marginBottom: appliedTheme.spacing.md
            }
          }, 'Send a test email to verify email service configuration.'),
          React.createElement('button', {
            onClick: handleSendTestEmail,
            style: {
              padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
              backgroundColor: appliedTheme.colors.secondary,
              color: 'white',
              border: 'none',
              borderRadius: appliedTheme.borders.borderRadius,
              fontSize: appliedTheme.font.sizeSm,
              cursor: 'pointer'
            }
          }, 'Send Test Email')
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
          }, 'AI Content Generation Test'),
          React.createElement('p', {
            style: {
              fontSize: appliedTheme.font.sizeSm,
              color: appliedTheme.colors.textSecondary,
              marginBottom: appliedTheme.spacing.md
            }
          }, 'Test AI content generation capabilities.'),
          React.createElement('button', {
            onClick: handleGenerateTestContent,
            style: {
              padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
              backgroundColor: appliedTheme.colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: appliedTheme.borders.borderRadius,
              fontSize: appliedTheme.font.sizeSm,
              cursor: 'pointer'
            }
          }, 'Generate Test Content')
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
    }, 'Loading external services...'),

    // Tab content
    !loading && activeTab === 'services' && renderServices(),
    !loading && activeTab === 'status' && renderStatus(),
    !loading && activeTab === 'webhooks' && renderWebhooks(),
    !loading && activeTab === 'test' && renderTestInterface(),
    
    activeTab === 'usage' && React.createElement('div', {
      style: {
        backgroundColor: appliedTheme.colors.surface,
        borderRadius: appliedTheme.borders.borderRadius,
        padding: appliedTheme.spacing.xl,
        textAlign: 'center',
        border: `1px solid ${appliedTheme.borders.borderColor}`
      }
    },
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeXl,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'Service Usage Analytics'),
      React.createElement('p', {
        style: {
          color: appliedTheme.colors.textSecondary
        }
      }, 'Usage analytics and reporting would be implemented here.')
    )
  );
};