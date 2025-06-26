import * as React from 'react';
import type { PluginProps } from '../../types/plugin-interface';
import { defaultTheme } from '../shared/default-theme';

// ============================================================================
// TYPES (copied from original Redux plugin)
// ============================================================================

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  currency: string;
  thumbnail?: string;
  duration?: number; // in minutes
  lessons: Lesson[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    status: 'draft' | 'published' | 'archived';
    tags: string[];
    language: string;
    requirements: string[];
    outcomes: string[];
  };
  settings: {
    allowComments: boolean;
    allowDownloads: boolean;
    showProgress: boolean;
    certificateEnabled: boolean;
    maxStudents?: number;
    enrollmentDeadline?: Date;
  };
  analytics: {
    totalEnrollments: number;
    totalCompletions: number;
    averageRating: number;
    totalRevenue: number;
  };
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'live_session';
  content: LessonContent;
  order: number;
  duration?: number; // in minutes
  isPreview: boolean;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    status: 'draft' | 'published';
  };
}

export interface LessonContent {
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'live_session';
  data: {
    // Video content
    videoUrl?: string;
    videoDuration?: number;
    transcript?: string;
    subtitles?: Array<{ language: string; url: string }>;
    
    // Text content
    html?: string;
    markdown?: string;
    
    // Quiz content
    questions?: QuizQuestion[];
    passingScore?: number;
    maxAttempts?: number;
    
    // Assignment content
    instructions?: string;
    submissionFormat?: 'text' | 'file' | 'link';
    dueDate?: Date;
    maxScore?: number;
    
    // Live session content
    scheduledAt?: Date;
    duration?: number;
    meetingUrl?: string;
    recordingUrl?: string;
  };
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  points: number;
}

export interface StudentProgress {
  userId: string;
  courseId: string;
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  progressPercentage: number;
  lessonsCompleted: string[];
  quizScores: Record<string, number>;
  assignmentSubmissions: Record<string, any>;
  totalTimeSpent: number; // in minutes
  certificateEarned?: {
    issuedAt: Date;
    certificateUrl: string;
  };
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  progress: StudentProgress;
  paymentId?: string;
  discountCode?: string;
  amountPaid: number;
  currency: string;
}

