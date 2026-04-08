import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { User, UserIdType } from "@/types/domain/user";

interface UserState {
  users: Record<UserIdType, User>;
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: {},
  currentUser: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload.reduce(
        (acc, user) => {
          acc[user.userId] = user;
          return acc;
        },
        {} as Record<UserIdType, User>
      );
      state.loading = false;
      state.error = null;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users[action.payload.userId] = action.payload;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const userId = action.payload.userId;
      if (state.users[userId]) {
        state.users[userId] = action.payload;
      }
      // 現在のユーザーが更新された場合、currentUserも更新
      if (state.currentUser?.userId === userId) {
        state.currentUser = action.payload;
      }
    },
    deleteUser: (state, action: PayloadAction<UserIdType>) => {
      delete state.users[action.payload];
      // 削除されたユーザーが現在のユーザーの場合、currentUserをnullに設定
      if (state.currentUser?.userId === action.payload) {
        state.currentUser = null;
      }
    },
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setUsers,
  addUser,
  updateUser,
  deleteUser,
  setCurrentUser,
  setLoading,
  setError,
} = userSlice.actions;

export default userSlice.reducer;
