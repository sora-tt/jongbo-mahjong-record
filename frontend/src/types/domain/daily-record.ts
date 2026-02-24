import type { League } from "./league";
import type { Match } from "./match";
import type { User } from "./user";
import type { AppDate } from "../utils/app-date";

export type DailyMatchRecord = Record<string, Match>;

export type DailyRecordIdType = string;

export type TotalPointsState = number[];

export type DailyRecord = {
  dailyRecordId: DailyRecordIdType;
  leagueId: League["id"];
  date: AppDate;
  matches: DailyMatchRecord;
  players: User[];
  totalPoints: TotalPointsState;
};
