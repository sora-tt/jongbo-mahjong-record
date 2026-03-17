import type { Match, MatchResult } from "@/domain/models.js";

export interface MatchRepository {
  list(leagueId: string, seasonId: string, sessionId: string): Promise<Match[]>;
  listBySeason(leagueId: string, seasonId: string): Promise<Match[]>;
  listByLeague(leagueId: string): Promise<Match[]>;
  listAll(): Promise<Match[]>;
  get(leagueId: string, seasonId: string, sessionId: string, matchId: string): Promise<Match>;
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
  delete(leagueId: string, seasonId: string, sessionId: string, matchId: string): Promise<void>;
}
