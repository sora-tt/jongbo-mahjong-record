import { leagueData1 } from "./league";
import { matchesData } from "./match";
import { userData1, userData2, userData3, userData4 } from "./user";

import type { DailyRecord } from "@/types/domain/daily-record";

export const dailyRecordData1: DailyRecord = {
  dailyRecordId: "daily-record-000001",
  leagueId: leagueData1.leagueId,
  date: leagueData1.lastRecordedAt,
  matches: matchesData,
  players: [userData1, userData3, userData2, userData4],
  totalPoints: {
    [userData1.userId]: -30,
    [userData3.userId]: 100,
    [userData2.userId]: -30,
    [userData4.userId]: -40,
  },
};

export const mockDailyRecord = dailyRecordData1;
