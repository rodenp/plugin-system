// Users entity slice
import { createEntityAdapter, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { User } from '../types';
import type { RootState } from '../index';

// Entity adapter
export const usersAdapter = createEntityAdapter<User>();

// Async thunks
export const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (userId: string) => {
    // TODO: Replace with actual API call
    const mockUser: User = {
      id: userId,
      email: 'demo@example.com',
      profile: {
        displayName: 'John Doe',
        bio: 'Fitness enthusiast and community creator',
        avatar: null,
        timezone: 'America/New_York',
        location: 'New York, USA'
      },
      role: 'creator',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return mockUser;
  }
);

// Slice
const usersSlice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState(),
  reducers: {
    userAdded: usersAdapter.addOne,
    userUpdated: usersAdapter.updateOne,
    userRemoved: usersAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.fulfilled, usersAdapter.upsertOne);
  },
});

// Selectors
export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
} = usersAdapter.getSelectors((state: RootState) => state.entities.users);

// Actions
export const { userAdded, userUpdated, userRemoved } = usersSlice.actions;

export default usersSlice.reducer;