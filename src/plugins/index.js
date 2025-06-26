// All available plugins
export * from './stripe';
export * from './auth';
export * from './community';
export * from './course-builder';
export * from './analytics';
export * from './feature-flags';
export * from './external-services';
export * from './course-data';
export * from './course-publishing';
export * from './assessment';
export * from './marketplace';
export * from './certificates';
export * from './user-management';
// Plugin factory functions
export { createStripePaymentsPlugin } from './stripe';
export { createLocalAuthPlugin, createCustomAuthPlugin } from './auth';
export { createCommunityPlugin } from './community';
export { createCourseBuilderPlugin } from './course-builder';
export { createAnalyticsPlugin } from './analytics';
export { createFeatureFlagsPlugin } from './feature-flags';
export { createExternalServicesPlugin } from './external-services';
export { createCourseDataPlugin } from './course-data';
export { createCoursePublishingPlugin } from './course-publishing';
export { createAssessmentPlugin } from './assessment';
export { createMarketplacePlugin } from './marketplace';
export { createCertificatesPlugin } from './certificates';
export { createUserManagementPlugin } from './user-management';
