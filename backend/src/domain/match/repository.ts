import type { Match, MatchResult } from "@/domain/match/types.js";
import type { Wind } from "@/domain/shared/types.js";

export type CreateMatchInput = {
  playedAt: string;
  results: Array<{
    userId: string;
    wind: Wind;
    rank: number;
    rawScore: number;
  }>;
};

export type UpdateMatchInput = {
  playedAt?: string;
  results?: Array<{
    userId: string;
    wind: Wind;
    rank: number;
    rawScore: number;
  }>;
};

export interface MatchRepository {
  list(leagueId: string, seasonId: string, sessionId: string): Promise<Match[]>;
  listBySeason(leagueId: string, seasonId: string): Promise<Match[]>;
  listByLeague(leagueId: string): Promise<Match[]>;
  listAll(): Promise<Match[]>;
  get(
    leagueId: string,
    seasonId: string,
    sessionId: string,
    matchId: string,
  ): Promise<Match>;
  create(params: {
    leagueId: string;
    seasonId: string;
    sessionId: string;
    playedAt: string;
    results: MatchResult[];
  }): Promise<Match>;
  update(params: {
    leagueId: string;
    seasonId: string;
    sessionId: string;
    matchId: string;
    playedAt?: string;
    results?: MatchResult[];
  }): Promise<Match>;
  delete(
    leagueId: string,
    seasonId: string,
    sessionId: string,
    matchId: string,
  ): Promise<void>;
}
