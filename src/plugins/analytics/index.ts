import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventBus } from '@course-framework/core/event-bus';

// ============================================================================
// ANALYTICS PLUGIN
// ============================================================================

export interface AnalyticsConfig {
  providers: Array<'google-analytics' | 'mixpanel' | 'posthog' | 'amplitude' | 'custom'>;
  googleAnalytics?: {
    trackingId: string;
    gtag?: boolean;
    sendPageView?: boolean;
  };
  mixpanel?: {
    token: string;
    apiSecret?: string;
  };
  posthog?: {
    apiKey: string;
    host?: string;
  };
  amplitude?: {
    apiKey: string;
  };
  custom?: {
    endpoint: string;
    apiKey?: string;
    headers?: Record<string, string>;
  };
  enabledEvents: string[];
  userProperties: string[];
  courseProperties: string[];
}

export interface AnalyticsEvent {
  id: string;
  name: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: Date;
  provider: string;
  sent: boolean;
}

export interface UserAnalytics {
  userId: string;
  totalEvents: number;
  coursesStarted: number;
  coursesCompleted: number;
  totalTimeSpent: number;
  averageSessionDuration: number;
  lastActivity: Date;
  deviceInfo: {
    browser?: string;
    os?: string;
    device?: string;
  };
  locationInfo: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

export interface CourseAnalytics {
  courseId: string;
  totalEnrollments: number;
  totalCompletions: number;
  averageCompletionTime: number;
  averageRating: number;
  dropOffPoints: Array<{
    lessonId: string;
    dropOffRate: number;
  }>;
  engagementMetrics: {
    averageTimePerLesson: number;
    totalInteractions: number;
    commentsCount: number;
    questionsCount: number;
  };
}

// ============================================================================
// REDUX SLICE
// ============================================================================

interface AnalyticsState {
  config: AnalyticsConfig | null;
  events: AnalyticsEvent[];
  userAnalytics: Record<string, UserAnalytics>;
  courseAnalytics: Record<string, CourseAnalytics>;
  isInitialized: boolean;
  isTracking: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  config: null,
  events: [],
  userAnalytics: {},
  courseAnalytics: {},
  isInitialized: false,
  isTracking: false,
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const initializeAnalytics = createAsyncThunk(
  'analytics/initialize',
  async (config: AnalyticsConfig) => {
    const initializedProviders: any[] = [];
    
    // Initialize Google Analytics
    if (config.providers.includes('google-analytics') && config.googleAnalytics) {
      const ga = await initializeGoogleAnalytics(config.googleAnalytics);
      initializedProviders.push({ provider: 'google-analytics', instance: ga });
    }
    
    // Initialize Mixpanel
    if (config.providers.includes('mixpanel') && config.mixpanel) {
      const mixpanel = await initializeMixpanel(config.mixpanel);
      if (mixpanel) {
        initializedProviders.push({ provider: 'mixpanel', instance: mixpanel });
      }
    }
    
    // Initialize PostHog
    if (config.providers.includes('posthog') && config.posthog) {
      const posthog = await initializePostHog(config.posthog);
      if (posthog) {
        initializedProviders.push({ provider: 'posthog', instance: posthog });
      }
    }
    
    // Initialize Amplitude
    if (config.providers.includes('amplitude') && config.amplitude) {
      const amplitude = await initializeAmplitude(config.amplitude);
      if (amplitude) {
        initializedProviders.push({ provider: 'amplitude', instance: amplitude });
      }
    }
    
    // Store providers globally
    (window as any).__analyticsProviders = initializedProviders;
    
    return { config, providers: initializedProviders };
  }
);

export const trackEvent = createAsyncThunk(
  'analytics/trackEvent',
  async ({ name, properties = {}, userId }: { name: string; properties?: Record<string, any>; userId?: string }) => {
    const providers = (window as any).__analyticsProviders || [];
    const event: AnalyticsEvent = {
      id: `event-${Date.now()}-${Math.random()}`,
      name,
      properties,
      userId,
      timestamp: new Date(),
      provider: 'all',
      sent: false,
    };
    
    // Send to all initialized providers
    const results = await Promise.allSettled(
      providers.map(async ({ provider, instance }: any) => {
        switch (provider) {
          case 'google-analytics':
            if (instance.gtag) {
              instance.gtag('event', name, properties);
            }
            break;
          case 'mixpanel':
            instance.track(name, properties);
            break;
          case 'posthog':
            instance.capture(name, properties);
            break;
          case 'amplitude':
            instance.logEvent(name, properties);
            break;
        }
        return { provider, success: true };
      })
    );
    
    return { event, results };
  }
);

export const identifyUser = createAsyncThunk(
  'analytics/identifyUser',
  async ({ userId, properties }: { userId: string; properties: Record<string, any> }) => {
    const providers = (window as any).__analyticsProviders || [];
    
    await Promise.allSettled(
      providers.map(async ({ provider, instance }: any) => {
        switch (provider) {
          case 'google-analytics':
            if (instance.gtag) {
              instance.gtag('config', instance.trackingId, {
                user_id: userId,
                custom_map: properties
              });
            }
            break;
          case 'mixpanel':
            instance.identify(userId);
            instance.people.set(properties);
            break;
          case 'posthog':
            instance.identify(userId, properties);
            break;
          case 'amplitude':
            instance.setUserId(userId);
            instance.setUserProperties(properties);
            break;
        }
      })
    );
    
    return { userId, properties };
  }
);

export const trackPageView = createAsyncThunk(
  'analytics/trackPageView',
  async ({ path, title }: { path: string; title?: string }) => {
    const providers = (window as any).__analyticsProviders || [];
    
    await Promise.allSettled(
      providers.map(async ({ provider, instance }: any) => {
        switch (provider) {
          case 'google-analytics':
            if (instance.gtag) {
              instance.gtag('config', instance.trackingId, {
                page_path: path,
                page_title: title
              });
            }
            break;
          case 'mixpanel':
            instance.track('Page View', { path, title });
            break;
          case 'posthog':
            instance.capture('$pageview', { $current_url: path, $title: title });
            break;
          case 'amplitude':
            instance.logEvent('Page View', { path, title });
            break;
        }
      })
    );
    
    return { path, title };
  }
);

// ============================================================================
// SLICE DEFINITION
// ============================================================================

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<AnalyticsConfig>) => {
      state.config = action.payload;
    },
    addEvent: (state, action: PayloadAction<AnalyticsEvent>) => {
      state.events.push(action.payload);
      
      // Keep only last 1000 events
      if (state.events.length > 1000) {
        state.events = state.events.slice(-1000);
      }
    },
    setUserAnalytics: (state, action: PayloadAction<UserAnalytics>) => {
      state.userAnalytics[action.payload.userId] = action.payload;
    },
    setCourseAnalytics: (state, action: PayloadAction<CourseAnalytics>) => {
      state.courseAnalytics[action.payload.courseId] = action.payload;
    },
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
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
      .addCase(initializeAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.isTracking = true;
        state.config = action.payload.config;
      })
      .addCase(initializeAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to initialize analytics';
      })
      .addCase(trackEvent.fulfilled, (state, action) => {
        state.events.push(action.payload.event);
      });
  },
});

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