interface CourseDataProps extends PluginProps {
  // Data from host app
  courses?: Record<string, Course>;
  lessons?: Record<string, Lesson>;
  enrollments?: Record<string, CourseEnrollment>;
  studentProgress?: Record<string, StudentProgress[]>; // keyed by userId
  currentCourse?: Course | null;
  currentLesson?: Lesson | null;
  loading?: boolean;
  error?: string;
  filters?: {
    category?: string;
    level?: string;
    instructor?: string;
    priceRange?: [number, number];
    rating?: number;
    language?: string;
  };
  sortBy?: 'title' | 'price' | 'rating' | 'created' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  
  // Action callbacks
  onLoadCourses?: (userId?: string, includeEnrollments?: boolean) => Promise<void>;
  onLoadCourse?: (courseId: string, userId?: string) => Promise<void>;
  onCreateCourse?: (courseData: Partial<Course>) => Promise<void>;
  onUpdateCourse?: (courseId: string, updates: Partial<Course>) => Promise<void>;
  onDeleteCourse?: (courseId: string) => Promise<void>;
  onEnrollInCourse?: (courseId: string, userId: string, paymentId?: string) => Promise<void>;
  onUpdateProgress?: (courseId: string, userId: string, lessonId?: string, completed?: boolean, timeSpent?: number, score?: number) => Promise<void>;
  onCreateLesson?: (lessonData: Partial<Lesson>) => Promise<void>;
  onUpdateLesson?: (lessonId: string, updates: Partial<Lesson>) => Promise<void>;
  onSetFilters?: (filters: Partial<CourseDataProps['filters']>) => void;
  onSetSorting?: (sortBy: CourseDataProps['sortBy'], sortOrder: CourseDataProps['sortOrder']) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CourseDataComponent: React.FC<CourseDataProps> = ({
  currentUser,
  communityId,
  community,
  userRole,
  theme,
  courses = {},
  lessons = {},
  enrollments = {},
  studentProgress = {},
  currentCourse,
  currentLesson,
  loading = false,
  error,
  filters = {},
  sortBy = 'created',
  sortOrder = 'desc',
  onLoadCourses,
  onLoadCourse,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onEnrollInCourse,
  onUpdateProgress,
  onCreateLesson,
  onUpdateLesson,
  onSetFilters,
  onSetSorting,
}) => {
  // Apply theme
  const appliedTheme = theme || defaultTheme;

  // Local state
  const [activeTab, setActiveTab] = React.useState<'catalog' | 'my-courses' | 'create' | 'analytics'>('catalog');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  // Computed values
  const userEnrollments = React.useMemo(() => {
    return Object.values(enrollments).filter(e => e.userId === currentUser.id);
  }, [enrollments, currentUser.id]);

  const userProgressData = React.useMemo(() => {
    return studentProgress[currentUser.id] || [];
  }, [studentProgress, currentUser.id]);

  const filteredCourses = React.useMemo(() => {
    let filtered = Object.values(courses);

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Apply other filters
    if (filters.level) {
      filtered = filtered.filter(course => course.level === filters.level);
    }
    if (filters.priceRange) {
      filtered = filtered.filter(course =>
        course.price >= filters.priceRange![0] && course.price <= filters.priceRange![1]
      );
    }
    if (filters.rating) {
      filtered = filtered.filter(course => course.analytics.averageRating >= filters.rating!);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'rating':
          aValue = a.analytics.averageRating;
          bValue = b.analytics.averageRating;
          break;
        case 'created':
          aValue = new Date(a.metadata.createdAt).getTime();
          bValue = new Date(b.metadata.createdAt).getTime();
          break;
        case 'popularity':
          aValue = a.analytics.totalEnrollments;
          bValue = b.analytics.totalEnrollments;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [courses, searchQuery, selectedCategory, filters, sortBy, sortOrder]);

  // Helper functions
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const calculateProgress = (courseId: string) => {
    const progress = userProgressData.find(p => p.courseId === courseId);
    return progress?.progressPercentage || 0;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return appliedTheme.colors.secondary;
      case 'intermediate':
        return appliedTheme.colors.warning;
      case 'advanced':
        return appliedTheme.colors.danger;
      default:
        return appliedTheme.colors.muted;
    }
  };

  // Event handlers
  const handleEnroll = async (courseId: string) => {
    if (onEnrollInCourse) {
      try {
        await onEnrollInCourse(courseId, currentUser.id);
      } catch (error) {
        console.error('Failed to enroll in course:', error);
      }
    }
  };

  const handleCreateCourse = async () => {
    if (onCreateCourse) {
      try {
        await onCreateCourse({
          title: 'New Course',
          description: 'Course description',
          instructorId: currentUser.id,
          instructorName: currentUser.profile.displayName,
          category: 'uncategorized',
          level: 'beginner',
          price: 0,
          currency: 'USD',
          lessons: [],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'draft',
            tags: [],
            language: 'en',
            requirements: [],
            outcomes: [],
          },
          settings: {
            allowComments: true,
            allowDownloads: false,
            showProgress: true,
            certificateEnabled: false,
          },
          analytics: {
            totalEnrollments: 0,
            totalCompletions: 0,
            averageRating: 0,
            totalRevenue: 0,
          },
        });
        setShowCreateForm(false);
      } catch (error) {
        console.error('Failed to create course:', error);
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
      ['catalog', 'my-courses', 'create', 'analytics'].map(tab =>
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
        }, tab.replace('-', ' '))
      )
    )
  );

