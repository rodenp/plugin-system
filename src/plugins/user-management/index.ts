import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventBus } from '@course-framework/core/event-bus';

// ============================================================================
// USER MANAGEMENT PLUGIN
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

// ============================================================================
// REDUX SLICE
// ============================================================================

interface UserManagementState {
  users: Record<string, UserProfile>;
  instructors: Record<string, InstructorProfile>;
  enrollments: Record<string, StudentEnrollment[]>; // keyed by userId
  courseEnrollments: Record<string, StudentEnrollment[]>; // keyed by courseId
  activities: Record<string, UserActivity[]>; // keyed by userId
  notifications: Record<string, UserNotification[]>; // keyed by userId
  groups: Record<string, UserGroup>;
  loading: boolean;
  error: string | null;
}

const initialState: UserManagementState = {
  users: {},
  instructors: {},
  enrollments: {},
  courseEnrollments: {},
  activities: {},
  notifications: {},
  groups: {},
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const loadUserProfile = createAsyncThunk(
  'userManagement/loadUserProfile',
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to load user profile');
    }
    return response.json();
  }
);

export const updateUserProfile = createAsyncThunk(
  'userManagement/updateUserProfile',
  async ({ userId, updates }: { userId: string; updates: Partial<UserProfile> }) => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }
    
    const updatedUser = await response.json();
    eventBus.emit('user:profile-updated', updatedUser);
    return updatedUser;
  }
);

export const enrollStudentInCourse = createAsyncThunk(
  'userManagement/enrollStudent',
  async ({ 
    studentId, 
    courseId, 
    enrollmentData 
  }: { 
    studentId: string; 
    courseId: string; 
    enrollmentData: Partial<StudentEnrollment> 
  }) => {
    const response = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        courseId,
        ...enrollmentData,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to enroll student');
    }
    
    const enrollment = await response.json();
    eventBus.emit('user:enrolled', enrollment);
    return enrollment;
  }
);

export const updateStudentProgress = createAsyncThunk(
  'userManagement/updateProgress',
  async ({ 
    enrollmentId, 
    progressUpdate 
  }: { 
    enrollmentId: string; 
    progressUpdate: Partial<StudentEnrollment['progress']> 
  }) => {
    const response = await fetch(`/api/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressUpdate),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update progress');
    }
    
    const updatedEnrollment = await response.json();
    eventBus.emit('user:progress-updated', updatedEnrollment);
    return updatedEnrollment;
  }
);

export const addUserActivity = createAsyncThunk(
  'userManagement/addActivity',
  async (activity: Omit<UserActivity, 'id' | 'timestamp'>) => {
    const response = await fetch('/api/user-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add user activity');
    }
    
    return response.json();
  }
);

export const sendNotification = createAsyncThunk(
  'userManagement/sendNotification',
  async (notification: Omit<UserNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send notification');
    }
    
    const sentNotification = await response.json();
    eventBus.emit('notification:sent', sentNotification);
    return sentNotification;
  }
);

export const createUserGroup = createAsyncThunk(
  'userManagement/createGroup',
  async (groupData: Omit<UserGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await fetch('/api/user-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create user group');
    }
    
    const group = await response.json();
    eventBus.emit('group:created', group);
    return group;
  }
);

export const loadUserEnrollments = createAsyncThunk(
  'userManagement/loadEnrollments',
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}/enrollments`);
    if (!response.ok) {
      throw new Error('Failed to load user enrollments');
    }
    return response.json();
  }
);

export const loadCourseEnrollments = createAsyncThunk(
  'userManagement/loadCourseEnrollments',
  async (courseId: string) => {
    const response = await fetch(`/api/courses/${courseId}/enrollments`);
    if (!response.ok) {
      throw new Error('Failed to load course enrollments');
    }
    return response.json();
  }
);

// ============================================================================
// SLICE DEFINITION
// ============================================================================

