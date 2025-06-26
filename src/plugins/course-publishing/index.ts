import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventBus } from '@core/event-bus';

// ============================================================================
// COURSE PUBLISHING PLUGIN
// ============================================================================

export type CourseStatus = 'draft' | 'review' | 'published' | 'archived' | 'rejected';
export type CourseVisibility = 'public' | 'unlisted' | 'private';
export type CoursePricing = 'free' | 'paid' | 'subscription';

export interface CoursePublishingInfo {
  courseId: string;
  status: CourseStatus;
  visibility: CourseVisibility;
  pricing: CoursePricing;
  price?: number;
  currency?: string;
  publishedAt?: Date;
  submittedForReviewAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  metadata: {
    title: string;
    description: string;
    shortDescription: string;
    thumbnailUrl?: string;
    previewVideoUrl?: string;
    category: string;
    subcategory?: string;
    tags: string[];
    level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
    language: string;
    duration: number; // in minutes
    totalLessons: number;
    whatYouWillLearn: string[];
    requirements: string[];
    targetAudience: string[];
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
    slug: string;
  };
  marketing: {
    featured: boolean;
    promotionalText?: string;
    discountPercentage?: number;
    discountValidUntil?: Date;
    testimonials: Array<{
      id: string;
      studentName: string;
      rating: number;
      text: string;
      date: Date;
    }>;
  };
}

export interface CourseReview {
  id: string;
  courseId: string;
  reviewerId: string;
  reviewerName: string;
  status: 'approved' | 'rejected' | 'needs_changes';
  feedback: string;
  checklist: {
    contentQuality: boolean;
    audioVideoQuality: boolean;
    courseCurriculum: boolean;
    instructorPresentation: boolean;
    technicalRequirements: boolean;
    communityGuidelines: boolean;
  };
  reviewedAt: Date;
}

export interface CourseMarketplaceEntry {
  courseId: string;
  publishingInfo: CoursePublishingInfo;
  statistics: {
    totalEnrollments: number;
    activeStudents: number;
    completionRate: number;
    averageRating: number;
    totalRatings: number;
    revenue: number;
    viewCount: number;
    lastActivityAt: Date;
  };
}

// ============================================================================
// REDUX SLICE
// ============================================================================

interface CoursePublishingState {
  publishingInfo: Record<string, CoursePublishingInfo>;
  reviews: Record<string, CourseReview[]>;
  marketplaceEntries: Record<string, CourseMarketplaceEntry>;
  loading: boolean;
  error: string | null;
}

