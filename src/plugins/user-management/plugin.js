import { UserManagementComponent } from './UserManagementComponent';
// Plugin definition
export const userManagementPlugin = {
    id: 'user-management',
    name: 'User Management',
    component: UserManagementComponent,
    icon: '👥',
    order: 9,
};
export default userManagementPlugin;
