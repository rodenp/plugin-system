// Redux store type definitions
import { EntityState } from '@reduxjs/toolkit';

// Core entity types
export interface User {
  id: string;
  email: string;
  profile: {
    displayName: string;
    bio?: string;
    avatar?: string;
    timezone: string;
    location?: string;
  };
  role: 'creator' | 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  moderators: string[];
  access: 'free' | 'paid' | 'private';
  settings: {
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
      pointsPerLike: number;
      pointsPerPost: number;
      pointsPerComment: number;
      enableLevels: boolean;
      customBadges: any[];
    };
    notifications: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      weeklyDigest: boolean;
    };
  };
  stats: {
    memberCount: number;
    postCount: number;
    courseCount: number;
    eventCount: number;
    revenue: number;
  };
  createdAt: Date;
  updatedAt: Date;
  theme?: any;
  testProperty?: string;
  debugTheme?: string;
}

export interface Post {
  id: string;
  authorId: string;
  communityId: string;
  title: string;
  content: string;
  category: 'update' | 'gem' | 'fun' | 'discussion';
  likes: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  communityId: string;
  organizerId: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  isVirtual: boolean;
  maxAttendees?: number;
  attendeeIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  id: string;
  userId: string;
  communityId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  points: number;
  level: number;
  badges: string[];
}

export interface Product {
  id: string;
  communityId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  category: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Normalized store structure
export interface AppState {
  // Normalized entities
  entities: {
    users: EntityState<User>;
    communities: EntityState<Community>;
    courses: EntityState<any>; // Will use Course type from course-builder
    posts: EntityState<Post>;
    events: EntityState<Event>;
    members: EntityState<Member>;
    products: EntityState<Product>;
  };
  
  // UI state
  ui: {
    currentUserId: string | null;
    selectedCommunityId: string | null;
    loading: {
      communities: boolean;
      posts: boolean;
      events: boolean;
      members: boolean;
      products: boolean;
    };
    errors: {
      communities: string | null;
      posts: string | null;
      events: string | null;
      members: string | null;
      products: string | null;
    };
  };
  
  // Relationships for performance
  relationships: {
    communityMembers: Record<string, string[]>; // communityId -> memberIds[]
    communityCourses: Record<string, string[]>; // communityId -> courseIds[]
    communityEvents: Record<string, string[]>;  // communityId -> eventIds[]
    communityPosts: Record<string, string[]>;   // communityId -> postIds[]
    communityProducts: Record<string, string[]>; // communityId -> productIds[]
    userCommunities: Record<string, string[]>;  // userId -> communityIds[]
  };
}

// User role in a specific community
export type CommunityRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface SkoolPlugin {
  id: string;
  name: string;
  component: React.ComponentType<SkoolPluginProps>;
  reduxSlice: Slice;
  dependencies?: string[]; // Other plugin IDs this depends on
  icon?: string; // Icon for the tab
  order?: number; // Display order
  onInstall?: () => void; // Callback when plugin is installed
}

// Plugin props interface
export interface SkoolPluginProps {
  currentUser: User;
  communityId: string;
  community: Community;
  userRole: CommunityRole;
  theme?: any;
}