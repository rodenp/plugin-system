import { StripeComponent } from './StripeComponent';
// Plugin definition
export const stripePlugin = {
    id: 'stripe',
    name: 'Stripe Payments',
    component: StripeComponent,
    icon: '💳',
    order: 10,
};
export default stripePlugin;
