import * as React from 'react';
import { defaultTheme } from '../shared/default-theme';
// ============================================================================
// COMPONENT
// ============================================================================
export const FeatureFlagsComponent = ({ currentUser, communityId, community, userRole, theme, featureFlagsConfig, flags = {}, permissions = {}, userFlags = {}, userPermissions = {}, loading = false, error, lastUpdated, onInitializeFlags, onLoadFlags, onEvaluateFlag, onUpdateFlag, onAddPermission, onRemovePermission, onTestFlag, }) => {
    // Apply theme
    const appliedTheme = theme || defaultTheme;
    // Local state
    const [activeTab, setActiveTab] = React.useState('flags');
    const [selectedFlag, setSelectedFlag] = React.useState(null);
    const [showCreateFlag, setShowCreateFlag] = React.useState(false);
    const [testResults, setTestResults] = React.useState({});
    // Computed values
    const totalFlags = Object.keys(flags).length;
    const enabledFlags = Object.values(flags).filter(f => f.enabled).length;
    const userEnabledFlags = Object.values(userFlags).filter(Boolean).length;
    const totalPermissions = Object.keys(permissions).length;
    // Helper functions
    const getProviderIcon = (provider) => {
        switch (provider) {
            case 'launchdarkly': return '🚀';
            case 'split': return '🎯';
            case 'optimizely': return '🧪';
            case 'custom': return '🔧';
            default: return '💾';
        }
    };
    const getRolloutColor = (percentage) => {
        if (!percentage)
            return appliedTheme.colors.muted;
        if (percentage === 100)
            return appliedTheme.colors.secondary;
        if (percentage >= 50)
            return appliedTheme.colors.warning;
        return appliedTheme.colors.danger;
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };
    // Event handlers
    const handleToggleFlag = async (flag) => {
        if (onUpdateFlag) {
            try {
                await onUpdateFlag({
                    ...flag,
                    enabled: !flag.enabled,
                    updatedAt: new Date()
                });
            }
            catch (error) {
                console.error('Failed to toggle flag:', error);
            }
        }
    };
    const handleTestFlag = async (flagId) => {
        if (onTestFlag) {
            try {
                const result = await onTestFlag(flagId, currentUser.id);
                setTestResults(prev => ({ ...prev, [flagId]: result }));
            }
            catch (error) {
                console.error('Failed to test flag:', error);
            }
        }
    };
    const handleCreateFlag = async () => {
        if (onUpdateFlag) {
            try {
                const newFlag = {
                    id: `flag-${Date.now()}`,
                    name: 'New Feature Flag',
                    description: 'A new feature flag for testing',
                    enabled: false,
                    rolloutPercentage: 0,
                    environments: ['development'],
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                await onUpdateFlag(newFlag);
                setShowCreateFlag(false);
            }
            catch (error) {
                console.error('Failed to create flag:', error);
            }
        }
    };
    const handleRefreshFlags = async () => {
        if (onLoadFlags) {
            try {
                await onLoadFlags(currentUser.id, {
                    role: userRole,
                    planLevel: 'pro', // Mock plan level
                    permissions: Object.keys(userPermissions)
                });
            }
            catch (error) {
                console.error('Failed to refresh flags:', error);
            }
        }
    };
    // Render helpers
    const renderTabNavigation = () => (React.createElement('div', {
        style: {
            display: 'flex',
            borderBottom: `1px solid ${appliedTheme.borders.borderColor}`,
            marginBottom: appliedTheme.spacing.lg
        }
    }, ['flags', 'permissions', 'config', 'test'].map(tab => React.createElement('button', {
        key: tab,
        onClick: () => setActiveTab(tab),
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
    }, tab))));
    const renderOverview = () => (React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: appliedTheme.spacing.lg,
            marginBottom: appliedTheme.spacing.xl
        }
    }, [
        { label: 'Total Flags', value: totalFlags },
        { label: 'Enabled Flags', value: `${enabledFlags}/${totalFlags}` },
        { label: 'User Enabled', value: userEnabledFlags },
        { label: 'Permissions', value: totalPermissions }
    ].map((stat, index) => React.createElement('div', {
        key: index,
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            textAlign: 'center'
        }
    }, React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            color: appliedTheme.colors.textPrimary,
            marginBottom: appliedTheme.spacing.xs
        }
    }, stat.value), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary
        }
    }, stat.label)))));
    const renderFlags = () => (React.createElement('div', {}, renderOverview(), React.createElement('div', {
        style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: appliedTheme.spacing.lg
        }
    }, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            margin: 0,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Feature Flags'), React.createElement('div', {
        style: { display: 'flex', gap: appliedTheme.spacing.sm }
    }, React.createElement('button', {
        onClick: handleRefreshFlags,
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
        }
    }, 'Refresh'), (userRole === 'owner' || userRole === 'admin') && React.createElement('button', {
        onClick: handleCreateFlag,
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
        }
    }, 'Create Flag'))), React.createElement('div', {
        style: {
            display: 'grid',
            gap: appliedTheme.spacing.md
        }
    }, Object.values(flags).length > 0 ?
        Object.values(flags).map(flag => {
            const userValue = userFlags[flag.id];
            const testResult = testResults[flag.id];
            return React.createElement('div', {
                key: flag.id,
                style: {
                    backgroundColor: appliedTheme.colors.surface,
                    borderRadius: appliedTheme.borders.borderRadius,
                    padding: appliedTheme.spacing.lg,
                    border: `1px solid ${appliedTheme.borders.borderColor}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            }, React.createElement('div', {
                style: { flex: 1 }
            }, React.createElement('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: appliedTheme.spacing.md,
                    marginBottom: appliedTheme.spacing.sm
                }
            }, React.createElement('h3', {
                style: {
                    fontSize: appliedTheme.font.sizeLg,
                    fontWeight: 600,
                    margin: 0,
                    color: appliedTheme.colors.textPrimary
                }
            }, flag.name), React.createElement('span', {
                style: {
                    padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeXs,
                    fontWeight: 500,
                    backgroundColor: flag.enabled ? appliedTheme.colors.secondary + '20' : appliedTheme.colors.muted + '20',
                    color: flag.enabled ? appliedTheme.colors.secondary : appliedTheme.colors.muted
                }
            }, flag.enabled ? 'Enabled' : 'Disabled')), flag.description && React.createElement('p', {
                style: {
                    fontSize: appliedTheme.font.sizeSm,
                    color: appliedTheme.colors.textSecondary,
                    margin: 0,
                    marginBottom: appliedTheme.spacing.sm
                }
            }, flag.description), React.createElement('div', {
                style: {
                    display: 'flex',
                    gap: appliedTheme.spacing.lg,
                    fontSize: appliedTheme.font.sizeSm,
                    color: appliedTheme.colors.textSecondary
                }
            }, flag.rolloutPercentage !== undefined && React.createElement('span', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: appliedTheme.spacing.xs
                }
            }, React.createElement('div', {
                style: {
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getRolloutColor(flag.rolloutPercentage)
                }
            }), `${flag.rolloutPercentage}% rollout`), userValue !== undefined && React.createElement('span', {}, `User: ${userValue ? 'Enabled' : 'Disabled'}`), testResult !== undefined && React.createElement('span', {}, `Test: ${testResult ? 'Enabled' : 'Disabled'}`))), React.createElement('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: appliedTheme.spacing.sm
                }
            }, React.createElement('button', {
                onClick: () => handleTestFlag(flag.id),
                style: {
                    padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                    backgroundColor: appliedTheme.colors.accent,
                    color: 'white',
                    border: 'none',
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeXs,
                    cursor: 'pointer'
                }
            }, 'Test'), (userRole === 'owner' || userRole === 'admin') && React.createElement('button', {
                onClick: () => handleToggleFlag(flag),
                style: {
                    padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                    backgroundColor: flag.enabled ? appliedTheme.colors.danger : appliedTheme.colors.secondary,
                    color: 'white',
                    border: 'none',
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeXs,
                    cursor: 'pointer'
                }
            }, flag.enabled ? 'Disable' : 'Enable')));
        }) :
        React.createElement('p', {
            style: {
                textAlign: 'center',
                color: appliedTheme.colors.textSecondary,
                padding: appliedTheme.spacing.xl
            }
        }, 'No feature flags configured yet.'))));
    const renderPermissions = () => (React.createElement('div', {}, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Permission Rules'), React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, Object.values(permissions).length > 0 ?
        React.createElement('div', {
            style: {
                display: 'grid',
                gap: appliedTheme.spacing.md
            }
        }, Object.values(permissions).map(permission => React.createElement('div', {
            key: permission.id,
            style: {
                padding: appliedTheme.spacing.md,
                backgroundColor: appliedTheme.colors.background,
                borderRadius: appliedTheme.borders.borderRadius,
                border: `1px solid ${appliedTheme.borders.borderColor}`
            }
        }, React.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: appliedTheme.spacing.sm
            }
        }, React.createElement('div', {}, React.createElement('h4', {
            style: {
                fontSize: appliedTheme.font.sizeMd,
                fontWeight: 600,
                margin: 0,
                color: appliedTheme.colors.textPrimary
            }
        }, permission.name), React.createElement('p', {
            style: {
                fontSize: appliedTheme.font.sizeSm,
                color: appliedTheme.colors.textSecondary,
                margin: 0
            }
        }, permission.description || 'No description')), React.createElement('span', {
            style: {
                padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeXs,
                fontWeight: 500,
                backgroundColor: userPermissions[permission.id] ? appliedTheme.colors.secondary + '20' : appliedTheme.colors.muted + '20',
                color: userPermissions[permission.id] ? appliedTheme.colors.secondary : appliedTheme.colors.muted
            }
        }, userPermissions[permission.id] ? 'Granted' : 'Denied')), React.createElement('div', {
            style: {
                fontSize: appliedTheme.font.sizeXs,
                color: appliedTheme.colors.textSecondary
            }
        }, `${permission.resource}:${permission.action}`)))) :
        React.createElement('p', {
            style: {
                textAlign: 'center',
                color: appliedTheme.colors.textSecondary,
                margin: 0
            }
        }, 'No permission rules configured yet.'))));
    const renderConfig = () => (React.createElement('div', {}, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Configuration'), featureFlagsConfig ? React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            gap: appliedTheme.spacing.md,
            marginBottom: appliedTheme.spacing.lg
        }
    }, React.createElement('div', {
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
    }, getProviderIcon(featureFlagsConfig.provider)), React.createElement('div', {}, React.createElement('h3', {
        style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            margin: 0,
            color: appliedTheme.colors.textPrimary,
            textTransform: 'capitalize'
        }
    }, featureFlagsConfig.provider), React.createElement('p', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            margin: 0
        }
    }, featureFlagsConfig.environment || 'No environment specified'))), React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: appliedTheme.spacing.md
        }
    }, [
        { label: 'Default Flags', value: featureFlagsConfig.defaultFlags?.length || 0 },
        { label: 'Refresh Interval', value: featureFlagsConfig.refreshInterval ? `${featureFlagsConfig.refreshInterval}s` : 'Manual' },
        { label: 'Analytics', value: featureFlagsConfig.enableAnalytics ? 'Enabled' : 'Disabled' },
        { label: 'Last Updated', value: lastUpdated ? formatDate(lastUpdated) : 'Never' }
    ].map((item, index) => React.createElement('div', {
        key: index,
        style: {
            padding: appliedTheme.spacing.md,
            backgroundColor: appliedTheme.colors.background,
            borderRadius: appliedTheme.borders.borderRadius,
            textAlign: 'center'
        }
    }, React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeMd,
            fontWeight: 600,
            color: appliedTheme.colors.textPrimary,
            marginBottom: appliedTheme.spacing.xs
        }
    }, item.value), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeXs,
            color: appliedTheme.colors.textSecondary
        }
    }, item.label))))) : React.createElement('p', {
        style: {
            textAlign: 'center',
            color: appliedTheme.colors.textSecondary,
            padding: appliedTheme.spacing.xl
        }
    }, 'Feature flags not configured yet.')));
    const renderTest = () => (React.createElement('div', {}, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Test Flags'), React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('p', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            marginBottom: appliedTheme.spacing.lg
        }
    }, 'Test feature flags for the current user and context.'), Object.keys(flags).length > 0 ?
        React.createElement('div', {
            style: {
                display: 'grid',
                gap: appliedTheme.spacing.sm
            }
        }, Object.keys(flags).map(flagId => React.createElement('div', {
            key: flagId,
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: appliedTheme.spacing.md,
                backgroundColor: appliedTheme.colors.background,
                borderRadius: appliedTheme.borders.borderRadius
            }
        }, React.createElement('span', {
            style: {
                fontSize: appliedTheme.font.sizeSm,
                color: appliedTheme.colors.textPrimary
            }
        }, flags[flagId].name), React.createElement('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: appliedTheme.spacing.sm
            }
        }, testResults[flagId] !== undefined && React.createElement('span', {
            style: {
                fontSize: appliedTheme.font.sizeXs,
                color: testResults[flagId] ? appliedTheme.colors.secondary : appliedTheme.colors.danger
            }
        }, testResults[flagId] ? 'Enabled' : 'Disabled'), React.createElement('button', {
            onClick: () => handleTestFlag(flagId),
            style: {
                padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                backgroundColor: appliedTheme.colors.accent,
                color: 'white',
                border: 'none',
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeXs,
                cursor: 'pointer'
            }
        }, 'Test'))))) :
        React.createElement('p', {
            style: {
                textAlign: 'center',
                color: appliedTheme.colors.textSecondary,
                margin: 0
            }
        }, 'No flags available to test.'))));
    return React.createElement('div', {
        style: {
            padding: appliedTheme.spacing.lg
        }
    }, renderTabNavigation(), 
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
    }, 'Loading feature flags...'), 
    // Tab content
    !loading && activeTab === 'flags' && renderFlags(), !loading && activeTab === 'permissions' && renderPermissions(), !loading && activeTab === 'config' && renderConfig(), !loading && activeTab === 'test' && renderTest());
};
