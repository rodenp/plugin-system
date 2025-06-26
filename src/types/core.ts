// Core course framework types
export interface Course {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  modules: Module[];
  tags?: string[];
  progress?: number;
  isTemplate?: boolean;
  isPublished?: boolean;
  isPaid?: boolean;
  accessLevel?: 'free' | 'paid' | 'premium';
  requiredPlan?: 'basic' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: ContentBlock[];
  duration: number;
  order: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content: TextContent | MediaContent;
  order: number;
}

export interface TextContent {
  type: 'text';
  content: string;
}

export interface MediaContent {
  type: 'image' | 'video' | 'audio';
  url: string;
  title?: string;
  caption?: string;
}

export interface LessonTemplate {
  id: string;
  title: string;
  description: string;
  content: ContentBlock[];
  duration: number;
  category: string;
}

export type ViewMode = 'view' | 'edit';

// Plugin system types
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  initialize: (config: PluginConfig) => Promise<void>;
  destroy?: () => Promise<void>;
}

export interface PluginConfig {
  [key: string]: any;
}

export interface PluginRegistry {
  plugins: Map<string, Plugin>;
  register: (plugin: Plugin) => void;
  unregister: (pluginId: string) => void;
  get: (pluginId: string) => Plugin | undefined;
  list: () => Plugin[];
}

// Storage abstraction
export interface StorageAdapter {
  getCourses: () => Promise<Course[]>;
  getCourse: (id: string) => Promise<Course | null>;
  saveCourse: (course: Course) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  getLessonTemplates: () => Promise<LessonTemplate[]>;
  saveLessonTemplate: (template: LessonTemplate) => Promise<LessonTemplate>;
  generateId: () => string;
}

// Event system
export interface CourseEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface EventBus {
  emit: (event: CourseEvent) => void;
  on: (eventType: string, handler: (event: CourseEvent) => void) => void;
  off: (eventType: string, handler: (event: CourseEvent) => void) => void;
}