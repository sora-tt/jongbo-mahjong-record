import type { Wind } from "@/domain/shared/types.js";
import type {
  IsoDateString,
  LeagueId,
  MatchId,
  SeasonId,
  SessionId,
  UserId,
} from "@/domain/shared/types.js";

export type MatchResult = {
  userId: UserId;
  userName: string;
  wind: Wind;
  rank: number;
  rawScore: number;
  point: number;
};

export type Match = {
  id: MatchId;
  leagueId: LeagueId;
  seasonId: SeasonId;
  sessionId: SessionId;
  matchIndex: number;
  playedAt: IsoDateString;
  results: MatchResult[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};
