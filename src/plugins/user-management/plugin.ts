// User Management plugin for the new architecture
import * as React from 'react';
import type { Plugin } from '../../types/plugin-interface';
import { UserManagementComponent } from './UserManagementComponent';

// Plugin definition
export const userManagementPlugin: Plugin = {
  id: 'user-management',
  name: 'User Management',
  component: UserManagementComponent,
  icon: '👥',
  order: 9,
};

export default userManagementPlugin;