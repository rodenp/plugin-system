import * as React from 'react';
import type { PluginProps } from '../../types/plugin-interface';
import { defaultTheme } from '../shared/default-theme';

// ============================================================================
// TYPES (copied from original Redux plugin)
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  
  // Contact information
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  
  // Professional information
  jobTitle?: string;
  company?: string;
  website?: string;
  linkedIn?: string;
  twitter?: string;
  github?: string;
  
  // Learning preferences
  learningGoals: string[];
  interests: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguages: string[];
  timezone: string;
  
  // System information
  role: 'student' | 'instructor' | 'admin' | 'moderator';
  permissions: string[];
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  
  // Enrollment details
  enrollmentType: 'free' | 'paid' | 'subscription' | 'invite';
  paymentId?: string;
  discountCode?: string;
  amountPaid: number;
  currency: string;
  
  // Progress tracking
  progress: {
    overallPercentage: number;
    lessonsCompleted: string[];
    assessmentsCompleted: string[];
    timeSpent: number; // in minutes
    currentLesson?: string;
    bookmarks: string[];
    notes: Array<{
      id: string;
      lessonId: string;
      timestamp: number; // video timestamp or lesson position
      content: string;
      createdAt: Date;
    }>;
  };
  
  // Performance
  performance: {
    averageScore: number;
    assessmentScores: Record<string, number>;
    completionStreak: number;
    badges: string[];
    achievements: string[];
  };
  
  // Settings
  settings: {
    notifications: boolean;
    publicProfile: boolean;
    showProgress: boolean;
    autoplayVideos: boolean;
    subtitles: boolean;
    playbackSpeed: number;
  };
  
  status: 'active' | 'paused' | 'completed' | 'dropped' | 'refunded';
}

