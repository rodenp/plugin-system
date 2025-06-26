import { StripeService } from './stripe-service';
export class StripePaymentsPlugin {
    id = 'stripe-payments';
    name = 'Stripe Payments';
    version = '1.0.0';
    description = 'Stripe integration for course payments and subscriptions';
    stripeService;
    constructor() {
        this.stripeService = new StripeService();
    }
    async initialize(config) {
        const stripeConfig = config;
        if (!stripeConfig.publishableKey) {
            throw new Error('Stripe publishable key is required');
        }
        await this.stripeService.initialize(stripeConfig);
        // Make the service available globally for the context
        window.__courseFrameworkStripeService = this.stripeService;
        console.log(`✅ ${this.name} plugin initialized`);
    }
    async destroy() {
        // Clean up global references
        delete window.__courseFrameworkStripeService;
        console.log(`🧹 ${this.name} plugin destroyed`);
    }
    getStripeService() {
        return this.stripeService;
    }
}
// Factory function for easier instantiation
export function createStripePaymentsPlugin() {
    return new StripePaymentsPlugin();
}
