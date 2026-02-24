import { LeagueIdType } from "./league";
import { User } from "./user";
import { AppDate } from "../utils/app-date";

export type MatchIdType = string;

export type Match = {
  matchId: MatchIdType;
  leagueId: LeagueIdType;
  playedAt: AppDate;
  createdAt: AppDate;
  results: MatchResult;
};

export type Wind = "EAST" | "SOUTH" | "WEST" | "NORTH";

export type IndividualMatchResult = {
  player: User;
  score: number;
  rank: number;
};

export type MatchResultInput = Record<Wind, IndividualMatchResult>;

export type MatchResult = {
  matchResultInput: MatchResultInput;
  createdAt: AppDate;
};
