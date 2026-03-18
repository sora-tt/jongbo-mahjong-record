import type { League } from "./league";
import type { Match, MatchIdType } from "./match";
import type { User, UserIdType } from "./user";
import type { AppDate } from "../utils/app-date";

export type DailyMatchRecord = Record<MatchIdType, Match>;

export type DailyRecordIdType = string;

export type TotalPointsState = Record<UserIdType, number>;

export type DailyRecord = {
  dailyRecordId: DailyRecordIdType;
  leagueId: League["leagueId"];
  date: AppDate;
  matches: DailyMatchRecord;
  players: User[];
  totalPoints: TotalPointsState;
};
