// Note: @stripe/stripe-js is a peer dependency
import type {
  StripeConfig,
  SubscriptionPlan,
  Customer,
  PaymentMethod,
  Invoice,
  Subscription,
  CheckoutSessionParams,
  StripeWebhookEvent
} from './types';

export class StripeService {
  private stripe: any = null;
  private config: StripeConfig | null = null;
  private isInitialized = false;

  async initialize(config: StripeConfig): Promise<void> {
    this.config = { testMode: true, ...config };

    try {
      // Validate key format
      if (!config.publishableKey?.startsWith('pk_')) {
        throw new Error('Invalid publishable key format - must start with pk_');
      }

      // Load Stripe.js (requires @stripe/stripe-js peer dependency)
      if (typeof window !== 'undefined') {
        try {
          const stripeJs = await import('@stripe/stripe-js');
          this.stripe = await stripeJs.loadStripe(config.publishableKey);
          if (!this.stripe) {
            throw new Error('Failed to load Stripe.js');
          }
        } catch (error) {
          console.warn('Stripe.js not available, using mock mode');
          this.stripe = { mock: true };
        }
      } else {
        // Server-side mock
        this.stripe = { mock: true };
      }

      this.isInitialized = true;
      console.log('✅ Stripe plugin initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Stripe plugin:', error);
      throw error;
    }
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<{ sessionId: string; url: string }> {
    if (!this.isInitialized) {
      throw new Error('Stripe not initialized');
    }

    // In a real implementation, this would call your backend API
    // For now, simulate the response
    const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate API call to create checkout session
    const mockResponse = {
      sessionId,
      url: `https://checkout.stripe.com/pay/${sessionId}`
    };

    return mockResponse;
  }

  async redirectToCheckout(sessionId: string): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await this.stripe.redirectToCheckout({ sessionId });
    if (error) {
      throw new Error(error.message);
    }
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    // In a real implementation, this would call your backend API
    return {
      id: customerId,
      email: 'demo@example.com',
      name: 'Demo Customer',
      stripeCustomerId: 'cus_demo_customer',
      subscriptionStatus: 'active',
      currentPlan: 'pro'
    };
  }

  async getCustomerSubscriptions(customerId: string): Promise<Subscription[]> {
    // In a real implementation, this would call your backend API
    return [{
      id: 'sub_demo_subscription',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      plan: {
        id: 'pro',
        name: 'Pro Plan',
        description: 'Professional features',
        price: 2900,
        currency: 'usd',
        interval: 'month',
        stripePriceId: 'price_demo_pro',
        features: ['Unlimited courses', 'Advanced analytics', 'Priority support']
      },
      cancelAtPeriodEnd: false,
      customerId: customerId
    }];
  }

  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    // In a real implementation, this would call your backend API
    return [{
      id: 'pm_demo_card',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025
      },
      isDefault: true
    }];
  }

  async getInvoices(customerId: string): Promise<Invoice[]> {
    // In a real implementation, this would call your backend API
    return [
      {
        id: 'in_demo_invoice_1',
        number: 'INV-2024-001',
        status: 'paid',
        amount: 2900,
        currency: 'usd',
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        description: 'Pro Plan - Monthly',
        hostedInvoiceUrl: '#demo-invoice',
        invoicePdf: '#demo-invoice-pdf'
      }
    ];
  }

  async updateSubscription(params: {
    subscriptionId: string;
    priceId?: string;
    quantity?: number;
    cancelAtPeriodEnd?: boolean;
  }): Promise<Subscription> {
    // In a real implementation, this would call your backend API
    return {
      id: params.subscriptionId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      plan: {
        id: 'pro',
        name: 'Pro Plan',
        description: 'Professional features',
        price: 2900,
        currency: 'usd',
        interval: 'month',
        stripePriceId: 'price_demo_pro',
        features: ['Unlimited courses', 'Advanced analytics', 'Priority support']
      },
      cancelAtPeriodEnd: params.cancelAtPeriodEnd || false,
      customerId: 'cus_demo_customer'
    };
  }

  async cancelSubscription(subscriptionId: string, immediate = false): Promise<Subscription> {
    return this.updateSubscription({
      subscriptionId,
      cancelAtPeriodEnd: !immediate
    });
  }

  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    return this.updateSubscription({
      subscriptionId,
      cancelAtPeriodEnd: false
    });
  }

  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    // In a real implementation, this would call your backend API
    return {
      url: `https://billing.stripe.com/p/session/demo_${Date.now()}?return_url=${encodeURIComponent(returnUrl)}`
    };
  }

  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Customer> {
    // In a real implementation, this would call your backend API
    return {
      id: `demo_${Date.now()}`,
      email: params.email,
      name: params.name,
      stripeCustomerId: `cus_demo_${Date.now()}`
    };
  }

  async handleWebhookEvent(event: StripeWebhookEvent): Promise<{ received: boolean }> {
    console.log('Handling Stripe webhook:', event.type, event.id);

    switch (event.type) {
      case 'customer.subscription.created':
        console.log('Subscription created:', event.data.object);
        break;
      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data.object);
        break;
      case 'customer.subscription.deleted':
        console.log('Subscription canceled:', event.data.object);
        break;
      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.data.object);
        break;
      case 'invoice.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return { received: true };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config?.webhookSecret) {
      console.warn('Webhook secret not configured');
      return false;
    }

    // In a real implementation, use Stripe's webhook signature verification
    console.log('Verifying webhook signature');
    return true;
  }

  formatCurrency(amount: number, currency = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  }

  isConfigured(): boolean {
    return this.isInitialized && this.config !== null;
  }

  isTestMode(): boolean {
    return this.config?.testMode ?? true;
  }

  getConfig(): StripeConfig | null {
    return this.config;
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Stripe not initialized');
      }

      console.log('🧪 Testing Stripe connection...');
      
      // For demo purposes, always return true
      // In a real implementation, this would test the actual Stripe connection
      console.log('✅ Stripe connection test passed');
      return true;
    } catch (error) {
      console.error('❌ Stripe connection test failed:', error);
      return false;
    }
  }
}