// Communities entity slice
import { createEntityAdapter, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Community } from '../types';
import type { RootState } from '../index';

// Entity adapter
export const communitiesAdapter = createEntityAdapter<Community>();

// Async thunks
export const fetchCommunity = createAsyncThunk(
  'communities/fetchCommunity',
  async (communityId: string) => {
    // TODO: Replace with actual API call
    const mockCommunity: Community = {
      id: communityId,
      name: '🏋️ Fitness Masters',
      slug: 'fitness-masters',
      description: 'Get fit together! Join our community for workouts, nutrition tips, and motivation.',
      ownerId: 'user-1',
      moderators: [],
      access: 'free',
      settings: {
        approval: 'instant',
        visibility: 'public',
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
        memberCount: 1250,
        postCount: 3420,
        courseCount: 12,
        eventCount: 8,
        revenue: 45000
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return mockCommunity;
  }
);

// Slice
const communitiesSlice = createSlice({
  name: 'communities',
  initialState: communitiesAdapter.getInitialState(),
  reducers: {
    communityAdded: communitiesAdapter.addOne,
    communityUpdated: communitiesAdapter.updateOne,
    communityRemoved: communitiesAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunity.fulfilled, communitiesAdapter.upsertOne);
  },
});

// Selectors
export const {
  selectAll: selectAllCommunities,
  selectById: selectCommunityById,
  selectIds: selectCommunityIds,
} = communitiesAdapter.getSelectors((state: RootState) => state.entities.communities);

// Actions
export const { communityAdded, communityUpdated, communityRemoved } = communitiesSlice.actions;

export default communitiesSlice.reducer;