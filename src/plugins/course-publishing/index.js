import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventBus } from '@core/event-bus';
const initialState = {
    publishingInfo: {},
    reviews: {},
    marketplaceEntries: {},
    loading: false,
    error: null,
};
// ============================================================================
// ASYNC THUNKS
// ============================================================================
export const initializeCoursePublishing = createAsyncThunk('coursePublishing/initialize', async (courseId) => {
    const response = await fetch(`/api/courses/${courseId}/publishing`);
    if (!response.ok) {
        throw new Error('Failed to load course publishing info');
    }
    return response.json();
});
export const submitForReview = createAsyncThunk('coursePublishing/submitForReview', async ({ courseId, publishingInfo }) => {
    const response = await fetch(`/api/courses/${courseId}/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishingInfo),
    });
    if (!response.ok) {
        throw new Error('Failed to submit course for review');
    }
    const result = await response.json();
    eventBus.emit('course:submitted-for-review', { courseId, publishingInfo });
    return result;
});
export const publishCourse = createAsyncThunk('coursePublishing/publishCourse', async ({ courseId, publishingInfo }) => {
    const response = await fetch(`/api/courses/${courseId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishingInfo),
    });
    if (!response.ok) {
        throw new Error('Failed to publish course');
    }
    const result = await response.json();
    eventBus.emit('course:published', { courseId, publishingInfo });
    return result;
});
export const unpublishCourse = createAsyncThunk('coursePublishing/unpublishCourse', async (courseId) => {
    const response = await fetch(`/api/courses/${courseId}/unpublish`, {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error('Failed to unpublish course');
    }
    const result = await response.json();
    eventBus.emit('course:unpublished', { courseId });
    return result;
});
export const reviewCourse = createAsyncThunk('coursePublishing/reviewCourse', async ({ courseId, review }) => {
    const response = await fetch(`/api/courses/${courseId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review),
    });
    if (!response.ok) {
        throw new Error('Failed to submit course review');
    }
    const result = await response.json();
    eventBus.emit('course:reviewed', { courseId, review: result });
    return result;
});
export const updateMarketplaceEntry = createAsyncThunk('coursePublishing/updateMarketplaceEntry', async ({ courseId, updates }) => {
    const response = await fetch(`/api/marketplace/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!response.ok) {
        throw new Error('Failed to update marketplace entry');
    }
    return response.json();
});
// ============================================================================
// SLICE DEFINITION
// ============================================================================
const coursePublishingSlice = createSlice({
    name: 'coursePublishing',
    initialState,
    reducers: {
        setPublishingInfo: (state, action) => {
            state.publishingInfo[action.payload.courseId] = action.payload.info;
        },
        updatePublishingInfo: (state, action) => {
            const { courseId, updates } = action.payload;
            if (state.publishingInfo[courseId]) {
                state.publishingInfo[courseId] = { ...state.publishingInfo[courseId], ...updates };
            }
        },
        addReview: (state, action) => {
            const { courseId, review } = action.payload;
            if (!state.reviews[courseId]) {
                state.reviews[courseId] = [];
            }
            state.reviews[courseId].push(review);
        },
        setMarketplaceEntry: (state, action) => {
            state.marketplaceEntries[action.payload.courseId] = action.payload.entry;
        },
        updateMarketplaceStats: (state, action) => {
            const { courseId, stats } = action.payload;
            if (state.marketplaceEntries[courseId]) {
                state.marketplaceEntries[courseId].statistics = {
                    ...state.marketplaceEntries[courseId].statistics,
                    ...stats
                };
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
            .addCase(initializeCoursePublishing.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(initializeCoursePublishing.fulfilled, (state, action) => {
            state.loading = false;
            // Handle initialization data
        })
            .addCase(submitForReview.fulfilled, (state, action) => {
            const { courseId } = action.meta.arg;
            if (state.publishingInfo[courseId]) {
                state.publishingInfo[courseId].status = 'review';
                state.publishingInfo[courseId].submittedForReviewAt = new Date();
            }
        })
            .addCase(publishCourse.fulfilled, (state, action) => {
            const { courseId } = action.meta.arg;
            if (state.publishingInfo[courseId]) {
                state.publishingInfo[courseId].status = 'published';
                state.publishingInfo[courseId].publishedAt = new Date();
            }
        })
            .addCase(unpublishCourse.fulfilled, (state, action) => {
            const courseId = action.meta.arg;
            if (state.publishingInfo[courseId]) {
                state.publishingInfo[courseId].status = 'draft';
                state.publishingInfo[courseId].publishedAt = undefined;
            }
        })
            .addCase(reviewCourse.fulfilled, (state, action) => {
            const { courseId } = action.meta.arg;
            const review = action.payload;
            if (!state.reviews[courseId]) {
                state.reviews[courseId] = [];
            }
            state.reviews[courseId].push(review);
            // Update publishing status based on review
            if (state.publishingInfo[courseId]) {
                state.publishingInfo[courseId].status = review.status === 'approved' ? 'published' : 'rejected';
                state.publishingInfo[courseId].reviewedAt = new Date();
                state.publishingInfo[courseId].reviewedBy = review.reviewerName;
                if (review.status === 'rejected') {
                    state.publishingInfo[courseId].rejectionReason = review.feedback;
                }
            }
        });
    },
});
// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================
export function validateCourseForPublishing(course, publishingInfo) {
    const errors = [];
    // Course content validation
    if (!course?.title || course.title.trim().length === 0) {
        errors.push('Course title is required');
    }
    if (!course?.description || course.description.trim().length < 50) {
        errors.push('Course description must be at least 50 characters');
    }
    if (!course?.lessons || course.lessons.length === 0) {
        errors.push('Course must have at least one lesson');
    }
    // Publishing info validation
    if (!publishingInfo.metadata?.category) {
        errors.push('Course category is required');
    }
    if (!publishingInfo.metadata?.whatYouWillLearn || publishingInfo.metadata.whatYouWillLearn.length === 0) {
        errors.push('Learning objectives are required');
    }
    if (!publishingInfo.metadata?.level) {
        errors.push('Course level is required');
    }
    if (publishingInfo.pricing === 'paid' && (!publishingInfo.price || publishingInfo.price <= 0)) {
        errors.push('Price is required for paid courses');
    }
    if (!publishingInfo.seo?.slug) {
        errors.push('Course URL slug is required');
    }
    return errors;
}
export function generateCourseSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
export function calculateCourseDuration(lessons) {
    return lessons.reduce((total, lesson) => {
        return total + (lesson.duration || 0);
    }, 0);
}
// ============================================================================
// PLUGIN FACTORY
// ============================================================================
export function createCoursePublishingPlugin() {
    return {
        id: 'course-publishing',
        name: 'Course Publishing & Marketplace',
        version: '1.0.0',
        initialize: async () => {
            // Plugin-specific initialization
            console.log('Course Publishing plugin initialized');
        },
        slice: coursePublishingSlice,
        utils: {
            validateCourseForPublishing,
            generateCourseSlug,
            calculateCourseDuration,
            // Course status helpers
            canSubmitForReview: (status) => status === 'draft' || status === 'rejected',
            canPublish: (status) => status === 'review',
            canUnpublish: (status) => status === 'published',
            // Publishing workflow helpers
            getNextStatus: (currentStatus, action) => {
                switch (action) {
                    case 'submit':
                        return currentStatus === 'draft' || currentStatus === 'rejected' ? 'review' : currentStatus;
                    case 'approve':
                        return currentStatus === 'review' ? 'published' : currentStatus;
                    case 'reject':
                        return currentStatus === 'review' ? 'rejected' : currentStatus;
                    case 'unpublish':
                        return currentStatus === 'published' ? 'draft' : currentStatus;
                    case 'archive':
                        return 'archived';
                    default:
                        return currentStatus;
                }
            }
        },
        // Event handlers
        onCourseCreated: (course) => {
            // Initialize publishing info for new course
            const publishingInfo = {
                courseId: course.id,
                status: 'draft',
                visibility: 'private',
                pricing: 'free',
                metadata: {
                    title: course.title,
                    description: course.description || '',
                    shortDescription: '',
                    category: '',
                    tags: [],
                    level: 'beginner',
                    language: 'en',
                    duration: 0,
                    totalLessons: 0,
                    whatYouWillLearn: [],
                    requirements: [],
                    targetAudience: [],
                },
                seo: {
                    keywords: [],
                    slug: generateCourseSlug(course.title),
                },
                marketing: {
                    featured: false,
                    testimonials: [],
                },
            };
            const store = window.__courseFrameworkStore;
            if (store) {
                store.dispatch(coursePublishingSlice.actions.setPublishingInfo({
                    courseId: course.id,
                    info: publishingInfo
                }));
            }
        }
    };
}
// ============================================================================
// REACT HOOKS
// ============================================================================
import { useAppSelector, useAppDispatch } from '@course-framework/core/store';
export function useCoursePublishing() {
    const dispatch = useAppDispatch();
    const { publishingInfo, reviews, marketplaceEntries, loading, error } = useAppSelector((state) => state.coursePublishing || initialState);
    return {
        publishingInfo,
        reviews,
        marketplaceEntries,
        loading,
        error,
        // Actions
        submitForReview: (courseId, publishingInfo) => dispatch(submitForReview({ courseId, publishingInfo })),
        publishCourse: (courseId, publishingInfo) => dispatch(publishCourse({ courseId, publishingInfo })),
        unpublishCourse: (courseId) => dispatch(unpublishCourse(courseId)),
        reviewCourse: (courseId, review) => dispatch(reviewCourse({ courseId, review })),
        updateMarketplaceEntry: (courseId, updates) => dispatch(updateMarketplaceEntry({ courseId, updates })),
        // State management
        setPublishingInfo: (courseId, info) => dispatch(coursePublishingSlice.actions.setPublishingInfo({ courseId, info })),
        updatePublishingInfo: (courseId, updates) => dispatch(coursePublishingSlice.actions.updatePublishingInfo({ courseId, updates })),
        // Helpers
        getCoursePublishingInfo: (courseId) => publishingInfo[courseId],
        getCourseReviews: (courseId) => reviews[courseId] || [],
        getMarketplaceEntry: (courseId) => marketplaceEntries[courseId],
    };
}
export const coursePublishingActions = coursePublishingSlice.actions;
export default coursePublishingSlice.reducer;
