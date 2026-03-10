import { configureStore } from "@reduxjs/toolkit";

import leagueReducer from "./slices/league-slice";
import matchReducer from "./slices/match-slice";
import ruleReducer from "./slices/rule-slice";
import userReducer from "./slices/user-slice";

export const store = configureStore({
  reducer: {
    league: leagueReducer,
    user: userReducer,
    match: matchReducer,
    rule: ruleReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "league/setLeagues",
          "league/addLeague",
          "league/updateLeague",
          "league/addLeagueMember",
          "league/updateLeagueMember",
          "league/addLeagueSeason",
          "league/updateLeagueSeason",
          "user/setUsers",
          "user/addUser",
          "user/updateUser",
          "user/setCurrentUser",
          "match/setMatches",
          "match/addMatch",
          "match/updateMatch",
        ],
        ignoredPaths: [
          "league.leagues",
          "league.selectedLeague",
          "user.users",
          "user.currentUser",
          "match.matches",
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
