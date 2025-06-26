import type { Plugin, PluginConfig } from '../../types/core';
import { CommunityService } from './community-service';
import type { CommunityConfig } from './types';

export class CommunityPlugin implements Plugin {
  id = 'community';
  name = 'Community Features';
  version = '1.0.0';
  description = 'Community features including comments, discussions, leaderboards, and study groups';

  private communityService: CommunityService | null = null;

  async initialize(config: PluginConfig): Promise<void> {
    const communityConfig = config as CommunityConfig;
    
    // Default configuration
    const defaultConfig: CommunityConfig = {
      enableComments: true,
      enableDiscussions: true,
      enableLeaderboards: true,
      enableAchievements: true,
      enableStudyGroups: true,
      moderationSettings: {
        requireApproval: false,
        autoModeration: false,
        bannedWords: []
      }
    };

    // Merge with provided config
    const finalConfig = { ...defaultConfig, ...communityConfig };

    this.communityService = new CommunityService(finalConfig);
    
    // Make the service available globally for components
    (window as any).__courseFrameworkCommunityService = this.communityService;
    
    console.log(`✅ ${this.name} plugin initialized`);
    console.log('  - Comments:', finalConfig.enableComments ? '✅' : '❌');
    console.log('  - Discussions:', finalConfig.enableDiscussions ? '✅' : '❌');
    console.log('  - Leaderboards:', finalConfig.enableLeaderboards ? '✅' : '❌');
    console.log('  - Achievements:', finalConfig.enableAchievements ? '✅' : '❌');
    console.log('  - Study Groups:', finalConfig.enableStudyGroups ? '✅' : '❌');
  }

  async destroy(): Promise<void> {
    // Clean up global references
    delete (window as any).__courseFrameworkCommunityService;
    this.communityService = null;
    console.log(`🧹 ${this.name} plugin destroyed`);
  }

  getCommunityService(): CommunityService | null {
    return this.communityService;
  }
}

// Factory function for easier instantiation
export function createCommunityPlugin(config?: Partial<CommunityConfig>): CommunityPlugin {
  const plugin = new CommunityPlugin();
  return plugin;
}