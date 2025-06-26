// Relationships slice for performance optimization
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RelationshipsState {
  communityMembers: Record<string, string[]>; // communityId -> memberIds[]
  communityCourses: Record<string, string[]>; // communityId -> courseIds[]
  communityEvents: Record<string, string[]>;  // communityId -> eventIds[]
  communityPosts: Record<string, string[]>;   // communityId -> postIds[]
  communityProducts: Record<string, string[]>; // communityId -> productIds[]
  userCommunities: Record<string, string[]>;  // userId -> communityIds[]
}

const initialState: RelationshipsState = {
  communityMembers: {},
  communityCourses: {},
  communityEvents: {},
  communityPosts: {},
  communityProducts: {},
  userCommunities: {},
};

const relationshipsSlice = createSlice({
  name: 'relationships',
  initialState,
  reducers: {
    // Community members
    addCommunityMember: (state, action: PayloadAction<{ communityId: string; memberId: string }>) => {
      const { communityId, memberId } = action.payload;
      if (!state.communityMembers[communityId]) {
        state.communityMembers[communityId] = [];
      }
      if (!state.communityMembers[communityId].includes(memberId)) {
        state.communityMembers[communityId].push(memberId);
      }
    },
    removeCommunityMember: (state, action: PayloadAction<{ communityId: string; memberId: string }>) => {
      const { communityId, memberId } = action.payload;
      if (state.communityMembers[communityId]) {
        state.communityMembers[communityId] = state.communityMembers[communityId].filter(id => id !== memberId);
      }
    },
    
    // Community courses
    addCommunityCourse: (state, action: PayloadAction<{ communityId: string; courseId: string }>) => {
      const { communityId, courseId } = action.payload;
      if (!state.communityCourses[communityId]) {
        state.communityCourses[communityId] = [];
      }
      if (!state.communityCourses[communityId].includes(courseId)) {
        state.communityCourses[communityId].push(courseId);
      }
    },
    removeCommunityCourse: (state, action: PayloadAction<{ communityId: string; courseId: string }>) => {
      const { communityId, courseId } = action.payload;
      if (state.communityCourses[communityId]) {
        state.communityCourses[communityId] = state.communityCourses[communityId].filter(id => id !== courseId);
      }
    },
    
    // Community events
    addCommunityEvent: (state, action: PayloadAction<{ communityId: string; eventId: string }>) => {
      const { communityId, eventId } = action.payload;
      if (!state.communityEvents[communityId]) {
        state.communityEvents[communityId] = [];
      }
      if (!state.communityEvents[communityId].includes(eventId)) {
        state.communityEvents[communityId].push(eventId);
      }
    },
    removeCommunityEvent: (state, action: PayloadAction<{ communityId: string; eventId: string }>) => {
      const { communityId, eventId } = action.payload;
      if (state.communityEvents[communityId]) {
        state.communityEvents[communityId] = state.communityEvents[communityId].filter(id => id !== eventId);
      }
    },
    
    // Community posts
    addCommunityPost: (state, action: PayloadAction<{ communityId: string; postId: string }>) => {
      const { communityId, postId } = action.payload;
      if (!state.communityPosts[communityId]) {
        state.communityPosts[communityId] = [];
      }
      if (!state.communityPosts[communityId].includes(postId)) {
        state.communityPosts[communityId].push(postId);
      }
    },
    removeCommunityPost: (state, action: PayloadAction<{ communityId: string; postId: string }>) => {
      const { communityId, postId } = action.payload;
      if (state.communityPosts[communityId]) {
        state.communityPosts[communityId] = state.communityPosts[communityId].filter(id => id !== postId);
      }
    },
    
    // Community products
    addCommunityProduct: (state, action: PayloadAction<{ communityId: string; productId: string }>) => {
      const { communityId, productId } = action.payload;
      if (!state.communityProducts[communityId]) {
        state.communityProducts[communityId] = [];
      }
      if (!state.communityProducts[communityId].includes(productId)) {
        state.communityProducts[communityId].push(productId);
      }
    },
    removeCommunityProduct: (state, action: PayloadAction<{ communityId: string; productId: string }>) => {
      const { communityId, productId } = action.payload;
      if (state.communityProducts[communityId]) {
        state.communityProducts[communityId] = state.communityProducts[communityId].filter(id => id !== productId);
      }
    },
    
    // User communities
    addUserCommunity: (state, action: PayloadAction<{ userId: string; communityId: string }>) => {
      const { userId, communityId } = action.payload;
      if (!state.userCommunities[userId]) {
        state.userCommunities[userId] = [];
      }
      if (!state.userCommunities[userId].includes(communityId)) {
        state.userCommunities[userId].push(communityId);
      }
    },
    removeUserCommunity: (state, action: PayloadAction<{ userId: string; communityId: string }>) => {
      const { userId, communityId } = action.payload;
      if (state.userCommunities[userId]) {
        state.userCommunities[userId] = state.userCommunities[userId].filter(id => id !== communityId);
      }
    },
    
    // Bulk operations
    setCommunityMembers: (state, action: PayloadAction<{ communityId: string; memberIds: string[] }>) => {
      const { communityId, memberIds } = action.payload;
      state.communityMembers[communityId] = memberIds;
    },
    setCommunityCourses: (state, action: PayloadAction<{ communityId: string; courseIds: string[] }>) => {
      const { communityId, courseIds } = action.payload;
      state.communityCourses[communityId] = courseIds;
    },
    setCommunityEvents: (state, action: PayloadAction<{ communityId: string; eventIds: string[] }>) => {
      const { communityId, eventIds } = action.payload;
      state.communityEvents[communityId] = eventIds;
    },
    setCommunityPosts: (state, action: PayloadAction<{ communityId: string; postIds: string[] }>) => {
      const { communityId, postIds } = action.payload;
      state.communityPosts[communityId] = postIds;
    },
    setCommunityProducts: (state, action: PayloadAction<{ communityId: string; productIds: string[] }>) => {
      const { communityId, productIds } = action.payload;
      state.communityProducts[communityId] = productIds;
    },
    setUserCommunities: (state, action: PayloadAction<{ userId: string; communityIds: string[] }>) => {
      const { userId, communityIds } = action.payload;
      state.userCommunities[userId] = communityIds;
    },
  },
});

