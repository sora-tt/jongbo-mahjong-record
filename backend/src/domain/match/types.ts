import type { Wind } from "@/domain/shared/types.js";
import type {
  IsoDateString,
  LeagueId,
  MatchId,
  SeasonId,
  SessionId,
  UserId,
} from "@/domain/shared/types.js";
import type { YakumanKind } from "@/domain/match/yakuman.js";

export type MatchResult = {
  userId: UserId;
  userName: string;
  wind: Wind;
  rank: number;
  rawScore: number;
  point: number;
};

export type ChomboEvent = {
  offenderUserId: UserId;
};

export type YakumanEvent = {
  winnerUserId: UserId;
  kind: YakumanKind;
};

export type YakumanEventInput = {
  winnerUserId: string;
  kind: YakumanKind;
};

export type Match = {
  id: MatchId;
  leagueId: LeagueId;
  seasonId: SeasonId;
  sessionId: SessionId;
  matchIndex: number;
  playedAt: IsoDateString;
  results: MatchResult[];
  chomboEvents: ChomboEvent[];
  yakumanEvents: YakumanEvent[];
  offTableKyotakuCount: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};