const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.users[action.payload.id] = action.payload;
    },
    setInstructor: (state, action: PayloadAction<InstructorProfile>) => {
      state.instructors[action.payload.id] = action.payload;
    },
    addEnrollment: (state, action: PayloadAction<StudentEnrollment>) => {
      const enrollment = action.payload;
      
      // Add to user enrollments
      if (!state.enrollments[enrollment.studentId]) {
        state.enrollments[enrollment.studentId] = [];
      }
      const userEnrollmentIndex = state.enrollments[enrollment.studentId].findIndex(e => e.id === enrollment.id);
      if (userEnrollmentIndex !== -1) {
        state.enrollments[enrollment.studentId][userEnrollmentIndex] = enrollment;
      } else {
        state.enrollments[enrollment.studentId].push(enrollment);
      }
      
      // Add to course enrollments
      if (!state.courseEnrollments[enrollment.courseId]) {
        state.courseEnrollments[enrollment.courseId] = [];
      }
      const courseEnrollmentIndex = state.courseEnrollments[enrollment.courseId].findIndex(e => e.id === enrollment.id);
      if (courseEnrollmentIndex !== -1) {
        state.courseEnrollments[enrollment.courseId][courseEnrollmentIndex] = enrollment;
      } else {
        state.courseEnrollments[enrollment.courseId].push(enrollment);
      }
    },
    updateEnrollmentProgress: (state, action: PayloadAction<{ enrollmentId: string; progress: Partial<StudentEnrollment['progress']> }>) => {
      const { enrollmentId, progress } = action.payload;
      
      // Update in user enrollments
      Object.values(state.enrollments).forEach(userEnrollments => {
        const enrollmentIndex = userEnrollments.findIndex(e => e.id === enrollmentId);
        if (enrollmentIndex !== -1) {
          userEnrollments[enrollmentIndex].progress = {
            ...userEnrollments[enrollmentIndex].progress,
            ...progress
          };
        }
      });
      
      // Update in course enrollments
      Object.values(state.courseEnrollments).forEach(courseEnrollments => {
        const enrollmentIndex = courseEnrollments.findIndex(e => e.id === enrollmentId);
        if (enrollmentIndex !== -1) {
          courseEnrollments[enrollmentIndex].progress = {
            ...courseEnrollments[enrollmentIndex].progress,
            ...progress
          };
        }
      });
    },
    addActivity: (state, action: PayloadAction<UserActivity>) => {
      const activity = action.payload;
      if (!state.activities[activity.userId]) {
        state.activities[activity.userId] = [];
      }
      state.activities[activity.userId].unshift(activity);
      
      // Keep only last 100 activities per user
      if (state.activities[activity.userId].length > 100) {
        state.activities[activity.userId] = state.activities[activity.userId].slice(0, 100);
      }
    },
    addNotification: (state, action: PayloadAction<UserNotification>) => {
      const notification = action.payload;
      if (!state.notifications[notification.userId]) {
        state.notifications[notification.userId] = [];
      }
      state.notifications[notification.userId].unshift(notification);
      
      // Keep only last 50 notifications per user
      if (state.notifications[notification.userId].length > 50) {
        state.notifications[notification.userId] = state.notifications[notification.userId].slice(0, 50);
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<{ userId: string; notificationId: string }>) => {
      const { userId, notificationId } = action.payload;
      if (state.notifications[userId]) {
        const notification = state.notifications[userId].find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
      }
    },
    setGroup: (state, action: PayloadAction<UserGroup>) => {
      state.groups[action.payload.id] = action.payload;
    },
    addUserToGroup: (state, action: PayloadAction<{ groupId: string; userId: string }>) => {
      const { groupId, userId } = action.payload;
      if (state.groups[groupId]) {
        if (!state.groups[groupId].memberIds.includes(userId)) {
          state.groups[groupId].memberIds.push(userId);
        }
      }
    },
    removeUserFromGroup: (state, action: PayloadAction<{ groupId: string; userId: string }>) => {
      const { groupId, userId } = action.payload;
      if (state.groups[groupId]) {
        state.groups[groupId].memberIds = state.groups[groupId].memberIds.filter(id => id !== userId);
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.users[action.payload.id] = action.payload;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.users[action.payload.id] = action.payload;
      })
      .addCase(enrollStudentInCourse.fulfilled, (state, action) => {
        const enrollment = action.payload;
        
        // Add to user enrollments
        if (!state.enrollments[enrollment.studentId]) {
          state.enrollments[enrollment.studentId] = [];
        }
        state.enrollments[enrollment.studentId].push(enrollment);
        
        // Add to course enrollments
        if (!state.courseEnrollments[enrollment.courseId]) {
          state.courseEnrollments[enrollment.courseId] = [];
        }
        state.courseEnrollments[enrollment.courseId].push(enrollment);
      })
      .addCase(updateStudentProgress.fulfilled, (state, action) => {
        const updatedEnrollment = action.payload;
        
        // Update user enrollments
        if (state.enrollments[updatedEnrollment.studentId]) {
          const index = state.enrollments[updatedEnrollment.studentId].findIndex(e => e.id === updatedEnrollment.id);
          if (index !== -1) {
            state.enrollments[updatedEnrollment.studentId][index] = updatedEnrollment;
          }
        }
        
        // Update course enrollments
        if (state.courseEnrollments[updatedEnrollment.courseId]) {
          const index = state.courseEnrollments[updatedEnrollment.courseId].findIndex(e => e.id === updatedEnrollment.id);
          if (index !== -1) {
            state.courseEnrollments[updatedEnrollment.courseId][index] = updatedEnrollment;
          }
        }
      })
      .addCase(addUserActivity.fulfilled, (state, action) => {
        const activity = action.payload;
        if (!state.activities[activity.userId]) {
          state.activities[activity.userId] = [];
        }
        state.activities[activity.userId].unshift(activity);
      })
      .addCase(sendNotification.fulfilled, (state, action) => {
        const notification = action.payload;
        if (!state.notifications[notification.userId]) {
          state.notifications[notification.userId] = [];
        }
        state.notifications[notification.userId].unshift(notification);
      })
      .addCase(createUserGroup.fulfilled, (state, action) => {
        state.groups[action.payload.id] = action.payload;
      })
      .addCase(loadUserEnrollments.fulfilled, (state, action) => {
        const { userId, enrollments } = action.payload;
        state.enrollments[userId] = enrollments;
      })
      .addCase(loadCourseEnrollments.fulfilled, (state, action) => {
        const { courseId, enrollments } = action.payload;
        state.courseEnrollments[courseId] = enrollments;
      });
  },
});

