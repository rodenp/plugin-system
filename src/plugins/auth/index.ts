// Authentication Plugin
export * from './auth-context';
export * from './local-auth-provider';
export * from './plugin';

// Export types with explicit names to avoid conflicts
export type {
  User,
  AuthSession,
  SignInCredentials,
  SignUpCredentials,
  AuthConfig,
  AuthProvider as IAuthProvider,
  AuthEvents
} from './types';

// Re-export for convenience
export { AuthenticationPlugin, createLocalAuthPlugin, createCustomAuthPlugin } from './plugin';
export { AuthProvider as AuthContextProvider, useAuth } from './auth-context';
export { LocalAuthProvider } from './local-auth-provider';