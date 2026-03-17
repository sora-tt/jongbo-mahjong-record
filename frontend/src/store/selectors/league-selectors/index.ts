import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../../index";

import { LeagueIdType } from "@/types/domain/league";

// Basic selectors
export const selectLeagues = (state: RootState) => state.league.leagues;
export const selectSelectedLeagueId = (state: RootState) =>
  state.league.selectedLeagueId;
export const selectLeagueLoading = (state: RootState) => state.league.loading;
export const selectLeagueError = (state: RootState) => state.league.error;

// Memoized selectors
export const selectAllLeagues = createSelector([selectLeagues], (leagues) =>
  Object.values(leagues)
);

export const selectLeagueById = createSelector(
  [selectLeagues, (_state: RootState, leagueId: LeagueIdType) => leagueId],
  (leagues, leagueId) => leagues[leagueId]
);

export const selectSelectedLeague = createSelector(
  [selectLeagues, selectSelectedLeagueId],
  (leagues, selectedLeagueId) => {
    if (!selectedLeagueId) return null;
    return leagues[selectedLeagueId] || null;
  }
);

export const selectLeagueMembers = createSelector(
  [selectLeagues, (_state: RootState, leagueId: LeagueIdType) => leagueId],
  (leagues, leagueId) => {
    const league = leagues[leagueId];
    return league ? Object.values(league.members) : [];
  }
);

export const selectLeagueSeasons = createSelector(
  [
    selectLeagues,
    (_state: RootState, leagueId: LeagueIdType | null) => leagueId,
  ],
  (leagues, leagueId) => {
    if (!leagueId) return [];
    const league = leagues[leagueId];
    return league?.seasons ? Object.values(league.seasons) : [];
  }
);

export const selectLeaguesCount = createSelector(
  [selectAllLeagues],
  (leagues) => leagues.length
);

export const selectLeagueRecord = createSelector(
  [selectSelectedLeague],
  (league) => league?.leagueRecord ?? {}
);
