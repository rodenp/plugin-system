// Stripe plugin for the new architecture
import * as React from 'react';
import type { Plugin } from '../../types/plugin-interface';
import { StripeComponent } from './StripeComponent';

// Plugin definition
export const stripePlugin: Plugin = {
  id: 'stripe',
  name: 'Stripe Payments',
  component: StripeComponent,
  icon: '💳',
  order: 10,
};

export default stripePlugin;