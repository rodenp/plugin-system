import type { StorageAdapter, Course, LessonTemplate, CommunityPost, PostComment, PostLike, CommentLike } from '../../types/core';

export abstract class BaseStorageAdapter implements StorageAdapter {
  // Course operations
  abstract getCourses(): Promise<Course[]>;
  abstract getCourse(id: string): Promise<Course | null>;
  abstract saveCourse(course: Course): Promise<Course>;
  abstract deleteCourse(id: string): Promise<void>;
  abstract getLessonTemplates(): Promise<LessonTemplate[]>;
  abstract saveLessonTemplate(template: LessonTemplate): Promise<LessonTemplate>;
  
  // Community post operations
  abstract getPosts(communityId?: string): Promise<CommunityPost[]>;
  abstract getPost(id: string): Promise<CommunityPost | null>;
  abstract createPost(post: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommunityPost>;
  abstract updatePost(id: string, updates: Partial<CommunityPost>): Promise<CommunityPost>;
  abstract deletePost(id: string): Promise<void>;
  
  // Comment operations
  abstract getComments(postId: string): Promise<PostComment[]>;
  abstract createComment(comment: Omit<PostComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<PostComment>;
  abstract updateComment(id: string, updates: Partial<PostComment>): Promise<PostComment>;
  abstract deleteComment(id: string): Promise<void>;
  
  // Like operations
  abstract getPostLikes(postId: string): Promise<PostLike[]>;
  abstract addPostLike(like: Omit<PostLike, 'id' | 'createdAt'>): Promise<PostLike>;
  abstract removePostLike(postId: string, userId: string): Promise<void>;
  
  abstract getCommentLikes(commentId: string): Promise<CommentLike[]>;
  abstract addCommentLike(like: Omit<CommentLike, 'id' | 'createdAt'>): Promise<CommentLike>;
  abstract removeCommentLike(commentId: string, userId: string): Promise<void>;

  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected validateCourse(course: Course): void {
    if (!course.id) throw new Error('Course must have an id');
    if (!course.title) throw new Error('Course must have a title');
    if (!Array.isArray(course.modules)) throw new Error('Course must have modules array');
  }

  protected validateLessonTemplate(template: LessonTemplate): void {
    if (!template.id) throw new Error('Lesson template must have an id');
    if (!template.title) throw new Error('Lesson template must have a title');
    if (!Array.isArray(template.content)) throw new Error('Lesson template must have content array');
  }

  protected validatePost(post: CommunityPost): void {
    if (!post.id) throw new Error('Post must have an id');
    if (!post.content) throw new Error('Post must have content');
    if (!post.author) throw new Error('Post must have an author');
    if (!post.authorId) throw new Error('Post must have an authorId');
    if (!post.category) throw new Error('Post must have a category');
  }

  protected validateComment(comment: PostComment): void {
    if (!comment.id) throw new Error('Comment must have an id');
    if (!comment.postId) throw new Error('Comment must have a postId');
    if (!comment.authorId) throw new Error('Comment must have an authorId');
    if (!comment.authorName) throw new Error('Comment must have an authorName');
    if (!comment.content) throw new Error('Comment must have content');
  }

  protected validatePostLike(like: PostLike): void {
    if (!like.id) throw new Error('Post like must have an id');
    if (!like.postId) throw new Error('Post like must have a postId');
    if (!like.userId) throw new Error('Post like must have a userId');
  }

  protected validateCommentLike(like: CommentLike): void {
    if (!like.id) throw new Error('Comment like must have an id');
    if (!like.commentId) throw new Error('Comment like must have a commentId');
    if (!like.userId) throw new Error('Comment like must have a userId');
  }
}