import type {
  Comment,
  Discussion,
  Vote,
  UserProgress,
  Leaderboard,
  Achievement,
  UserAchievement,
  StudyGroup,
  CommunityConfig
} from './types';

export class CommunityService {
  private config: CommunityConfig;
  private storagePrefix = 'course_framework_community';

  constructor(config: CommunityConfig) {
    this.config = config;
  }

  get storage() {
    return this.storagePrefix;
  }

  // Comments
  async getComments(targetId: string, targetType: 'course' | 'lesson'): Promise<Comment[]> {
    if (!this.config.enableComments) return [];
    
    try {
      const key = `${this.storagePrefix}_comments_${targetType}_${targetId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      return JSON.parse(stored).map((comment: any) => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
        updatedAt: new Date(comment.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load comments:', error);
      return [];
    }
  }

  async addComment(comment: Omit<Comment, 'id' | 'upvotes' | 'downvotes' | 'isEdited' | 'isPinned' | 'isReported' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    if (!this.config.enableComments) {
      throw new Error('Comments are disabled');
    }

    const newComment: Comment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      upvotes: 0,
      downvotes: 0,
      isEdited: false,
      isPinned: false,
      isReported: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const targetId = comment.courseId || comment.lessonId || '';
    const targetType = comment.courseId ? 'course' : 'lesson';
    const key = `${this.storagePrefix}_comments_${targetType}_${targetId}`;
    
    const existing = await this.getComments(targetId, targetType);
    existing.push(newComment);
    localStorage.setItem(key, JSON.stringify(existing));

    return newComment;
  }

  async updateComment(commentId: string, updates: Partial<Comment>): Promise<Comment> {
    // Implementation would update comment across all storage locations
    throw new Error('Method not implemented');
  }

  async deleteComment(commentId: string): Promise<void> {
    // Implementation would remove comment from storage
    throw new Error('Method not implemented');
  }

  // Discussions
  async getDiscussions(courseId?: string): Promise<Discussion[]> {
    if (!this.config.enableDiscussions) return [];
    
    try {
      const key = courseId 
        ? `${this.storagePrefix}_discussions_${courseId}`
        : `${this.storagePrefix}_discussions_global`;
      
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      return JSON.parse(stored).map((discussion: any) => ({
        ...discussion,
        lastActivityAt: new Date(discussion.lastActivityAt),
        createdAt: new Date(discussion.createdAt),
        updatedAt: new Date(discussion.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load discussions:', error);
      return [];
    }
  }

  async createDiscussion(discussion: Omit<Discussion, 'id' | 'upvotes' | 'downvotes' | 'viewCount' | 'commentCount' | 'isLocked' | 'isPinned' | 'isSolved' | 'lastActivityAt' | 'createdAt' | 'updatedAt'>): Promise<Discussion> {
    if (!this.config.enableDiscussions) {
      throw new Error('Discussions are disabled');
    }

    const newDiscussion: Discussion = {
      ...discussion,
      id: `discussion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      upvotes: 0,
      downvotes: 0,
      viewCount: 0,
      commentCount: 0,
      isLocked: false,
      isPinned: false,
      isSolved: false,
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const key = discussion.courseId 
      ? `${this.storagePrefix}_discussions_${discussion.courseId}`
      : `${this.storagePrefix}_discussions_global`;
    
    const existing = await this.getDiscussions(discussion.courseId);
    existing.push(newDiscussion);
    localStorage.setItem(key, JSON.stringify(existing));

    return newDiscussion;
  }

  // Voting
  async vote(targetId: string, targetType: 'comment' | 'discussion', voteType: 'up' | 'down', userId: string): Promise<void> {
    const voteKey = `${this.storagePrefix}_votes_${userId}`;
    const votes: Vote[] = JSON.parse(localStorage.getItem(voteKey) || '[]');
    
    // Remove existing vote for this target
    const filteredVotes = votes.filter(v => !(v.targetId === targetId && v.targetType === targetType));
    
    // Add new vote
    const newVote: Vote = {
      id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      targetId,
      targetType,
      voteType,
      createdAt: new Date()
    };
    
    filteredVotes.push(newVote);
    localStorage.setItem(voteKey, JSON.stringify(filteredVotes));

    // Update vote counts on the target (implementation would be more complex)
    console.log(`Vote recorded: ${voteType} for ${targetType} ${targetId}`);
  }

  // User Progress
  async getUserProgress(userId: string, courseId: string): Promise<UserProgress | null> {
    try {
      const key = `${this.storagePrefix}_progress_${userId}_${courseId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const progress = JSON.parse(stored);
      return {
        ...progress,
        startedAt: new Date(progress.startedAt),
        lastAccessAt: new Date(progress.lastAccessAt),
        completedAt: progress.completedAt ? new Date(progress.completedAt) : undefined
      };
    } catch (error) {
      console.error('Failed to load user progress:', error);
      return null;
    }
  }

  async updateUserProgress(progress: UserProgress): Promise<void> {
    const key = `${this.storagePrefix}_progress_${progress.userId}_${progress.courseId}`;
    localStorage.setItem(key, JSON.stringify(progress));
  }

  // Leaderboards
  async getLeaderboard(leaderboardId: string): Promise<Leaderboard | null> {
    if (!this.config.enableLeaderboards) return null;
    
    try {
      const key = `${this.storagePrefix}_leaderboard_${leaderboardId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const leaderboard = JSON.parse(stored);
      return {
        ...leaderboard,
        startDate: new Date(leaderboard.startDate),
        endDate: leaderboard.endDate ? new Date(leaderboard.endDate) : undefined,
        participants: leaderboard.participants.map((p: any) => ({
          ...p,
          lastUpdated: new Date(p.lastUpdated)
        }))
      };
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      return null;
    }
  }

  async getCourseLeaderboards(courseId: string): Promise<Leaderboard[]> {
    if (!this.config.enableLeaderboards) return [];
    
    // Implementation would query all leaderboards for a course
    return [];
  }

  // Achievements
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    if (!this.config.enableAchievements) return [];
    
    try {
      const key = `${this.storagePrefix}_achievements_${userId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      return JSON.parse(stored).map((achievement: any) => ({
        ...achievement,
        unlockedAt: new Date(achievement.unlockedAt)
      }));
    } catch (error) {
      console.error('Failed to load user achievements:', error);
      return [];
    }
  }

  async getAvailableAchievements(): Promise<Achievement[]> {
    if (!this.config.enableAchievements) return [];
    
    try {
      const key = `${this.storagePrefix}_available_achievements`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load available achievements:', error);
      return [];
    }
  }

  async checkAndUnlockAchievements(userId: string, courseId?: string): Promise<UserAchievement[]> {
    if (!this.config.enableAchievements) return [];
    
    // Implementation would check user's progress against achievement criteria
    // and unlock new achievements
    return [];
  }

  // Study Groups
  async getStudyGroups(courseId: string): Promise<StudyGroup[]> {
    if (!this.config.enableStudyGroups) return [];
    
    try {
      const key = `${this.storagePrefix}_study_groups_${courseId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      return JSON.parse(stored).map((group: any) => ({
        ...group,
        createdAt: new Date(group.createdAt),
        updatedAt: new Date(group.updatedAt),
        schedule: group.schedule?.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime)
        })) || []
      }));
    } catch (error) {
      console.error('Failed to load study groups:', error);
      return [];
    }
  }

  async createStudyGroup(group: Omit<StudyGroup, 'id' | 'memberIds' | 'createdAt' | 'updatedAt'>): Promise<StudyGroup> {
    if (!this.config.enableStudyGroups) {
      throw new Error('Study groups are disabled');
    }

    const newGroup: StudyGroup = {
      ...group,
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      memberIds: [group.creatorId],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const key = `${this.storagePrefix}_study_groups_${group.courseId}`;
    const existing = await this.getStudyGroups(group.courseId);
    existing.push(newGroup);
    localStorage.setItem(key, JSON.stringify(existing));

    return newGroup;
  }

  async joinStudyGroup(groupId: string, userId: string, inviteCode?: string): Promise<void> {
    // Implementation would add user to study group
    console.log(`User ${userId} joining study group ${groupId}`);
  }

  async leaveStudyGroup(groupId: string, userId: string): Promise<void> {
    // Implementation would remove user from study group
    console.log(`User ${userId} leaving study group ${groupId}`);
  }

  // Post interaction methods for modal
  async getPostWithComments(postId: string, userId?: string): Promise<any> {
    try {
      const key = `${this.storagePrefix}_post_${postId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const post = JSON.parse(stored);
      
      // Get comments for this post
      const commentsKey = `${this.storagePrefix}_post_comments_${postId}`;
      const commentsStored = localStorage.getItem(commentsKey);
      const comments = commentsStored ? JSON.parse(commentsStored) : [];

      // Build threaded comments structure
      const threadedComments = this.buildCommentTree(comments, userId);
      
      // Get likes for this post
      const likesKey = `${this.storagePrefix}_post_likes_${postId}`;
      const likes = JSON.parse(localStorage.getItem(likesKey) || '[]');

      return {
        ...post,
        // Preserve original counts if they exist and are higher than our tracked interactions
        likes: Math.max(post.likes || 0, likes.length),
        likedByUser: userId ? likes.some((like: any) => like.userId === userId) : false,
        commentCount: Math.max(post.commentCount || 0, comments.length),
        createdAt: new Date(post.createdAt),
        comments: threadedComments
      };
    } catch (error) {
      console.error('Failed to load post with comments:', error);
      return null;
    }
  }

  async togglePostLike(postId: string, userId: string): Promise<void> {
    try {
      const likesKey = `${this.storagePrefix}_post_likes_${postId}`;
      let likes = JSON.parse(localStorage.getItem(likesKey) || '[]');
      
      const existingLikeIndex = likes.findIndex((like: any) => like.userId === userId);
      
      if (existingLikeIndex > -1) {
        // Remove like
        likes.splice(existingLikeIndex, 1);
      } else {
        // Add like
        likes.push({
          id: `like_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          userId,
          postId,
          createdAt: new Date()
        });
      }
      
      localStorage.setItem(likesKey, JSON.stringify(likes));
      
      // Update post like count if post exists in our storage
      const postKey = `${this.storagePrefix}_post_${postId}`;
      const storedPost = localStorage.getItem(postKey);
      if (storedPost) {
        const post = JSON.parse(storedPost);
        post.likes = likes.length;
        post.likedByUser = likes.some((like: any) => like.userId === userId);
        localStorage.setItem(postKey, JSON.stringify(post));
      }
      
    } catch (error) {
      console.error('Failed to toggle post like:', error);
      throw error;
    }
  }

  async addPostComment(postId: string, content: string, authorId: string, authorName: string, parentId?: string, mediaData?: any): Promise<any> {
    try {
      const commentsKey = `${this.storagePrefix}_post_comments_${postId}`;
      const comments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
      
      // Calculate depth for threading
      let depth = 0;
      if (parentId) {
        const parentComment = comments.find((c: any) => c.id === parentId);
        if (parentComment) {
          depth = (parentComment.depth || 0) + 1;
        }
      }

      const newComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        postId,
        authorId,
        authorName,
        content,
        parentId,
        likes: 0,
        likedByUser: false,
        replies: [],
        depth,
        isEdited: false,
        isPinned: false,
        // Support all media types
        videoUrl: mediaData?.type === 'video' ? mediaData.url : mediaData?.videoUrl,
        linkUrl: mediaData?.linkUrl,
        pollData: mediaData?.type === 'poll' ? { 
          options: mediaData.options || [],
          votes: mediaData.options ? mediaData.options.map(() => 0) : []
        } : undefined,
        attachments: mediaData?.attachments || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      comments.push(newComment);
      localStorage.setItem(commentsKey, JSON.stringify(comments));

      // Update post comment count
      const postKey = `${this.storagePrefix}_post_${postId}`;
      const post = JSON.parse(localStorage.getItem(postKey) || '{}');
      post.commentCount = comments.length;
      localStorage.setItem(postKey, JSON.stringify(post));

      return newComment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<void> {
    try {
      const likesKey = `${this.storagePrefix}_comment_likes_${commentId}`;
      const likes = JSON.parse(localStorage.getItem(likesKey) || '[]');
      
      const existingLikeIndex = likes.findIndex((like: any) => like.userId === userId);
      
      if (existingLikeIndex > -1) {
        // Remove like
        likes.splice(existingLikeIndex, 1);
      } else {
        // Add like
        likes.push({
          id: `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          commentId,
          createdAt: new Date()
        });
      }
      
      localStorage.setItem(likesKey, JSON.stringify(likes));
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
      throw error;
    }
  }

  buildCommentTree(comments: any[], userId?: string): any[] {
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map and add replies array, populate like info
    comments.forEach(comment => {
      comment.replies = [];
      comment.createdAt = new Date(comment.createdAt);
      comment.updatedAt = new Date(comment.updatedAt);
      
      // Get like information for this comment
      const likesKey = `${this.storagePrefix}_comment_likes_${comment.id}`;
      const likes = JSON.parse(localStorage.getItem(likesKey) || '[]');
      comment.likes = likes.length;
      comment.likedByUser = userId ? likes.some((like: any) => like.userId === userId) : false;
      
      commentMap.set(comment.id, comment);
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    // Sort by creation date
    const sortComments = (commentList: any[]) => {
      commentList.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      commentList.forEach(comment => {
        if (comment.replies.length > 0) {
          sortComments(comment.replies);
        }
      });
    };

    sortComments(rootComments);
    return rootComments;
  }
}