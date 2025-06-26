// Users entity slice
import { createEntityAdapter, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Entity adapter
export const usersAdapter = createEntityAdapter();
// Async thunks
export const fetchUser = createAsyncThunk('users/fetchUser', async (userId) => {
    // TODO: Replace with actual API call
    const mockUser = {
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
});
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
export const { selectAll: selectAllUsers, selectById: selectUserById, selectIds: selectUserIds, } = usersAdapter.getSelectors((state) => state.entities.users);
// Actions
export const { userAdded, userUpdated, userRemoved } = usersSlice.actions;
export default usersSlice.reducer;
