import { LocalAuthProvider } from './local-auth-provider';
export class AuthenticationPlugin {
    id = 'authentication';
    name = 'Authentication';
    version = '1.0.0';
    description = 'Authentication and user management plugin';
    authProvider;
    constructor(authProvider) {
        this.authProvider = authProvider || new LocalAuthProvider();
    }
    async initialize(config) {
        const authConfig = config;
        // If using LocalAuthProvider and config is provided, create a new instance
        if (this.authProvider instanceof LocalAuthProvider && authConfig) {
            this.authProvider = new LocalAuthProvider(authConfig);
        }
        // Make the auth provider available globally for the context
        window.__courseFrameworkAuthProvider = this.authProvider;
        console.log(`✅ ${this.name} plugin initialized with provider: ${this.authProvider.name}`);
    }
    async destroy() {
        // Clean up global references
        delete window.__courseFrameworkAuthProvider;
        console.log(`🧹 ${this.name} plugin destroyed`);
    }
    getAuthProvider() {
        return this.authProvider;
    }
}
// Factory functions for different auth providers
export function createLocalAuthPlugin(config) {
    return new AuthenticationPlugin(new LocalAuthProvider(config));
}
export function createCustomAuthPlugin(authProvider) {
    return new AuthenticationPlugin(authProvider);
}