// ============================================================================
// USER MANAGEMENT UTILITIES
// ============================================================================

export function calculateProgressPercentage(enrollment: StudentEnrollment, totalLessons: number): number {
  if (totalLessons === 0) return 0;
  return (enrollment.progress.lessonsCompleted.length / totalLessons) * 100;
}

export function formatUserDisplayName(user: UserProfile): string {
  if (user.displayName) return user.displayName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.username) return user.username;
  return user.email.split('@')[0];
}

export function getUserPermissions(user: UserProfile): string[] {
  const rolePermissions: Record<string, string[]> = {
    student: ['view_courses', 'enroll_courses', 'submit_assignments'],
    instructor: ['view_courses', 'create_courses', 'grade_assignments', 'view_analytics'],
    admin: ['*'], // All permissions
    moderator: ['view_courses', 'moderate_content', 'manage_users'],
  };
  
  const permissions = rolePermissions[user.role] || [];
  return [...new Set([...permissions, ...user.permissions])];
}

export function canUserAccessCourse(user: UserProfile, course: any): boolean {
  if (user.role === 'admin') return true;
  if (course.instructorId === user.id) return true;
  if (course.visibility === 'public') return true;
  // Add more logic for course access control
  return false;
}

export function getUserActivitySummary(activities: UserActivity[], days: number = 30): any {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentActivities = activities.filter(activity => 
    new Date(activity.timestamp) >= cutoffDate
  );
  
  const summary = {
    totalActivities: recentActivities.length,
    byType: {} as Record<string, number>,
    byDay: {} as Record<string, number>,
  };
  
  recentActivities.forEach(activity => {
    // Count by type
    summary.byType[activity.type] = (summary.byType[activity.type] || 0) + 1;
    
    // Count by day
    const day = new Date(activity.timestamp).toISOString().split('T')[0];
    summary.byDay[day] = (summary.byDay[day] || 0) + 1;
  });
  
  return summary;
}

// ============================================================================
// PLUGIN FACTORY
// ============================================================================

export function createUserManagementPlugin() {
  return {
    id: 'user-management',
    name: 'Enhanced User Management',
    version: '1.0.0',
    
    initialize: async () => {
      console.log('User Management plugin initialized');
    },
    
    slice: userManagementSlice,
    
    utils: {
      calculateProgressPercentage,
      formatUserDisplayName,
      getUserPermissions,
      canUserAccessCourse,
      getUserActivitySummary,
      
      // Enrollment helpers
      createEnrollment: (studentId: string, courseId: string, type: StudentEnrollment['enrollmentType'] = 'free'): Partial<StudentEnrollment> => ({
        studentId,
        courseId,
        enrollmentType: type,
        enrolledAt: new Date(),
        lastAccessedAt: new Date(),
        progress: {
          overallPercentage: 0,
          lessonsCompleted: [],
          assessmentsCompleted: [],
          timeSpent: 0,
          bookmarks: [],
          notes: [],
        },
        performance: {
          averageScore: 0,
          assessmentScores: {},
          completionStreak: 0,
          badges: [],
          achievements: [],
        },
        settings: {
          notifications: true,
          publicProfile: false,
          showProgress: true,
          autoplayVideos: true,
          subtitles: false,
          playbackSpeed: 1,
        },
        status: 'active',
        amountPaid: 0,
        currency: 'USD',
      }),
      
      // Activity helpers
      createActivity: (userId: string, type: UserActivity['type'], description: string, metadata: Record<string, any> = {}): Omit<UserActivity, 'id' | 'timestamp'> => ({
        userId,
        type,
        description,
        metadata,
      }),
      
      // Notification helpers
      createNotification: (userId: string, type: UserNotification['type'], title: string, message: string, priority: UserNotification['priority'] = 'normal'): Omit<UserNotification, 'id' | 'createdAt' | 'isRead'> => ({
        userId,
        type,
        title,
        message,
        priority,
      }),
    },
    
    // Event handlers
    onCourseCompleted: (completion: any) => {
      const store = (window as any).__courseFrameworkStore;
      if (store) {
        // Add completion activity
        store.dispatch(addUserActivity({
          userId: completion.studentId,
          type: 'lesson_completed',
          description: `Completed course: ${completion.courseName}`,
          metadata: { courseId: completion.courseId, completionDate: completion.completedAt },
        }));
        
        // Send completion notification
        store.dispatch(sendNotification({
          userId: completion.studentId,
          type: 'course',
          title: 'Course Completed!',
          message: `Congratulations on completing ${completion.courseName}!`,
          priority: 'high',
        }));
      }
    },
    
    onLessonCompleted: (lesson: any) => {
      const store = (window as any).__courseFrameworkStore;
      if (store) {
        store.dispatch(addUserActivity({
          userId: lesson.studentId,
          type: 'lesson_completed',
          description: `Completed lesson: ${lesson.lessonName}`,
          metadata: { courseId: lesson.courseId, lessonId: lesson.lessonId },
        }));
      }
    }
  };
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useAppSelector, useAppDispatch } from '@course-framework/core/store';

