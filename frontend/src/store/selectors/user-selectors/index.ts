import { createSelector } from "@reduxjs/toolkit";

import { UserIdType } from "@/types/domain/user";

import { RootState } from "../../index";

// Basic selectors
export const selectUsers = (state: RootState) => state.user.users;
export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;

// Memoized selectors
export const selectAllUsers = createSelector([selectUsers], (users) =>
  Object.values(users)
);

export const selectUserById = createSelector(
  [selectUsers, (_state: RootState, userId: UserIdType) => userId],
  (users, userId) => users[userId]
);

export const selectUsersCount = createSelector(
  [selectAllUsers],
  (users) => users.length
);
