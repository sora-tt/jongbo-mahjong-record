import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../../index";

import { LeagueIdType } from "@/types/domain/league";
import { MatchIdType } from "@/types/domain/match";

// Basic selectors
export const selectMatches = (state: RootState) => state.match.matches;
export const selectSelectedMatchId = (state: RootState) =>
  state.match.selectedMatchId;
export const selectMatchLoading = (state: RootState) => state.match.loading;
export const selectMatchError = (state: RootState) => state.match.error;

// Memoized selectors
export const selectAllMatches = createSelector([selectMatches], (matches) =>
  Object.values(matches)
);

export const selectMatchById = createSelector(
  [selectMatches, (_state: RootState, matchId: MatchIdType) => matchId],
  (matches, matchId) => matches[matchId]
);

export const selectSelectedMatch = createSelector(
  [selectMatches, selectSelectedMatchId],
  (matches, selectedMatchId) => {
    if (!selectedMatchId) return null;
    return matches[selectedMatchId] || null;
  }
);

export const selectMatchesByLeagueId = createSelector(
  [selectAllMatches, (_state: RootState, leagueId: LeagueIdType) => leagueId],
  (matches, leagueId) => matches.filter((match) => match.leagueId === leagueId)
);

export const selectMatchesCount = createSelector(
  [selectAllMatches],
  (matches) => matches.length
);
