// UI state slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
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
}

const initialState: UIState = {
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
    setCurrentUser: (state, action: PayloadAction<string | null>) => {
      state.currentUserId = action.payload;
    },
    setSelectedCommunity: (state, action: PayloadAction<string | null>) => {
      state.selectedCommunityId = action.payload;
    },
    setLoading: (state, action: PayloadAction<{ key: keyof UIState['loading']; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    setError: (state, action: PayloadAction<{ key: keyof UIState['errors']; error: string | null }>) => {
      state.errors[action.payload.key] = action.payload.error;
    },
    clearErrors: (state) => {
      Object.keys(state.errors).forEach(key => {
        state.errors[key as keyof UIState['errors']] = null;
      });
    },
  },
});

export const {
  setCurrentUser,
  setSelectedCommunity,
  setLoading,
  setError,
  clearErrors,
} = uiSlice.actions;

export default uiSlice;

// Selectors
export const selectCurrentUserId = (state: { ui: UIState }) => state.ui.currentUserId;
export const selectSelectedCommunityId = (state: { ui: UIState }) => state.ui.selectedCommunityId;
export const selectLoading = (state: { ui: UIState }) => state.ui.loading;
export const selectErrors = (state: { ui: UIState }) => state.ui.errors;