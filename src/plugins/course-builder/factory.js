import React from 'react';
// Import course builder components
import { CourseList } from './internal/default-components/CourseList';
import { CreateCourseForm } from './internal/default-components/CreateCourseForm';
import { CourseEditor } from './internal/default-components/CourseEditor';
import { CourseViewer } from './internal/default-components/CourseViewer';
import { CourseCard } from './internal/default-components/CourseCard';
// Course Builder Service
export class CourseBuilderService {
    config;
    constructor(config) {
        this.config = config;
    }
    // Course management
    async createCourse(courseData) {
        console.log('Creating course:', courseData);
        // Implementation would connect to actual API
        return { id: `course-${Date.now()}`, ...courseData };
    }
    async updateCourse(courseId, updates) {
        console.log('Updating course:', courseId, updates);
        // Implementation would connect to actual API
        return { id: courseId, ...updates };
    }
    async getCourse(courseId) {
        console.log('Getting course:', courseId);
        // Implementation would connect to actual API
        return null;
    }
    async getCourses() {
        console.log('Getting courses');
        // Implementation would connect to actual API
        return [];
    }
}
// Plugin factory for the new PluginManager
export const createCourseBuilderPlugin = (config) => {
    const courseBuilderService = new CourseBuilderService(config);
    return {
        name: 'course-builder',
        version: '1.0.0',
        dependencies: [],
        components: {
            CourseList,
            CreateCourseForm,
            CourseEditor,
            CourseViewer,
            CourseCard
        },
        hooks: {
            useCourseBuilder: () => {
                const [courses, setCourses] = React.useState([]);
                const [loading, setLoading] = React.useState(false);
                return {
                    courses,
                    setCourses,
                    loading,
                    setLoading,
                    createCourse: courseBuilderService.createCourse.bind(courseBuilderService),
                    updateCourse: courseBuilderService.updateCourse.bind(courseBuilderService),
                    getCourse: courseBuilderService.getCourse.bind(courseBuilderService),
                    getCourses: courseBuilderService.getCourses.bind(courseBuilderService)
                };
            }
        },
        routes: [
            {
                path: '/courses',
                component: 'CourseList',
                exact: true
            },
            {
                path: '/courses/create',
                component: 'CreateCourseForm',
                exact: true
            },
            {
                path: '/courses/:courseId/edit',
                component: 'CourseEditor',
                exact: true
            },
            {
                path: '/courses/:courseId',
                component: 'CourseViewer',
                exact: true
            }
        ],
        onInit: async (manager) => {
            manager.setState('courseBuilderService', courseBuilderService);
            console.log('Course Builder plugin initialized');
        },
        onDestroy: async () => {
            console.log('Course Builder plugin destroyed');
        }
    };
};
