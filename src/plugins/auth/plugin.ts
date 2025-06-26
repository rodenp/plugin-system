import type { Plugin, PluginConfig } from '../../types/core';
import type { AuthProvider, AuthConfig } from './types';
import { LocalAuthProvider } from './local-auth-provider';

export class AuthenticationPlugin implements Plugin {
  id = 'authentication';
  name = 'Authentication';
  version = '1.0.0';
  description = 'Authentication and user management plugin';

  private authProvider: AuthProvider;

  constructor(authProvider?: AuthProvider) {
    this.authProvider = authProvider || new LocalAuthProvider();
  }

  async initialize(config: PluginConfig): Promise<void> {
    const authConfig = config as AuthConfig;
    
    // If using LocalAuthProvider and config is provided, create a new instance
    if (this.authProvider instanceof LocalAuthProvider && authConfig) {
      this.authProvider = new LocalAuthProvider(authConfig);
    }
    
    // Make the auth provider available globally for the context
    (window as any).__courseFrameworkAuthProvider = this.authProvider;
    
    console.log(`✅ ${this.name} plugin initialized with provider: ${this.authProvider.name}`);
  }

  async destroy(): Promise<void> {
    // Clean up global references
    delete (window as any).__courseFrameworkAuthProvider;
    console.log(`🧹 ${this.name} plugin destroyed`);
  }

  getAuthProvider(): AuthProvider {
    return this.authProvider;
  }
}

// Factory functions for different auth providers
export function createLocalAuthPlugin(config?: AuthConfig): AuthenticationPlugin {
  return new AuthenticationPlugin(new LocalAuthProvider(config));
}

export function createCustomAuthPlugin(authProvider: AuthProvider): AuthenticationPlugin {
  return new AuthenticationPlugin(authProvider);
}