// Relationships slice for performance optimization
import { createSlice } from '@reduxjs/toolkit';
const initialState = {
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
        addCommunityMember: (state, action) => {
            const { communityId, memberId } = action.payload;
            if (!state.communityMembers[communityId]) {
                state.communityMembers[communityId] = [];
            }
            if (!state.communityMembers[communityId].includes(memberId)) {
                state.communityMembers[communityId].push(memberId);
            }
        },
        removeCommunityMember: (state, action) => {
            const { communityId, memberId } = action.payload;
            if (state.communityMembers[communityId]) {
                state.communityMembers[communityId] = state.communityMembers[communityId].filter(id => id !== memberId);
            }
        },
        // Community courses
        addCommunityCourse: (state, action) => {
            const { communityId, courseId } = action.payload;
            if (!state.communityCourses[communityId]) {
                state.communityCourses[communityId] = [];
            }
            if (!state.communityCourses[communityId].includes(courseId)) {
                state.communityCourses[communityId].push(courseId);
            }
        },
        removeCommunityCourse: (state, action) => {
            const { communityId, courseId } = action.payload;
            if (state.communityCourses[communityId]) {
                state.communityCourses[communityId] = state.communityCourses[communityId].filter(id => id !== courseId);
            }
        },
        // Community events
        addCommunityEvent: (state, action) => {
            const { communityId, eventId } = action.payload;
            if (!state.communityEvents[communityId]) {
                state.communityEvents[communityId] = [];
            }
            if (!state.communityEvents[communityId].includes(eventId)) {
                state.communityEvents[communityId].push(eventId);
            }
        },
        removeCommunityEvent: (state, action) => {
            const { communityId, eventId } = action.payload;
            if (state.communityEvents[communityId]) {
                state.communityEvents[communityId] = state.communityEvents[communityId].filter(id => id !== eventId);
            }
        },
        // Community posts
        addCommunityPost: (state, action) => {
            const { communityId, postId } = action.payload;
            if (!state.communityPosts[communityId]) {
                state.communityPosts[communityId] = [];
            }
            if (!state.communityPosts[communityId].includes(postId)) {
                state.communityPosts[communityId].push(postId);
            }
        },
        removeCommunityPost: (state, action) => {
            const { communityId, postId } = action.payload;
            if (state.communityPosts[communityId]) {
                state.communityPosts[communityId] = state.communityPosts[communityId].filter(id => id !== postId);
            }
        },
        // Community products
        addCommunityProduct: (state, action) => {
            const { communityId, productId } = action.payload;
            if (!state.communityProducts[communityId]) {
                state.communityProducts[communityId] = [];
            }
            if (!state.communityProducts[communityId].includes(productId)) {
                state.communityProducts[communityId].push(productId);
            }
        },
        removeCommunityProduct: (state, action) => {
            const { communityId, productId } = action.payload;
            if (state.communityProducts[communityId]) {
                state.communityProducts[communityId] = state.communityProducts[communityId].filter(id => id !== productId);
            }
        },
        // User communities
        addUserCommunity: (state, action) => {
            const { userId, communityId } = action.payload;
            if (!state.userCommunities[userId]) {
                state.userCommunities[userId] = [];
            }
            if (!state.userCommunities[userId].includes(communityId)) {
                state.userCommunities[userId].push(communityId);
            }
        },
        removeUserCommunity: (state, action) => {
            const { userId, communityId } = action.payload;
            if (state.userCommunities[userId]) {
                state.userCommunities[userId] = state.userCommunities[userId].filter(id => id !== communityId);
            }
        },
        // Bulk operations
        setCommunityMembers: (state, action) => {
            const { communityId, memberIds } = action.payload;
            state.communityMembers[communityId] = memberIds;
        },
        setCommunityCourses: (state, action) => {
            const { communityId, courseIds } = action.payload;
            state.communityCourses[communityId] = courseIds;
        },
        setCommunityEvents: (state, action) => {
            const { communityId, eventIds } = action.payload;
            state.communityEvents[communityId] = eventIds;
        },
        setCommunityPosts: (state, action) => {
            const { communityId, postIds } = action.payload;
            state.communityPosts[communityId] = postIds;
        },
        setCommunityProducts: (state, action) => {
            const { communityId, productIds } = action.payload;
            state.communityProducts[communityId] = productIds;
        },
        setUserCommunities: (state, action) => {
            const { userId, communityIds } = action.payload;
            state.userCommunities[userId] = communityIds;
        },
    },
});
export const { addCommunityMember, removeCommunityMember, addCommunityCourse, removeCommunityCourse, addCommunityEvent, removeCommunityEvent, addCommunityPost, removeCommunityPost, addCommunityProduct, removeCommunityProduct, addUserCommunity, removeUserCommunity, setCommunityMembers, setCommunityCourses, setCommunityEvents, setCommunityPosts, setCommunityProducts, setUserCommunities, } = relationshipsSlice.actions;
export default relationshipsSlice;
// Selectors
export const selectCommunityMembers = (state, communityId) => state.relationships.communityMembers[communityId] || [];
export const selectCommunityCourses = (state, communityId) => state.relationships.communityCourses[communityId] || [];
export const selectCommunityEvents = (state, communityId) => state.relationships.communityEvents[communityId] || [];
export const selectCommunityPosts = (state, communityId) => state.relationships.communityPosts[communityId] || [];
export const selectCommunityProducts = (state, communityId) => state.relationships.communityProducts[communityId] || [];
export const selectUserCommunities = (state, userId) => state.relationships.userCommunities[userId] || [];
