import React from 'react';
import { Plugin, PluginFactory } from '@core/plugin-manager';
import { 
  User, 
  Community, 
  CommunityMembership, 
  PlatformSubscription,
  CommunityContext 
} from '../../types/multi-tenant';

// Multi-tenant user management plugin
export interface MultiTenantUserConfig {
  apiUrl: string;
  ssr?: boolean;
  storage?: 'localStorage' | 'sessionStorage' | 'memory';
}

export interface MultiTenantUserState {
  currentUser: User | null;
  communities: Record<string, Community>;
  memberships: Record<string, CommunityMembership[]>; // keyed by userId
  platformSubscriptions: Record<string, PlatformSubscription>;
  loading: boolean;
  error: string | null;
}

// User management hooks and utilities
export class MultiTenantUserService {
  private config: MultiTenantUserConfig;

  constructor(config: MultiTenantUserConfig) {
    this.config = config;
  }

  // User authentication and management
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/auth/me`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const response = await fetch(`${this.config.apiUrl}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    
    return await response.json();
  }

  // Platform subscription management
  async subscribeToPlatformPlan(planType: 'starter' | 'basic' | 'pro' | 'power'): Promise<PlatformSubscription> {
    const response = await fetch(`${this.config.apiUrl}/billing/platform-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planType })
    });
    
    if (!response.ok) {
      throw new Error('Failed to subscribe to platform plan');
    }
    
    return await response.json();
  }

  async cancelPlatformSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/billing/platform-subscription/${subscriptionId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to cancel platform subscription');
    }
  }

  // Community management
  async createCommunity(communityData: Partial<Community>): Promise<Community> {
    const response = await fetch(`${this.config.apiUrl}/communities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(communityData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create community');
    }
    
    return await response.json();
  }

  async joinCommunity(communityId: string): Promise<CommunityMembership> {
    const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/join`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to join community');
    }
    
    return await response.json();
  }

  async leaveCommunity(communityId: string): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/leave`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to leave community');
    }
  }

  async subscribeToCommunity(communityId: string): Promise<CommunityMembership> {
    const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/subscribe`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to subscribe to community');
    }
    
    return await response.json();
  }

  // Community context for other plugins
  async getCommunityContext(communityId: string, userId: string): Promise<CommunityContext> {
    const [community, membership] = await Promise.all([
      this.getCommunity(communityId),
      this.getMembership(userId, communityId)
    ]);
    
    const user = await this.getUser(userId);
    
    return {
      community,
      currentUser: user,
      membership,
      permissions: this.calculatePermissions(user, community, membership),
      isOwner: community?.ownerId === userId,
      isModerator: community?.moderators.includes(userId) || false,
      isMember: membership?.status === 'active'
    };
  }

  async getCommunity(communityId: string): Promise<Community | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/communities/${communityId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to get community:', error);
      return null;
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/users/${userId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  async getMembership(userId: string, communityId: string): Promise<CommunityMembership | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/users/${userId}/memberships/${communityId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to get membership:', error);
      return null;
    }
  }

  private calculatePermissions(user: User | null, community: Community | null, membership: CommunityMembership | null): string[] {
    if (!user || !community || !membership) return [];
    
    const permissions: string[] = [];
    
    // Owner permissions
    if (community.ownerId === user.id) {
      permissions.push(
        'community:manage',
        'community:delete',
        'members:manage',
        'content:moderate',
        'billing:manage',
        'settings:manage'
      );
    }
    
    // Moderator permissions
    if (community.moderators.includes(user.id)) {
      permissions.push(
        'content:moderate',
        'members:manage',
        'posts:pin',
        'posts:delete'
      );
    }
    
    // Member permissions
    if (membership.status === 'active') {
      permissions.push(
        'posts:create',
        'posts:like',
        'comments:create',
        'messages:send'
      );
      
      // Feature-specific permissions
      if (community.settings.features.courses) {
        permissions.push('courses:view', 'courses:enroll');
      }
      
      if (community.settings.features.events) {
        permissions.push('events:view', 'events:rsvp');
      }
      
      if (community.settings.features.merch) {
        permissions.push('merch:view', 'merch:purchase');
      }
    }
    
    return permissions;
  }
}

// Plugin factory function
export const createMultiTenantUserPlugin: PluginFactory<MultiTenantUserConfig> = (config) => {
  const userService = new MultiTenantUserService(config);
  
  return {
    name: 'multi-tenant-user-management',
    version: '1.0.0',
    dependencies: [],
    
    components: {
      // Placeholder components - will be implemented in Day 3-5
      UserProfile: () => React.createElement('div', null, 'User Profile Component'),
      CommunitySelector: () => React.createElement('div', null, 'Community Selector Component'),
      PlatformSubscription: () => React.createElement('div', null, 'Platform Subscription Component'),
      CommunityMembership: () => React.createElement('div', null, 'Community Membership Component')
    },
    
    hooks: {
      useCurrentUser: () => {
        // Mock implementation for Day 1-2
        return { 
          user: { 
            id: 'user-1', 
            email: 'demo@example.com',
            profile: { displayName: 'Demo User' },
            createdAt: new Date(),
            updatedAt: new Date(),
            ownedCommunities: ['community-1'],
            memberships: []
          } as User, 
          loading: false 
        };
      },
      
      useCommunityContext: (communityId: string) => {
        // Mock implementation for Day 1-2
        return { 
          context: {
            community: { 
              id: communityId, 
              name: 'Demo Community',
              slug: 'demo-community',
              description: 'A demo community',
              ownerId: 'user-1',
              moderators: [],
              access: 'free' as const,
              settings: {
                approval: 'instant' as const,
                visibility: 'public' as const,
                inviteOnly: false,
                features: {
                  courses: true,
                  events: true,
                  messaging: true,
                  leaderboard: true,
                  badges: true,
                  merch: true
                },
                gamification: {
                  pointsPerLike: 1,
                  pointsPerPost: 5,
                  pointsPerComment: 2,
                  enableLevels: true,
                  customBadges: []
                },
                notifications: {
                  emailNotifications: true,
                  pushNotifications: true,
                  weeklyDigest: true
                }
              },
              stats: {
                memberCount: 100,
                postCount: 500,
                courseCount: 10,
                eventCount: 25,
                monthlyRevenue: 1000,
                totalRevenue: 12000,
                growthRate: 0.1
              },
              createdAt: new Date(),
              updatedAt: new Date()
            } as Community,
            currentUser: null,
            membership: null,
            permissions: ['posts:create', 'posts:like'],
            isOwner: true,
            isModerator: false,
            isMember: true
          } as CommunityContext, 
          loading: false 
        };
      },
      
      useUserPermissions: (communityId?: string) => {
        return ['posts:create', 'posts:like', 'comments:create'];
      },
      
      // Subscription management hooks
      usePlatformSubscription: () => {
        return {
          subscription: null,
          subscribe: async (planType: 'starter' | 'basic' | 'pro' | 'power') => 
            console.log('Subscribe to:', planType),
          cancel: async (subscriptionId: string) => 
            console.log('Cancel subscription:', subscriptionId)
        };
      },
      
      // Community management hooks
      useCommunityManagement: () => {
        return {
          createCommunity: async (data: Partial<Community>) => {
            console.log('Create community:', data);
            return data as Community;
          },
          joinCommunity: async (communityId: string) => {
            console.log('Join community:', communityId);
            return {} as CommunityMembership;
          },
          leaveCommunity: async (communityId: string) => 
            console.log('Leave community:', communityId),
          subscribeToCommunity: async (communityId: string) => {
            console.log('Subscribe to community:', communityId);
            return {} as CommunityMembership;
          }
        };
      }
    },
    
    onInit: async (manager) => {
      // Set up global user context
      const user = await userService.getCurrentUser();
      if (user) {
        manager.setState('currentUser', user);
        manager.setState('userService', userService);
      }
    },
    
    onDestroy: async () => {
      // Cleanup if needed
    }
  };
};