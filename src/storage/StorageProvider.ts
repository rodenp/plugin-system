// Storage Provider Interface - defines the contract for all storage backends
export interface Author {
  id: string;
  userId: string;
  name: string;
  bio?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  likes: number;
  comments: number;
  isPinned: boolean;
  communityId: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  commentersCount: number;
  newCommentTimeAgo?: string;
  author?: Author; // Optional - populated when needed
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author?: Author; // Optional - populated when needed
}

export interface Course {
  id: string;
  title: string;
  description: string;
  authorId: string;
  communityId: string;
  createdAt: Date;
  updatedAt: Date;
  lastSaved: Date;
  modules?: Module[];
  author?: Author; // Optional - populated when needed
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  type: 'text' | 'video' | 'quiz' | 'assignment';
  moduleId: string;
  order: number;
  duration?: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  bio?: string;
  avatar?: string;
  level: number;
  pointsToNext: number;
  joinDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'paid';
  memberCount: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityMember {
  communityId: string;
  userId: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
}

export interface StorageProvider {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // Posts
  getPosts(communityId: string): Promise<Post[]>;
  getPost(postId: string): Promise<Post | null>;
  createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post>;
  updatePost(postId: string, updates: Partial<Post>): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  
  // Likes
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  getPostLikes(postId: string): Promise<string[]>; // Array of user IDs
  
  // Comments
  getComments(postId: string): Promise<Comment[]>;
  createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment>;
  updateComment(commentId: string, updates: Partial<Comment>): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;
  
  // Courses
  getCourses(communityId: string): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course | null>;
  createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'lastSaved'>): Promise<Course>;
  updateCourse(courseId: string, updates: Partial<Course>): Promise<Course>;
  deleteCourse(courseId: string): Promise<void>;
  
  // Modules
  getModules(courseId: string): Promise<Module[]>;
  getModule(moduleId: string): Promise<Module | null>;
  createModule(module: Omit<Module, 'id' | 'createdAt' | 'updatedAt'>): Promise<Module>;
  updateModule(moduleId: string, updates: Partial<Module>): Promise<Module>;
  deleteModule(moduleId: string): Promise<void>;
  
  // Lessons
  getLessons(moduleId: string): Promise<Lesson[]>;
  getLesson(lessonId: string): Promise<Lesson | null>;
  createLesson(lesson: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lesson>;
  updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<Lesson>;
  deleteLesson(lessonId: string): Promise<void>;
  
  // Users
  getUser(userId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  
  // Communities
  getCommunity(communityId: string): Promise<Community | null>;
  getUserCommunities(userId: string): Promise<Community[]>;
  createCommunity(community: Omit<Community, 'id' | 'createdAt' | 'updatedAt'>): Promise<Community>;
  updateCommunity(communityId: string, updates: Partial<Community>): Promise<Community>;
  
  // Community Membership
  getCommunityMembers(communityId: string): Promise<CommunityMember[]>;
  getUserMemberships(userId: string): Promise<CommunityMember[]>;
  addCommunityMember(communityId: string, userId: string, role?: 'member' | 'moderator' | 'admin'): Promise<CommunityMember>;
  updateMemberRole(communityId: string, userId: string, role: 'member' | 'moderator' | 'admin'): Promise<CommunityMember>;
  removeCommunityMember(communityId: string, userId: string): Promise<void>;
  
  // Authors
  getAuthor(authorId: string): Promise<Author | null>;
  getAuthorByUserId(userId: string): Promise<Author | null>;
  createAuthor(author: Omit<Author, 'id' | 'createdAt' | 'updatedAt'>): Promise<Author>;
  updateAuthor(authorId: string, updates: Partial<Author>): Promise<Author>;
  
  // Real-time subscriptions (optional - can be implemented later)
  subscribe?(entity: string, callback: (data: any) => void): () => void;
}