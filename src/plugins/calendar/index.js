// Calendar plugin for the new architecture
import * as React from 'react';
import { CalendarComponent } from './CalendarComponent';
// Wrapper component that handles internal routing
const CalendarWithRouting = (props) => {
    const groupname = props.currentUser?.profile?.groupname || 'courzey';
    const pluginPath = `/${groupname}/calendar`;
    // Update document title and URL without causing page reload
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', pluginPath);
            document.title = `Calendar - ${groupname}`;
        }
    }, [groupname, pluginPath]);
    return React.createElement(CalendarComponent, props);
};
// Plugin definition
export const calendarPlugin = {
    id: 'calendar',
    name: 'Calendar',
    component: CalendarWithRouting,
    icon: '',
    order: 3,
};
export default calendarPlugin;
