import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventBus } from '@course-framework/core/event-bus';
const initialState = {
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
export const loadUserProfile = createAsyncThunk('userManagement/loadUserProfile', async (userId) => {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
        throw new Error('Failed to load user profile');
    }
    return response.json();
});
export const updateUserProfile = createAsyncThunk('userManagement/updateUserProfile', async ({ userId, updates }) => {
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
});
export const enrollStudentInCourse = createAsyncThunk('userManagement/enrollStudent', async ({ studentId, courseId, enrollmentData }) => {
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
});
export const updateStudentProgress = createAsyncThunk('userManagement/updateProgress', async ({ enrollmentId, progressUpdate }) => {
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
});
export const addUserActivity = createAsyncThunk('userManagement/addActivity', async (activity) => {
    const response = await fetch('/api/user-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
    });
    if (!response.ok) {
        throw new Error('Failed to add user activity');
    }
    return response.json();
});
export const sendNotification = createAsyncThunk('userManagement/sendNotification', async (notification) => {
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
});
export const createUserGroup = createAsyncThunk('userManagement/createGroup', async (groupData) => {
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
});
export const loadUserEnrollments = createAsyncThunk('userManagement/loadEnrollments', async (userId) => {
    const response = await fetch(`/api/users/${userId}/enrollments`);
    if (!response.ok) {
        throw new Error('Failed to load user enrollments');
    }
    return response.json();
});
export const loadCourseEnrollments = createAsyncThunk('userManagement/loadCourseEnrollments', async (courseId) => {
    const response = await fetch(`/api/courses/${courseId}/enrollments`);
    if (!response.ok) {
        throw new Error('Failed to load course enrollments');
    }
    return response.json();
});
// ============================================================================
// SLICE DEFINITION
// ============================================================================
const userManagementSlice = createSlice({
    name: 'userManagement',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.users[action.payload.id] = action.payload;
        },
        setInstructor: (state, action) => {
            state.instructors[action.payload.id] = action.payload;
        },
        addEnrollment: (state, action) => {
            const enrollment = action.payload;
            // Add to user enrollments
            if (!state.enrollments[enrollment.studentId]) {
                state.enrollments[enrollment.studentId] = [];
            }
            const userEnrollmentIndex = state.enrollments[enrollment.studentId].findIndex(e => e.id === enrollment.id);
            if (userEnrollmentIndex !== -1) {
                state.enrollments[enrollment.studentId][userEnrollmentIndex] = enrollment;
            }
            else {
                state.enrollments[enrollment.studentId].push(enrollment);
            }
            // Add to course enrollments
            if (!state.courseEnrollments[enrollment.courseId]) {
                state.courseEnrollments[enrollment.courseId] = [];
            }
            const courseEnrollmentIndex = state.courseEnrollments[enrollment.courseId].findIndex(e => e.id === enrollment.id);
            if (courseEnrollmentIndex !== -1) {
                state.courseEnrollments[enrollment.courseId][courseEnrollmentIndex] = enrollment;
            }
            else {
                state.courseEnrollments[enrollment.courseId].push(enrollment);
            }
        },
        updateEnrollmentProgress: (state, action) => {
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
        addActivity: (state, action) => {
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
        addNotification: (state, action) => {
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
        markNotificationAsRead: (state, action) => {
            const { userId, notificationId } = action.payload;
            if (state.notifications[userId]) {
                const notification = state.notifications[userId].find(n => n.id === notificationId);
                if (notification) {
                    notification.isRead = true;
                }
            }
        },
        setGroup: (state, action) => {
            state.groups[action.payload.id] = action.payload;
        },
        addUserToGroup: (state, action) => {
            const { groupId, userId } = action.payload;
            if (state.groups[groupId]) {
                if (!state.groups[groupId].memberIds.includes(userId)) {
                    state.groups[groupId].memberIds.push(userId);
                }
            }
        },
        removeUserFromGroup: (state, action) => {
            const { groupId, userId } = action.payload;
            if (state.groups[groupId]) {
                state.groups[groupId].memberIds = state.groups[groupId].memberIds.filter(id => id !== userId);
            }
        },
        setError: (state, action) => {
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
export function calculateProgressPercentage(enrollment, totalLessons) {
    if (totalLessons === 0)
        return 0;
    return (enrollment.progress.lessonsCompleted.length / totalLessons) * 100;
}
export function formatUserDisplayName(user) {
    if (user.displayName)
        return user.displayName;
    if (user.firstName && user.lastName)
        return `${user.firstName} ${user.lastName}`;
    if (user.firstName)
        return user.firstName;
    if (user.username)
        return user.username;
    return user.email.split('@')[0];
}
export function getUserPermissions(user) {
    const rolePermissions = {
        student: ['view_courses', 'enroll_courses', 'submit_assignments'],
        instructor: ['view_courses', 'create_courses', 'grade_assignments', 'view_analytics'],
        admin: ['*'], // All permissions
        moderator: ['view_courses', 'moderate_content', 'manage_users'],
    };
    const permissions = rolePermissions[user.role] || [];
    return [...new Set([...permissions, ...user.permissions])];
}
export function canUserAccessCourse(user, course) {
    if (user.role === 'admin')
        return true;
    if (course.instructorId === user.id)
        return true;
    if (course.visibility === 'public')
        return true;
    // Add more logic for course access control
    return false;
}
export function getUserActivitySummary(activities, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const recentActivities = activities.filter(activity => new Date(activity.timestamp) >= cutoffDate);
    const summary = {
        totalActivities: recentActivities.length,
        byType: {},
        byDay: {},
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
            createEnrollment: (studentId, courseId, type = 'free') => ({
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
            createActivity: (userId, type, description, metadata = {}) => ({
                userId,
                type,
                description,
                metadata,
            }),
            // Notification helpers
            createNotification: (userId, type, title, message, priority = 'normal') => ({
                userId,
                type,
                title,
                message,
                priority,
            }),
        },
        // Event handlers
        onCourseCompleted: (completion) => {
            const store = window.__courseFrameworkStore;
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
        onLessonCompleted: (lesson) => {
            const store = window.__courseFrameworkStore;
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
    const { users, instructors, enrollments, courseEnrollments, activities, notifications, groups, loading, error } = useAppSelector((state) => state.userManagement || initialState);
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
        loadUserProfile: (userId) => dispatch(loadUserProfile(userId)),
        updateUserProfile: (userId, updates) => dispatch(updateUserProfile({ userId, updates })),
        enrollStudent: (studentId, courseId, enrollmentData) => dispatch(enrollStudentInCourse({ studentId, courseId, enrollmentData })),
        updateProgress: (enrollmentId, progressUpdate) => dispatch(updateStudentProgress({ enrollmentId, progressUpdate })),
        addActivity: (activity) => dispatch(addUserActivity(activity)),
        sendNotification: (notification) => dispatch(sendNotification(notification)),
        createGroup: (groupData) => dispatch(createUserGroup(groupData)),
        loadUserEnrollments: (userId) => dispatch(loadUserEnrollments(userId)),
        loadCourseEnrollments: (courseId) => dispatch(loadCourseEnrollments(courseId)),
        // State management
        setUser: (user) => dispatch(userManagementSlice.actions.setUser(user)),
        addEnrollment: (enrollment) => dispatch(userManagementSlice.actions.addEnrollment(enrollment)),
        markNotificationAsRead: (userId, notificationId) => dispatch(userManagementSlice.actions.markNotificationAsRead({ userId, notificationId })),
        // Computed values
        getUser: (userId) => users[userId],
        getInstructor: (instructorId) => instructors[instructorId],
        getUserEnrollments: (userId) => enrollments[userId] || [],
        getCourseEnrollments: (courseId) => courseEnrollments[courseId] || [],
        getUserActivities: (userId) => activities[userId] || [],
        getUserNotifications: (userId) => notifications[userId] || [],
        getUnreadNotifications: (userId) => (notifications[userId] || []).filter(n => !n.isRead),
        getGroup: (groupId) => groups[groupId],
        // Helper functions
        calculateProgress: (enrollment, totalLessons) => calculateProgressPercentage(enrollment, totalLessons),
        formatDisplayName: (user) => formatUserDisplayName(user),
        getUserPermissions: (user) => getUserPermissions(user),
        canAccessCourse: (user, course) => canUserAccessCourse(user, course),
        getActivitySummary: (userId, days) => getUserActivitySummary(activities[userId] || [], days),
    };
}
export const userManagementActions = userManagementSlice.actions;
export default userManagementSlice.reducer;