async function initializeGoogleAnalytics(config: any) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${config.trackingId}`;
  document.head.appendChild(script);
  
  return new Promise((resolve) => {
    script.onload = () => {
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('config', config.trackingId);
      
      resolve({ gtag, trackingId: config.trackingId });
    };
  });
}

async function initializeMixpanel(config: any) {
  console.warn('Mixpanel integration not available in this build.');
  return null;
}

async function initializePostHog(config: any) {
  console.warn('PostHog integration not available in this build.');
  return null;
}

async function initializeAmplitude(config: any) {
  console.warn('Amplitude integration not available in this build.');
  return null;
}

// ============================================================================
// PLUGIN FACTORY
// ============================================================================

export function createAnalyticsPlugin(config: AnalyticsConfig) {
  return {
    id: 'analytics-tracking',
    name: 'Analytics & Tracking',
    version: '1.0.0',
    
    initialize: async () => {
      const store = (window as any).__courseFrameworkStore;
      if (store) {
        await store.dispatch(initializeAnalytics(config));
      }
    },
    
    config: {
      analytics: config,
    },
    
    slice: analyticsSlice,
    
    // Event tracking utilities
    utils: {
      track: (eventName: string, properties?: Record<string, any>) => {
        const store = (window as any).__courseFrameworkStore;
        if (store) {
          store.dispatch(trackEvent({ name: eventName, properties }));
        }
      },
      
      identify: (userId: string, properties: Record<string, any>) => {
        const store = (window as any).__courseFrameworkStore;
        if (store) {
          store.dispatch(identifyUser({ userId, properties }));
        }
      },
      
      pageView: (path: string, title?: string) => {
        const store = (window as any).__courseFrameworkStore;
        if (store) {
          store.dispatch(trackPageView({ path, title }));
        }
      },
      
      // Course-specific tracking
      trackCourseStart: (courseId: string, userId: string) => {
        const store = (window as any).__courseFrameworkStore;
        if (store) {
          store.dispatch(trackEvent({
            name: 'course_started',
            properties: { courseId, userId }
          }));
        }
      },
      
      trackLessonComplete: (courseId: string, lessonId: string, userId: string) => {
        const store = (window as any).__courseFrameworkStore;
        if (store) {
          store.dispatch(trackEvent({
            name: 'lesson_completed',
            properties: { courseId, lessonId, userId }
          }));
        }
      },
      
      trackCourseComplete: (courseId: string, userId: string, completionTime: number) => {
        const store = (window as any).__courseFrameworkStore;
        if (store) {
          store.dispatch(trackEvent({
            name: 'course_completed',
            properties: { courseId, userId, completionTime }
          }));
        }
      }
    },
    
    // Auto-track course framework events
    onInitialized: () => {
      // Listen to course events
      eventBus.on('course:created', (course) => {
        const store = (window as any).__courseFrameworkStore;
        if (store) {
          store.dispatch(trackEvent({
            name: 'course_created',
            properties: { courseId: course.id, title: course.title }
          }));
        }
      });
      
      eventBus.on('user:login', (user) => {
        const store = (window as any).__courseFrameworkStore;
        if (store) {
          store.dispatch(identifyUser({
            userId: user.id,
            properties: {
              email: user.email,
              name: user.name,
              role: user.role
            }
          }));
        }
      });
    }
  };
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useAppSelector, useAppDispatch } from '@course-framework/core/store';

export function useAnalytics() {
  const dispatch = useAppDispatch();
  const { config, isInitialized, isTracking, events, userAnalytics, courseAnalytics, loading, error } = useAppSelector(
    (state: any) => state.analytics || initialState
  );
  
  return {
    config,
    isInitialized,
    isTracking,
    events,
    userAnalytics,
    courseAnalytics,
    loading,
    error,
    
    // Actions
    track: (name: string, properties?: Record<string, any>) => dispatch(trackEvent({ name, properties })),
    identify: (userId: string, properties: Record<string, any>) => dispatch(identifyUser({ userId, properties })),
    pageView: (path: string, title?: string) => dispatch(trackPageView({ path, title })),
    
    // Course tracking
    trackCourseStart: (courseId: string, userId: string) => dispatch(trackEvent({
      name: 'course_started',
      properties: { courseId, userId }
    })),
    trackLessonComplete: (courseId: string, lessonId: string, userId: string) => dispatch(trackEvent({
      name: 'lesson_completed',
      properties: { courseId, lessonId, userId }
    })),
    trackCourseComplete: (courseId: string, userId: string, completionTime: number) => dispatch(trackEvent({
      name: 'course_completed',
      properties: { courseId, userId, completionTime }
    })),
    
    // Analytics data
    getUserAnalytics: (userId: string) => userAnalytics[userId],
    getCourseAnalytics: (courseId: string) => courseAnalytics[courseId],
  };
}

export const analyticsActions = analyticsSlice.actions;
export default analyticsSlice.reducer;