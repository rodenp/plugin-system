import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { StripeService } from './stripe-service';
import type { SubscriptionPlan, Customer, PaymentMethod, Invoice, StripeConfig } from './types';

interface StripeContextType {
  // Configuration
  isConfigured: boolean;
  isTestMode: boolean;
  configureStripe: (config: StripeConfig) => Promise<void>;

  // Plans
  plans: SubscriptionPlan[];
  setPlans: (plans: SubscriptionPlan[]) => void;

  // Customer
  customer: Customer | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  loadCustomerData: (customerId: string) => Promise<void>;

  // Subscriptions
  createCheckoutSession: (planId: string) => Promise<void>;
  cancelSubscription: (subscriptionId: string, immediate?: boolean) => Promise<void>;
  resumeSubscription: (subscriptionId: string) => Promise<void>;
  openBillingPortal: () => Promise<void>;

  // State
  loading: boolean;
  error: string | null;

  // Utility
  formatCurrency: (amount: number, currency?: string) => string;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

interface StripeProviderProps {
  children: ReactNode;
  customerId?: string;
  stripeService?: StripeService;
}

export function StripeProvider({ children, customerId, stripeService: externalStripeService }: StripeProviderProps) {
  const stripeService = externalStripeService || new StripeService();
  
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTestMode, setIsTestMode] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize and load configuration
  useEffect(() => {
    setIsConfigured(stripeService.isConfigured());
    setIsTestMode(stripeService.isTestMode());

    // Try to load saved configuration
    try {
      const savedConfig = localStorage.getItem('course_framework_stripe_config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        stripeService.initialize(config).then(() => {
          setIsConfigured(true);
          setIsTestMode(config.testMode);
        }).catch(() => {
          localStorage.removeItem('course_framework_stripe_config');
        });
      }
    } catch (error) {
      localStorage.removeItem('course_framework_stripe_config');
    }

    // Load saved plans
    try {
      const savedPlans = localStorage.getItem('course_framework_stripe_plans');
      if (savedPlans) {
        setPlans(JSON.parse(savedPlans));
      }
    } catch (error) {
      console.error('Failed to load saved plans:', error);
    }
  }, [stripeService]);

  // Load customer data when customerId changes
  useEffect(() => {
    if (customerId && isConfigured) {
      loadCustomerData(customerId);
    }
  }, [customerId, isConfigured]);

  const configureStripe = async (config: StripeConfig) => {
    try {
      setLoading(true);
      setError(null);

      await stripeService.initialize(config);

      setIsConfigured(true);
      setIsTestMode(config.testMode ?? true);

      // Save configuration
      localStorage.setItem('course_framework_stripe_config', JSON.stringify(config));

      console.log('✅ Stripe plugin configuration successful');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to configure Stripe';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerData = async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);

      const [customerData, paymentMethodsData, invoicesData] = await Promise.all([
        stripeService.getCustomer(customerId),
        stripeService.getPaymentMethods(customerId),
        stripeService.getInvoices(customerId)
      ]);

      setCustomer(customerData);
      setPaymentMethods(paymentMethodsData);
      setInvoices(invoicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (planId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      if (plan.price > 0 && !plan.stripePriceId) {
        throw new Error(`Plan "${plan.name}" requires a Stripe Price ID.`);
      }

      const session = await stripeService.createCheckoutSession({
        priceId: plan.stripePriceId,
        customerId: customer?.stripeCustomerId,
        customerEmail: customer?.email || 'user@example.com',
        successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/billing/cancel`,
        mode: 'subscription',
        trialPeriodDays: plan.trialPeriodDays
      });

      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL received from Stripe');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string, immediate = false) => {
    try {
      setLoading(true);
      setError(null);

      await stripeService.cancelSubscription(subscriptionId, immediate);

      if (customer) {
        await loadCustomerData(customer.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resumeSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      setError(null);

      await stripeService.resumeSubscription(subscriptionId);

      if (customer) {
        await loadCustomerData(customer.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!customer?.stripeCustomerId) {
        throw new Error('No customer found');
      }

      const session = await stripeService.createBillingPortalSession(
        customer.stripeCustomerId,
        window.location.href
      );

      window.open(session.url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'usd') => {
    return stripeService.formatCurrency(amount, currency);
  };

  const handleSetPlans = (newPlans: SubscriptionPlan[]) => {
    setPlans(newPlans);
    localStorage.setItem('course_framework_stripe_plans', JSON.stringify(newPlans));
  };

  const value: StripeContextType = {
    isConfigured,
    isTestMode,
    configureStripe,
    plans,
    setPlans: handleSetPlans,
    customer,
    paymentMethods,
    invoices,
    loadCustomerData,
    createCheckoutSession,
    cancelSubscription,
    resumeSubscription,
    openBillingPortal,
    loading,
    error,
    formatCurrency
  };

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}