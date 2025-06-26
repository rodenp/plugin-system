// Stripe plugin types
export interface StripeConfig {
  publishableKey: string;
  secretKey?: string;
  webhookSecret?: string;
  testMode?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: string[];
  popular?: boolean;
  trialPeriodDays?: number;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';
  currentPlan?: string;
  billingCycleAnchor?: Date;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEnd?: Date;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  created: Date;
  paidAt?: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  description?: string;
}

export interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  plan: SubscriptionPlan;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  customerId: string;
}

export interface CheckoutSessionParams {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  mode?: 'subscription' | 'payment';
  trialPeriodDays?: number;
}

export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  data: {
    object: Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key: string;
  } | null;
  type: string;
}