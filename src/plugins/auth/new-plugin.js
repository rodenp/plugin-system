import { AuthComponent } from './AuthComponent';
// Plugin definition
export const authPlugin = {
    id: 'auth',
    name: 'Authentication',
    component: AuthComponent,
    icon: '🔐',
    order: 15,
};
export default authPlugin;
