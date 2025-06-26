// Multi-tenant user and community types

export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
  
  // Platform subscription (for creators)
  platformPlan?: PlatformSubscription;
  
  // Owned communities
  ownedCommunities: string[];
  
  // Community memberships (each paid separately)
  memberships: CommunityMembership[];
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
}

export interface PlatformSubscription {
  type: 'starter' | 'basic' | 'pro' | 'power';
  status: 'active' | 'cancelled' | 'past_due';
  price: 29 | 79 | 199 | 499;
  transactionFee: number; // 0.05 for starter, 0 for others
  communityLimit: number; // -1 for unlimited
  stripeSubscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export interface CommunityMembership {
  communityId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'pending';
  role: 'owner' | 'moderator' | 'member';
  price?: number; // Monthly price if paid community
  stripeSubscriptionId?: string; // Stripe subscription ID if paid
  joinedAt: Date;
  lastActive?: Date;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage?: string;
  
  // Ownership
  ownerId: string;
  moderators: string[];
  
  // Access & Pricing
  access: 'free' | 'paid';
  pricing?: CommunityPricing;
  
  // Settings
  settings: CommunitySettings;
  
  // Stats
  stats: CommunityStats;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityPricing {
  monthly: number;
  currency: string;
  stripePriceId: string;
  trialDays?: number;
}

export interface CommunitySettings {
  approval: 'instant' | 'manual';
  visibility: 'public' | 'private';
  inviteOnly: boolean;
  
  features: {
    courses: boolean;
    events: boolean;
    messaging: boolean;
    leaderboard: boolean;
    badges: boolean;
    merch: boolean;
  };
  
  gamification: {
    pointsPerLike: number; // Default 1
    pointsPerPost: number; // Default 5
    pointsPerComment: number; // Default 2
    enableLevels: boolean;
    customBadges: Badge[];
  };
  
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
  };
}

export interface CommunityStats {
  memberCount: number;
  postCount: number;
  courseCount: number;
  eventCount: number;
  monthlyRevenue: number;
  totalRevenue: number;
  growthRate: number;
}

export interface Post {
  id: string;
  communityId: string;
  authorId: string;
  
  content: {
    text: string;
    images?: string[];
    links?: LinkPreview[];
    mentions?: string[]; // user IDs
    hashtags?: string[];
  };
  
  type: 'text' | 'announcement' | 'course' | 'event' | 'product';
  category?: 'general' | 'updates' | 'gems' | 'fun' | 'discussion';
  
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  
  // Moderation
  isPinned: boolean;
  isHidden: boolean;
  isDeleted: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  pinnedAt?: Date;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
}

export interface Comment {
  id: string;
  postId: string;
  communityId: string;
  authorId: string;
  parentId?: string; // For nested comments
  
  content: {
    text: string;
    mentions?: string[];
  };
  
  engagement: {
    likes: number;
    replies: number;
  };
  
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityMember {
  userId: string;
  communityId: string;
  
  // Role and permissions
  role: 'owner' | 'moderator' | 'member';
  permissions: string[];
  
  // Gamification stats
  points: number;
  level: number;
  rank: number; // Position in leaderboard
  
  // Activity metrics
  postsCount: number;
  commentsCount: number;
  likesReceived: number;
  likesGiven: number;
  
  // Engagement
  lastActive: Date;
  joinedAt: Date;
  
  // Achievements
  badges: Badge[];
  milestones: Milestone[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: Date;
  criteria: {
    type: 'posts' | 'likes' | 'comments' | 'streak' | 'custom';
    threshold: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  };
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  achievedAt: Date;
  points: number;
  badgeId?: string;
}

export interface Event {
  id: string;
  communityId: string;
  creatorId: string;
  
  title: string;
  description: string;
  
  // Timing
  startDate: Date;
  endDate: Date;
  timezone: string;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: string; // RRULE format
  
  // Location
  location?: {
    type: 'virtual' | 'physical';
    address?: string;
    url?: string;
    instructions?: string;
  };
  
  // Settings
  maxAttendees?: number;
  requiresApproval: boolean;
  isPublic: boolean;
  
  // Engagement
  attendees: string[]; // user IDs
  interestedUsers: string[]; // user IDs
  
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Plugin-specific types
export interface CommunityContext {
  community: Community | null;
  currentUser: User | null;
  membership: CommunityMembership | null;
  permissions: string[];
  isOwner: boolean;
  isModerator: boolean;
  isMember: boolean;
}

export interface PluginState {
  communities: Record<string, Community>;
  currentCommunity: string | null;
  users: Record<string, User>;
  currentUser: string | null;
  posts: Record<string, Post>;
  members: Record<string, CommunityMember>;
}