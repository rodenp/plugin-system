// Course Builder Plugin Types
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan?: {
    id: string;
    name: string;
    level: 'basic' | 'pro' | 'enterprise';
    features: string[];
  };
  permissions?: string[];
  customData?: Record<string, any>;
}

export interface CourseBuilderConfig {
  enableRichTextEditor: boolean;
  enableDragAndDrop: boolean;
  enableLessonLibrary: boolean;
  enableTemplates: boolean;
  theme: 'default' | 'dark' | 'custom';
  customTheme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  user?: UserInfo;
  // UI injection support
  customComponents?: {
    CourseEditor?: React.ComponentType<any>;
    CourseViewer?: React.ComponentType<any>;
    CourseList?: React.ComponentType<any>;
    CreateCourseForm?: React.ComponentType<any>;
    CourseCard?: React.ComponentType<any>;
    CourseDetails?: React.ComponentType<any>;
    ui?: {
      Badge?: React.ComponentType<any>;
      Button?: React.ComponentType<any>;
      Card?: React.ComponentType<any>;
      Dialog?: React.ComponentType<any>;
      Input?: React.ComponentType<any>;
      Progress?: React.ComponentType<any>;
      Select?: React.ComponentType<any>;
      Switch?: React.ComponentType<any>;
      Tabs?: React.ComponentType<any>;
      Textarea?: React.ComponentType<any>;
    };
  };
  // Security configuration
  enableSecurity?: boolean;
  allowDefaultUIAccess?: boolean;
  communityId?: string;
  userPermissions?: string[];
  userRole?: 'admin' | 'community_owner' | 'member' | 'anonymous';
}

export interface EditorTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
}

// LessonTemplate is imported from core types
import type { LessonTemplate } from '../../types/core';
export { LessonTemplate };

export interface CourseBuilderComponents {
  CourseEditor: React.ComponentType<any>;
  CourseViewer: React.ComponentType<any>;
  CourseList: React.ComponentType<any>;
  CreateCourseForm: React.ComponentType<any>;
  CourseCard: React.ComponentType<any>;
  ui: {
    Badge: React.ComponentType<any>;
    Button: React.ComponentType<any>;
    Card: React.ComponentType<any>;
    Dialog: React.ComponentType<any>;
    Input: React.ComponentType<any>;
    Progress: React.ComponentType<any>;
    Select: React.ComponentType<any>;
    Switch: React.ComponentType<any>;
    Tabs: React.ComponentType<any>;
    Textarea: React.ComponentType<any>;
  };
}

export interface CourseBuilderEvents {
  'course-builder:initialized': { config: CourseBuilderConfig };
  'course-builder:course-created': { courseId: string };
  'course-builder:course-updated': { courseId: string };
  'course-builder:lesson-completed': { courseId: string; lessonId: string };
  'course-builder:template-used': { templateId: string; courseId: string };
}