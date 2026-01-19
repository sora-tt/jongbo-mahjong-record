import { leagueData1 } from "./league";
import { matchesData } from "./match";

import type { DailyRecord } from "@/types/domain/daily-record";

export const dailyRecordData1: DailyRecord = {
  dailyRecordId: "daily-record-000001",
  leagueId: leagueData1.id,
  date: leagueData1.lastRecordedAt,
  matches: {
    1: matchesData[0],
    2: matchesData[1],
    3: matchesData[2],
  },
};

export const mockDailyRecord = dailyRecordData1;
