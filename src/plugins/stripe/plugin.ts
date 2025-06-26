import type { Plugin, PluginConfig } from '../../types/core';
import { StripeService } from './stripe-service';
import type { StripeConfig } from './types';

export class StripePaymentsPlugin implements Plugin {
  id = 'stripe-payments';
  name = 'Stripe Payments';
  version = '1.0.0';
  description = 'Stripe integration for course payments and subscriptions';

  private stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  }

  async initialize(config: PluginConfig): Promise<void> {
    const stripeConfig = config as StripeConfig;
    
    if (!stripeConfig.publishableKey) {
      throw new Error('Stripe publishable key is required');
    }

    await this.stripeService.initialize(stripeConfig);
    
    // Make the service available globally for the context
    (window as any).__courseFrameworkStripeService = this.stripeService;
    
    console.log(`✅ ${this.name} plugin initialized`);
  }

  async destroy(): Promise<void> {
    // Clean up global references
    delete (window as any).__courseFrameworkStripeService;
    console.log(`🧹 ${this.name} plugin destroyed`);
  }

  getStripeService(): StripeService {
    return this.stripeService;
  }
}

// Factory function for easier instantiation
export function createStripePaymentsPlugin(): StripePaymentsPlugin {
  return new StripePaymentsPlugin();
}