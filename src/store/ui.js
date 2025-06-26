// UI state slice
import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    currentUserId: null,
    selectedCommunityId: null,
    loading: {
        communities: false,
        posts: false,
        events: false,
        members: false,
        products: false,
    },
    errors: {
        communities: null,
        posts: null,
        events: null,
        members: null,
        products: null,
    },
};
const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setCurrentUser: (state, action) => {
            state.currentUserId = action.payload;
        },
        setSelectedCommunity: (state, action) => {
            state.selectedCommunityId = action.payload;
        },
        setLoading: (state, action) => {
            state.loading[action.payload.key] = action.payload.loading;
        },
        setError: (state, action) => {
            state.errors[action.payload.key] = action.payload.error;
        },
        clearErrors: (state) => {
            Object.keys(state.errors).forEach(key => {
                state.errors[key] = null;
            });
        },
    },
});
export const { setCurrentUser, setSelectedCommunity, setLoading, setError, clearErrors, } = uiSlice.actions;
export default uiSlice;
// Selectors
export const selectCurrentUserId = (state) => state.ui.currentUserId;
export const selectSelectedCommunityId = (state) => state.ui.selectedCommunityId;
export const selectLoading = (state) => state.ui.loading;
export const selectErrors = (state) => state.ui.errors;
