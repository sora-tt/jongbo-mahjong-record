import { leagueData1 } from "./league";
import { userData1, userData2, userData3, userData4 } from "./user";

import type { Match, MatchResultInput } from "@/types/domain/match";

export const matchResultInputData1: MatchResultInput = {
  EAST: { player: userData1, score: -80, rank: 4 },
  SOUTH: { player: userData3, score: 80, rank: 1 },
  WEST: { player: userData2, score: 0, rank: 2 },
  NORTH: { player: userData4, score: 0, rank: 3 },
};

export const matchData1: Match = {
  id: "match-000001",
  leagueId: leagueData1.id,
  playedAt: leagueData1.lastRecordedAt,
  createdAt: leagueData1.lastRecordedAt,
  results: {
    matchResultInput: matchResultInputData1,
    createdAt: leagueData1.lastRecordedAt,
  },
};

export const matchResultInputData2: MatchResultInput = {
  EAST: { player: userData1, score: 10, rank: 2 },
  SOUTH: { player: userData3, score: 30, rank: 1 },
  WEST: { player: userData2, score: -20, rank: 4 },
  NORTH: { player: userData4, score: -20, rank: 3 },
};

export const matchData2: Match = {
  id: "match-000002",
  leagueId: leagueData1.id,
  playedAt: leagueData1.lastRecordedAt,
  createdAt: leagueData1.lastRecordedAt,
  results: {
    matchResultInput: matchResultInputData2,
    createdAt: leagueData1.lastRecordedAt,
  },
};

export const matchResultInputData3: MatchResultInput = {
  EAST: { player: userData1, score: 40, rank: 1 },
  SOUTH: { player: userData3, score: -10, rank: 3 },
  WEST: { player: userData2, score: -10, rank: 2 },
  NORTH: { player: userData4, score: -20, rank: 4 },
};

export const matchData3: Match = {
  id: "match-000003",
  leagueId: leagueData1.id,
  playedAt: leagueData1.lastRecordedAt,
  createdAt: leagueData1.lastRecordedAt,
  results: {
    matchResultInput: matchResultInputData3,
    createdAt: leagueData1.lastRecordedAt,
  },
};

export const matchesData: Match[] = [matchData1, matchData2, matchData3];