  const renderCourseCard = (course: Course) => (
    React.createElement('div', {
      key: course.id,
      style: {
        backgroundColor: appliedTheme.colors.surface,
        borderRadius: appliedTheme.borders.borderRadius,
        overflow: 'hidden',
        border: `1px solid ${appliedTheme.borders.borderColor}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer'
      },
      onMouseEnter: (e: any) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      },
      onMouseLeave: (e: any) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }
    },
      // Thumbnail
      course.thumbnail && React.createElement('img', {
        src: course.thumbnail,
        alt: course.title,
        style: {
          width: '100%',
          height: '200px',
          objectFit: 'cover'
        }
      }),
      // Content
      React.createElement('div', {
        style: {
          padding: appliedTheme.spacing.lg
        }
      },
        // Header
        React.createElement('div', {
          style: {
            marginBottom: appliedTheme.spacing.md
          }
        },
          React.createElement('h3', {
            style: {
              fontSize: appliedTheme.font.sizeLg,
              fontWeight: 600,
              margin: 0,
              marginBottom: appliedTheme.spacing.xs,
              color: appliedTheme.colors.textPrimary
            }
          }, course.title),
          React.createElement('p', {
            style: {
              fontSize: appliedTheme.font.sizeSm,
              color: appliedTheme.colors.textSecondary,
              margin: 0
            }
          }, `by ${course.instructorName}`)
        ),
        // Description
        React.createElement('p', {
          style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            marginBottom: appliedTheme.spacing.md,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical'
          }
        }, course.description),
        // Stats
        React.createElement('div', {
          style: {
            display: 'flex',
            gap: appliedTheme.spacing.md,
            marginBottom: appliedTheme.spacing.md,
            fontSize: appliedTheme.font.sizeXs,
            color: appliedTheme.colors.textSecondary
          }
        },
          React.createElement('span', {}, `${course.lessons.length} lessons`),
          course.duration && React.createElement('span', {}, formatDuration(course.duration)),
          React.createElement('span', {}, `${course.analytics.totalEnrollments} students`)
        ),
        // Footer
        React.createElement('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }
        },
          React.createElement('div', {},
            React.createElement('span', {
              style: {
                padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeXs,
                fontWeight: 500,
                backgroundColor: getLevelColor(course.level) + '20',
                color: getLevelColor(course.level),
                textTransform: 'capitalize'
              }
            }, course.level),
            React.createElement('div', {
              style: {
                fontSize: appliedTheme.font.sizeLg,
                fontWeight: 600,
                color: appliedTheme.colors.textPrimary,
                marginTop: appliedTheme.spacing.sm
              }
            }, course.price === 0 ? 'Free' : `${course.currency} ${course.price}`)
          ),
          React.createElement('button', {
            onClick: (e: any) => {
              e.stopPropagation();
              handleEnroll(course.id);
            },
            style: {
              padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
              backgroundColor: appliedTheme.colors.secondary,
              color: 'white',
              border: 'none',
              borderRadius: appliedTheme.borders.borderRadius,
              fontSize: appliedTheme.font.sizeSm,
              cursor: 'pointer'
            }
          }, 'Enroll')
        )
      )
    )
  );

  const renderCatalog = () => (
    React.createElement('div', {},
      // Search and filters
      React.createElement('div', {
        style: {
          marginBottom: appliedTheme.spacing.xl
        }
      },
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search courses...',
          value: searchQuery,
          onChange: (e: any) => setSearchQuery(e.target.value),
          style: {
            width: '100%',
            padding: appliedTheme.spacing.md,
            borderRadius: appliedTheme.borders.borderRadius,
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            fontSize: appliedTheme.font.sizeMd,
            backgroundColor: appliedTheme.colors.surface
          }
        })
      ),
      // Course grid
      React.createElement('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: appliedTheme.spacing.lg
        }
      },
        filteredCourses.length > 0 ?
          filteredCourses.map(course => renderCourseCard(course)) :
          React.createElement('p', {
            style: {
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: appliedTheme.colors.textSecondary
            }
          }, 'No courses found matching your criteria.')
      )
    )
  );

  const renderMyCourses = () => (
    React.createElement('div', {},
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeXl,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'My Enrolled Courses'),
      React.createElement('div', {
        style: {
          display: 'grid',
          gap: appliedTheme.spacing.lg
        }
      },
        userEnrollments.length > 0 ?
          userEnrollments.map(enrollment => {
            const course = courses[enrollment.courseId];
            if (!course) return null;

            const progress = calculateProgress(course.id);

            return React.createElement('div', {
              key: enrollment.id,
              style: {
                backgroundColor: appliedTheme.colors.surface,
                borderRadius: appliedTheme.borders.borderRadius,
                padding: appliedTheme.spacing.lg,
                border: `1px solid ${appliedTheme.borders.borderColor}`,
                display: 'flex',
                gap: appliedTheme.spacing.lg
              }
            },
              // Course info
              React.createElement('div', {
                style: { flex: 1 }
              },
                React.createElement('h3', {
                  style: {
                    fontSize: appliedTheme.font.sizeLg,
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: appliedTheme.spacing.xs,
                    color: appliedTheme.colors.textPrimary
                  }
                }, course.title),
                React.createElement('p', {
                  style: {
                    fontSize: appliedTheme.font.sizeSm,
                    color: appliedTheme.colors.textSecondary,
                    margin: 0,
                    marginBottom: appliedTheme.spacing.md
                  }
                }, course.description),
                // Progress bar
                React.createElement('div', {
                  style: {
                    marginBottom: appliedTheme.spacing.sm
                  }
                },
                  React.createElement('div', {
                    style: {
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: appliedTheme.spacing.xs,
                      fontSize: appliedTheme.font.sizeSm
                    }
                  },
                    React.createElement('span', {
                      style: { color: appliedTheme.colors.textSecondary }
                    }, 'Progress'),
                    React.createElement('span', {
                      style: { color: appliedTheme.colors.textPrimary, fontWeight: 500 }
                    }, `${Math.round(progress)}%`)
                  ),
                  React.createElement('div', {
                    style: {
                      width: '100%',
                      height: '8px',
                      backgroundColor: appliedTheme.colors.muted,
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }
                  },
                    React.createElement('div', {
                      style: {
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: appliedTheme.colors.secondary,
                        transition: 'width 0.3s ease'
                      }
                    })
                  )
                )
              ),
              // Actions
              React.createElement('div', {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: appliedTheme.spacing.sm
                }
              },
                React.createElement('button', {
                  style: {
                    padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                    backgroundColor: appliedTheme.colors.secondary,
                    color: 'white',
                    border: 'none',
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeSm,
                    cursor: 'pointer'
                  }
                }, 'Continue'),
                enrollment.status === 'completed' && course.settings.certificateEnabled &&
                  React.createElement('button', {
                    style: {
                      padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                      backgroundColor: appliedTheme.colors.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: appliedTheme.borders.borderRadius,
                      fontSize: appliedTheme.font.sizeSm,
                      cursor: 'pointer'
                    }
                  }, 'Certificate')
              )
            );
          }) :
          React.createElement('p', {
            style: {
              textAlign: 'center',
              color: appliedTheme.colors.textSecondary
            }
          }, 'You have not enrolled in any courses yet.')
      )
    )
  );

  const renderAnalytics = () => {
    const totalCourses = Object.keys(courses).length;
    const totalEnrollments = Object.keys(enrollments).length;
    const averageRating = Object.values(courses).reduce((sum, course) => sum + course.analytics.averageRating, 0) / totalCourses || 0;
    const totalRevenue = Object.values(courses).reduce((sum, course) => sum + course.analytics.totalRevenue, 0);

    return React.createElement('div', {},
      React.createElement('h2', {
        style: {
          fontSize: appliedTheme.font.sizeXl,
          fontWeight: 600,
          marginBottom: appliedTheme.spacing.lg,
          color: appliedTheme.colors.textPrimary
        }
      }, 'Course Analytics'),
      React.createElement('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: appliedTheme.spacing.lg,
          marginBottom: appliedTheme.spacing.xl
        }
      },
        [
          { label: 'Total Courses', value: totalCourses },
          { label: 'Total Enrollments', value: totalEnrollments },
          { label: 'Average Rating', value: averageRating.toFixed(1) },
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}` }
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
  };

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
    }, 'Loading course data...'),

    // Tab content
    !loading && activeTab === 'catalog' && renderCatalog(),
    !loading && activeTab === 'my-courses' && renderMyCourses(),
    !loading && activeTab === 'analytics' && renderAnalytics(),
    
    activeTab === 'create' && React.createElement('div', {
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
      }, 'Create New Course'),
      React.createElement('p', {
        style: {
          color: appliedTheme.colors.textSecondary,
          marginBottom: appliedTheme.spacing.lg
        }
      }, 'Course creation interface would be implemented here.'),
      (userRole === 'owner' || userRole === 'admin') && React.createElement('button', {
        onClick: handleCreateCourse,
        style: {
          padding: `${appliedTheme.spacing.md} ${appliedTheme.spacing.lg}`,
          backgroundColor: appliedTheme.colors.secondary,
          color: 'white',
          border: 'none',
          borderRadius: appliedTheme.borders.borderRadius,
          fontSize: appliedTheme.font.sizeMd,
          cursor: 'pointer'
        }
      }, 'Create Sample Course')
    )
  );
};