export function useUserManagement() {
  const dispatch = useAppDispatch();
  const { 
    users, 
    instructors, 
    enrollments, 
    courseEnrollments, 
    activities, 
    notifications, 
    groups, 
    loading, 
    error 
  } = useAppSelector((state: any) => state.userManagement || initialState);
  
  return {
    users,
    instructors,
    enrollments,
    courseEnrollments,
    activities,
    notifications,
    groups,
    loading,
    error,
    
    // Actions
    loadUserProfile: (userId: string) => dispatch(loadUserProfile(userId)),
    updateUserProfile: (userId: string, updates: Partial<UserProfile>) => 
      dispatch(updateUserProfile({ userId, updates })),
    enrollStudent: (studentId: string, courseId: string, enrollmentData: Partial<StudentEnrollment>) =>
      dispatch(enrollStudentInCourse({ studentId, courseId, enrollmentData })),
    updateProgress: (enrollmentId: string, progressUpdate: Partial<StudentEnrollment['progress']>) =>
      dispatch(updateStudentProgress({ enrollmentId, progressUpdate })),
    addActivity: (activity: Omit<UserActivity, 'id' | 'timestamp'>) => dispatch(addUserActivity(activity)),
    sendNotification: (notification: Omit<UserNotification, 'id' | 'createdAt' | 'isRead'>) =>
      dispatch(sendNotification(notification)),
    createGroup: (groupData: Omit<UserGroup, 'id' | 'createdAt' | 'updatedAt'>) =>
      dispatch(createUserGroup(groupData)),
    loadUserEnrollments: (userId: string) => dispatch(loadUserEnrollments(userId)),
    loadCourseEnrollments: (courseId: string) => dispatch(loadCourseEnrollments(courseId)),
    
    // State management
    setUser: (user: UserProfile) => dispatch(userManagementSlice.actions.setUser(user)),
    addEnrollment: (enrollment: StudentEnrollment) => dispatch(userManagementSlice.actions.addEnrollment(enrollment)),
    markNotificationAsRead: (userId: string, notificationId: string) =>
      dispatch(userManagementSlice.actions.markNotificationAsRead({ userId, notificationId })),
    
    // Computed values
    getUser: (userId: string) => users[userId],
    getInstructor: (instructorId: string) => instructors[instructorId],
    getUserEnrollments: (userId: string) => enrollments[userId] || [],
    getCourseEnrollments: (courseId: string) => courseEnrollments[courseId] || [],
    getUserActivities: (userId: string) => activities[userId] || [],
    getUserNotifications: (userId: string) => notifications[userId] || [],
    getUnreadNotifications: (userId: string) => (notifications[userId] || []).filter(n => !n.isRead),
    getGroup: (groupId: string) => groups[groupId],
    
    // Helper functions
    calculateProgress: (enrollment: StudentEnrollment, totalLessons: number) =>
      calculateProgressPercentage(enrollment, totalLessons),
    formatDisplayName: (user: UserProfile) => formatUserDisplayName(user),
    getUserPermissions: (user: UserProfile) => getUserPermissions(user),
    canAccessCourse: (user: UserProfile, course: any) => canUserAccessCourse(user, course),
    getActivitySummary: (userId: string, days?: number) => 
      getUserActivitySummary(activities[userId] || [], days),
  };
}

export const userManagementActions = userManagementSlice.actions;
export default userManagementSlice.reducer;