export const {
  addCommunityMember,
  removeCommunityMember,
  addCommunityCourse,
  removeCommunityCourse,
  addCommunityEvent,
  removeCommunityEvent,
  addCommunityPost,
  removeCommunityPost,
  addCommunityProduct,
  removeCommunityProduct,
  addUserCommunity,
  removeUserCommunity,
  setCommunityMembers,
  setCommunityCourses,
  setCommunityEvents,
  setCommunityPosts,
  setCommunityProducts,
  setUserCommunities,
} = relationshipsSlice.actions;

export default relationshipsSlice;

// Selectors
export const selectCommunityMembers = (state: { relationships: RelationshipsState }, communityId: string) =>
  state.relationships.communityMembers[communityId] || [];

export const selectCommunityCourses = (state: { relationships: RelationshipsState }, communityId: string) =>
  state.relationships.communityCourses[communityId] || [];

export const selectCommunityEvents = (state: { relationships: RelationshipsState }, communityId: string) =>
  state.relationships.communityEvents[communityId] || [];

export const selectCommunityPosts = (state: { relationships: RelationshipsState }, communityId: string) =>
  state.relationships.communityPosts[communityId] || [];

export const selectCommunityProducts = (state: { relationships: RelationshipsState }, communityId: string) =>
  state.relationships.communityProducts[communityId] || [];

export const selectUserCommunities = (state: { relationships: RelationshipsState }, userId: string) =>
  state.relationships.userCommunities[userId] || [];