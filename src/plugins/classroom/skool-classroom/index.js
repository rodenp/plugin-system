// Classroom plugin for the new architecture
import * as React from 'react';
import { ClassroomComponent } from './ClassroomComponent';
import { CourseProvider } from '../../../core/course-context';
// Wrapper component that provides CourseProvider
const ClassroomWithProvider = (props) => {
    const groupname = props.currentUser?.profile?.groupname || 'courzey';
    const pluginPath = `/${groupname}/classroom`;
    // Update document title and URL without causing page reload
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', pluginPath);
            document.title = `Classroom - ${groupname}`;
        }
    }, [groupname, pluginPath]);
    return React.createElement(CourseProvider, null, React.createElement(ClassroomComponent, props));
};
// Plugin definition
export const classroomPlugin = {
    id: 'classroom',
    name: 'Classroom',
    component: ClassroomWithProvider,
    dependencies: ['course-builder'], // Depends on course-builder plugin
    icon: '',
    order: 2,
};
export default classroomPlugin;