export interface InstructorProfile extends UserProfile {
  // Instructor-specific fields
  instructorInfo: {
    title: string;
    expertise: string[];
    experience: string;
    education: Array<{
      degree: string;
      institution: string;
      year: number;
    }>;
    certifications: Array<{
      name: string;
      issuer: string;
      year: number;
      url?: string;
    }>;
    
    // Teaching metrics
    totalStudents: number;
    totalCourses: number;
    averageRating: number;
    totalReviews: number;
    earnings: number;
    
    // Instructor settings
    isAcceptingStudents: boolean;
    hourlyRate?: number;
    availability: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
    
    // Social proof
    featured: boolean;
    verified: boolean;
    topInstructor: boolean;
  };
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'course_enrolled' | 'lesson_completed' | 'assessment_taken' | 'certificate_earned' | 'review_posted' | 'login' | 'profile_updated';
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'system' | 'course' | 'social' | 'marketing' | 'security';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  type: 'cohort' | 'study_group' | 'organization' | 'custom';
  memberIds: string[];
  ownerId: string;
  settings: {
    isPrivate: boolean;
    requireApproval: boolean;
    allowMemberInvites: boolean;
    maxMembers?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface UserManagementProps extends PluginProps {
  // Data from host app
  users?: Record<string, UserProfile>;
  instructors?: Record<string, InstructorProfile>;
  enrollments?: Record<string, StudentEnrollment[]>; // keyed by userId
  courseEnrollments?: Record<string, StudentEnrollment[]>; // keyed by courseId
  activities?: Record<string, UserActivity[]>; // keyed by userId
  notifications?: Record<string, UserNotification[]>; // keyed by userId
  groups?: Record<string, UserGroup>;
  loading?: boolean;
  error?: string;
  
  // Action callbacks
  onLoadUserProfile?: (userId: string) => Promise<void>;
  onUpdateUserProfile?: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  onEnrollStudent?: (studentId: string, courseId: string, enrollmentData: Partial<StudentEnrollment>) => Promise<void>;
  onUpdateProgress?: (enrollmentId: string, progressUpdate: Partial<StudentEnrollment['progress']>) => Promise<void>;
  onAddActivity?: (activity: Omit<UserActivity, 'id' | 'timestamp'>) => Promise<void>;
  onSendNotification?: (notification: Omit<UserNotification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  onCreateGroup?: (groupData: Omit<UserGroup, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onMarkNotificationAsRead?: (userId: string, notificationId: string) => Promise<void>;
  onLoadUserEnrollments?: (userId: string) => Promise<void>;
  onLoadCourseEnrollments?: (courseId: string) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const UserManagementComponent: React.FC<UserManagementProps> = ({
  currentUser,
  communityId,
  community,
  userRole,
  theme,
  users = {},
  instructors = {},
  enrollments = {},
  courseEnrollments = {},
  activities = {},
  notifications = {},
  groups = {},
  loading = false,
  error,
  onLoadUserProfile,
  onUpdateUserProfile,
  onEnrollStudent,
  onUpdateProgress,
  onAddActivity,
  onSendNotification,
  onCreateGroup,
  onMarkNotificationAsRead,
  onLoadUserEnrollments,
  onLoadCourseEnrollments,
}) => {
  // Apply theme
  const appliedTheme = theme || defaultTheme;

  // Local state
  const [activeTab, setActiveTab] = React.useState<'users' | 'enrollments' | 'activities' | 'notifications' | 'groups'>('users');
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);

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

  const formatUserDisplayName = (user: UserProfile): string => {
    if (user.displayName) return user.displayName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.username) return user.username;
    return user.email.split('@')[0];
  };

  const getUserCount = () => Object.keys(users).length;
  const getInstructorCount = () => Object.keys(instructors).length;
  const getTotalEnrollments = () => Object.values(enrollments).reduce((total, userEnrollments) => total + userEnrollments.length, 0);
  const getTotalActivities = () => Object.values(activities).reduce((total, userActivities) => total + userActivities.length, 0);
  const getUnreadNotifications = () => {
    return Object.values(notifications).reduce((total, userNotifications) => {
      return total + userNotifications.filter(n => !n.isRead).length;
    }, 0);
  };

  // Event handlers
  const handleTestEnrollment = async () => {
    if (onEnrollStudent) {
      try {
        await onEnrollStudent(currentUser.id, 'sample-course', {
          enrollmentType: 'free',
          amountPaid: 0,
          currency: 'USD'
        });
      } catch (error) {
        console.error('Failed to create test enrollment:', error);
      }
    }
  };

  const handleAddTestActivity = async () => {
    if (onAddActivity) {
      try {
        await onAddActivity({
          userId: currentUser.id,
          type: 'login',
          description: 'User logged in from dashboard',
          metadata: { source: 'user_management_test' }
        });
      } catch (error) {
        console.error('Failed to add test activity:', error);
      }
    }
  };

  const handleSendTestNotification = async () => {
    if (onSendNotification) {
      try {
        await onSendNotification({
          userId: currentUser.id,
          type: 'system',
          title: 'Test Notification',
          message: 'This is a test notification from the User Management plugin.',
          priority: 'normal'
        });
      } catch (error) {
        console.error('Failed to send test notification:', error);
      }
    }
  };

  // Render tab navigation
  const renderTabNavigation = () => (
    React.createElement('div', {
      style: {
        display: 'flex',
        borderBottom: `1px solid ${appliedTheme.borders.borderColor}`,
        marginBottom: appliedTheme.spacing.lg
      }
    },
      ['users', 'enrollments', 'activities', 'notifications', 'groups'].map(tab => 
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
    React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: appliedTheme.spacing.lg,
        marginBottom: appliedTheme.spacing.xl
      }
    },
      [
        { label: 'Total Users', value: getUserCount() },
        { label: 'Instructors', value: getInstructorCount() },
        { label: 'Total Enrollments', value: getTotalEnrollments() },
        { label: 'Total Activities', value: getTotalActivities() },
        { label: 'Unread Notifications', value: getUnreadNotifications() }
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

  // Render users list
  const renderUsers = () => (
    React.createElement('div', {},
      renderOverview(),
      React.createElement('div', {
        style: {
          display: 'flex',
          gap: appliedTheme.spacing.md,
          marginBottom: appliedTheme.spacing.lg
        }
      },
        React.createElement('button', {
          onClick: handleTestEnrollment,
          style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
          }
        }, 'Test Enrollment'),
        React.createElement('button', {
          onClick: handleAddTestActivity,
          style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
          }
        }, 'Add Test Activity'),
        React.createElement('button', {
          onClick: handleSendTestNotification,
          style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
          }
        }, 'Send Test Notification')
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
        }, 'Users'),
        Object.keys(users).length > 0 ? (
          React.createElement('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: appliedTheme.spacing.sm
            }
          },
            Object.values(users).slice(0, 10).map(user =>
              React.createElement('div', {
                key: user.id,
                style: {
                  padding: appliedTheme.spacing.md,
                  backgroundColor: appliedTheme.colors.background,
                  borderRadius: appliedTheme.borders.borderRadius,
                  border: `1px solid ${appliedTheme.borders.borderColor}`,
                  cursor: 'pointer'
                },
                onClick: () => setSelectedUser(user)
              },
                React.createElement('div', {
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }
                },
                  React.createElement('div', {},
                    React.createElement('div', {
                      style: {
                        fontWeight: 600,
                        fontSize: appliedTheme.font.sizeMd,
                        color: appliedTheme.colors.textPrimary
                      }
                    }, formatUserDisplayName(user)),
                    React.createElement('div', {
                      style: {
                        fontSize: appliedTheme.font.sizeSm,
                        color: appliedTheme.colors.textSecondary
                      }
                    }, user.email)
                  ),
                  React.createElement('span', {
                    style: {
                      padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                      borderRadius: appliedTheme.borders.borderRadius,
                      fontSize: appliedTheme.font.sizeXs,
                      fontWeight: 500,
                      backgroundColor: user.isActive ? appliedTheme.colors.secondary + '20' : appliedTheme.colors.muted + '20',
                      color: user.isActive ? appliedTheme.colors.secondary : appliedTheme.colors.muted,
                      textTransform: 'uppercase'
                    }
                  }, user.role)
                )
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
          }, 'No users found.')
        )
      )
    )
  );

  // Render enrollments
  const renderEnrollments = () => (
    React.createElement('div', {},
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeXl,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'Student Enrollments'),
      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          padding: appliedTheme.spacing.lg,
          border: `1px solid ${appliedTheme.borders.borderColor}`
        }
      },
        React.createElement('p', {
          style: {
            color: appliedTheme.colors.textSecondary,
            textAlign: 'center',
            margin: 0
          }
        }, `${getTotalEnrollments()} total enrollments across all courses`)
      )
    )
  );

  // Render activities
  const renderActivities = () => (
    React.createElement('div', {},
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeXl,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'User Activities'),
      React.createElement('div', {
        style: {
          backgroundColor: appliedTheme.colors.surface,
          borderRadius: appliedTheme.borders.borderRadius,
          padding: appliedTheme.spacing.lg,
          border: `1px solid ${appliedTheme.borders.borderColor}`
        }
      },
        Object.keys(activities).length > 0 ? (
          React.createElement('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: appliedTheme.spacing.sm,
              maxHeight: '400px',
              overflowY: 'auto'
            }
          },
            Object.values(activities).flat().slice(0, 20).map(activity =>
              React.createElement('div', {
                key: activity.id,
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
                  }, activity.description),
                  React.createElement('span', {
                    style: {
                      color: appliedTheme.colors.textSecondary
                    }
                  }, formatDate(activity.timestamp))
                )
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
          }, 'No activities tracked yet.')
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
    }, 'Loading user management data...'),

    // Tab content
    !loading && activeTab === 'users' && renderUsers(),
    !loading && activeTab === 'enrollments' && renderEnrollments(),
    !loading && activeTab === 'activities' && renderActivities(),
    
    activeTab === 'notifications' && React.createElement('div', {
      style: {
        textAlign: 'center',
        padding: appliedTheme.spacing.xl,
        color: appliedTheme.colors.textSecondary
      }
    }, `${getUnreadNotifications()} unread notifications`),
    
    activeTab === 'groups' && React.createElement('div', {
      style: {
        textAlign: 'center',
        padding: appliedTheme.spacing.xl,
        color: appliedTheme.colors.textSecondary
      }
    }, `${Object.keys(groups).length} user groups`)
  );
};