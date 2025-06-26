// Backwards compatibility export - redirects to internal components
// NOTE: This file is for internal framework use only. 
// External consumers should use the plugin API.

export { 
  CourseEditor,
  CourseViewer,
  CourseList,
  CourseCard,
  CreateCourseForm,
  CourseDetails,
  ModuleManager 
} from './internal/default-components';

// Re-export UI components
export * from './internal/default-components/ui/badge';
export * from './internal/default-components/ui/button';
export * from './internal/default-components/ui/card';
export * from './internal/default-components/ui/dialog';
export * from './internal/default-components/ui/input';
export * from './internal/default-components/ui/progress';
export * from './internal/default-components/ui/select';
export * from './internal/default-components/ui/switch';
export * from './internal/default-components/ui/tabs';
export * from './internal/default-components/ui/textarea';