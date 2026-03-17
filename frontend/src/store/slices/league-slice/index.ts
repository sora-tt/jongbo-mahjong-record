import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  League,
  LeagueIdType,
  LeagueMember,
  LeagueSeason,
  LeagueSeasonIdType,
} from "@/types/domain/league";
import { UserIdType } from "@/types/domain/user";

interface LeagueState {
  leagues: Record<LeagueIdType, League>;
  selectedLeagueId: LeagueIdType | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeagueState = {
  leagues: {},
  selectedLeagueId: null,
  loading: false,
  error: null,
};

const leagueSlice = createSlice({
  name: "league",
  initialState,
  reducers: {
    setLeagues: (state, action: PayloadAction<League[]>) => {
      state.leagues = action.payload.reduce(
        (acc, league) => {
          acc[league.leagueId] = league;
          return acc;
        },
        {} as Record<LeagueIdType, League>
      );
      state.loading = false;
      state.error = null;
    },
    addLeague: (state, action: PayloadAction<League>) => {
      state.leagues[action.payload.leagueId] = action.payload;
    },
    updateLeague: (state, action: PayloadAction<League>) => {
      const leagueId = action.payload.leagueId;
      if (state.leagues[leagueId]) {
        state.leagues[leagueId] = action.payload;
      }
    },
    deleteLeague: (state, action: PayloadAction<LeagueIdType>) => {
      delete state.leagues[action.payload];
      if (state.selectedLeagueId === action.payload) {
        state.selectedLeagueId = null;
      }
    },
    setSelectedLeagueId: (
      state,
      action: PayloadAction<LeagueIdType | null>
    ) => {
      state.selectedLeagueId = action.payload;
    },
    addLeagueMember: (
      state,
      action: PayloadAction<{
        leagueId: LeagueIdType;
        userId: UserIdType;
        member: LeagueMember;
      }>
    ) => {
      const { leagueId, userId, member } = action.payload;
      if (state.leagues[leagueId]?.members) {
        state.leagues[leagueId].members[userId] = member;
      }
    },
    updateLeagueMember: (
      state,
      action: PayloadAction<{
        leagueId: LeagueIdType;
        userId: UserIdType;
        member: LeagueMember;
      }>
    ) => {
      const { leagueId, userId, member } = action.payload;
      if (state.leagues[leagueId]?.members[userId]) {
        state.leagues[leagueId].members[userId] = member;
      }
    },
    removeLeagueMember: (
      state,
      action: PayloadAction<{
        leagueId: LeagueIdType;
        userId: UserIdType;
      }>
    ) => {
      const { leagueId, userId } = action.payload;
      if (state.leagues[leagueId]?.members?.[userId]) {
        delete state.leagues[leagueId].members[userId];
      }
    },
    addLeagueSeason: (
      state,
      action: PayloadAction<{
        leagueId: LeagueIdType;
        season: LeagueSeason;
      }>
    ) => {
      const { leagueId, season } = action.payload;
      if (state.leagues[leagueId]) {
        if (!state.leagues[leagueId].seasons) {
          state.leagues[leagueId].seasons = {};
        }
        state.leagues[leagueId].seasons[season.leagueSeasonId] = season;
      }
    },
    updateLeagueSeason: (
      state,
      action: PayloadAction<{
        leagueId: LeagueIdType;
        seasonId: LeagueSeasonIdType;
        season: LeagueSeason;
      }>
    ) => {
      const { leagueId, seasonId, season } = action.payload;
      if (state.leagues[leagueId]?.seasons?.[seasonId]) {
        state.leagues[leagueId].seasons[seasonId] = season;
      }
    },
    removeLeagueSeason: (
      state,
      action: PayloadAction<{
        leagueId: LeagueIdType;
        seasonId: LeagueSeasonIdType;
      }>
    ) => {
      const { leagueId, seasonId } = action.payload;
      if (state.leagues[leagueId]?.seasons?.[seasonId]) {
        delete state.leagues[leagueId].seasons[seasonId];
      }
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
  setLeagues,
  addLeague,
  updateLeague,
  deleteLeague,
  setSelectedLeagueId,
  addLeagueMember,
  updateLeagueMember,
  removeLeagueMember,
  addLeagueSeason,
  updateLeagueSeason,
  removeLeagueSeason,
  setLoading,
  setError,
} = leagueSlice.actions;

export default leagueSlice.reducer;
