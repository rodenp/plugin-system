import React from 'react';
import { Plugin, PluginFactory } from '@course-framework/core/plugin-manager';

// Import course builder components
import { CourseList } from './internal/default-components/CourseList';
import { CreateCourseForm } from './internal/default-components/CreateCourseForm';
import { CourseEditor } from './internal/default-components/CourseEditor';
import { CourseViewer } from './internal/default-components/CourseViewer';
import { CourseCard } from './internal/default-components/CourseCard';

export interface CourseBuilderConfig {
  apiUrl: string;
  ssr?: boolean;
  enableRichTextEditor?: boolean;
  enableDragAndDrop?: boolean;
  enableLessonLibrary?: boolean;
  enableTemplates?: boolean;
  theme?: string;
}

// Course Builder Service
export class CourseBuilderService {
  private config: CourseBuilderConfig;

  constructor(config: CourseBuilderConfig) {
    this.config = config;
  }

  // Course management
  async createCourse(courseData: any) {
    console.log('Creating course:', courseData);
    // Implementation would connect to actual API
    return { id: `course-${Date.now()}`, ...courseData };
  }

  async updateCourse(courseId: string, updates: any) {
    console.log('Updating course:', courseId, updates);
    // Implementation would connect to actual API
    return { id: courseId, ...updates };
  }

  async getCourse(courseId: string) {
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
export const createCourseBuilderPlugin: PluginFactory<CourseBuilderConfig> = (config) => {
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