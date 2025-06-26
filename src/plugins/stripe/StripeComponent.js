import * as React from 'react';
import { defaultTheme } from '../shared/default-theme';
// ============================================================================
// COMPONENT
// ============================================================================
export const StripeComponent = ({ currentUser, communityId, community, userRole, theme, config, plans = [], customer, paymentMethods = [], invoices = [], subscriptions = [], isConfigured = false, isTestMode = true, loading = false, error, onConfigureStripe, onLoadCustomerData, onCreateCheckoutSession, onCancelSubscription, onResumeSubscription, onCreateBillingPortalSession, onCreateCustomer, onUpdateSubscription, }) => {
    // Apply theme
    const appliedTheme = theme || defaultTheme;
    // Local state
    const [activeTab, setActiveTab] = React.useState('overview');
    const [configForm, setConfigForm] = React.useState({
        publishableKey: '',
        testMode: true
    });
    // Helper functions
    const formatCurrency = (amount, currency = 'usd') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount / 100);
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(date));
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
            case 'paid':
                return appliedTheme.colors.secondary;
            case 'past_due':
            case 'unpaid':
                return appliedTheme.colors.warning;
            case 'canceled':
            case 'incomplete':
                return appliedTheme.colors.danger;
            case 'trialing':
                return appliedTheme.colors.accent;
            default:
                return appliedTheme.colors.textSecondary;
        }
    };
    // Event handlers
    const handleConfigureStripe = async (e) => {
        e.preventDefault();
        if (onConfigureStripe && configForm.publishableKey) {
            try {
                await onConfigureStripe({
                    publishableKey: configForm.publishableKey,
                    testMode: configForm.testMode
                });
            }
            catch (error) {
                console.error('Failed to configure Stripe:', error);
            }
        }
    };
    const handleLoadCustomerData = async () => {
        if (onLoadCustomerData && currentUser?.id) {
            try {
                await onLoadCustomerData(currentUser.id);
            }
            catch (error) {
                console.error('Failed to load customer data:', error);
            }
        }
    };
    const handleSubscribeToPlan = async (planId) => {
        if (onCreateCheckoutSession) {
            try {
                const result = await onCreateCheckoutSession(planId, customer?.stripeCustomerId);
                if (result.url) {
                    window.open(result.url, '_blank');
                }
            }
            catch (error) {
                console.error('Failed to create checkout session:', error);
            }
        }
    };
    const handleCancelSubscription = async (subscriptionId) => {
        if (onCancelSubscription) {
            try {
                await onCancelSubscription(subscriptionId, false);
            }
            catch (error) {
                console.error('Failed to cancel subscription:', error);
            }
        }
    };
    const handleOpenBillingPortal = async () => {
        if (onCreateBillingPortalSession && customer?.stripeCustomerId) {
            try {
                const result = await onCreateBillingPortalSession(customer.stripeCustomerId, window.location.href);
                if (result.url) {
                    window.open(result.url, '_blank');
                }
            }
            catch (error) {
                console.error('Failed to open billing portal:', error);
            }
        }
    };
    // Render tab navigation
    const renderTabNavigation = () => (React.createElement('div', {
        style: {
            display: 'flex',
            borderBottom: `1px solid ${appliedTheme.borders.borderColor}`,
            marginBottom: appliedTheme.spacing.lg
        }
    }, ['overview', 'plans', 'customer', 'billing', 'config'].map(tab => React.createElement('button', {
        key: tab,
        onClick: () => setActiveTab(tab),
        style: {
            padding: `${appliedTheme.spacing.md} ${appliedTheme.spacing.lg}`,
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === tab ? `2px solid ${appliedTheme.colors.secondary}` : '2px solid transparent',
            color: activeTab === tab ? appliedTheme.colors.secondary : appliedTheme.colors.textSecondary,
            fontWeight: activeTab === tab ? 600 : 'normal',
            cursor: 'pointer',
            textTransform: 'capitalize'
        }
    }, tab))));
    // Render overview
    const renderOverview = () => (React.createElement('div', {}, React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: appliedTheme.spacing.lg,
            marginBottom: appliedTheme.spacing.xl
        }
    }, [
        { label: 'Configuration', value: isConfigured ? 'Active' : 'Not Configured' },
        { label: 'Mode', value: isTestMode ? 'Test' : 'Live' },
        { label: 'Available Plans', value: plans.length },
        { label: 'Customer Status', value: customer?.subscriptionStatus || 'No Subscription' },
        { label: 'Payment Methods', value: paymentMethods.length }
    ].map((stat, index) => React.createElement('div', {
        key: index,
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            textAlign: 'center'
        }
    }, React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            color: appliedTheme.colors.textPrimary,
            marginBottom: appliedTheme.spacing.xs
        }
    }, stat.value), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary
        }
    }, stat.label)))), React.createElement('div', {
        style: {
            display: 'flex',
            gap: appliedTheme.spacing.md,
            marginBottom: appliedTheme.spacing.lg
        }
    }, React.createElement('button', {
        onClick: handleLoadCustomerData,
        disabled: !isConfigured,
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: isConfigured ? appliedTheme.colors.secondary : appliedTheme.colors.muted,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: isConfigured ? 'pointer' : 'not-allowed'
        }
    }, 'Load Customer Data'), customer?.stripeCustomerId && React.createElement('button', {
        onClick: handleOpenBillingPortal,
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
        }
    }, 'Open Billing Portal'))));
    // Render plans
    const renderPlans = () => (React.createElement('div', {}, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Subscription Plans'), plans.length > 0 ? (React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: appliedTheme.spacing.lg
        }
    }, plans.map(plan => React.createElement('div', {
        key: plan.id,
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: plan.popular ? `2px solid ${appliedTheme.colors.secondary}` : `1px solid ${appliedTheme.borders.borderColor}`,
            position: 'relative'
        }
    }, plan.popular && React.createElement('div', {
        style: {
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.md}`,
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeXs,
            fontWeight: 600
        }
    }, 'POPULAR'), React.createElement('h3', {
        style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.sm,
            color: appliedTheme.colors.textPrimary
        }
    }, plan.name), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 700,
            color: appliedTheme.colors.secondary,
            marginBottom: appliedTheme.spacing.xs
        }
    }, formatCurrency(plan.price, plan.currency)), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            marginBottom: appliedTheme.spacing.md
        }
    }, `per ${plan.interval}`), React.createElement('p', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            marginBottom: appliedTheme.spacing.md
        }
    }, plan.description), React.createElement('ul', {
        style: {
            listStyle: 'none',
            padding: 0,
            margin: 0,
            marginBottom: appliedTheme.spacing.lg
        }
    }, plan.features.map((feature, index) => React.createElement('li', {
        key: index,
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textPrimary,
            marginBottom: appliedTheme.spacing.xs,
            paddingLeft: appliedTheme.spacing.md,
            position: 'relative'
        }
    }, React.createElement('span', {
        style: {
            position: 'absolute',
            left: 0,
            color: appliedTheme.colors.secondary
        }
    }, '✓'), feature))), React.createElement('button', {
        onClick: () => handleSubscribeToPlan(plan.id),
        disabled: !isConfigured || loading,
        style: {
            width: '100%',
            padding: `${appliedTheme.spacing.md} ${appliedTheme.spacing.lg}`,
            backgroundColor: plan.popular ? appliedTheme.colors.secondary : appliedTheme.colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            fontWeight: 600,
            cursor: (isConfigured && !loading) ? 'pointer' : 'not-allowed',
            opacity: (isConfigured && !loading) ? 1 : 0.6
        }
    }, 'Subscribe Now'))))) : (React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.xl,
            textAlign: 'center',
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('p', {
        style: {
            color: appliedTheme.colors.textSecondary,
            margin: 0
        }
    }, 'No subscription plans available.')))));
    // Render customer info
    const renderCustomer = () => (React.createElement('div', {}, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Customer Information'), customer ? (React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: appliedTheme.spacing.md
        }
    }, [
        { label: 'Customer ID', value: customer.id },
        { label: 'Email', value: customer.email },
        { label: 'Name', value: customer.name || 'Not provided' },
        { label: 'Stripe Customer ID', value: customer.stripeCustomerId || 'Not created' },
        { label: 'Subscription Status', value: customer.subscriptionStatus || 'No subscription' },
        { label: 'Current Plan', value: customer.currentPlan || 'None' }
    ].map((item, index) => React.createElement('div', {
        key: index,
        style: {
            marginBottom: appliedTheme.spacing.sm
        }
    }, React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            marginBottom: appliedTheme.spacing.xs
        }
    }, item.label), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeMd,
            color: appliedTheme.colors.textPrimary,
            fontWeight: 500
        }
    }, item.value)))))) : (React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.xl,
            textAlign: 'center',
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('p', {
        style: {
            color: appliedTheme.colors.textSecondary,
            margin: 0
        }
    }, 'No customer data loaded. Click "Load Customer Data" to fetch information.')))));
    // Render configuration
    const renderConfig = () => (React.createElement('div', {}, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Stripe Configuration'), React.createElement('form', {
        onSubmit: handleConfigureStripe,
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('div', {
        style: {
            marginBottom: appliedTheme.spacing.md
        }
    }, React.createElement('label', {
        style: {
            display: 'block',
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            marginBottom: appliedTheme.spacing.xs
        }
    }, 'Publishable Key'), React.createElement('input', {
        type: 'text',
        value: configForm.publishableKey,
        onChange: (e) => setConfigForm(prev => ({ ...prev, publishableKey: e.target.value })),
        placeholder: 'pk_test_...',
        style: {
            width: '100%',
            padding: appliedTheme.spacing.sm,
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm
        }
    })), React.createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: appliedTheme.spacing.lg
        }
    }, React.createElement('input', {
        type: 'checkbox',
        id: 'testMode',
        checked: configForm.testMode,
        onChange: (e) => setConfigForm(prev => ({ ...prev, testMode: e.target.checked })),
        style: {
            marginRight: appliedTheme.spacing.sm
        }
    }), React.createElement('label', {
        htmlFor: 'testMode',
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Test Mode')), React.createElement('button', {
        type: 'submit',
        disabled: !configForm.publishableKey || loading,
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: (configForm.publishableKey && !loading) ? appliedTheme.colors.secondary : appliedTheme.colors.muted,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: (configForm.publishableKey && !loading) ? 'pointer' : 'not-allowed'
        }
    }, loading ? 'Configuring...' : 'Configure Stripe'))));
    return React.createElement('div', {
        style: {
            padding: appliedTheme.spacing.lg
        }
    }, renderTabNavigation(), 
    // Error display
    error && React.createElement('div', {
        style: {
            margin: `${appliedTheme.spacing.lg} 0`,
            padding: appliedTheme.spacing.md,
            backgroundColor: appliedTheme.colors.danger + '10',
            border: `1px solid ${appliedTheme.colors.danger}`,
            borderRadius: appliedTheme.borders.borderRadius,
            color: appliedTheme.colors.danger,
            fontSize: appliedTheme.font.sizeSm
        }
    }, error), 
    // Loading state
    loading && React.createElement('div', {
        style: {
            textAlign: 'center',
            padding: appliedTheme.spacing.xl,
            color: appliedTheme.colors.textSecondary
        }
    }, 'Loading Stripe data...'), 
    // Tab content
    !loading && activeTab === 'overview' && renderOverview(), !loading && activeTab === 'plans' && renderPlans(), !loading && activeTab === 'customer' && renderCustomer(), activeTab === 'billing' && React.createElement('div', {
        style: {
            textAlign: 'center',
            padding: appliedTheme.spacing.xl,
            color: appliedTheme.colors.textSecondary
        }
    }, `${invoices.length} invoice(s) available`), activeTab === 'config' && renderConfig());
};
