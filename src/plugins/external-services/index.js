import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
const initialState = {
    services: {},
    statuses: {},
    usage: {},
    webhookEvents: [],
    loading: false,
    error: null,
};
// ============================================================================
// ASYNC THUNKS
// ============================================================================
export const initializeServices = createAsyncThunk('externalServices/initialize', async (services) => {
    const initializedServices = {};
    for (const service of services) {
        try {
            const serviceInstance = await initializeService(service);
            initializedServices[service.id] = serviceInstance;
        }
        catch (error) {
            console.error(`Failed to initialize service ${service.id}:`, error);
        }
    }
    // Store globally
    window.__externalServices = initializedServices;
    return { services, initializedServices };
});
export const testServiceConnection = createAsyncThunk('externalServices/testConnection', async (serviceId) => {
    const services = window.__externalServices || {};
    const service = services[serviceId];
    if (!service) {
        throw new Error(`Service ${serviceId} not found`);
    }
    const startTime = Date.now();
    try {
        await service.healthCheck();
        const responseTime = Date.now() - startTime;
        return {
            serviceId,
            status: 'healthy',
            responseTime,
            lastChecked: new Date()
        };
    }
    catch (error) {
        return {
            serviceId,
            status: 'down',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date()
        };
    }
});
export const sendEmail = createAsyncThunk('externalServices/sendEmail', async ({ serviceId = 'email-service', to, subject, body, template, data }) => {
    const services = window.__externalServices || {};
    const emailService = services[serviceId];
    if (!emailService) {
        throw new Error(`Email service ${serviceId} not configured`);
    }
    const result = await emailService.sendEmail({
        to: Array.isArray(to) ? to : [to],
        subject,
        body,
        template,
        data
    });
    return { serviceId, result };
});
export const uploadFile = createAsyncThunk('externalServices/uploadFile', async ({ serviceId = 'storage-service', file, path, metadata }) => {
    const services = window.__externalServices || {};
    const storageService = services[serviceId];
    if (!storageService) {
        throw new Error(`Storage service ${serviceId} not configured`);
    }
    const result = await storageService.uploadFile(file, path, metadata);
    return { serviceId, result };
});
export const generateContent = createAsyncThunk('externalServices/generateContent', async ({ serviceId = 'ai-service', prompt, contentType = 'text', options = {} }) => {
    const services = window.__externalServices || {};
    const aiService = services[serviceId];
    if (!aiService) {
        throw new Error(`AI service ${serviceId} not configured`);
    }
    const result = await aiService.generateContent(prompt, contentType, options);
    return { serviceId, result };
});
// ============================================================================
// SLICE DEFINITION
// ============================================================================
const externalServicesSlice = createSlice({
    name: 'externalServices',
    initialState,
    reducers: {
        addService: (state, action) => {
            state.services[action.payload.id] = action.payload;
        },
        updateService: (state, action) => {
            state.services[action.payload.id] = action.payload;
        },
        removeService: (state, action) => {
            delete state.services[action.payload];
            delete state.statuses[action.payload];
            delete state.usage[action.payload];
        },
        setServiceStatus: (state, action) => {
            state.statuses[action.payload.serviceId] = action.payload;
        },
        addUsageRecord: (state, action) => {
            const serviceId = action.payload.serviceId;
            if (!state.usage[serviceId]) {
                state.usage[serviceId] = [];
            }
            state.usage[serviceId].push(action.payload);
            // Keep only last 100 records per service
            if (state.usage[serviceId].length > 100) {
                state.usage[serviceId] = state.usage[serviceId].slice(-100);
            }
        },
        addWebhookEvent: (state, action) => {
            state.webhookEvents.push(action.payload);
            // Keep only last 1000 webhook events
            if (state.webhookEvents.length > 1000) {
                state.webhookEvents = state.webhookEvents.slice(-1000);
            }
        },
        updateWebhookEvent: (state, action) => {
            const index = state.webhookEvents.findIndex(event => event.id === action.payload.id);
            if (index !== -1) {
                state.webhookEvents[index] = { ...state.webhookEvents[index], ...action.payload };
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
            .addCase(initializeServices.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(initializeServices.fulfilled, (state, action) => {
            state.loading = false;
            action.payload.services.forEach(service => {
                state.services[service.id] = service;
            });
        })
            .addCase(initializeServices.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to initialize services';
        })
            .addCase(testServiceConnection.fulfilled, (state, action) => {
            state.statuses[action.payload.serviceId] = action.payload;
        });
    },
});
// ============================================================================
// SERVICE IMPLEMENTATIONS
// ============================================================================
async function initializeService(config) {
    switch (config.type) {
        case 'email':
            return initializeEmailService(config);
        case 'sms':
            return initializeSmsService(config);
        case 'video':
            return initializeVideoService(config);
        case 'ai':
            return initializeAiService(config);
        case 'storage':
            return initializeStorageService(config);
        case 'webhook':
            return initializeWebhookService(config);
        default:
            return initializeGenericService(config);
    }
}
async function initializeEmailService(config) {
    switch (config.provider) {
        case 'sendgrid':
            return {
                async sendEmail({ to, subject, body, template, data }) {
                    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${config.credentials.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            personalizations: [{
                                    to: to.map((email) => ({ email })),
                                    dynamic_template_data: data
                                }],
                            from: { email: config.settings.fromEmail },
                            subject,
                            content: body ? [{ type: 'text/html', value: body }] : undefined,
                            template_id: template
                        })
                    });
                    return response.json();
                },
                async healthCheck() {
                    // Simple health check for SendGrid
                    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
                        headers: { 'Authorization': `Bearer ${config.credentials.apiKey}` }
                    });
                    if (!response.ok)
                        throw new Error('SendGrid API not accessible');
                }
            };
        case 'mailchimp':
            return {
                async sendEmail({ to, subject, body, template, data }) {
                    // Mailchimp implementation
                    throw new Error('Mailchimp email sending not implemented');
                },
                async healthCheck() {
                    const response = await fetch(`https://${config.settings.serverPrefix}.api.mailchimp.com/3.0/ping`, {
                        headers: { 'Authorization': `apikey ${config.credentials.apiKey}` }
                    });
                    if (!response.ok)
                        throw new Error('Mailchimp API not accessible');
                }
            };
        default:
            throw new Error(`Unsupported email provider: ${config.provider}`);
    }
}
async function initializeSmsService(config) {
    switch (config.provider) {
        case 'twilio':
            return {
                async sendSms(to, message) {
                    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.credentials.accountSid}/Messages.json`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Basic ${btoa(config.credentials.accountSid + ':' + config.credentials.authToken)}`,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams({
                            To: to,
                            From: config.settings.fromNumber,
                            Body: message
                        })
                    });
                    return response.json();
                },
                async healthCheck() {
                    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.credentials.accountSid}.json`, {
                        headers: {
                            'Authorization': `Basic ${btoa(config.credentials.accountSid + ':' + config.credentials.authToken)}`
                        }
                    });
                    if (!response.ok)
                        throw new Error('Twilio API not accessible');
                }
            };
        default:
            throw new Error(`Unsupported SMS provider: ${config.provider}`);
    }
}
async function initializeVideoService(config) {
    switch (config.provider) {
        case 'vimeo':
            return {
                async uploadVideo(file, metadata = {}) {
                    // Vimeo upload implementation
                    throw new Error('Vimeo upload not implemented');
                },
                async healthCheck() {
                    const response = await fetch('https://api.vimeo.com/me', {
                        headers: { 'Authorization': `Bearer ${config.credentials.accessToken}` }
                    });
                    if (!response.ok)
                        throw new Error('Vimeo API not accessible');
                }
            };
        default:
            throw new Error(`Unsupported video provider: ${config.provider}`);
    }
}
async function initializeAiService(config) {
    switch (config.provider) {
        case 'openai':
            return {
                async generateContent(prompt, contentType, options = {}) {
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${config.credentials.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: options.model || 'gpt-4',
                            messages: [{ role: 'user', content: prompt }],
                            max_tokens: options.maxTokens || 1000,
                            temperature: options.temperature || 0.7
                        })
                    });
                    const data = await response.json();
                    return data.choices[0]?.message?.content;
                },
                async healthCheck() {
                    const response = await fetch('https://api.openai.com/v1/models', {
                        headers: { 'Authorization': `Bearer ${config.credentials.apiKey}` }
                    });
                    if (!response.ok)
                        throw new Error('OpenAI API not accessible');
                }
            };
        default:
            throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
}
async function initializeStorageService(config) {
    switch (config.provider) {
        case 'aws-s3':
            return {
                async uploadFile(file, path, metadata) {
                    // AWS S3 upload implementation
                    throw new Error('AWS S3 upload not implemented');
                },
                async healthCheck() {
                    // S3 health check
                    throw new Error('AWS S3 health check not implemented');
                }
            };
        default:
            throw new Error(`Unsupported storage provider: ${config.provider}`);
    }
}
async function initializeWebhookService(config) {
    return {
        async sendWebhook(url, payload) {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'CourseFramework-Webhook/1.0'
                },
                body: JSON.stringify(payload)
            });
            return response;
        },
        async healthCheck() {
            if (config.endpoints?.webhook) {
                const response = await fetch(config.endpoints.webhook, { method: 'HEAD' });
                if (!response.ok)
                    throw new Error('Webhook endpoint not accessible');
            }
        }
    };
}
async function initializeGenericService(config) {
    return {
        async makeRequest(method, endpoint, data) {
            const url = `${config.endpoints?.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${config.credentials.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: data ? JSON.stringify(data) : undefined
            });
            return response.json();
        },
        async healthCheck() {
            if (config.endpoints?.baseUrl) {
                const response = await fetch(`${config.endpoints.baseUrl}/health`);
                if (!response.ok)
                    throw new Error('Service not accessible');
            }
        }
    };
}
// ============================================================================
// PLUGIN FACTORY
// ============================================================================
export function createExternalServicesPlugin(services) {
    return {
        id: 'external-services',
        name: 'External Services Integration',
        version: '1.0.0',
        initialize: async () => {
            const store = window.__courseFrameworkStore;
            if (store) {
                await store.dispatch(initializeServices(services));
            }
        },
        config: {
            externalServices: services,
        },
        slice: externalServicesSlice,
        utils: {
            sendEmail: (to, subject, body, template, data) => {
                const store = window.__courseFrameworkStore;
                if (store) {
                    return store.dispatch(sendEmail({ to, subject, body, template, data }));
                }
            },
            uploadFile: (file, path, metadata) => {
                const store = window.__courseFrameworkStore;
                if (store) {
                    return store.dispatch(uploadFile({ file, path, metadata }));
                }
            },
            generateContent: (prompt, contentType, options) => {
                const store = window.__courseFrameworkStore;
                if (store) {
                    return store.dispatch(generateContent({ prompt, contentType, options }));
                }
            },
            testConnection: (serviceId) => {
                const store = window.__courseFrameworkStore;
                if (store) {
                    return store.dispatch(testServiceConnection(serviceId));
                }
            }
        },
        // Event handlers
        onCourseCreated: (course) => {
            // Send welcome email when course is created
            const store = window.__courseFrameworkStore;
            if (store) {
                store.dispatch(sendEmail({
                    to: course.instructorEmail,
                    template: 'course-created',
                    data: { courseName: course.title, courseId: course.id }
                }));
            }
        },
        onUserRegistered: (user) => {
            // Send welcome email when user registers
            const store = window.__courseFrameworkStore;
            if (store) {
                store.dispatch(sendEmail({
                    to: user.email,
                    template: 'welcome',
                    data: { userName: user.name }
                }));
            }
        }
    };
}
// ============================================================================
// REACT HOOKS
// ============================================================================
import { useAppSelector, useAppDispatch } from '@course-framework/core/store';
export function useExternalServices() {
    const dispatch = useAppDispatch();
    const { services, statuses, usage, webhookEvents, loading, error } = useAppSelector((state) => state.externalServices || initialState);
    return {
        services,
        statuses,
        usage,
        webhookEvents,
        loading,
        error,
        // Actions
        sendEmail: (to, subject, body, template, data) => dispatch(sendEmail({ to, subject, body, template, data })),
        uploadFile: (file, path, metadata) => dispatch(uploadFile({ file, path, metadata })),
        generateContent: (prompt, contentType, options) => dispatch(generateContent({ prompt, contentType, options })),
        testConnection: (serviceId) => dispatch(testServiceConnection(serviceId)),
        // Service status
        getServiceStatus: (serviceId) => statuses[serviceId],
        isServiceHealthy: (serviceId) => statuses[serviceId]?.status === 'healthy',
        getServiceUsage: (serviceId) => usage[serviceId] || [],
    };
}
export const externalServicesActions = externalServicesSlice.actions;
export default externalServicesSlice.reducer;
