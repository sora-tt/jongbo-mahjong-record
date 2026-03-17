import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Match, MatchIdType } from "@/types/domain/match";

interface MatchState {
  matches: Record<MatchIdType, Match>;
  selectedMatchId: MatchIdType | null;
  loading: boolean;
  error: string | null;
}

const initialState: MatchState = {
  matches: {},
  selectedMatchId: null,
  loading: false,
  error: null,
};

const matchSlice = createSlice({
  name: "match",
  initialState,
  reducers: {
    setMatches: (state, action: PayloadAction<Match[]>) => {
      state.matches = action.payload.reduce(
        (acc, match) => {
          acc[match.matchId] = match;
          return acc;
        },
        {} as Record<MatchIdType, Match>
      );
      state.loading = false;
      state.error = null;
    },
    addMatch: (state, action: PayloadAction<Match>) => {
      state.matches[action.payload.matchId] = action.payload;
    },
    updateMatch: (state, action: PayloadAction<Match>) => {
      const matchId = action.payload.matchId;
      if (state.matches[matchId]) {
        state.matches[matchId] = action.payload;
      }
    },
    deleteMatch: (state, action: PayloadAction<MatchIdType>) => {
      delete state.matches[action.payload];
      if (state.selectedMatchId === action.payload) {
        state.selectedMatchId = null;
      }
    },
    setSelectedMatchId: (state, action: PayloadAction<MatchIdType | null>) => {
      state.selectedMatchId = action.payload;
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
  setMatches,
  addMatch,
  updateMatch,
  deleteMatch,
  setSelectedMatchId,
  setLoading,
  setError,
} = matchSlice.actions;

export default matchSlice.reducer;
