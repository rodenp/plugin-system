import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventBus } from '@core/event-bus';

// ============================================================================
// COURSE DATA PLUGIN
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

// ============================================================================
// REDUX SLICE
// ============================================================================

interface CourseDataState {
  courses: Record<string, Course>;
  lessons: Record<string, Lesson>;
  enrollments: Record<string, CourseEnrollment>;
  studentProgress: Record<string, StudentProgress[]>; // keyed by userId
  currentCourse: Course | null;
  currentLesson: Lesson | null;
  loading: boolean;
  error: string | null;
  filters: {
    category?: string;
    level?: string;
    instructor?: string;
    priceRange?: [number, number];
    rating?: number;
    language?: string;
  };
  sortBy: 'title' | 'price' | 'rating' | 'created' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

const initialState: CourseDataState = {
  courses: {},
  lessons: {},
  enrollments: {},
  studentProgress: {},
  currentCourse: null,
  currentLesson: null,
  loading: false,
  error: null,
  filters: {},
  sortBy: 'created',
  sortOrder: 'desc',
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const loadCourses = createAsyncThunk(
  'courseData/loadCourses',
  async ({ userId, includeEnrollments = false }: { userId?: string; includeEnrollments?: boolean }) => {
    const response = await fetch(`/api/courses${userId ? `?userId=${userId}` : ''}`);
    if (!response.ok) {
      throw new Error('Failed to load courses');
    }
    
    const courses = await response.json();
    
    let enrollments = {};
    if (includeEnrollments && userId) {
      const enrollmentResponse = await fetch(`/api/users/${userId}/enrollments`);
      if (enrollmentResponse.ok) {
        enrollments = await enrollmentResponse.json();
      }
    }
    
    return { courses, enrollments };
  }
);

export const loadCourse = createAsyncThunk(
  'courseData/loadCourse',
  async ({ courseId, userId }: { courseId: string; userId?: string }) => {
    const [courseResponse, lessonsResponse] = await Promise.all([
      fetch(`/api/courses/${courseId}`),
      fetch(`/api/courses/${courseId}/lessons`)
    ]);
    
    if (!courseResponse.ok) {
      throw new Error('Failed to load course');
    }
    
    const course = await courseResponse.json();
    const lessons = lessonsResponse.ok ? await lessonsResponse.json() : [];
    
    let progress = null;
    if (userId) {
      const progressResponse = await fetch(`/api/courses/${courseId}/progress/${userId}`);
      if (progressResponse.ok) {
        progress = await progressResponse.json();
      }
    }
    
    return { course, lessons, progress };
  }
);

export const createCourse = createAsyncThunk(
  'courseData/createCourse',
  async (courseData: Partial<Course>) => {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create course');
    }
    
    const course = await response.json();
    eventBus.emit('course:created', course);
    return course;
  }
);

export const updateCourse = createAsyncThunk(
  'courseData/updateCourse',
  async ({ courseId, updates }: { courseId: string; updates: Partial<Course> }) => {
    const response = await fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update course');
    }
    
    const course = await response.json();
    eventBus.emit('course:updated', course);
    return course;
  }
);

export const deleteCourse = createAsyncThunk(
  'courseData/deleteCourse',
  async (courseId: string) => {
    const response = await fetch(`/api/courses/${courseId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete course');
    }
    
    eventBus.emit('course:deleted', { courseId });
    return { courseId };
  }
);

export const enrollInCourse = createAsyncThunk(
  'courseData/enrollInCourse',
  async ({ courseId, userId, paymentId }: { courseId: string; userId: string; paymentId?: string }) => {
    const response = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, userId, paymentId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to enroll in course');
    }
    
    const enrollment = await response.json();
    eventBus.emit('course:enrolled', enrollment);
    return enrollment;
  }
);

export const updateProgress = createAsyncThunk(
  'courseData/updateProgress',
  async ({ 
    courseId, 
    userId, 
    lessonId, 
    completed = false,
    timeSpent = 0,
    score 
  }: {
    courseId: string;
    userId: string;
    lessonId?: string;
    completed?: boolean;
    timeSpent?: number;
    score?: number;
  }) => {
    const response = await fetch(`/api/courses/${courseId}/progress/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, completed, timeSpent, score }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update progress');
    }
    
    const progress = await response.json();
    eventBus.emit('progress:updated', progress);
    return progress;
  }
);

