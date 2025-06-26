import * as React from 'react';
import type { PluginProps } from '../../types/plugin-interface';
import { defaultTheme } from '../shared/default-theme';

// ============================================================================
// TYPES (from original plugin)
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: 'student' | 'instructor' | 'admin';
  isVerified?: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthConfig {
  provider: 'local' | 'firebase' | 'auth0' | 'supabase' | 'custom';
  requireEmailVerification?: boolean;
  allowSocialLogin?: boolean;
  socialProviders?: Array<'google' | 'github' | 'discord'>;
  passwordMinLength?: number;
  sessionTimeout?: number; // in minutes
  maxLoginAttempts?: number;
  lockoutDuration?: number; // in minutes
}

interface AuthProps extends PluginProps {
  // Data from host app
  currentSession?: AuthSession | null;
  authConfig?: AuthConfig;
  users?: User[];
  loginAttempts?: Record<string, number>;
  lockedUsers?: Record<string, Date>;
  loading?: boolean;
  error?: string;
  
  // Action callbacks
  onSignIn?: (credentials: SignInCredentials) => Promise<void>;
  onSignUp?: (credentials: SignUpCredentials) => Promise<void>;
  onSignOut?: () => Promise<void>;
  onUpdateUser?: (userId: string, updates: Partial<User>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onResetPassword?: (email: string) => Promise<void>;
  onUpdatePassword?: (userId: string, newPassword: string) => Promise<void>;
  onSendVerificationEmail?: (userId: string) => Promise<void>;
  onVerifyEmail?: (token: string) => Promise<void>;
  onSignInWithProvider?: (provider: 'google' | 'github' | 'discord') => Promise<void>;
  onUnlockUser?: (userId: string) => Promise<void>;
  onUpdateAuthConfig?: (config: AuthConfig) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AuthComponent: React.FC<AuthProps> = ({
  currentUser,
  communityId,
  community,
  userRole,
  theme,
  currentSession,
  authConfig,
  users = [],
  loginAttempts = {},
  lockedUsers = {},
  loading = false,
  error,
  onSignIn,
  onSignUp,
  onSignOut,
  onUpdateUser,
  onDeleteUser,
  onResetPassword,
  onUpdatePassword,
  onSendVerificationEmail,
  onVerifyEmail,
  onSignInWithProvider,
  onUnlockUser,
  onUpdateAuthConfig,
}) => {
  // Apply theme
  const appliedTheme = theme || defaultTheme;

  // Local state
  const [activeTab, setActiveTab] = React.useState<'overview' | 'users' | 'config' | 'security'>('overview');
  const [showSignIn, setShowSignIn] = React.useState(false);
  const [showSignUp, setShowSignUp] = React.useState(false);
  const [showPasswordReset, setShowPasswordReset] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [editingConfig, setEditingConfig] = React.useState(false);

  // Form states
  const [signInForm, setSignInForm] = React.useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = React.useState({ email: '', password: '', name: '' });
  const [resetEmail, setResetEmail] = React.useState('');
  const [passwordForm, setPasswordForm] = React.useState({ newPassword: '', confirmPassword: '' });

  // Computed values
  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.isVerified).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const lockedUsersCount = Object.keys(lockedUsers).length;
  const isAuthenticated = !!currentSession;

  // Helper functions
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return appliedTheme.colors.danger;
      case 'instructor': return appliedTheme.colors.secondary;
      case 'student': return appliedTheme.colors.accent;
      default: return appliedTheme.colors.muted;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const isUserLocked = (userId: string) => {
    const lockTime = lockedUsers[userId];
    if (!lockTime) return false;
    
    const unlockTime = new Date(lockTime.getTime() + (authConfig?.lockoutDuration || 30) * 60 * 1000);
    return new Date() < unlockTime;
  };

  // Event handlers
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSignIn) {
      try {
        await onSignIn(signInForm);
        setSignInForm({ email: '', password: '' });
        setShowSignIn(false);
      } catch (error) {
        console.error('Sign in failed:', error);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSignUp) {
      try {
        await onSignUp(signUpForm);
        setSignUpForm({ email: '', password: '', name: '' });
        setShowSignUp(false);
      } catch (error) {
        console.error('Sign up failed:', error);
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onResetPassword) {
      try {
        await onResetPassword(resetEmail);
        setResetEmail('');
        setShowPasswordReset(false);
      } catch (error) {
        console.error('Password reset failed:', error);
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePassword && selectedUser && passwordForm.newPassword === passwordForm.confirmPassword) {
      try {
        await onUpdatePassword(selectedUser.id, passwordForm.newPassword);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
        setSelectedUser(null);
      } catch (error) {
        console.error('Password update failed:', error);
      }
    }
  };

  const handleSendVerification = async (userId: string) => {
    if (onSendVerificationEmail) {
      try {
        await onSendVerificationEmail(userId);
      } catch (error) {
        console.error('Failed to send verification email:', error);
      }
    }
  };

  const handleUnlockUser = async (userId: string) => {
    if (onUnlockUser) {
      try {
        await onUnlockUser(userId);
      } catch (error) {
        console.error('Failed to unlock user:', error);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (onDeleteUser && confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await onDeleteUser(userId);
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
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
      ['overview', 'users', 'config', 'security'].map(tab =>
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
          { label: 'Total Users', value: totalUsers },
          { label: 'Verified Users', value: `${verifiedUsers}/${totalUsers}` },
          { label: 'Administrators', value: adminUsers },
          { label: 'Locked Users', value: lockedUsersCount }
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
      
      // Auth status
      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          padding: appliedTheme.spacing.lg,
          border: `1px solid ${appliedTheme.borders.borderColor}`,
          marginBottom: appliedTheme.spacing.lg
        }
      },
        React.createElement('h3', {
          style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            margin: 0,
            marginBottom: appliedTheme.spacing.md,
            color: appliedTheme.colors.textPrimary
          }
        }, 'Authentication Status'),
        
        isAuthenticated ? React.createElement('div', {},
          React.createElement('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: appliedTheme.spacing.md,
              marginBottom: appliedTheme.spacing.md
            }
          },
            React.createElement('div', {
              style: {
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: appliedTheme.colors.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600
              }
            }, currentSession?.user.name?.charAt(0) || currentSession?.user.email.charAt(0)),
            React.createElement('div', {},
              React.createElement('div', {
                style: {
                  fontWeight: 600,
                  color: appliedTheme.colors.textPrimary
                }
              }, currentSession?.user.name || currentSession?.user.email),
              React.createElement('div', {
                style: {
                  fontSize: appliedTheme.font.sizeSm,
                  color: appliedTheme.colors.textSecondary
                }
              }, `Role: ${currentSession?.user.role || 'user'}`)
            )
          ),
          React.createElement('button', {
            onClick: onSignOut,
            style: {
              padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
              backgroundColor: appliedTheme.colors.danger,
              color: 'white',
              border: 'none',
              borderRadius: appliedTheme.borders.borderRadius,
              cursor: 'pointer'
            }
          }, 'Sign Out')
        ) : React.createElement('div', {},
          React.createElement('p', {
            style: {
              marginBottom: appliedTheme.spacing.md,
              color: appliedTheme.colors.textSecondary
            }
          }, 'Not authenticated'),
          React.createElement('div', {
            style: {
              display: 'flex',
              gap: appliedTheme.spacing.sm
            }
          },
            React.createElement('button', {
              onClick: () => setShowSignIn(true),
              style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                backgroundColor: appliedTheme.colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: appliedTheme.borders.borderRadius,
                cursor: 'pointer'
              }
            }, 'Sign In'),
            React.createElement('button', {
              onClick: () => setShowSignUp(true),
              style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                backgroundColor: appliedTheme.colors.accent,
                color: 'white',
                border: 'none',
                borderRadius: appliedTheme.borders.borderRadius,
                cursor: 'pointer'
              }
            }, 'Sign Up')
          )
        )
      )
    )
  );

  const renderUsers = () => (
    React.createElement('div', {},
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
        }, 'User Management'),
        (userRole === 'admin') && React.createElement('button', {
          onClick: () => setShowSignUp(true),
          style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            cursor: 'pointer'
          }
        }, 'Add User')
      ),
      
      React.createElement('div', {
        style: {
          display: 'grid',
          gap: appliedTheme.spacing.md
        }
      },
        users.length > 0 ? users.map(user => {
          const locked = isUserLocked(user.id);
          const attempts = loginAttempts[user.id] || 0;
          
          return React.createElement('div', {
            key: user.id,
            style: {
              backgroundColor: appliedTheme.colors.surface,
              borderRadius: appliedTheme.borders.borderRadius,
              padding: appliedTheme.spacing.lg,
              border: `1px solid ${appliedTheme.borders.borderColor}`,
              opacity: locked ? 0.7 : 1
            }
          },
            React.createElement('div', {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }
            },
              React.createElement('div', {
                style: { flex: 1 }
              },
                React.createElement('div', {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: appliedTheme.spacing.md,
                    marginBottom: appliedTheme.spacing.sm
                  }
                },
                  React.createElement('div', {
                    style: {
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: getRoleColor(user.role),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: appliedTheme.font.sizeSm
                    }
                  }, user.name?.charAt(0) || user.email.charAt(0)),
                  React.createElement('div', {},
                    React.createElement('h4', {
                      style: {
                        fontSize: appliedTheme.font.sizeMd,
                        fontWeight: 600,
                        margin: 0,
                        color: appliedTheme.colors.textPrimary
                      }
                    }, user.name || user.email),
                    React.createElement('p', {
                      style: {
                        fontSize: appliedTheme.font.sizeSm,
                        color: appliedTheme.colors.textSecondary,
                        margin: 0
                      }
                    }, user.email)
                  )
                ),
                React.createElement('div', {
                  style: {
                    display: 'flex',
                    gap: appliedTheme.spacing.lg,
                    fontSize: appliedTheme.font.sizeSm,
                    color: appliedTheme.colors.textSecondary
                  }
                },
                  React.createElement('span', {
                    style: {
                      padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                      borderRadius: appliedTheme.borders.borderRadius,
                      backgroundColor: getRoleColor(user.role) + '20',
                      color: getRoleColor(user.role),
                      fontWeight: 500,
                      textTransform: 'capitalize'
                    }
                  }, user.role || 'user'),
                  React.createElement('span', {
                    style: {
                      color: user.isVerified ? appliedTheme.colors.secondary : appliedTheme.colors.warning
                    }
                  }, user.isVerified ? '✓ Verified' : '⚠ Unverified'),
                  locked && React.createElement('span', {
                    style: { color: appliedTheme.colors.danger }
                  }, '🔒 Locked'),
                  attempts > 0 && React.createElement('span', {
                    style: { color: appliedTheme.colors.warning }
                  }, `${attempts} failed attempts`)
                )
              ),
              (userRole === 'admin') && React.createElement('div', {
                style: {
                  display: 'flex',
                  gap: appliedTheme.spacing.xs
                }
              },
                !user.isVerified && React.createElement('button', {
                  onClick: () => handleSendVerification(user.id),
                  style: {
                    padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                    backgroundColor: appliedTheme.colors.accent,
                    color: 'white',
                    border: 'none',
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeXs,
                    cursor: 'pointer'
                  }
                }, 'Verify'),
                locked && React.createElement('button', {
                  onClick: () => handleUnlockUser(user.id),
                  style: {
                    padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                    backgroundColor: appliedTheme.colors.warning,
                    color: 'white',
                    border: 'none',
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeXs,
                    cursor: 'pointer'
                  }
                }, 'Unlock'),
                React.createElement('button', {
                  onClick: () => setSelectedUser(user),
                  style: {
                    padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                    backgroundColor: appliedTheme.colors.secondary,
                    color: 'white',
                    border: 'none',
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeXs,
                    cursor: 'pointer'
                  }
                }, 'Edit'),
                React.createElement('button', {
                  onClick: () => handleDeleteUser(user.id),
                  style: {
                    padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                    backgroundColor: appliedTheme.colors.danger,
                    color: 'white',
                    border: 'none',
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeXs,
                    cursor: 'pointer'
                  }
                }, 'Delete')
              )
            )
          );
        }) : React.createElement('p', {
          style: {
            textAlign: 'center',
            color: appliedTheme.colors.textSecondary,
            padding: appliedTheme.spacing.xl
          }
        }, 'No users found.')
      )
    )
  );

  const renderConfig = () => (
    React.createElement('div', {},
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
        }, 'Authentication Configuration'),
        (userRole === 'admin') && React.createElement('button', {
          onClick: () => setEditingConfig(!editingConfig),
          style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            cursor: 'pointer'
          }
        }, editingConfig ? 'Cancel' : 'Edit Config')
      ),
      
      authConfig ? React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          padding: appliedTheme.spacing.lg,
          border: `1px solid ${appliedTheme.borders.borderColor}`
        }
      },
        React.createElement('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: appliedTheme.spacing.lg
          }
        },
          [
            { label: 'Provider', value: authConfig.provider },
            { label: 'Email Verification', value: authConfig.requireEmailVerification ? 'Required' : 'Optional' },
            { label: 'Social Login', value: authConfig.allowSocialLogin ? 'Enabled' : 'Disabled' },
            { label: 'Password Min Length', value: authConfig.passwordMinLength || 8 },
            { label: 'Session Timeout', value: `${authConfig.sessionTimeout || 60} minutes` },
            { label: 'Max Login Attempts', value: authConfig.maxLoginAttempts || 5 }
          ].map((item, index) =>
            React.createElement('div', {
              key: index,
              style: {
                padding: appliedTheme.spacing.md,
                backgroundColor: appliedTheme.colors.background,
                borderRadius: appliedTheme.borders.borderRadius
              }
            },
              React.createElement('div', {
                style: {
                  fontSize: appliedTheme.font.sizeSm,
                  color: appliedTheme.colors.textSecondary,
                  marginBottom: appliedTheme.spacing.xs
                }
              }, item.label),
              React.createElement('div', {
                style: {
                  fontSize: appliedTheme.font.sizeMd,
                  fontWeight: 600,
                  color: appliedTheme.colors.textPrimary,
                  textTransform: typeof item.value === 'string' ? 'capitalize' : 'none'
                }
              }, item.value)
            )
          )
        )
      ) : React.createElement('p', {
        style: {
          textAlign: 'center',
          color: appliedTheme.colors.textSecondary,
          padding: appliedTheme.spacing.xl
        }
      }, 'No authentication configuration found.')
    )
  );

  const renderSecurity = () => (
    React.createElement('div', {},
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeXl,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'Security Overview'),
      
      React.createElement('div', {
        style: {
          display: 'grid',
          gap: appliedTheme.spacing.lg
        }
      },
        // Failed login attempts
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
          }, 'Failed Login Attempts'),
          
          Object.keys(loginAttempts).length > 0 ? React.createElement('div', {
            style: {
              display: 'grid',
              gap: appliedTheme.spacing.sm
            }
          },
            Object.entries(loginAttempts).map(([userId, attempts]) => {
              const user = users.find(u => u.id === userId);
              return React.createElement('div', {
                key: userId,
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: appliedTheme.spacing.md,
                  backgroundColor: appliedTheme.colors.background,
                  borderRadius: appliedTheme.borders.borderRadius
                }
              },
                React.createElement('span', {
                  style: {
                    color: appliedTheme.colors.textPrimary
                  }
                }, user?.email || userId),
                React.createElement('span', {
                  style: {
                    color: attempts > 3 ? appliedTheme.colors.danger : appliedTheme.colors.warning,
                    fontWeight: 600
                  }
                }, `${attempts} attempts`)
              );
            })
          ) : React.createElement('p', {
            style: {
              color: appliedTheme.colors.textSecondary,
              textAlign: 'center',
              margin: 0
            }
          }, 'No failed login attempts recorded.')
        ),
        
        // Locked users
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
          }, 'Locked Users'),
          
          Object.keys(lockedUsers).length > 0 ? React.createElement('div', {
            style: {
              display: 'grid',
              gap: appliedTheme.spacing.sm
            }
          },
            Object.entries(lockedUsers).map(([userId, lockTime]) => {
              const user = users.find(u => u.id === userId);
              const unlockTime = new Date(lockTime.getTime() + (authConfig?.lockoutDuration || 30) * 60 * 1000);
              
              return React.createElement('div', {
                key: userId,
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: appliedTheme.spacing.md,
                  backgroundColor: appliedTheme.colors.background,
                  borderRadius: appliedTheme.borders.borderRadius
                }
              },
                React.createElement('div', {},
                  React.createElement('div', {
                    style: {
                      color: appliedTheme.colors.textPrimary,
                      fontWeight: 600
                    }
                  }, user?.email || userId),
                  React.createElement('div', {
                    style: {
                      fontSize: appliedTheme.font.sizeSm,
                      color: appliedTheme.colors.textSecondary
                    }
                  }, `Unlocks at: ${formatDate(unlockTime)}`)
                ),
                (userRole === 'admin') && React.createElement('button', {
                  onClick: () => handleUnlockUser(userId),
                  style: {
                    padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                    backgroundColor: appliedTheme.colors.warning,
                    color: 'white',
                    border: 'none',
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeXs,
                    cursor: 'pointer'
                  }
                }, 'Unlock')
              );
            })
          ) : React.createElement('p', {
            style: {
              color: appliedTheme.colors.textSecondary,
              textAlign: 'center',
              margin: 0
            }
          }, 'No users are currently locked.')
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
    }, 'Loading authentication data...'),

    // Tab content
    !loading && activeTab === 'overview' && renderOverview(),
    !loading && activeTab === 'users' && renderUsers(),
    !loading && activeTab === 'config' && renderConfig(),
    !loading && activeTab === 'security' && renderSecurity(),

    // Sign In Modal
    showSignIn && React.createElement('div', {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }
    },
      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.background,
          borderRadius: appliedTheme.borders.borderRadius,
          padding: appliedTheme.spacing.xl,
          minWidth: '400px',
          maxWidth: '500px'
        }
      },
        React.createElement('h3', {
          style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
          }
        }, 'Sign In'),
        React.createElement('form', {
          onSubmit: handleSignIn
        },
          React.createElement('div', {
            style: { marginBottom: appliedTheme.spacing.md }
          },
            React.createElement('label', {
              style: {
                display: 'block',
                marginBottom: appliedTheme.spacing.xs,
                fontSize: appliedTheme.font.sizeSm,
                color: appliedTheme.colors.textSecondary
              }
            }, 'Email'),
            React.createElement('input', {
              type: 'email',
              value: signInForm.email,
              onChange: (e: any) => setSignInForm(prev => ({ ...prev, email: e.target.value })),
              style: {
                width: '100%',
                padding: appliedTheme.spacing.sm,
                border: `1px solid ${appliedTheme.borders.borderColor}`,
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeSm
              },
              required: true
            })
          ),
          React.createElement('div', {
            style: { marginBottom: appliedTheme.spacing.lg }
          },
            React.createElement('label', {
              style: {
                display: 'block',
                marginBottom: appliedTheme.spacing.xs,
                fontSize: appliedTheme.font.sizeSm,
                color: appliedTheme.colors.textSecondary
              }
            }, 'Password'),
            React.createElement('input', {
              type: 'password',
              value: signInForm.password,
              onChange: (e: any) => setSignInForm(prev => ({ ...prev, password: e.target.value })),
              style: {
                width: '100%',
                padding: appliedTheme.spacing.sm,
                border: `1px solid ${appliedTheme.borders.borderColor}`,
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeSm
              },
              required: true
            })
          ),
          React.createElement('div', {
            style: {
              display: 'flex',
              gap: appliedTheme.spacing.sm,
              justifyContent: 'flex-end'
            }
          },
            React.createElement('button', {
              type: 'button',
              onClick: () => setShowSignIn(false),
              style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                backgroundColor: appliedTheme.colors.muted,
                color: 'white',
                border: 'none',
                borderRadius: appliedTheme.borders.borderRadius,
                cursor: 'pointer'
              }
            }, 'Cancel'),
            React.createElement('button', {
              type: 'submit',
              style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                backgroundColor: appliedTheme.colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: appliedTheme.borders.borderRadius,
                cursor: 'pointer'
              }
            }, 'Sign In')
          )
        )
      )
    )
  );
};