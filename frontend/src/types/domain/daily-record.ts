import type { League } from "./league";
import type { Match } from "./match";
import type { AppDate } from "../utils/app-date";

export type DailyMatchRecord = Record<number, Match>;

export type DailyRecord = {
  id: string;
  leagueId: League["id"];
  date: AppDate;
  matches: DailyMatchRecord;
};