export const createLesson = createAsyncThunk(
  'courseData/createLesson',
  async (lessonData: Partial<Lesson>) => {
    const response = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lessonData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create lesson');
    }
    
    const lesson = await response.json();
    eventBus.emit('lesson:created', lesson);
    return lesson;
  }
);

export const updateLesson = createAsyncThunk(
  'courseData/updateLesson',
  async ({ lessonId, updates }: { lessonId: string; updates: Partial<Lesson> }) => {
    const response = await fetch(`/api/lessons/${lessonId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update lesson');
    }
    
    const lesson = await response.json();
    eventBus.emit('lesson:updated', lesson);
    return lesson;
  }
);

// ============================================================================
// SLICE DEFINITION
// ============================================================================

const courseDataSlice = createSlice({
  name: 'courseData',
  initialState,
  reducers: {
    setCourse: (state, action: PayloadAction<Course>) => {
      state.courses[action.payload.id] = action.payload;
    },
    setCurrentCourse: (state, action: PayloadAction<Course | null>) => {
      state.currentCourse = action.payload;
    },
    setCurrentLesson: (state, action: PayloadAction<Lesson | null>) => {
      state.currentLesson = action.payload;
    },
    addLesson: (state, action: PayloadAction<Lesson>) => {
      state.lessons[action.payload.id] = action.payload;
      
      // Add lesson to course
      const course = state.courses[action.payload.courseId];
      if (course) {
        const existingIndex = course.lessons.findIndex(l => l.id === action.payload.id);
        if (existingIndex === -1) {
          course.lessons.push(action.payload);
          course.lessons.sort((a, b) => a.order - b.order);
        }
      }
    },
    updateLesson: (state, action: PayloadAction<Lesson>) => {
      state.lessons[action.payload.id] = action.payload;
      
      // Update lesson in course
      const course = state.courses[action.payload.courseId];
      if (course) {
        const index = course.lessons.findIndex(l => l.id === action.payload.id);
        if (index !== -1) {
          course.lessons[index] = action.payload;
        }
      }
    },
    removeLesson: (state, action: PayloadAction<{ lessonId: string; courseId: string }>) => {
      delete state.lessons[action.payload.lessonId];
      
      // Remove lesson from course
      const course = state.courses[action.payload.courseId];
      if (course) {
        course.lessons = course.lessons.filter(l => l.id !== action.payload.lessonId);
      }
    },
    addEnrollment: (state, action: PayloadAction<CourseEnrollment>) => {
      state.enrollments[action.payload.id] = action.payload;
    },
    updateEnrollment: (state, action: PayloadAction<CourseEnrollment>) => {
      state.enrollments[action.payload.id] = action.payload;
    },
    setProgress: (state, action: PayloadAction<StudentProgress>) => {
      const userId = action.payload.userId;
      if (!state.studentProgress[userId]) {
        state.studentProgress[userId] = [];
      }
      
      const existingIndex = state.studentProgress[userId].findIndex(
        p => p.courseId === action.payload.courseId
      );
      
      if (existingIndex !== -1) {
        state.studentProgress[userId][existingIndex] = action.payload;
      } else {
        state.studentProgress[userId].push(action.payload);
      }
    },
    setFilters: (state, action: PayloadAction<Partial<CourseDataState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSorting: (state, action: PayloadAction<{ sortBy: CourseDataState['sortBy']; sortOrder: CourseDataState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    clearFilters: (state) => {
      state.filters = {};
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
      .addCase(loadCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCourses.fulfilled, (state, action) => {
        state.loading = false;
        
        // Store courses
        action.payload.courses.forEach((course: Course) => {
          state.courses[course.id] = course;
        });
        
        // Store enrollments
        Object.entries(action.payload.enrollments).forEach(([id, enrollment]: [string, any]) => {
          state.enrollments[id] = enrollment;
        });
      })
      .addCase(loadCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load courses';
      })
      .addCase(loadCourse.fulfilled, (state, action) => {
        const { course, lessons, progress } = action.payload;
        
        state.courses[course.id] = course;
        state.currentCourse = course;
        
        lessons.forEach((lesson: Lesson) => {
          state.lessons[lesson.id] = lesson;
        });
        
        if (progress) {
          const userId = progress.userId;
          if (!state.studentProgress[userId]) {
            state.studentProgress[userId] = [];
          }
          
          const existingIndex = state.studentProgress[userId].findIndex(
            p => p.courseId === course.id
          );
          
          if (existingIndex !== -1) {
            state.studentProgress[userId][existingIndex] = progress;
          } else {
            state.studentProgress[userId].push(progress);
          }
        }
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.courses[action.payload.id] = action.payload;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.courses[action.payload.id] = action.payload;
        if (state.currentCourse?.id === action.payload.id) {
          state.currentCourse = action.payload;
        }
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        delete state.courses[action.payload.courseId];
        if (state.currentCourse?.id === action.payload.courseId) {
          state.currentCourse = null;
        }
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        state.enrollments[action.payload.id] = action.payload;
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        const progress = action.payload;
        const userId = progress.userId;
        
        if (!state.studentProgress[userId]) {
          state.studentProgress[userId] = [];
        }
        
        const existingIndex = state.studentProgress[userId].findIndex(
          p => p.courseId === progress.courseId
        );
        
        if (existingIndex !== -1) {
          state.studentProgress[userId][existingIndex] = progress;
        } else {
          state.studentProgress[userId].push(progress);
        }
      })
      .addCase(createLesson.fulfilled, (state, action) => {
        const lesson = action.payload;
        state.lessons[lesson.id] = lesson;
        
        // Add to course
        const course = state.courses[lesson.courseId];
        if (course) {
          course.lessons.push(lesson);
          course.lessons.sort((a, b) => a.order - b.order);
        }
      })
      .addCase(updateLesson.fulfilled, (state, action) => {
        const lesson = action.payload;
        state.lessons[lesson.id] = lesson;
        
        // Update in course
        const course = state.courses[lesson.courseId];
        if (course) {
          const index = course.lessons.findIndex(l => l.id === lesson.id);
          if (index !== -1) {
            course.lessons[index] = lesson;
          }
        }
        
        if (state.currentLesson?.id === lesson.id) {
          state.currentLesson = lesson;
        }
      });
  },
});

// ============================================================================
// PLUGIN FACTORY
// ============================================================================

export function createCourseDataPlugin() {
  return {
    id: 'course-data',
    name: 'Course Data Management',
    version: '1.0.0',
    
    initialize: async () => {
      // Plugin-specific initialization if needed
    },
    
    slice: courseDataSlice,
    
    utils: {
      // Course utilities
      getFilteredCourses: (courses: Course[], filters: any, sortBy: string, sortOrder: string) => {
        let filtered = Object.values(courses);
        
        // Apply filters
        if (filters.category) {
          filtered = filtered.filter(course => course.category === filters.category);
        }
        if (filters.level) {
          filtered = filtered.filter(course => course.level === filters.level);
        }
        if (filters.instructor) {
          filtered = filtered.filter(course => course.instructorId === filters.instructor);
        }
        if (filters.priceRange) {
          filtered = filtered.filter(course => 
            course.price >= filters.priceRange[0] && course.price <= filters.priceRange[1]
          );
        }
        if (filters.rating) {
          filtered = filtered.filter(course => course.analytics.averageRating >= filters.rating);
        }
        if (filters.language) {
          filtered = filtered.filter(course => course.metadata.language === filters.language);
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
          let aValue, bValue;
          
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
      },
      
      // Progress utilities
      calculateProgress: (lessons: Lesson[], completedLessons: string[]) => {
        if (lessons.length === 0) return 0;
        return (completedLessons.length / lessons.length) * 100;
      },
      
      // Time utilities
      formatDuration: (minutes: number) => {
        if (minutes < 60) {
          return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
      },
      
      // Validation utilities
      validateCourse: (course: Partial<Course>) => {
        const errors: string[] = [];
        
        if (!course.title || course.title.trim().length === 0) {
          errors.push('Course title is required');
        }
        if (!course.description || course.description.trim().length === 0) {
          errors.push('Course description is required');
        }
        if (!course.category) {
          errors.push('Course category is required');
        }
        if (course.price === undefined || course.price < 0) {
          errors.push('Valid course price is required');
        }
        
        return errors;
      }
    },
    
    // Event handlers
    onCourseCreated: (course: Course) => {
      eventBus.emit('analytics:track', {
        event: 'course_created',
        properties: {
          courseId: course.id,
          title: course.title,
          category: course.category,
          price: course.price
        }
      });
    },
    
    onLessonCompleted: (userId: string, courseId: string, lessonId: string) => {
      eventBus.emit('analytics:track', {
        event: 'lesson_completed',
        properties: { userId, courseId, lessonId }
      });
    }
  };
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useAppSelector, useAppDispatch } from '@course-framework/core/store';

export function useCourseData() {
  const dispatch = useAppDispatch();
  const { 
    courses, 
    lessons, 
    enrollments, 
    studentProgress, 
    currentCourse, 
    currentLesson,
    filters,
    sortBy,
    sortOrder,
    loading, 
    error 
  } = useAppSelector((state: any) => state.courseData || initialState);
  
  return {
    courses,
    lessons,
    enrollments,
    studentProgress,
    currentCourse,
    currentLesson,
    filters,
    sortBy,
    sortOrder,
    loading,
    error,
    
    // Actions
    loadCourses: (userId?: string, includeEnrollments?: boolean) => 
      dispatch(loadCourses({ userId, includeEnrollments })),
    loadCourse: (courseId: string, userId?: string) => 
      dispatch(loadCourse({ courseId, userId })),
    createCourse: (courseData: Partial<Course>) => dispatch(createCourse(courseData)),
    updateCourse: (courseId: string, updates: Partial<Course>) => 
      dispatch(updateCourse({ courseId, updates })),
    deleteCourse: (courseId: string) => dispatch(deleteCourse(courseId)),
    enrollInCourse: (courseId: string, userId: string, paymentId?: string) =>
      dispatch(enrollInCourse({ courseId, userId, paymentId })),
    updateProgress: (courseId: string, userId: string, lessonId?: string, completed?: boolean, timeSpent?: number, score?: number) =>
      dispatch(updateProgress({ courseId, userId, lessonId, completed, timeSpent, score })),
    createLesson: (lessonData: Partial<Lesson>) => dispatch(createLesson(lessonData)),
    updateLesson: (lessonId: string, updates: Partial<Lesson>) =>
      dispatch(updateLesson({ lessonId, updates })),
    
    // State management
    setCurrentCourse: (course: Course | null) => dispatch(courseDataSlice.actions.setCurrentCourse(course)),
    setCurrentLesson: (lesson: Lesson | null) => dispatch(courseDataSlice.actions.setCurrentLesson(lesson)),
    setFilters: (filters: Partial<CourseDataState['filters']>) => dispatch(courseDataSlice.actions.setFilters(filters)),
    setSorting: (sortBy: CourseDataState['sortBy'], sortOrder: CourseDataState['sortOrder']) =>
      dispatch(courseDataSlice.actions.setSorting({ sortBy, sortOrder })),
    clearFilters: () => dispatch(courseDataSlice.actions.clearFilters()),
    
    // Computed values
    getCoursesByInstructor: (instructorId: string) => 
      Object.values(courses).filter(course => course.instructorId === instructorId),
    getEnrollmentsByCourse: (courseId: string) =>
      Object.values(enrollments).filter(enrollment => enrollment.courseId === courseId),
    getUserProgress: (userId: string, courseId: string) =>
      studentProgress[userId]?.find(progress => progress.courseId === courseId),
    getCourseLessons: (courseId: string) =>
      Object.values(lessons).filter(lesson => lesson.courseId === courseId).sort((a, b) => a.order - b.order),
  };
}

export const courseDataActions = courseDataSlice.actions;
export default courseDataSlice.reducer;