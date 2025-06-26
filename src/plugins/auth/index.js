// Authentication Plugin
export * from './auth-context';
export * from './local-auth-provider';
export * from './plugin';
// Re-export for convenience
export { AuthenticationPlugin, createLocalAuthPlugin, createCustomAuthPlugin } from './plugin';
export { AuthProvider as AuthContextProvider, useAuth } from './auth-context';
export { LocalAuthProvider } from './local-auth-provider';