const initialState: CoursePublishingState = {
  publishingInfo: {},
  reviews: {},
  marketplaceEntries: {},
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const initializeCoursePublishing = createAsyncThunk(
  'coursePublishing/initialize',
  async (courseId: string) => {
    const response = await fetch(`/api/courses/${courseId}/publishing`);
    if (!response.ok) {
      throw new Error('Failed to load course publishing info');
    }
    return response.json();
  }
);

export const submitForReview = createAsyncThunk(
  'coursePublishing/submitForReview',
  async ({ courseId, publishingInfo }: { courseId: string; publishingInfo: Partial<CoursePublishingInfo> }) => {
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
  }
);

export const publishCourse = createAsyncThunk(
  'coursePublishing/publishCourse',
  async ({ courseId, publishingInfo }: { courseId: string; publishingInfo: CoursePublishingInfo }) => {
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
  }
);

export const unpublishCourse = createAsyncThunk(
  'coursePublishing/unpublishCourse',
  async (courseId: string) => {
    const response = await fetch(`/api/courses/${courseId}/unpublish`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to unpublish course');
    }
    
    const result = await response.json();
    eventBus.emit('course:unpublished', { courseId });
    return result;
  }
);

export const reviewCourse = createAsyncThunk(
  'coursePublishing/reviewCourse',
  async ({ courseId, review }: { courseId: string; review: Omit<CourseReview, 'id' | 'reviewedAt'> }) => {
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
  }
);

export const updateMarketplaceEntry = createAsyncThunk(
  'coursePublishing/updateMarketplaceEntry',
  async ({ courseId, updates }: { courseId: string; updates: Partial<CourseMarketplaceEntry> }) => {
    const response = await fetch(`/api/marketplace/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update marketplace entry');
    }
    
    return response.json();
  }
);

// ============================================================================
// SLICE DEFINITION
// ============================================================================

const coursePublishingSlice = createSlice({
  name: 'coursePublishing',
  initialState,
  reducers: {
    setPublishingInfo: (state, action: PayloadAction<{ courseId: string; info: CoursePublishingInfo }>) => {
      state.publishingInfo[action.payload.courseId] = action.payload.info;
    },
    updatePublishingInfo: (state, action: PayloadAction<{ courseId: string; updates: Partial<CoursePublishingInfo> }>) => {
      const { courseId, updates } = action.payload;
      if (state.publishingInfo[courseId]) {
        state.publishingInfo[courseId] = { ...state.publishingInfo[courseId], ...updates };
      }
    },
    addReview: (state, action: PayloadAction<{ courseId: string; review: CourseReview }>) => {
      const { courseId, review } = action.payload;
      if (!state.reviews[courseId]) {
        state.reviews[courseId] = [];
      }
      state.reviews[courseId].push(review);
    },
    setMarketplaceEntry: (state, action: PayloadAction<{ courseId: string; entry: CourseMarketplaceEntry }>) => {
      state.marketplaceEntries[action.payload.courseId] = action.payload.entry;
    },
    updateMarketplaceStats: (state, action: PayloadAction<{ courseId: string; stats: Partial<CourseMarketplaceEntry['statistics']> }>) => {
      const { courseId, stats } = action.payload;
      if (state.marketplaceEntries[courseId]) {
        state.marketplaceEntries[courseId].statistics = {
          ...state.marketplaceEntries[courseId].statistics,
          ...stats
        };
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

export function validateCourseForPublishing(course: any, publishingInfo: Partial<CoursePublishingInfo>): string[] {
  const errors: string[] = [];
  
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

export function generateCourseSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function calculateCourseDuration(lessons: any[]): number {
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
      canSubmitForReview: (status: CourseStatus) => status === 'draft' || status === 'rejected',
      canPublish: (status: CourseStatus) => status === 'review',
      canUnpublish: (status: CourseStatus) => status === 'published',
      
      // Publishing workflow helpers
      getNextStatus: (currentStatus: CourseStatus, action: string): CourseStatus => {
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
    onCourseCreated: (course: any) => {
      // Initialize publishing info for new course
      const publishingInfo: CoursePublishingInfo = {
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
      
      const store = (window as any).__courseFrameworkStore;
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
  const { publishingInfo, reviews, marketplaceEntries, loading, error } = useAppSelector(
    (state: any) => state.coursePublishing || initialState
  );
  
  return {
    publishingInfo,
    reviews,
    marketplaceEntries,
    loading,
    error,
    
    // Actions
    submitForReview: (courseId: string, publishingInfo: Partial<CoursePublishingInfo>) =>
      dispatch(submitForReview({ courseId, publishingInfo })),
    publishCourse: (courseId: string, publishingInfo: CoursePublishingInfo) =>
      dispatch(publishCourse({ courseId, publishingInfo })),
    unpublishCourse: (courseId: string) => dispatch(unpublishCourse(courseId)),
    reviewCourse: (courseId: string, review: Omit<CourseReview, 'id' | 'reviewedAt'>) =>
      dispatch(reviewCourse({ courseId, review })),
    updateMarketplaceEntry: (courseId: string, updates: Partial<CourseMarketplaceEntry>) =>
      dispatch(updateMarketplaceEntry({ courseId, updates })),
    
    // State management
    setPublishingInfo: (courseId: string, info: CoursePublishingInfo) =>
      dispatch(coursePublishingSlice.actions.setPublishingInfo({ courseId, info })),
    updatePublishingInfo: (courseId: string, updates: Partial<CoursePublishingInfo>) =>
      dispatch(coursePublishingSlice.actions.updatePublishingInfo({ courseId, updates })),
    
    // Helpers
    getCoursePublishingInfo: (courseId: string) => publishingInfo[courseId],
    getCourseReviews: (courseId: string) => reviews[courseId] || [],
    getMarketplaceEntry: (courseId: string) => marketplaceEntries[courseId],
  };
}

export const coursePublishingActions = coursePublishingSlice.actions;
export default coursePublishingSlice.reducer;