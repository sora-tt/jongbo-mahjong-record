import { leagueData1 } from "./league";
import { matchesData } from "./match";
import { userData1, userData2, userData3, userData4 } from "./user";

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
  players: [userData1, userData3, userData2, userData4],
  totalPoints: [-30, 100, -30, -40],
};

export const mockDailyRecord = dailyRecordData1;
