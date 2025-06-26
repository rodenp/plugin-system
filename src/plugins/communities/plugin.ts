import React from 'react';
import { Plugin, PluginFactory } from '@core/plugin-manager';
import { Community, Post, CommunityMember, Event } from '../../types/multi-tenant';

export interface CommunityPluginConfig {
  apiUrl: string;
  ssr?: boolean;
}

export class CommunityService {
  private config: CommunityPluginConfig;

  constructor(config: CommunityPluginConfig) {
    this.config = config;
  }

  // Community CRUD operations
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

  async updateCommunity(communityId: string, updates: Partial<Community>): Promise<Community> {
    const response = await fetch(`${this.config.apiUrl}/communities/${communityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update community');
    }
    
    return await response.json();
  }

  async deleteCommunity(communityId: string): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/communities/${communityId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete community');
    }
  }

  // Member management
  async getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    try {
      const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/members`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Failed to get community members:', error);
      return [];
    }
  }

  async addMemberToCommunity(communityId: string, userId: string, role: 'member' | 'moderator' = 'member'): Promise<CommunityMember> {
    const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
    
    if (!response.ok) {
      throw new Error('Failed to add member to community');
    }
    
    return await response.json();
  }

  async removeMemberFromCommunity(communityId: string, userId: string): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/members/${userId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove member from community');
    }
  }

  async updateMemberRole(communityId: string, userId: string, role: 'member' | 'moderator'): Promise<CommunityMember> {
    const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/members/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update member role');
    }
    
    return await response.json();
  }

  // Posts and content
  async getCommunityPosts(communityId: string, category?: string, limit = 20, offset = 0): Promise<Post[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (category) {
      params.append('category', category);
    }
    
    try {
      const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/posts?${params}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Failed to get community posts:', error);
      return [];
    }
  }

  async createPost(communityId: string, postData: Partial<Post>): Promise<Post> {
    const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create post');
    }
    
    return await response.json();
  }

  async likePost(postId: string): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/posts/${postId}/like`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to like post');
    }
  }

  async pinPost(postId: string): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/posts/${postId}/pin`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to pin post');
    }
  }

  // Community settings and access control
  async checkMemberAccess(communityId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/access/${userId}`);
      return response.ok;
    } catch (error) {
      console.error('Failed to check member access:', error);
      return false;
    }
  }

  async inviteMember(communityId: string, email: string): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
      throw new Error('Failed to invite member');
    }
  }

  // Community events (basic integration)
  async getCommunityEvents(communityId: string): Promise<Event[]> {
    try {
      const response = await fetch(`${this.config.apiUrl}/communities/${communityId}/events`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Failed to get community events:', error);
      return [];
    }
  }
}

export function useCommunity(communityId: string) {
  const [community, setCommunity] = React.useState<Community | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (communityId) {
      setLoading(true);
      // Get service from plugin manager state
      const service = (window as any).__pluginManager?.getState('communityService') as CommunityService;
      if (service) {
        service.getCommunity(communityId)
          .then(community => {
            setCommunity(community);
            setLoading(false);
          })
          .catch(err => {
            setError(err.message);
            setLoading(false);
          });
      }
    }
  }, [communityId]);

  return { community, loading, error };
}

export function useCommunityMembers(communityId: string) {
  const [members, setMembers] = React.useState<CommunityMember[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (communityId) {
      const service = (window as any).__pluginManager?.getState('communityService') as CommunityService;
      if (service) {
        service.getCommunityMembers(communityId)
          .then(members => {
            setMembers(members);
            setLoading(false);
          });
      }
    }
  }, [communityId]);

  return { members, loading };
}

export function useCommunityPosts(communityId: string, category?: string) {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (communityId) {
      const service = (window as any).__pluginManager?.getState('communityService') as CommunityService;
      if (service) {
        service.getCommunityPosts(communityId, category)
          .then(posts => {
            setPosts(posts);
            setLoading(false);
          });
      }
    }
  }, [communityId, category]);

  const createPost = (postData: Partial<Post>) => {
    const service = (window as any).__pluginManager?.getState('communityService') as CommunityService;
    if (service) {
      return service.createPost(communityId, postData).then(newPost => {
        setPosts(prev => [newPost, ...prev]);
        return newPost;
      });
    }
    return Promise.reject('Service not available');
  };

  const likePost = (postId: string) => {
    const service = (window as any).__pluginManager?.getState('communityService') as CommunityService;
    if (service) {
      return service.likePost(postId).then(() => {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, engagement: { ...post.engagement, likes: post.engagement.likes + 1 } }
            : post
        ));
      });
    }
    return Promise.reject('Service not available');
  };

  return { posts, loading, createPost, likePost };
}

// Plugin factory
export const createCommunityPlugin: PluginFactory<CommunityPluginConfig> = (config) => {
  const communityService = new CommunityService(config);

  return {
    name: 'communities',
    version: '1.0.0',
    dependencies: ['multi-tenant-user-management'],
    
    components: {
      // Placeholder components - will be implemented in Day 3-5
      CommunityCard: () => React.createElement('div', null, 'Community Card Component'),
      CommunitySettings: () => React.createElement('div', null, 'Community Settings Component'),
      CreateCommunityForm: () => React.createElement('div', null, 'Create Community Form Component'),
      MemberList: () => React.createElement('div', null, 'Member List Component'),
      InviteMember: () => React.createElement('div', null, 'Invite Member Component')
    },
    
    hooks: {
      useCommunity,
      useCommunityMembers,
      useCommunityPosts,
      
      useCommunityManagement: () => {
        return {
          createCommunity: (data: Partial<Community>) => communityService.createCommunity(data),
          updateCommunity: (id: string, updates: Partial<Community>) => 
            communityService.updateCommunity(id, updates),
          deleteCommunity: (id: string) => communityService.deleteCommunity(id),
          addMember: (communityId: string, userId: string, role?: 'member' | 'moderator') =>
            communityService.addMemberToCommunity(communityId, userId, role),
          removeMember: (communityId: string, userId: string) =>
            communityService.removeMemberFromCommunity(communityId, userId),
          inviteMember: (communityId: string, email: string) =>
            communityService.inviteMember(communityId, email),
          checkAccess: (communityId: string, userId: string) =>
            communityService.checkMemberAccess(communityId, userId)
        };
      }
    },
    
    onInit: async (manager) => {
      // Make service available to other plugins
      manager.setState('communityService', communityService);
      
      // Set up event listeners for cross-plugin communication
      manager.on('user:joined-community', ({ userId, communityId }) => {
        // Refresh community data when user joins
        console.log(`User ${userId} joined community ${communityId}`);
      });
      
      manager.on('post:created', ({ post }) => {
        // Handle post creation events
        console.log('New post created:', post);
      });
    },
    
    onDestroy: async () => {
      // Cleanup if needed
    }
  };
};