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

// Community data types for storage
export interface CommunityPost {
  id: string;
  title?: string;
  content: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  authorLevel?: number;
  category: string;
  likes: number;
  comments: number;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  videoUrl?: string;
  linkUrl?: string;
  attachments?: Array<{ id: string; name: string; size: number; type: string; preview: string }>;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  parentId?: string;
  likes: number;
  depth: number;
  isEdited: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  videoUrl?: string;
  linkUrl?: string;
  attachments?: Array<{ id: string; name: string; size: number; type: string; preview: string }>;
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  userName?: string;
  createdAt: Date;
}

export interface CommentLike {
  id: string;
  commentId: string;
  userId: string;
  userName?: string;
  createdAt: Date;
}

// Storage abstraction
export interface StorageAdapter {
  // Course operations
  getCourses: () => Promise<Course[]>;
  getCourse: (id: string) => Promise<Course | null>;
  saveCourse: (course: Course) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  getLessonTemplates: () => Promise<LessonTemplate[]>;
  saveLessonTemplate: (template: LessonTemplate) => Promise<LessonTemplate>;
  
  // Community post operations
  getPosts: (communityId?: string) => Promise<CommunityPost[]>;
  getPost: (id: string) => Promise<CommunityPost | null>;
  createPost: (post: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CommunityPost>;
  updatePost: (id: string, updates: Partial<CommunityPost>) => Promise<CommunityPost>;
  deletePost: (id: string) => Promise<void>;
  
  // Comment operations
  getComments: (postId: string) => Promise<PostComment[]>;
  createComment: (comment: Omit<PostComment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PostComment>;
  updateComment: (id: string, updates: Partial<PostComment>) => Promise<PostComment>;
  deleteComment: (id: string) => Promise<void>;
  
  // Like operations
  getPostLikes: (postId: string) => Promise<PostLike[]>;
  addPostLike: (like: Omit<PostLike, 'id' | 'createdAt'>) => Promise<PostLike>;
  removePostLike: (postId: string, userId: string) => Promise<void>;
  
  getCommentLikes: (commentId: string) => Promise<CommentLike[]>;
  addCommentLike: (like: Omit<CommentLike, 'id' | 'createdAt'>) => Promise<CommentLike>;
  removeCommentLike: (commentId: string, userId: string) => Promise<void>;
  
  // Utility
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