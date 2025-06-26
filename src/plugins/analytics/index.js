import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventBus } from '@course-framework/core/event-bus';
const initialState = {
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
export const initializeAnalytics = createAsyncThunk('analytics/initialize', async (config) => {
    const initializedProviders = [];
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
    window.__analyticsProviders = initializedProviders;
    return { config, providers: initializedProviders };
});
export const trackEvent = createAsyncThunk('analytics/trackEvent', async ({ name, properties = {}, userId }) => {
    const providers = window.__analyticsProviders || [];
    const event = {
        id: `event-${Date.now()}-${Math.random()}`,
        name,
        properties,
        userId,
        timestamp: new Date(),
        provider: 'all',
        sent: false,
    };
    // Send to all initialized providers
    const results = await Promise.allSettled(providers.map(async ({ provider, instance }) => {
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
    }));
    return { event, results };
});
export const identifyUser = createAsyncThunk('analytics/identifyUser', async ({ userId, properties }) => {
    const providers = window.__analyticsProviders || [];
    await Promise.allSettled(providers.map(async ({ provider, instance }) => {
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
    }));
    return { userId, properties };
});
export const trackPageView = createAsyncThunk('analytics/trackPageView', async ({ path, title }) => {
    const providers = window.__analyticsProviders || [];
    await Promise.allSettled(providers.map(async ({ provider, instance }) => {
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
    }));
    return { path, title };
});
// ============================================================================
// SLICE DEFINITION
// ============================================================================
const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        setConfig: (state, action) => {
            state.config = action.payload;
        },
        addEvent: (state, action) => {
            state.events.push(action.payload);
            // Keep only last 1000 events
            if (state.events.length > 1000) {
                state.events = state.events.slice(-1000);
            }
        },
        setUserAnalytics: (state, action) => {
            state.userAnalytics[action.payload.userId] = action.payload;
        },
        setCourseAnalytics: (state, action) => {
            state.courseAnalytics[action.payload.courseId] = action.payload;
        },
        setTracking: (state, action) => {
            state.isTracking = action.payload;
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
async function initializeGoogleAnalytics(config) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.trackingId}`;
    document.head.appendChild(script);
    return new Promise((resolve) => {
        script.onload = () => {
            window.dataLayer = window.dataLayer || [];
            function gtag(...args) {
                window.dataLayer.push(arguments);
            }
            gtag('js', new Date());
            gtag('config', config.trackingId);
            resolve({ gtag, trackingId: config.trackingId });
        };
    });
}
async function initializeMixpanel(config) {
    console.warn('Mixpanel integration not available in this build.');
    return null;
}
async function initializePostHog(config) {
    console.warn('PostHog integration not available in this build.');
    return null;
}
async function initializeAmplitude(config) {
    console.warn('Amplitude integration not available in this build.');
    return null;
}
// ============================================================================
// PLUGIN FACTORY
// ============================================================================
export function createAnalyticsPlugin(config) {
    return {
        id: 'analytics-tracking',
        name: 'Analytics & Tracking',
        version: '1.0.0',
        initialize: async () => {
            const store = window.__courseFrameworkStore;
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
            track: (eventName, properties) => {
                const store = window.__courseFrameworkStore;
                if (store) {
                    store.dispatch(trackEvent({ name: eventName, properties }));
                }
            },
            identify: (userId, properties) => {
                const store = window.__courseFrameworkStore;
                if (store) {
                    store.dispatch(identifyUser({ userId, properties }));
                }
            },
            pageView: (path, title) => {
                const store = window.__courseFrameworkStore;
                if (store) {
                    store.dispatch(trackPageView({ path, title }));
                }
            },
            // Course-specific tracking
            trackCourseStart: (courseId, userId) => {
                const store = window.__courseFrameworkStore;
                if (store) {
                    store.dispatch(trackEvent({
                        name: 'course_started',
                        properties: { courseId, userId }
                    }));
                }
            },
            trackLessonComplete: (courseId, lessonId, userId) => {
                const store = window.__courseFrameworkStore;
                if (store) {
                    store.dispatch(trackEvent({
                        name: 'lesson_completed',
                        properties: { courseId, lessonId, userId }
                    }));
                }
            },
            trackCourseComplete: (courseId, userId, completionTime) => {
                const store = window.__courseFrameworkStore;
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
                const store = window.__courseFrameworkStore;
                if (store) {
                    store.dispatch(trackEvent({
                        name: 'course_created',
                        properties: { courseId: course.id, title: course.title }
                    }));
                }
            });
            eventBus.on('user:login', (user) => {
                const store = window.__courseFrameworkStore;
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
    const { config, isInitialized, isTracking, events, userAnalytics, courseAnalytics, loading, error } = useAppSelector((state) => state.analytics || initialState);
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
        track: (name, properties) => dispatch(trackEvent({ name, properties })),
        identify: (userId, properties) => dispatch(identifyUser({ userId, properties })),
        pageView: (path, title) => dispatch(trackPageView({ path, title })),
        // Course tracking
        trackCourseStart: (courseId, userId) => dispatch(trackEvent({
            name: 'course_started',
            properties: { courseId, userId }
        })),
        trackLessonComplete: (courseId, lessonId, userId) => dispatch(trackEvent({
            name: 'lesson_completed',
            properties: { courseId, lessonId, userId }
        })),
        trackCourseComplete: (courseId, userId, completionTime) => dispatch(trackEvent({
            name: 'course_completed',
            properties: { courseId, userId, completionTime }
        })),
        // Analytics data
        getUserAnalytics: (userId) => userAnalytics[userId],
        getCourseAnalytics: (courseId) => courseAnalytics[courseId],
    };
}
export const analyticsActions = analyticsSlice.actions;
export default analyticsSlice.reducer;
