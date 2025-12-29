import { User } from "./user";
import { AppDate } from "../utils/app-date";

export type Match = {
  id: string;
  leagueId: string;
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
