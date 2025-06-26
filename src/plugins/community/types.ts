// Community plugin types
export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorLevel?: number;
  content: string;
  parentId?: string; // For nested comments/replies
  likes: number;
  likedByUser: boolean;
  replies: PostComment[];
  depth: number; // Nesting level (0 = top-level comment)
  isEdited: boolean;
  isPinned: boolean;
  videoUrl?: string; // Video URL for embedded videos
  linkUrl?: string; // Link URL for embedded links
  createdAt: Date;
  updatedAt: Date;
}

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
  likedByUser: boolean;
  commentCount: number;
  isPinned: boolean;
  createdAt: Date;
  imageUrl?: string;
  videoUrl?: string; // Video URL for embedded videos
  linkUrl?: string; // Link URL for embedded links
  // Additional fields for modal display
  comments: PostComment[];
  commenters?: Array<{ avatarUrl?: string; initials: string; name: string }>;
  newCommentTimeAgo?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  parentId?: string; // For nested comments
  courseId?: string;
  lessonId?: string;
  upvotes: number;
  downvotes: number;
  isEdited: boolean;
  isPinned: boolean;
  isReported: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  courseId?: string;
  category: 'general' | 'help' | 'announcement' | 'feature-request';
  tags: string[];
  upvotes: number;
  downvotes: number;
  viewCount: number;
  commentCount: number;
  isLocked: boolean;
  isPinned: boolean;
  isSolved: boolean;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  userId: string;
  targetId: string; // Comment or Discussion ID
  targetType: 'comment' | 'discussion';
  voteType: 'up' | 'down';
  createdAt: Date;
}

export interface UserProgress {
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentLesson?: string;
  progressPercentage: number;
  startedAt: Date;
  lastAccessAt: Date;
  completedAt?: Date;
}

export interface Leaderboard {
  id: string;
  name: string;
  description: string;
  courseId?: string;
  metrics: LeaderboardMetric[];
  participants: LeaderboardParticipant[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface LeaderboardMetric {
  id: string;
  name: string;
  description: string;
  type: 'completion_rate' | 'total_points' | 'streak_days' | 'custom';
  weight: number; // For weighted scoring
}

export interface LeaderboardParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  rank: number;
  metrics: Record<string, number>;
  lastUpdated: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'course_completion' | 'streak' | 'participation' | 'custom';
  criteria: AchievementCriteria;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export interface AchievementCriteria {
  type: string;
  target: number;
  courseId?: string;
  [key: string]: any;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress?: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  courseId: string;
  creatorId: string;
  memberIds: string[];
  maxMembers: number;
  isPrivate: boolean;
  inviteCode?: string;
  schedule?: StudySchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudySchedule {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'study_session' | 'discussion' | 'review';
  isRecurring: boolean;
  recurrenceRule?: string; // RFC 2445 RRULE format
}

export interface CommunityConfig {
  enableComments: boolean;
  enableDiscussions: boolean;
  enableLeaderboards: boolean;
  enableAchievements: boolean;
  enableStudyGroups: boolean;
  moderationSettings: {
    requireApproval: boolean;
    autoModeration: boolean;
    bannedWords: string[];
  };
  [key: string]: any;
}

export interface PostComposerProps {
  currentUser: any;
  onCreatePost: () => void;
}

export interface FilterButtonsProps {
  filterCategory: string;
  onFilterCategoryChange: (category: string) => void;
}

export interface PostCardProps {
  post: any;
  selectedPost: string | null;
  onSelectPost: (postId: string | null) => void;
}

export interface SidebarProps {
  currentUser: any;
  community: any;
  userRole: string;
}

export interface UIComponents {
  PostComposer: React.ComponentType<PostComposerProps>;
  FilterButtons: React.ComponentType<FilterButtonsProps>;
  PostCard: React.ComponentType<PostCardProps>;
  Sidebar: React.ComponentType<SidebarProps>;
}

export interface FeedComponentProps {
  currentUser: any;
  community: any;
  userRole: string;
  posts: any[];
  selectedPost: string | null;
  filterCategory: string;
  onSelectPost: (postId: string | null) => void;
  onFilterCategoryChange: (category: string) => void;
  onCreatePost: () => void;
  uiComponents: UIComponents;
}

// Modal-specific interfaces
export interface PostDetailModalProps {
  isOpen: boolean;
  post: CommunityPost | null;
  currentUser: any;
  onClose: () => void;
  onLikePost: (postId: string) => Promise<void>;
  onUnlikePost: (postId: string) => Promise<void>;
  onAddComment: (postId: string, content: string, parentId?: string, mediaData?: any) => Promise<void>;
  onLikeComment: (commentId: string) => Promise<void>;
  onUnlikeComment: (commentId: string) => Promise<void>;
}

export interface CommentItemProps {
  comment: PostComment;
  currentUser: any;
  onLike: (commentId: string) => Promise<void>;
  onUnlike: (commentId: string) => Promise<void>;
  onReply: (content: string, parentId: string, mediaData?: any) => Promise<void>;
  maxDepth?: number;
}

export interface ReplyFormProps {
  parentId?: string;
  postId: string;
  currentUser: any;
  onSubmit: (content: string, parentId?: string, mediaData?: any) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
}

export interface InteractionButtonsProps {
  likes: number;
  commentCount: number;
  likedByUser: boolean;
  onLike: () => void;
  onComment: () => void;
}