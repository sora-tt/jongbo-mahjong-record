import type { Wind } from "@/domain/shared/types.js";

export type MatchResult = {
  userId: string;
  userName: string;
  wind: Wind;
  rank: number;
  rawScore: number;
  point: number;
};

export type Match = {
  id: string;
  leagueId: string;
  seasonId: string;
  sessionId: string;
  matchIndex: number;
  playedAt: string;
  results: MatchResult[];
  createdAt: string;
  updatedAt: string;
};
